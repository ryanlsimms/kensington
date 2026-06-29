// Type declarations for kensington/live.
// Shared entry exporting liveSignal plus internal transport hooks.

import type { Signal } from '../../types.js';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export type WriteTransition<T = unknown> = { prev: T | undefined; next: T };

export type CanWrite<T = unknown, Ctx = any> =
  | 'any'
  | 'server-only'
  | ((name: string, ctx: Ctx, transition: WriteTransition<T>) => boolean);

/**
 * Machine-readable reasons attached to a `LiveSetRejected` Error. Useful for
 * branching in a `.catch` handler without parsing the message string.
 *
 * - `'forbidden'`: the server's `canWrite` predicate rejected the write.
 * - `'conflict'`: a CAS write's `ifLamport` did not match the server's
 *   lamport. Only fires on `.set(fn)` writes; the library retries
 *   automatically up to `MAX_CAS_RETRIES`, so this reason reaches user
 *   code only when the retry cap is exhausted via the `'retries-exhausted'`
 *   path below.
 * - `'unserializable'`: the value cannot round-trip through `JSON.stringify`
 *   (circular reference, BigInt, function, Symbol, top-level undefined) or
 *   contains `NaN`/`Infinity`/`-Infinity` (which `JSON.stringify` would
 *   silently coerce to `null`).
 * - `'disconnected'`: the transport is in the `'disconnected'` state, or
 *   the WebSocket dropped while the write was in flight. The local Signal
 *   is unchanged for new writes; in-flight writes already had their
 *   optimistic apply, which the snapshot on reconnect will reconcile.
 * - `'retries-exhausted'`: a CAS write was retried `MAX_CAS_RETRIES` times
 *   without converging. High contention.
 * - `'unsubscribed'`: the signal was `.stop()`'d while a CAS retry was
 *   in flight.
 * - `'aborted'`: the transport was `close()`'d while the write was
 *   in flight.
 */
export type LiveSetReason =
  | 'forbidden'
  | 'conflict'
  | 'unserializable'
  | 'disconnected'
  | 'retries-exhausted'
  | 'unsubscribed'
  | 'aborted';

/**
 * Structured Error thrown (via Promise rejection) by `liveSignal.set(...)`.
 *
 * Catch via `instanceof Error` and narrow on `name === 'LiveSetRejected'`.
 * The structured fields let UI code surface the rejection without parsing
 * the message string.
 *
 * ```ts
 * try { await sig.set(value); }
 * catch (err) {
 *   if (err instanceof Error && err.name === 'LiveSetRejected') {
 *     const e = err as LiveSetRejected<string>;
 *     toast.show(`${e.signalName}: ${e.reason}`);
 *   }
 * }
 * ```
 */
export interface LiveSetRejected<T = unknown> extends Error {
  name: 'LiveSetRejected';
  /** The live signal's name (the second argument to `liveSignal()`). */
  signalName: string;
  /** Machine-readable cause. See `LiveSetReason`. */
  reason: LiveSetReason;
  /**
   * The value the caller tried to write. `undefined` only for the
   * `'disconnected'` reason on a CAS retry that never produced a candidate
   * value, or for `'retries-exhausted'` after the retry buffer was cleared.
   */
  attemptedValue: T | undefined;
  /**
   * The server's authoritative value at the moment of rejection. Already
   * applied to the local Signal via `_setFromRemote` before this Error
   * fires, so `sig.value` reflects this value when the `.catch` runs.
   * `undefined` for client-side rejections that did not round-trip the
   * server (`'unserializable'`, `'disconnected'` on a write not yet sent).
   */
  authoritativeValue: T | undefined;
}

/**
 * A `Signal<T>` whose `.set` is wrapped by the live transport.
 *
 * Identical to `Signal<T>` except `.set` returns `Promise<void>` that
 * resolves on server confirmation and rejects with a `LiveSetRejected`
 * Error on rejection. Both the value form (`.set(value)`) and the updater
 * form (`.set(prev => next)`) return the same type. Fire-and-forget
 * callers can ignore the Promise; the library suppresses
 * unhandled-rejection warnings for unawaited / un-`.catch`'d returns,
 * while `.catch` and `await` still observe the rejection.
 */
export interface LiveSignal<T> extends Signal<T> {
  set(valueOrFn: T | ((current: T) => T)): Promise<void>;
}

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
  getOrCreateSignal<T>(name: string, initial: T, options?: LiveSignalOptions<T>): LiveSignal<T>;
}

/**
 * Returns a `LiveSignal<T>` whose value is shared across every connected
 * client by name. Reads / writes are routed through the registered transport.
 *
 * When called before `connectLive` (client) or `liveServer` (server) registers
 * a transport, returns a placeholder that automatically rewires to the live
 * registry when a transport later registers. Module-scope declarations like
 * `export const x = liveSignal(0, 'name')` are safe. Pre-upgrade reads and
 * writes both work locally; the placeholder's current value seeds the
 * registry entry on upgrade. If the registry already holds a value for that
 * name when the transport registers, the authoritative value overwrites the
 * placeholder and any pre-upgrade local write is discarded.
 *
 * Naming convention is the scoping mechanism. The runtime is oblivious to URL,
 * user, room, or document. Encode scope in the name string. Common patterns:
 *   'counter:global'           one global counter
 *   'drafts:user:7'            per-user state
 *   'doc:42:title'             per-document property
 *   'cell:sheet:5:A1:raw'      per-cell raw value
 *
 * Pass `{ persist: true }` to opt into persistence-backend writes and to keep
 * the server's registry entry alive past the last subscriber. Default false.
 */
export function liveSignal<T>(initial: T, name: string, options?: LiveSignalOptions<T>): LiveSignal<T>;

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
