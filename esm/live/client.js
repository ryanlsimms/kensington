// kensington/live client transport. Manages one WebSocket per tab, multiplexed
// across all liveSignal subscriptions. Reconnects with exponential backoff.
// Buffers outbound writes while disconnected; replays on (re)connect.

import { signal } from '../lib/reactive/signal.js';
import { DEFAULT_LIVE_PATH } from './constants.js';
import { _registerTransport } from './state.js';

// Re-export `liveSignal` so shared component files can import it from this
// client-only subpath without pulling the server runtime into a client bundle.
export { liveSignal } from './state.js';
import {
  decode,
  encode,
  MSG_BATCH_UPDATE,
  MSG_ERROR,
  MSG_SET,
  MSG_SET_FAIL,
  MSG_SET_OK,
  MSG_SNAPSHOT,
  MSG_SUBSCRIBE,
  MSG_UNSUBSCRIBE,
  MSG_UPDATE,
} from './protocol.js';
import { warnIfInitialMismatch, warnIfPersistMismatch } from './warn.js';

// Compare-and-swap retry cap for `.set(fn)`. After this many conflicts in a
// row the library gives up to avoid pathological loops in high-contention
// scenarios. The local Signal is left in whatever optimistic state the last
// attempt produced; the next broadcast from the server will overwrite it
// with the authoritative value. Sized for realistic contention. N concurrent
// writers on the same name need worst-case N-1 retries since each server
// round resolves one writer, so this comfortably handles a few dozen tabs
// each firing a small burst.
const MAX_CAS_RETRIES = 32;

// MSG_SUBSCRIBE carries the client's persist intent only when it has a
// positive one. A bare client.liveSignal() defaults to false, but "false" on
// the wire is indistinguishable from a positive declaration; the server would
// then mismatch-warn against a previously-declared `true` from server-side
// liveSignal. Omitting the field encodes "no declaration", which the server
// treats as a non-authoritative follow rather than a declaration.
function buildSubscribeMsg(name, persist) {
  if (persist === true) {
    return { type: MSG_SUBSCRIBE, name, persist: true };
  }
  return { type: MSG_SUBSCRIBE, name };
}

class ClientTransport {
  constructor(options = {}) {
    const {
      url = DEFAULT_LIVE_PATH,
      reconnect = { initialDelay: 250, maxDelay: 30000 },
      onStatus,
      onError,
      onFrame,
    } = options;
    this.url = url;
    this.reconnectOpts = reconnect;
    this.onStatus = onStatus ?? (() => {});
    this.onError = onError ?? (() => {});
    this.onFrame = onFrame ?? null;
    this.signals = new Map(); // name → Signal
    this.initialValues = new Map(); // name → first-call initial, for duplicate-name detection
    this.persistFlags = new Map(); // name → boolean. First-declaration-wins; sent on every SUBSCRIBE.
    this.lastSeen = new Map(); // name → lamport of last applied update
    this.outbound = []; // queued while disconnected
    // Pending CAS attempts. opId → { name, fn, attempts, resolve, reject }.
    // The set(fn) retry loop suspends here until MSG_SET_OK or MSG_SET_FAIL
    // arrives. One CAS attempt per opId; new attempts get new opIds.
    this.pendingCas = new Map();
    this.nextOpId = 1;
    // Names we've already warned about for unserializable values. Lazy
    // initialization here so the field shape is stable across the instance's
    // lifetime; checkSerializable just adds entries.
    this.unserializableWarned = new Set();
    this.ws = null;
    // Reactive status. Read with `transport.status.get()` inside a computed/effect
    // to render a connection pill reactively, or use the `onStatus` callback for
    // imperative wiring. Both fire on every transition.
    this.status = signal('connecting');
    this.reconnectTimer = null;
    // reconnectDelay grows by 2× per failed attempt; reconnectAttempts is
    // compared against reconnectOpts.maxRetries (default Infinity). Both are
    // reset by resetReconnectState() at construction, on 'open', and on
    // manual reconnect().
    this.resetReconnectState();
    this.closed = false;
    // disconnect() flips this to true; reconnect() clears it. While set, the
    // close-event auto-reconnect path bails out so the transport stays in
    // `'disconnected'` indefinitely until the caller invokes reconnect().
    this.manuallyDisconnected = false;
    // pauseSend() flips this to true; outgoing writes accumulate in `outbound`
    // alongside the existing while-disconnected buffer. resumeSend() flushes.
    this.sendPaused = false;
  }

