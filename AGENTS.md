# Kensington

HTML/SVG/MathML library for JavaScript and TypeScript. Tags are method calls on a `Kensington` instance, returning tag objects that serialize to formatted HTML strings (`.toString()`) or live DOM nodes (`.toElement()`).

## Imports

```javascript
import { t } from 'kensington';               // shared default instance. Use this in most cases
import Kensington from 'kensington';           // class. Use when subclassing or custom config
import { formAttributes } from 'kensington/attributes';  // attribute objects for each element
```

```typescript
import type { ContentTag, VoidTag, LiteralTag, CommentTag, Content, ContentMethod } from 'kensington';
import type { NameSpaceAttributes, GlobalAttributes, GlobalEvents, UniversalAttributes } from 'kensington';
```

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
- Boolean: `{ checked: true }` → `checked`; `{ checked: false }` → attribute omitted
- `class` accepts a string or array: `{ class: ['a', 'b'] }` → `class="a b"`
- `style` accepts an object: `{ style: { backgroundColor: 'red' } }` → `style="background-color: red"`. Keys can be camelCase or kebab-case. Static values of `null`, `undefined`, `false`, or `''` are silently omitted. Individual property values also accept signals. Only the changed property is written to the DOM on each update. `style: { color: colorSignal, fontSize: '1rem' }` sets `font-size` once at render time and updates only `color` reactively.
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

## Raw HTML

```javascript
t.literal('<p>trusted raw html</p>');    // HTML-encodes content, blocks script tags
t.unsafeLiteral('<script>...</script>'); // no encoding. Trusted HTML only
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

## Custom elements

```typescript
import Kensington, { type ContentMethod } from 'kensington';

class MyEngine extends Kensington {
  myCard: ContentMethod<{ 'card-type'?: 'primary' | 'secondary' }> =
    this.createCustomTag('my-card', { 'card-type': ['primary', 'secondary'] });
}
```

## TypeScript. Namespace augmentation

Add attribute namespaces globally via module augmentation so custom attributes are valid everywhere in your project:

```typescript
declare module 'kensington' {
  interface NameSpaceAttributes {
    [key: `hx${string}`]: string | object;
  }
}

// Now valid anywhere in your project:
t.div({ hxBoost: 'true', hxTarget: '#result' });
t.form({ hxPost: '/api/submit', hxSwap: 'outerHTML' });
```

## Reactive data

Signals and `computed` work in any JavaScript environment. `.toElement()` and DOM-mutating effects require a browser. During `renderForHydration`, `effect()` is suppressed entirely. Browser-only code inside an `effect()` is safe to call on the server.

```javascript
import { t, signal, computed, effect, isBrowser, Signal } from 'kensington';
import { renderForHydration, registerComponents } from 'kensington';
```

### Signal API

```javascript
const n = signal(0);
n.get()                   // read; subscribes inside computed/effect
n.value                   // read without tracking; does not create a dependency inside computed/effect
n.set(1)                  // set
n.set(v => v + 1)         // update via function
n.stop()                  // clear all subscribers; signal retains current value
n.toJSON()                // returns the current value; makes signals transparent to JSON.stringify
n.toString()              // returns String(this.get()); works in template literals and string concatenation

const double = n.transform(v => v * 2)                       // derived; chainable
const label  = computed(() => n.get() === 1 ? 'item' : 'items')  // read multiple signals

// Keyed form. Inside a computed, returns the same instance per key across re-runs.
// Outside a computed the key is ignored and a fresh signal is returned each call.
const editing = signal(false, item.id)

// Keyed computed form. Inside a computed, returns the same inner computed instance per
// key across re-runs. The fn closure is updated automatically on each outer re-run.
// Outside a computed the key is ignored and a normal computed is returned.
const matches = computed(() => activeFilter.get() === item.category, item.id)

// .transform() also accepts a key. Same lifecycle as computed(fn, key).
const matchesT = activeFilter.transform(f => f === item.category, item.id)
```

`isKensingtonSignal` is exported as a named export for duck-typing signal checks that work across module instances:

```javascript
import { isKensingtonSignal, signal } from 'kensington';

function maybeSignal(value) {
  return isKensingtonSignal(value) ? value : signal(value);
}
```

Use `.value` instead of `.get()` when you need the current value inside an `effect` or `computed` but do not want that signal to be a dependency. The most important case is when the same signal is written to later in the same async flow. Using `.get()` would subscribe the effect to it, and the subsequent `.set()` would re-trigger the effect.

```javascript
const searchTerm   = signal('');
const previousTerm = signal('');  // shown in the UI, so it must be a signal

effect(() => {
  fetch(`/search?q=${searchTerm.get()}`)
    .then(r => r.json())
    .then(data => {
      results.set(data);
      previousTerm.set(searchTerm.value);  // .value avoids re-triggering this effect
    });
});
```

### As content and option values

```javascript
const count     = signal(0);
const isLoading = signal(false);
const cls       = computed(() => isLoading.get() ? 'btn btn--loading' : 'btn');

t.p(count)                                        // live text content
t.p([count, ' items'])                            // mixed with static text
t.button({ class: cls, disabled: isLoading }, 'Save')  // live attribute + boolean attribute
t.input({ type: 'search', value: query })         // live value attribute
```

Use `.transform(String)` when an attribute expects a string but the signal holds a non-string value:

```javascript
const liked = signal(false);
t.button({ ariaPressed: liked.transform(String) }, '♥');
```

### DOM properties with `prop`

HTML attributes and DOM properties diverge after user interaction. For example, `input.value` reflects what the user typed, while `getAttribute('value')` still returns the original default. Use the `prop` key to assign directly to DOM properties via `el[name] = value`, bypassing `setAttribute`:

```javascript
const userInput = signal('');

// Assigns el.value = ''. Syncs the live property, not the HTML attribute
t.input({ type: 'text', prop: { value: userInput } }).toElement();

// Resetting a controlled input
userInput.set('');  // el.value resets immediately via the live effect
```

`prop` also works for properties with no HTML attribute equivalent:

```javascript
const vid = t.video({ src: '/intro.mp4', prop: { muted: true, playbackRate: 1.5 } });
```

`prop` is silently ignored in `.toString()`. Known writable properties on the element's DOM interface are typed in TypeScript. Expando properties (arbitrary string keys) are also accepted as `unknown`. Property existence and writability are validated at render time via `validationLevel`.

### effect

Runs immediately; re-runs when any signal read inside changes. Multiple synchronous `.set()` calls batch into one re-run via microtask.

```javascript
const e = effect(() => {
  document.title = count.get() === 0 ? 'Home' : `(${count.get()}) Home`;
});

