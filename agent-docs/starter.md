# Starter scaffold

Subdoc of the root `AGENTS.md`. Read this when bootstrapping a new project. The scaffold is one complete app with SSR + client-takeover + live signals + Vite HMR + ESLint, structured so each file does one job. Copy verbatim, then delete the parts you do not need.

This scaffold answers, in order. What is the project layout. What goes in `package.json`. What does the Vite config look like. What does the ESLint config look like. What does the server entry look like. What does the client entry look like. What does one shared component file look like. Where do shared signals and env factories live.

A real app extends this template with routes, more components, persistence, and styling. The first six files below are the smallest configuration that runs.

## Project layout

```
my-app/
├── package.json
├── vite.config.js
├── eslint.config.js
├── server.js                  // server entry. Express + liveServer + Vite middleware
├── client.js                  // client entry. connectLive + registerComponents
├── shared/
│   ├── env.js                 // makeServerEnv / makeClientEnv (the context bag)
│   ├── signals.js             // module-scope liveSignal declarations
│   └── components/
│       └── counter.js         // shared component. Runs unchanged on server and client
└── public/                    // static assets served by Vite (CSS, images, fonts)
    └── style.css
```

The `shared/` directory holds files imported by both `server.js` (via `renderForHydration`) and `client.js` (via `registerComponents`). Anything that touches DOM globals at module load (browser-only utilities) lives outside `shared/`, in client-only modules.

## `package.json`

```json
{
  "name": "my-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node server.js",
    "build": "vite build",
    "start": "NODE_ENV=production node server.js",
    "lint": "eslint . && kensington-check-reactive shared --quiet"
  },
  "dependencies": {
    "express": "^4.19.0",
    "kensington": "*"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "acorn": "^8.12.0",
    "better-sqlite3": "^11.0.0",
    "eslint": "^9.0.0",
    "kensington-eslint-plugin": "^0.5.0",
    "kensington-express": "*",
    "magic-string": "^0.30.0",
    "vite": "^5.4.0",
    "ws": "^8.18.0"
  }
}
```

`acorn` and `magic-string` are optional peer deps of `kensington/vite` (the HMR plugin loads them lazily). `better-sqlite3` and `ws` are optional peer deps of `kensington/live` (the server loads them lazily). Listed here so a fresh `npm install` produces a working app.

## `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import { kensingtonHmr } from 'kensington/vite';

export default defineConfig({
  plugins: [
    kensingtonHmr({ include: 'shared/components/**/*.js' }),
  ],
  build: {
    outDir: 'dist/client',
    rollupOptions: {
      input: { client: './client.js' },
    },
  },
});
```

`kensingtonHmr({ include })` wraps every top-level component export in the matched files so saves hot-swap the live mount in place. The plugin is `apply: 'serve'` only; production builds skip the transform entirely. See `agent-docs/hydration.md` → HMR.

## `eslint.config.js`

```javascript
import js from '@eslint/js';
import kensington from 'kensington-eslint-plugin';

export default [
  js.configs.recommended,
  kensington.configs.strict,
];
```

`strict` (not `recommended`) is required for new projects. It promotes reactive-correctness warnings to errors and adds the helper-function-trap rule. See `AGENTS.md` → Recommended packages for the full rationale.

## `server.js`

```javascript
import http from 'node:http';
import express from 'express';
import { renderForHydration, t } from 'kensington';
import { liveServer } from 'kensington/live';
import kensingtonView from 'kensington-express';
import { createServer as createViteServer } from 'vite';
import { makeServerEnv } from './shared/env.js';
import { counter } from './shared/components/counter.js';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Dev: Vite middleware serves shared/, public/, and the HMR client runtime.
// Prod: serve the built bundle from dist/client.
if (isProd) {
  app.use(express.static('dist/client'));
} else {
  const vite = await createViteServer({ server: { middlewareMode: true } });
  app.use(vite.middlewares);
}

// Default layout. Wraps every res.renderView() response unless overridden.
function layout(locals, page) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.title(locals.title ?? 'My App'),
      t.link({ rel: 'stylesheet', href: '/style.css' }),
    ]),
    t.body([
      page(locals),
      t.script({ type: 'module', src: isProd ? '/client.js' : '/client.js' }),
    ]),
  ]);
}