  // Send a single message on an open WebSocket and notify onFrame. Used by
  // the open handler's resubscribe + outbound flush, by resumeSend's flush,
  // and (indirectly) by send(). Callers must guarantee the socket is open.
  rawSendOnSocket(ws, msg) {
    ws.send(encode(msg));
    this.notifyFrame('out', msg);
  }

  // Invoke the user's onFrame callback, swallowing any throws so user code
  // can't break the transport. No-op when onFrame wasn't configured.
  notifyFrame(direction, frame) {
    if (this.onFrame === null) { return; }
    try { this.onFrame(direction, frame); } catch { /* user callback */ }
  }

  connect() {
    if (this.closed) { return; }
    this.setStatus('connecting');
    let ws;
    try { ws = new WebSocket(this.url); }
    catch (err) { this.onError(err); this.scheduleReconnect(); return; }
    this.ws = ws;

    ws.addEventListener('open', () => {
      this.setStatus('connected');
      this.resetReconnectState();
      // Re-subscribe to every name we have a signal for. The server will reply
      // with a snapshot containing the current value, which we apply via
      // `_setFromRemote` (no re-broadcast). Re-send the persist flag too so
      // the server can re-record policy after a restart.
      for (const name of this.signals.keys()) {
        this.rawSendOnSocket(ws, buildSubscribeMsg(name, this.persistFlags.get(name) === true));
      }
      // Flush any writes queued while disconnected.
      while (this.outbound.length > 0) {
        this.rawSendOnSocket(ws, this.outbound.shift());
      }
    });

    ws.addEventListener('message', e => this.handleMessage(e.data));
    ws.addEventListener('close', () => { this.ws = null; this.scheduleReconnect(); });
    ws.addEventListener('error', err => { this.onError(err); });
  }

