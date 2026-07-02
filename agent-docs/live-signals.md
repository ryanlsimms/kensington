# Live signals

Subdoc of the root `AGENTS.md`. Read this when the app shares state between connected browsers (collab, presence-aware UI, multi-window editing). State lives on the server, identified by a string name; every client subscribes by that name and sees writes from any other client. Built on the existing `signal` primitive plus a thin transport.

## Summary. Read this first

```js
// Shared component file
import { t, signal } from 'kensington';
import { liveSignal } from 'kensington/live';

export function counter(state, ctx) {
  const count = liveSignal(state.count ?? 0, 'counter');   // shared, synced
  const draft = signal('');                                // local-only
  return t.button({ onclick: () => count.set(c => c + 1) }, count);
}
```

The only new primitive is `liveSignal(initial, name, options?)`. Everything else is standard kensington: `.get()`, `.set()`, `.transform()`, and `.mapWithKey()` all work on a live signal exactly as on a regular signal. Use `.get()` to read, as with any signal. Computeds derived from a live signal stay local; each client recomputes from identical inputs.

The third argument is an options bag. Today it accepts one field, `persist` (boolean, default false). See "Persistence policy" below.

**Naming is scoping.** The runtime is oblivious to URL, user, room, or document. The user encodes scope in the name. Common patterns: `'counter:global'`, `'drafts:user:7'`, `'doc:42:title'`, `'cell:sheet:5:A1:raw'`.

**TypeScript narrowing on initial values.** Same trap as plain `signal()` (see `agent-docs/reactive.md` → "TypeScript inference for literal initial values"). `liveSignal({ users: [] }, 'presence:list')` infers `Signal<{ users: never[] }>` and later `.set({ users: [me, you] })` fails to typecheck. Fix the same way at every `liveSignal` call whose initial form doesn't exhibit the full value shape. Pass the type parameter explicitly, or annotate the array inside the initial.

```ts
// Pass the type parameter.
const presence = liveSignal<PresenceList>({ users: [] }, 'presence:list');

// Or annotate the array inside the initial.
const presence = liveSignal({ users: [] as User[] }, 'presence:list');

// Same trap with arrays. `liveSignal([], 'stickies')` infers `Signal<never[]>`.
const stickies = liveSignal<Sticky[]>([], 'sticky-list');
```

The runtime accepts any value. Only the static type is narrow.

**Three calls to set up.** One per environment:

- Component file: `liveSignal(initial, name)`. Works in both server and client.
- Server entry: `liveServer({ persistence, canRead, canWrite, onConnect, onSocketClose, heartbeatInterval })`, then `.attach(httpServer)` (Node) or spread `.bunWebsocket()` into the Bun default-export's `websocket` slot. `.attach()` returns the underlying `ws` `WebSocketServer` so you can iterate `clients` or call `terminate()` directly when implementing admin or diagnostic features.
- Client entry: `connectLive({ url, reconnect, onStatus, onFrame })` before the first render that touches a live signal. `onFrame(dir, frame)` fires on every WebSocket frame (`'out'` or `'in'`) for debug overlays, frame logs, and audit trails.

**One import path. `kensington/live`.** Everything you need is here. `liveSignal`, `connectLive`, `liveServer`, types. Safe to import on both server and client. Works for bundler users (esbuild, Vite, etc.) AND for no-bundler importmap deployments. All node-only dependencies (`ws`, `better-sqlite3`, `node:http`) are loaded via lazy dynamic import inside `liveServer()` and `attach()`, so a browser that fetches `/lib/kensington/esm/live/index.js` from a static-served `node_modules` never resolves them. For bundlers (esbuild `--platform=browser`, Vite browser build), the package exports map includes a `browser` condition on `kensington/live` that automatically resolves to the client-only subpath, so server deps are never bundled. The narrower subpaths `kensington/live/client` and `kensington/live/server` exist for users who want environment boundaries enforced at the import level; the unified path is the default.

Connection status is not a separate export. It is a `.status` field on the handle returned by `connectLive()` (client) and `liveServer()` (server).

**When to use this vs. a regular signal:**

- Local UI state (text-input drafts, hover, expanded toggles) → `signal`.
- State that should survive a refresh OR be visible to other connected tabs → `liveSignal`.
- Derived values (counts, filters, formatted strings) → `computed`. Always recomputes locally from inputs; never use `liveSignal` for derivations.
- Race-sensitive counters or atomic increments → `liveSignal` with caveat (see "Last-write-wins" below).

**When NOT to use it:** character-level collaborative text editing. `liveSignal` set on a whole document body is last-write-wins, which loses characters under concurrent typing. Use op-based sync (see `local-notes/collab-pad/` for an example) instead.

### When to read which section

| Task | Section |
|---|---|
| Basic server + client wiring | Server entry / Client entry |
| Bundle `kensington/live` with esbuild | Bundler setup (esbuild) |
| Atomic read-modify-write (counter, list append, flag toggle) | Atomic updates with .set(fn) |
| Restrict which clients or roles can write | canRead / canWrite |
| Presence: add this tab on connect, remove on close | Joining a presence list on connect |
| Keep a live signal subscribed during conditional rendering or tab-swap | The auto-unsubscribe trap |
| Group per-entity signals (auction, document, room) | Organizing per-entity signals with a domain factory |
| React to live signal changes on the server (aggregation, logging) | Server-side liveSignal as a reactive subscription |
| Wire reconnect, pauseSend, resumeSend buttons | Transport lifecycle control |
| Log or audit WebSocket frames | Inspecting WebSocket frames |
| Mixing live and local signals in one component | Mixing live and local signals |
| `.stop()` a live signal or prevent auto-disposal | .stop() and auto-disposal |

## Server entry

### Node + Express + `ws`

```js
import http from 'node:http';
import express from 'express';
import { renderForHydration } from 'kensington';
import { liveServer } from 'kensington/live';
import { counter } from './shared/counter.js';

const app = express();

const live = await liveServer({
  persistence: { kind: 'memory' },               // or { kind: 'sqlite', path: './data/live.db' }
  onConnect: (ws, req) => ({ user: decodeSession(req.headers.cookie) }),
  canRead:  (name, ctx) => ctx.user != null,
  canWrite: (name, ctx) => ctx.user != null,
});

app.get('/', (req, res) => {
  const state = { count: live.get('counter') ?? 0 };
  res.type('html').send(renderForHydration(counter, state));
});

const server = http.createServer(app);
await live.attach(server);                       // mounts the WebSocketServer at path '/__kensington/live'
server.listen(3000);
```

### Bun + Hono

```ts
import { Hono } from 'hono';
import { renderForHydration } from 'kensington';
import { liveServer } from 'kensington/live';
import { counter } from './shared/counter.ts';

const app = new Hono();

const live = await liveServer({
  persistence: { kind: 'memory' },
  onConnect: (ws, req) => ({ user: decodeSession(req.headers.get('cookie')) }),
  canRead:  (name, ctx) => ctx.user != null,
  canWrite: (name, ctx) => ctx.user != null,
});

app.get('/', c => {
  const state = { count: live.get('counter') ?? 0 };
  return c.html(renderForHydration(counter, state));
});

export default {
  port: 3000,
  fetch(req, server) {
    if (new URL(req.url).pathname === '/__kensington/live' && server.upgrade(req, { data: { req } })) {
      return;                                    // upgrade returns synchronously; close the fetch handler
    }
    return app.fetch(req, { server });
  },
  websocket: live.bunWebsocket(),
};
```

The `data: { req }` payload is required so `onConnect(ws, req)` can see the original headers. Without it, `req` arrives as `undefined`.

### Persistence backend

The server-side `persistence` option selects WHERE persisted writes land. Per-signal `{ persist: true }` (see "Persistence policy" below) opts into using whichever backend is configured.

- `{ kind: 'memory' }` (default). Loses state on process restart. Fine for demos and tests.
- `{ kind: 'sqlite', path: './data/live.db', flushInterval: 250 }`. Writes are debounced (default 250ms) and written in a single transaction. Reads go through an in-memory mirror that's warmed from the database on startup. Requires `better-sqlite3` (optional peer dependency. `npm install better-sqlite3`).

There is intentionally no third-party adapter interface in v1. If you need redis/postgres/etc., re-implement the small adapter shape (`get / set / delete / all / list / close`) directly inside your project.

### Persistence policy

The third argument to `liveSignal(initial, name, { persist })` declares the per-name policy. Default false. Mirrors the `persist` flag on `ContentTag` options. The cheap option is the default at both layers. False on a tag means "stop effects on DOM removal"; false on a live signal means "drop the entry when nobody's listening." `persist: true` is the explicit opt-in for archival behavior.

