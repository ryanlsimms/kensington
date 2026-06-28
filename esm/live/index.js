// kensington/live unified entry. Re-exports `liveSignal` plus `connectLive`
// (client) and `liveServer` (server) so users can reach the whole API from
// one import:
//
//   import { liveSignal, connectLive, liveServer } from 'kensington/live';
//
// In client bundles that go through a bundler (esbuild, vite, etc.), importing
// from this entry pulls `liveServer` (and transitively `better-sqlite3` and
// `ws`) into the dependency graph. For client-bundled apps, prefer the
// `kensington/live/client` subpath in shared component files. It re-exports
// `liveSignal` and `connectLive` without bringing the server runtime along.
//
// Connection status lives on the transport handles. Read `.status` from the
// return value of `connectLive()` (client) or `liveServer()` (server) when
// imperative wiring needs it, or pass that Signal into the shared component
// as data.

export { connectLive } from './client.js';
export { liveServer } from './server.js';
export { _clearTransport, _getTransport, _registerTransport, liveSignal } from './state.js';
