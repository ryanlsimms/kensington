# Hydration and HMR

Subdoc of the root `AGENTS.md`. Read this when the app uses server-side rendering plus client takeover (`renderForHydration` / `registerComponents`), or when wiring `kensington/vite` for hot-module reload. **Client-only SPAs do not need any of this.** The root file does not cover this material.

## Hydration

Hydration is the SSR-then-take-over story: the server renders HTML with `renderForHydration`, the client takes over with `registerComponents`. **Client-only SPAs do not need any of this.** If the server only serves a static shell (or you have no server at all, e.g. a PWA loaded from a service worker cache), build the page in the browser with `tagInstance.toElement()` and append it to `document.body`. `renderForHydration` and `registerComponents` are for the SSR-plus-takeover case only. The Hash router recipe in `agent-docs/examples.md` is the canonical client-only routing pattern.

The same component function runs on server and client unchanged.

```javascript
// components/comment-count.js
import { t, signal } from 'kensington';

export function commentCount({ postId, count: initial }) {
  const count = signal(initial);
  return t.button({
    type: 'button',
    onclick: () => count.set(n => n + 1),
  }, [count, ' comments']);
}
```

```javascript
// server.js
import { renderForHydration, t } from 'kensington';
import { commentCount } from './components/comment-count.js';

res.send(
  t.body([
    t.article(post.body),
    renderForHydration(commentCount, { postId: post.id, count: post.commentCount }),
  ]).toString()
);
```

```javascript
// client.js
import { registerComponents } from 'kensington';
import { commentCount } from './components/comment-count.js';

registerComponents({ commentCount });
```

The key in `registerComponents` must match the name passed to `renderForHydration`. Pass an explicit third argument whenever the call site may be reached by the browser (component functions are renamed by minifiers) or when using anonymous functions or aliased imports: `renderForHydration(fn, state, 'myName')`. Server-side calls where the code is never minified can rely on `fn.name`, but the explicit form is always safe.

The same component name can appear at any number of mount points in a single page. Call `renderForHydration` once per mount with whatever state each instance needs; the server emits a unique marker per call. `registerComponents` walks the page on the client, finds every marker for that name, and mounts each instance independently with its own hydration scope. Keyed signals and computeds (`signal(initial, key)`, `computed(fn, key)`) are scoped per mount, so two `searchBox` instances on the same page do not share state. If you have several differently-named components on the page (e.g. `inspector`, `treePane`, `themeToggle`), register them in a single call: `registerComponents({ inspector, treePane, themeToggle })`. One call is enough regardless of how many mounts each component has.

Stateless mounts. When a component's state is entirely module-level (selection signals, theme signals, registries) and the component function takes no parameters, pass `{}` as the state argument: `renderForHydration(themeToggle, {}, 'themeToggle')`. The state argument is mandatory in the type signature but the empty object is valid; nothing inside the component needs to read it. Common for toolbars, theme toggles, and tree panes that get their data from module-level signals seeded by other code.

```javascript
// server.js. Many mounts of the same component name plus several distinct components.
res.send(
  t.body([
    t.header(renderForHydration(themeToggle, { initial: req.cookies.theme ?? 'light' }, 'themeToggle')),
    t.main([
      renderForHydration(treePane, { rootNodes }, 'treePane'),
      renderForHydration(inspector, { selected }, 'inspector'),
    ]),
    t.footer([
      renderForHydration(searchBox, { id: 'top', placeholder: 'Find nodes' }, 'searchBox'),
      renderForHydration(searchBox, { id: 'bottom', placeholder: 'Find again' }, 'searchBox'),
    ]),
  ]).toString()
);
```

```javascript
// client.js. One call covers every marker for every name on the page.
import { registerComponents } from 'kensington';
import { themeToggle } from './components/theme-toggle.js';
import { treePane }    from './components/tree-pane.js';
import { inspector }   from './components/inspector.js';
import { searchBox }   from './components/search-box.js';

registerComponents({ themeToggle, treePane, inspector, searchBox });
```