```js
// Transient. Default. Lives in memory only. Server restart wipes it.
// Dropped from the server registry 30s after the last subscriber leaves.
const cursor = liveSignal({ x: 0, y: 0 }, `cursor:user:${tabId}`);

// Persisted. Writes flow to the configured backend (memory or sqlite). The
// registry entry stays alive until an explicit `live.delete(name)`.
const stickyNote = liveSignal({ x, y, text }, `sticky:${id}`, { persist: true });
```

What each value means concretely.

`persist: false` (default).

- **Backend writes.** Skipped. Even with `persistence: { kind: 'sqlite' }` configured, an transient name never hits disk.
- **Registry lifetime.** Dropped 30s after the last subscriber unsubscribes. The grace period covers brief reconnects and the local sleep-wake cycle. A new subscriber inside the grace window cancels the pending drop and keeps the entry.
- **Cross-boot persistence.** None. Server restart wipes the value.

`persist: true`.

- **Backend writes.** Every `.set()` flows to the configured backend. With a memory backend, that's still in-memory only. The flag and the backend are orthogonal. The flag declares intent. The backend decides destination.
- **Registry lifetime.** Indefinite. The entry stays until `live.delete(name)` or process shutdown.
- **Cross-boot persistence.** With sqlite, yes. The server warms the registry from disk on boot.

The persistence backend (`persistence: { kind: 'memory' | 'sqlite' }`) and the per-signal `persist` flag are orthogonal. The backend says WHERE. The flag says WHETHER. A `persist: true` signal against a memory backend writes to memory (same observable result as the default, but the intent is recorded for the day someone swaps to sqlite). A `persist: false` signal against a sqlite backend never touches disk.

**First declaration wins.** The policy is a property of the name, not of the call site. If `liveSignal('counter', { persist: true })` is declared once and another call passes `{ persist: false }` for the same name, the first wins and a once-per-name warning fires. Set `persist` explicitly at every call site for the same name to silence the warning.

**Disk-warmed names are policy-blank.** On boot, the server reads existing values from sqlite into the in-memory registry but does NOT preset their policy. The first declaration after boot (client SUBSCRIBE or server-side `liveSignal()` call) sets the policy. If no declaration arrives, the policy stays unset. Treated as false for write decisions, but the entry stays in the registry until an explicit declaration says otherwise. This means a code change from `persist: true` to `persist: false` cleanly takes effect on next boot. Old data on disk stays readable until the new transient declaration arrives and its grace-period drop fires.

**Server-side `live.set(name, value, { persist? })`.** The imperative server API accepts the same option. If the policy was already declared (via a client subscribe or a prior server-side `liveSignal`), the option is checked against the stored value and warns on mismatch. Otherwise the option sets the policy.

When to use each.

- **`persist: false`** for high-write, low-value-after-the-moment data. Cursor positions. Selection rings. "User is typing" indicators. Transient focus state. Anything where last-write-wins seconds-old data isn't worth a disk write or a memory slot once nobody's reading.
- **`persist: true`** for state that should survive a refresh, a reconnect after the grace window, or a server restart. Sticky notes. Document titles. Chat messages. User preferences. Anything where the value defines the application's state, not just its current moment.

### `canRead` / `canWrite`

`canRead` defaults to allow-all. `canWrite` accepts three forms.

```ts
type CanWrite =
  | 'any'                                                              // default. any authenticated client may write.
  | 'server-only'                                                      // no client may write. server writers (live.set, server-side liveSignal.set) still apply.
  | ((name: string, ctx: any, transition: { prev, next }) => boolean); // custom predicate. function form gets the proposed transition.
```

Both layers accept the same shape. `canWrite` lives on `liveServer({ canWrite })` (global) AND on `liveSignal(..., { canWrite })` (per-signal). A client write must pass BOTH the global predicate and the per-signal predicate. Default at each layer is `'any'`.

```js
const live = await liveServer({
  persistence: { kind: 'sqlite', path: './data/live.db' },
  onConnect: (ws, req) => ({ user: decodeSession(req.headers.cookie) }),
  canRead: (name, ctx) => ctx.user != null,
  canWrite: (name, ctx) => ctx.user != null,                           // global: must be authenticated.
});

const currentBid = liveSignal(null, 'auction:current-bid', {
  persist: true,
  canWrite: (name, ctx, { prev, next }) => {                           // per-signal: business rules.
    if (next.userId !== ctx.user.id) { return false; }
    if (next.amount < (prev?.amount ?? 0) + MIN_INCREMENT) { return false; }
    if (prev?.userId === ctx.user.id) { return false; }
    return true;
  },
});

const bidHistory = liveSignal([], 'auction:bid-history', {
  persist: true,
  canWrite: 'server-only',                                             // only server-side writers apply.
});

const proposedBid = liveSignal(null, `proposed-bid:user:${env.userId}`, {
  canWrite: (name, ctx) => name.endsWith(`:user:${ctx.user.id}`),      // owner-only.
});
```

`ctx` is whatever `onConnect(ws, req)` returned. If `onConnect` isn't provided, `ctx` is `{}`.

The third argument `transition` is `{ prev, next }`. `prev` is the current registry value (or `undefined` for fresh names). `next` is the proposed value. Use it to validate transitions: monotonic counters, bidding floors, append-only lists, anything where "is this a legal next state given the current one" is the right question.

The two-argument form `(name, ctx) => boolean` continues to work — predicates that ignore the third argument keep their existing behavior.

**`canWrite` is server-enforced.** The function runs on the server, never on the client. A client cannot bypass `canWrite` by tampering with its local copy — the server has its own copy and runs that one. The function declared in shared code DOES ship to the client's JS bundle, so its rules are visible to an attacker. That's information disclosure, not a security bypass. For predicates whose rules are secrets (fraud heuristics, hidden thresholds), define them in server-only code rather than shared modules.

**Don't use `isBrowser` inside `canWrite`.** `canWrite` always runs on the server, where `isBrowser === false`. `canWrite: !isBrowser` evaluates to `true` and allows all client writes — the opposite of the intent. Use `canWrite: 'server-only'` for "no client can write."

**Rejected client writes** are returned to the originator as `MSG_SET_FAIL` carrying the server's authoritative value + lamport for both `.set(value)` and `.set(fn)`. The client rolls back the optimistic local apply via `_setFromRemote` and rejects the per-call Promise with a `LiveSetRejected` Error (`{ signalName, reason, attemptedValue, authoritativeValue }`). Other clients see nothing — the rejected value never reaches the registry. `MSG_ERROR` is reserved for `canRead` subscribe rejection and is logged via `console.error` (no per-call surface).

`LiveSetRejected` is exported as an importable interface from `kensington/live`. Import it for type-safe error narrowing:

```ts
import type { LiveSetRejected } from 'kensington/live';

try {
  await seat.set(userId);
} catch (err) {
  if (err instanceof Error && err.name === 'LiveSetRejected') {
    const e = err as LiveSetRejected<string>;
    console.log(e.signalName, e.reason, e.attemptedValue, e.authoritativeValue);
  }
}
```

`instanceof LiveSetRejected` is not available — `LiveSetRejected` is an interface, not a class. The `name === 'LiveSetRejected'` check plus the `as LiveSetRejected<T>` cast is the canonical narrowing pattern. The generic `T` matches the signal's value type.

**`canWrite` can read other live state.** The predicate runs synchronously on the server with access to the `live` handle (via closure). Reading `live.get('other:name')` inside the predicate body is safe and composes cleanly. Common pattern: a per-slot write predicate that gates on a separate `meta` signal's `state` field (poll-must-be-open, document-must-be-editable, auction-must-be-active). The read is a plain registry lookup — no subscription, no cycle. Example:

```ts
const liveHandle = await liveServer({ ... });
const vote = liveSignal(null, `vote:poll:${pollId}:user:${userId}`, {
  canWrite: (_name, ctx, { next }) => {
    if (ctx.userId !== userId) { return false; }
    if (next === null) { return true; }                       // allow clear on cleanup paths
    const meta = liveHandle.get(`poll:${pollId}:meta`);
    return meta?.state === 'open';
  },
});
```

`canWrite` must remain synchronous. Returning a Promise is not supported; the predicate is invoked inline during write processing and the registry write blocks on its result.

### Connection lifecycle hooks

`onConnect(ws, req) => ctx | Promise<ctx>`. Called once per WebSocket open. The returned object is threaded into `canRead`, `canWrite`, and `onSocketClose`. Use it to read cookies, validate tokens, attach a user id, anything per-connection.

`onSocketClose(ctx, ws) => void`. Called once per WebSocket close, with the `ctx` from `onConnect`. Use it to clean up per-user state instantly on disconnect (presence slots, locks, in-flight writes) without waiting for transient-drop TTLs. Closes the "abrupt-tab-close leaves stale data" window. Throws inside the callback are caught and logged.