app.use(kensingtonView({ defaultLayout: layout }));

app.get('/', (req, res) => {
  const env = makeServerEnv();
  res.renderView(
    () => renderForHydration(counter, { initial: 0 }, 'counter', { context: env }),
    { title: 'Counter' },
  );
});

const httpServer = http.createServer(app);
const live = await liveServer({ persistence: { kind: 'memory' } });
await live.attach(httpServer);

httpServer.listen(3000, () => console.log('http://localhost:3000'));
```

A per-request `env` bag is the canonical way to thread runtime values into shared components. See `AGENTS.md` → Component dependencies and `agent-docs/hydration.md` → Threading external dependencies.

## `client.js`

```javascript
import { registerComponents } from 'kensington';
import { connectLive } from 'kensington/live';
import { makeClientEnv } from './shared/env.js';
import { counter } from './shared/components/counter.js';

const transport = connectLive();
const env = makeClientEnv({ userId: crypto.randomUUID(), transport });

registerComponents({ counter }, { context: env });
```

`connectLive()` with no args connects to the default path on the current origin. `registerComponents({ counter })` finds every `data-k-mount` element that the server emitted with name `'counter'`, hydrates each one, and hands it the same `env` shape the server constructed.

## `shared/env.js`

```javascript
import { signal } from 'kensington';

export function makeServerEnv() {
  return {
    userId: 'ssr',
    transport: null,
    toasts: signal([]),
  };
}

export function makeClientEnv({ userId, transport }) {
  return {
    userId,
    transport,
    toasts: signal([]),
  };
}
```

Same shape on both sides. Different runtime values. Never serialized. The component reads `env.transport`, `env.userId`, etc. without knowing which environment it is running in.

## `shared/signals.js`

```javascript
import { liveSignal } from 'kensington/live';

// Declare each live signal once. Import the binding from any module that needs it.
export const totalClicks = liveSignal(0, 'total-clicks', { persist: true });
```

Module-scope `liveSignal` declarations are safe to evaluate before `liveServer()` or `connectLive()` registers. The placeholder upgrades automatically once the transport is wired. See `AGENTS.md` → Live signals.

## `shared/components/counter.js`

```javascript
import { t, signal, computed } from 'kensington';
import { totalClicks } from '../signals.js';

export function counter({ initial = 0 }, env) {
  const count = signal(initial);
  const label = computed(() => count.get() === 1 ? 'click' : 'clicks');

  return t.section({ class: 'counter' }, [
    t.h2('Counter'),
    t.p([
      t.button({ onclick: () => {
        count.set(n => n + 1);
        totalClicks.set(n => n + 1);
      } }, '+'),
      ' ',
      t.span([count, ' ', label, ' on this tab. ', totalClicks, ' across all tabs.']),
    ]),
    t.p({ class: 'user' }, ['User: ', env.userId]),
  ]);
}
```

The function runs once per mount on the client and once per request on the server. `count` is per-tab. `totalClicks` is shared across every connected browser. `env.userId` differs per client.

## Run

```bash
npm install
npm run dev
# open http://localhost:3000
```

Edits to `shared/components/*.js` hot-swap in place. Edits to `server.js` require restart.

## Where to go from here

- **Routing.** Add more `app.get(...)` handlers, each rendering a different component via `res.renderView`. For client-side routing inside a single component see `agent-docs/examples.md` → Hash router.
- **Styling.** Two options. Tailwind (`agent-docs/recipes.md` → Tailwind patterns) or `styled` for CSS-in-JS with pseudo-selectors and composition (`agent-docs/recipes.md` → styled).
- **Forms.** `agent-docs/recipes.md` → useForm and `agent-docs/examples.md` → Form with validation errors.
- **More components.** Add files under `shared/components/`. The Vite glob in `vite.config.js` already covers them for HMR. Register each one in `client.js` and import it where the server route needs it.
- **Persistence.** Swap `{ kind: 'memory' }` for `{ kind: 'sqlite', path: './data/live.db' }` once values need to survive restart. See `agent-docs/live-signals.md` → Persistence.
- **Production build.** `npm run build` outputs `dist/client/`. `npm start` runs the server with `NODE_ENV=production`, serving the built bundle.