The two `searchBox` mounts above each get their own `{ id, placeholder }` state and their own keyed-signal registry. A `signal(0, 'cursor')` inside `searchBox` is two independent signals across the two mounts.

### Component authoring rules

The same component function runs on both server and client. Write components so they work in both environments:

- Create signals inside the component function body, not at module level.
- Wrap any browser-only side effects in `effect()` . `effect()` is a no-op during `renderForHydration`, so it is safe to reference `document`, `window`, or `localStorage` inside one. Direct references to browser globals in the function body outside an `effect()` will throw on the server.
- For browser-only code that cannot go inside `effect()` (module-level code, `computed()` values, direct assignments), use the `isBrowser` export: `if (isBrowser) { ... }`.
- State passed to `renderForHydration` must be JSON-serializable. It warns on lossy values (Date, Map, Set, RegExp, undefined, function, Symbol, non-finite numbers, class instances) and throws on unserializable ones (BigInt, circular references).

```javascript
export function dashboard({ tasks: initialTasks }) {
  const tasks = signal(initialTasks);  // signal created inside the function

  effect(() => {
    // safe. Effect() is suppressed on the server
    document.title = `${tasks.get().length} tasks`;
  });

  return t.div({ class: 'dashboard' }, [/* ... */]);
}
```

### Known tradeoffs

These are deliberate simplicity tradeoffs, not bugs.

**DOM replacement, not true hydration.** `registerComponents` replaces the entire SSR DOM with a fresh `toElement()` call rather than reusing existing nodes. In practice the replacement is imperceptible: `replaceWith()` is synchronous and the visual output is identical. An inline `<style>` tag suppressing transitions on `[data-k-mount-target]` is injected automatically so CSS animations do not re-trigger.

A consequence: **event listeners attached to the SSR DOM do not survive registerComponents.** If you wired a `document.addEventListener` or an `el.addEventListener` directly on an SSR-rendered element, the replaced node is a different element instance and the listener is lost. Two safe places to attach listeners. (1) Inside the component function itself, via `on:` keys or `addConnectedCallback`, so the listener is wired on the freshly-built node. (2) On a parent container that lives outside the renderForHydration mount, so the replacement does not affect it (event delegation works fine because events bubble through the replaced subtree). Document-level handlers (`document.addEventListener('keydown', ...)`) are also safe.

**Non-interactive window.** Between the browser's first paint of the SSR HTML and when the hydration script runs, elements are rendered but not reactive. This is inherent to any SSR-then-hydrate approach.

**Signals created during SSR are not stopped.** `renderForHydration` calls `fn(state)`, which creates signal and computed objects that are never explicitly stopped. They are unreachable after the request and will be garbage collected, but they add memory pressure on high-traffic servers.

**State is plaintext in the page source.** The state passed to `renderForHydration` is embedded as a `<script type="application/json">` tag visible to anyone who views source. Do not pass secrets, tokens, or private data as hydration state.

**`fn.name` is fragile under aggressive minification.** Server code is typically not minified, so `fn.name` is reliable in practice. If server code is bundled and minified, pass an explicit name as the third argument.

**Module-level computeds that are never subscribed to retain their source subscriptions indefinitely.** `computed()` auto-disposes when its last subscriber is removed, but a computed that never gains a subscriber never enters that cycle. Its internal `update` function stays subscribed to its source signals for the lifetime of the module. This is only a concern for computeds declared at module scope that are intentionally read outside a reactive context (e.g. in route handlers or CLI scripts). The fix is to call `.stop()` explicitly when the computed is no longer needed.

**`renderForHydration` returns a `LiteralTag`.** The return value is content-shaped (acceptable wherever a `Content` slot is acceptable), so it splices into a surrounding tag tree as a child. TypeScript users sometimes expect it to return the component's own tag type; it does not. If you need the type for an intermediate variable, import it:

```typescript
import { renderForHydration, type LiteralTag } from 'kensington';

const header: LiteralTag = renderForHydration(toolbar, state, 'toolbar');
return t.body([header, /* ... */]);
```

