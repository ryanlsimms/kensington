import { t } from 'kensington';

import { code } from '../../components/ui.js';

export function apiLiveSignals() {
  return t.section({ id: 'api-live-signals' }, [
    t.h2('Live signals'),
    t.p([
      'The ',
      t.code('kensington/live'),
      ' subpath ships a server-synchronized signal primitive. With no transport registered, ',
      t.code('liveSignal'),
      ' returns a regular ',
      t.code('signal()'),
      ' so shared components stay unit-testable. See the ',
      t.a({ href: '?page=reactivity#live-signals' }, 'live signals guide'),
      ' for setup, naming, and usage patterns.',
    ]),

    t.h3({ id: 'api-live-signal' }, 'liveSignal'),
    code('typescript', `import { liveSignal } from 'kensington/live';

liveSignal<T>(initial: T, name: string, options?: LiveSignalOptions): Signal<T>

interface LiveSignalOptions {
  persist?: boolean;                    // default false
  canWrite?: CanWrite;                  // default 'any'
}

type CanWrite =
  | 'any'
  | 'server-only'
  | ((name: string, ctx: any, transition: { prev, next }) => boolean);`),
    t.p([
      'Returns a ',
      t.code('Signal<T>'),
      ' shared by name across connected clients. Subsequent calls with the same name in the same process return the same instance. Values must round-trip through ',
      t.code('JSON.stringify'),
      ' (no circular references, BigInts, Maps, Sets, Dates, class instances, functions, or Symbols). Unserializable writes are rejected with a once-per-name warning so local state stays in sync with the broadcast.',
    ]),
    t.p([
      t.code('persist: false'),
      ' (default) is in-memory only and dropped 30 seconds after the last subscriber leaves. ',
      t.code('persist: true'),
      ' writes through to the configured backend (memory or sqlite) and keeps the entry until ',
      t.code('live.delete(name)'),
      '. First declaration per name wins; mismatched flags warn.',
    ]),
    t.p([
      t.code('canWrite'),
      ' defaults to ',
      t.code("'any'"),
      ' (authenticated clients may write). ',
      t.code("'server-only'"),
      ' rejects all client writes. A function predicate validates writes against identity and the proposed transition. Layered with the global ',
      t.code('canWrite'),
      ' on ',
      t.code('liveServer'),
      '; both must allow.',
    ]),

    t.h3({ id: 'api-live-set-fn' }, '.set under multiple clients'),
    t.p([
      'Same signature as a regular signal. Two things change when the value is shared across clients.',
    ]),
    t.ul([
      t.li([
        t.code('.set(value)'),
        ' races against concurrent writers from other clients. Last-write-wins.',
      ]),
      t.li([
        t.code('.set(prev => next)'),
        ' returns a ',
        t.code('Promise<void>'),
        ' that resolves once the server confirms, and ',
        t.code('fn'),
        ' may run more than once, so it must be pure.',
      ]),
    ]),
    t.p([
      'Prefer the updater form whenever the new value depends on the current value.',
    ]),

    t.h3({ id: 'api-connection-status' }, 'Connection status'),
    code('typescript', `type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'`),
    t.p([
      'Read off the handle returned by ',
      t.code('connectLive()'),
      ' or ',
      t.code('liveServer()'),
      '. Server-side ',
      t.code('.status'),
      ' is always ',
      t.code("'connected'"),
      '. Both are reactive ',
      t.code('Signal<ConnectionStatus>'),
      ' values.',
    ]),

    t.h3({ id: 'api-connect-live' }, 'connectLive'),
    code('typescript', `import { connectLive } from 'kensington/live';

connectLive(opts?: ConnectLiveOptions): ClientTransport

interface ConnectLiveOptions {
  url?: string;                       // default '/__kensington/live'
  reconnect?: {
    initialDelay?: number;            // default 250
    maxDelay?: number;                // default 30_000
    maxRetries?: number;              // default Infinity
  };
  onStatus?: (status: ConnectionStatus) => void;
  onError?: (err: unknown) => void;
  onFrame?: (direction: 'out' | 'in', frame: unknown) => void;
}

interface ClientTransport {
  status: Signal<ConnectionStatus>;
  close(): void;                      // terminal
  disconnect(): void;                 // drop + stay disconnected
  reconnect(): void;                  // drop + immediately re-open
  pauseSend(): void;                  // buffer outgoing writes
  resumeSend(): void;                 // flush buffer in FIFO
  unsubscribe(name: string): void;
}`),
    t.p([
      'Opens a WebSocket and registers the transport. Call once at app boot, ',
      t.strong('before'),
      ' any ',
      t.code('liveSignal'),
      ' call. Reconnect is automatic with exponential backoff. ',
      t.code('url'),
      ' defaults to ',
      t.code("'/__kensington/live'"),
      ' (matches ',
      t.code('liveServer'),
      '\'s default path). See the ',
      t.a({ href: '?page=reactivity#live-signals' }, 'live signals guide'),
      ' for setup.',
    ]),
    t.ul([
      t.li([
        t.code('close()'),
        '. Terminal. Stops reconnect attempts and closes the WebSocket. No way back without a fresh ',
        t.code('connectLive()'),
        '.',
      ]),
      t.li([
        t.code('disconnect()'),
        '. Drop the WebSocket and stay disconnected. ',
        t.code('reconnect()'),
        ' to come back.',
      ]),
      t.li([t.code('reconnect()'), '. Drop and immediately re-open. Subscriptions survive. Backoff resets.']),
      t.li([
        t.code('pauseSend()'),
        ' / ',
        t.code('resumeSend()'),
        '. Buffer outgoing writes locally; reads still apply. Status stays at ',
        t.code("'connected'"),
        '.',
      ]),
      t.li([
        t.code('unsubscribe(name)'),
        '. Stop following one name. The local Signal stays valid; updates stop arriving.',
      ]),
      t.li([
        t.code('onFrame'),
        '. Fires per WebSocket frame; ',
        t.code('direction'),
        ' is ',
        t.code("'out'"),
        ' or ',
        t.code("'in'"),
        '. The ',
        t.code('type'),
        ' field is the stable surface for inspection.',
      ]),
      t.li([
        t.code('reconnect.maxRetries'),
        '. After the cap, status transitions to ',
        t.code("'disconnected'"),
        '. ',
        t.code('reconnect()'),
        ' resets the counter.',
      ]),
    ]),

    t.h3({ id: 'api-live-server' }, 'liveServer'),
    code('typescript', `import { liveServer } from 'kensington/live';

liveServer<Ctx = unknown>(opts?: LiveServerOptions<Ctx>): Promise<LiveServer>

interface LiveServerOptions<Ctx> {
  persistence?: PersistenceConfig;    // default { kind: 'memory' }
  canRead?:  (name: string, ctx: Ctx) => boolean;
  canWrite?: CanWrite<Ctx>;           // default 'any'
  onConnect?: (ws: unknown, req: IncomingMessage) => Ctx | Promise<Ctx>;
  onSocketClose?: (ctx: Ctx, ws: unknown) => void;
  path?: string;                      // default '/__kensington/live'
  heartbeatInterval?: number | false; // default 30_000 (ms). false disables.
}

type PersistenceConfig =
  | { kind: 'memory' }
  | { kind: 'sqlite'; path: string; flushInterval?: number };

interface LiveServer {
  status: Signal<ConnectionStatus>;
  readonly heartbeatInterval: number | false;
  get<T = unknown>(name: string): T | undefined;
  set(name: string, value: unknown, options?: { persist?: boolean }): void;
  list(prefix: string): Array<[string, unknown]>;
  policyOf(name: string): boolean | undefined;
  delete(name: string): void;
  close(): void;
  attach(httpServer: HTTPServer): Promise<AttachedWebSocketServer>;
  bunWebsocket(): BunWebSocketHandlers;
}`),
    t.p([
      'Creates the server-side runtime. ',
      t.code('await'),
      ' it at startup. Server-side ',
      t.code('.set'),
      ' calls bypass ',
      t.code('canWrite'),
      '; it gates client writes only.',
    ]),
    t.ul([
      t.li([
        t.code('attach(server)'),
        '. Mounts the WebSocket handler on a Node HTTP server (requires the ',
        t.code('ws'),
        ' peer dep). Returns the underlying ',
        t.code('WebSocketServer'),
        '.',
      ]),
      t.li([
        t.code('bunWebsocket()'),
        '. Returns the handler config to spread into Bun\'s ',
        t.code('websocket'),
        ' slot.',
      ]),
      t.li([
        t.code('onSocketClose(ctx, ws)'),
        '. Fires on WebSocket close. Release per-user state here (locks, presence, in-flight writes).',
      ]),
      t.li([
        t.code('heartbeatInterval'),
        '. Pings + pong-timeout-terminates dead sockets on the ',
        t.code('attach()'),
        ' path, so ',
        t.code('onSocketClose'),
        ' fires after silent drops. ',
        t.code('false'),
        ' disables. No effect on ',
        t.code('bunWebsocket()'),
        '.',
      ]),
      t.li([
        t.code('close()'),
        '. Terminates open WebSocket clients, then closes the WSS, then the persistence store.',
        ' Call from SIGINT before ',
        t.code('httpServer.close()'),
        '.',
      ]),
      t.li([
        t.code('policyOf(name)'),
        '. Resolved persist policy: ',
        t.code('true'),
        ' / ',
        t.code('false'),
        ' / ',
        t.code('undefined'),
        '. Pair with ',
        t.code('list()'),
        ' to classify entries.',
      ]),
      t.li([
        t.code('delete(name)'),
        '. Registry cleanup. Does NOT notify subscribers. Use ',
        t.code('set(name, null)'),
        ' when subscribers should observe the removal.',
      ]),
    ]),
    t.p([
      'Outside ',
      t.code('renderForHydration'),
      ', server-side ',
      t.code('liveSignal(initial, name)'),
      ' returns a long-lived Signal that subscribes to registry updates. Wrap an ',
      t.code('effect()'),
      ' around it to react to client writes and server-side mutations.',
    ]),

    t.h3({ id: 'api-live-subpaths' }, 'Import paths'),
    t.p([
      t.code('kensington/live'),
      '. Recommended. Exports ',
      t.code('liveSignal'),
      ', ',
      t.code('connectLive'),
      ', and ',
      t.code('liveServer'),
      '. Works in Node, Bun, tests, bundlers, and no-bundler importmap deployments; node-only dependencies are dynamic.',
    ]),
    t.p([
      t.code('kensington/live/client'),
      ' (',
      t.code('liveSignal'),
      ' + ',
      t.code('connectLive'),
      ') and ',
      t.code('kensington/live/server'),
      ' (',
      t.code('liveServer'),
      ') exist for users who want environment boundaries enforced at the import level.',
    ]),
  ]);
}
