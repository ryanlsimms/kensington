# Server frameworks

Subdoc of the root `AGENTS.md`. Read this when wiring kensington into Express, Hono (Node or Bun), Fastify, Elysia, Deno, Node built-in http, or any other server framework. For Express the recommended path is the `kensington-express` package described in the root file.

## Express server with multiple routes

```javascript
// server.js
import express from 'express';
import { t } from 'kensington';
import { layout } from './layout.js';

const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(layout('Home', [
    t.h1('Welcome'),
    t.p('Hello from Kensington.'),
    t.a({ href: '/users', class: 'btn' }, 'View users'),
  ]));
});

app.get('/users', async (req, res) => {
  const users = await db.getUsers();
  res.send(layout('Users', [
    t.h1('Users'),
    t.table({ class: 'table' }, [
      t.thead(t.tr(['Name', 'Email', 'Role'].map(h => t.th(h)))),
      t.tbody(users.map(user =>
        t.tr([
          t.td(user.name),
          t.td(user.email),
          t.td({ class: `badge badge--${user.role}` }, user.role),
        ])
      )),
    ]),
    t.a({ href: '/users/new' }, 'Add user'),
  ]));
});

app.listen(3000);
```

## Express. Render helper middleware

Prefer the `kensington-express` package introduced in the root AGENTS.md. It provides `res.renderView(pageRenderer, locals)` with default layout, per-route layout override, locals merging, and an optional `htmlValidator` for dev-time markup checks. Hand-rolling render middleware is unnecessary for most apps.

## Hono server

```javascript
import { Hono } from 'hono';
import { t } from 'kensington';
import { layout } from './layout.js';

const app = new Hono();

app.get('/users', async (c) => {
  const users = await db.getUsers();
  return c.html(layout('Users', usersTable(users)));
});

function usersTable(users) {
  return t.table([
    t.thead(t.tr(['Name', 'Email'].map(h => t.th(h)))),
    t.tbody(users.map(u => t.tr([t.td(u.name), t.td(u.email)]))),
  ]);
}
```

The same Hono code runs unchanged on Bun. Replace `node server.js` with `bun --watch server.ts` (Bun runs TypeScript natively, no `tsx` or `esbuild` needed), and swap `better-sqlite3` for `bun:sqlite` if a database is involved:

```typescript
// server.ts. Hono on Bun.
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import Database from 'bun:sqlite';
import { t } from 'kensington';

const db = new Database('data.db');
const app = new Hono();

app.use('/static/*', serveStatic({ root: './public' }));
app.get('/', c => c.html(t.html(t.body(t.h1('Hello from Bun'))).toString()));

export default app;  // Bun calls fetch() on the default export.
```

Start with `bun --watch server.ts`. No build step on the server side. The client bundle is produced by `Bun.build({ entrypoints: ['src/client.ts'], outdir: 'public' })` driven by a small `build.ts`.

### Bun + Hono with WebSocket upgrade

Bun's native WebSocket support is exposed via the default-export object, not via Hono's route handlers. Hono handles HTTP; Bun's runtime handles the upgrade. The pattern:

```typescript
import { Hono } from 'hono';

const app = new Hono();
app.get('/', c => c.html(/* shell */));
// ...other HTTP routes...

export default {
  port: 3852,
  fetch(req, server) {
    // Upgrade /ws requests to WebSocket; fall through to Hono for everything else.
    if (new URL(req.url).pathname === '/ws' && server.upgrade(req)) { return; }
    return app.fetch(req, { server });
  },
  websocket: {
    open(ws)      { /* on connect */ },
    message(ws, raw) { /* JSON parse, dispatch */ },
    close(ws)     { /* on disconnect */ },
  },
};
```

`server.upgrade(req)` returns `true` if the upgrade succeeded; if so, return early with no response. Otherwise the request falls through to Hono. The `websocket` object's lifecycle handlers see a `ServerWebSocket`, which has `.send(data)`, `.close()`, `.subscribe(channel)`, and `.publish(channel, data)` for pub/sub-style broadcast. Per-connection state goes on `ws.data` (assigned in `open`).

## Fastify, Elysia, Deno, Node http, and other frameworks

Same shape as Express and Hono. Build the tag tree, call `.toString()`, send it as `text/html; charset=utf-8`. One example shape covers them all:

```javascript
// Fastify (decorate `reply.html` once so routes don't call toString)
app.decorateReply('html', function (c) {
  return this.header('content-type', 'text/html; charset=utf-8')
             .send(typeof c === 'string' ? c : c.toString());
});
app.get('/', async (req, reply) => reply.html(layout('Home', t.h1('Welcome'))));

// Elysia (Bun). Return a Response with the html content-type
new Elysia().get('/', () => new Response(
  layout('Home', t.h1('Welcome')).toString(),
  { headers: { 'content-type': 'text/html; charset=utf-8' } }
));

// Deno (npm:kensington import). Same shape
Deno.serve({ port: 3000 }, () => new Response(
  layout('Home', t.h1('Welcome')).toString(),
  { headers: { 'content-type': 'text/html; charset=utf-8' } }
));

// Node built-in http. Same shape
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(layout('Home', t.h1('Welcome')).toString());
}).listen(3000);
```

The only framework-specific bits are the body-parser/middleware and the response method (`res.send`, `c.html`, `reply.send`, `return new Response`). Kensington itself is identical across all of them.