**Asymmetric server / client renderers under the same component name.** Sometimes the server's rendering needs to differ from the client's — e.g. the server renders from a plain data object with no reactivity, and the client mounts a reactive version backed by a module-level signal registry. `renderForHydration(serverFn, state, 'name')` accepts any function that takes the state and returns a tag tree; `registerComponents({ name: clientFn })` accepts a separate client function under the same name. The two functions must produce visually identical HTML (so the replacement is imperceptible) and both must accept the same `state` argument shape. Useful pattern for stateless edge runtimes (Workers, Deno Deploy) where server-side module-level signals would leak across requests.

Worked example. The server-side state has plain `Ticket` objects (`{ id, status, comments }`). On the client, each ticket's `status` and `comments` are wrapped as signals so live updates can mutate them in place without rebuilding the card. The server renderer reads plain values; the client renderer reads signals.

```javascript
// shared/ticket-card.js. Same file imported on both sides.
import { t, isBrowser } from 'kensington';

export function ticketCard(ticket) {
  // ticket.status is a string on the server, a Signal<string> on the client.
  // Both forms render the same initial HTML because kensington unwraps signals on .toString().
  return t.article({ class: ['ticket-card', signalOrValue(ticket.status, s => `status-${s}`)] }, [
    t.h3(ticket.title),
    t.div({ class: 'badge' }, signalOrValue(ticket.commentCount ?? 0, n => `${n} comments`)),
  ]);
}

// Helper. On the server, the value is plain; transform it directly. On the client, the value
// is a signal; chain through .transform with a stable key so the derived class is reused.
function signalOrValue(v, fn) {
  if (v && typeof v === 'object' && v._isKensingtonSignal) {
    return v.transform(fn, `${fn.name}-derived`);
  }
  return fn(v);
}
```

```javascript
// server.js. Plain ticket objects flow in; no signals.
import { renderForHydration } from 'kensington';
import { ticketCard } from './shared/ticket-card.js';

function ticketListForSsr(state) {
  return t.section(state.tickets.map(ticketCard));
}
app.get('/', (req, res) => {
  res.send(layoutWith(renderForHydration(ticketListForSsr, { tickets: db.allTickets() }, 'ticketList')));
});
```

```javascript
// client.js. Plain tickets from the SSR snapshot get wrapped; signals flow through ticketCard.
import { registerComponents, signal } from 'kensington';
import { ticketCard } from './shared/ticket-card.js';

function wrapTicket(t) {
  return {
    ...t,
    status: signal(t.status),
    commentCount: signal(t.commentCount ?? 0),
  };
}

function ticketListForClient(state) {
  const tickets = signal(state.tickets.map(wrapTicket));
  startEventSource(tickets);   // SSE handler that mutates per-ticket signals
  return t.section(tickets.mapWithKey('id', ticketCard));
}

registerComponents({ ticketList: ticketListForClient });
```

The card component is shared. The server's `state.tickets` are plain; the client's `state.tickets` get a one-time wrap before being passed to `mapWithKey`. SSE deltas then call `targetTicket.status.set(newStatus)` and the cached card's status binding flips without rebuild. The SSR HTML's status class (`status-open`) matches what the client renderer produces from `signal('open')`, so the replacement is imperceptible.

