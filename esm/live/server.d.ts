// Type declarations for kensington/live/server.

import type { Server as HTTPServer, IncomingMessage } from 'node:http';

import type { Signal } from '../../types.js';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface MemoryPersistence {
  kind: 'memory';
}

export interface SqlitePersistence {
  kind: 'sqlite';
  /** Filesystem path for the sqlite database. Created if absent. */
  path: string;
  /** Debounce window in ms for write flushes. Default 250. */
  flushInterval?: number;
}

export type PersistenceConfig = MemoryPersistence | SqlitePersistence;

export type WriteTransition<T = unknown> = { prev: T | undefined; next: T };

/**
 * Write policy. Three forms:
 *
 * - `'any'` (default): any authenticated client may write.
 * - `'server-only'`: no client may write. Server-side writers
 *   (`live.set`, server-side `liveSignal.set`) still apply.
 * - Function: receives `(name, ctx, { prev, next })`. Returning false
 *   rejects the write. The third argument is optional; predicates that
 *   ignore it (the existing two-arg form) continue to work.
 */
export type CanWrite<T = unknown, Ctx = unknown> =
  | 'any'
  | 'server-only'
  | ((name: string, ctx: Ctx, transition: WriteTransition<T>) => boolean);

export interface LiveServerOptions<Ctx = unknown> {
  /** Persistence adapter. Defaults to `{ kind: 'memory' }`. */
  persistence?: PersistenceConfig;
  /** Per-name read gate. Receives the live signal name and the context returned by `onConnect`. */
  canRead?: (name: string, ctx: Ctx) => boolean;
  /**
   * Global write policy. Applied to every client write before any
   * per-signal `canWrite` check. Defaults to `'any'`. See `CanWrite`.
   */
  canWrite?: CanWrite<unknown, Ctx>;
  /**
   * Called once per WebSocket connection. Return a context object that will be
   * threaded into `canRead`/`canWrite` on every message from that socket.
   * Use this to read cookies, validate tokens, attach a user id, etc.
   */
  onConnect?: (ws: unknown, req: IncomingMessage) => Ctx | Promise<Ctx>;
  /**
   * Called when a WebSocket closes. Receives the per-connection `ctx`
   * returned by `onConnect` and the raw socket. Use this to clean up
   * per-user state instantly on disconnect (presence slots, locks,
   * in-flight writes) without waiting for transient-drop TTLs.
   */
  onSocketClose?: (ctx: Ctx, ws: unknown) => void;
  /**
   * Path the WebSocketServer attaches to. Defaults to `'/__kensington/live'`.
   * The default is deliberately namespaced so it can't collide with user-defined
   * routes. The client's `connectLive({ url })` default matches; override both
   * if you need a different shape.
   */
  path?: string;
  /**
   * Interval in milliseconds between WebSocket heartbeat pings on the
   * `attach()` path. Sockets that miss a pong between intervals are
   * terminated, which causes `onSocketClose` to fire so per-user state
   * (locks, presence) gets cleaned up after silent drops (NAT timeouts,
   * suspended laptops). Defaults to `30_000`. Pass `false` to disable.
   * Has no effect on `bunWebsocket()`; Bun's own server config owns
   * idle-timeout and ping behavior for that path.
   */
  heartbeatInterval?: number | false;
}

/**
 * Structural type for the WebSocket sockets surfaced via
 * `AttachedWebSocketServer.clients` and the `connection` event. Covers the
 * methods consumers actually call (terminate, close, send, ping, on,
 * removeListener) plus the standard readyState getter. The full type lives in
 * `@types/ws`; users who need every property of `ws.WebSocket` can import it
 * directly. Most diagnostic use cases (admin "kill this socket", custom event
 * listeners) need only the structural form.
 */