`live.contextFor(ws)`. Returns the `ctx` object that `onConnect` returned for a given socket, or `undefined` if the socket is not tracked. Use this to correlate `wss.clients` entries with the per-socket identity without casting to `any`.

```js
const wss = await live.attach(server);

// Admin endpoint: broadcast a server message to a specific user's socket.
for (const ws of wss.clients) {
  const ctx = live.contextFor(ws);   // typed as Ctx | undefined
  if (ctx?.userId === targetId) {
    ws.send(JSON.stringify({ type: 'notify', message }));
  }
}
```

`liveServer` is generic on its context type. If you annotate `onConnect`'s return type, `contextFor` carries that type through without a cast:

```ts
type SocketCtx = { userId: string; role: 'admin' | 'user' };

const live = await liveServer<SocketCtx>({
  onConnect: (_ws, req) => parseSession(req),  // must return SocketCtx
});

const ctx = live.contextFor(ws);  // SocketCtx | undefined
```

`heartbeatInterval` (default `30_000` ms, `false` to disable). The `attach()` path pings every connected socket on the interval; any socket that does not pong before the next tick is terminated, which fires `onSocketClose`. Without this, silent drops (NAT timeouts, suspended laptops, dead Wi-Fi) leave the socket open from the server's perspective. Locks and presence held by the dead user never release until the OS eventually surfaces the close (minutes to hours, depending on TCP keepalive config). With this, the heartbeat surfaces the dead connection in ~one interval. No effect on `bunWebsocket()`. Configure Bun's `idleTimeout` and `sendPings` in your `Bun.serve` config for the same behavior on that path.

```js
const live = await liveServer({
  persistence: { kind: 'sqlite', path: './data/live.db' },
  onConnect:    (ws, req) => ({ user: decodeSession(req.headers.cookie) }),
  onSocketClose: ctx => {
    if (ctx.user) {
      // set(null) so any server-side aggregator watching these slots
      // re-derives with the user gone. live.delete would skip the
      // notification. See "live.delete is registry cleanup" below.
      live.set(`presence:user:${ctx.user.id}`, null);
      live.set(`typing:user:${ctx.user.id}`, null);
    }
  },
});
```

### Server-side `live.get` / `live.set`

For SSR state threading (so the first paint reflects the current registry value), call `live.get(name)` synchronously inside the route handler and thread the value into the `state` argument of `renderForHydration`. The client picks up the same value when its `liveSignal(initial, name)` is read at hydration; the snapshot the server sends over the WebSocket on connect either matches (silent) or supersedes (the live signal jumps to the newer value).

**Until the first `.set()` lands, the registry has no entry for the name and `live.get(name)` returns `undefined`.** This is true even though the local Signal returned by `liveSignal(initial, name)` reads as `initial` (the seed). The initial value is held only inside the local Signal until something writes through `applySet`. Use `live.get(name) ?? initial` in SSR route handlers, and don't "optimize" a server-side write by skipping it when `sig.value === newValue`. The first server-side write is the one that seeds the registry. Skipping it leaves `live.get` returning undefined and the WebSocket snapshot empty for any later client subscriber.

`live.set(name, value)` is the canonical way to mutate from the server side (cron jobs, webhooks, admin endpoints). It updates the registry, persists, and broadcasts to all subscribed clients exactly as a client-initiated set would.

`live.list(prefix)` returns `[[name, value], ...]` for every name in the in-memory registry that starts with the prefix. Includes transient entries (`persist: false`) since the registry holds both kinds. Useful for SSR state pull-down, presence-style discovery, and any "what names exist right now under this prefix" query.

`live.delete(name)` removes from the registry, persistence, and the cached server-side Signal table. Use when the underlying entity (a deleted document, a removed user) goes away.

**`delete` is registry cleanup, not a value transition.** It does NOT notify existing subscribers and does NOT broadcast a "deleted" frame to clients. Cached server-side Signals (the ones returned by `liveSignal()` on the server) keep their last known value because no `_setFromRemote` is fired; client-side Signals likewise keep their last value. If a reactive aggregator was reading the deleted name, its derived view will continue to count the stale value.

**Use `live.set(name, null)` when you want the deletion to propagate.** A set to null fires the normal write pipeline (broadcast, subscribers notified, server-side observers re-run). Reactive aggregators tallying the slot will re-derive with the slot gone. The transient-drop grace period eventually reclaims the now-null entry. The same applies to clearing a user's slot on `onSocketClose`. Prefer `live.set(name, null)` over `live.delete(name)` whenever a server-side `effect()` or a connected client should observe the change.

`delete` is still the right call for names that should disappear without anyone reacting (admin-initiated removal of a poll that no aggregator watches; cleanup of stale debug entries).

`live.close()` tears down the WebSocket server created by `attach()` (terminates open clients, then closes the WSS), flushes pending sqlite writes, and closes the database. Call it from your SIGINT / SIGTERM handler before `httpServer.close()` so the HTTP server actually drains (open WebSocket upgrades otherwise keep `httpServer.close()` waiting forever).

### Server-side `liveSignal` as a reactive subscription

Outside of `renderForHydration`, `liveSignal(initial, name)` on the server returns a long-lived Signal that subscribes to registry updates. Client writes, other server-side writes via `live.set`, and writes from other server-side `liveSignal` instances all propagate into the local Signal. Wrap a `effect()` around it to react.

```js
import { effect } from 'kensington';
import { liveServer } from 'kensington/live';
import { liveSignal } from 'kensington/live';

const live = await liveServer({ persistence: { kind: 'sqlite', path: './data.db' } });

// Top-of-server boot. Outside any SSR call.
const counter = liveSignal(0, 'counter', { persist: true });

effect(() => {
  // Re-runs every time anyone writes to 'counter' (client or server).
  metrics.gauge('counter', counter.get());
  audit.log('counter changed', counter.get());
});
```

Same call shape everywhere. Two requests for the same auction id (or any same-name lookup, server-side) return the same cached Signal that subscribes to registry updates.

Lifecycle.

- **Caching.** Server-side `liveSignal('foo')` returns the same instance across calls regardless of whether the call is inside `renderForHydration`. The cache is process-global. Identical to how the client transport caches Signals per name. (Earlier versions had a per-request fresh Signal inside SSR mode; that distinction is gone since liveSignal is inherently a shared-by-name primitive.)
- **`.stop()`.** Tears down the subscription and removes the Signal from the cache. The next `liveSignal('foo')` call builds a new instance and re-subscribes.
- **Transient names with server observers stay alive.** The grace-period drop logic counts both client subscribers and server observers. A name declared `persist: false` whose only watcher is a server-side `effect()` stays in the registry as long as the effect is running. Stopping the effect (or calling `sig.stop()`) lets the grace-period drop fire.
- **Self-writes don't double-notify.** A server-side Signal that calls `sig.set(5)` flows through `applySet`. `applySet` notifies the observer callback. The callback calls `sig._setFromRemote(5)`, which sees the value equals the current local value and short-circuits. User effects re-run exactly once per write.

Use cases.

- **Telemetry, metrics, audit logs.** React to every client write.
- **Webhook fan-out.** Forward changes to Slack, Kafka, an event bus.
- **Server-side derivation.** `effect(() => { c.set(deriveFn(a.get(), b.get())); })` makes `c` server-authoritative. Same shape as a kensington-on-the-client `computed`.
- **Cross-system replication.** Forward writes to a second live server, a search index, a CDN cache.

What does NOT work.

- **Reading server-side subscribers from inside `renderForHydration`.** Effects are no-ops in SSR mode. A subscription set up at boot continues running, but a fresh effect created inside an SSR route won't subscribe.
- **Pre-existing references after `live.delete(name)`.** `delete` clears the cache and the observer entry. The Signal you held still works as a local Signal but no longer receives registry updates AND its last value is not cleared. Reactive aggregators reading that Signal will continue to see the stale value. If subscribers need to react to the removal, write `live.set(name, null)` instead; `delete` is for registry hygiene when no one is watching.

### Per-user `liveSignal` names with an SSR placeholder identity

A shared component that reads or writes a per-user signal (`liveSignal(false, \`winner:user:${env.userId}\`)`) faces an awkward question. The server has no per-tab identity at SSR time. The client knows its tab id via `sessionStorage`. So the same call site runs with different `userId` values on each side.

The shape that works:

```js
// shared/auction-page.js
export function auctionPage(state, env) {
  // env.userId differs between SSR and client takeover. That's fine.
  // The SSR call constructs a cached Signal under 'winner:user:ssr'.
  // The client call constructs a cached Signal under
  // 'winner:user:<real-tab-id>'. Two different names, two different
  // signals, no collision.
  const winning = liveSignal(false, `winner:user:${env.userId}`);
  // ...
}

// server.js
res.send(renderForHydration(
  s => auctionPage(s, { userId: 'ssr', userName: '', status: live.status }),
  { auctionId: id },
  'auctionPage',
));

// client.js
registerComponents({
  auctionPage: s => auctionPage(s, { userId: getTabId(), userName: getUserName(), status: live.status }),
});
```