e.pause();   // temporarily unsubscribe; no runs while paused
e.resume();  // restart: re-runs the callback and re-establishes all signal subscriptions
e.stop();    // permanently destroy; resume() becomes a no-op after this
```

### Keyed lists

```javascript
const items = signal([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);

const rows = items.transform(list =>
  list.map(item => t.tr({ dataKey: item.id }, t.td(item.name)))
);

t.tbody(rows);
```

Add `dataKey` whenever items may reorder, be added, or removed. Reused nodes are diffed recursively; signal effects on discarded nodes are stopped automatically. Keyed nodes whose attributes and content are structurally unchanged from the previous render are reused as-is without a diff pass, so the naive `arr.map(item => t.tr({ dataKey: item.id }, item.name))` pattern is efficient without memoization. Functions compare by reference: a fresh inline arrow function causes the snapshot to fall through to `syncNode`, which transfers event listeners from the old node to the new one so the latest handler is always installed. `Signal`, `LiteralTag`, and other class instances compare by reference. Store signals on the item object for stable per-row reactivity.

For drag-and-drop sortable lists where DOM nodes are moved via `insertBefore`, add `persist: true` to each item tag so signal effects survive the move. See **Cleanup** below.

### Reactive primitives inside a computed need a key

When you create a `signal()`, `computed()`, or `.transform()` inside a `computed` callback, pass a stable `key` as the second argument. This applies uniformly to all three forms: the key scopes the instance to the surrounding `computed` so the same instance is reused across outer re-runs. Use the item identity (typically `item.id`).

```javascript
const items  = signal([{ id: 'a', name: 'Apple', cat: 'fruit' }, { id: 'b', name: 'Bagel', cat: 'bread' }]);
const filter = signal('fruit');

const list = computed(() => items.get().map(item => {
  // Keyed signal. Per-item local interactive state.
  const highlight = signal(false, item.id);
  // Keyed computed. Derived value that reads multiple signals.
  const cls = computed(() => [
    filter.get() === item.cat && 'match',
    highlight.get() && 'starred',
  ].filter(Boolean).join(' '), item.id);
  // Keyed transform. Single-source derivation, chained off the filter signal.
  const matches = filter.transform(f => f === item.cat ? 'in-filter' : 'out', item.id);
  return t.li({
    dataKey: item.id,
    class: cls,
    data: { state: matches },
    onclick: () => highlight.set(v => !v),
  }, item.name);
}));

t.ul(list);
```

**Shared lifecycle.** The three forms use the same per-computed registry. Same key returns the same instance across re-runs. When an item leaves the list, its keyed instance is stopped automatically and removed from the registry on the next sweep. When the outer computed is permanently stopped, all its keyed instances are stopped too. When the outer sleeps (auto-dispose), the registry is preserved so a later wake reuses the same instances.

**Closure refresh.** For `computed(fn, key)` and `signal.transform(fn, key)`, the fn closure is replaced on every outer re-run, so captured variables (like `item.label`) stay fresh even though the instance identity is stable. For `signal(initial, key)`, only the first call's `initial` is used; subsequent calls return the existing signal unchanged.

**Don't escape the scope.** Don't reference a keyed instance from outside the owning `computed`. The owner can stop it at any time, after which external subscribers silently stop receiving updates. Two safe inline patterns:

1. Consume via method chain: `.get()`, `.transform(...)`, `.toString()`, etc.
2. Pass directly to a tag as content or an attribute value. The DOM binding's lifetime is tied to the DOM, which the owner controls anyway.

The library emits a runtime warning (and the `no-out-of-scope-reactive-reference` lint rule catches it statically) when a keyed instance is subscribed to from outside the owner.

**Key types.** The `key` argument accepts any value usable in a `Map`: `string`, `number`, `symbol`, or `object` (exported as the `SignalKey` type). Object keys (e.g. passing `item` itself as the key) work as long as the same reference survives across outer re-runs. Immutable update patterns that clone the item (`items.set(list.map(i => i.id === x ? { ...i, … } : i))`) produce a new object reference, so its object-as-key would change and the keyed state would be lost. Prefer `item.id`; reach for object keys only with stable item references.

**Duplicates.** Two calls with the same key in the same outer run share a single instance between two items and log a `throttledError` to console. Use the item identity to ensure uniqueness.

**DOM identity.** For best DOM identity preservation, bind keyed signals directly to attributes or via `.transform(fn, item.id)` rather than through a fresh unkeyed `.transform()` each render. An unkeyed `.transform()` creates a new derived signal per outer run, which the reconciler treats as a signal-reference mismatch and rebuilds the node. State still persists via the keyed source signal, but a direct attribute binding or a keyed transform lets the node stay in place:

```javascript
// Editing state toggled via a data attribute. CSS swaps the visible element.
const list = computed(() => items.get().map(item => {
  const editing = signal('view', item.id);
  return t.li({ dataKey: item.id, data: { editing } }, [
    t.span({ class: 'task-text', ondblclick: () => editing.set('edit') }, item.text),
    t.input({ class: 'task-edit-input', prop: { value: item.text } }),
  ]);
}));
// CSS: .task-item[data-editing="view"] .task-edit-input { display: none; }
//      .task-item[data-editing="edit"] .task-text       { display: none; }
```

**Unkeyed fallback.** `signal()`, `computed()`, and `.transform()` inside a `computed` without a key still work. The reconciler detects the changed instance reference and replaces the DOM node so the fresh instance can drive it. Focus, scroll, input value, and selection are preserved across the swap; local state resets to the initial value. The library logs a `console.warn` for each form (with form-specific wording) suggesting the keyed alternative.

### Cleanup

`computed()` and `transform()` signals auto-dispose: when the last subscriber (a DOM effect or a downstream computed) is removed, the computed unsubscribes from its source signals and freezes its value. When something reads it inside a reactive context again, it revives and re-subscribes. This means computed chains used to build a DOM subtree clean themselves up automatically when that subtree is removed. No manual teardown needed.

`.get()`, `.value`, and `.toJSON()` on a sleeping computed always return a fresh value even outside a reactive context. The computed wakes briefly, re-runs its function, and sleeps again without leaving a subscription behind.

`.toElement()` stops reactive effects automatically when the element is removed from the DOM. For elements that will be moved or temporarily removed and re-inserted, add `persist: true` to the tag options. Effects pause on removal and resume on re-insertion, across any number of cycles. The main use case is items in a drag-and-drop sortable list, where the reconciler reorders nodes via `insertBefore`:

```javascript
// signal effects on this item (class, checked, etc.) survive drag-reorder moves
const item = t.li({ 'data-key': task.id, persist: true }, content);
```

`persist: true` is silently ignored in `.toString()` and has no effect server-side.

For standalone `effect()` calls, stop manually:

```javascript
class MyWidget extends HTMLElement {
  #fx = null;

  connectedCallback() {
    const active = signal(false);
    this.#fx = effect(() => { this.classList.toggle('active', active.get()); });
  }

  disconnectedCallback() { this.#fx?.stop(); }
}
```

### isBrowser

```javascript
// Guard module-level or computed() code that calls browser-only APIs
const stored = isBrowser ? localStorage.getItem('theme') : null;

// Inside effect(). Always safe; effect is a no-op on the server
effect(() => { localStorage.setItem('theme', dark.get() ? 'dark' : 'light'); });
```

### DevTools

Import `kensington/devtools` in your dev entry point. It mounts the panel overlay in one step. Guard it so it never runs in production:

```javascript
if (import.meta.env.DEV) {
  await import('kensington/devtools');
}
```

The panel is a shadow-DOM-isolated overlay in the bottom-right corner. Click the **K** badge to open it. Four tabs:

- **Signals**. Plain signals: current value, set count, DOM visibility indicator (● visible, ○ in DOM but hidden,. Not in DOM), subscriber count. Hover the subscriber count for a tooltip listing subscribed effects. Click a row to highlight and scroll to the bound DOM element. Keyed signals (created via `signal(initial, key)` inside a computed) show their key as a pink chip alongside binding labels.
- **Computed**. Computed signals, same columns. Entries disappear when auto-disposed (no subscribers) and reappear on re-subscription.
- **Effects**. User `effect()` calls: state (active/paused), run count, function source.
- **DOM**. Live signal-to-DOM bindings (attributes, props, content): element descriptor, binding label (e.g. `class`, `prop:checked`, `style:color`, `(content)`), state, run count. Hover a row to outline the element in the page; click to scroll to it.

The hook is zero-cost when not enabled. All instrumentation calls are guarded by an `enabled` flag and return immediately when disabled. Do not enable in production.

### Loading state

A signal can hold a tag, a string, an array, or `null`. Switching types is fine:

```javascript
import { t, signal } from 'kensington';

const view = signal(t.p({ class: 'spinner' }, 'Loading...'));

fetch('/api/data')
  .then(r => r.json())
  .then(data => {
    view.set([
      t.h2(data.title),
      t.p(data.body),
    ]);
  })
  .catch(() => {
    view.set(t.p({ class: 'error' }, 'Failed to load.'));
  });

document.body.append(t.div({ class: 'content' }, view).toElement());
```

### Hydration

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

#### Component authoring rules

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

#### Known tradeoffs

These are deliberate simplicity tradeoffs, not bugs.

**DOM replacement, not true hydration.** `registerComponents` replaces the entire SSR DOM with a fresh `toElement()` call rather than reusing existing nodes. In practice the replacement is imperceptible: `replaceWith()` is synchronous and the visual output is identical. An inline `<style>` tag suppressing transitions on `[data-k-mount-target]` is injected automatically so CSS animations do not re-trigger.

**Non-interactive window.** Between the browser's first paint of the SSR HTML and when the hydration script runs, elements are rendered but not reactive. This is inherent to any SSR-then-hydrate approach.

**Signals created during SSR are not stopped.** `renderForHydration` calls `fn(state)`, which creates signal and computed objects that are never explicitly stopped. They are unreachable after the request and will be garbage collected, but they add memory pressure on high-traffic servers.

**State is plaintext in the page source.** The state passed to `renderForHydration` is embedded as a `<script type="application/json">` tag visible to anyone who views source. Do not pass secrets, tokens, or private data as hydration state.

**`fn.name` is fragile under aggressive minification.** Server code is typically not minified, so `fn.name` is reliable in practice. If server code is bundled and minified, pass an explicit name as the third argument.

**Module-level computeds that are never subscribed to retain their source subscriptions indefinitely.** `computed()` auto-disposes when its last subscriber is removed, but a computed that never gains a subscriber never enters that cycle. Its internal `update` function stays subscribed to its source signals for the lifetime of the module. This is only a concern for computeds declared at module scope that are intentionally read outside a reactive context (e.g. in route handlers or CLI scripts). The fix is to call `.stop()` explicitly when the computed is no longer needed.

## Validation and error policy

`validationLevel` controls how invalid input is handled: `'off'` silently renders nothing (no errors, no warnings), `'warn'` logs via `logger` and renders nothing, `'error'` throws. Never throw when `validationLevel` is `'off'`. Production deployments use `'off'` for performance, and an unexpected throw can crash a server or break a user-facing page. Invalid input at `'off'` must be silently skipped. This applies to invalid attribute values, invalid content items, bad `literal()` input, bad `inlineComment()` input, and any other runtime validation.

## Common mistakes to avoid

- Do not use JSX or tagged template literals. Kensington uses method calls only
- Do not pass content to void elements (`input`, `br`, `img`, `hr`, `meta`, `link`). They take options only, no content
- Do not import `t` as a default import . `t` is a named export; the default export is the `Kensington` class
- Do not skip `.toString()` when passing to HTTP framework response methods
- Do not use `onclick="string"` for DOM usage. Pass a function; string handlers only serialize in `.toString()`
- For drag-and-drop sortable lists: add `persist: true` to the item tag, not the container. Without it, `insertBefore` reorders fire a remove event that permanently stops the item's signal effects (class updates, checked state, etc. all break silently after the first drag). `persist: true` causes effects to pause on removal and resume on re-insertion instead.
- For per-row local state inside a list mapping, use the keyed form: `signal(initial, item.id)` inside the surrounding `computed` callback returns the same instance per key across re-runs. Without a key, the DOM node is replaced on every outer re-render (focus, scroll, input value, and selection are copied over, but local signal state resets to the initial value).

## Reactive pitfalls

Most of these are caught at lint time by [`eslint-plugin-kensington`](https://www.npmjs.com/package/eslint-plugin-kensington). Install it in any project that uses signals. It catches `.set()` inside a computed, `.get()`-then-`.set()` self-loops, async writes inside effects, missing keys on `signal()` calls inside a computed, and other patterns covered below.

```bash
npm install --save-dev eslint-plugin-kensington
```

```javascript
// eslint.config.js
import kensington from 'eslint-plugin-kensington';

export default [
  kensington.configs.recommended,
];
```

### Do not read and write the same signal in the same effect or computed run

Calling `.get()` on a signal creates a subscription. If the same run then calls `.set()` on the same signal, the write re-triggers the run, which writes again, creating an infinite loop. Use `.value` when you need the current value without subscribing.

```javascript
// Wrong . .get() subscribes, then .set() re-triggers the effect
effect(() => {
  if (counter.get() > 10) {
    counter.set(0); // re-triggers this effect every time counter changes
  }
});

// Correct . .value reads without subscribing
effect(() => {
  if (someOtherSignal.get() && counter.value > 10) {
    counter.set(0); // safe. Counter is not a dependency of this effect
  }
});
```

### Do not call `.set()` inside a `computed` body

Computeds must be pure derivations. Any `.set()` call inside a computed is a side effect that corrupts the dependency graph. Move write logic into a separate `effect`.

```javascript
// Wrong
const rows = computed(() => {
  const visible = items.get().filter(isActive);
  if (!visible.length) { selectedId.set(null); } // side effect in a computed
  return visible.map(item => t.li(item.name));
});

// Correct. Pure computed for the UI, separate effect for the side effect
const visibleItems = computed(() => items.get().filter(isActive));

effect(() => {
  if (!visibleItems.get().length) { selectedId.set(null); }
});
```

### Do not use `queueMicrotask` to defer a `.set()` inside an effect or computed

If the surrounding effect or computed reads the signal via `.get()`, it is subscribed. The deferred write re-triggers the run, which queues another microtask, which writes again. An infinite chain that freezes the browser tab. Use `.value` for reads that should not create a dependency, and write directly without the deferral.

The canonical case is auto-selecting the first item when a filtered list changes:

```javascript
// Wrong . .get() subscribes, queueMicrotask fires after the flush and re-triggers
computed(() => {
  const visible = items.get().filter(isActive);
  if (!selectedId.get() || !visible.some(i => i.id === selectedId.get())) {
    queueMicrotask(() => selectedId.set(visible[0]?.id ?? null));
  }
  return visible.map(item => t.li({ dataKey: item.id }, item.name));
});

// Correct. Dedicated effect, .value avoids subscribing to selectedId
effect(() => {
  const visible = items.get().filter(isActive);
  if (!selectedId.value || !visible.some(i => i.id === selectedId.value)) {
    selectedId.set(visible[0]?.id ?? null);
  }
});
```

### Do not use `setTimeout(() => {}, 0)` to defer `.set()` calls

`setTimeout` is a macrotask. It fires after the browser renders, so the UI shows a frame of incorrect state before correcting itself. It also signals that the dependency graph is not quite right. Restructure with `.value` or a separate `effect` instead.

### Do not create computed signals inside a computed or transform callback

When a `transform` or `computed` callback re-runs, any `transform()` or `computed()` call inside it creates a new derived signal on every re-render. The reconciler detects the reference change at the same attribute or content position and rebuilds the DOM node so the new derived signal can drive the live element. DOM state (focus, scroll, input value, selection) is preserved across the rebuild, but the work is wasteful, and the old derived signal becomes an orphan that sleeps and accumulates in the devtools Signals tab on every list update.

Unlike `signal()`, there is no keyed form for `computed()` or `transform()`. The fix is to attach derived signals to the item object when it is created so the same reference is reused on every render.

```javascript
// Wrong. done.transform() creates a new computed on every list re-render.
// Snapshot fails for all existing items (old signal !== new signal), so the
// reconciler rebuilds the DOM node each time and produces sleeping orphan computeds.
const rows = tasks.transform(list =>
  list.map(({ id, text, done }) => {
    const itemClass = done.transform(d => d ? 'task-item done' : 'task-item');
    return t.li({ dataKey: id, class: itemClass }, text);
  })
);

// Correct. Create itemClass once when the task is created and store it on the object.
// The snapshot sees the same signal reference every render and hits the fast-path.
function makeTask(text) {
  const done = signal(false);
  return {
    id: Date.now(),
    text,
    done,
    itemClass: done.transform(d => d ? 'task-item done' : 'task-item'),
  };
}

const rows = tasks.transform(list =>
  list.map(({ id, text, itemClass }) => t.li({ dataKey: id, class: itemClass }, text))
);
```

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

---

## Examples

### Layout with shared header and footer

```javascript
// layout.js
import { t } from 'kensington';

export function layout(title, content) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.title(title),
      t.link({ rel: 'stylesheet', href: '/style.css' }),
    ]),
    t.body([
      t.header(
        t.nav({ class: 'nav' }, [
          t.a({ href: '/', class: 'nav-brand' }, 'My App'),
          t.ul({ class: 'nav-links' }, [
            t.li(t.a({ href: '/about' }, 'About')),
            t.li(t.a({ href: '/contact' }, 'Contact')),
          ]),
        ])
      ),
      t.main({ class: 'container' }, content),
      t.footer(t.p('© 2025 My App')),
    ]),
  ]).toString();
}
```

### Tailwind CSS

The class array makes long Tailwind class lists easier to read and conditionally modify:

```javascript
import { t } from 'kensington';

