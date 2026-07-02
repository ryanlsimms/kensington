# Kensington

HTML/SVG/MathML library for JavaScript and TypeScript. Tags are method calls on a `Kensington` instance, returning tag objects that serialize to formatted HTML strings (`.toString()`) or live DOM nodes (`.toElement()`).

## This file at a glance

| Section | Content |
|---|---|
| Where to find what | Which subdoc to pull for each feature area |
| Component mental model | Canonical component shape every example below matches |
| Translation from React and Svelte | Closest-equivalent tables for agents reasoning by analogy |
| Decision trees | Five common forks (signal vs let, prop vs attribute, effect vs connect, etc.) |
| Task lookup | "I want to X" → exact subdoc section |
| Warning index | Runtime warning ID → fix sketch + section that explains it |
| Quick examples | Inline code for the 8 most common patterns |
| Imports | Import statements and type aliases |
| Recommended packages | `kensington-eslint-plugin` and `kensington-express` full setup |
| The basics / Options / Content rules | Core API reference |
| Reactive data | The key rule before writing any `signal()` |
| Live signals | Module-scope `liveSignal` declaration pattern |
| Component dependencies | `options.context` pattern for SSR + client env |
| Common mistakes | Effect cleanup, `persist`, void elements, React/Svelte muscle-memory traps |
| Key types | TypeScript type reference |

## Where to find what

**This file** covers the surface that almost every kensington project touches. Imports, tag basics, options, content rules, validation, the non-negotiable reactive decision check, and quick inline examples. Anything past that lives in a topic-specific subdoc under `agent-docs/`. Read those on demand using your Read tool. Do NOT read them eagerly — they're together about 6× the size of this file.