The `winner:user:ssr` entry sticks around on the server (cached like any other named signal). It carries no information and harms nothing. If you want to avoid the placeholder-id entry, gate the call with `isBrowser`:

```js
import { isBrowser } from 'kensington';
const winning = isBrowser
  ? liveSignal(false, `winner:user:${env.userId}`)
  : signal(false);
```

The server then never creates `winner:user:ssr`. The downside is the SSR rendered HTML doesn't reflect the real signal. Usually a non-issue for per-user state since the value is per-tab anyway and the first paint shows the placeholder. Pick based on whether SSR-side correctness for that signal matters.

## Client entry

```js
import { registerComponents } from 'kensington';
import { connectLive } from 'kensington/live';
import { counter } from './shared/counter.js';

// No `url` needed — connectLive defaults to '/__kensington/live', matching
// liveServer's default path. Override only when your server mounts elsewhere
// or the WebSocket lives on a different host (e.g. wss://api.example.com/...).
connectLive({
  reconnect: { initialDelay: 250, maxDelay: 30_000, maxRetries: Infinity },
  onStatus: status => { document.documentElement.dataset.live = status; },
});

registerComponents({ counter });
```

The default path (`'/__kensington/live'`) is deliberately namespaced so it can't collide with user-defined routes (`/live`, `/ws`, `/api/...` etc). Override on both ends if you need a different shape: pass `path` to `liveServer` and `url` to `connectLive`.

`onStatus` receives one of `'connecting'`, `'connected'`, `'reconnecting'`, `'disconnected'`. Render a connection pill from it in your UI. `'disconnected'` is reachable two ways. Either `transport.close()` (terminal until app restart) or `reconnect.maxRetries` exhausted by repeated failed attempts. The latter stops scheduling further attempts; call `transport.reconnect()` to reset the counter and try again.

`connectLive` is fire-and-forget. The transport is a singleton, registered globally. `liveSignal` finds it automatically. There's no per-component wiring.

The transport reconnects with exponential backoff. Writes attempted while disconnected are buffered and replayed on reconnect. Inbound updates missed during the disconnect window are caught up by the snapshot the server sends on (re)connect.

## Bundler setup (esbuild)

`kensington/live` has a `browser` export condition that resolves to a client-only entry (`esm/live/client.js`), which excludes the server deps (`ws`, `better-sqlite3`, `node:fs`, etc.). With `--platform=browser`, esbuild should activate this condition automatically.

In practice, when kensington is installed via a `file:` symlink (the standard local-dev and monorepo setup), esbuild 0.19.x may resolve via the `import` condition instead, pulling in the full entry that lazy-imports Node builtins. The reliable fix is `--external:"node:*"`:

```bash
esbuild src/client.ts \
  --bundle \
  --outfile=public/client.js \
  --format=esm \
  --platform=browser \
  --external:express \
  --external:ws \
  --external:better-sqlite3 \
  "--external:node:*"
```

The quotes around `"--external:node:*"` prevent the shell from glob-expanding `node:*`. The Node built-in imports inside sqlite.js and server.js are all `await import('node:...')` (lazy, never called in the browser), so marking them external lets the bundle include those files without the browser ever trying to resolve the imports at runtime.

**Do not mark `kensington/live` itself as external** (`--external:kensington/live`). That leaves a bare `import { connectLive } from "kensington/live"` in the output that the browser cannot resolve — the whole client module fails to load and nothing reactive works.

**Vite** automatically uses the `browser` export condition and handles this correctly without extra config.

## Last-write-wins, Lamport ordering

All writes are last-write-wins by Lamport counter, assigned server-side. For direct value writes (`sig.set(value)`), if two clients call simultaneously, both reach the server, the server applies them in arrival order, and the later value wins. This is correct for "set this to that" intent (theme changes, status flags, direct overrides) but unsafe for read-modify-write intent.

For read-modify-write — where the new value depends on the current value — use `.set(fn)`. See the next section.

## Atomic updates with `.set(fn)`

When the new value depends on the current value (counter increment, append to a list, toggle a flag, merge into an object), pass a function to `.set` instead of a value. The library handles atomicity automatically via compare-and-swap.

```js
counter.set(n => n + 1);
viewers.set(prev => ({ users: [...prev.users, me] }));
reactions.set(prev => ({ ...prev, [me]: emoji }));
items.set(prev => prev.filter(it => it.id !== removedId));
messages.set(prev => [...prev, { id, text, by: me, at: Date.now() }]);
```

### How it works

1. **The function runs locally for an optimistic apply.** The local Signal updates immediately so the UI is responsive. No spinner needed.
2. **The library sends a CAS request** with the version (Lamport number) the client believed was current.
3. **The server checks the version.** If it matches the registry's current Lamport for the name, the write is applied + broadcast. If it doesn't (because another client got there first), the server rejects with the current authoritative value and Lamport.
4. **On conflict, the library re-runs `fn` against the new authoritative value** and tries again. This loops until success or until a small retry cap is hit.

The end-to-end guarantee: **`fn` always operates on the server's authoritative value.** Concurrent calls converge to the right answer.

```js
// Both tabs call this within milliseconds of each other.
viewers.set(prev => ({ users: [...prev.users, env.userId] }));

// Server applies tab A: { users: [A] }.
// Server applies tab B: fn runs against { users: [A] }, result { users: [A, B] }.
// Both end up in the list. No race.
```

### What `.set(fn)` returns

A Promise that resolves when the server confirms the write, or rejects on permanent failure (canWrite denied, value not serializable, retry cap exhausted). Most callers ignore the return; if you need to know when the write has landed, `await sig.set(fn)`.

### When to use which form

- **`.set(value)`** for direct assignment. Theme changes, status flags, selection changes, anything that overwrites without caring what was there before.
- **`.set(fn)`** when the new value depends on the current one. Lists, objects, counters, anything where read-modify-write would be a race.

### Caveats

- **The function must be pure AND synchronous.** Side effects inside `fn` will run multiple times if the server reports conflicts and the library retries. Async functions (`async fn` or any function that returns a Promise) silently corrupt the value because the Promise serializes to `{}` on the wire. The lint plugin's `kensington/no-async-set` rule catches the syntactic `async` case; the runtime returns nonsense for any other Promise-shaped return.
- **Large values pay the bandwidth.** With `.set(fn)`, the full computed value travels over the wire each retry. Fine for normal-sized collections; consider a server-side writer pattern for genuinely large state.
- **Trust model is "cooperative."** Any authenticated client can write any value via `.set(fn)`. For state where the server must validate transitions (auctions, money, voting), pair `.set(fn)` with a per-signal `canWrite` predicate. See "canRead / canWrite" above.

### Why this replaces the per-user-slot pattern for cooperative state

Earlier versions of this doc recommended per-user slots + a server-side aggregator for collections like a viewers list. That pattern still works and is still the right call when transitions need server-side validation (auctions, locked records, server-authoritative rules). For purely cooperative state, `.set(fn)` is the simpler primitive: clients write directly to the shared signal, the library handles concurrency, no aggregator boilerplate.

## Connection drop and recovery

On disconnect:
- Status flips to `reconnecting`.
- Writes called while disconnected are buffered in the transport.
- Inbound updates from other clients are lost (server has no per-client write log in v1).

On reconnect:
- Server sends a `snapshot` for every subscribed name.
- Snapshots arrive at the client and apply via `_setFromRemote` (no re-broadcast).
- Buffered outbound writes flush.

Server restart with `{ kind: 'sqlite' }`: registry reloads from the database for every name that was previously written with `persist: true`. Clients reconnect and resync. State survives.

Server restart with `{ kind: 'memory' }`: registry is empty after restart, even for `persist: true` signals. The first client to connect re-creates names via their `liveSignal(initial, ...)` calls. Acceptable for demos. Use sqlite for any real use case.

Transient signals (`persist: false`, the default) never round-trip through the backend regardless of `persistence` config. A server restart wipes them; clients reconnect, re-subscribe, and start producing fresh values via their next `.set()` call.

## Organizing per-entity signals with a domain factory

Parameterized live signals (names scoped by auction id, document id, room id) get repetitive when declared inline. The same `liveSignal(initial, builderFor(id), { persist, canWrite })` shape appears in every server-effect, every component, every route handler. First-declaration-wins keeps the runtime correct, but the policy lives in N places and drifts the moment anyone forgets to mirror a change.

The recommended shape is **one factory per entity**, returning a plain object whose properties are the live signals. Every consumer receives the domain object as a parameter. Only the boundary that knows the id calls the factory.