// Conditional classes are natural with arrays. False/null entries are dropped
function button(label, { variant = 'primary', disabled = false } = {}) {
  return t.button({
    type: 'button',
    disabled,
    class: [
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
      variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      variant === 'secondary' && 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
      variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      disabled && 'opacity-50 cursor-not-allowed',
    ],
  }, label);
}

// Card component
function card(title, body) {
  return t.div({ class: 'rounded-lg border border-gray-200 bg-white shadow-sm p-6' }, [
    t.h3({ class: 'text-lg font-semibold text-gray-900 mb-2' }, title),
    t.div({ class: 'text-gray-600 text-sm' }, body),
  ]);
}

// Alert banner
function alert(message, type = 'info') {
  const styles = {
    info:    'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error:   'bg-red-50 text-red-800 border-red-200',
  };
  return t.div({ class: `rounded-md border px-4 py-3 text-sm ${styles[type]}` }, message);
}

// Page with a responsive grid
t.div({ class: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' }, [
  t.h1({ class: 'text-3xl font-bold text-gray-900 mb-6' }, 'Dashboard'),
  alert('Your trial expires in 3 days.', 'warning'),
  t.div({ class: 'mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' }, [
    card('Users', '1,284 total'),
    card('Revenue', '$24,500 this month'),
    card('Active sessions', '42 right now'),
  ]),
  t.div({ class: 'mt-8 flex gap-3' }, [
    button('Save changes'),
    button('Cancel', { variant: 'secondary' }),
    button('Delete account', { variant: 'danger' }),
  ]),
]);
```

### Express server with multiple routes

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

### Express. Render helper middleware

Attach a `res.renderKensington` helper so routes never call `.toString()` directly:

```javascript
// middleware/render.js
import { layout } from './layout.js';
export function renderMiddleware(req, res, next) {
  res.renderKensington = (pageFunc, ...args) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(layout(pageFunc(...args)).toString());
  };
  next();
}

