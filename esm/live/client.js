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

// Walk a value tree looking for NaN, Infinity, or -Infinity. These coerce
// to null on `JSON.stringify` silently, which corrupts the value on the wire
// and leaves the local optimistic apply diverging from the registry. Called
// from checkSerializable before stringify so the rejection fires with a
// pointed message. Cycles are not a concern here. `JSON.stringify` throws
// on them and that catch path handles them, but we still guard with a
// WeakSet so the walker itself doesn't recurse forever on a circular input.
function containsNonFiniteNumber(value, seen) {
  if (typeof value === 'number') { return !Number.isFinite(value); }
  if (value === null || typeof value !== 'object') { return false; }
  const visited = seen ?? new WeakSet();
  if (visited.has(value)) { return false; }
  visited.add(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      if (containsNonFiniteNumber(item, visited)) { return true; }
    }
    return false;
  }
  for (const key of Object.keys(value)) {
    if (containsNonFiniteNumber(value[key], visited)) { return true; }
  }
  return false;
}

// Attach a no-op `.catch` so an unawaited / un-`.catch`'d returned Promise
// does not surface as an unhandled rejection. The original Promise is
// returned unchanged; user code that adds its own `.catch` (or `await`s)
// still sees the rejection, because `.then`/`.catch` handlers on the same
// Promise are independent. Used on the result of every `.set` so fire-and-
// forget `sig.set(value)` stays ergonomic.
function silenceUnhandled(promise) {
  promise.catch(() => {});
  return promise;
}

// Build a structured Error for a rejected .set. The reason field carries the
// machine-readable cause ('forbidden', 'conflict', 'unserializable', etc.) so
// dev code can branch on err.reason instead of parsing err.message. The
// attemptedValue is the value the caller tried to write; authoritativeValue
// is the server's truth (already applied to the local Signal before this
// error fires).
function buildSetRejection(name, reason, attemptedValue, authoritativeValue) {
  const err = new Error(`live ${name} set rejected: ${reason ?? 'unknown'}`);
  err.name = 'LiveSetRejected';
  err.signalName = name;
  err.reason = reason ?? 'unknown';
  err.attemptedValue = attemptedValue;
  err.authoritativeValue = authoritativeValue;
  return err;
}

class ClientTransport {
  constructor(options = {}) {
    const {
      url = DEFAULT_LIVE_PATH,
      reconnect = { initialDelay: 250, maxDelay: 30000 },
      onStatus,
      onFrame,
    } = options;
    this.url = url;
    this.reconnectOpts = reconnect;
    this.onStatus = onStatus ?? (() => {});
    this.onFrame = onFrame ?? null;
    this.signals = new Map(); // name → Signal
    this.initialValues = new Map(); // name → first-call initial, for duplicate-name detection
    this.persistFlags = new Map(); // name → boolean. First-declaration-wins; sent on every SUBSCRIBE.
    this.lastSeen = new Map(); // name → lamport of last applied update
    this.outbound = []; // queued while disconnected
    // Pending writes. opId → { name, attemptedValue, isCas, fn?, attempts?, resolve, reject }.
    // Both .set(value) and .set(fn) suspend here until MSG_SET_OK or MSG_SET_FAIL
    // arrives. CAS attempts (fn form) carry the fn closure and retry on conflict;
    // direct writes (value form) reject on any non-success reply.
    this.pendingWrites = new Map();
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
    catch (err) {
      console.error(`kensington/live: WebSocket constructor failed for ${this.url}`, err);
      this.scheduleReconnect();
      return;
    }
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
    ws.addEventListener('close', () => {
      this.ws = null;
      // Any sent-but-unacked writes are dead now. The server may or may not
      // have processed them; on reconnect we re-subscribe and the snapshot
      // becomes the source of truth, so the opIds will never be replied to.
      // Reject the pending Promises so awaiters don't hang for the full
      // reconnect window (or forever if reconnect succeeds and the replies
      // never arrive).
      this.failPendingWrites('disconnected');
      this.scheduleReconnect();
    });
    ws.addEventListener('error', err => {
      console.error(`kensington/live: WebSocket error on ${this.url}`, err);
    });
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
    if (next === 'disconnected') {
      // No socket to deliver pending writes on, and any reply for an already-
      // sent opId will be dropped after reconnect anyway. Reject in-flight
      // writes so awaiters don't hang. New writes attempted while status is
      // 'disconnected' are also rejected immediately in directWrite/casUpdate.
      this.failPendingWrites('disconnected');
    }
  }