```js
// shared/auction.js. Single source of truth for every auction-scoped signal.
import { liveSignal } from 'kensington/live';

const cache = new Map();

export function makeAuction(id) {
  const cached = cache.get(id);
  if (cached !== undefined) {
    return cached;
  }
  const auction = build(id);
  cache.set(id, auction);
  return auction;
}

function build(id) {
  return {
    id,
    item:        liveSignal(null,           `auction:${id}:item`,        { persist: true, canWrite: 'server-only' }),
    currentBid:  liveSignal(null,           `auction:${id}:current-bid`, { persist: true, canWrite: 'server-only' }),
    bidHistory:  liveSignal([],             `auction:${id}:bid-history`, { persist: true, canWrite: 'server-only' }),
    status:      liveSignal('live',         `auction:${id}:status`,      { persist: true, canWrite: 'server-only' }),
    viewers:     liveSignal({ users: [] },  `auction:${id}:viewers`,     { persist: true }),

    // Per-user signals nest one level deeper.
    forUser(userId) {
      return {
        proposedBid: liveSignal(null,  `auction:${id}:proposed-bid:user:${userId}`),
        winning:     liveSignal(false, `auction:${id}:winner:user:${userId}`, { canWrite: 'server-only' }),
      };
    },
  };
}
```

Then every consumer:

```js
// Component. The one place that converts a JSON id from `state` into a live handle.
import { makeAuction } from './auction.js';

function auctionPage(state) {
  const auction = makeAuction(state.auctionId);
  const me = auction.forUser(env.userId);
  // ... reads and writes look like regular signals ...
  auction.currentBid.get();
  auction.viewers.set(prev => ({ users: [...prev.users, env.userId] }));
  me.proposedBid.set({ amount: 200, ts: Date.now() });
}
```

```js
// Server-effect. Accepts the auction object directly. No makeAuction call inside.
export function startBidValidator(auction, userId) {
  const me = auction.forUser(userId);
  return effect(() => {
    const bid = me.proposedBid.get();
    if (bid === null) { return; }
    // ... validate ...
    auction.currentBid.set(accepted);
  });
}
```

```js
// Server boot. ONE call per id. Pass the resulting object to each effect.
const auctions = new Map();
for (const id of knownIds) {
  auctions.set(id, makeAuction(id));
}
for (const [id, auction] of auctions) {
  startCountdown(auction);
  startBidValidator(auction, userId);
  watchViewersAndSeedPerUserEffects(auction);
}

app.get('/auction/:id', (req, res) => {
  const auction = auctions.get(req.params.id);
  // ... auction.item.value, auction.currentBid.value, etc. ...
});
```

### Why this works

- **One declaration per signal.** The name, initial, persist, and canWrite live in `build()` exactly once. Change a policy by editing one line.
- **Single call boundary.** The factory runs once per id at the place that knows the id (server boot, component receiving SSR state). Pass the handle through. Downstream destructures what it needs.
- **Wrapper identity stable.** The cache means `makeAuction(id)` from three modules returns the same wrapper. Useful when anything keys off the auction reference.
- **The library doesn't know or care.** The factory is plain JS. `liveSignal`'s name-keyed registry guarantees the signals are shared regardless of how many wrappers exist.

### The component is the unavoidable call site

Server-side code passes the auction object as a parameter. No `makeAuction` call lives inside the effects. The component is different. It receives a JSON `state.auctionId` from `renderForHydration` and has to convert that into a live handle. `makeAuction(state.auctionId)` is the one inherent call. The cache reduces every render past the first to a Map lookup.

### When to use the pattern

- Any live signal whose name is parameterized by an entity id. Auctions, documents, rooms, sheets, threads, projects, conversations.
- Any group of related signals (state, history, presence, derived flags) that conceptually belong to the same entity.

When NOT to use it: single-instance signals (a global counter, a process-wide config flag, a "current logged-in user" record). Export the signal directly:

```js
// shared/counter.js
export const counter = liveSignal(0, 'counter', { persist: true });

// elsewhere
import { counter } from './counter.js';
counter.set(n => n + 1);
```

That shape is indistinguishable from a regular `signal()`. The domain-factory pattern only earns its keep when parameterization forces a factory anyway.

### What collapses

The previous SSR-state-threading recommendation (next section) effectively goes away. The component constructs the auction handle from `state.auctionId` and reads `.value` directly. The server-side liveSignal seeds itself from the registry, so SSR sees current values without explicit threading. The `state` object collapses to just the id:

```js
// before, with manual state threading
const state = {
  auctionId: id,
  item:       live.get(itemName(id))       ?? null,
  currentBid: live.get(currentBidName(id)) ?? null,
  history:    live.get(bidHistoryName(id)) ?? [],
  status:     live.get(statusName(id))     ?? 'live',
};

// after, with the factory pattern
const state = { auctionId: id };
// The component does: const auction = makeAuction(state.auctionId);
// reads auction.item.value, auction.currentBid.value, etc.
```

## SSR state threading (v1)

**Prefer the domain-factory pattern above.** When the component constructs its live handle via `makeX(state.id)` and reads `.value` directly, SSR consistency falls out for free. The server-side liveSignal seeds itself from the registry, so `auction.item.value` during SSR is the same value the client will see on hydration. No state threading needed beyond the id.

The original SSR-state-threading guidance still applies in two narrow cases:

1. **Stateless edge-runtime SSR**, where the server has no in-process registry to read from. In this case the `state` blob is the only source of truth at render time. Construct it from a remote fetch and thread it through. See `agent-docs/hydration.md` → "Stateless edge runtimes."
2. **Single-instance signals that don't use a domain factory.** A global counter, a process-wide config. Just declare the signal at module level and import it.

If you DO thread current values through `state.foo`, two rules:

- **Stable initial in the component.** Names written by a top-of-server `liveSignal(initial, name)` + `effect(...)` have the boot-time `initial` recorded in the server's `initialValues` map on first call. A later SSR-side `liveSignal(state.foo ?? 0, name)` that passes a different primitive trips the `initial-value-mismatch` warning. Fix: pass the same stable initial in the shared component as the boot-time declaration uses.
- **Object / array initials are exempt** from the mismatch check by design. `state.history ?? []` and `state.item ?? null` are fine even if the live values differ. The check is specifically for primitives.

```js
// Stable initial. The registry value is the seed automatically; the
// state.* value is redundant and risks the mismatch warning.
const remaining = liveSignal(0, timeRemainingName(auctionId));
```

The plan's "transparent auto-injection" (no manual state threading at all) is deferred to v2. With the domain-factory pattern in place, the auto-injection plan loses most of its motivation.

## `liveSignal` inside a reactive callback

`liveSignal(initial, name)` has the same lazy-registry hazard as plain `signal()`. The first call for a given name creates a fresh `Signal` in the transport's per-name Map; subsequent calls for the same name return the cached instance. If the first call happens inside a `computed`, `effect`, `.transform()` callback, or a `mapWithKey` mapFn, you're creating a reactive primitive inside a reactive scope — and the lint plugin doesn't know to flag it because the call site looks like a Map lookup, not a constructor call.

The fix is the same as for the regular lazy-registry pattern (see `agent-docs/reactive.md` → "Lazy registries called from reactive callbacks"): **eager-seed every name you'll need before any reactive code reads it.** For a spreadsheet, that means iterating `range(rows) × range(cols)` once at component mount and calling `getRaw(addr)` on each; for a presence list, iterate the known users on connect and call `liveSignal(initial, \`sel:user:\${id}\`)` once for each.

After seeding, every later `liveSignal(initial, sameName)` call is a Map lookup that returns the existing Signal. No primitive creation inside the reactive scope, no warning.

**The rule applies to every lazy `liveSignal()` helper, not just the headline one.** If your app has multiple lazy registries — `getWeek(emp, proj, week)` for grid cells, `getRemoteSelection(userId)` for per-user presence rings, `getNotification(id)` for inbox items — every one of them needs the same eager-seed treatment. The bug is class-agnostic. An agent who reads the seed-before-mutate pattern for the headline registry and applies it there only is going to ship a runtime warning the first time any *other* lazy registry gets touched from a reactive callback.

A worked example for the second-class case (per-user selection signals driven by a `presence` list):

