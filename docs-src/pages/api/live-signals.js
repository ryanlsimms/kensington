import { t } from 'kensington';

import { apiTable } from '../../components/table.js';
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
    code('typescript', `// Both forms return Promise<void>.
sig.set(value: T): Promise<void>
sig.set(fn: (prev: T) => T): Promise<void>`),
    t.p([
      'Same call sites as a regular signal. The return shape and the rejection contract are different.',
    ]),
    t.ul([
      t.li([
        t.code('.set(value)'),
        ' races against concurrent writers from other clients. Last-write-wins.',
      ]),
      t.li([
        t.code('.set(prev => next)'),
        ' converges under concurrent writes (the library retries against the latest server value when another client wrote first). ',
        t.code('fn'),
        ' may run more than once, so it must be pure.',
      ]),
      t.li([
        'Both forms resolve once the server confirms and reject with a ',
        t.code('LiveSetRejected'),
        ' Error on rejection. The server-authoritative value is already applied to the local Signal via ',
        t.code('_setFromRemote'),
        ' before the rejection fires, so ',
        t.code('sig.value'),
        ' inside ',
        t.code('.catch'),
        ' reflects the truth, not the optimistic value.',
      ]),
      t.li([
        'Fire-and-forget callers can ignore the Promise. The library suppresses unhandled-rejection warnings for unawaited / un-',
        t.code('.catch'),
        '\'d returns; ',
        t.code('await'),
        ' and explicit ',
        t.code('.catch'),
        ' still see the rejection.',
      ]),
    ]),
    t.p([
      'Prefer the updater form whenever the new value depends on the current value.',
    ]),

    t.h3({ id: 'api-live-set-rejected' }, 'LiveSetRejected'),
    code('typescript', `type LiveSetReason =
  | 'forbidden'           // canWrite predicate rejected the write
  | 'conflict'            // CAS lamport mismatch (retried internally; surfaced via 'retries-exhausted')
  | 'unserializable'      // value can't round-trip JSON, or contains NaN / Infinity
  | 'disconnected'        // transport is 'disconnected' or the socket dropped mid-flight
  | 'retries-exhausted'   // CAS write retried MAX_CAS_RETRIES times without converging
  | 'unsubscribed'        // signal was .stop()'d while a CAS retry was in flight
  | 'aborted';            // transport was close()'d while the write was in flight

interface LiveSetRejected<T = unknown> extends Error {
  name: 'LiveSetRejected';
  signalName: string;
  reason: LiveSetReason;
  attemptedValue: T | undefined;
  authoritativeValue: T | undefined;
}`),
    t.p([
      'Narrow via ',
      t.code('err instanceof Error && err.name === \'LiveSetRejected\''),
      '. ',
      t.code('attemptedValue'),
      ' is what the caller tried to write; ',
      t.code('authoritativeValue'),
      ' is the server\'s truth at the moment of rejection (already applied to ',
      t.code('sig.value'),
      ' before the rejection fires).',
    ]),
    code('typescript', `try {
  await seat.set(myTabId);
} catch (err) {
  if (err instanceof Error && err.name === 'LiveSetRejected') {
    const e = err as LiveSetRejected<string>;
    toast(\`\${e.signalName}: \${e.reason}. owned by \${e.authoritativeValue}\`);
  }
}`),

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
    onFocus?: boolean;                // default true
  };
  onStatus?: (status: ConnectionStatus) => void;
}