// server.js
import express from 'express';
import { t } from 'kensington';

import { homePage, usersPage } from './pages.js';
import { renderMiddleware } from './middleware/render.js';

const app = express();
app.use(renderMiddleware);

app.get('/', (req, res) => {
  res.renderKensington(homePage, { title: 'Home' });
});

app.get('/users', async (req, res) => {
  const users = await db.getUsers();
  res.renderKensington(usersPage, { title: 'Users', users });
});
```

### Hono server

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

### Fastify

```javascript
import Fastify from 'fastify';
import { t } from 'kensington';
import { layout } from './layout.js';

const app = Fastify();

// Add a reply decorator so routes don't call toString() directly
app.decorateReply('html', function (content) {
  return this.header('content-type', 'text/html; charset=utf-8')
             .send(typeof content === 'string' ? content : content.toString());
});

app.get('/', async (req, reply) => {
  return reply.html(layout('Home', t.h1('Welcome')));
});

app.get('/users', async (req, reply) => {
  const users = await db.getUsers();
  return reply.html(layout('Users', [
    t.h1('Users'),
    t.table([
      t.thead(t.tr(['Name', 'Email'].map(h => t.th(h)))),
      t.tbody(users.map(u => t.tr([t.td(u.name), t.td(u.email)]))),
    ]),
  ]));
});

await app.listen({ port: 3000 });
```

### Elysia (Bun)

```javascript
import { Elysia } from 'elysia';
import { t } from 'kensington';
import { layout } from './layout.js';

