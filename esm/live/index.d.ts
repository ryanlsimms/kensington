// Type declarations for kensington/live.
// Shared entry exporting liveSignal plus internal transport hooks.

import type { Signal } from '../../types.js';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export type WriteTransition<T = unknown> = { prev: T | undefined; next: T };

export type CanWrite<T = unknown, Ctx = any> =
  | 'any'
  | 'server-only'
  | ((name: string, ctx: Ctx, transition: WriteTransition<T>) => boolean);

export interface LiveSignalOptions<T = unknown> {
  /**
   * Persistence policy for this name. Default false.
   *
   * - `false` (default): the server keeps the value in memory only; no writes
   *   hit the persistence backend; the entry is dropped from the server
   *   registry 30s after the last subscriber leaves.
   * - `true`: writes flow to the configured persistence backend (memory or
   *   sqlite); the entry stays in the registry until an explicit
   *   `live.delete(name)`.
   *
   * Mirrors the `persist` flag on `ContentTag` options. False is the cheap
   * default that does the least; true is an explicit opt-in for archival
   * behavior. The first declaration wins; mismatched declarations across
   * call sites warn once per name.
   */
  persist?: boolean;
  /**
   * Per-signal write policy. Default `'any'` (any authenticated client can
   * write). `'server-only'` rejects all client writes; only server-side
   * writers (`live.set`, server-side `liveSignal.set`) can mutate. A
   * function form `(name, ctx, { prev, next }) => boolean` lets the server
   * validate identity, value, or the transition. Layered with the global
   * `canWrite` on `liveServer`; both must allow for a write to succeed.
   * First declaration wins per name. The per-signal canWrite must come
   * from a server-side `liveSignal(...)` call (during SSR or top-of-server
   * boot) to be enforced.
   */
  canWrite?: CanWrite<T>;
}

export interface LiveTransport {
  status?: Signal<ConnectionStatus>;
  getOrCreateSignal<T>(name: string, initial: T, options?: LiveSignalOptions<T>): Signal<T>;
}

/**
 * Returns a Signal whose value is shared across every connected client by name.
 * Reads/writes are routed through the registered transport. When no transport
 * is registered (in tests, or before connectLive/liveServer is called),
 * liveSignal returns a regular Signal initialized to `initial` so unit tests
 * don't fail.
 *
 * Naming convention is the scoping mechanism. The runtime is oblivious to URL,
 * user, room, or document. Encode scope in the name string. Common patterns:
 *   'counter:global'         — one global counter
 *   'drafts:user:7'          — per-user state
 *   'doc:42:title'           — per-document property
 *   'cell:sheet:5:A1:raw'    — per-cell raw value
 *
 * Pass `{ persist: true }` to opt into persistence-backend writes and to keep
 * the server's registry entry alive past the last subscriber. Default false.
 */
export function liveSignal<T>(initial: T, name: string, options?: LiveSignalOptions<T>): Signal<T>;

// Re-exports for the unified import path. Users who want explicit
// environment boundaries (client-only / server-only) can still import from
// `kensington/live/client` and `kensington/live/server` directly.
export { connectLive } from './client.js';
export type { ClientTransport, ConnectLiveOptions, ReconnectOptions } from './client.js';
export { liveServer } from './server.js';
export type { LiveServer, LiveServerOptions, PersistenceConfig, MemoryPersistence, SqlitePersistence, BunWebSocketHandlers, LiveSetOptions, AttachedWebSocketServer, AttachedWebSocket } from './server.js';

// Internal. Used by client.js and server.js to install themselves as the
// current transport. Not part of the public API.
export function _registerTransport(transport: LiveTransport): void;
export function _clearTransport(): void;
export function _getTransport(): LiveTransport | null;