```javascript
const remoteSelections = new Map();
function getRemoteSelection(userId) {
  let s = remoteSelections.get(userId);
  if (s === undefined) {
    // kensington-check-reactive-ignore
    s = liveSignal(null, `sel:user:${userId}`);
    remoteSelections.set(userId, s);
  }
  return s;
}

// Wrong. ringForCell is a computed; calling getRemoteSelection(u.id) lazily
// from inside it creates a liveSignal inside the reactive callback the first
// time a new user appears in presence.
function ringForCell(empId, projId, dayIso) {
  return computed(() => {
    for (const u of presence.get().users) {
      const sel = getRemoteSelection(u.id).get();   // ← lazy creation inside computed
      ...
    }
  }, `ring:${empId}:${projId}:${dayIso}`);
}

// Right. Seed all known users' selection signals OUTSIDE any reactive
// callback whenever the presence list changes. Use a top-of-component
// effect that defers the seed work to a microtask so the creation runs
// outside the effect's reactive scope.
let lastPresenceKey = '';
addConnectedCallback(() => {
  const presenceEffect = effect(() => {
    const users = presence.get().users;
    const key = users.map(u => u.id).sort().join(',');
    if (key === lastPresenceKey) { return; }
    lastPresenceKey = key;
    // Defer outside the effect's reactive scope. The microtask runs after
    // the effect finishes, with currentEffect === null, so the liveSignal
    // creation inside getRemoteSelection() does not trip signal-in-effect.
    queueMicrotask(() => {
      for (const u of users) {
        getRemoteSelection(u.id);   // ← creates outside reactive scope
      }
    });
  });
  /* capture the stop handle and call it from addDisconnectedCallback */
});
```

The same shape works for any registry whose key set is discovered at runtime (search results, async-fetched lists, server-pushed items). The `addConnectedCallback` + `effect` + `queueMicrotask` pattern is verbose but the alternative — calling `getRemoteSelection(u.id)` from inside a render computed — fires the runtime warning on every new user.

### Presence list + `mapWithKey` worked example

The most common shape combines a `persist: true` presence list (CAS-merged via `.set(fn)`) with per-tab lazy signals (one keep-alive per visible row), rendered with `mapWithKey('id', ...)`. There are three steps to get right and they don't compose if any one of them is missing.

```js
import { effect, isBrowser, t } from 'kensington';
import { liveSignal } from 'kensington/live';

// 1. Domain factory. One cache, one factory, single source of truth.
const presence = liveSignal({ tabs: [] }, 'presence:tabs', { persist: true });
const perTabCache = new Map();
function forTab(id) {
  let entry = perTabCache.get(id);
  if (entry === undefined) {
    // kensington-check-reactive-ignore. Seeded eagerly before mapWithKey runs.
    entry = {
      name: liveSignal('', `tab:${id}:name`, { persist: true }),
      lastBeat: liveSignal(0, `tab:${id}:lastBeat`),
    };
    perTabCache.set(id, entry);
  }
  return entry;
}

export function presenceGrid() {
  // 2. Synchronous seed BEFORE the first mapWithKey run. The first render
  //    of the grid touches every cell; if forTab(id) lazy-creates inside the
  //    mapFn, the creation lands inside the mapWithKey wrapper's reactive
  //    scope and fires the signal-in-computed warning. Pre-seeding from
  //    presence.value (untracked) avoids it.
  if (isBrowser) {
    for (const tab of presence.value.tabs) { forTab(tab.id); }
  }

  // 3. Late-arriving tabs are seeded by an effect that DEFERS the creation
  //    via queueMicrotask. The effect runs whenever presence changes; the
  //    microtask runs OUTSIDE the effect's reactive scope, so forTab()'s
  //    liveSignal creations are not flagged.
  const root = t.div({ class: 'presence-grid' },
    presence.mapWithKey('id', tab => tabCell(tab, forTab(tab.id))),
  );
  root.addConnectedCallback(() => {
    let lastKey = '';
    const seed = effect(() => {
      const tabs = presence.get().tabs;
      const key = tabs.map(t => t.id).sort().join(',');
      if (key === lastKey) { return; }
      lastKey = key;
      queueMicrotask(() => {
        for (const tab of tabs) { forTab(tab.id); }
      });
    });
    root.addDisconnectedCallback(() => seed.stop());
  });
  return root;
}

function tabCell(tab, sigs) {
  // Per-cell keep-alive. Without it, transient unmounts during reorders
  // would drop lastBeat to zero subscribers, the transport would send
  // MSG_UNSUBSCRIBE, and remote updates between unmount and remount would
  // never re-broadcast. See "The auto-unsubscribe trap" below.
  let keep = null;
  const cell = t.div({ class: 'tab-cell', data: { tabId: tab.id } }, [
    t.span(sigs.name),
    t.span(sigs.lastBeat.transform(t => `${Date.now() - t}ms ago`, `beat-fmt:${tab.id}`)),
  ]);
  cell.addConnectedCallback(() => {
    keep = effect(() => { sigs.name.get(); sigs.lastBeat.get(); });
  });
  cell.addDisconnectedCallback(() => { if (keep !== null) { keep.stop(); keep = null; } });
  return cell;
}
```

Three load-bearing pieces: (1) the cache + factory; (2) synchronous seed of the *initial* tab set from `presence.value` before the first `mapWithKey` run; (3) a `queueMicrotask`-deferred reseed effect for late-arriving tabs. The cell-level keep-alive is the fourth piece, scaling per visible row instead of per known tab.

### Plumbing identity from `connectLive` to `onConnect`

Every app that wants per-tab scope (locks, presence, owner-only writes) has to thread an identifier through the WebSocket handshake. There is no built-in identity layer; the recipe:

```js
// client side. sessionStorage so the id is stable across reloads within the same tab.
function tabId() {
  let id = sessionStorage.getItem('kensingtonTabId');
  if (id === null) {
    id = `t-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('kensingtonTabId', id);
  }
  return id;
}
const transport = connectLive({
  url: `/__kensington/live?u=${encodeURIComponent(tabId())}&n=${encodeURIComponent(displayName())}`,
});
```

```js
// server side. Parse off req.url; onConnect's return is the ctx for every
// canRead, canWrite, and onSocketClose call on this socket.
const live = await liveServer({
  onConnect: (_ws, req) => {
    const params = new URL(req.url ?? '/', 'http://x').searchParams;
    return { userId: params.get('u') ?? '', name: params.get('n') ?? '' };
  },
  canWrite: (_name, ctx) => typeof ctx.userId === 'string' && ctx.userId !== '',
});
```

For real auth, swap the query-string identity for a cookie / JWT / session token check inside `onConnect`. Reject the connection by throwing; the transport's reconnect will keep retrying so the rejection should be permanent (e.g., a wrong session token), otherwise surface the failure to the user via the reactive `status` signal (which transitions to `'disconnected'` after the reconnect cap is exhausted).

### Joining a presence list on connect

Once identity is threaded, the client needs to add itself to the presence signal when the connection is established. The pattern is an `effect` that watches the status signal and performs a CAS add on the first `'connected'` transition.

```js
// shared/app-page.js
import { effect, isBrowser } from 'kensington';
import { liveSignal } from 'kensington/live';

const presence = liveSignal({ tabs: [] }, 'presence:tabs', {
  persist: true,
  canWrite: (_name, ctx) => typeof ctx.userId === 'string' && ctx.userId !== '',
});

export function appPage(state, env) {
  const { userId, status } = env;

  // Only runs in the browser. During SSR, isBrowser is false and effect() is a
  // no-op, so the join never fires server-side.
  if (isBrowser) {
    // Stable color stored in sessionStorage so it doesn't change on reconnect.
    let color = sessionStorage.getItem('tabColor') ?? '';
    if (!color) {
      color = `hsl(${Math.floor(Math.random() * 360)}, 65%, 55%)`;
      sessionStorage.setItem('tabColor', color);
    }

    effect(() => {
      if (status.get() !== 'connected') return;
      // CAS add: only insert if this tab isn't already in the list.
      void presence.set(prev => {
        if (prev.tabs.some(t => t.id === userId)) return prev;
        return {
          tabs: [...prev.tabs, { id: userId, name: env.userName ?? '', color, joinedAt: Date.now() }],
        };
      });
    });
  }

  // ...
}
```

The corresponding server-side removal in `onSocketClose`:

```js
const live = await liveServer({
  onConnect: (_ws, req) => {
    const params = new URL(req.url ?? '/', 'http://x').searchParams;
    return { userId: params.get('u') ?? '' };
  },
  onSocketClose: ctx => {
    if (ctx.userId) {
      void presence.set(prev => ({
        tabs: prev.tabs.filter(t => t.id !== ctx.userId),
      }));
    }
  },
});
```

**Why `isBrowser` guards the join effect.** During SSR, `effect()` is a no-op. But `isBrowser` is still worth the explicit guard because it prevents the color/sessionStorage code from running on the server (where `sessionStorage` is undefined), keeps the server-side module free of client-side side effects, and documents the intent.

**Why the CAS check matters.** The effect re-runs whenever `status` changes to `'connected'`, including on reconnect after a network drop. The `prev.tabs.some(t => t.id === userId)` guard prevents duplicate entries when the server's `onSocketClose` and the reconnect happen close together (the entry may still be in the list if the server hasn't processed the close yet). The `.set(fn)` CAS retry loop means the add is atomic even if two tabs connect simultaneously.

**The remove belongs on the server, not the client.** A `beforeunload` event on the client is unreliable (the browser may not fire it on mobile or crash). `onSocketClose` on the server fires deterministically when the connection closes for any reason, including process kill, network drop, and heartbeat timeout.

## Reading the connection status reactively

The status signal lives on the transport handles. Read `connectLive().status` on the client and `liveServer().status` on the server. Both are reactive `Signal<ConnectionStatus>` values:

- On the client: `'connecting' | 'connected' | 'reconnecting' | 'disconnected'`, updating on every WebSocket lifecycle transition.
- On the server: always `'connected'`. The server doesn't have an outbound socket of its own.

A shared component cannot reach the handle on its own. Pass the signal in as data and wire both entry points:

```js
// shared/status-pill.js. Used by both server and client.
import { t } from 'kensington';
/** @typedef {import('kensington/live').ConnectionStatus} ConnectionStatus */
/** @typedef {import('kensington').Signal<ConnectionStatus>} StatusSignal */

