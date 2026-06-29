import { t } from 'kensington';

import { apiTable } from '../../components/table.js';
import { code } from '../../components/ui.js';

export function reactivityLiveSignals() {
  return t.section({ id: 'live-signals' }, [
    t.h2('Multi-client state. live signals'),
    t.p([
      'State shared across every connected browser. ',
      t.code('liveSignal(initial, name, options?)'),
      ' acts like ',
      t.code('signal()'),
      ' everywhere it is read but synchronizes through a server registry. Reads from one tab reflect writes from any tab. State persists across reloads and (with sqlite) across server restarts.',
    ]),
    t.p([
      'Best for state that partitions into small atomic values: cells in a spreadsheet, columns on a kanban board, presence per room. Direct ',
      t.code('.set(value)'),
      ' is last-write-wins; ',
      t.code('.set(fn)'),
      ' is atomic via compare-and-swap. Not suited to character-level concurrent text editing.',
    ]),

    t.h3({ id: 'live-signals-setup' }, 'Setup. Three calls'),
    t.p([
      'Everything lives at the ',
      t.code('kensington/live'),
      ' subpath. Three setup calls cover the API. One per environment.',
    ]),
    code('javascript', `// One import covers the whole API.
import { liveSignal, connectLive, liveServer } from 'kensington/live';`),

    t.h4('1. Shared component file'),
    t.p([
      'The shared file runs on both server (SSR) and client. ',
      t.code('liveSignal(initial, name)'),
      ' returns a ',
      t.code('Signal<T>'),
      ' whose value is shared by name with every other connected client. Mix freely with regular ',
      t.code('signal()'),
      ' for local-only state and ',
      t.code('computed()'),
      ' for derivations.',
    ]),
    code('javascript', `// shared/todos.js
import { t, signal, computed } from 'kensington';
import { liveSignal } from 'kensington/live';

export function todos(state) {
  // Shared across all clients. Same instance everywhere.
  const items = liveSignal(state.items ?? [], 'todos:list');

  // Local. Not synced.
  const draft = signal('');

  // Derived. Recomputed locally; identical inputs -> identical outputs everywhere.
  const remaining = computed(() => items.get().filter(i => !i.done).length, 'remaining');

  function addTodo() {
    if (!draft.value.trim()) { return; }
    // Atomic read-modify-write via compare-and-swap. Concurrent calls converge.
    items.set(list => [...list, { id: crypto.randomUUID(), text: draft.value.trim(), done: false }]);
    draft.set('');
  }

  return t.div([
    t.p([remaining, ' remaining']),
    t.form({ onsubmit: e => { e.preventDefault(); addTodo(); } }, [
      t.input({ type: 'text', prop: { value: draft }, oninput: e => draft.set(e.target.value) }),
      t.button({ type: 'submit' }, 'Add'),
    ]),
    t.ul(items.mapWithKey('id', item => t.li(item.text))),
  ]);
}`),

    t.h4('2. Server'),
    t.p([
      'Create one ',
      t.code('liveServer'),
      ' at startup. It owns the registry, the persistence adapter, and the WebSocket multiplexer. ',
      t.code('live.attach(httpServer)'),
      ' mounts the WebSocket handler on a Node HTTP server at the path configured by the ',
      t.code('path'),
      ' option (default ',
      t.code("'/__kensington/live'"),
      '). The client\'s ',
      t.code('connectLive({ url })'),
      ' defaults to the same path, so no extra configuration is needed unless you override one side. Persistence defaults to memory. Pass ',
      t.code("{ kind: 'sqlite', path }"),
      ' for durability across restarts.',
    ]),
    code('javascript', `// server.js
import http from 'node:http';
import express from 'express';
import { renderForHydration } from 'kensington';
import { liveServer } from 'kensington/live';
import { todos } from './shared/todos.js';

const live = await liveServer({
  persistence: { kind: 'sqlite', path: './data/live.db' }, // or { kind: 'memory' }
});

const app = express();
app.get('/', (req, res) => {
  const state = { items: live.get('todos:list') ?? [] };
  res.send(renderForHydration(todos, state));
});

const server = http.createServer(app);
await live.attach(server);
server.listen(3000);`),
    t.p([
      'On Bun, the upgrade dance and the WebSocket handlers go through Bun\'s default-export object. Pass the request through ',
      t.code('data: { req }'),
      ' so ',
      t.code('onConnect(ws, req)'),
      ' can read headers off it.',
    ]),
    code('javascript', `// server.ts. Bun + Hono.
import { Hono } from 'hono';
import { renderForHydration } from 'kensington';
import { liveServer } from 'kensington/live';
import { todos } from './shared/todos.js';

const live = await liveServer({
  persistence: { kind: 'sqlite', path: './data/live.db' },
});

const app = new Hono();
app.get('/', c => {
  const state = { items: live.get('todos:list') ?? [] };
  return c.html(renderForHydration(todos, state));
});

export default {
  port: 3000,
  fetch(req, server) {
    if (new URL(req.url).pathname === '/__kensington/live' && server.upgrade(req, { data: { req } })) {
      return;
    }
    return app.fetch(req, { server });
  },
  websocket: live.bunWebsocket(),
};`),

    t.h4('3. Client'),
    t.p([
      'Open one WebSocket connection at boot, then register the same components as you would for a non-live SSR app. ',
      t.code('connectLive()'),
      ' with no arguments uses the same default path as ',
      t.code('liveServer'),
      ' (',
      t.code("'/__kensington/live'"),
      '). Pass ',
      t.code('url'),
      ' only if the server mounts at a different path or the WebSocket lives on a different host. The returned transport handle has a ',
      t.code('status'),
      ' field that is a reactive ',
      t.code('Signal<ConnectionStatus>'),
      ' you can read directly, transform, or pass into a component as data. The matching ',
      t.code('liveServer().status'),
      ' on the server is always ',
      t.code("'connected'"),
      ', so the same Signal type appears at both ends.',
    ]),
    code('javascript', `// client.js
import { registerComponents } from 'kensington';
import { connectLive } from 'kensington/live';
import { todos } from './shared/todos.js';

const live = connectLive();                   // defaults match liveServer

registerComponents({ todos });`),

    t.h3({ id: 'live-signals-naming' }, 'Naming. The scoping mechanism'),
    t.p([
      'The runtime stays oblivious to URL, user, room, or document. The ',
      t.code('name'),
      ' string IS the scope. Common patterns:',
    ]),
    t.ul([
      t.li([t.code("'counter:global'"), ' — one shared value across the whole app']),
      t.li([t.code('drafts:user:<userId>'), ' — per-user state, isolated by id']),
      t.li([t.code('doc:42:title'), ' — per-document property']),
      t.li([t.code('cell:sheet:<sheetId>:<address>:raw'), ' — fine-grained per-cell state']),
      t.li([t.code('chat:room:<roomId>:messages'), ' — per-room list']),
    ]),
    t.p([
      'Two calls to ',
      t.code('liveSignal'),
      ' with the same name in the same process return the same Signal instance. The name is the identity. Across files, modules, even across server-side effects and the shared component, identical names mean the same registry entry.',
    ]),

    t.h3({ id: 'live-signals-persistence' }, 'Persistence backend and per-signal policy'),
    t.p([
      'Two orthogonal decisions. The ',
      t.code('liveServer'),
      ' option selects WHERE persisted writes land. The per-signal ',
      t.code('persist'),
      ' option (default ',
      t.code('false'),
      ') decides WHICH signals use the backend.',
    ]),
    apiTable(['liveServer persistence', 'Behavior', 'Cost'], [
      [
        t.code("{ kind: 'memory' }"),
        'Default. State held in process memory. Lost on restart. Fine for demos and tests.',
        'Zero deps.',
      ],
      [
        t.code("{ kind: 'sqlite', path, flushInterval? }"),
        'Backend stores values to a SQLite database. Writes are debounced (default 250ms) and grouped in a transaction. Reads come from an in-memory mirror loaded on startup.',
        ['Requires ', t.code('better-sqlite3'), ' (optional peer dep).'],
      ],
    ]),
    t.p([
      'Per-signal ',
      t.code('persist'),
      ' on ',
      t.code('liveSignal(initial, name, { persist })'),
      ' mirrors the ',
      t.code('persist'),
      ' flag on tag options. Default false. The cheap option is the default. ',
      t.code('persist: true'),
      ' is the explicit opt-in for archival behavior.',
    ]),
    code('javascript', `// Transient. Default. Lives in memory only. Server restart wipes it.
// Dropped from the server registry 30 seconds after the last subscriber leaves.
const cursor = liveSignal({ x: 0, y: 0 }, \`cursor:user:\${tabId}\`);

// Persisted. Writes flow to the configured backend. The registry entry
// stays alive until an explicit live.delete(name).
const sticky = liveSignal({ x, y, text }, \`sticky:\${id}\`, { persist: true });`),
    t.p([
      'First declaration wins. The policy is a property of the name, not of the call site. If one call passes ',
      t.code('{ persist: true }'),
      ' and another passes ',
      t.code('{ persist: false }'),
      ' for the same name, the first wins and a once-per-name warning fires.',
    ]),

    t.h3({ id: 'live-signals-canwrite' }, 'Write policy. canRead and canWrite'),
    t.p([
      'Two layers. A global ',
      t.code('canWrite'),
      ' on ',
      t.code('liveServer'),
      ' applies to every client write. A per-signal ',
      t.code('canWrite'),
      ' on ',
      t.code('liveSignal({ canWrite })'),
      ' applies only to that name. Both must allow. Each defaults to ',
      t.code("'any'"),
      '. Server-side writers (',
      t.code('live.set'),
      ', server-side ',
      t.code('liveSignal.set'),
      ') bypass both checks.',
    ]),
    code('typescript', `type CanWrite =
  | 'any'                                                                // default. any authenticated client may write.
  | 'server-only'                                                        // no client may write. server writers only.
  | ((name: string, ctx: any, transition: { prev, next }) => boolean);   // custom predicate.`),
    t.p([
      'The function form gets the same ',
      t.code('ctx'),
      ' returned by ',
      t.code('onConnect'),
      ' plus the proposed transition. Use it to validate identity, value, or the relationship between the old and new value in one call.',
    ]),
    code('javascript', `const live = await liveServer({
  persistence: { kind: 'sqlite', path: './data/live.db' },
  onConnect: (ws, req) => ({ user: decodeSession(req.headers.cookie) }),
  canRead:  (name, ctx) => ctx.user != null,
  canWrite: (name, ctx) => ctx.user != null,           // global: must be authenticated
});

const currentBid = liveSignal(null, 'auction:current-bid', {
  persist: true,
  canWrite: (name, ctx, { prev, next }) => {           // per-signal: business rules
    if (next.userId !== ctx.user.id) { return false; }
    if (next.amount < (prev?.amount ?? 0) + MIN_INCREMENT) { return false; }
    if (prev?.userId === ctx.user.id) { return false; }
    return true;
  },
});

const bidHistory = liveSignal([], 'auction:bid-history', {
  persist: true,
  canWrite: 'server-only',                              // only server-side writers apply.
});`),
    t.p([
      t.strong('Don\'t use '),
      t.code('isBrowser'),
      t.strong(' inside '),
      t.code('canWrite'),
      t.strong('.'),
      ' The predicate always runs on the server, where ',
      t.code('isBrowser'),
      ' is ',
      t.code('false'),
      '. ',
      t.code('canWrite: !isBrowser'),
      ' evaluates to ',
      t.code('true'),
      ' and allows all client writes (the opposite of the intent). Use ',
      t.code("canWrite: 'server-only'"),
      ' for "no client can write."',
    ]),

    t.h3({ id: 'live-signals-atomic' }, 'Updates that depend on the current value'),
    t.p([
      'When the new value depends on the current value (counter increment, append to a list, toggle a flag, merge into an object), pass a function to ',
      t.code('.set'),
      ' instead of a value.',
    ]),
    code('javascript', `counter.set(n => n + 1);
viewers.set(prev => ({ users: [...prev.users, me] }));
reactions.set(prev => ({ ...prev, [me]: emoji }));
items.set(prev => prev.filter(it => it.id !== removedId));`),
    t.p([
      'Under concurrent writes from multiple clients, the function form converges. ',
      t.code('fn'),
      ' runs against the latest server value, so each client sees the others\' updates instead of overwriting them. ',
      t.code('.set(value)'),
      ' on the same name races with last-write-wins.',
    ]),
    t.p([
      'Both ',
      t.code('.set(value)'),
      ' and ',
      t.code('.set(fn)'),
      ' return a ',
      t.code('Promise<void>'),
      ' that resolves once the server confirms or rejects with a structured ',
      t.code('LiveSetRejected'),
      ' Error on permanent failure (',
      t.code('canWrite'),
      ' denied, value not serializable, transport disconnected, retry cap exhausted). The server-authoritative value rolls back the local Signal before the rejection fires, so ',
      t.code('sig.value'),
      ' inside ',
      t.code('.catch'),
      ' already reflects the truth. Fire-and-forget callers can ignore the Promise; the library silences unhandled-rejection warnings for unawaited returns.',
    ]),
    code('javascript', `// Surface a rejection to the user via a toast.
try {
  await seat.set(myTabId);
} catch (err) {
  if (err instanceof Error && err.name === 'LiveSetRejected') {
    toast(\`\${err.signalName}: \${err.reason}. owned by \${err.authoritativeValue}\`);
  }
}`),
    t.h4('When to use which form'),
    t.ul([
      t.li([
        t.code('.set(value)'),
        ' for direct assignment. Theme changes, status flags, selection changes, anything that overwrites without caring what was there before.',
      ]),
      t.li([
        t.code('.set(fn)'),
        ' when the new value depends on the current one. Lists, objects, counters, anything where read-modify-write would be a race.',
      ]),
    ]),
    t.h4('Caveats'),
    t.ul([
      t.li([
        t.strong('The function must be pure AND synchronous.'),
        ' Side effects inside fn will run multiple times if the server reports conflicts and the library retries. Async functions silently corrupt the value because the Promise serializes to ',
        t.code('{}'),
        ' on the wire. The lint plugin\'s ',
        t.code('kensington/no-async-set'),
        ' rule catches the syntactic async case.',
      ]),
      t.li([
        t.strong('Large values pay the bandwidth.'),
        ' With ',
        t.code('.set(fn)'),
        ', the full computed value travels over the wire each retry. Fine for normal-sized collections; consider a server-side writer pattern for genuinely large state.',
      ]),
      t.li([
        t.strong('Trust model is cooperative.'),
        ' Any authenticated client can write any value via ',
        t.code('.set(fn)'),
        '. For state where the server must validate transitions (auctions, money, voting), pair ',
        t.code('.set(fn)'),
        ' with a per-signal ',
        t.code('canWrite'),
        ' predicate.',
      ]),
    ]),

    t.h3({ id: 'live-signals-status' }, 'Connection status'),
    t.p([
      'The connection-status signal lives on the transport handles. Read ',
      t.code('connectLive().status'),
      ' on the client and ',
      t.code('liveServer().status'),
      ' on the server. Both are reactive ',
      t.code('Signal<ConnectionStatus>'),
      ' values yielding one of ',
      t.code("'connecting'"),
      ', ',
      t.code("'connected'"),
      ', ',
      t.code("'reconnecting'"),
      ', or ',
      t.code("'disconnected'"),
      ' (the server is always ',
      t.code("'connected'"),
      ').',
    ]),
    t.p([
      'A shared component renders the pill from a signal passed in as data. Wire it at both entry points so SSR shows the pill without a reflow on hydration.',
    ]),
    code('javascript', `// shared/status-pill.js
import { t } from 'kensington';

export function statusPill(status) {
  return t.span({ class: status.transform(s => \`pill pill-\${s}\`, 'pill-class') }, status);
}

// server.js
const live = await liveServer({ /* ... */ });
res.send(renderForHydration(state => statusPill(live.status), state, 'statusPill'));

// client.js
const live = connectLive();
registerComponents({ statusPill: state => statusPill(live.status) });`),

    t.h3({ id: 'live-signals-server-subscribe' }, 'Server-side liveSignal as a reactive subscription'),
    t.p([
      'Outside of ',
      t.code('renderForHydration'),
      ', ',
      t.code('liveSignal(initial, name)'),
      ' on the server returns a long-lived Signal that subscribes to registry updates. Client writes, server-side ',
      t.code('live.set'),
      ', and writes from other server-side ',
      t.code('liveSignal'),
      ' instances all propagate into the local Signal. Wrap an ',
      t.code('effect()'),
      ' around it to react.',
    ]),
    code('javascript', `import { effect } from 'kensington';
import { liveServer, liveSignal } from 'kensington/live';

const live = await liveServer({ persistence: { kind: 'sqlite', path: './data.db' } });

// Top-of-server boot. Outside any SSR call.
const counter = liveSignal(0, 'counter', { persist: true });

effect(() => {
  // Re-runs every time anyone writes to 'counter' (client or server).
  metrics.gauge('counter', counter.get());
  audit.log('counter changed', counter.get());
});`),
    t.p([
      'Same call shape on both sides. Inside ',
      t.code('renderForHydration'),
      ', a fresh per-request Signal seeded from the registry. Outside SSR, a long-lived Signal that subscribes to registry updates.',
    ]),

    t.h3({ id: 'live-signals-auto-unsubscribe' }, 'The auto-unsubscribe trap'),
    t.p([
      'When the last local subscriber to a live signal goes away, the transport unsubscribes from the server. Usually correct (viewport virtualization, mount/unmount). But if the rendering chain that subscribes can drop transiently and the signal should stay subscribed for the component\'s lifetime, pin a persistent local subscriber:',
    ]),
    code('javascript', `import { effect, isBrowser } from 'kensington';
import { liveSignal } from 'kensington/live';

export function room(state) {
  const presence = liveSignal({ users: [] }, 'presence:list');
  const cursors  = liveSignal({}, 'cursors:everyone');

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
}`),
    t.p([
      'Use whenever the live signal\'s lifetime should equal the component\'s, not the rendering chain\'s. Presence, ',
      'shared cursors, chat rooms, anywhere "stay subscribed even if nothing renders this right now" is the intended semantic.',
    ].join('')),

    t.h3({ id: 'live-signals-where-created' }, 'Where liveSignals are created'),
    t.p([
      'Per-entity ',
      t.code('liveSignal'),
      ' instances (per-user cursors, per-cell raw values, per-document metadata) are typically read from multiple components. They must therefore be created outside any reactive callback. The general rule is ',
      t.a({ href: '?page=reactivity#bp-signal-scope' }, "Don't read a signal outside the scope where it was created"),
      '; the application to live signals is direct.',
    ]),
    t.p([
      'For live signals specifically, the first ',
      t.code('liveSignal(initial, name)'),
      ' call is what subscribes the name to the server. Create your live signals at the component scope, before the first render reads them, so every name is subscribed in time.',
    ]),
  ]);
}