const app = new Elysia()
  .get('/', () => new Response(
    layout('Home', t.h1('Welcome')),
    { headers: { 'content-type': 'text/html; charset=utf-8' } }
  ))
  .get('/users', async () => {
    const users = await db.getUsers();
    return new Response(
      layout('Users', [
        t.h1('Users'),
        t.ul(users.map(u => t.li(u.name))),
      ]),
      { headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  })
  .listen(3000);
```

### Form with validation errors

```javascript
function contactForm(values = {}, errors = {}) {
  return t.form({ action: '/contact', method: 'post', class: 'form' }, [
    formField('name', 'Name', 'text', values.name, errors.name),
    formField('email', 'Email', 'email', values.email, errors.email),
    t.div({ class: 'field' }, [
      t.label({ for: 'message' }, 'Message'),
      t.textarea({ id: 'message', name: 'message', rows: 5 }, values.message ?? ''),
      errors.message && t.span({ class: 'error' }, errors.message),
    ]),
    t.button({ type: 'submit' }, 'Send'),
  ]);
}

function formField(name, label, type, value, error) {
  return t.div({ class: ['field', error && 'field--error'] }, [
    t.label({ for: name }, label),
    t.input({ id: name, name, type, value: value ?? '' }),
    error && t.span({ class: 'error' }, error),
  ]);
}

// Route handler
app.post('/contact', async (req, res) => {
  const errors = validate(req.body);
  if (Object.keys(errors).length) {
    return res.send(layout('Contact', contactForm(req.body, errors)));
  }
  await sendEmail(req.body);
  res.redirect('/contact/thanks');
});
```

### Data-driven component

```javascript
function productCard({ name, price, image, inStock }) {
  return t.div({ class: ['card', !inStock && 'card--out-of-stock'] }, [
    t.img({ src: image, alt: name, class: 'card-image' }),
    t.div({ class: 'card-body' }, [
      t.h3({ class: 'card-title' }, name),
      t.span({ class: 'card-price' }, `$${price.toFixed(2)}`),
      inStock
        ? t.button({ type: 'button', class: 'btn btn--primary', dataProductId: String(id) }, 'Add to cart')
        : t.span({ class: 'badge badge--muted' }, 'Out of stock'),
    ]),
  ]);
}

// Render a grid
t.div({ class: 'product-grid' }, products.map(productCard));
```

### Pagination

```javascript
function pagination(currentPage, totalPages, baseUrl) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return t.nav({ ariaLabel: 'Pagination', class: 'pagination' },
    t.ul(pages.map(page =>
      t.li(
        t.a({
          href: `${baseUrl}?page=${page}`,
          class: ['pagination-link', page === currentPage && 'pagination-link--active'],
          ariaCurrent: page === currentPage ? 'page' : undefined,
        }, String(page))
      )
    ))
  );
}
```

### Returning fragments

A function can return an array of elements instead of a single wrapper. Kensington flattens arrays anywhere in content, so no wrapper element is needed:

```javascript
function labelAndInput(name, label, type = 'text') {
  return [
    t.label({ for: name }, label),
    t.input({ id: name, name, type }),
  ];
}

t.form([
  t.div({ class: 'field' }, labelAndInput('email', 'Email address', 'email')),
  t.div({ class: 'field' }, labelAndInput('name', 'Full name')),
  t.button({ type: 'submit' }, 'Submit'),
]);
```

```javascript
// Head meta tags as a fragment. No wrapping element
function standardMeta(title, description) {
  return [
    t.meta({ charset: 'utf-8' }),
    t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
    t.meta({ name: 'description', content: description }),
    t.title(title),
  ];
}

t.head([
  ...standardMeta('My Page', 'Welcome to my site'),
  t.link({ rel: 'stylesheet', href: '/style.css' }),
]);
```

### Caching and reuse

Tag objects are immutable. Build shared pieces once and reuse them across renders:

```javascript
const loadingSpinner = t.div({ class: 'spinner', role: 'status', ariaLabel: 'Loading' });

const siteNav = t.nav({ class: 'nav' }, [
  t.a({ href: '/', class: 'nav-brand' }, 'My App'),
  t.ul({ class: 'nav-links' }, [
    t.li(t.a({ href: '/' }, 'Home')),
    t.li(t.a({ href: '/about' }, 'About')),
    t.li(t.a({ href: '/contact' }, 'Contact')),
  ]),
]);

function layout(content, isLoading = false) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head(t.meta({ charset: 'utf-8' })),
    t.body([
      siteNav,
      t.main(isLoading ? loadingSpinner : content),
    ]),
  ]).toString();
}
```

### Inline styles and dynamic classes

```javascript
function progressBar(percent, color = 'blue') {
  return t.div({ class: 'progress' },
    t.div({
      class: 'progress-bar',
      role: 'progressbar',
      style: { width: `${percent}%`, backgroundColor: color },
      ariaValuenow: percent,
      ariaValuemin: 0,
      ariaValuemax: 100,
    })
  );
}
```

### Alpine.js

```javascript
import Kensington from 'kensington';

const t = new Kensington({ additionalNamespaces: ['x'] });

// Dropdown menu with Alpine state
function dropdown(label, items) {
  return t.div({ xData: '{ open: false }', class: 'dropdown' }, [
    t.button({
      type: 'button',
      xOn: { click: 'open = !open' },
      xBind: { ariaExpanded: 'open' },
    }, label),
    t.ul({
      xShow: 'open',
      xOn: { 'click.outside': 'open = false' },
      class: 'dropdown-menu',
    }, items.map(item =>
      t.li(t.a({ href: item.href }, item.label))
    )),
  ]);
}

// Reactive form with live validation
function emailForm() {
  return t.div({
    xData: `{
      email: '',
      get valid() { return this.email.includes('@') },
    }`,
  }, [
    t.input({
      type: 'email',
      xModel: 'email',
      placeholder: 'you@example.com',
    }),
    t.p({
      xShow: 'email && !valid',
      class: 'error',
    }, 'Enter a valid email address.'),
    t.button({
      type: 'submit',
      xBind: { disabled: '!valid' },
    }, 'Subscribe'),
  ]);
}

// Tabs component
function tabs(items) {
  return t.div({ xData: '{ active: 0 }', class: 'tabs' }, [
    t.div({ class: 'tab-list', role: 'tablist' },
      items.map((item, i) =>
        t.button({
          type: 'button',
          role: 'tab',
          xOn: { click: `active = ${i}` },
          xBind: { class: `active === ${i} ? 'tab--active' : ''` },
        }, item.label)
      )
    ),
    t.div({ class: 'tab-panels' },
      items.map((item, i) =>
        t.div({
          role: 'tabpanel',
          xShow: `active === ${i}`,
        }, item.content)
      )
    ),
  ]);
}
```

### SVG

SVG elements use `createElementNS` automatically in `.toElement()`, so namespacing is handled for you. All CSS properties are valid as presentation attributes on SVG elements.

```javascript
import { t } from 'kensington';

// Inline icon
function chevronIcon(direction = 'down') {
  const rotate = { down: 0, up: 180, left: 90, right: -90 }[direction];
  return t.svg({
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    width: 20,
    height: 20,
    style: rotate ? { transform: `rotate(${rotate}deg)` } : {},
    ariaHidden: 'true',
  },
    t.path({
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: 'M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z',
    })
  );
}

// Simple bar chart
function barChart(data) {
  const max = Math.max(...data.map(d => d.value));
  const barWidth = 40;
  const gap = 16;
  const height = 120;
  const width = data.length * (barWidth + gap) - gap;

  return t.svg({ viewBox: `0 0 ${width} ${height}`, width, height },
    data.map((d, i) => {
      const barHeight = (d.value / max) * height;
      return t.g({ transform: `translate(${i * (barWidth + gap)}, 0)` }, [
        t.rect({
          x: 0,
          y: height - barHeight,
          width: barWidth,
          height: barHeight,
          fill: '#3b82f6',
          rx: 4,
        }),
        t.text({
          x: barWidth / 2,
          y: height - barHeight - 4,
          textAnchor: 'middle',
          fontSize: 11,
          fill: '#6b7280',
        }, String(d.value)),
      ]);
    })
  );
}