  failPendingWrites(reason) {
    if (this.pendingWrites.size === 0 && this.outbound.length === 0) { return; }
    for (const pending of this.pendingWrites.values()) {
      pending.reject(buildSetRejection(pending.name, reason, pending.attemptedValue));
    }
    this.pendingWrites.clear();
    // Drop any MSG_SET frames buffered for the dead socket. Their pending
    // entries were just rejected; replaying them on reconnect would land
    // a write whose .catch already reported failure, leaving the user with
    // a "rejected" Promise that nevertheless succeeded server-side.
    // Re-subscribes (MSG_SUBSCRIBE / MSG_UNSUBSCRIBE) survive so the
    // post-reconnect re-subscribe flow keeps working.
    this.outbound = this.outbound.filter(msg => msg.type !== MSG_SET);
  }

  // Reset backoff state. Called from the constructor (initial values), the
  // open-handler (we successfully reconnected, so future failures start fast
  // again), and reconnect() (the caller wants the next attempt to be fast).
  resetReconnectState() {
    this.reconnectDelay = this.reconnectOpts.initialDelay;
    this.reconnectAttempts = 0;
  }

  // Look up and remove a pending write entry. Returns undefined if no entry
  // exists for the opId (already handled, or a stray reply). Centralises the
  // get + delete pattern that appears at every MSG_SET_OK / MSG_SET_FAIL path.
  takePendingWrite(opId) {
    const pending = this.pendingWrites.get(opId);
    if (pending !== undefined) { this.pendingWrites.delete(opId); }
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
      // Our write succeeded. Update lastSeen and resolve the pending entry.
      this.lastSeen.set(msg.name, msg.lamport);
      const pending = this.takePendingWrite(msg.opId);
      if (pending !== undefined) { pending.resolve(); }
    } else if (msg.type === MSG_SET_FAIL) {
      const pending = this.takePendingWrite(msg.opId);
      if (pending === undefined) { return; } // stale reply for an already-handled opId
      // Apply the server's authoritative value to the local Signal so the
      // optimistic-local apply is overwritten with reality.
      if (msg.value !== undefined) {
        const sig = this.signals.get(msg.name);
        if (sig !== undefined) { sig._setFromRemote(msg.value); }
      }
      this.lastSeen.set(msg.name, msg.lamport ?? this.lastSeen.get(msg.name) ?? 0);
      if (msg.reason === 'conflict' && pending.isCas) {
        // CAS conflict. Re-run fn against the new value and retry.
        this.retryCas(pending);
        return;
      }
      // forbidden, unserializable, conflict-on-direct, or unknown reason. Give up.
      pending.reject(buildSetRejection(msg.name, msg.reason, pending.attemptedValue, msg.value));
    } else if (msg.type === MSG_ERROR) {
      // Subscribe-side rejection (canRead). Not tied to a specific write,
      // so there's no per-call Promise to reject. Log via console.error; the
      // setup is misconfigured.
      console.error(`kensington/live: ${msg.name} subscribe rejected: ${msg.reason ?? 'unknown'}`);
    }
  }

  // Re-run the user's fn against the current local value (now reflecting the
  // server's authoritative state after a conflict response) and send a fresh
  // CAS attempt.
  retryCas(pending) {
    pending.attempts += 1;
    if (pending.attempts > MAX_CAS_RETRIES) {
      pending.reject(buildSetRejection(pending.name, 'retries-exhausted', pending.attemptedValue));
      return;
    }
    const sig = this.signals.get(pending.name);
    if (sig === undefined) {
      pending.reject(buildSetRejection(pending.name, 'unsubscribed', pending.attemptedValue));
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
      pending.reject(buildSetRejection(pending.name, 'unserializable', next));
      return;
    }
    pending.attemptedValue = next;
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
    this.pendingWrites.set(opId, pending);
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

    // Wrap .set so each user-driven write also broadcasts. Two forms, unified
    // return shape (Promise<void>):
    //   .set(value)  Direct write. Optimistic local apply, sent with an opId
    //                and no ifLamport. Server applies unconditionally subject
    //                to canWrite. Last-write-wins under concurrency. The
    //                returned Promise resolves on set-ok or rejects on
    //                set-fail (forbidden / unserializable). On rejection the
    //                server's authoritative value rolls back the local Signal.
    //   .set(fn)     Compare-and-swap. fn runs locally for an optimistic
    //                update; the message carries ifLamport so the server
    //                applies only if its lamport matches. On conflict the
    //                client re-runs fn against the authoritative value and
    //                retries. Same return shape; rejection on permanent
    //                failure (forbidden / unserializable / retries exhausted).
    const origSet = sig.set.bind(sig);
    sig.set = valueOrFn => {
      if (typeof valueOrFn === 'function') {
        return this.casUpdate(name, sig, origSet, valueOrFn);
      }
      return this.directWrite(name, sig, origSet, valueOrFn);
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
  // denied or retries are exhausted. The internal `.catch(() => {})`
  // silencer suppresses unhandled-rejection warnings for fire-and-forget
  // callers; user code that attaches its own `.catch` (or `await`s) still
  // sees the rejection on its own handlers.
  casUpdate(name, sig, origSet, fn) {
    if (this.status.value === 'disconnected') {
      return silenceUnhandled(Promise.reject(buildSetRejection(name, 'disconnected', undefined)));
    }
    let initialNext;
    try {
      initialNext = fn(sig.value);
    } catch (err) {
      return silenceUnhandled(Promise.reject(err));
    }
    if (!this.checkSerializable(name, initialNext)) {
      return silenceUnhandled(Promise.reject(buildSetRejection(name, 'unserializable', initialNext)));
    }
    // Apply optimistically. The local Signal updates synchronously; the UI
    // shows the new value immediately. If the server rejects with a
    // conflict, retryCas will overwrite with the server's value and try
    // again. If it rejects permanently, handleMessage applies the server's
    // value via _setFromRemote.
    origSet(initialNext);
    return silenceUnhandled(new Promise((resolve, reject) => {
      this.sendCasWrite({
        name, fn, attempts: 0, attemptedValue: initialNext, isCas: true, resolve, reject,
      }, initialNext);
    }));
  }

  // Start a direct write. Optimistically applies locally, sends MSG_SET with
  // an opId (no ifLamport), and waits for the server's verdict. The Promise
  // resolves on set-ok or rejects on set-fail; on rejection the server's
  // authoritative value has already rolled back the local Signal via
  // _setFromRemote in handleMessage before the rejection fires. The internal
  // `.catch(() => {})` silencer keeps fire-and-forget `sig.set(value)` calls
  // from producing unhandled-rejection warnings.
  directWrite(name, sig, origSet, value) {
    if (this.status.value === 'disconnected') {
      return silenceUnhandled(Promise.reject(buildSetRejection(name, 'disconnected', value)));
    }
    if (!this.checkSerializable(name, value)) {
      return silenceUnhandled(Promise.reject(buildSetRejection(name, 'unserializable', value)));
    }
    origSet(value);
    return silenceUnhandled(new Promise((resolve, reject) => {
      const opId = this.nextOpId++;
      this.pendingWrites.set(opId, {
        name, attemptedValue: value, isCas: false, resolve, reject,
      });
      this.send({ type: MSG_SET, name, value, opId });
    }));
  }

  // Validate that a value can round-trip through JSON. Fires a once-per-name
  // warning and returns false (which rejects the .set) when the value would
  // throw on JSON.stringify (circular reference, BigInt), silently drop
  // (top-level function, Symbol, undefined), or silently coerce to null
  // (NaN, Infinity, -Infinity).
  checkSerializable(name, value) {
    if (containsNonFiniteNumber(value)) {
      if (!this.unserializableWarned.has(name)) {
        this.unserializableWarned.add(name);
        console.warn(
          `kensington/live: liveSignal '${name}' .set() rejected — value contains a non-finite number `
          + '(NaN, Infinity, or -Infinity). JSON.stringify coerces these to null, which silently corrupts '
          + 'the value on the wire. Use a sentinel value (null, a string, or a finite number) instead.',
        );
      }
      return false;
    }
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
    // The setStatus('disconnected') transition rejects any in-flight write
    // promises via failPendingWrites, so awaiters don't hang.
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