| Reach for this subdoc when… | File | What's inside |
|---|---|---|
| You touch `signal()`, `computed()`, `effect()`, `.transform()`, `mapWithKey`, `addConnectedCallback`, `persist: true`, devtools, or any reactive lifecycle. | [`agent-docs/reactive.md`](agent-docs/reactive.md) | Signal API (read with `.get()`, always); keyed lists; the helper-function trap with wrong/right pairs; lazy registries; cleanup; `addConnectedCallback`/`addDisconnectedCallback`; `persist: true` for drag-and-drop; devtools; loading state; **Reactive pitfalls** (every warning's wrong/right pair). |
| The app uses SSR + client-takeover (`renderForHydration` / `registerComponents`), you are wrapping `renderForHydration` output in a full HTML page, threading transport/userId/env into a component, using multiple components or multiple mounts on one page, or wiring `kensington/vite` for HMR. Skip if the app is a client-only SPA. | [`agent-docs/hydration.md`](agent-docs/hydration.md) | Server/client component rules; full page template (the `htmlWithDocType` wrapper a route must build); multiple mounts; asymmetric SSR/client renderers; stateless edge-runtime hazards; `options.context` for threading transport and identity; HMR Vite plugin and state preservation. |
| You are sharing state between connected browsers (collab UI, presence, multi-window editing, server-pushed updates), bundling `kensington/live` with esbuild, or wiring transport reconnect/pauseSend/onFrame. | [`agent-docs/live-signals.md`](agent-docs/live-signals.md) | `liveSignal`; `liveServer`; `connectLive`; atomic `.set(fn)` with CAS retry; `canWrite`; presence join/leave on connect; the auto-unsubscribe trap; domain factory for per-entity signals; bundler setup for esbuild; transport lifecycle control. |
| You are integrating a web-component library (Web Awesome, Shoelace, Lit-based design systems, Material Web, FAST, Spectrum) or any vanilla custom element. | [`agent-docs/custom-elements.md`](agent-docs/custom-elements.md) | `createCustomTag`, manifest-driven loops, typing with `declare` fields, htmx-shaped namespace augmentation. |
| You need a small reusable helper: `styled`, `portal`, `createContext`, `useReducer`, `useLocalStorage`, `useDebounce`, `useFetch`, `useRef`, `useForm`, `modal`, `useAutoFocus` / `useFocusTrap`, `useId`. Or a layout / Tailwind starter. Or the presence-with-heartbeat or reactive-aggregator pattern. | [`agent-docs/recipes.md`](agent-docs/recipes.md) | Each helper as a copyable file; the shared-primitives `ui.js` pattern; presence heartbeat; reactive poll aggregator. |
| You are bootstrapping a new project and want a complete working skeleton (Vite + Express + hydration + live signals + ESLint) in one place rather than reconstructing it from four subdocs. | [`agent-docs/starter.md`](agent-docs/starter.md) | Project layout, `package.json`, Vite config, ESLint config, server entry, client entry, env factory, shared component. |
| You are wiring a server framework: Express, Hono (Node or Bun), Fastify, Elysia, Deno, Node built-in http. | [`agent-docs/frameworks.md`](agent-docs/frameworks.md) | Per-framework route shape. For Express prefer the `kensington-express` package described below. |
| You want a runnable example of a specific pattern: form with validation, pagination, fragments, caching, Alpine.js, SVG, MathML, htmx live search, hydrated like button, sortable table, accordion, hash router, etc. | [`agent-docs/examples.md`](agent-docs/examples.md) | ~30 worked examples including 10 reactive-data scenarios and TypeScript design-system patterns. |

**Read pattern**: pull in a subdoc only when the current task lands in its territory. Two or three subdocs per task is normal; reading all six is almost never the right call. The map above and each subdoc's opening paragraph identify when it's relevant.

## Component mental model

A Kensington component is a plain function. It takes props in and returns one `ContentTag`. There is no render loop. The function body runs once per mount on the client, and once per request on the server. Signals declared in the body are stable for the tag's lifetime. Bindings woven into the returned tree (signals used as content, attributes, or `prop` values) update the live DOM in place when those signals change. The function does not re-run when a signal changes.

```javascript
// shared/counter.js
import { t, signal, computed } from 'kensington';

export function counter({ initial = 0, label = 'clicks' }) {
  const count = signal(initial);
  const display = computed(() => `${count.get()} ${label}`);

  return t.div({ class: 'counter' }, [
    t.button({ onclick: () => count.set(n => n + 1) }, '+'),
    t.span(display),
  ]);
}
```

Read this template once. Every example in this file and the subdocs matches the same shape. Signals declared at the top of the function. A single returned `ContentTag` (or `VoidTag`) tree. Bindings woven into options or content. No JSX, no template syntax, no re-render.

For TypeScript components, type props inline and use `Reactive<T>` for parameters that can be either a plain value or a signal. `Reactive<T>` is shorthand for `T | Signal<T> | ReadonlySignal<T>`.

```typescript
import { t, signal, type Reactive, type ContentTag } from 'kensington';

interface CounterProps {
  initial?: number;
  label?: Reactive<string>;
}

export function counter({ initial = 0, label = 'clicks' }: CounterProps): ContentTag {
  const count = signal(initial);
  return t.div([
    t.button({ onclick: () => count.set(n => n + 1) }, '+'),
    t.span([count, ' ', label]),
  ]);
}
```

Children are just another prop. Name it `children` if you want React-style ergonomics, or pick a more descriptive name (`header`, `actions`, `rows`).

```javascript
export function card({ title, children }) {
  return t.section({ class: 'card' }, [
    t.h2(title),
    t.div({ class: 'card-body' }, children),
  ]);
}

card({ title: 'Hello', children: [t.p('one'), t.p('two')] });
```

## Translation from React and Svelte

If you already think in React or Svelte, these tables map the closest equivalents. They are for orientation only. The underlying execution model differs, and a few rows have no direct counterpart in the other direction.

### React → Kensington

| React | Kensington | Note |
|---|---|---|
| `function Component(props) { return <jsx /> }` | `function component(props) { return t.div(...) }` | Same function-as-component shape. No JSX. |
| `useState(0)` returning `[v, setV]` | `const v = signal(0)`, then `v.get()` / `v.set(...)` | One object, not a tuple. |
| `useEffect(() => {...}, [dep])` | `effect(() => { dep.get(); ... })` | Dependencies are tracked automatically via `.get()` reads. |
| `useEffect(() => () => cleanup, [])` (mount/unmount) | `tag.addConnectedCallback(...)` and `tag.addDisconnectedCallback(...)` | Effect cleanup returns are silently ignored. Use the tag callbacks. |
| `useMemo(() => fn(), [dep])` | `computed(() => fn())` | Auto-tracked. No dep array. |
| `useCallback` | Not needed | Functions are not identity-tracked. Declare inline. |
| `useRef(null)` for DOM access | Capture `tag.toElement()`, or `addConnectedCallback(el => { ref = el })` | The tag's element is the ref. |
| `useContext` / `<Context.Provider>` | `options.context` arg on `renderForHydration` and `registerComponents` | One env bag threaded through component args. See `agent-docs/hydration.md`. |
| `key={id}` on a list item | `items.mapWithKey('id', item => t.li(...))` | Key lives on the source, not the rendered tag. |
| `<Child>{children}</Child>` | `function child({ children }) { return t.div(children) }` | "Children" is just another prop holding `Content`. |
| Controlled `<input value={v} onChange={e => setV(...)} />` | `t.input({ prop: { value: v }, oninput: e => v.set(e.target.value) })` | `prop:` writes the DOM property. HTML `value` only sets default. |
| `{cond && <Foo />}` inside JSX | `cond && t.div(...)` directly in a content array | `false` is silently dropped from content. |
| `{items.map(i => <Li />)}` | `items.map(i => t.li(...))` for static, `signal.mapWithKey(...)` for reactive | Use `mapWithKey` when the source is a signal. |
| `<Fragment>` / `<>` | Plain JS array | Arrays are auto-flattened in content. |
| `React.Suspense` | Not built in. Swap a `view` signal in and out of a spinner. | See `agent-docs/reactive.md` → Loading state. |
| `React.memo` / prop-identity cutoffs | Not applicable | Reactivity is per-signal. Only bindings that read a changed signal update. |
| `useReducer` | Pattern over `signal` | See `agent-docs/recipes.md` → useReducer. |
| `useId` | Pattern over a module-scope counter | See `agent-docs/recipes.md` → useId. |

### Svelte → Kensington

| Svelte | Kensington | Note |
|---|---|---|
| `<script>let x = 0;</script>` with `{x}` in markup | `const x = signal(0)`, then `[x]` in content | Signals are explicit. Assignment-as-reactivity is not. |
| `$: doubled = x * 2` | `const doubled = computed(() => x.get() * 2)` | |
| `$: { console.log(x) }` | `effect(() => { console.log(x.get()) })` | |
| `{#each items as item (item.id)}` | `items.mapWithKey('id', item => ...)` | |
| `{#if cond} ... {/if}` | `cond && t.div(...)` for static, a transform for reactive `cond` | |
| `onMount(() => {...})` / `onDestroy` | `addConnectedCallback` / `addDisconnectedCallback` | |
| `bind:value` on `<input>` | `prop: { value: sig }` plus `oninput: e => sig.set(e.target.value)` | No two-way binding sugar. |
| `<slot />` | A prop holding `Content` (`children`, `header`, etc.) | |
| `writable` / `derived` stores | `signal` / `computed` | Same role. No `$` prefix. |
| `setContext` / `getContext` | `options.context` arg | See `agent-docs/hydration.md`. |
| `tick()` | `await Promise.resolve()` | Reactive flush runs on the same microtask queue. |

## Decision trees

Five common forks. Each picks the right API in three lines.

**`signal()` or plain `let`?**
- Value bound anywhere in the DOM (content, attribute, or `prop`)? Use `signal()`.
- Value only read inside event handlers, never bound to the DOM? Plain `let` is fine.
- In doubt, use `signal()`. Cost is one allocation. Benefit is being reactivity-ready.

**Bind via HTML attribute or via `prop:`?**
- Form element with user-mutable state (`<input>`, `<textarea>`, `<select>`, `<details>`, `<dialog>`)? Use `prop: { value: ... }`, `prop: { checked: ... }`, etc.
- Anything else (`class`, `style`, `id`, `href`, `aria-*`, `data-*`, custom)? Use the top-level option key.
- Why. HTML attributes set defaults, DOM properties reflect live state. After user interaction the two diverge.

**Wrap in `computed()` or inline a signal?**
- Bound directly as content or as an attribute value? Inline. `t.p([count])` and `t.div({ class: theme })` subscribe without `computed`.
- Derived value reused across multiple bindings? Use `computed()` once and share the result.
- Inside a function passed to a callback (a content slot, `class:` array entry, transform fn)? Use `computed()` or `.transform()`. Plain values inside callbacks are not reactive.

**`mapWithKey` or `.map()`?**
- Source array is a signal AND row identity matters (focus, local state, animations, expensive child build)? Use `signal.mapWithKey('id', fn)`.
- Source array is a signal but rows are stateless and cheap to rebuild? Either works. `mapWithKey` is still safer.
- Source array is a plain JS array (built once)? Use `.map()`.

**`effect()` or `addConnectedCallback`?**
- Side effect tied to a DOM element's mount and unmount (timer, observer, third-party widget init)? Use `addConnectedCallback` and `addDisconnectedCallback`.
- Side effect that should re-run when signals change (syncing to localStorage, logging)? Use `effect()`. Capture the return and call `.stop()` in a disconnect callback if it should not outlive the element.
- Both apply? `addConnectedCallback(() => { const e = effect(...); return e.stop; })`. The pattern composes.

**Does this `signal()` / `computed()` / `.transform()` need a key?**
- Does the call's call-stack ever pass through `computed(fn)`, `signal.transform(fn)`, `signal.mapWithKey(key, fn)`, or `effect(fn)`? Pass a key.
- Module-scope or inside a one-shot component function with no surrounding reactive callback? No key needed.
- Unsure? Pass a key. Safe everywhere. Outside a reactive scope the key is a no-op.

## Task lookup

Granular "I want to…" → exact subdoc section. Use this to go straight to the right spot without reading a whole subdoc.

| I want to… | Read |
|---|---|
| Create a signal, computed, or effect | Quick examples below, or `reactive.md` → Signal API |
| Bind a signal to text content or an HTML attribute | Quick examples below |
| Bind `<input>`, `<textarea>`, or `<select>` value to a signal | `reactive.md` → DOM properties with prop |
| Inline-edit cell (click-to-edit, commit on blur/Enter, cursor preserved) | `reactive.md` → DOM properties with prop → Spreadsheet-style inline-edit cell |
| Render a reactive keyed list | `reactive.md` → Keyed lists |
| Use a signal that holds `{ tabs: [...] }` or any envelope shape as a list source | `reactive.md` → Keyed lists → "envelope around a list" |
| Drive per-row state from outside the row (search handler, drag handler) | `reactive.md` → Updating a row after it's been cached |
| Run a timer, observer, or side effect tied to an element's lifetime | `reactive.md` → addConnectedCallback / addDisconnectedCallback |
| Make drag-and-drop reordering preserve signal effects | `reactive.md` → Cleanup → `persist: true` |
| Show a loading spinner while data fetches | `reactive.md` → Loading state |
| Debug reactive state with a dev panel | `reactive.md` → DevTools |
| Fix a `signal-in-computed` warning | `reactive.md` → Reactive primitives inside a computed need a key |
| Fix a `computed-in-computed` or `transform-in-computed` warning | `reactive.md` → Nested computed and transform without a key |
| Prevent a lazy-registry signal from being created inside a computed | `reactive.md` → Lazy registries called from reactive callbacks |
| Server-render + client takeover, basic setup | `hydration.md` → Hydration |
| Wrap `renderForHydration` output in a full HTML document | `hydration.md` → Full page template |
| Thread transport, userId, or other env into a shared component | `hydration.md` → Threading external dependencies → Pattern 0. options.context |
| Register multiple components or multiple mounts on one page | `hydration.md` → Full page template (multiple-mount example) |
| HMR hot-swap during development | `hydration.md` → HMR |
| SSR on Cloudflare Workers or Deno Deploy (no per-request module state) | `hydration.md` → Known tradeoffs → Stateless edge runtimes |
| Share a signal value across all connected browsers | `live-signals.md` → Server entry |
| Append to a shared list atomically (no race with concurrent writers) | `live-signals.md` → Atomic updates with .set(fn) |
| Restrict which clients can write to a signal | `live-signals.md` → canRead / canWrite |
| Presence: add this tab on connect, remove it on close | `live-signals.md` → Joining a presence list on connect |
| Keep a live signal subscribed during conditional rendering or tab-swap | `live-signals.md` → The auto-unsubscribe trap |
| Group per-entity signals (auction, document, room) | `live-signals.md` → Organizing per-entity signals with a domain factory |
| Wire reconnect, pauseSend, resumeSend buttons | `live-signals.md` → Transport lifecycle control |
| Bundle `kensington/live` client-side with esbuild | `live-signals.md` → Bundler setup (esbuild) |
| Use a web component library (Shoelace, Web Awesome, etc.) | `custom-elements.md` |
| CSS-in-JS with pseudo-selectors and media queries | `recipes.md` → styled |
| Signal backed by localStorage | `recipes.md` → useLocalStorage |
| Debounced signal | `recipes.md` → useDebounce |
| Form with validation errors | `recipes.md` → useForm, or `examples.md` → Form with validation errors |
| Access a live DOM element (React-style ref) | `recipes.md` → useRef |
| Open a modal dialog with focus trap and Escape-to-close | `recipes.md` → modal |
| Auto-focus an input on mount | `recipes.md` → useAutoFocus |
| Trap focus inside a panel | `recipes.md` → useFocusTrap |
| Bootstrap a new project end-to-end | `starter.md` |
| Hash-router SPA | `examples.md` → Hash router |
| Sortable table | `examples.md` → Sortable table |

## Warning index

Each runtime warning ID gets a one-line fix sketch and a pointer to the section that explains the underlying rule. Most explanations live in `agent-docs/reactive.md`.

| ID | When it fires | Fix | See |
|---|---|---|---|
| `async-loop` | An effect's signal write triggers more flushes than the cycle limit allows | Break the cycle. Do not write a signal the effect reads, or guard the write with a value-equality check | `reactive.md` → Reactive pitfalls |
| `sync-loop` | The same effect re-queues itself in a single flush | Same as above. Read the signal once at the top, derive locally, then guard the write | `reactive.md` → Reactive pitfalls |
| `set-in-effect` | A signal is both read with `.get()` and written with `.set()` in the same effect run | Read once at the top into a local. Compute the new value. Only call `.set()` when it differs | `reactive.md` → Do not read and write the same signal in the same effect or computed run |
| `set-in-computed` | `.set()` was called inside a computed body | `computed` is for derivation only. Move the write to an `effect` or event handler | `reactive.md` → Do not call `.set()` inside a `computed` body |
| `set-during-ssr` | `.set()` was called inside `renderForHydration` | SSR is read-only over signals. Push canonical values via `liveServer.set(name, value)` outside any render path | `hydration.md` → Server-render functions must be read-only over signals |
| `signal-in-computed` | `signal()` called inside a computed without a key | Pass a key as the second arg, for example `signal(initial, 'open')`, or `signal(initial, \`open-${item.id}\`)` inside `mapWithKey` | `reactive.md` → Reactive primitives inside a computed need a key |
| `signal-in-effect` | `signal()` called inside an effect (recreated each run) | Move the `signal()` declaration outside the effect. Effects re-run, signals should not | `reactive.md` → Reactive primitives inside a computed need a key |
| `transform-in-computed` | `.transform()` inside a computed without a key **and a user `effect`/`computed` subscribes to the inner**. Silent when only attribute/class/text/prop bindings read the inner | Pass a key as the second arg, for example `sig.transform(fn, 'label')` | `reactive.md` → Nested computed and transform without a key |
| `computed-in-computed` | `computed()` inside a computed without a key **and a user `effect`/`computed` subscribes to the inner**. Silent when only attribute/class/text/prop bindings read the inner | Pass a key as the second arg, for example `computed(fn, 'total')` | `reactive.md` → Nested computed and transform without a key |
| `computed-in-effect` | `computed()` called inside an effect (orphaned each run) | Move the `computed()` declaration outside the effect. Effects act, computeds derive | `reactive.md` → Do not call `effect()` from inside a function called from a reactive callback |
| `effect-in-computed` | `effect()` called inside a computed (orphaned each run) | Move the `effect()` declaration out of the computed body. Computeds are for derivation; side effects go in `effect`, `addConnectedCallback`, or event handlers | `reactive.md` → same section |
| `effect-in-effect` | `effect()` called inside another effect | Hoist the inner `effect()` out. If cleanup is needed, store its `.stop` and call it from the outer scope | `reactive.md` → same section |
| `duplicate-keyed-signal` | Two `signal(initial, key)` calls with the same key in one computed run | Make the key unique per call site. Interpolate the item id, for example `signal(false, \`open-${item.id}\`)` | `reactive.md` → Reactive primitives inside a computed need a key |
| `duplicate-keyed-computed` | Two `computed(fn, key)` calls with the same key in one computed run | Make the key unique per call site. Same fix as above | `reactive.md` → Reactive primitives inside a computed need a key |
| `out-of-scope-reactive-reference` | A keyed signal or computed is consumed from outside its owning scope | Read the keyed primitive inside its own scope. To address a row from outside, use the documented row-handle pattern | `reactive.md` → Addressing per-row state from outside the row |
| `mapwithkey-in-reactive` | `mapWithKey` called inside a computed or effect | Call `mapWithKey` at the binding site (directly in content or in an attribute slot), not from inside a reactive callback | `reactive.md` → Keyed lists |
| `mapwithkey-duplicate-key` | Two items in a `mapWithKey` source share a key | Ensure the key field is unique per item. If the source has natural duplicates, use a stable composite key | `reactive.md` → Keyed lists |

Full runnable example apps live in the `examples/` directory of the GitHub repo (https://github.com/ryanlsimms/kensington/tree/master/examples). Browseable docs at https://kensingtonjs.com.

## Quick examples

Short inline examples for the most common patterns. For the full rule set, pitfall catalogue, and edge cases, follow the link at the end of each example.

### Reactive text and attributes

```javascript
import { t, signal, computed } from 'kensington';

const count = signal(0);
const label = computed(() => count.get() === 1 ? 'item' : 'items');
const cls = count.transform(n => n > 0 ? 'badge badge--active' : 'badge', 'cls');

const el = t.div([
  t.button({ onclick: () => count.set(n => n + 1) }, 'Add'),
  t.p({ class: cls }, [count, ' ', label]),  // signal as content updates live
]).toElement();
document.body.append(el);
```

Signals can appear anywhere in content or as any attribute value. `.get()` inside a `computed` or `.transform()` subscribes so it re-runs when the signal changes. See `agent-docs/reactive.md` → Signal API for the full API including `.stop()`, `.value` (escape hatch), and TypeScript inference traps.

### Controlled input

```javascript
const query = signal('');

t.div([
  t.input({
    type: 'search',
    prop: { value: query },            // DOM property binding — not the value HTML attribute
    oninput: e => query.set(e.target.value),
  }),
  t.p(computed(() => `You typed: ${query.get()}`)),
]).toElement();
```

Use `prop: { value: sig }` to bind a signal to the live `el.value`. The HTML `value` attribute only sets the initial default; `prop` writes to the DOM property directly on every signal change. For number inputs, checkboxes, and `<select>`, see `agent-docs/reactive.md` → DOM properties with prop.

### Conditional rendering

```javascript
const loggedIn = signal(false);

// A transform that returns a tag or null swaps the subtree in place.
t.nav([
  loggedIn.transform(v =>
    v ? t.button({ onclick: () => loggedIn.set(false) }, 'Log out')
      : t.button({ onclick: () => loggedIn.set(true) }, 'Log in'),
    'login-btn',  // key required: this transform runs inside a reactive context
  ),
]).toElement();

// A signal holding a Tag or null also works directly as content.
const view = signal(t.p({ class: 'spinner' }, 'Loading…'));
fetch('/api/data')
  .then(r => r.json())
  .then(data => { view.set(t.p(data.message)); });
t.div(view).toElement();
```

For conditional subtrees that themselves contain a `mapWithKey`, the display-toggle pattern is faster than a null-swap because it keeps the keyed cache warm. See `agent-docs/reactive.md` → Keyed lists → Conditional subtrees.

### Reactive keyed list

```javascript
const items = signal([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);

const list = t.ul(items.mapWithKey('id', item => t.li(item.name)));
list.toElement();

// Add an item (new reference triggers reconciliation).
items.set(prev => [...prev, { id: 3, name: 'Carol' }]);
// Remove.
items.set(prev => prev.filter(i => i.id !== 2));
```

`mapWithKey` caches the tag per key. Unchanged rows are not rebuilt; the reconciler reuses their DOM. If the signal holds an envelope shape like `{ tabs: [...] }` rather than a plain array, project first: `presence.transform(p => p.tabs, 'tabs').mapWithKey('id', ...)`. See `agent-docs/reactive.md` → Keyed lists for the full rule, per-row local state, and how to drive rows from outside the list.

### Effect with cleanup

```javascript
const count = signal(0);
const panel = t.div(count);

let id;
panel.addConnectedCallback(() => {
  id = setInterval(() => count.set(n => n + 1), 1000);
});
panel.addDisconnectedCallback(() => {
  clearInterval(id);
});
document.body.append(panel.toElement());
```

`addConnectedCallback` is for any side effect whose lifetime matches a DOM element: timers, `IntersectionObserver`, `ResizeObserver`, third-party widget init, `effect()` calls. Always pair with `addDisconnectedCallback`. See `agent-docs/reactive.md` → addConnectedCallback / addDisconnectedCallback.

### Static server-rendered page

```javascript
import express from 'express';
import { t } from 'kensington';

const app = express();

app.get('/', (req, res) => {
  res.type('html').send(
    t.htmlWithDocType({ lang: 'en' }, [
      t.head([
        t.meta({ charset: 'utf-8' }),
        t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
        t.title('My App'),
        t.link({ rel: 'stylesheet', href: '/style.css' }),
      ]),
      t.body(t.main([
        t.h1('Hello'),
        t.p('Rendered on the server.'),
      ])),
    ]).toString()
  );
});

app.listen(3000);
```

For a multi-route app, factor the `htmlWithDocType` wrapper into a `layout(title, content)` function. See `agent-docs/frameworks.md` and `agent-docs/recipes.md` → Layout.

### SSR + client takeover

```javascript
// shared/counter.js — same file runs unchanged on server and client
import { t, signal } from 'kensington';

export function counter({ initial }) {
  const count = signal(initial);
  return t.div([
    t.button({ onclick: () => count.set(n => n + 1) }, '+'),
    t.p([count, ' clicks']),
  ]);
}
```

```javascript
// server.js — route handler
import { renderForHydration, t } from 'kensington';
import { counter } from './shared/counter.js';

app.get('/', (req, res) => {
  // renderForHydration returns a fragment (component + state block), NOT a full document.
  // Always wrap it in htmlWithDocType with a script[type="module"] for client takeover.
  const component = renderForHydration(counter, { initial: 0 }, 'counter');
  res.type('html').send(
    t.htmlWithDocType({ lang: 'en' }, [
      t.head([t.meta({ charset: 'utf-8' }), t.title('Counter')]),
      t.body([
        component,
        t.script({ type: 'module', src: '/client.js' }),
      ]),
    ]).toString()
  );
});
```

```javascript
// client.js
import { registerComponents } from 'kensington';
import { counter } from './shared/counter.js';

registerComponents({ counter });
```

For threading env (transport, userId) into the component, multiple components on one page, HMR, or edge-runtime SSR, see `agent-docs/hydration.md`.

### Live signal (shared across browsers)

```javascript
// shared/counter.js — runs on both server and client
import { t } from 'kensington';
import { liveSignal } from 'kensington/live';

export function counter() {
  const count = liveSignal(0, 'counter');  // same value on all connected browsers
  return t.div([
    t.button({ onclick: () => count.set(n => n + 1) }, '+'),
    t.p([count, ' clicks']),
  ]);
}
```

```javascript
// server.js — add before server.listen
import http from 'node:http';
import { liveServer } from 'kensington/live';

const live = await liveServer({ persistence: { kind: 'memory' } });
const server = http.createServer(app);
await live.attach(server);
server.listen(3000);
```

```javascript
// client.js — call before registerComponents
import { connectLive } from 'kensington/live';
connectLive();
registerComponents({ counter });
```

Module-scope `liveSignal` declarations are safe before `connectLive` / `liveServer` — the placeholder upgrades automatically. For `canWrite`, presence, atomic `.set(fn)`, bundler setup (esbuild), and the auto-unsubscribe trap, see `agent-docs/live-signals.md`.

## Imports

```javascript
// Everyday. The shared `t` instance, the reactive primitives, isBrowser.
import { t, signal, computed, effect, isBrowser } from 'kensington';

// Component file types. Most files only need these three.
import type { Signal, ReadonlySignal, Reactive, ContentTag } from 'kensington';
```

Use `Reactive<T>` (the `T | Signal<T> | ReadonlySignal<T>` union) when typing component parameters that accept either a plain value or a signal. Use `ReadonlySignal<T>` for derived signals returned by `computed`, `transform`, or `mapWithKey`. Use `Signal<T>` only when the caller must be able to write via `.set()`. `ContentTag` is the return type of every content element method.

Less common imports (use when actually needed): the `Kensington` class for custom configuration, `import { Kensington } from 'kensington'`; the `formAttributes` / `globalAttributes` objects from `'kensington/attributes'`; the `VoidTag` / `LiteralTag` / `CommentTag` / `Content` / `ContentMethod` types; the `NameSpaceAttributes` / `GlobalAttributes` / `GlobalEvents` / `UniversalAttributes` / `ClassValue` slot types. All exported from `'kensington'`.

## Recommended packages

Two companion packages cover common pain points. Install them upfront when starting a new project.

### `kensington-eslint-plugin` (any project that uses signals)

ESLint rules that catch reactive bugs at lint time. **Install in every project that uses `signal()`/`computed()`/`effect()`.** Catches `.set()` inside a computed derivation, `.get()`-then-`.set()` self-loops, async writes inside effects, missing keys on `signal()` calls inside a computed, helper-function traps that escape lexical analysis, and more.

#### Canonical setup. Copy these three blocks verbatim.

**1. Install. Pin v0.5.0 or newer.** Earlier versions lack `strict`, the helper-trap rule, and the cross-file checker that this guide depends on.

```bash
npm install --save-dev 'kensington-eslint-plugin@^0.5.0'
```

**2. `eslint.config.js`. Use the `strict` config, not `recommended`.**

```js
import js from '@eslint/js';
import kensington from 'kensington-eslint-plugin';

export default [
  js.configs.recommended,
  kensington.configs.strict,             // mandatory for new projects
  // kensington.configs.style,           // optional, opt-in formatting rules
];
```

**3. `package.json` lint script. Chain `kensington-check-reactive` after `eslint .`.** Without it, the cross-file helper-function trap is invisible to per-file ESLint.

```json
"scripts": {
  "lint": "eslint . && kensington-check-reactive src --quiet"
}
```

If any of these three lines is wrong, the protection this guide promises is not in effect.

#### Why strict over recommended

`strict` extends `recommended` with two extra rules and promotes every reactive-correctness `warn` to `error`:

- **`no-helper-function-trap`** (error in strict; warn in recommended). Single-file call-graph analysis catching unkeyed `signal()`/`computed()`/`.transform()` inside helper functions reachable from a reactive callback (`computed(fn)`, `effect(fn)`, `signal.transform(fn)`, `signal.mapWithKey(key, fn)`). The existing `no-new-signal-in-computed` and `no-new-computed-in-computed` rules only catch the LEXICAL case (the call is written directly inside `computed(() => ...)` in the source). The helper-trap rule catches the call-stack case. `function row(item) { signal(false) }` called from `mapWithKey('id', row)` — the lexical rule misses this; the helper-trap rule catches it. This is the trap nearly every helper-style component falls into.
- **Optional: `require-reactive-key`** (not enabled by any config). Available as a standalone rule for projects that want paranoid refactor-safety: it flags every unkeyed `signal()` / `computed()` / `.transform()` call site, including at module scope. Module-scope keys are no-ops at runtime but the rule guarantees that a future lift into a reactive scope finds a key already in place. Opt in explicitly with `'kensington/require-reactive-key': 'error'` after `kensington.configs.strict` if you want that posture.

  Note: `no-ignored-effect-return` (under strict) fires on top-level `effect(...)` calls whose return value is discarded, even when the effect is meant to live for the page lifetime. The canonical pattern is to assign the return: `const themeEffect = effect(() => {...});`. If the binding is genuinely unused elsewhere, prefix with underscore (`const _themeEffect = ...`) to silence the unused-var rule; the kensington rule is satisfied by any assignment.

Pick stable, descriptive keys: `'theme'`, `'undo-stack'`, `\`cell-${address}-display\``, `\`${item.id}-isActive\``. Treat the second argument as mandatory, not optional.

#### Why chain `kensington-check-reactive`

ESLint runs per file, so even `strict` cannot see when a helper defined in one file is called from a reactive callback in another (helper in `cell.ts`, callback in `grid.ts`). `kensington-check-reactive` (shipped with the plugin v0.5.0+) walks the project, builds a project-wide call graph across imports, and reports unkeyed `signal()`/`computed()`/`.transform()` calls inside any function reachable from a reactive callback anywhere. Chained into `lint`, it adds a sub-second cross-file pass to every `npm run lint`. No new command to remember.

`--quiet` makes it exit-code-only; ESLint's own output stays visible, and the cross-file check fails the script (non-zero exit) on findings. Drop `--quiet` to print findings inline above the lint output. Run standalone with `npx kensington-check-reactive src`.

Suppress per call site with an inline `// kensington-check-reactive-ignore` comment, either at the end of the suppressed line or on the line above. Intended for the lazy-registry pattern documented in `agent-docs/reactive.md` → Lazy registries called from reactive callbacks; the script can't tell whether the lazy creation has been pre-seeded by the consumer, so the suppression comment is the author's confirmation that the call is safe.

The binary is **experimental** as of v0.5.0. Its CLI flags, output format, and suppression-comment syntax may change in later releases. The chain-into-`lint` recommendation is robust against output-format changes (exit code is the contract).

For git-level enforcement, add a pre-commit hook via [`simple-git-hooks`](https://www.npmjs.com/package/simple-git-hooks):

```json
"scripts": { "prepare": "simple-git-hooks" },
"simple-git-hooks": { "pre-commit": "npm run lint" }
```

### `kensington-express` (any Express app)

Express middleware that attaches `res.renderView(pageRenderer, locals)` and applies a default layout to every response. Avoids hand-rolling `.toString()` calls and lets you swap layouts per route. **Use this in place of writing your own render middleware.**

```bash
npm install kensington-express
```

```js
import express from 'express';
import kensingtonView from 'kensington-express';
import { layout } from './views/layout.js';
import { homePage } from './views/home.js';

const app = express();

// Note. The argument is an OPTIONS OBJECT (`{ defaultLayout, htmlValidator, buildLocals }`),
// not the layout function itself. Passing the layout directly silently skips it.
app.use(kensingtonView({ defaultLayout: layout }));

app.get('/', (req, res) => {
  // Layout wraps the page; locals are merged in this order:
  //   req.route, app.locals, res.locals, options.
  res.renderView(homePage, { title: 'Home', items: [...] });
});

// Per-route layout override:
//   res.renderView(adminPage, { layout: adminLayout, title: 'Admin' });
// Skip the layout for a route:
//   res.renderView(rawPage, { layout: null });
```

Both the layout and the page receive the same merged `locals` object (merged from `req.route`, `app.locals`, `res.locals`, and the options passed to `res.renderView`). Whatever you pass to `res.renderView(page, { title, ... })` is available to BOTH `layout(locals, page)` and `page(locals)`. There is no autobinding of well-known keys like `title`; the layout chooses which keys to use (e.g. `t.title(locals.title)`).

The layout has the signature `layout(locals, page)` and calls `page(locals)` to render the content:

```js
// views/layout.js
import { t } from 'kensington';
export function layout(locals, page) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([t.title(locals.title)]),
    t.body([page(locals)]),
  ]);
}
```

Optional `htmlValidator` runs after the response is sent, useful in dev for catching markup issues without blocking the client.

## One instance per project

The named `t` export is a pre-built instance with default settings. Use it everywhere unless you need custom configuration.

When your project requires custom configuration (additional namespaces, a custom validation level, or design-system subclass), create one instance in a central module and import from there:

```javascript
// lib/html.js
import Kensington from 'kensington';

export const t = new Kensington({ additionalNamespaces: ['hx'] });
```

```javascript
// any other file
import { t } from './lib/html.js';
```

One shared instance keeps configuration consistent. Tags and signals from different instances work as content and attribute values in each other's trees, but a single instance avoids any ambiguity.

## The basics

```javascript
t.div({ class: 'container' }, t.p('Hello'));   // options, then content
t.div(t.p('Hello'));                           // content only. Options are optional
t.input({ type: 'checkbox', checked: true });  // void elements take no content
t.div([t.p('one'), t.p('two')]);              // array of children
```

## Critical: call .toString() explicitly

Tag objects coerce to strings in template literals automatically, but not when passed to a function. Always call `.toString()` when passing to `res.send()`, `reply.send()`, `c.html()`, or any similar framework method:

```javascript
res.send(t.div('hello').toString());   // correct
res.send(t.div('hello'));              // wrong. Sends [object Object]
```

## Options

The first argument to any tag method is a plain object. It accepts HTML attributes, event handlers, and DOM property assignments.

- camelCase keys convert to kebab-case: `{ dataBsToggle: 'collapse' }` → `data-bs-toggle="collapse"`
- Nested objects flatten: `{ data: { id: '1' } }` → `data-id="1"`
- Boolean: `{ checked: true }` → `checked`; `{ checked: false }` → attribute omitted. This also applies to `data-*`: `{ data: { ready: true } }` renders as `data-ready=""` (bare attribute, no value), which means `el.dataset.ready === ''` on the live element. **Watch out**: `if (el.dataset.ready) { ... }` is falsy in JS because the empty string is falsy. For click-delegation patterns, use explicit string values like `{ data: { action: 'open-form' } }` and check `el.dataset.action === 'open-form'` rather than truthiness on a bare boolean data attribute.
- `class` accepts a string or array: `{ class: ['a', 'b'] }` → `class="a b"`
- `style` accepts an object: `{ style: { backgroundColor: 'red' } }` → `style="background-color: red"`. Keys can be camelCase or kebab-case. Static values of `null`, `undefined`, `false`, or `''` are silently omitted. Individual property values can be signals. **Two reactive shapes are supported**: per-property signals (`style: { color: colorSignal, fontSize: '1rem' }` — only the changed property is written on each update) AND whole-object signals (`style: positionComputed` where the computed yields `{top, left, height}` — the whole map is diffed against the previous emission; properties removed from a new emission have their style cleared). The whole-object form is the natural fit when you have one derived signal that yields a positioning bundle. The per-property form is the natural fit when properties are independently driven.
- Same shape applies to `data`, `aria`, and any other namespaced-attribute object (including custom namespaces declared via `additionalNamespaces`). `data: signal({foo: 'bar'})` flattens to `data-foo="bar"` and updates on signal change. `data: { bs: signal({toggle: 'collapse'}) }` does the same one level deeper. A signal can appear at any nesting depth.
- `prop` and `on` do NOT accept whole-object signals (only per-property signals). Their removal semantics are undefined (`prop` would need to "un-set" a DOM property; `on` would need handler identity tracking for `removeEventListener`).
- `data-*` and `aria-*` are always allowed without configuration
- Standard event handler attributes (`onclick`, `oninput`, etc.) accept a string or function. Functions are wired via `addEventListener` in `toElement()`.
- `on` key for custom event listeners. Pass a plain object mapping event names verbatim to functions: `{ on: { bricksSelectorChange: handler } }`. Names are passed directly to `addEventListener` with no transformation. Silently ignored in `.toString()`.

### DOM properties with `prop`

HTML attributes and DOM properties diverge after user interaction. `input.value` reflects what the user typed, while `getAttribute('value')` still returns the original default. Use the `prop` key to assign directly to DOM properties via `el[name] = value`, bypassing `setAttribute`:

```javascript
t.input({ type: 'text', prop: { value: '' } }).toElement();  // assigns el.value = ''
t.video({ src: '/intro.mp4', prop: { muted: true, playbackRate: 1.5 } }).toElement();
```

`prop` is silently ignored in `.toString()`. Known properties on the element's DOM interface are typed in TypeScript. Expando properties (arbitrary string keys) are also accepted. Property existence and writability are validated at render time via `validationLevel`.

For SSR/hydration plus custom elements: `prop` interacts with `renderForHydration` and upgraded custom elements in specific ways. See `agent-docs/reactive.md` → DOM properties with `prop`.

## Content rules

`null`, `undefined`, `false`, `true`, and `''` are silently dropped. Use this for conditionals:

```javascript
t.ul([
  t.li('always shown'),
  isAdmin && t.li('admin only'),   // false is dropped, no wrapper needed
  hasError ? t.li('error') : null,
]);
```

Arrays anywhere in content are flattened . `items.map(i => t.li(i))` works directly:

```javascript
t.ul(items.map(item => t.li(item.name)));
```

The two-argument form is **always** `(attributes, content)`. The first arg is never interpreted as plain text. To mix a label with a control, wrap them in a content array:

```javascript
// Wrong. The first arg must be an attributes object.
t.label('Email', t.input({ type: 'email' }));    // throws "Invalid arguments"

// Right. First arg is the attributes object (use {} when none), second is content.
t.label([t.span('Email'), t.input({ type: 'email' })]);
// or
t.label({ class: 'field' }, [t.span('Email'), t.input({ type: 'email' })]);
```

## Raw HTML

```javascript
t.literal('<p>trusted raw html</p>');    // outputs raw HTML; blocks <script> tags
t.unsafeLiteral('<script>...</script>'); // outputs raw HTML; no script-tag check

// Both accept a Signal. When the signal changes, the rendered HTML is re-parsed
// and the element is replaced live.
const html = signal('<p>initial</p>');
t.literal(html);                          // <p>initial</p>, updates on html.set(...)
t.literal(computed(() => marked.parse(text.get()))); // common markdown-preview pattern
```

## inlineComment()

```javascript
t.inlineComment('hello world');           // <!-- hello world -->
t.inlineComment('line 1\nline 2');        // <!--\n  line 1\n  line 2\n-->
t.div([t.p('before'), t.inlineComment('note'), t.p('after')]);
```

`.toElement()` returns a DOM `Comment` node via `document.createComment()`. Accepts a `Signal`. The comment `nodeValue` updates in place on each change.

## Full documents

```javascript
t.htmlWithDocType({ lang: 'en' }, [     // prepends <!DOCTYPE html>
  t.head([t.meta({ charset: 'utf-8' }), t.title('My Page')]),
  t.body(t.main('content')),
]).toString();
```

## Pre-formatted content

`pre`, `script`, `style`, and `textarea` join content array items with newlines and skip extra indentation:

```javascript
t.style([
  'body { margin: 0; }',
  'h1 { color: red; }',
]).toString();
// → <style>\nbody { margin: 0; }\nh1 { color: red; }\n</style>

t.script([
  'const x = 1;',
  'console.log(x);',
]);
```

## Constructor options

```javascript
import Kensington from 'kensington';

const t = new Kensington({
  validationLevel: 'warn',        // 'off' | 'warn' | 'error'. Default 'off'
  additionalNamespaces: ['hx'],   // allow hx-* attributes (htmx), x-* (alpine), etc.
  additionalGlobalAttributes: {   // allow extra attributes on every element with type validation
    'data-theme': ['light', 'dark', 'auto'],
    'wire:loading': Boolean,
  },
  indentationLevel: 2,            // spaces per indent level. Default 2, 0 to disable
  logger: console.warn,           // called when validationLevel is 'warn'. Default console.log
});
```

## Reactive data — the one rule that matters at this level

If the project uses signals, you must obey one rule. The full guide is in [`agent-docs/reactive.md`](agent-docs/reactive.md) — read that subdoc before writing any reactive code beyond the trivial. This section exists only so the rule is impossible to miss.

**Before writing any `signal()`, `computed()`, or `.transform()` call, ask: will this call run on the call stack of a `computed(fn)`, `signal.transform(fn)`, `signal.mapWithKey(key, fn)`'s mapFn, or `effect(fn)` at runtime?** If yes, pass a key as the second argument. This is call-stack, not lexical. A helper function `function row(item) { const open = signal(false) }` called from a `mapWithKey` mapFn is in the trap even though the `signal()` looks top-level in the source.

When in doubt, pass a key. Passing a key outside a reactive context is a no-op; missing a key inside one is a silent UX bug where per-row local state resets on every outer re-run.

**Tooling does this enforcement for you**: use `kensington.configs.strict` from `kensington-eslint-plugin` (covered above) and chain `kensington-check-reactive` into your `lint` script for cross-file coverage. Together they catch every shape of the trap, including the helper-function case the lexical rules miss.

The minimum imports:

```javascript
import { t, signal, computed, effect, isBrowser } from 'kensington';
import type { Signal, ReadonlySignal, Reactive } from 'kensington';
```

Everything else — the full Signal API (read with `.get()`, always; `.value` is an escape hatch), keyed lists, the helper-function trap with wrong/right pairs, lazy registries, cleanup, `addConnectedCallback`/`addDisconnectedCallback`, devtools, loading state, and the full pitfalls catalogue — is in `agent-docs/reactive.md`.

## Live signals. Declare each name once

When a `liveSignal(initial, name, opts?)` call needs to be referenced from more than one module, declare it once in a shared file and import the exported binding everywhere else. Do not call `liveSignal(...)` again with the same name from a second module just to "get the same instance back." The runtime caches by name so it works at runtime, but the duplication invites drift (different `initial` values, different `canWrite` predicates) and obscures which module owns the declaration.

```javascript
// shared/registry.js
import { liveSignal } from 'kensington/live';

export const capacity = liveSignal(0, 'meta:capacity', { canWrite: 'server-only' });

// server.js
import { capacity } from './shared/registry.js';
capacity.set(60);

// component.js
import { capacity } from './shared/registry.js';
t.span([capacity, ' seats']);
```

Module-scope declarations are safe even before `connectLive()` / `liveServer()` registers; `liveSignal()` returns a placeholder that automatically rewires to the live registry on transport register. So the shared-file pattern works for every consumption site, including server-only writers, SSR render functions, and client-side bindings.

## Component dependencies. Use the framework's context argument

Components for `renderForHydration` / `registerComponents` accept two arguments. The first is the JSON-serializable `state` that flows through the SSR script block to the client. The second is `context`, a non-serialized runtime bag you provide via the framework's `options.context` hook. Use it for anything that cannot or should not be serialized: a live transport handle, local signals, identity, toast trays, persistence handles.

The server and the client each construct their own context (the shape matches; the runtime values differ). Neither side closes over the other's bag, and the framework wires the appropriate one in for each environment.

```javascript
// shared/env.js
import { signal } from 'kensington';

export function makeServerEnv() {
  return { userId: 'ssr', userName: signal(''), toasts: signal([]), transport: null };
}
export function makeClientEnv({ userId, transport }) {
  return { userId, userName: signal(localStorage.getItem('name') ?? ''), toasts: signal([]), transport };
}

// shared/app-page.js. Signature is (state, env).
import { t } from 'kensington';
export function appPage(_state, env) {
  return t.main([header(env), seatGrid(env), toastTray(env)]);
}

// server.js
import { renderForHydration } from 'kensington';
import { makeServerEnv } from './shared/env.js';
import { appPage } from './shared/app-page.js';

const env = makeServerEnv();
renderForHydration(appPage, {}, 'appPage', { context: env });

// client.js
import { registerComponents } from 'kensington';
import { connectLive } from 'kensington/live';
import { makeClientEnv } from './shared/env.js';
import { appPage } from './shared/app-page.js';

const transport = connectLive({ /* ... */ });
const env = makeClientEnv({ userId, transport });
registerComponents({ appPage }, { context: env });
```

### What goes where

- **`state` (first arg)**: serializable per-request data the client hydrates from. Request id, initial counts, pre-fetched data. Round-trips through JSON. Limited to plain values.
- **`context` (second arg)**: non-serializable runtime bag. Transport handles, signals, factories, identity. Same shape on both sides, different values. Never serialized.

### What not to do

- **Do not return `htmlWithDocType` (or any full document) from a component function.** `renderForHydration` stamps a `data-k-mount-target` attribute on the component's root opening tag. That injection fails if the serialized output starts with `<!DOCTYPE` instead of an element tag, and the framework throws with a clear message. The component must return a fragment — `t.div`, `t.main`, `t.section`, etc. Build the full HTML document in the server route and embed `renderForHydration`'s `LiteralTag` output inside `t.body(...)`. Example: `t.body([ component, t.script({ src: '/client.js', type: 'module' }) ])`.
- **Do not read browser globals (`localStorage`, `sessionStorage`, `location`, `document`, etc.) inside component functions.** Component functions run on the server during `renderForHydration` where those globals don't exist. Read them in the env factory (`makeClientEnv`) and pass the values in through `context`. The component stays pure; the env factory owns all environment access.
- **Do not pass a runtime bag through `state`.** Signals serialized through `JSON.stringify` lose their methods; the framework fires `renderForHydration "..." N values — Signal will lose its methods` to catch this.
- **Do not use a `setEnv`/`getEnv` singleton.** Module-mutable state masquerading as a context system. Only works because SSR rendering happens to be synchronous today; one async sneak-in cross-contaminates concurrent requests.
- **Do not wrap the registered fn in a closure to inject env.** `renderForHydration(state => appPage(env, state), state, 'appPage')` is awkward at the call site and the second arg `context` exists to make it unnecessary.
- **Do not import runtime data as module-scope state inside component files** (transport handles, identity-derived signals, etc.). The temptation reads as "import what you need." The problem is that the same component file runs on both server and client, and module-scope state in a shared file means concurrent SSR renders share the same instance. Keep `liveSignal` declarations module-scope (the placeholder + lazy-upgrade flow exists for them) and route everything else through the env bag.
- **Do not `.set()` during SSR.** The `set-during-ssr` warning catches it. If the server needs to push canonical values, do it via the explicit `liveServer.set(name, value)` API outside any render path.

## Validation and error policy

`validationLevel` controls how invalid input is handled: `'off'` silently renders nothing (no errors, no warnings), `'warn'` logs via `logger` and renders nothing, `'error'` throws. Never throw when `validationLevel` is `'off'`. Production deployments use `'off'` for performance, and an unexpected throw can crash a server or break a user-facing page. Invalid input at `'off'` must be silently skipped. This applies to invalid attribute values, invalid content items, bad `literal()` input, bad `inlineComment()` input, and any other runtime validation.

## Common mistakes to avoid

General Kensington mistakes.

- Do not use JSX or tagged template literals. Kensington uses method calls only
- Do not pass content to void elements (`input`, `br`, `img`, `hr`, `meta`, `link`). They take options only, no content
- Do not import `t` as a default import . `t` is a named export; the default export is the `Kensington` class
- Do not skip `.toString()` when passing to HTTP framework response methods
- Do not use `onclick="string"` for DOM usage. Pass a function; string handlers only serialize in `.toString()`
- For drag-and-drop sortable lists, add `persist: true` to the item tag, not the container. Without it, `insertBefore` reorders fire a remove event that permanently stops the item's signal effects (class updates, checked state, etc. all break silently after the first drag). `persist: true` causes effects to pause on removal and resume on re-insertion instead.
- For per-row local state inside a list mapping, use the keyed form. `signal(initial, item.id)` inside the surrounding `computed` callback returns the same instance per key across re-runs. Without a key, the DOM node is replaced on every outer re-render (focus, scroll, input value, and selection are copied over, but local signal state resets to the initial value).

Coming from React or Svelte. These traps catch agents whose muscle memory is built on a different execution model.

- **The component function does not re-run.** Kensington has no render loop. A component runs once at mount, and signals declared in its body are stable for the tag's lifetime. Do not put logic in the function body that you expect to re-execute when state changes. Put it in a `computed`, an `effect`, or an event handler.
- **`effect()` does not support a cleanup return value.** Unlike React's `useEffect`, returning a function from the effect body is silently ignored. Intervals, subscriptions, and other resources allocated inside the callback are not cleaned up. For teardown tied to a component's lifetime, use `addConnectedCallback` and `addDisconnectedCallback` on the surrounding tag, or store the return handle from `effect()` and call its `.stop()` in a disconnect callback.
- **Do not early-return from a component to conditionally skip rendering.** A component must return one `ContentTag`. For conditional UI, use `null`, `false`, `''`, `undefined`, or `true` items inside a content array (they drop silently), or a `signal` / `computed` / `.transform()` that swaps the subtree in place.
- **Do not call `signal()` inside a callback that re-runs.** React's `useState(initial)` is hook-tracked across renders. An unkeyed `signal(0)` inside a `computed` body, a `.transform()` callback, or a `mapWithKey` mapFn allocates a new instance on every run and loses its value. Pass a key (`signal(0, 'open')`) or hoist the declaration into the surrounding non-reactive scope.
- **Do not rely on prop-identity comparisons.** There is no `React.memo`, no `===` cutoff on prop changes, no Svelte assignment-tracking. Reactivity is per-signal. Only the bindings that read a changed signal update. Pass signals (not snapshots) when downstream code needs reactivity.
- **DOM access is not a ref object.** There is no ref that fills in after mount. Get the live element by capturing the return of the tag's `toElement()`, or via `addConnectedCallback(el => { ... })` where `el` is the live DOM node passed in. For a stable handle inside a component, declare a `let ref;` outside the tag and assign in the connect callback.
- **Two-way binding is two one-way bindings.** `bind:value` / `v-model` style does not exist. Pair `prop: { value: sig }` with `oninput: e => sig.set(e.target.value)` (or `onchange` for selects and checkboxes).
- **No `setState` batching to think about.** All signal writes in a synchronous block are coalesced into one flush automatically. Do not reach for `unstable_batchedUpdates` or `tick()` style helpers.

## HTML to Kensington CLI

`npx kensington` converts HTML to Kensington code.

Input modes: file argument (`npx kensington file.html`), pipe (`echo '<p>hi</p>' | npx kensington`), redirect (`npx kensington < file.html`), or interactive paste in the terminal.

Options: `--copy`/`-c` copies output to clipboard; `--help`/`-h` prints usage.

Conversion rules:
- Kebab-case attribute names become camelCase: `data-bs-toggle` becomes `dataBsToggle`
- Two or more `data-*` or `aria-*` attributes with a shared prefix are grouped into a nested object: `{ aria: { expanded: "true", controls: "panel1" } }`
- `style` is expanded to a JS object with camelCase keys: `style="color: red"` becomes `{ style: { color: "red" } }`
- Boolean attributes (no value) map to `true`
- A full document with `<!DOCTYPE html>` maps to `htmlWithDocType`. Multiple root elements produce an array
- SVG camelCase element names (e.g. `linearGradient`) are preserved
- HTML comments convert to `t.inlineComment()`
- `<script>` and `<style>` text content is passed through as a plain string

If ESLint or Prettier is installed in the working directory, the converter reads `max-len`/`printWidth` for line-breaking and runs the formatter over the output.

## Key types

| Type | Description |
|------|-------------|
| `ContentTag` | Returned by content element methods (`div`, `p`, `span`, ...). Has `.toString()` and `.toElement()`. |
| `VoidTag` | Returned by void element methods (`br`, `hr`, `input`, ...). Extends `ContentTag`. Has `.toString()` and `.toElement()`. |
| `LiteralTag` | Returned by `.literal()` / `.unsafeLiteral()`. |
| `CommentTag` | Returned by `.inlineComment()`. |
| `Content` | `string \| number \| ContentTag \| VoidTag \| LiteralTag \| CommentTag \| Content[]`. Valid content for any tag method. |
| `ContentMethod<T>` | Type of a custom element method. `T` is the element-specific attribute type. |
| `GlobalAttributes` | Attributes shared by all HTML elements. |
| `GlobalEvents` | Event handler attributes (`onclick`, `oninput`, ...) with specific DOM event types. |
| `UniversalAttributes` | Intersection of `GlobalAttributes`, `GlobalEvents`, and `NameSpaceAttributes`. |
| `NameSpaceAttributes` | Interface to extend for custom attribute namespaces. |