// Use in a page
t.div({ class: 'chart-container' }, [
  t.h3('Monthly signups'),
  barChart([
    { label: 'Jan', value: 42 },
    { label: 'Feb', value: 68 },
    { label: 'Mar', value: 55 },
    { label: 'Apr', value: 91 },
  ]),
]);
```

### Embedding server data in the page

Pass data from the server to the browser using a `<script type="application/json">` tag. `script` and `style` content is not HTML-encoded, so JSON is safe to embed directly.

```javascript
import { t } from 'kensington';

function pageWithData(title, data, content) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.title(title),
      t.link({ rel: 'stylesheet', href: '/style.css' }),
    ]),
    t.body([
      t.main({ class: 'container' }, content),
      // Embed server data for client-side JS to read
      t.script({ type: 'application/json', id: 'page-data' },
        JSON.stringify(data)
      ),
      t.script({ src: '/app.js', defer: true }),
    ]),
  ]).toString();
}

// In the browser:
// const data = JSON.parse(document.getElementById('page-data').textContent);

// Inline CSS. Array items are joined with newlines
function pageWithInlineStyles(content) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.style([
        'body { margin: 0; font-family: sans-serif; }',
        'h1 { color: #1a1a1a; }',
        '.container { max-width: 960px; margin: 0 auto; padding: 2rem; }',
      ]),
    ]),
    t.body(t.div({ class: 'container' }, content)),
  ]).toString();
}
```

### htmx live search

```javascript
import Kensington from 'kensington';
import { Hono } from 'hono';

const t = new Kensington({ additionalNamespaces: ['hx'] });
const app = new Hono();

// The search input triggers GET /search on each keystroke
function searchPage() {
  return layout('Search', [
    t.input({
      type: 'search',
      name: 'q',
      placeholder: 'Search...',
      hxGet: '/search',
      hxTrigger: 'input changed delay:300ms',
      hxTarget: '#results',
    }),
    t.ul({ id: 'results' }),
  ]);
}

// Returns only the result fragment. Htmx swaps it into #results
app.get('/search', async (c) => {
  const rows = await db.search(c.req.query('q') ?? '');
  return c.html(rows.map(r => t.li(r.name).toString()).join(''));
});
```

### Hydration. Form with server-side validation

The form is rendered on the server with `renderForHydration` and mounted as a reactive component on the client. Submitting calls `fetch` with the form data as JSON. On validation failure the server returns `{ errors }` and the `errors` signal updates, reactively showing each message and adding an error class to the affected field. Input values are preserved because the form element stays in place. No DOM swap, no re-render. On success the server returns `{ success: true }` and the client navigates away.

```javascript
// components/registration-form.js
import { t, signal } from 'kensington';

export function registrationForm() {
  const errors = signal({});

  async function submit(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.errors) {
      errors.set(data.errors);
    } else {
      window.location = '/register/success';
    }
  }

  return t.form({ class: 'form', onsubmit: submit }, [
    formField('name',     'Full name', 'text',     errors),
    formField('email',    'Email',     'email',    errors),
    formField('password', 'Password',  'password', errors),
    t.button({ type: 'submit' }, 'Create account'),
  ]);
}

function formField(name, label, type, errors) {
  const error = errors.transform(e => e[name]);
  return t.div({
    class: error.transform(e => e ? 'field field--error' : 'field'),
  }, [
    t.label({ for: name }, label),
    t.input({ id: name, name, type }),
    error.transform(e => e ? t.p({ class: 'field-error' }, e) : null),
  ]);
}
```

```javascript
// server.js
import { renderForHydration, t } from 'kensington';
import { registrationForm } from './components/registration-form.js';

app.use(express.json());

app.get('/register', (req, res) => {
  res.send(layout('Register', renderForHydration(registrationForm, {})));
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const errors = {};

  if (!name?.trim())                errors.name     = 'Name is required.';
  if (!email?.includes('@'))        errors.email    = 'Enter a valid email address.';
  if ((password?.length ?? 0) < 8) errors.password = 'Password must be at least 8 characters.';

  if (Object.keys(errors).length) {
    return res.json({ errors });
  }

  await db.createUser({ name, email, password });
  res.json({ success: true });
});
```

```javascript
// client.js
import { registerComponents } from 'kensington';
import { registrationForm } from './components/registration-form.js';

registerComponents({ registrationForm });
```

### Browser DOM usage

```javascript
import { t } from 'kensington';

// Build and insert a modal
function createModal(title, bodyContent) {
  return t.div({ class: 'modal', role: 'dialog', ariaModal: 'true', ariaLabel: title }, [
    t.div({ class: 'modal-header' }, [
      t.h2(title),
      t.button({
        type: 'button',
        class: 'modal-close',
        ariaLabel: 'Close',
        onclick: () => modal.remove(),
      }, '×'),
    ]),
    t.div({ class: 'modal-body' }, bodyContent),
  ]).toElement();
}

const modal = createModal('Confirm', t.p('Are you sure?'));
document.body.append(modal);
```

### TypeScript. Typed components

```typescript
import { t } from 'kensington';
import type { ContentTag } from 'kensington';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

function userRow(user: User): ContentTag {
  return t.tr([
    t.td(user.name),
    t.td(t.a({ href: `mailto:${user.email}` }, user.email)),
    t.td(t.span({ class: `badge badge--${user.role}` }, user.role)),
    t.td([
      t.a({ href: `/users/${user.id}/edit` }, 'Edit'),
      t.a({ href: `/users/${user.id}`, dataMethod: 'delete' }, 'Delete'),
    ]),
  ]);
}

function usersTable(users: User[]): ContentTag {
  return t.table({ class: 'table' }, [
    t.thead(t.tr(['Name', 'Email', 'Role', 'Actions'].map(h => t.th(h)))),
    t.tbody(users.map(userRow)),
  ]);
}
```

### TypeScript. Design system with custom elements, htmx, and module augmentation

A more complete pattern: a `Kensington` subclass that defines typed custom design-system elements, module augmentation for htmx attributes, typed domain components, and a typed layout function.

```typescript
// design-system.ts
import Kensington, { type ContentMethod, type Content, type ContentTag } from 'kensington';

// Allow hx-* attributes on every element in this project
declare module 'kensington' {
  interface NameSpaceAttributes {
    [key: `hx${string}`]: string | object;
  }
}

// Subclass adds typed custom elements for the design system
class DS extends Kensington {
  alert: ContentMethod<{ variant?: 'info' | 'success' | 'warning' | 'error' }> =
    this.createCustomTag('ds-alert', { variant: ['info', 'success', 'warning', 'error'] });

  badge: ContentMethod<{ color?: 'blue' | 'green' | 'yellow' | 'red' | 'grey' }> =
    this.createCustomTag('ds-badge', { color: ['blue', 'green', 'yellow', 'red', 'grey'] });
}

const t = new DS({ additionalNamespaces: ['hx'] });

export { t };
export type { Content, ContentTag };
```

```typescript
// issues-page.ts
import { t } from './design-system.js';
import type { ContentTag, Content } from './design-system.js';