/** @param {StatusSignal} status */
export function statusPill(status) {
  return t.span({ class: status.transform(s => `pill pill-${s}`, 'status-class') }, status);
}
```

TypeScript users: import the type from `'kensington/live'` directly. `ConnectionStatus` is exported from both the unified path and the `client.d.ts` subpath.

```js
// server.js
const live = await liveServer({ /* ... */ });
res.send(renderForHydration(state => statusPill(live.status), state, 'statusPill'));
```

```js
// client.js
const live = connectLive();
registerComponents({ statusPill: state => statusPill(live.status) });
```

The `onStatus` callback option on `connectLive` still fires for imperative consumers; the signal and the callback both update on the same transition.

## Transport lifecycle control

The `ClientTransport` returned by `connectLive` exposes four methods beyond the reactive `status` signal. All four are safe to call repeatedly.

- `transport.close()`. Terminal. Stops reconnect attempts, closes the WebSocket. After this, `liveSignal` calls still return a local Signal but no traffic flows. Use on full app teardown (single-page-app route swap, test cleanup).
- `transport.disconnect()`. Drop the current WebSocket and stay disconnected. The transport handle stays alive; subscriptions and the outbound buffer survive. No reconnect is scheduled; status becomes `'disconnected'` indefinitely. Call `transport.reconnect()` to come back. Different from `close()` (terminal, no way back) and from `reconnect()` (drops and immediately re-opens). Use for diagnostic UIs that want to observe the disconnected state for an unbounded interval, or for paths that intentionally suspend live traffic without tearing the transport down.
- `transport.reconnect()`. Drop the current WebSocket and immediately re-open. The transport handle stays alive; subscriptions, pending CAS, and the outbound buffer all survive. Resets backoff so the first attempt is fast. Clears any prior `disconnect()`. Use for diagnostic "reconnect now" buttons and for paths that need a fresh snapshot (e.g. after the user's identity changes and you want the new ctx applied server-side).
- `transport.pauseSend()` / `transport.resumeSend()`. Buffer outgoing writes locally. Reads (snapshots, updates) still apply. The status signal stays at `'connected'`; the socket is still open, the buffer is application-level. Use to force CAS contention against another client, to observe optimistic-local-apply behavior, or to slow-flush a burst of writes. `resumeSend()` flushes the queue in FIFO order.
- `transport.unsubscribe(name)`. Stop subscribing to a specific name. The local Signal stays valid; it just stops receiving server pushes. Less common than `signal.stop()`, which is the documented way to wind a single live signal down.

## Inspecting WebSocket frames

`connectLive({ onFrame })` fires `onFrame(direction, frame)` on every message the transport sends or receives. `direction` is `'out'` for client → server and `'in'` for server → client. `frame` is the decoded JSON payload (the same shape kensington/live sends on the wire). Use this for debug overlays, audit trails, or to record protocol traffic for replay. The transport behavior is unaffected; throws inside `onFrame` are swallowed.

```js
const transport = connectLive({
  url: '/__kensington/live',
  onFrame: (dir, frame) => {
    console.log(dir === 'out' ? '↑' : '↓', frame.type, frame.name ?? '');
  },
});
```

The frame shapes kensington/live emits (the `type` discriminator is the stable surface; other fields may evolve):

| `type` | Direction | Payload (additional fields) | Purpose |
| ------ | --------- | --------------------------- | ------- |
| `subscribe` | out | `name`, `persist?` | Add this client to a name's subscriber set. |
| `unsubscribe` | out | `name` | Remove this client from a name's subscriber set. |
| `set` | out | `name`, `value`, `lamport`, `ifLamport?`, `opId?` | Client-initiated write. `opId` + `ifLamport` mark a CAS attempt. |
| `snapshot` | in | `values: { [name]: value }`, `lamport` | Sent on `subscribe` (and on reconnect for every previously-subscribed name) with the current value. |
| `update` | in | `name`, `value`, `lamport` | Broadcast of a single name's new value. |
| `batch-update` | in | `updates: Array<{ name, value, lamport }>` | Coalesced broadcast of multiple names that changed in the same server microtask. |
| `set-ok` | in | `name`, `lamport`, `opId` | Acknowledges a write succeeded. Sent for both `.set(value)` and `.set(fn)`. |
| `set-fail` | in | `name`, `reason: 'conflict' \| 'forbidden' \| 'unserializable'`, `lamport`, `value`, `opId` | Rejects a write. `value` always carries the server's authoritative value so the client can roll back the optimistic local apply. |
| `error` | in | `name?`, `reason` | `canRead` subscribe rejection. Logged via `console.error`. Not used for write failures. |

`onFrame` is the only sanctioned hook into the protocol layer. Reading fields beyond `type` is at your own risk across kensington versions.

## Values must be JSON-serializable

Every value that lands in a `liveSignal` travels over the WebSocket as JSON. The transport rejects writes that would crash or silently mangle on serialization:

- **Circular references, BigInts, Maps, Sets, Dates, class instances** — `JSON.stringify` throws or drops data. `.set()` is refused; a once-per-name `console.warn` fires; the local signal stays at its previous value (so local and remote stay in sync).
- **Functions and Symbols** — at the top level these stringify to `undefined`. Same treatment as above. Inside an object they're silently dropped by `JSON.stringify` (this is standard JSON behavior; the transport doesn't try to second-guess it).
- **Plain objects, arrays, strings, numbers, booleans, `null`** — fine.

For values that need richer types (Dates, Maps, etc), shape them as plain JSON before writing: `livedAt.set(date.toISOString())`, `tags.set([...mySet])`. The receiving side re-hydrates with `new Date(value)` etc. in its render code.

## `.stop()` and auto-disposal

Calling `.stop()` on a `liveSignal` does the full teardown: clears local subscribers, removes the name from the transport's registry, and sends an `unsubscribe` to the server. After `.stop()` the signal is dead; future reads return the cached last value but no updates arrive.

You usually don't need to call `.stop()` explicitly. When the live signal's local subscriber count drops to zero (the DOM subtree binding it is removed, computeds derived from it auto-dispose), the transport sends an `unsubscribe` to the server on its own. Any subsequent reactive read (a new `computed` or DOM binding picking up the signal again) sends a fresh `subscribe`, the server replies with a snapshot, and the signal applies it via the remote-update path. Same pattern as kensington's `computed()` auto-disposal — sleep on zero subscribers, wake on first subscriber.

The local `signals` registry inside the transport keeps the signal instance alive across sleep/wake cycles, so identity is stable across reconnects and re-subscriptions. The cycle only tears down when you call `.stop()` explicitly.

### The auto-unsubscribe trap. Transient teardown during construction

Auto-unsubscribe is a feature, not a bug. For a viewport-virtualized grid (see `live-allocations`), it bounds the WebSocket subscription set to whatever names the visible rows touch — exactly what you want. But for an app where a live signal SHOULD stay subscribed for the whole component lifetime, the auto-unsubscribe can fire by accident if the rendering chain's subscriber count drops to zero transiently during construction or hydration.

Concretely: a chain like `signal-content effect → mapWithKey outer computed → transform → liveSignal` provides exactly one subscriber to the liveSignal. If that chain is torn down and rebuilt during initial render (a re-mount, a hydration replacement, a probe phase, anything that releases and reacquires the chain in the same tick), the live signal's subscriber count goes `1 → 0 → 1` and the transport sends `MSG_UNSUBSCRIBE` followed by `MSG_SUBSCRIBE`. The server processes them in order: it removes your socket from `getSubs(name)`, then adds it back. Usually fine. BUT if multiple teardowns happen and the last operation is an unsubscribe, your socket stays OUT of the subscriber list and future broadcasts skip you. Symptom: in tab A you can `liveSignal(...)` read and see snapshots arrive at load, but updates from other clients never come in, even though your local subscriber chain is alive. Reloading the tab gets you a fresh subscription and "fixes" the problem.

You can spot the trap in the dev tools network tab. Look at the WS messages for the live-signals path during page load. If you see a `{"type":"unsubscribe","name":"<your-name>"}` going OUT from the client during construction (i.e., before any user action that should release the signal), the transient teardown happened.

**The fix: pin a persistent local subscriber.** Add a top-level `effect()` inside the component that reads the live signals you want to stay subscribed. The effect's read becomes a permanent subscriber, the live signal's count never hits zero, no transient unsubscribe is sent.

```js
import { effect, isBrowser } from 'kensington';
import { liveSignal } from 'kensington/live';