interface ClientTransport {
  status: Signal<ConnectionStatus>;
  close(): void;                      // terminal
  reconnect(): void;                  // drop + immediately re-open
  unsubscribe(name: string): void;
}`),
    t.p([
      'Opens a WebSocket and registers the transport. Call once at app boot, ',
      t.strong('before'),
      ' any ',
      t.code('liveSignal'),
      ' call. Reconnect is automatic with exponential backoff, plus an immediate retry on window focus or tab visibility regain. See the ',
      t.a({ href: '?page=reactivity#live-signals' }, 'live signals guide'),
      ' for setup.',
    ]),
    t.h4('Options'),
    apiTable(['Option', 'Description'], [
      [
        t.code('url'),
        [
          'WebSocket URL. Defaults to ',
          t.code("'/__kensington/live'"),
          ', matching ',
          t.code('liveServer'),
          '\'s default path. Override both together if you need a different path.',
        ],
      ],
      [
        t.code('reconnect'),
        [
          'Reconnect policy. ',
          t.code('initialDelay'),
          ' (ms, default 250) and ',
          t.code('maxDelay'),
          ' (ms, default 30 000) set the exponential-backoff window. ',
          t.code('maxRetries'),
          ' (default ',
          t.code('Infinity'),
          ') caps attempts; once exhausted, status transitions to ',
          t.code("'disconnected'"),
          ' and ',
          t.code('reconnect()'),
          ' resets the counter.',
        ],
      ],
      [
        t.code('reconnect.onFocus'),
        [
          'Retry immediately when the window regains focus or the tab becomes visible again, ',
          'skipping the remaining backoff delay. Covers a connection dropped for a long time, ',
          'such as a laptop sleep or an internet outage while the tab was in the background. ',
          'Fires even after ',
          t.code('maxRetries'),
          ' is exhausted. Default ',
          t.code('true'),
          '. No-op outside a browser.',
        ],
      ],
      [
        t.code('onStatus(status)'),
        [
          'Called each time the connection status changes. Same values as the reactive ',
          t.code('transport.status'),
          ' signal; use the callback form when you need the change outside a reactive context.',
        ],
      ],
    ]),
    t.h4('Transport handle'),
    apiTable(['Method / property', 'Description'], [
      [
        t.code('status'),
        [
          'Reactive ',
          t.code('Signal<ConnectionStatus>'),
          '. Read to drive connection-state UI.',
        ],
      ],
      [
        t.code('close()'),
        [
          'Terminal. Stops reconnect attempts and closes the WebSocket. No way back without a fresh ',
          t.code('connectLive()'),
          '.',
        ],
      ],
      [
        t.code('reconnect()'),
        'Drop and immediately re-open. Subscriptions survive. Backoff resets.',
      ],
      [
        t.code('unsubscribe(name)'),
        'Stop following one name. The local Signal stays valid; updates stop arriving.',
      ],
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

interface LiveServer<Ctx = unknown> {
  status: Signal<ConnectionStatus>;
  readonly heartbeatInterval: number | false;
  get<T = unknown>(name: string): T | undefined;
  set(name: string, value: unknown, options?: { persist?: boolean }): void;
  list(prefix: string): Array<[string, unknown]>;
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
    t.h4('Options'),
    apiTable(['Option', 'Description'], [
      [
        t.code('persistence'),
        [
          t.code("{ kind: 'memory' }"),
          ' (default) keeps state in-process; lost on restart. ',
          t.code("{ kind: 'sqlite', path: './data/live.db' }"),
          ' persists names declared with ',
          t.code('persist: true'),
          ' across restarts. Optional ',
          t.code('flushInterval'),
          ' (ms, default 250) debounces writes so bursts coalesce into single transactions.',
        ],
      ],
      [
        t.code('canRead(name, ctx)'),
        [
          'Per-name read gate called on subscribe. Return ',
          t.code('false'),
          ' to reject; the client receives ',
          t.code('MSG_ERROR'),
          '. ',
          t.code('ctx'),
          ' is the object returned by ',
          t.code('onConnect'),
          '.',
        ],
      ],
      [
        t.code('canWrite'),
        [
          'Global write policy applied before any per-signal ',
          t.code('canWrite'),
          ' check. ',
          t.code("'any'"),
          ' (default) allows all client writes. ',
          t.code("'server-only'"),
          ' blocks all client writes. A function ',
          t.code('(name, ctx, transition) => boolean'),
          ' gates per-name. Rejected writes return ',
          t.code('MSG_SET_FAIL'),
          ' to the originating client.',
        ],
      ],
      [
        t.code('onConnect(ws, req)'),
        [
          'Called once per WebSocket open. Return a context object (sync or async) threaded into ',
          t.code('canRead'),
          ', ',
          t.code('canWrite'),
          ', and ',
          t.code('onSocketClose'),
          '. Use it to read cookies, validate tokens, and attach a user id.',
        ],
      ],
      [
        t.code('onSocketClose(ctx, ws)'),
        [
          'Called once per WebSocket close with the ',
          t.code('ctx'),
          ' from ',
          t.code('onConnect'),
          '. Release per-user state here (presence slots, locks, in-flight writes) ',
          'without waiting for transient-drop TTLs.',
        ],
      ],
      [
        t.code('path'),
        [
          'WebSocket mount path. Defaults to ',
          t.code("'/__kensington/live'"),
          '. Override both this and ',
          t.code('connectLive({ url })'),
          ' together if you need a different path.',
        ],
      ],
      [
        t.code('heartbeatInterval'),
        [
          'Milliseconds between WebSocket pings on the ',
          t.code('attach()'),
          ' path (default ',
          t.code('30_000'),
          '). Sockets that miss a pong are terminated, firing ',
          t.code('onSocketClose'),
          ' so silent drops release locks and presence in ~one interval. ',
          t.code('false'),
          ' disables. No effect on ',
          t.code('bunWebsocket()'),
          '.',
        ],
      ],
    ]),
    t.h4('Handle'),
    apiTable(['Method / property', 'Description'], [
      [
        t.code('attach(server)'),
        [
          'Mounts the WebSocket handler on a Node HTTP server (requires the ',
          t.code('ws'),
          ' peer dep). Returns the underlying ',
          t.code('WebSocketServer'),
          '.',
        ],
      ],
      [
        t.code('bunWebsocket()'),
        ['Returns the handler config to spread into Bun\'s ', t.code('websocket'), ' slot.'],
      ],
      [
        t.code('close()'),
        [
          'Terminates open WebSocket clients, then closes the WSS, then the persistence store. ',
          'Call from SIGINT before ',
          t.code('httpServer.close()'),
          '.',
        ],
      ],
      [
        [
          t.code('get(name)'),
          ', ',
          t.code('set(name, value)'),
          ', ',
          t.code('list(prefix)'),
          ', ',
          t.code('delete(name)'),
        ],
        [
          'Read, write, enumerate, and remove registry entries from server-side code. Server ',
          t.code('set'),
          ' bypasses ',
          t.code('canWrite'),
          '. ',
          t.code('delete'),
          ' is registry cleanup only — does NOT notify subscribers. Use ',
          t.code('set(name, null)'),
          ' when subscribers should observe the removal.',
        ],
      ],
      [
        [
          t.code('heartbeatInterval'),
          ' (read-only)',
        ],
        [
          'The configured heartbeat cadence in milliseconds, or ',
          t.code('false'),
          '. Use for SSR state threading so clients can render "last beat N ago" ',
          'relative to a known interval.',
        ],
      ],
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