interface Issue {
  id: number;
  title: string;
  status: 'open' | 'in-progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
}

const statusColor = {
  open: 'blue',
  'in-progress': 'yellow',
  closed: 'green',
} as const satisfies Record<Issue['status'], 'blue' | 'yellow' | 'green'>;

const priorityColor = {
  low: 'grey',
  medium: 'yellow',
  high: 'red',
} as const satisfies Record<Issue['priority'], 'grey' | 'yellow' | 'red'>;

function issueRow(issue: Issue): ContentTag {
  return t.tr({ dataIssueId: String(issue.id) }, [
    t.td(t.a({ href: `/issues/${issue.id}` }, issue.title)),
    t.td(t.badge({ color: statusColor[issue.status] }, issue.status)),
    t.td(t.badge({ color: priorityColor[issue.priority] }, issue.priority)),
    t.td(issue.assignee ?? t.span({ class: 'muted' }, 'Unassigned')),
    t.td({ class: 'actions' }, [
      t.button({
        type: 'button',
        hxGet: `/issues/${issue.id}/edit`,
        hxTarget: '#modal',
        hxSwap: 'innerHTML',
      }, 'Edit'),
      t.button({
        type: 'button',
        hxDelete: `/issues/${issue.id}`,
        hxConfirm: 'Delete this issue?',
        hxTarget: `[data-issue-id="${issue.id}"]`,
        hxSwap: 'outerHTML swap:0.3s',
      }, 'Delete'),
    ]),
  ]);
}

export function issuesPage(issues: Issue[], flash?: string): string {
  return layout('Issues', [
    flash && t.alert({ variant: 'success' }, flash),
    t.div({ class: 'page-header' }, [
      t.h1('Issues'),
      t.button({
        type: 'button',
        hxGet: '/issues/new',
        hxTarget: '#modal',
        hxSwap: 'innerHTML',
      }, 'New issue'),
    ]),
    t.table({ class: 'table' }, [
      t.thead(t.tr(
        ['Title', 'Status', 'Priority', 'Assignee', ''].map(h => t.th(h))
      )),
      t.tbody(
        issues.length
          ? issues.map(issueRow)
          : t.tr(t.td({ colspan: 5, class: 'empty' }, 'No issues found.'))
      ),
    ]),
    t.div({ id: 'modal' }),
  ]);
}

function layout(title: string, content: Content): string {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.title(title),
      t.link({ rel: 'stylesheet', href: '/style.css' }),
      t.script({ src: 'https://unpkg.com/htmx.org@2', defer: true }),
    ]),
    t.body(t.main({ class: 'container' }, content)),
  ]).toString();
}
```

### Deno

```javascript
import { t } from 'npm:kensington';
import { layout } from './layout.js';

