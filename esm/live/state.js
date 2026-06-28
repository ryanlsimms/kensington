// Shared transport-state module. Owns the per-process current transport
// registration and the `liveSignal` factory.
//
// This module is intentionally free of any references to the client transport
// (WebSocket) or the server runtime (better-sqlite3, ws). It can be safely
// imported from either side. The `client.js` and `server.js` modules call
// `_registerTransport(...)` to install themselves at startup; `liveSignal`
// reads whichever is registered.
//
// Splitting this out of the unified `index.js` lets `kensington/live/client`
// re-export `liveSignal` without pulling `liveServer` into a client bundle.

import { signal as _signal } from '../lib/reactive/signal.js';

let currentTransport = null;
let warnedNoTransport = false;

// Detect a production environment. In Node, NODE_ENV is the canonical signal.
// In the browser (no `process`), assume development. Setting
// `globalThis.__KENSINGTON_LIVE_SUPPRESS_NO_TRANSPORT__ = true` silences the
// no-transport warning regardless (useful for tests that intentionally
// exercise the fallback).
function shouldWarnNoTransport() {
  if (warnedNoTransport) { return false; }
  if (typeof globalThis !== 'undefined' && globalThis.__KENSINGTON_LIVE_SUPPRESS_NO_TRANSPORT__ === true) {
    return false;
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return false;
  }
  return true;
}

export function _registerTransport(transport) {
  currentTransport = transport;
}

export function _clearTransport() {
  currentTransport = null;
}

export function _getTransport() {
  return currentTransport;
}

// Test-only. Reset the warned flag so unit tests can assert the warning fires.
export function _resetNoTransportWarning() {
  warnedNoTransport = false;
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
  if (currentTransport === null) {
    // No transport configured. Degrade gracefully to a regular signal so a
    // shared component file can be unit-tested without spinning up a live
    // server or client. Tag the signal with the name so debugging is easier.
    // In a dev environment, emit a one-shot warning so a missed `await
    // liveServer({...})` (boot order trap) does not silently produce
    // dangling non-synchronized signals.
    if (shouldWarnNoTransport()) {
      warnedNoTransport = true;
      console.warn(
        `kensington/live: liveSignal('${name}', ...) was called before a transport was registered. `
        + 'Falling back to a non-synchronized local signal. '
        + 'Did you forget to await liveServer({...}) (server) or connectLive(...) (client) at boot? '
        + 'In tests where this is intentional, set globalThis.__KENSINGTON_LIVE_SUPPRESS_NO_TRANSPORT__ = true.',
      );
    }
    const sig = _signal(initial);
    sig._liveName = name;
    return sig;
  }
  const transportOpts = { persist };
  if (canWrite !== undefined) {
    transportOpts.canWrite = canWrite;
  }
  return currentTransport.getOrCreateSignal(name, initial, transportOpts);
}