export function room(state) {
  const presence = liveSignal({ users: [] }, 'presence:list');
  const cursors  = liveSignal({}, 'cursors:everyone'); // persist:false default. Cleaned 30s after last subscriber.

  // Pin the subscriptions. Without this, the rendering chain provides the
  // only subscriber and a transient teardown sends UNSUBSCRIBE to the
  // server. With this, the local sub count stays >= 1 for the component's
  // lifetime; no spurious unsubscribe; broadcasts continue to arrive.
  /** @type {{ stop: () => void } | null} */
  let keepAlive = null;
  if (isBrowser) {
    keepAlive = effect(() => {
      presence.get();
      cursors.get();
    });
  }

  // ... rest of the component ...

  root.addDisconnectedCallback(() => {
    if (keepAlive !== null) { keepAlive.stop(); }
  });

  return root;
}
```

**The same trap on user action, not just construction.** Any rendering pattern that conditionally mounts the only subscriber to a live signal will hit this. The canonical case is an inline-edit cell that swaps `t.input(...)` for the display branch via a `.transform`:

```js
const body = me.editing.transform(isEd => {
  if (isEd) { return t.input(...); }
  return t.div(cell.value.transform(format, `disp:${addr}`)); // ONLY subscriber to cell.value
}, `body:${addr}`);
```

When the user begins editing, the body re-emits the input. The display branch unmounts, its keyed `cell.value.transform` is swept (its key was not accessed in the edit-mode run), `cell.value`'s subscriber count drops to zero, and the client sends `MSG_UNSUBSCRIBE`. Any updates broadcast by other clients during the edit window are not delivered. On commit, the body re-emits the display branch and the client sends `MSG_SUBSCRIBE` again, but the snapshot the server sends races the server-side derivation (e.g. a formula evaluator) that the commit itself triggered. The server may snapshot the pre-commit value, the client may apply it, and the post-commit `MSG_UPDATE` may arrive while the client is rendering the snapshot or be reordered behind it. The symptom is exactly what reloading the tab "fixes": cells that were edited don't show their new computed value until refresh.

The fix is the same shape. Add a per-cell `effect()` that reads the signals you want to stay subscribed for the whole element's lifetime, started in `addConnectedCallback` and stopped in `addDisconnectedCallback`:

```js
let keepAlive = null;
tag.addConnectedCallback(() => {
  if (keepAlive !== null) { return; }
  keepAlive = effect(() => { cell.value.get(); cell.raw.get(); });
});
tag.addDisconnectedCallback(() => {
  if (keepAlive !== null) { keepAlive.stop(); keepAlive = null; }
});
```

In a viewport-virtualized grid the per-cell keep-alive scales with visible cells only. Cells outside the viewport never run their connect callback, so the auto-unsubscribe still happens for them. Use this pattern whenever any branch of your rendering can unmount the only subscriber to a live signal.

**The third case: top-level keep-alive over signals consumed only by child components.** When a page-level component constructs a live signal and passes it down (as a prop, via a domain factory, or via direct module-level reference), the rendering chain that subscribes lives inside a child. Any conditional rendering in that child — a router transition, a tab switch, a modal close, anything that unmounts the child subtree — drops the live signal's only subscriber. If the page-level component intends the signal to stay subscribed for the page's lifetime regardless of which children are mounted, pin it at the page level too:

```js
// app-page.ts. Top-level component for the whole page.
export function appPage() {
  const presence = liveSignal({ tabs: [] }, 'presence:tabs', { persist: true });
  // ... child components consume presence ...

  let pageKeepAlive = null;
  const root = t.div({ class: 'app-page' }, [/* children */]);
  root.addConnectedCallback(() => {
    pageKeepAlive = effect(() => { presence.get(); });
  });
  root.addDisconnectedCallback(() => {
    if (pageKeepAlive !== null) { pageKeepAlive.stop(); pageKeepAlive = null; }
  });
  return root;
}
```

This belt-and-suspenders pattern guards against any reorganization of the children that would otherwise be invisible at review time. The cost is one permanent subscriber per signal you want pinned page-wide. Worth it for signals whose `MSG_UNSUBSCRIBE` would be operationally costly (presence rosters, lock registries, anything where dropping the subscription temporarily would orphan server-side state).

When to use this: any app where the live signal's lifetime should equal the component's lifetime, not the rendering chain's. Multi-user presence, shared cursors, chat rooms, inline-edit cells in a spreadsheet, anywhere "stay subscribed even if nothing renders this right now" is the intended semantic. Skip it for the viewport-virtualization case where you genuinely want the unsubscribe (the auto-unsubscribe is the whole point there).

The kensington-eslint-plugin does not catch the missing keep-alive. The discipline is yours, and the symptom is delayed and easy to attribute to network or server bugs. The dev-tools-WS-frame check is the fastest diagnostic.

## Mixing live and local signals

A component is free to use both shapes. The reactive graph doesn't care:

```js
export function todos(state, ctx) {
  const items   = liveSignal(state.items ?? [], 'todos:list');  // shared
  const draft   = signal('');                                    // local
  const editing = signal(null);                                  // local

  // Derives across both. Re-runs when either changes. Recomputed locally.
  const visible = computed(() => editing.get() === null ? items.get() : items.get().filter(i => i.id !== editing.get()));
  // ...
}
```

Local signals stay local even when they live inside the same component as a live signal. Computeds derived from a live signal are themselves local; the inputs are synchronized, so every client recomputes identical outputs.

## What's deliberately not here

- **No CRDT / OT.** Plain last-write-wins per name. For collab-editing text, use op-based sync (see `local-notes/collab-pad/`).
- **No optimistic-update primitive.** The local `.set()` IS the optimistic update; the server's snapshot reconciles when it arrives. If you need explicit pending/confirmed states, mirror the live signal with a local one and reconcile manually.
- **No presence helpers.** Easy to build on top: one `liveSignal({ activeIds: [...] }, 'presence:room:5')` set on connect/disconnect.
- **No `defineServerOp` yet.** Phase 3 of the plan. Until then, race-sensitive operations need server-side application code.
- **No per-route or per-component scoping.** Encode it in the name.

## Lint and runtime warnings

The kensington-eslint-plugin ships two rules specific to liveSignal:

- **`kensington/no-async-set`** (`recommended` config, `error`). Flags `.set(async fn)` on any signal. An async updater returns a Promise instead of the next value. For a liveSignal that Promise serializes to `{}` on the wire and silently corrupts every subscriber. Fix: await the async work first, then call `.set(resolvedValue)`.
- The general `signal`/`computed`/`effect` reactive-correctness rules also flag liveSignal in the same situations (signal inside an effect, helper-function trap, etc.). See `agent-docs/reactive.md` for the full list.

Runtime warnings fire once per name (or once per process, where noted):

- **Initial-value mismatch.** Two callers of `liveSignal('foo', initialA)` and `liveSignal('foo', initialB)` with differing primitive initials. The second caller's initial is ignored. The cached signal's current value is returned.
- **Persist-flag mismatch.** Two callers of `liveSignal('foo', initial, { persist: true })` and `liveSignal('foo', initial, { persist: false })`. The first declaration wins. The policy is global to the name. Pass the same flag at every call site to silence.
- **canWrite-flag mismatch.** Same shape. First declaration wins per name.
- **Unserializable value.** A `.set()` with a value that JSON cannot round-trip. The local set is rejected (no broadcast, no local update) so the in-memory state stays consistent with what other clients see.
- **liveSignal before transport.** `liveSignal()` called before `liveServer({...})` or `connectLive(...)` has registered returns a placeholder `Signal` that automatically rewires to the live registry when a transport later registers. Module-scope declarations like `export const x = liveSignal(0, 'name')` work without import-ordering tricks. Pre-upgrade reads and writes both work locally. On upgrade the placeholder's current value seeds the registry entry, so single-client / fresh-registry flows (tests, first boot) get the pre-upgrade write as their canonical value. If the registry already holds a value for that name, the mirror's first run overwrites the placeholder with the authoritative value and the pre-upgrade local write is silently lost. Pre-upgrade writes do not broadcast.
