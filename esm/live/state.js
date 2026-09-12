// Shared transport-state module. Owns the per-process current transport
// registration and the `liveSignal` factory.
//
// This module is intentionally free of any references to the client transport
// (WebSocket) or the server runtime (better-sqlite3, ws). It can be safely
// imported from either side. The `client.js` and `server.js` modules call
// `_registerTransport(...)` to install themselves at startup; `liveSignal`
// reads whichever is registered.
//
// `liveSignal()` returns a Signal whose value is shared by name across every
// process that registers a transport. When called before a transport is
// registered (the common case for module-scope declarations like
// `export const x = liveSignal(0, 'name')`), it returns a placeholder Signal
// that automatically rewires itself to the live registry when a transport
// arrives. Reads and writes both work pre-upgrade. Pre-upgrade writes are
// local to the placeholder. On upgrade the placeholder's current value is
// used as the seed for the registry entry, so single-client / fresh-registry
// flows (tests, first boot) get the pre-upgrade write as their canonical
// value. If the registry already holds a value for that name, the mirror
// effect overwrites the placeholder on upgrade and the local write is
// discarded in favour of the authoritative value.

import { _internalEffect, signal as _signal } from '../lib/reactive/signal.js';

let currentTransport = null;
const pending = new Set(); // each entry. { placeholder, name, initial, opts }

function upgradePlaceholder(rec, transport) {
  const { placeholder, name, opts } = rec;
  const liveInitial = placeholder.value;
  const real = transport.getOrCreateSignal(name, liveInitial, opts);

  // Mirror remote-originated changes from real to the placeholder. The
  // internal effect keeps real subscribed for the placeholder's lifetime so
  // it does not auto-sleep, and skips the out-of-scope warning since its
  // lifetime is tied to the placeholder, not user-land scope.
  const mirror = _internalEffect(() => { placeholder._setFromRemote(real.get()); });

  // Local writes route through real, which broadcasts to peers and updates
  // real.value synchronously (both value and updater-fn forms). Reflect the
  // post-write value into the placeholder so DOM bindings and other
  // subscribers see the new value in the same turn. The mirror's eventual
  // echo is a no-op via the same-value short-circuit in `_setFromRemote`.
  placeholder.set = valueOrFn => {
    const result = real.set(valueOrFn);
    placeholder._setFromRemote(real.value);
    return result;
  };

  // Stop tears down both sides. Restore the placeholder's own stop bound to
  // its own internals so the prototype's stop logic (subscriber clear,
  // devtools cleanup) still runs.
  const origStop = Object.getPrototypeOf(placeholder).stop.bind(placeholder);
  placeholder.stop = () => {
    mirror.stop();
    real.stop();
    origStop();
  };
}

export function _registerTransport(transport) {
  currentTransport = transport;
  if (pending.size === 0) { return; }
  const drained = [...pending];
  pending.clear();
  for (const rec of drained) { upgradePlaceholder(rec, transport); }
}

export function _clearTransport() {
  currentTransport = null;
}

export function _getTransport() {
  return currentTransport;
}

function validateCanWrite(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === 'any' || value === 'server-only') {
    return value;
  }
  if (typeof value === 'function') {
    return value;
  }
  throw new TypeError(
    "liveSignal options.canWrite must be 'any', 'server-only', or a function (name, ctx, transition) => boolean",
  );
}

export function liveSignal(initial, name, options = {}) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('liveSignal(initial, name) requires a non-empty string name as the second argument');
  }
  if (options !== null && typeof options !== 'object') {
    throw new TypeError('liveSignal(initial, name, options) options must be an object');
  }
  const persist = options !== null && options.persist === true;
  const canWrite = options === null ? undefined : validateCanWrite(options.canWrite);
  const transportOpts = canWrite === undefined ? { persist } : { persist, canWrite };

  if (currentTransport !== null) {
    return currentTransport.getOrCreateSignal(name, initial, transportOpts);
  }

  // No transport registered yet. Return a placeholder. The user's reference is
  // preserved across upgrade; only `.set` and `.stop` are rewired when a
  // transport later registers. Pre-upgrade `.set(value)` and `.set(fn)` both
  // route through the default `Signal.prototype.set`, updating only the
  // placeholder's local value. On upgrade the placeholder's value is used as
  // the seed for `transport.getOrCreateSignal`, so pre-upgrade writes survive
  // when the registry has no existing entry for the name.
  const placeholder = _signal(initial);
  placeholder._liveName = name;
  placeholder._isLivePlaceholder = true;

  const rec = { placeholder, name, initial, opts: transportOpts };

  const origStop = placeholder.stop.bind(placeholder);
  placeholder.stop = () => {
    pending.delete(rec);
    origStop();
  };

  pending.add(rec);
  return placeholder;
}
