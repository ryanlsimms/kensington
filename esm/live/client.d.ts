// Type declarations for kensington/live/client.

import type { Signal } from '../../types.js';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface ReconnectOptions {
  /** Initial delay in milliseconds before the first reconnect attempt. Default 250. */
  initialDelay?: number;
  /** Cap on the exponential-backoff delay in milliseconds. Default 30000. */
  maxDelay?: number;
  /**
   * Maximum number of reconnect attempts before the transport gives up and
   * sets `status` to `'disconnected'`. After the cap, no further attempts are
   * scheduled until the caller invokes `transport.reconnect()` (which resets
   * the counter). Default `Infinity` (retry forever, the historical behavior).
   */
  maxRetries?: number;
  /**
   * Retry immediately when the window regains focus or the tab becomes
   * visible again, skipping the remaining backoff delay. Covers a connection
   * dropped for a long time, e.g. a laptop sleep or an internet outage while
   * the tab was in the background. Default true. No-op outside a browser
   * (SSR, Node) regardless of this setting.
   */
  onFocus?: boolean;
}

export interface ConnectLiveOptions {
  /**
   * WebSocket URL. Defaults to `'/__kensington/live'`, which matches the default
   * `path` option of `liveServer`. Override only if your server mounts at a
   * different path or if the WebSocket lives on a different host (e.g.
   * `'wss://api.example.com/__kensington/live'`).
   */
  url?: string;
  /** Exponential-backoff parameters for automatic reconnect. */
  reconnect?: ReconnectOptions;
  /** Called on every status transition. Same value is available via `transport.status`. */
  onStatus?: (status: ConnectionStatus) => void;
}

export interface ClientTransport {
  /**
   * Reactive signal that mirrors the current connection status. Read with `.get()`
   * inside a computed/effect to render a status pill reactively. Updates the same
   * moment `onStatus(status)` fires.
   */
  status: Signal<ConnectionStatus>;
  /** Tear down the transport. Stops reconnect attempts, closes the WebSocket. Terminal. */
  close(): void;
  /**
   * Drop the current WebSocket and immediately re-open. The transport handle
   * stays alive; subscriptions, pending CAS, and the outbound buffer all
   * survive. Resets backoff so reconnect attempts start fast. Use for "reconnect
   * now" buttons or for paths that want to force a fresh snapshot.
   */
  reconnect(): void;
  /** Stop subscribing to a specific name. The Signal returned by liveSignal stays valid locally. */
  unsubscribe(name: string): void;
}

/**
 * Open a WebSocket connection to the live-signals server. Registers the
 * resulting transport as the current process-wide transport, so subsequent
 * `liveSignal(initial, name)` calls route through it. Call once at app boot,
 * before the first render that touches a live signal.
 */
export function connectLive(opts?: ConnectLiveOptions): ClientTransport;

export type WriteTransition<T = unknown> = { prev: T | undefined; next: T };

export type CanWrite<T = unknown, Ctx = any> =
  | 'any'
  | 'server-only'
  | ((name: string, ctx: Ctx, transition: WriteTransition<T>) => boolean);

/**
 * Machine-readable reasons attached to a `LiveSetRejected` Error. Useful for
 * branching in a `.catch` handler without parsing the message string. See the
 * matching type in `kensington/live` for per-value documentation.
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
 * Catch via `instanceof Error` and narrow on `name === 'LiveSetRejected'`.
 */
export interface LiveSetRejected<T = unknown> extends Error {
  name: 'LiveSetRejected';
  signalName: string;
  reason: LiveSetReason;
  attemptedValue: T | undefined;
  authoritativeValue: T | undefined;
}

/**
 * A `Signal<T>` whose `.set` is wrapped by the live transport. Identical to
 * `Signal<T>` except `.set` returns `Promise<void>`. Both value and
 * updater-fn forms return the same type.
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
   * Per-signal write policy. Default `'any'`. See `CanWrite` for the three
   * forms. Enforcement runs on the server. The declaration here is only
   * picked up by the server when this `liveSignal()` call runs on the
   * server (during SSR or top-of-server boot). On the client this option
   * has no enforcement effect; it's safe to declare uniformly in shared
   * component code.
   */
  canWrite?: CanWrite<T>;
}

/**
 * Returns a `LiveSignal<T>` whose value is shared across every connected
 * client by name. Same function as `liveSignal` on the unified
 * `kensington/live` subpath; the client subpath re-exports it so shared
 * component files can import it without pulling the server runtime into a
 * client bundle.
 *
 * Calls before `connectLive()` registers return a placeholder that rewires
 * to the live registry on transport register. Module-scope declarations
 * (`export const x = liveSignal(0, 'name')`) are safe.
 */
export function liveSignal<T>(initial: T, name: string, options?: LiveSignalOptions<T>): LiveSignal<T>;
