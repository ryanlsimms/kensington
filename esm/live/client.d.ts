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
  /**
   * Called on every WebSocket frame the transport sends or receives. Direction
   * `'out'` for client → server, `'in'` for server → client. `frame` is the
   * already-decoded JSON value (the same shape kensington/live's protocol
   * sends on the wire). Throws inside the callback are swallowed.
   *
   * Use for debug overlays, frame logs, or audit trails. The transport's
   * normal behavior is unaffected. No public surface guarantees the frame
   * shapes beyond the `type` field; reading specific fields is at the
   * caller's risk across kensington versions.
   */
  onFrame?: (direction: 'out' | 'in', frame: unknown) => void;
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
   * Drop the current WebSocket and stay disconnected. The transport handle
   * stays alive; subscriptions and the outbound buffer survive. No reconnect
   * is scheduled. Status becomes `'disconnected'` until `reconnect()` is
   * called. Different from `close()` (terminal) and from `reconnect()` (drops
   * and immediately re-opens). For diagnostic UIs that want to observe the
   * disconnected state indefinitely, or for paths that suspend live traffic
   * without tearing the transport down.
   */
  disconnect(): void;
  /**
   * Drop the current WebSocket and immediately re-open. The transport handle
   * stays alive; subscriptions, pending CAS, and the outbound buffer all
   * survive. Resets backoff so reconnect attempts start fast. Clears any
   * prior `disconnect()` so the transport returns to active. Use for "reconnect
   * now" buttons or for paths that want to force a fresh snapshot.
   */
  reconnect(): void;
  /**
   * Buffer outgoing writes until `resumeSend()` is called. Reads (snapshots,
   * updates) still apply. Already-flushed messages are not retracted; only
   * future `send` calls accumulate. Status signal stays at `'connected'` (the
   * socket is still open; this buffer is application-level). Intended for
   * diagnostic harnesses that want to force CAS contention or observe
   * optimistic-local-apply behavior.
   */
  pauseSend(): void;
  /** Resume sending. Flushes the accumulated outbound buffer in FIFO order. */
  resumeSend(): void;
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
 * Returns a Signal whose value is shared across every connected client by name.
 * Same function as `liveSignal` on the unified `kensington/live` subpath; the
 * client subpath re-exports it so shared component files can import it without
 * pulling the server runtime into a client bundle.
 */
export function liveSignal<T>(initial: T, name: string, options?: LiveSignalOptions<T>): Signal<T>;
