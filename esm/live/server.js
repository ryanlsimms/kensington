// kensington/live server runtime. Owns the per-name registry, the WebSocket
// multiplexer, and the persistence adapter. The component is NOT re-run on
// the server when state changes; live updates flow directly through the WS.
//
// Two attach modes:
//   live.attach(httpServer)       Node HTTP server + the `ws` package.
//   live.bunWebsocket()           Bun-native WebSocket handlers config.

import { signal } from '../lib/reactive/signal.js';
import { createMemoryStore } from './persistence/memory.js';
import { createSqliteStore } from './persistence/sqlite.js';
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
import { _registerTransport } from './state.js';

const ALLOW_ALL = () => true;

// Normalize a canWrite value (string shortcut or function) into a predicate
// with the canonical (name, ctx, transition) signature. Backwards-compatible
// with the existing two-arg form: callers that ignore the third argument
// keep working unchanged.
function normalizeCanWrite(value) {
  if (value === undefined || value === 'any') {
    return ALLOW_ALL;
  }
  if (value === 'server-only') {
    return () => false;
  }
  if (typeof value === 'function') {
    return value;
  }
  throw new TypeError(
    "kensington/live: canWrite must be 'any', 'server-only', or a function (name, ctx, transition) => boolean",
  );
}

// Grace period before a transient (persist=false) name is dropped from the
// registry after its subscriber count reaches zero. Covers brief reconnects
// and the local sleep-wake cycle that briefly takes subscribers to zero.
// Configurable later if needed; 30s is longer than the default reconnect
// backoff cap (also 30s) and short enough that transient data doesn't outlive
// its purpose.
const TRANSIENT_GRACE_MS = 30_000;

import { DEFAULT_LIVE_PATH } from './constants.js';
import { warnIfInitialMismatch, warnIfPersistMismatch } from './warn.js';