Deno.serve({ port: 3000 }, async (req) => {
  const url = new URL(req.url);
  if (url.pathname === '/') {
    return new Response(layout('Home', t.h1('Welcome')).toString(), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  return new Response('Not found', { status: 404 });
});
```

### Node.js built-in HTTP

```javascript
import http from 'node:http';
import { t } from 'kensington';
import { layout } from './layout.js';

http.createServer(async (req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(layout('Home', t.h1('Welcome')).toString());
    return;
  }
  res.writeHead(404);
  res.end('Not found');
}).listen(3000);
```

### MathML

MathML elements are in the `http://www.w3.org/1998/Math/MathML` namespace. `.toElement()` applies it automatically.

```javascript
import { t } from 'kensington';

// Quadratic formula
const formula = t.math({ display: 'block' },
  t.mrow([
    t.mi('x'),
    t.mo('='),
    t.mfrac([
      t.mrow([
        t.mo('−'), t.mi('b'), t.mo('±'),
        t.msqrt(t.mrow([
          t.msup([t.mi('b'), t.mn('2')]),
          t.mo('−'),
          t.mn('4'), t.mi('a'), t.mi('c'),
        ])),
      ]),
      t.mrow([t.mn('2'), t.mi('a')]),
    ]),
  ])
);

// Inline in a page
t.p(['The solutions are ', formula, '.']);
```

### Reactive data. Counter

```javascript
import { t, signal, computed, effect } from 'kensington';

const count = signal(0);
const label = computed(() => count.get() === 1 ? 'click' : 'clicks');

effect(() => { document.title = `${count.get()} ${label.get()}`; });

document.body.append(
  t.div([
    t.p([count, ' ', label]),
    t.button({ type: 'button', onclick: () => count.set(n => n + 1) }, '+'),
    t.button({ type: 'button', onclick: () => count.set(0) }, 'Reset'),
  ]).toElement()
);
```

### Reactive data. Live filter

```javascript
import { t, signal, computed } from 'kensington';

const items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
const query = signal('');

const rows = computed(() => {
  const q = query.get().toLowerCase();
  return items
    .filter(name => !q || name.toLowerCase().includes(q))
    .map(name => t.li(name));
});

document.body.append(
  t.div([
    t.input({ type: 'search', placeholder: 'Filter...', oninput: e => query.set(e.target.value) }),
    t.ul(rows),
  ]).toElement()
);
```

### Reactive data. Keyed todo list

```javascript
import { t, signal } from 'kensington';

let nextId = 1;
const todos = signal([]);

function addTodo(text) {
  todos.set(list => [...list, { id: nextId++, text, done: false }]);
}

function toggleTodo(id) {
  todos.set(list => list.map(item => item.id === id ? { ...item, done: !item.done } : item));
}

function removeTodo(id) {
  todos.set(list => list.filter(item => item.id !== id));
}

const rows = todos.transform(list =>
  list.map(item =>
    t.li({ dataKey: item.id }, [
      t.span({ style: { textDecoration: item.done ? 'line-through' : 'none' } }, item.text),
      t.button({ type: 'button', onclick: () => toggleTodo(item.id) }, 'Done'),
      t.button({ type: 'button', onclick: () => removeTodo(item.id) }, 'Remove'),
    ])
  )
);

const input = t.input({ type: 'text', placeholder: 'New item...' });

document.body.append(
  t.div([
    t.div([
      input,
      t.button({
        type: 'button',
        onclick: () => {
          const el = input.getDomElement();
          if (el?.value.trim()) { addTodo(el.value.trim()); el.value = ''; }
        },
      }, 'Add'),
    ]),
    t.ul(rows),
  ]).toElement()
);
```

### Reactive data. Form with live validation

```javascript
import { t, signal, computed } from 'kensington';

const email    = signal('');
const password = signal('');

const emailOk    = email.transform(v => v.includes('@') && v.includes('.'));
const passwordOk = password.transform(v => v.length >= 8);
const formOk     = computed(() => emailOk.get() && passwordOk.get());

document.body.append(
  t.form([
    t.div([
      t.label({ for: 'email' }, 'Email'),
      t.input({ id: 'email', type: 'email', oninput: e => email.set(e.target.value) }),
      t.span({
        class: emailOk.transform(v => v ? 'hint hint--ok' : 'hint hint--error'),
      }, emailOk.transform(v => v ? '✓' : 'Enter a valid email')),
    ]),
    t.div([
      t.label({ for: 'pw' }, 'Password'),
      t.input({ id: 'pw', type: 'password', oninput: e => password.set(e.target.value) }),
      t.span({
        class: passwordOk.transform(v => v ? 'hint hint--ok' : 'hint hint--error'),
      }, passwordOk.transform(v => v ? '✓' : 'At least 8 characters')),
    ]),
    t.button({ type: 'submit', disabled: formOk.transform(v => !v) }, 'Sign up'),
  ]).toElement()
);
```

### Reactive data. Hydrated like button

Optimistic update with revert on error. The component runs unchanged on server and client.

```javascript
// components/like-button.js
import { t, signal } from 'kensington';

export function likeButton({ postId, likeCount, userLiked }) {
  const likes = signal(likeCount);
  const liked = signal(userLiked);

  function toggle() {
    const next = !liked.get();
    liked.set(next);
    likes.set(n => n + (next ? 1 : -1));

    fetch(`/api/posts/${postId}/like`, { method: next ? 'POST' : 'DELETE' })
      .catch(() => {
        liked.set(!next);
        likes.set(n => n + (next ? -1 : 1));
      });
  }

  return t.button({
    type: 'button',
    class: liked.transform(v => v ? 'like-btn like-btn--active' : 'like-btn'),
    ariaPressed: liked.transform(String),
    onclick: toggle,
  }, [t.span({ ariaHidden: 'true' }, '♥'), ' ', likes]);
}
```

```javascript
// server.js
import { renderForHydration, t } from 'kensington';
import { likeButton } from './components/like-button.js';

app.get('/posts/:id', async (req, res) => {
  const post      = await db.getPost(req.params.id);
  const userLiked = await db.hasLiked(req.user?.id, post.id);

  res.send(
    t.htmlWithDocType({ lang: 'en' }, [
      t.head([
        t.meta({ charset: 'utf-8' }),
        t.title(post.title),
        t.script({ src: '/client.js', type: 'module' }),
      ]),
      t.body(
        t.article([
          t.h1(post.title),
          renderForHydration(likeButton, { postId: post.id, likeCount: post.likeCount, userLiked }),
        ])
      ),
    ]).toString()
  );
});
```

```javascript
// client.js
import { registerComponents } from 'kensington';
import { likeButton } from './components/like-button.js';

registerComponents({ likeButton });
```

### Reactive data. Sortable table

Two signals drive both the rows and the column headers. Each header creates its own `computed` that tracks only the signals it reads. The active header tracks both `sortCol` and `sortAsc`; inactive headers track only `sortCol`. Stale subscriptions are cleaned up automatically between runs.

```javascript
import { t, signal, computed } from 'kensington';

const people = [
  { name: 'Alice', age: 32, role: 'Admin'  },
  { name: 'Bob',   age: 28, role: 'Editor' },
  { name: 'Carol', age: 41, role: 'Viewer' },
];

const sortCol = signal('name');
const sortAsc = signal(true);

const rows = computed(() => {
  const col = sortCol.get();
  const asc = sortAsc.get();
  return [...people]
    .sort((a, b) => {
      const cmp = String(a[col]).localeCompare(String(b[col]));
      return asc ? cmp : -cmp;
    })
    .map(p => t.tr([t.td(p.name), t.td(String(p.age)), t.td(p.role)]));
});

function sortHeader(col, label) {
  const heading = computed(() =>
    sortCol.get() === col ? `${label} ${sortAsc.get() ? '↑' : '↓'}` : label
  );
  return t.th({
    style: { cursor: 'pointer' },
    onclick: () => {
      if (sortCol.get() === col) {
        sortAsc.set(v => !v);
      } else {
        sortCol.set(col);
        sortAsc.set(true);
      }
    },
  }, heading);
}

document.body.append(
  t.table([
    t.thead(t.tr([sortHeader('name', 'Name'), sortHeader('age', 'Age'), sortHeader('role', 'Role')])),
    t.tbody(rows),
  ]).toElement()
);
```

### Reactive data. Making static HTML elements reactive

When most of a page is static HTML, use `effect()` directly against existing DOM elements rather than rebuilding markup with `.toElement()`. A signal holds the shared state; each element gets its own `effect` that reads the signal and updates the DOM.

```javascript
import { signal, effect } from 'kensington';

// Tab switcher. Read initial state from the HTML so the page works before JS runs
const activeTab = signal(
  document.querySelector('.tab--active')?.dataset.tab ?? 'overview'
);

document.querySelectorAll('[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => activeTab.set(btn.dataset.tab));
  effect(() => {
    btn.classList.toggle('tab--active', btn.dataset.tab === activeTab.get());
  });
});

document.querySelectorAll('[data-panel]').forEach(panel => {
  effect(() => {
    panel.classList.toggle('panel--hidden', panel.dataset.panel !== activeTab.get());
  });
});
```

Effects created this way are not auto-stopped when the element is removed from the DOM. For page-lifetime effects that is fine. If cleanup is needed, store the return value and call `.stop()` manually, or use `addDisconnectedCallback` on a Kensington-created ancestor.

### Reactive data. Accordion with per-element signals

Each accordion item gets its own signal, seeded from its `aria-expanded` attribute so the HTML is the source of truth. An `effect` keeps `aria-expanded` and the `hidden` property in sync on every change.

```javascript
import { signal, effect } from 'kensington';

document.querySelectorAll('.accordion-toggle').forEach(btn => {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  const open = signal(btn.getAttribute('aria-expanded') === 'true');

  btn.addEventListener('click', () => open.set(v => !v));

  effect(() => {
    const isOpen = open.get();
    btn.setAttribute('aria-expanded', String(isOpen));
    panel.hidden = !isOpen;
  });
});
```

### Reactive data. Context

The `createContext` pattern builds a signal stack so components read the nearest provider's value during synchronous construction. Consumers hold the signal reference and update reactively. `provide()` always wraps its argument in a new signal.

```javascript
import { signal, t } from 'kensington';

function createContext(defaultValue) {
  // each nested .provide call pushes a new value onto the stack at the beginning of the content block
  // and pops it off at the end of the content block
  const _stack = [signal(defaultValue)];

  return {
    get() {
      return _stack.at(-1);
    },

    provide(value, fn) {
      const ctx = signal(value);
      _stack.push(ctx);
      try {
        return fn(ctx);
      } finally {
        _stack.pop();
      }
    },

    set(val) {
      return this.get().set(val);
    },
  };
}

const ThemeContext = createContext('light');
const UserContext  = createContext({ name: 'Guest', role: 'viewer' });

function card() {
  const theme = ThemeContext.get();
  const user  = UserContext.get();
  return t.div({ class: theme.transform(v => `card card--${v}`) }, [
    t.p(user.transform(u => `${u.name} (${u.role})`)),
    t.small(theme),
  ]);
}

const app = t.div([
  t.button({
    type: 'button',
    onclick: () => ThemeContext.set(v => v === 'light' ? 'dark' : 'light'),
  }, 'Toggle theme'),

  card(), // reads default context

  ThemeContext.provide('dark', () =>
    card(), // pinned to dark regardless of toggle
  ),

  UserContext.provide({ name: 'Alice', role: 'admin' }, () =>
    ThemeContext.provide('dark', () =>
      card(), // both contexts overridden
    ),
  ),
]);

document.body.append(app.toElement());
```

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