  scheduleReconnect() {
    if (this.closed) { return; }
    if (this.manuallyDisconnected) { return; }
    const maxRetries = this.reconnectOpts.maxRetries ?? Infinity;
    if (this.reconnectAttempts >= maxRetries) {
      // Exhausted. Stay disconnected until the caller explicitly resets via
      // transport.reconnect() (which clears the counter and starts again).
      this.setStatus('disconnected');
      return;
    }
    this.setStatus('reconnecting');
    if (this.reconnectTimer !== null) { return; }
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.reconnectOpts.maxDelay);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts += 1;
      this.connect();
    }, delay);
  }

  setStatus(next) {
    if (this.status.value === next) { return; }
    this.status.set(next);
    try { this.onStatus(next); } catch { /* user callback */ }
  }

  // Reset backoff state. Called from the constructor (initial values), the
  // open-handler (we successfully reconnected, so future failures start fast
  // again), and reconnect() (the caller wants the next attempt to be fast).
  resetReconnectState() {
    this.reconnectDelay = this.reconnectOpts.initialDelay;
    this.reconnectAttempts = 0;
  }

  // Look up and remove a pending CAS entry. Returns undefined if no entry
  // exists for the opId (already handled, or a stray reply). Centralises the
  // get + delete pattern that appears at every MSG_SET_OK / MSG_SET_FAIL path.
  takePendingCas(opId) {
    const pending = this.pendingCas.get(opId);
    if (pending !== undefined) { this.pendingCas.delete(opId); }
    return pending;
  }

  // Apply a single remote update. Drops stale broadcasts (those whose lamport
  // is not strictly greater than the last we applied for this name). Used by
  // both MSG_UPDATE (one name) and MSG_BATCH_UPDATE (many names).
  applyRemoteUpdate(name, value, lamport) {
    const seen = this.lastSeen.get(name) ?? -1;
    if (lamport <= seen) { return; }
    const sig = this.signals.get(name);
    if (sig !== undefined) { sig._setFromRemote(value); }
    this.lastSeen.set(name, lamport);
  }

  handleMessage(raw) {
    const msg = decode(raw);
    if (msg === null) { return; }
    this.notifyFrame('in', msg);
    if (msg.type === MSG_SNAPSHOT) {
      if (msg.values && typeof msg.values === 'object') {
        for (const [name, value] of Object.entries(msg.values)) {
          const sig = this.signals.get(name);
          if (sig !== undefined) { sig._setFromRemote(value); }
          this.lastSeen.set(name, msg.lamport ?? 0);
        }
      }
    } else if (msg.type === MSG_UPDATE) {
      this.applyRemoteUpdate(msg.name, msg.value, msg.lamport);
    } else if (msg.type === MSG_BATCH_UPDATE) {
      const updates = Array.isArray(msg.updates) ? msg.updates : [];
      for (const u of updates) {
        this.applyRemoteUpdate(u.name, u.value, u.lamport);
      }
    } else if (msg.type === MSG_SET_OK) {
      // Our CAS or non-CAS write succeeded. Update lastSeen and resolve the
      // pending CAS entry (if there is one).
      this.lastSeen.set(msg.name, msg.lamport);
      const pending = this.takePendingCas(msg.opId);
      if (pending !== undefined) { pending.resolve(); }
    } else if (msg.type === MSG_SET_FAIL) {
      const pending = this.takePendingCas(msg.opId);
      if (pending === undefined) {
        // Stray failure for a non-CAS write. Surface as an error.
        this.onError(new Error(`live ${msg.name} set rejected: ${msg.reason ?? 'unknown'}`));
        return;
      }
      // Apply the server's authoritative value to the local Signal so the
      // optimistic-local apply is overwritten with reality.
      if (msg.value !== undefined) {
        const sig = this.signals.get(msg.name);
        if (sig !== undefined) { sig._setFromRemote(msg.value); }
      }
      this.lastSeen.set(msg.name, msg.lamport ?? this.lastSeen.get(msg.name) ?? 0);
      if (msg.reason === 'conflict') {
        // CAS conflict. Re-run fn against the new value and retry.
        this.retryCas(pending);
        return;
      }
      // forbidden, unserializable, or unknown reason. Give up.
      pending.reject(new Error(`live ${msg.name} set rejected: ${msg.reason ?? 'unknown'}`));
    } else if (msg.type === MSG_ERROR) {
      this.onError(new Error(`live ${msg.name}: ${msg.reason ?? 'unknown'}`));
    }
  }

  // Re-run the user's fn against the current local value (now reflecting the
  // server's authoritative state after a conflict response) and send a fresh
  // CAS attempt.
  retryCas(pending) {
    pending.attempts += 1;
    if (pending.attempts > MAX_CAS_RETRIES) {
      pending.reject(new Error(
        `live ${pending.name} set(fn) failed after ${MAX_CAS_RETRIES} CAS retries. `
        + 'Likely high write contention on this name.',
      ));
      return;
    }
    const sig = this.signals.get(pending.name);
    if (sig === undefined) {
      pending.reject(new Error(`live ${pending.name} signal unsubscribed during CAS retry`));
      return;
    }
    let next;
    try {
      next = pending.fn(sig.value);
    } catch (err) {
      pending.reject(err);
      return;
    }
    if (!this.checkSerializable(pending.name, next)) {
      pending.reject(new Error(`live ${pending.name} set(fn) produced an unserializable value during retry`));
      return;
    }
    // Optimistically apply locally so subscribers see the latest computed
    // value while we wait for the server's verdict.
    sig._setFromRemote(next);
    this.sendCasWrite(pending, next);
  }

  // Issue a CAS write for an in-flight `.set(fn)` attempt. Allocates a fresh
  // opId, registers the pending entry, and sends MSG_SET with ifLamport set
  // to whatever lamport this client has last applied for the name.
  sendCasWrite(pending, next) {
    const opId = this.nextOpId++;
    this.pendingCas.set(opId, pending);
    const ifLamport = this.lastSeen.get(pending.name) ?? 0;
    this.send({ type: MSG_SET, name: pending.name, value: next, ifLamport, opId });
  }

  send(msg) {
    if (!this.sendPaused && this.ws !== null && this.ws.readyState === 1) {
      this.rawSendOnSocket(this.ws, msg);
    } else {
      this.outbound.push(msg);
    }
  }

  getOrCreateSignal(name, initial, options = {}) {
    const persist = options.persist === true;
    const existing = this.signals.get(name);
    if (existing !== undefined) {
      warnIfInitialMismatch(name, this.initialValues.get(name), initial);
      warnIfPersistMismatch(name, this.persistFlags.get(name) === true, persist);
      return existing;
    }

    const sig = signal(initial);
    sig._liveName = name;
    this.initialValues.set(name, initial);
    this.persistFlags.set(name, persist);

    // Wrap .set so each user-driven write also broadcasts. Two forms:
    //   .set(value)  Direct write. Sent as MSG_SET without ifLamport/opId.
    //                Server applies unconditionally (subject to canWrite).
    //                Last-write-wins under concurrency.
    //   .set(fn)     Atomic compare-and-swap. fn runs locally for an
    //                optimistic update, then the message goes out with
    //                ifLamport tied to the last lamport we've seen. The
    //                server applies only if its current lamport matches;
    //                otherwise it returns the authoritative value and we
    //                re-run fn against that value. Returns a Promise that
    //                resolves once the server confirms (set-ok) or rejects
    //                (set-fail with reason=forbidden/unserializable).
    const origSet = sig.set.bind(sig);
    sig.set = valueOrFn => {
      if (typeof valueOrFn === 'function') {
        return this.casUpdate(name, sig, origSet, valueOrFn);
      }
      if (!this.checkSerializable(name, valueOrFn)) { return undefined; }
      origSet(valueOrFn);
      // Non-CAS write. ifLamport is omitted, so the server applies
      // unconditionally (subject to canWrite). No need to send a lamport
      // hint either; the server doesn't read it for non-CAS sets.
      this.send({ type: MSG_SET, name, value: valueOrFn });
      return undefined;
    };

    // Override .stop() to also tear down the server subscription so calling
    // .stop() does not leave the transport receiving broadcasts for a name
    // nobody is listening to.
    const origStop = sig.stop.bind(sig);
    sig.stop = () => { origStop(); this.unsubscribe(name); };

    // Auto-unsubscribe / auto-resubscribe around the sleep/wake cycle. When
    // every local subscriber goes away (DOM bindings tear down, computeds
    // auto-dispose), tell the server to stop broadcasting. On the next
    // local subscription, re-subscribe; the server sends a snapshot and we
    // apply it via `_setFromRemote`.
    sig._onZeroSubscribers = () => {
      if (!this.signals.has(name)) { return; } // already explicitly stopped
      this.send({ type: MSG_UNSUBSCRIBE, name });
    };
    sig._onFirstSubscriber = () => {
      if (!this.signals.has(name)) { return; }
      this.send(buildSubscribeMsg(name, this.persistFlags.get(name) === true));
    };

    this.signals.set(name, sig);
    this.send(buildSubscribeMsg(name, persist));
    return sig;
  }

  // Start a CAS update. Runs fn against the local value for an immediate
  // optimistic apply, sends MSG_SET with ifLamport, and waits for the
  // server's verdict via handleMessage. Returns a Promise that resolves
  // when the write is confirmed (set-ok) or rejects when it's permanently
  // denied or retries are exhausted.
  casUpdate(name, sig, origSet, fn) {
    let initialNext;
    try {
      initialNext = fn(sig.value);
    } catch (err) {
      return Promise.reject(err);
    }
    if (!this.checkSerializable(name, initialNext)) {
      return Promise.reject(new Error(
        `live ${name} set(fn) produced an unserializable value`,
      ));
    }
    // Apply optimistically. The local Signal updates synchronously; the UI
    // shows the new value immediately. If the server rejects with a
    // conflict, retryCas will overwrite with the server's value and try
    // again. If it rejects permanently, handleMessage applies the server's
    // value via _setFromRemote.
    origSet(initialNext);
    return new Promise((resolve, reject) => {
      this.sendCasWrite({ name, fn, attempts: 0, resolve, reject }, initialNext);
    });
  }

  // Validate that a value can round-trip through JSON. Fires a once-per-name
  // warning and returns false (which rejects the .set) when the value would
  // throw on JSON.stringify (circular reference, BigInt) or silently drop
  // (top-level function, Symbol, undefined).
  checkSerializable(name, value) {
    let ser;
    try {
      ser = JSON.stringify(value);
    } catch (err) {
      if (!this.unserializableWarned.has(name)) {
        this.unserializableWarned.add(name);
        console.warn(
          `kensington/live: liveSignal '${name}' .set() rejected — value is not JSON-serializable. `
          + `${err.message}. `
          + 'liveSignal values must round-trip through JSON.stringify/JSON.parse '
          + '(no circular references, BigInts, Maps, Sets, Dates, class instances, functions, or Symbols).',
        );
      }
      return false;
    }
    if (ser === undefined) {
      if (!this.unserializableWarned.has(name)) {
        this.unserializableWarned.add(name);
        console.warn(
          `kensington/live: liveSignal '${name}' .set() rejected — value serializes to undefined `
          + '(typeof function, Symbol, or top-level undefined). liveSignal values must be JSON values.',
        );
      }
      return false;
    }
    return true;
  }

  unsubscribe(name) {
    if (this.signals.has(name)) {
      this.signals.delete(name);
      this.lastSeen.delete(name);
      this.initialValues.delete(name);
      this.persistFlags.delete(name);
      this.send({ type: MSG_UNSUBSCRIBE, name });
    }
  }

  close() {
    this.closed = true;
    this.dropSocket();
    // Reject any in-flight CAS promises so awaiters don't hang forever.
    for (const pending of this.pendingCas.values()) {
      pending.reject(new Error(`live ${pending.name} set(fn) aborted: transport closed`));
    }
    this.pendingCas.clear();
    this.setStatus('disconnected');
  }

  // Drop the current WebSocket and stay disconnected. The transport handle
  // stays alive; subscriptions and the outbound buffer survive, but no
  // automatic reconnect is scheduled. Call `transport.reconnect()` to come
  // back. Different from `close()` (terminal) and from `reconnect()` (drops
  // and immediately re-opens). Use for diagnostic UIs that want to observe
  // the disconnected state for an unbounded interval, or for paths that
  // intentionally suspend live traffic without tearing the transport down.
  // Close the current WebSocket (if any) and clear any pending reconnect
  // timer. Shared by disconnect()/reconnect()/close(); each adds its own
  // status transition and bookkeeping on top.
  dropSocket() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws !== null) {
      try { this.ws.close(); } catch { /* socket already gone */ }
      this.ws = null;
    }
  }

  disconnect() {
    if (this.closed) { return; }
    this.manuallyDisconnected = true;
    this.dropSocket();
    this.setStatus('disconnected');
  }

  // Drop the current WebSocket and immediately re-open. The transport handle
  // stays alive; subscriptions, pending CAS, and the outbound buffer all
  // survive. Resets backoff so the reconnect attempts start fast. Clears the
  // manually-disconnected flag so a prior `disconnect()` is reversed. Useful
  // for diagnostic UIs ("reconnect now") and for paths that explicitly want
  // to force a fresh snapshot from the server.
  reconnect() {
    if (this.closed) { return; }
    this.dropSocket();
    this.resetReconnectState();
    this.manuallyDisconnected = false;
    this.setStatus('reconnecting');
    // Use a microtask so any caller-side state changes in the same tick land
    // before connect() reads them (e.g. updating env.userName before triggering
    // a reconnect that wants the new identity in the WS URL).
    queueMicrotask(() => { if (!this.closed) { this.connect(); } });
  }

  // Buffer outgoing writes until resumeSend() is called. Already-flushed
  // messages are not retracted; only future send() calls accumulate in the
  // outbound queue. Reads (incoming MSG_UPDATE, MSG_SNAPSHOT) still apply.
  // Intended for diagnostic harnesses that want to force CAS contention or
  // observe optimistic-local-apply behavior. The status signal is unchanged
  // (the socket is still connected); the buffer is application-level.
  pauseSend() {
    this.sendPaused = true;
  }

  // Resume sending. Flushes the accumulated outbound buffer in FIFO order.
  resumeSend() {
    if (!this.sendPaused) { return; }
    this.sendPaused = false;
    if (this.ws === null || this.ws.readyState !== 1) { return; }
    while (this.outbound.length > 0) {
      this.rawSendOnSocket(this.ws, this.outbound.shift());
    }
  }
}

export function connectLive(opts) {
  const transport = new ClientTransport(opts);
  _registerTransport(transport);
  transport.connect();
  return transport;
}