export async function liveServer({
  persistence = { kind: 'memory' },
  canRead = ALLOW_ALL,
  canWrite,
  onConnect = null,
  onSocketClose = null,
  path = DEFAULT_LIVE_PATH,
  heartbeatInterval = 30_000,
} = {}) {
  const globalCanWrite = normalizeCanWrite(canWrite);
  // Resolve the store. sqlite path is async because better-sqlite3 loads via
  // dynamic import; memory is synchronous but we await uniformly.
  let store;
  if (persistence.kind === 'sqlite') {
    store = await createSqliteStore(persistence);
  } else if (persistence.kind === 'memory' || persistence.kind === undefined) {
    store = createMemoryStore();
  } else {
    throw new Error(`kensington/live: unknown persistence.kind ${JSON.stringify(persistence.kind)}. Use 'memory' or 'sqlite'.`);
  }

  const registry = new Map(); // name → { value, lamport }
  const subs = new Map(); // name → Set<socket>
  const initialValues = new Map(); // name → first-call initial, for duplicate-name detection
  // Per-name persistence policy. First declaration (client SUBSCRIBE with
  // `persist` field, or server-side liveSignal call) wins; later declarations
  // with a different value warn but keep the stored policy. Names whose data
  // was warmed from the persistence store on boot start with persist=true
  // because their existence on disk implies persistence was wanted before.
  const persistPolicy = new Map(); // name → boolean
  // Pending drop timers for transient names that hit zero subscribers. Keyed
  // by name; the value is the setTimeout handle. Cancelled if a new
  // subscriber arrives before the timer fires.
  const transientDropTimers = new Map(); // name → Timeout
  // Server-side Signal observers. Each entry is a Set of callbacks invoked
  // by `applySet` after a registry write so the server-side Signal returned
  // by `liveSignal()` outside SSR-mode receives client writes (and other
  // server-side writes) reactively. Observers also count toward the
  // transient-drop subscriber check so a name with only server observers
  // stays alive.
  const nameSubscribers = new Map(); // name → Set<(value: unknown) => void>
  // Cache of server-side Signal instances built outside SSR mode. Multiple
  // `liveSignal(initial, name)` calls outside SSR return the same instance,
  // mirroring the client transport's per-name cache. Inside SSR mode, each
  // call creates a fresh per-request Signal (no caching, no subscription).
  const serverSignals = new Map(); // name → Signal
  // Per-signal canWrite predicates. Registered by the first server-side
  // `liveSignal(initial, name, { canWrite })` call. First declaration wins
  // (server-side liveSignal calls during SSR are typically idempotent for
  // the same name).
  const canWritePolicy = new Map(); // name → normalized predicate
  let lamport = 0;

  // Warm the registry from the persistence store. Note: we deliberately do
  // NOT seed `persistPolicy` from the disk-warmed names. Existence on disk is
  // only evidence that persistence was wanted at the time of the prior write.
  // The first explicit declaration after boot (client SUBSCRIBE or server-side
  // liveSignal call) sets the policy. If no declaration arrives, the policy
  // stays unset (treated as false), no new writes hit disk, and the warmed
  // value stays available to readers via the in-memory registry.
  for (const [name, value] of store.all()) {
    registry.set(name, { value, lamport: ++lamport });
  }

  // Socket abstraction. Both `ws` (Node) and Bun's ServerWebSocket have a
  // `send` method that takes a string, but Bun uses `ws.data` for per-socket
  // state while `ws` (the Node lib) lets you mutate properties freely. We
  // keep state in a WeakMap keyed by the raw socket object to work uniformly.
  const socketState = new WeakMap();

  function ensureState(sock) {
    let s = socketState.get(sock);
    if (s === undefined) { s = { ctx: {}, subscribed: new Set() }; socketState.set(sock, s); }
    return s;
  }

  function sendRaw(sock, str) {
    try { sock.send(str); } catch { /* socket closed mid-broadcast; ignored */ }
  }

  function getSubs(name) {
    let set = subs.get(name);
    if (set === undefined) { set = new Set(); subs.set(name, set); }
    return set;
  }

  function getObservers(name) {
    let set = nameSubscribers.get(name);
    if (set === undefined) { set = new Set(); nameSubscribers.set(name, set); }
    return set;
  }

  // WebSocketServer created by attach(), retained so close() can tear it
  // down. bunWebsocket() does not populate this. Bun owns the socket
  // lifecycle through the user's Bun.serve handle.
  let attachedWss = null;
  let heartbeatTimer = null;

  // Outbound broadcast batching. Writes accumulate in pendingBroadcasts and
  // flush on the next microtask. Per-socket grouping coalesces multiple
  // updates into one MSG_BATCH_UPDATE frame. Single-update sockets get a
  // plain MSG_UPDATE for wire economy. Invisible to dev code.
  const pendingBroadcasts = [];
  let flushScheduled = false;

  function flushBroadcasts() {
    flushScheduled = false;
    if (pendingBroadcasts.length === 0) { return; }
    const entries = pendingBroadcasts.splice(0, pendingBroadcasts.length);

    // bySocket: Map<socket, Array<{ name, value, lamport }>>
    const bySocket = new Map();
    for (const { name, exclude } of entries) {
      const entry = registry.get(name);
      if (entry === undefined) { continue; }
      const payload = { name, value: entry.value, lamport: entry.lamport };
      for (const sock of getSubs(name)) {
        if (sock === exclude) { continue; }
        let list = bySocket.get(sock);
        if (list === undefined) { list = []; bySocket.set(sock, list); }
        list.push(payload);
      }
    }

    for (const [sock, list] of bySocket) {
      if (list.length === 1) {
        const u = list[0];
        sendRaw(sock, encode({ type: MSG_UPDATE, name: u.name, value: u.value, lamport: u.lamport }));
      } else {
        sendRaw(sock, encode({ type: MSG_BATCH_UPDATE, updates: list }));
      }
    }
  }

  function broadcast(name, exclude) {
    pendingBroadcasts.push({ name, exclude });
    if (!flushScheduled) {
      flushScheduled = true;
      queueMicrotask(flushBroadcasts);
    }
  }

  // Track names we've already warned about so we don't spam the log every
  // .set() call when the same name keeps receiving an unserializable value.
  const unserializableWarned = new Set();

  function checkSerializable(name, value) {
    let ser;
    try { ser = JSON.stringify(value); }
    catch (err) {
      if (!unserializableWarned.has(name)) {
        unserializableWarned.add(name);
        console.warn(
          `kensington/live: server-side .set('${name}', ...) rejected — value is not JSON-serializable. ${err.message}. `
          + 'liveSignal values must round-trip through JSON.stringify/JSON.parse '
          + '(no circular references, BigInts, Maps, Sets, Dates, class instances, functions, or Symbols).',
        );
      }
      return false;
    }
    if (ser === undefined) {
      if (!unserializableWarned.has(name)) {
        unserializableWarned.add(name);
        console.warn(
          `kensington/live: server-side .set('${name}', ...) rejected — value serializes to undefined `
          + '(typeof function, Symbol, or top-level undefined). liveSignal values must be JSON values.',
        );
      }
      return false;
    }
    return true;
  }

  // Record a declared persist flag for a name. First declaration wins;
  // subsequent declarations with a different value warn but keep the stored
  // value. `declared === undefined` is the "no opinion" case (a client
  // MSG_SUBSCRIBE that did not carry an explicit persist field); it neither
  // declares nor compares. Returns the resolved (stored) policy or undefined
  // when there is nothing recorded yet.
  function recordPersist(name, declared) {
    if (declared === undefined) {
      return persistPolicy.get(name);
    }
    if (persistPolicy.has(name)) {
      const current = persistPolicy.get(name);
      if (declared !== current) {
        warnIfPersistMismatch(name, current, declared);
      }
      return current;
    }
    const value = declared === true;
    persistPolicy.set(name, value);
    return value;
  }

  // Record a per-signal canWrite predicate for a name. First declaration
  // wins. Later declarations are ignored silently (functions can't be
  // structurally compared, so we don't try to warn on mismatch). Pass the
  // canonical (name, ctx, transition) form.
  function recordCanWrite(name, declared) {
    if (declared === undefined) {
      return;
    }
    if (canWritePolicy.has(name)) {
      return;
    }
    canWritePolicy.set(name, normalizeCanWrite(declared));
  }

  // Notify the server-side observer set for a name. Errors thrown by user
  // observer callbacks are logged but not propagated; the writer must not
  // be poisoned by a misbehaving subscriber.
  function notifyObservers(name, value) {
    const localSubs = nameSubscribers.get(name);
    if (localSubs === undefined) { return; }
    for (const cb of localSubs) {
      try { cb(value); }
      catch (err) { console.error('kensington/live: server-side observer threw:', err); }
    }
  }

  // The single funnel that commits a value into the live state graph.
  // Increments lamport, writes the registry, persists when policy says so,
  // broadcasts to client subscribers (optionally excluding the originator),
  // and notifies server-side observers. Used by `applySet` (the broad path
  // that also runs serializability checks) and by `handleClientSet` (which
  // runs canWrite + serializability + CAS checks before calling here).
  function commitWrite(name, value, fromSocket) {
    lamport += 1;
    registry.set(name, { value, lamport });
    if (persistPolicy.get(name) === true) {
      store.set(name, value);
    }
    broadcast(name, fromSocket);
    // A self-write from a server-side Signal's wrapped .set() also reaches
    // notifyObservers via the writer's cb. `_setFromRemote` is a no-op when
    // the value equals the current local value, so the writer's own
    // callback short-circuits without double-notifying its subscribers.
    notifyObservers(name, value);
  }

  function applySet(name, value, fromSocket) {
    if (!checkSerializable(name, value)) { return; }
    commitWrite(name, value, fromSocket);
  }

  // True when at least one party is watching `name` — either a connected
  // client subscriber or a server-side observer (the cb registered when a
  // server-side liveSignal is created). The transient grace-period drop
  // depends on both being absent; the scheduler bails out if either is set.
  function hasAnySubscriber(name) {
    if ((subs.get(name)?.size ?? 0) > 0) { return true; }
    if ((nameSubscribers.get(name)?.size ?? 0) > 0) { return true; }
    return false;
  }

  // Drop a transient name from the registry. Called from the grace-period
  // timer when a persist=false name's last subscriber leaves and nobody else
  // shows up before the timer fires. Removes from registry, store (in case
  // the policy ever flipped), and subs.
  function dropTransient(name) {
    transientDropTimers.delete(name);
    if (hasAnySubscriber(name)) { return; } // raced with a new subscriber
    registry.delete(name);
    persistPolicy.delete(name);
    initialValues.delete(name);
    store.delete(name);
    subs.delete(name);
  }

  function cancelTransientDrop(name) {
    const t = transientDropTimers.get(name);
    if (t !== undefined) {
      clearTimeout(t);
      transientDropTimers.delete(name);
    }
  }

  function scheduleTransientDropIfNeeded(name) {
    // Only drop names that have been explicitly declared transient. Names
    // with no policy yet stay in the registry; they might be disk-warmed
    // entries waiting for a code declaration on next boot.
    if (persistPolicy.get(name) !== false) { return; }
    if (hasAnySubscriber(name)) { return; }
    if (transientDropTimers.has(name)) { return; }
    const handle = setTimeout(() => dropTransient(name), TRANSIENT_GRACE_MS);
    if (typeof handle.unref === 'function') { handle.unref(); }
    transientDropTimers.set(name, handle);
  }

  // The server-side liveSignal lookup. Returns a regular Signal initialized
  // from the registry value if present, else from the `initial` argument. The
  // component runs once during SSR; we do NOT write `initial` to the registry
  // or to persistence here — only an explicit `.set()` (from server code or a
  // broadcast from a client) creates an entry. This keeps SSR cold-boots from
  // polluting the persistence store with empty rows for every cell the page
  // happens to render.
  //
  // `status` is exposed for parity with the client transport. It is surfaced
  // on the returned LiveServer handle so server code can mix the same status
  // signal into SSR output as the client uses. Server-side never disconnects
  // from itself, so the signal is always 'connected'.
  // Build a fresh server-side Signal wrapping `applySet` on writes. Used by
  // both the SSR per-request path and the long-lived cached path.
  function makeServerSignal(name, initial) {
    const seed = registry.has(name) ? registry.get(name).value : initial;
    const sig = signal(seed);
    sig._liveName = name;
    const origSet = sig.set.bind(sig);
    sig.set = valueOrFn => {
      const resolved = typeof valueOrFn === 'function' ? valueOrFn(sig.value) : valueOrFn;
      if (!checkSerializable(name, resolved)) { return; }
      origSet(resolved);
      applySet(name, resolved, /* fromSocket = */ null);
    };
    return sig;
  }

  const serverTransport = {
    status: signal('connected'),
    getOrCreateSignal(name, initial, options = {}) {
      if (initialValues.has(name)) {
        warnIfInitialMismatch(name, initialValues.get(name), initial);
      } else {
        initialValues.set(name, initial);
      }
      recordPersist(name, options.persist === true);
      recordCanWrite(name, options.canWrite);

      // Same name, same Signal. The cache is shared across SSR-mode calls
      // and long-lived calls. Multiple requests for the same auction id
      // (or any same-name lookup, server-side) return the same instance.
      // The Signal subscribes to registry updates either way, so client
      // writes propagate. Per-request SSR doesn't need its own isolated
      // copy because liveSignals are inherently shared-by-name primitives.
      const cached = serverSignals.get(name);
      if (cached !== undefined) { return cached; }

      const sig = makeServerSignal(name, initial);
      serverSignals.set(name, sig);
      cancelTransientDrop(name); // observing keeps an transient name alive

      const cb = value => sig._setFromRemote(value);
      const observers = getObservers(name);
      observers.add(cb);

      const origStop = sig.stop.bind(sig);
      sig.stop = () => {
        origStop();
        observers.delete(cb);
        serverSignals.delete(name);
        if (observers.size === 0) {
          nameSubscribers.delete(name);
          scheduleTransientDropIfNeeded(name);
        }
      };

      return sig;
    },
  };
  _registerTransport(serverTransport);

  // Reply to a client MSG_SET. opId is optional; when absent the client did
  // a fire-and-forget direct write (.set(value)) and isn't expecting a reply.
  // When present, the client is in the CAS retry loop and needs to know
  // ok/fail. On failure the reply carries the server's authoritative value
  // and lamport so the client can re-run its update fn against current state.
  function replyToClientSet(sock, name, opId, ok, reason) {
    if (opId === undefined) { return; }
    const entry = registry.get(name);
    const entryLamport = entry?.lamport ?? 0;
    const reply = ok
      ? { type: MSG_SET_OK, name, lamport: entryLamport, opId }
      : { type: MSG_SET_FAIL, name, opId, reason, value: entry?.value, lamport: entryLamport };
    sendRaw(sock, encode(reply));
  }

  // Send the failure response for a client set. CAS writers (opId present)
  // get a typed MSG_SET_FAIL with the current authoritative value. Direct
  // (non-CAS) writers don't expect a structured reply, so they get a
  // best-effort MSG_ERROR so the client can surface the rejection.
  function rejectClientSet(sock, name, msg, reason) {
    replyToClientSet(sock, name, msg.opId, false, reason);
    if (msg.opId === undefined) {
      sendRaw(sock, encode({ type: MSG_ERROR, name, reason }));
    }
  }

  // Process a client MSG_SET. Combines canWrite enforcement (global +
  // per-signal) and optional CAS (when ifLamport is present). On success
  // the value is applied to the registry, broadcast to other subscribers,
  // and MSG_SET_OK is sent to the originator (if opId).
  function handleClientSet(sock, state, msg) {
    const name = msg.name;
    const next = msg.value;
    const prev = registry.get(name)?.value;
    const transition = { prev, next };

    const perSignal = canWritePolicy.get(name);
    if (!globalCanWrite(name, state.ctx, transition)
        || (perSignal !== undefined && !perSignal(name, state.ctx, transition))) {
      rejectClientSet(sock, name, msg, 'forbidden');
      return;
    }
    // CAS check if ifLamport was supplied.
    if (msg.ifLamport !== undefined) {
      const currentLamport = registry.get(name)?.lamport ?? 0;
      if (msg.ifLamport !== currentLamport) {
        rejectClientSet(sock, name, msg, 'conflict');
        return;
      }
    }
    // Serializability check (rejects circular refs, BigInts, etc.).
    if (!checkSerializable(name, next)) {
      rejectClientSet(sock, name, msg, 'unserializable');
      return;
    }
    // All checks passed. Apply via the shared commit path.
    commitWrite(name, next, sock);
    replyToClientSet(sock, name, msg.opId, true);
  }

  async function onSocketOpen(sock, req) {
    const state = ensureState(sock);
    if (onConnect !== null) {
      try { state.ctx = (await onConnect(sock, req)) ?? {}; }
      catch (err) { console.error('kensington/live onConnect threw:', err); state.ctx = {}; }
    }
  }

  function onSocketMessage(sock, raw) {
    const state = ensureState(sock);
    const msg = decode(raw);
    if (msg === null) { return; }
    if (msg.type === MSG_SUBSCRIBE) {
      if (!canRead(msg.name, state.ctx)) {
        sendRaw(sock, encode({ type: MSG_ERROR, name: msg.name, reason: 'forbidden' }));
        return;
      }
      // msg.persist is `true` when the client explicitly opted in via
      // `liveSignal(x, name, { persist: true })`. Omitted on the wire when
      // the client has no positive opinion (the default-false case), in which
      // case we pass undefined so recordPersist does not treat it as a
      // declaration that could mismatch.
      recordPersist(msg.name, msg.persist === true ? true : undefined);
      cancelTransientDrop(msg.name);
      state.subscribed.add(msg.name);
      getSubs(msg.name).add(sock);
      const entry = registry.get(msg.name);
      const values = entry === undefined ? { [msg.name]: undefined } : { [msg.name]: entry.value };
      // For fresh names with no registry entry, send lamport 0 so the
      // client's first CAS write (with ifLamport: 0) matches the server's
      // "no entry yet" baseline.
      sendRaw(sock, encode({ type: MSG_SNAPSHOT, values, lamport: entry?.lamport ?? 0 }));
    } else if (msg.type === MSG_UNSUBSCRIBE) {
      state.subscribed.delete(msg.name);
      getSubs(msg.name).delete(sock);
      scheduleTransientDropIfNeeded(msg.name);
    } else if (msg.type === MSG_SET) {
      handleClientSet(sock, state, msg);
    }
  }

  function handleSocketClose(sock) {
    const state = socketState.get(sock);
    if (state === undefined) { return; }
    for (const name of state.subscribed) {
      getSubs(name).delete(sock);
      scheduleTransientDropIfNeeded(name);
    }
    // User-supplied cleanup hook. Receives the per-connection ctx returned
    // by onConnect (or an empty object). Use this to delete per-user state
    // (presence slots, locks, in-flight writes) instantly on disconnect,
    // without waiting for transient-drop TTLs.
    if (onSocketClose !== null) {
      try { onSocketClose(state.ctx ?? {}, sock); }
      catch (err) { console.error('kensington/live onSocketClose threw:', err); }
    }
    socketState.delete(sock);
  }

  return {
    // Reactive connection-status signal. Always 'connected' server-side.
    // Mirrors `connectLive().status` on the client, so the same Signal type
    // shows up at both ends.
    status: serverTransport.status,
    // Resolved heartbeat interval in ms, or false when disabled. Exposed so
    // SSR can thread the cadence into initial render state, and so diagnostic
    // UIs can show "last beat N ago" relative to a known interval.
    heartbeatInterval,
    // Read/write hooks for server-side code (SSR state threading, ops, etc.)
    get(name) { return registry.get(name)?.value; },
    set(name, value, options = {}) {
      recordPersist(name, options.persist === true);
      applySet(name, value, /* fromSocket = */ null);
    },
    // Walk the in-memory registry. Returns every name that starts with the
    // prefix, including transient signals (persist:false). The earlier
    // behavior of walking the persistence store only is gone; transient
    // names were invisible to discovery and forced callers to set
    // persist:true just to be listable.
    list(prefix) {
      const out = [];
      for (const [name, entry] of registry) {
        if (name.startsWith(prefix)) {
          out.push([name, entry.value]);
        }
      }
      return out;
    },
    // Resolved persist policy for a name. Returns true if the name was
    // declared persisted (via `liveSignal({ persist: true })` or via
    // `live.set(name, value, { persist: true })`), false if declared
    // transient, undefined if the name has never been declared. Use for
    // diagnostic UIs and admin endpoints that want to classify entries
    // returned by `list()` without reimplementing the convention.
    policyOf(name) {
      return persistPolicy.get(name);
    },
    delete(name) {
      cancelTransientDrop(name);
      registry.delete(name);
      persistPolicy.delete(name);
      initialValues.delete(name);
      store.delete(name);
      subs.delete(name);
      // Tear down any server-side Signal cached for this name and clear its
      // observer entry so a fresh `liveSignal(initial, name)` call after the
      // delete rebuilds from the (now absent) registry value.
      const cachedSig = serverSignals.get(name);
      if (cachedSig !== undefined) {
        serverSignals.delete(name);
      }
      nameSubscribers.delete(name);
    },
    close() {
      // Tear down the WebSocket server first so any in-flight broadcast loops
      // don't try to send to terminated sockets. terminate (not close) skips
      // the close-handshake wait; we're shutting down, ack is irrelevant.
      if (attachedWss !== null) {
        if (heartbeatTimer !== null) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        for (const client of attachedWss.clients) {
          try { client.terminate(); } catch { /* socket already gone */ }
        }
        attachedWss.close();
        attachedWss = null;
      }
      for (const handle of transientDropTimers.values()) { clearTimeout(handle); }
      transientDropTimers.clear();
      nameSubscribers.clear();
      serverSignals.clear();
      store.close();
    },

    // Node + `ws` attach mode.
    async attach(httpServer) {
      // Resolve `ws` from the user's app first (same reasoning as the sqlite
      // adapter: dynamic import from inside kensington's location won't find
      // peer deps under `link:` installs).
      let WebSocketServer;
      try {
        const { createRequire } = await import('node:module');
        const { join } = await import('node:path');
        const userRequire = createRequire(join(process.cwd(), 'package.json'));
        ({ WebSocketServer } = userRequire('ws'));
      } catch {
        try {
          ({ WebSocketServer } = await import('ws'));
        } catch {
          throw new Error(
            "kensington/live: liveServer.attach requires the 'ws' package on Node. "
            + 'Install in your project with `npm install ws`.',
          );
        }
      }
      const wss = new WebSocketServer({ server: httpServer, path });
      attachedWss = wss;
      wss.on('connection', async (sock, req) => {
        // Heartbeat. Each socket carries an isAlive flag; the interval below
        // sends a ping and expects the client's automatic pong to flip it back
        // to true before the next tick. Sockets that don't pong are dead even
        // if the OS hasn't surfaced the close yet (silent network drops, NAT
        // timeouts, suspended laptops). Terminating them here makes
        // onSocketClose fire so locks and presence get cleaned up.
        sock._kensingtonAlive = true;
        sock.on('pong', () => { sock._kensingtonAlive = true; });
        await onSocketOpen(sock, req);
        sock.on('message', raw => onSocketMessage(sock, typeof raw === 'string' ? raw : raw.toString('utf8')));
        sock.on('close', () => handleSocketClose(sock));
      });
      if (heartbeatInterval !== false && heartbeatInterval > 0) {
        heartbeatTimer = setInterval(() => {
          for (const sock of wss.clients) {
            if (sock._kensingtonAlive === false) {
              try { sock.terminate(); } catch { /* already gone */ }
              continue;
            }
            sock._kensingtonAlive = false;
            try { sock.ping(); } catch { /* socket in odd state; next pass terminates */ }
          }
        }, heartbeatInterval);
        // Don't keep the event loop alive solely on the heartbeat timer.
        if (typeof heartbeatTimer.unref === 'function') { heartbeatTimer.unref(); }
      }
      return wss;
    },

    // Bun-native websocket config. Caller is responsible for upgrading inside
    // their fetch handler and passing the original request through `data`:
    //
    //   export default {
    //     fetch(req, server) {
    //       if (server.upgrade(req, { data: { req } })) { return; }
    //       return app.fetch(req);
    //     },
    //     websocket: live.bunWebsocket(),
    //   };
    //
    // The `data: { req }` payload is required so `onConnect(ws, req)` can see
    // the original headers/cookies. Without it, onConnect runs with `req` undefined.
    bunWebsocket() {
      return {
        async open(ws) {
          ensureState(ws);
          const req = ws.data?.req ?? null;
          if (onConnect !== null && req !== null) {
            await onSocketOpen(ws, req);
          }
        },
        message(ws, raw) {
          onSocketMessage(ws, typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
        },
        close(ws) { handleSocketClose(ws); },
      };
    },
  };
}