export interface AttachedWebSocket {
  readonly readyState: number;
  terminate(): void;
  close(code?: number, reason?: string): void;
  send(data: unknown, cb?: (err?: Error) => void): void;
  ping(data?: unknown): void;
  on(event: 'message', listener: (data: unknown) => void): this;
  on(event: 'close' | 'open' | 'error' | 'pong' | 'ping', listener: (...args: unknown[]) => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this;
  removeListener(event: string, listener: (...args: unknown[]) => void): this;
}

/**
 * Structural type for the WebSocketServer returned by `attach()`. Mirrors the
 * surface actually exercised by consumers (clients, close, event listeners).
 * Full type lives in `@types/ws`. Importing the structural form keeps `ws`
 * optional at the type level.
 */
export interface AttachedWebSocketServer {
  readonly clients: Set<AttachedWebSocket>;
  close(cb?: (err?: Error) => void): void;
  on(event: 'connection', listener: (sock: AttachedWebSocket, req: IncomingMessage) => void): this;
  on(event: 'close' | 'error' | 'listening', listener: (...args: unknown[]) => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this;
}

export interface BunWebSocketHandlers {
  open(ws: unknown): Promise<void>;
  message(ws: unknown, raw: string | ArrayBuffer | Uint8Array): void;
  close(ws: unknown): void;
}

export interface LiveSetOptions {
  /**
   * Persistence policy for this name. Default false (in-memory only, no
   * backend write). Passing `true` opts into the configured persistence
   * backend. The first declaration wins across all writers (clients via
   * `liveSignal`, server code via `live.set`); mismatched flags warn once
   * per name.
   */
  persist?: boolean;
}

export interface LiveServer<Ctx = unknown> {
  /**
   * Reactive connection-status signal. Server-side never disconnects, so the
   * value is always 'connected'. Exposed for parity with `connectLive().status`
   * so the same Signal type appears at both ends.
   */
  status: Signal<ConnectionStatus>;
  /**
   * Resolved heartbeat interval in milliseconds, or `false` if heartbeats are
   * disabled. Mirrors the configured `heartbeatInterval` option. Read for SSR
   * state threading (so clients can render "last beat N ago" relative to a
   * known cadence) or for diagnostic UIs.
   */
  readonly heartbeatInterval: number | false;
  /** Read the current value for a name. Returns undefined if the registry has no entry yet. */
  get<T = unknown>(name: string): T | undefined;
  /**
   * Write a value from server-side code. Updates the registry and broadcasts to
   * all subscribers. Persists only when the per-name policy is true (declared
   * via `liveSignal({ persist: true })` or via `live.set(name, value, { persist: true })`).
   */
  set(name: string, value: unknown, options?: LiveSetOptions): void;
  /** Return all `[name, value]` pairs whose name starts with the prefix. Useful for SSR state pull-down. */
  list(prefix: string): Array<[string, unknown]>;
  /**
   * Resolved persist policy for a name. Returns `true` if the name was
   * declared persisted, `false` if declared transient, `undefined` if the
   * name has never been declared. Pair with `list()` to classify entries in
   * diagnostic UIs without reimplementing the persist convention.
   */
  policyOf(name: string): boolean | undefined;
  /**
   * Return the context object returned by `onConnect` for a connected socket.
   * Returns `undefined` if the socket is not tracked (not connected via
   * `attach()`, or already closed). Use to correlate `wss.clients` entries
   * with the per-socket identity established during connection without casting
   * to `any`.
   *
   * ```ts
   * for (const ws of wss.clients) {
   *   const ctx = live.contextFor(ws);  // typed as Ctx | undefined
   *   if (ctx) { ... }
   * }
   * ```
   */
  contextFor(ws: unknown): Ctx | undefined;
  /** Remove a name from the registry, persistence, and any subscribers. */
  delete(name: string): void;
  /** Shut down the live server. Flushes pending persistence writes and closes the database. */
  close(): void;
  /**
   * Node attach mode. Mounts a WebSocketServer on the given HTTP server at `path` (default `/live`).
   * Requires the `ws` peer dependency. **Async**. Returns a `Promise`; `await`
   * it at app boot before listening on the HTTP server (the `ws` peer is
   * loaded lazily so a Bun-only project pays nothing for it).
   *
   * The resolved value is the underlying `ws` `WebSocketServer` so callers can
   * iterate `clients`, listen for connections, or invoke `terminate()` directly.
   * Typed as a structural subset (`AttachedWebSocketServer`) so consumers don't
   * have to import the `ws` types just to satisfy TypeScript. Use `import type
   * { WebSocketServer } from 'ws'` for the full surface.
   */
  attach(httpServer: HTTPServer): Promise<AttachedWebSocketServer>;
  /**
   * Bun attach mode. Spread the result into the default-export's `websocket` slot.
   * The caller must upgrade the request inside their fetch handler with
   *   server.upgrade(req, { data: { req } })
   * so `onConnect(ws, req)` can read headers off the original request.
   */
  bunWebsocket(): BunWebSocketHandlers;
}

/**
 * Create the server-side live-signals runtime. Owns the per-name registry,
 * the persistence adapter, and the WebSocket multiplexer. The shared component
 * is NOT re-run on the server when state changes; live updates flow directly
 * through the WebSocket connections.
 */
export function liveServer<Ctx = unknown>(opts?: LiveServerOptions<Ctx>): Promise<LiveServer<Ctx>>;