The wrap-on-client step is the only place where the server and client diverge. Without it, the client would have to either treat plain values as immutable (no live updates) or rebuild cards on every change (defeats `mapWithKey`'s point). With it, each ticket is one signal per mutable field, and the cached tag stays mounted indefinitely.

**Server-side mirror of `mapWithKey`: plain `Array.prototype.map`.** The shared `ticketCard` reads either `ticket.status` (string, server) or `ticket.status.get()` (signal, client) via a small `reactive(v, fn, key)` helper. The shared component's list shape, though, is just an iteration. On the server `state.tickets.map(ticketCard)` produces an array of tags directly; on the client `signal.mapWithKey('id', ticketCard)` returns a reactive Tag[] keyed by id. Both feed into the same parent (`t.section(...)`). No special API for "server-side mapWithKey"; the plain `.map()` is correct for the server because the data is immutable for that render.

**Stateless edge runtimes (Cloudflare Workers, Deno Deploy, Vercel edge functions).** These runtimes reuse the module graph across many requests in the same V8 isolate. Module-level mutable state is shared by every request served from that isolate. Concretely. If your module declares `const cellRaw: Map<string, Signal<string>> = new Map()` and the server-side `renderForHydration` code seeds the Map from per-request data, the next request in the same isolate sees the previous request's cells. Two users could cross-contaminate. Rule for SSR on edge runtimes:

- Server-side rendering code must NOT read from or write to module-level signals that hold per-request data. Module-level signals that hold runtime-wide configuration (theme defaults, feature flags) are fine.
- The component function used for SSR should be a pure function of its `state` argument. It builds a tag tree directly from the data and returns it.
- The reactive signal registry lives in the BROWSER only. The client bundle creates and seeds it from the SSR state JSON the server embedded.
- Use the asymmetric pattern above: a pure server function and a reactive client function registered under the same component name.

In a long-lived Node/Bun process, module-level signal registries are fine because the process serves one user (or you've structured the registry per-user). The hazard is specific to runtimes where the same JS context handles many independent requests.

## HMR (`kensington/vite`)

Component HMR is opt-in via the `kensington/vite` subpath export. Add the plugin to a Vite config and matching files get transparent hot-swap of live elements with signal state preserved.

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { kensingtonHmr } from 'kensington/vite';

export default defineConfig({
  plugins: [
    kensingtonHmr({ include: 'src/components/**/*.{js,ts}' }),
  ],
});
```

`include` accepts a glob, an array of globs, or a callback `(server) => glob | globs | null`. The callback form receives the Vite dev-server reference, which lets adapters like `kensington-dev-server` read globs from runtime config (stashed on the dev-server reference after `vite.config.js` has already run).

```bash
npm install --save-dev acorn magic-string
```

`acorn` and `magic-string` are optional peer dependencies. They are loaded only when `kensington/vite` is used; the rest of the library does not depend on them.

The plugin parses each matched file, finds component exports, wraps each one with `__kInstrument(name, fn)`, and appends an `import.meta.hot.accept` block calling `hmrReplaceComponent(name, mod.<access>.__kFn)`. Detected export forms (others silently keep no-HMR behaviour):

- `export function NAME(...)`
- `export const NAME = function|()=>`
- `export default function NAME(...)`
- `export default function(...)`              (anonymous, name = file basename)
- `export default () => ...`                  (name = file basename)
- `export default NAME`                       (re-export of a local declaration)
- `export { NAME, NAME2, ... }`               (specifier list of local declarations)

Hot-swaps preserve state through three mechanisms:

1. **Keyed signals and computeds persist across the swap.** A component re-rendered into the same mount keeps its existing per-mount registry. Any `signal(initial, key)` or `computed(fn, key)` call inside the component reuses the existing instance, so user-visible reactive state survives.
2. **User-visible DOM state is captured and restored.** Focus, text selection, scroll positions, input values, checked/indeterminate, `<select>` value, and `<details>`/`<dialog>` open state all carry over via `preserve-state.js`.
3. **Effects on the discarded DOM are stopped automatically.** `dom-tracker`'s `MutationObserver` catches the node swap and stops the old element's signal effects without any explicit cleanup.

HMR works for both SSR-hydrated components (registered via `registerComponents`) and client-only components (mounted directly via `.toElement()`). The Vite plugin's apply mode is `'serve'` only, so `vite build` ships the user's original source with no instrumentation.

For Express and Fastify projects there is also a separate package, `kensington-dev-server`, that wires this plugin together with view-morph and CSS HMR through one CLI. See its `AGENTS.md` for usage. Building an HMR setup against `kensington/vite` directly is also fully supported.
