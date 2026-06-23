# Kensington

HTML/SVG/MathML library for JavaScript and TypeScript. Tags are method calls on a `Kensington` instance, returning tag objects that serialize to formatted HTML strings (`.toString()`) or live DOM nodes (`.toElement()`).

## Contents

Three indexes follow. Skim **By task** for "I'm trying to do X." Skim **API reference** for "what is X." Skim **Warning index** for "what does this error message mean." All three point at the same section bodies further down.

### By task

- **Render HTML, SVG, or MathML.** [Imports](#imports), [The basics](#the-basics), [Critical: call .toString() explicitly](#critical-call-tostring-explicitly), [Content rules](#content-rules), [Options](#options).
- **Pass dynamic values to attributes or content.** [As content and option values](#as-content-and-option-values), [DOM properties with `prop`](#dom-properties-with-prop-1), [Inline styles and dynamic classes](#inline-styles-and-dynamic-classes).
- **Render a list of items.** [Keyed lists](#keyed-lists), [Updating a row after it's been cached](#updating-a-row-after-its-been-cached), [Reactive primitives inside a computed need a key](#reactive-primitives-inside-a-computed-need-a-key), [Addressing per-row state from outside the row](#addressing-per-row-state-from-outside-the-row).
- **Toggle between two subtrees based on a signal.** [Returning a signal from a component function](#returning-a-signal-from-a-component-function).
- **Run side effects (timers, observers, fetches).** [effect](#effect), [addConnectedCallback / addDisconnectedCallback](#addconnectedcallback--adddisconnectedcallback), [isBrowser](#isbrowser), [Cleanup](#cleanup).
- **Drag-to-reorder lists.** [Keyed lists](#keyed-lists) plus `persist: true` documented under [Cleanup](#cleanup).
- **Server-render with hydration.** [Hydration](#hydration), [Embedding server data in the page](#embedding-server-data-in-the-page), [Hydration. Form with server-side validation](#hydration-form-with-server-side-validation).
- **Hot-module reload during development.** [HMR (`kensington/vite`)](#hmr-kensingtonvite).
- **Integrate a web-component library** (Web Awesome, Shoelace, Lit, Material Web, FAST, Spectrum). [Custom elements](#custom-elements), [Generating tag methods from a custom-elements manifest](#generating-tag-methods-from-a-custom-elements-manifest), [DOM properties with `prop`](#dom-properties-with-prop-1).
- **Integrate htmx or Alpine.js.** [TypeScript namespace augmentation](#typescript-namespace-augmentation), [htmx live search](#htmx-live-search), [Alpine.js](#alpinejs).
- **Style with Tailwind, inline styles, or `styled`.** [Tailwind CSS](#tailwind-css), [Inline styles and dynamic classes](#inline-styles-and-dynamic-classes), [Recipes](#recipes) (`styled`).
- **Build with Express, Hono, Fastify, Elysia, Deno, or Node http.** [Express](#express-server-with-multiple-routes), [Hono](#hono-server) (Bun variant included), [Fastify](#fastify), [Elysia (Bun)](#elysia-bun), [Deno](#deno), [Node.js built-in HTTP](#nodejs-built-in-http).
- **Convert existing HTML to Kensington.** [HTML to Kensington CLI](#html-to-kensington-cli).
- **Diagnose a problem.** [Common mistakes to avoid](#common-mistakes-to-avoid), [Reactive pitfalls](#reactive-pitfalls), [Validation and error policy](#validation-and-error-policy), [Warning index](#warning-index) below.

### API reference

Compact list. One anchor per line, grouped by area.

**Setup.** [Imports](#imports). [Recommended packages](#recommended-packages) (`kensington-eslint-plugin`, `kensington-express`). [One instance per project](#one-instance-per-project). [Constructor options](#constructor-options).

**Tags and attributes.** [The basics](#the-basics). [Critical: call .toString() explicitly](#critical-call-tostring-explicitly). [Options](#options) (incl. [DOM properties with `prop`](#dom-properties-with-prop)). [Content rules](#content-rules). [Raw HTML](#raw-html). [inlineComment()](#inlinecomment). [Full documents](#full-documents). [Pre-formatted content](#pre-formatted-content). [Custom elements](#custom-elements). [Generating tag methods from a custom-elements manifest](#generating-tag-methods-from-a-custom-elements-manifest). [TypeScript namespace augmentation](#typescript-namespace-augmentation). [Validation and error policy](#validation-and-error-policy).

**Reactive data.** ⚠ **Before every `signal()`, `computed()`, or `.transform()` call, ask: does this need a key?** See [Reactive primitives inside a computed need a key](#reactive-primitives-inside-a-computed-need-a-key) for the two-question decision check. [Reactive data overview](#reactive-data). [Signal API](#signal-api). [As content and option values](#as-content-and-option-values). [DOM properties with `prop`](#dom-properties-with-prop-1). [effect](#effect). [Keyed lists](#keyed-lists). [Updating a row after it's been cached](#updating-a-row-after-its-been-cached). [Addressing per-row state from outside the row](#addressing-per-row-state-from-outside-the-row). [Cleanup](#cleanup). [addConnectedCallback / addDisconnectedCallback](#addconnectedcallback--adddisconnectedcallback). [isBrowser](#isbrowser). [DevTools](#devtools). [Loading state](#loading-state).

**SSR and HMR.** [Hydration](#hydration). [HMR (`kensington/vite`)](#hmr-kensingtonvite).

**Tooling.** [HTML to Kensington CLI](#html-to-kensington-cli).

**Recipes — utilities.** [Recipes](#recipes) section (`styled`, `portal`, `createContext`, `useReducer`, `useLocalStorage`, `useDebounce`, `useFetch`, `useId`).

**Recipes — layout and servers.** [Shared header and footer](#layout-with-shared-header-and-footer). [Tailwind CSS](#tailwind-css). [Express](#express-server-with-multiple-routes). [Express render helper](#express-render-helper-middleware). [Hono](#hono-server). [Fastify](#fastify). [Elysia (Bun)](#elysia-bun). [Deno](#deno). [Node.js built-in HTTP](#nodejs-built-in-http).

**Recipes — common patterns.** [Form with validation errors](#form-with-validation-errors). [Data-driven component](#data-driven-component). [Pagination](#pagination). [Returning fragments](#returning-fragments). [Caching and reuse](#caching-and-reuse). [Inline styles and dynamic classes](#inline-styles-and-dynamic-classes). [Embedding server data in the page](#embedding-server-data-in-the-page). [Browser DOM usage](#browser-dom-usage). [SVG](#svg). [MathML](#mathml).

**Recipes — integrations.** [Alpine.js](#alpinejs). [htmx live search](#htmx-live-search). [Hydration. Form with server-side validation](#hydration-form-with-server-side-validation).

**Recipes — TypeScript.** [Reactive prop types](#typescript-reactive-prop-types). [Returning a signal from a component function](#returning-a-signal-from-a-component-function). [Typed components](#typescript-typed-components). [Design system with custom elements, htmx, and module augmentation](#typescript-design-system-with-custom-elements-htmx-and-module-augmentation).

**Recipes — reactive data worked examples.** [Counter](#reactive-data-counter). [Live filter](#reactive-data-live-filter). [Keyed todo list](#reactive-data-keyed-todo-list). [Form with live validation](#reactive-data-form-with-live-validation). [Hydrated like button](#reactive-data-hydrated-like-button). [Sortable table](#reactive-data-sortable-table). [Making static HTML elements reactive](#reactive-data-making-static-html-elements-reactive). [Accordion with per-element signals](#reactive-data-accordion-with-per-element-signals). [Context](#reactive-data-context).

**Reference.** [Common mistakes to avoid](#common-mistakes-to-avoid). [Reactive pitfalls](#reactive-pitfalls). [Key types](#key-types).

### Warning index

Each entry maps a runtime warning ID to the section that explains it.

| ID | When it fires | See |
|---|---|---|
| `async-loop` | An effect's signal write triggers more flushes than the cycle limit allows | [Reactive pitfalls](#reactive-pitfalls) |
| `sync-loop` | The same effect re-queues itself in a single flush | [Reactive pitfalls](#reactive-pitfalls) |
| `set-in-effect` | A signal is read with `.get()` and written with `.set()` in the same effect run | [Do not read and write the same signal in the same effect or computed run](#do-not-read-and-write-the-same-signal-in-the-same-effect-or-computed-run) |
| `set-in-computed` | `.set()` was called inside a computed body | [Do not call `.set()` inside a `computed` body](#do-not-call-set-inside-a-computed-body) |
| `signal-in-computed` | `signal()` called inside a computed without a key | [Reactive primitives inside a computed need a key](#reactive-primitives-inside-a-computed-need-a-key) |
| `signal-in-effect` | `signal()` called inside an effect (recreated each run) | [Reactive primitives inside a computed need a key](#reactive-primitives-inside-a-computed-need-a-key) |
| `transform-in-computed` | `.transform()` called inside a computed without a key | [Reactive primitives inside a computed need a key](#reactive-primitives-inside-a-computed-need-a-key) |
| `computed-in-computed` | `computed()` called inside a computed without a key | [Do not create computed signals inside a computed or transform callback without a key](#do-not-create-computed-signals-inside-a-computed-or-transform-callback-without-a-key) |
| `computed-in-effect` | `computed()` called inside an effect (orphaned each run) | [Do not call `effect()` from inside a function that gets called from a `.map()`, `.transform()`, or `computed()` callback](#do-not-call-effect-from-inside-a-function-that-gets-called-from-a-map-transform-or-computed-callback) |
| `effect-in-computed` | `effect()` called inside a computed (orphaned each run) | [Do not call `effect()` from inside a function that gets called from a `.map()`, `.transform()`, or `computed()` callback](#do-not-call-effect-from-inside-a-function-that-gets-called-from-a-map-transform-or-computed-callback) |
| `effect-in-effect` | `effect()` called inside another effect | [Do not call `effect()` from inside a function that gets called from a `.map()`, `.transform()`, or `computed()` callback](#do-not-call-effect-from-inside-a-function-that-gets-called-from-a-map-transform-or-computed-callback) |
| `duplicate-keyed-signal` | Two `signal(initial, key)` calls with the same key in one computed run | [Reactive primitives inside a computed need a key](#reactive-primitives-inside-a-computed-need-a-key) |
| `duplicate-keyed-computed` | Two `computed(fn, key)` calls with the same key in one computed run | [Reactive primitives inside a computed need a key](#reactive-primitives-inside-a-computed-need-a-key) |
| `out-of-scope-reactive-reference` | A keyed signal or computed is consumed from outside its owning scope | [Addressing per-row state from outside the row](#addressing-per-row-state-from-outside-the-row) |
| `mapwithkey-in-reactive` | `mapWithKey` called inside an arbitrary computed or effect (not another `mapWithKey`'s mapFn) | [Keyed lists](#keyed-lists) |
| `mapwithkey-duplicate-key` | Two items in a `mapWithKey` source share a key | [Keyed lists](#keyed-lists) |

Full runnable example apps live in the `examples/` directory of the GitHub repo (https://github.com/ryanlsimms/kensington/tree/master/examples). Browseable docs at https://kensingtonjs.com.

## Imports

```javascript
import { t } from 'kensington';               // shared default instance. Use this in most cases
import Kensington from 'kensington';           // class. Use when subclassing or custom config
import { Kensington } from 'kensington';       // same class as above, also available as a named export
import { formAttributes } from 'kensington/attributes';  // attribute objects for each element
```

```typescript
// Tag classes and content unions.
import type { ContentTag, VoidTag, LiteralTag, CommentTag, Content, ContentItem, ContentMethod } from 'kensington';

// Attribute slot types.
import type { NameSpaceAttributes, GlobalAttributes, GlobalEvents, UniversalAttributes, ClassValue } from 'kensington';

// Signal types.
import type { Signal, ReadonlySignal, Reactive, SignalKey } from 'kensington';
```

Use `Reactive<T>` (the `T | Signal<T> | ReadonlySignal<T>` union) when typing component parameters that accept either a plain value or a signal. Use `ReadonlySignal<T>` for derived signals returned by `computed`, `transform`, or `mapWithKey`. Use `Signal<T>` only when the caller must be able to write via `.set()`.

## Recommended packages

Two companion packages cover common pain points. Install them upfront when starting a new project.

### `kensington-eslint-plugin` (any project that uses signals)

ESLint rules that catch reactive bugs at lint time rather than runtime. **Install it any time you use `signal()`/`computed()`/`effect()`.** Catches `.set()` inside a computed derivation, `.get()`-then-`.set()` self-loops, async writes inside effects, missing keys on `signal()` calls inside a computed, `_isInternal` boundary violations, and more.

```bash
npm install --save-dev kensington-eslint-plugin
```

```js
// eslint.config.js
import js from '@eslint/js';
import kensington from 'kensington-eslint-plugin';

export default [
  js.configs.recommended,
  kensington.configs.recommended,        // signal-correctness rules at error/warn level
  // kensington.configs.style,           // optional, opt-in formatting rules
];
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

## Custom elements

Custom-element libraries (Web Awesome, Shoelace, Lit-based design systems, vanilla web components) integrate by subclassing `Kensington` and declaring a method per element via `createCustomTag`. The same method gives you a typed call site and a stable serializer.

The minimal pattern.

```typescript
import Kensington, { type ContentMethod } from 'kensington';

class MyEngine extends Kensington {
  myCard: ContentMethod<{ 'card-type'?: 'primary' | 'secondary' }> =
    this.createCustomTag('my-card', { 'card-type': ['primary', 'secondary'] });
}
```

The realistic pattern for a third-party library. Define a singleton engine, export it as the project's `k` instance, and use it everywhere instead of the default `t`.

The example below uses a fictional `<my-input>` / `<my-button>` library so the shape is unambiguous. **The attribute names, event names, enum values, and CSS variables shown here are illustrative.** They are not lifted from any real library and should not be copied verbatim into a real project. For real libraries, see [Generating tag methods from a custom-elements manifest](#generating-tag-methods-from-a-custom-elements-manifest). The manifest is the source of truth for attribute names, types, slot names, and CSS parts. The library's own documentation is the source of truth for event names and enum values.

```typescript
// src/k.ts. The project's single Kensington instance.
import Kensington, { type ContentMethod, type Reactive } from 'kensington';

class EngineForMyLib extends Kensington {
  myInput: ContentMethod<{
    label?: Reactive<string>;
    placeholder?: Reactive<string>;
    size?: Reactive<'s' | 'm' | 'l'>;       // illustrative enum, consult the real library
  }> = this.createCustomTag('my-input');

  myButton: ContentMethod<{
    variant?: Reactive<string>;             // type as string when the union is unknown or changes
    disabled?: Reactive<boolean>;
  }> = this.createCustomTag('my-button');

  myIcon: ContentMethod<{
    name: Reactive<string>;
  }> = this.createCustomTag('my-icon');

  myDialog: ContentMethod<{
    open?: Reactive<boolean>;
    label?: Reactive<string>;
  }> = this.createCustomTag('my-dialog');
}

export const k = new EngineForMyLib();
```

Usage. Three things flow together. HTML attributes go in the first argument (typed). DOM properties go in `prop`. Events go in `on`. Light-DOM children go in the second argument.

```typescript
import { k } from './k';
import { signal } from 'kensington';

const name = signal('');
const isReadOnly = signal(false);

const input = k.myInput({
  label: 'Node name',
  size: 's',
  prop: { value: name, disabled: isReadOnly },         // live DOM property binding
  on: { input: e => name.set(e.target.value) },        // standard DOM event
});

const button = k.myButton({ variant: 'primary' }, [    // slot content as second argument
  k.myIcon({ name: 'check', slot: 'prefix' }),         // slot="prefix" routes into the named slot
  'Save',
]);
```

How the pieces map to the DOM.

- **Typed attributes (`label`, `size`, `variant`).** Render as HTML attributes via `setAttribute`. The custom element observes them and updates internally. Use this for static values and string-valued bindings.
- **`prop`.** Assigns directly to the element's reactive property (`el.value = signalValue`). Required for non-string values (booleans, numbers, objects, signals carrying complex types), and the only way to write to properties that have no HTML-attribute equivalent. See **DOM properties with `prop`**.
- **`on`.** Accepts any event name. Form components nearly always dispatch the standard DOM events (`input`, `change`, `focus`, `blur`) just like native form controls; bind those with `on: { input: handler }` and `on: { change: handler }`. Library-specific lifecycle events (component open/close hooks, validation hooks, etc.) are usually published under a library prefix. Look them up in the library's docs. Do not guess from the tag name. The handler receives the native event in both cases.
- **Slot content.** Children pass through unchanged. Use the `slot="..."` attribute on a child to route it into a named slot.

Custom-element libraries that ship as bundled UMD/ESM (with their dependencies pre-resolved) can be loaded from a CDN via a `<script type="module">` in the SSR head. Libraries published from npm with unresolved bare specifiers (Web Awesome 3.x is one example. its `dist/` contains `import "@shoelace-style/animations"` strings the browser cannot resolve) must be bundled into the client bundle alongside the app code so the bundler resolves the transitive deps. Side-effect imports in `client.ts` are enough.

```typescript
// src/client.ts. Bundled-library path.
import '<my-library>/dist/loader.js';                  // resolves and inlines all sub-imports

// Or, for libraries that lazy-load each component at runtime, import the
// specific component modules to register them eagerly and bypass the lazy fetch:
import '<my-library>/dist/components/input/input.js';
import '<my-library>/dist/components/button/button.js';
```

SSR plus `prop`. The SSR HTML contains no `prop` values (only the regular attributes). On the client, `registerComponents` re-runs the component, `.toElement()` rebuilds the subtree, and the `prop` assignments land on the live, upgraded custom element. See **SSR plus hydration plus custom elements** under DOM properties with `prop`.

A larger example combining custom elements with `htmx` attribute namespaces and module augmentation lives at **TypeScript. Design system with custom elements, htmx, and module augmentation**.

### Generating tag methods from a custom-elements manifest

Libraries with many components (Web Awesome, Shoelace, Material Web, FAST, Spectrum Web Components, and most Lit-based design systems) publish a `custom-elements.json` manifest in their npm package, conforming to the W3C Web Components Community Group's [Custom Elements Manifest schema](https://github.com/webcomponents/custom-elements-manifest). Walk the manifest at module load time and assign one `createCustomTag` call per element. Zero per-element boilerplate, no codegen step, library-agnostic.

```typescript
import Kensington, { type ContentMethod } from 'kensington';
import manifest from '@awesome.me/webawesome/custom-elements.json';

function camelCase(s: string) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

class K extends Kensington {
  constructor() {
    super();
    for (const mod of manifest.modules ?? []) {
      for (const decl of mod.declarations ?? []) {
        if (decl.kind === 'class' && (decl as { tagName?: string }).tagName) {
          const tag = (decl as { tagName: string }).tagName;
          (this as Record<string, unknown>)[camelCase(tag)] = this.createCustomTag(tag);
        }
      }
    }
  }
}

export const k = new K();
```

`k.waInput(...)`, `k.waButton(...)`, `k.waIcon(...)`, and every other component in the manifest are all callable. Standard tag methods (`k.div`, `k.span`, etc.) come from the `Kensington` base class.

Substituting libraries is one line. `import manifest from '@shoelace-style/shoelace/custom-elements.json';` for Shoelace. `import manifest from '@material/web/custom-elements.json';` for Material Web. The same `modules[].declarations[]` walk works for any conforming manifest.

The exact path of `custom-elements.json` inside the package depends on the library. Many ship it at the package root, some under `dist/`. Web Awesome 3.x publishes it at `@awesome.me/webawesome/dist/custom-elements.json`. Check the library's `package.json` `exports` map or its filesystem layout if the root-level import fails to resolve.

#### Adding types

The dynamic assignment loses TypeScript visibility into the generated methods. Recover it by declaring the methods on the subclass itself with `declare` fields. The fields emit no runtime code; the manifest walker still populates them. Type only the components you actually call; the rest stay callable at runtime even without a declaration (use a permissive cast at the call site if needed).

```typescript
import Kensington, { type ContentMethod, type Reactive } from 'kensington';

class K extends Kensington {
  declare waInput:  ContentMethod<{
    label?:       Reactive<string>;
    placeholder?: Reactive<string>;
    size?:        Reactive<'small' | 'medium' | 'large'>;
  }>;
  declare waButton: ContentMethod<{
    variant?:  Reactive<'neutral' | 'brand' | 'success' | 'warning' | 'danger'>;
    disabled?: Reactive<boolean>;
  }>;
  declare waIcon:   ContentMethod<{ name: Reactive<string>; library?: Reactive<string> }>;

  constructor() {
    super();
    for (const mod of manifest.modules ?? []) {
      for (const decl of mod.declarations ?? []) {
        if (decl.kind === 'class' && (decl as { tagName?: string }).tagName) {
          const tag = (decl as { tagName: string }).tagName;
          (this as Record<string, unknown>)[camelCase(tag)] = this.createCustomTag(tag);
        }
      }
    }
  }
}
```

The attribute literal types (`'small' | 'medium' | 'large'`, the variant union) come from the library's own documentation or its manifest's `attributes[].type.text`. The values in this snippet are illustrative; consult the library's docs or manifest for the actual unions. The Web Awesome `<wa-button>` variants, for example, are `'neutral' | 'brand' | 'success' | 'warning' | 'danger'`, not the generic `'default' | 'primary' | ...` that appears in many doc examples.

Declaring on the subclass is preferred over module augmentation (`declare module 'kensington' { interface Kensington { ... } }`) because it scopes the methods to your engine class instead of widening every `Kensington` instance in the project. The shared default `t` instance, for example, does not get these methods, so its types stay accurate to its real surface. Both forms compile (the `Kensington` class is exported as both the default and a named export); choose subclass declaration unless you have a specific reason to widen the base class.

#### When this pattern does not apply

Older custom-element libraries that do not publish a manifest still work with the per-method `createCustomTag` pattern shown earlier in this section. The manifest is the leverage point; without it, list the tag names explicitly and loop over the same shape.

```typescript
const TAGS = ['my-input', 'my-button', 'my-icon'] as const;

class K extends Kensington {
  constructor() {
    super();
    for (const tag of TAGS) {
      (this as Record<string, unknown>)[camelCase(tag)] = this.createCustomTag(tag);
    }
  }
}
```

This recipe replaces the per-method boilerplate uniformly across libraries. The runtime assignment is a few lines; the type declarations are written once per project for the components actually used.

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

> **Before you write `signal()`, `computed()`, or `.transform()`, ask one question:** is this call going to run on the call stack of a `computed`, `transform`, `mapWithKey` `mapFn`, or any helper function called from one of those? If yes, **pass a key as the second argument**. The key scopes the instance to the surrounding reactive callback so it is reused across re-runs instead of recreated. Without a key the warning fires, DOM nodes get replaced when outer state changes, and per-row local state silently resets. See [Reactive primitives inside a computed need a key](#reactive-primitives-inside-a-computed-need-a-key) for the full rule, the wrong/right helper pair, and which keys collide. The most common failure mode is a row component like `function row(item) { const open = signal(false); ... }` invoked from a `mapWithKey` mapFn — the `signal()` looks top-level in the source but runs inside the per-key computed at execution time.

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

**SSR plus hydration plus custom elements.** When a component using `prop` is rendered via `renderForHydration` and then hydrated on the client, the SSR HTML contains no `prop` values at all (only the regular attributes the tag declared). On the client, `registerComponents` re-runs the component, replaces the SSR DOM via `.toElement()`, and the `prop` bindings land on the live element. For custom elements (`<sl-input>`, `<wa-input>`, any Lit-based or vanilla web component), the autoloader script tag should appear in `<head>` so the element is already upgraded by the time the hydration script runs; the `prop` assignment then targets the upgraded element's reactive property (`el.value = signalValue`) rather than the attribute, and the custom element's own reactive system observes the change.

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

Common mistakes around `effect` (loops, leaked nested effects, signals created inside) are catalogued in [Reactive pitfalls](#reactive-pitfalls). For component-shaped effects whose lifetime should match a DOM element's, capture the handle and stop it from [addDisconnectedCallback](#addconnectedcallback--adddisconnectedcallback).

**Don't `effect()` on your own writes.** If the only writer to a signal is your own event handler (an `oninput`, `onclick`, etc. that calls `.set()` on it), you do not need an `effect()` to react to the change. The handler already runs imperatively on the user action; piggyback the side effect (debounced save, validation, network call) onto the same handler call:

```javascript
// Wrong. The effect subscribes to a signal that only this handler writes to.
// On a keyed signal, this subscriber lives outside the owning computed's scope
// and trips the `out-of-scope-reactive-reference` warning.
const value = signal('', `field-${id}`);
const tag = t.input({
  prop: { value },
  on: { input: e => value.set(e.target.value) },
});
tag.addConnectedCallback(() => {
  saveEffect = effect(() => {
    const v = value.get();
    debouncedSave(v);
  });
});

// Right. The input handler is the only writer; trigger the side effect inline.
// No second subscriber, no out-of-scope warning, simpler control flow.
const value = signal('', `field-${id}`);
const tag = t.input({
  prop: { value },
  on: {
    input: e => {
      value.set(e.target.value);
      debouncedSave(e.target.value);
    },
  },
});
```

`effect()` is for reacting to signal writes you do NOT control: another component setting a shared signal, async data arriving via `.set()` in a fetch callback, a parent mutating a child's state, etc. When the source of writes is the same handler that wants to fire the side effect, skip the effect.

### Keyed lists

```javascript
const items = signal([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);

const rows = items.mapWithKey('id', item => t.tr(t.td(item.name)));

t.tbody(rows);
```

`signal.mapWithKey(keyOrProp, mapFn)` returns a `ReadonlySignal<Tag[]>`. The first argument is either a property name string (the common case) or a function that extracts the key. The mapFn runs once per key the first time it is seen. The resulting tag is cached and reused on every subsequent render where the same key reappears, so the user never pays to rebuild thousands of unchanged tag subtrees only to discard them after a reconciler diff. Keys live on the tag instance via a Kensington-internal property and are read by the reconciler via a `WeakMap`. They do not appear in the rendered DOM.

`mapWithKey` is a method on `Signal` and `ReadonlySignal`. It is not a method on plain arrays. If the source data is a plain array (e.g. lazily-loaded children), wrap it in a `signal()` first, then call `.mapWithKey()` on the wrapped signal.

For recursive structures like trees, calling `mapWithKey` inside another `mapWithKey`'s `mapFn` is the canonical pattern. The outer `mapFn` runs once per key (cached), so the inner `mapWithKey` is constructed once per row and lives as long as the cached row tag. The `mapwithkey-in-reactive` warning is suppressed in this case. The warning still fires when `mapWithKey` is called inside an arbitrary `computed` or `effect` body that re-runs on every dependency change.

A recursive component function called from inside its own `mapWithKey` body runs on the call stack of a per-key `computed`. Any `signal()`, `computed()`, or `.transform()` it creates therefore needs a key, even though the call sites look like top-level code in a plain helper. See [Reactive primitives inside a computed need a key](#reactive-primitives-inside-a-computed-need-a-key) for the wrong/right helper pair.

In TypeScript, a recursive component function that returns a tag and is also called from inside its own `mapWithKey` body needs an explicit return-type annotation. Without one, `tsc` reports TS7023 ("implicitly has return type 'any' because it is referenced directly or indirectly in one of its return expressions"). Annotate the return as `ContentTag` (or the more specific tag class) and import the type from `kensington`.

```typescript
import { type ContentTag } from 'kensington';

function nodeRow(node: TreeNode): ContentTag {
  return k.div({ class: 'row' },
    k.div({ class: 'children' },
      node.children.mapWithKey('id', child => nodeRow(child)),
    ),
  );
}
```

For drag-and-drop sortable lists where DOM nodes are moved via `insertBefore`, add `persist: true` to each item tag so signal effects survive the move. See **Cleanup** below.

When the `mapFn` body creates per-row signals or computeds, those calls need a key. See [Reactive primitives inside a computed need a key](#reactive-primitives-inside-a-computed-need-a-key). To address per-row state from outside the row (for example, a search handler that expands ancestors of a hit), see [Addressing per-row state from outside the row](#addressing-per-row-state-from-outside-the-row).

### Updating a row after it's been cached

`mapWithKey` caches the tag instance per key. If something outside the row mutates a ticket and you do `items.set(list => list.map(t => t.id === id ? { ...t, comments: [...t.comments, c] } : t))`, the new object reference flows through but `mapWithKey` returns the **cached tag** for that key, whose content was built from the original object. The UI does not update.

The fix is to put mutable per-row data in per-row signals on the item object itself. The cached tag binds those signals reactively, so external updates land via `.set()` on the signal rather than via array-replacement.

```javascript
// Each item carries signals for the fields that change after the row is built.
function wrapTicket(t) {
  return {
    id: t.id, title: t.title, body: t.body,
    status: signal(t.status),
    comments: signal(t.comments ?? []),
  };
}

const items = signal(plainTickets.map(wrapTicket));

// ticketCard reads ticket.status and ticket.comments reactively (they're signals).
const rows = items.mapWithKey('id', ticket => t.article({
  class: ticket.status.transform(s => `card status-${s}`, `${ticket.id}-cls`),
}, [
  t.span(ticket.title),
  t.ul(ticket.comments.mapWithKey('id', c => t.li(c.body))),
]));

// Mutating a row from outside: find it, mutate its signals.
function applyServerUpdate(ticketId, patch) {
  const row = items.value.find(t => t.id === ticketId);
  if (row && 'status' in patch) row.status.set(patch.status);
  if (row && 'newComment' in patch) row.comments.set([...row.comments.value, patch.newComment]);
}
```

This is the canonical pattern for any list whose row contents change after mount — SSE pushes, WebSocket messages, polling intervals, animation timers. The `items` signal holds identity (the set of rows); per-row signals hold field-level reactivity.

#### Addressing per-row state from outside the row

A second pattern covers the case where the row's item object is not necessarily available everywhere that wants to drive the row. The canonical example is a recursive tree where a search handler needs to set `expanded = true` on every ancestor of a hit, including ancestors whose parents have never been expanded so the items have never been fetched. The row's `signal(initial, key)` lives in the `mapWithKey` scope and is unreachable from the search handler.

Lift the per-row state into a module-level `Map<id, RowState>` registry. Rows look up (or create) their state on first render. External code (search, drag handlers, hotkeys, broadcast subscribers) reaches the same state by id.

```typescript
type RowState = {
  expanded: Signal<boolean>;
  renaming: Signal<boolean>;
  children: Signal<Node[]>;
  childrenLoaded: Signal<boolean>;
};

const rowRegistry = new Map<string, RowState>();

function getOrCreateRowState(id: string): RowState {
  let s = rowRegistry.get(id);
  if (s) {
    return s;
  }
  s = {
    expanded: signal(false),
    renaming: signal(false),
    children: signal([]),
    childrenLoaded: signal(false),
  };
  rowRegistry.set(id, s);
  return s;
}

function nodeRow(node: Node): ContentTag {
  const { expanded, renaming, children } = getOrCreateRowState(node.id);
  return k.div({ class: ['node-row', expanded.transform(v => v && 'expanded', 'expanded-cls')] }, [
    /* chevron, name, children. All read from the row state */
  ]);
}

// External handler. Walk ancestor ids and flip expanded.
async function expandToReveal(ancestorIds: string[]) {
  for (const id of ancestorIds) {
    const s = getOrCreateRowState(id);
    if (!s.childrenLoaded.value) {
      const rows = await fetchChildren(id);
      s.children.set(rows);
      s.childrenLoaded.set(true);
    }
    s.expanded.set(true);
  }
}
```

The signals in the registry are not keyed (no second argument). They are owned by the module, not by a `mapWithKey` scope, so the `out-of-scope-reactive-reference` warning does not apply. The trade-off is that the registry is never garbage-collected automatically; remove entries when a node is permanently deleted. Use this pattern only when the registry-keyed lookups are needed from outside the rendering pipeline. For self-contained list rows whose state nobody outside reads or writes, keep using `signal(initial, key)` inside the `mapWithKey` `mapFn`.

### Reactive primitives inside a computed need a key

**Decision check before writing any `signal()`, `computed()`, or `.transform()` call.** Two questions, in order. If the answer to (1) is no, skip (2). If yes to (1) AND yes to (2), pass a key.

1. **Will this call run on the call stack of a `computed`, `transform`, `mapWithKey` `mapFn`, `effect`, or any helper invoked from one of those?** Read your own code top-down. If the function containing this call is itself called from one of those reactive callbacks (directly or transitively), the answer is yes. The lexical position in the source does not matter; only the actual call stack at runtime.
2. **Is this a `signal()`, `computed()`, or `.transform()` (not just a `.get()` or `.set()`)?** Reads and writes never need a key. Only creation calls do.

If both are yes, add a key as the second argument. The key needs to be unique within the surrounding reactive callback's run. Use the item identity (`item.id`) plus a local label for disambiguation (`${item.id}-cls`, `${item.id}-matches`).

When in doubt, pass a key. Passing a key outside a reactive context is a no-op; missing a key inside one is a silent UX bug (per-row local state resets on every outer re-run).

When you create a `signal()`, `computed()`, or `.transform()` inside a `computed` callback, pass a stable `key` as the second argument. This applies uniformly to all three forms: the key scopes the instance to the surrounding `computed` so the same instance is reused across outer re-runs. Use the item identity (typically `item.id`).

**This rule is call-stack, not lexical.** What matters is whether the `signal()` or `computed()` call runs inside a reactive callback at execution time, not whether it sits inside one in the source text. If a helper function does the creation and that helper is called from inside a `computed`, `transform`, `effect`, or `mapWithKey` `mapFn` body, the signals it creates count as "inside" the reactive scope. The runtime walks the call stack, not the AST. Every component-style helper that calls `signal()`/`computed()`/`.transform()` and is invoked from a list-row `mapFn` falls in this bucket. Pass keys.

The worked example below shows the lexical case (creation written directly inside the callback). The wrong/right helper pair after it shows the call-stack case, which is how most real code is structured.

```javascript
const items  = signal([{ id: 'a', name: 'Apple', cat: 'fruit' }, { id: 'b', name: 'Bagel', cat: 'bread' }]);
const filter = signal('fruit');

const list = items.mapWithKey('id', item => {
  // Keyed signal. Per-item local interactive state.
  const highlight = signal(false, item.id);
  // Keyed computed. Derived value that reads multiple signals.
  // Key combines the item id with a label so it does not collide with
  // any other keyed computed or transform in this mapFn run.
  const cls = computed(() => [
    filter.get() === item.cat && 'match',
    highlight.get() && 'starred',
  ].filter(Boolean).join(' '), `${item.id}-cls`);
  // Keyed transform. Single-source derivation, chained off the filter signal.
  // Different label so it does not collide with `cls`.
  const matches = filter.transform(f => f === item.cat ? 'in-filter' : 'out', `${item.id}-matches`);
  return t.li({
    class: cls,
    data: { state: matches },
    onclick: () => highlight.set(v => !v),
  }, item.name);
});

t.ul(list);
```

**The helper-function trap.** Most real code factors each row into a component-style helper rather than writing the body inline. The rule still applies because the helper runs on the call stack of the `mapFn`. Here is the same example refactored into a helper, with the keys it needs to keep working.

```javascript
// Wrong. row() is a plain function, so the signal/computed/transform calls
// look top-level, but row() is called from inside mapWithKey's mapFn, which
// runs inside a per-key computed. Each one fires a runtime warning.
function row(item) {
  const highlight = signal(false);                                        // signal-in-computed
  const cls       = computed(() => highlight.get() ? 'starred' : '');     // computed-in-computed
  const matches   = filter.transform(f => f === item.cat ? 'in' : 'out'); // transform-in-computed
  return t.li({ class: cls, data: { state: matches } }, item.name);
}
const list = items.mapWithKey('id', item => row(item));

// Right. Same helper, with keys. Each key is unique inside the per-key computed
// run for this row (the outer mapWithKey scope is already keyed by item.id,
// so a short local label like 'highlight' is enough). Inner state survives
// outer re-runs.
function row(item) {
  const highlight = signal(false, 'highlight');
  const cls       = computed(() => highlight.get() ? 'starred' : '', 'cls');
  const matches   = filter.transform(f => f === item.cat ? 'in' : 'out', 'matches');
  return t.li({ class: cls, data: { state: matches } }, item.name);
}
const list = items.mapWithKey('id', item => row(item));
```

The same applies anywhere a helper that creates signals or computeds is called from inside a `computed`, `transform`, `effect`, or `mapFn` body. Inspector panes that build their body inside a `computed(() => ...)` and delegate to a `fileEditor(node)` helper. Tree-row components that delegate to a `chevron(props)` helper for an SVG `.transform()`. Any reactive callback that calls into a helper.

**Unique keys per keyed call.** Each `signal()`, `computed()`, or `.transform()` call inside the same outer run needs a key that is unique to that call. `signal()` lives in its own registry, so `signal(0, item.id)` doesn't collide with `computed(fn, item.id)`. But `computed()` and `.transform()` share a registry (transform calls computed internally), so two of them with the same key collide. Use `${item.id}-label` per keyed computed/transform, like the example above. A duplicate key logs a `console.error` and silently makes both calls return the same instance (the second call's fn overwrites the first), which produces wrong UI behavior.

**Shared lifecycle.** The three forms use the same per-computed registry. Same key returns the same instance across re-runs. When an item leaves the list, its keyed instance is stopped automatically and removed from the registry on the next sweep. When the outer computed is permanently stopped, all its keyed instances are stopped too. When the outer sleeps (auto-dispose), the registry is preserved so a later wake reuses the same instances.

**Closure refresh.** For `computed(fn, key)` and `signal.transform(fn, key)`, the fn closure is replaced on every outer re-run, so captured variables (like `item.label`) stay fresh even though the instance identity is stable. For `signal(initial, key)`, only the first call's `initial` is used; subsequent calls return the existing signal unchanged.

**Don't escape the scope.** Don't reference a keyed instance from outside the owning `computed`. The owner can stop it at any time, after which external subscribers silently stop receiving updates. Two safe inline patterns:

1. Consume via method chain: `.get()`, `.transform(...)`, `.toString()`, etc.
2. Pass directly to a tag as content or an attribute value. The DOM binding's lifetime is tied to the DOM, which the owner controls anyway.

The library emits a runtime warning (and the `no-out-of-scope-reactive-reference` lint rule catches it statically) when a keyed instance is subscribed to from outside the owner.

**Key types.** The `key` argument accepts any value usable in a `Map`: `string`, `number`, `symbol`, or `object` (exported as the `SignalKey` type). Object keys (e.g. passing `item` itself as the key) work as long as the same reference survives across outer re-runs. Immutable update patterns that clone the item (`items.set(list.map(i => i.id === x ? { ...i, … } : i))`) produce a new object reference, so its object-as-key would change and the keyed state would be lost. Prefer `item.id`; reach for object keys only with stable item references.

**Duplicates.** Two calls with the same key in the same outer run share a single instance between two items and log a `throttledError` to console. Use the item identity to ensure uniqueness.

**DOM identity.** Bind keyed signals directly to attributes or via `.transform(fn, item.id)` rather than through a fresh unkeyed `.transform()` each render. An unkeyed `.transform()` inside a re-running outer computed creates a new derived signal per run and the old one sleeps as an orphan. A direct attribute binding or a keyed transform reuses the same instance and stays attached to the same live element:

```javascript
// Editing state toggled via a data attribute. CSS swaps the visible element.
const list = items.mapWithKey('id', item => {
  const editing = signal('view', item.id);
  return t.li({ data: { editing } }, [
    t.span({ class: 'task-text', ondblclick: () => editing.set('edit') }, item.text),
    t.input({ class: 'task-edit-input', prop: { value: item.text } }),
  ]);
});
// CSS: .task-item[data-editing="view"] .task-edit-input { display: none; }
//      .task-item[data-editing="edit"] .task-text       { display: none; }
```

**Unkeyed fallback.** `signal()`, `computed()`, and `.transform()` inside a `computed` without a key still work, but the inner instance is re-created on every outer re-run. Local state resets to the initial value, and the previous instance becomes a sleeping orphan in the devtools Signals tab. The library logs a `console.warn` for each form (with form-specific wording) suggesting the keyed alternative.

### Cleanup

`computed()` and `transform()` signals auto-dispose: when the last subscriber (a DOM effect or a downstream computed) is removed, the computed unsubscribes from its source signals and freezes its value. When something reads it inside a reactive context again, it revives and re-subscribes. This means computed chains used to build a DOM subtree clean themselves up automatically when that subtree is removed. No manual teardown needed.

`.get()`, `.value`, and `.toJSON()` on a sleeping computed always return a fresh value even outside a reactive context. The computed wakes briefly, re-runs its function, and sleeps again without leaving a subscription behind.

`.toElement()` stops reactive effects automatically when the element is removed from the DOM. For elements that will be moved or temporarily removed and re-inserted, add `persist: true` to the tag options. Effects pause on removal and resume on re-insertion, across any number of cycles. The main use case is items in a drag-and-drop sortable list, where the reconciler reorders nodes via `insertBefore`:

```javascript
// signal effects on this item (class, checked, etc.) survive drag-reorder moves.
const item = t.li({ persist: true }, content);
```

`persist: true` is silently ignored in `.toString()` and has no effect server-side.

`tag.getDomElement()` returns the live element produced by the most recent `.toElement()` call when that element is currently in the document, or `null` otherwise. Two consequences worth knowing.

- During a `persist: true` reconnect cycle, the cached element identity is stable. The same `Element` reference is returned across many removal-and-insertion cycles. During the gap between removal and reinsertion, `getDomElement()` returns `null`.
- After the element has been permanently removed and the tag instance has been discarded (no further `.toElement()` call), `getDomElement()` returns `null` forever. Code that needs to react to mount and unmount events should use `addConnectedCallback` and `addDisconnectedCallback` rather than polling `getDomElement()`.

```javascript
const row = t.li({ persist: true }, content);
const el = row.toElement();
document.body.append(el);
row.getDomElement() === el;          // true. Same element while connected.
el.remove();
row.getDomElement();                 // null. Element is disconnected.
document.body.append(el);
row.getDomElement() === el;          // true. Same element returned again.
```

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

Inside a Kensington component that creates several `effect()` calls, capture each handle and stop them together from the root tag's disconnect callback. The connected callback is the canonical place to create the effects so they only run when the element is live. This pattern composes cleanly with `persist: true`, where the connect callback re-fires on every reconnection:

```javascript
function searchPanel({ initialQuery }) {
  const query = signal(initialQuery);
  const results = signal([]);
  const root = t.div({ class: 'search-panel', persist: true }, [
    t.input({ type: 'search', prop: { value: query }, oninput: e => query.set(e.target.value) }),
    t.ul(results.mapWithKey('id', r => t.li(r.label))),
  ]);

  const effects = [];
  root.addConnectedCallback(() => {
    effects.push(effect(() => {
      const q = query.get();
      if (!q) { results.set([]); return; }
      fetch(`/api/search?q=${encodeURIComponent(q)}`).then(r => r.json()).then(results.set);
    }));
    effects.push(effect(() => {
      history.replaceState(null, '', query.get() ? `?q=${encodeURIComponent(query.get())}` : '/');
    }));
  });
  root.addDisconnectedCallback(() => {
    while (effects.length) { effects.pop().stop(); }
  });
  return root;
}
```

Effects created inside `effect()` calls on `mapWithKey` rows are stopped automatically when their row leaves the DOM. The explicit start/stop pattern above is only needed for effects owned by the component itself rather than by the reconciler.

### addConnectedCallback / addDisconnectedCallback

Tag instances have `addConnectedCallback(fn)` and `addDisconnectedCallback(fn)`. Use them to wire up side effects whose lifetime is tied to the live DOM element (timers, observers, third-party widgets, focus calls, etc).

```javascript
function statsPanel() {
  const count = signal(0);
  const panel = t.div([
    t.h2('Stats'),
    t.p(['Tick ', count, ' times']),
  ]);
  let id;
  panel.addConnectedCallback(el => { id = setInterval(() => count.set(n => n + 1), 1000); });
  panel.addDisconnectedCallback(() => { clearInterval(id); });
  return panel;
}
```

- `fn` for `addConnectedCallback` receives the live element. It runs every time the element is inserted into the DOM (initial mount plus every reconnect for `persist: true` parents).
- `fn` for `addDisconnectedCallback` runs every time the element is removed.
- Tag instances are reusable. The returned tag is the same instance across `.toElement()` calls, but each `.toElement()` produces (or reuses) a single DOM element and the connect/disconnect callbacks fire against that element.
- For one-shot setup that doesn't need a teardown, you can still use `addConnectedCallback` alone (e.g. focus a newly mounted input via `el => el.focus()`).
- The callback body is a plain function call, NOT inside a reactive scope. Creating `effect()` here is the right pattern when you need to react to a signal for as long as the element is mounted. Capture the stop function and call it from `addDisconnectedCallback`: `let stop; panel.addConnectedCallback(() => { stop = effect(() => { ... }); }); panel.addDisconnectedCallback(() => stop?.());`. The `kensington/no-ignored-effect-return` lint rule recognises this capture-and-stop pattern. Creating `signal()` or `computed()` here is also free of warnings since the callback is not a `computed` body.

This is the canonical place for `setInterval`/`setTimeout`, `IntersectionObserver`, `ResizeObserver`, manual focus, `effect()` whose lifetime should match the element's mount, or any imperative DOM API that needs symmetric setup/cleanup tied to element mount/unmount.

### isBrowser

```javascript
// Guard module-level or computed() code that calls browser-only APIs
const stored = isBrowser ? localStorage.getItem('theme') : null;

// Inside effect(). Always safe; effect is a no-op on the server
effect(() => { localStorage.setItem('theme', dark.get() ? 'dark' : 'light'); });
```

`isBrowser` is `false` in any Node-like runtime including Bun and Deno, and stays `false` inside `renderForHydration` calls made from those runtimes. It is `true` only inside an actual browser document.

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

### HMR (`kensington/vite`)

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

Most of these are caught at lint time by [`kensington-eslint-plugin`](https://www.npmjs.com/package/kensington-eslint-plugin). Install it in any project that uses signals. It catches `.set()` inside a computed, `.get()`-then-`.set()` self-loops, async writes inside effects, missing keys on `signal()` calls inside a computed, and other patterns covered below.

```bash
npm install --save-dev kensington-eslint-plugin
```

```javascript
// eslint.config.js
import kensington from 'kensington-eslint-plugin';

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
  return visible.map(item => t.li(item.name));
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

### Do not create computed signals inside a computed or transform callback without a key

When a `transform` or `computed` callback re-runs, an unkeyed `computed()` or `transform()` call inside it creates a new derived signal on every re-render. The reconciler detects the reference change at the same attribute or content position and rebuilds the DOM node so the new derived signal can drive the live element. DOM state (focus, scroll, input value, selection) is preserved across the rebuild, but the work is wasteful, and the old derived signal becomes an orphan that sleeps and accumulates in the devtools Signals tab on every list update.

Both `computed(fn, key)` and `signal.transform(fn, key)` accept a stable key as a second argument, used the same way as keyed `signal(initial, key)`. Inside an outer `computed` (including `mapWithKey`'s per-key `mapFn`), the same inner instance is returned across re-runs. Two paths fix the issue. Pass a key so the inner is reused. Or precompute the derived signal once when the item is created and reuse it directly.

```javascript
// Wrong. done.transform() runs unkeyed on every list re-render inside a plain map.
// Each item creates a fresh inner computed that immediately sleeps, accumulating
// orphans in the devtools Signals tab on every list update.
const rows = tasks.transform(list =>
  list.map(({ id, text, done }) => {
    const itemClass = done.transform(d => d ? 'task-item done' : 'task-item');
    return t.li({ class: itemClass }, text);
  })
);

// Correct (option 1). Pass a stable key to .transform() inside mapWithKey's mapFn so
// the inner transform is reused across outer re-runs. Same shape as signal(initial, key).
const rows = tasks.mapWithKey('id', ({ id, text, done }) => {
  const itemClass = done.transform(d => d ? 'task-item done' : 'task-item', id);
  return t.li({ class: itemClass }, text);
});

// Correct (option 2). Create itemClass once when the task is created and store it on
// the object. mapWithKey reuses the cached tag instance per id, so the same signal
// reference drives the same live element across every re-render.
function makeTask(text) {
  const done = signal(false);
  return {
    id: Date.now(),
    text,
    done,
    itemClass: done.transform(d => d ? 'task-item done' : 'task-item'),
  };
}

const rows = tasks.mapWithKey('id', ({ text, itemClass }) => t.li({ class: itemClass }, text));
```

### Do not call `effect()` from inside a function that gets called from a `.map()`, `.transform()`, or `computed()` callback

Each call to `effect()` creates a brand-new subscription. If the call site is a render-time function (e.g. a per-row component) that runs whenever a parent re-renders, every re-render adds another effect, and none of the previous ones are ever stopped. Memory grows, and `set()`s from the latest effect race with the stale ones for the same downstream signal. The kensington runtime catches this and throws `effect() called inside a computed or transform callback`, but the same shape also bites when the wrapping function is run inside a plain `Array.map` whose result feeds a `transform`.

Symptoms. Console error from kensington runtime. Devtools Effects panel growing on every list-affecting `set()`. Subtle bugs where the "latest" value briefly flickers to a stale value before settling.

The two fixes mirror the keyed-computed fixes above.

```javascript
// Wrong. Each setRow call creates a fresh effect on every list re-render.
function setRow(set) {
  const displayWeight = signal(set.weight);
  effect(() => {                          // new subscription per render
    displayWeight.set(toUnits(set.weight, units.get()));
  });
  return t.li(displayWeight);
}

const rows = sets.transform(items => items.map(setRow));
```

```javascript
// Correct (option 1). Use a keyed computed inside mapWithKey so the derivation is
// reused across re-renders. No effect needed at all when the derivation is pure.
const rows = sets.mapWithKey('id', set =>
  t.li(computed(() => toUnits(set.weight, units.get()), `${set.id}-display`))
);

// Correct (option 2). Capture the value at construction time when reactive
// dependence on the outer signal isn't actually required. The display value
// freezes to the unit selected when the row was rendered.
function setRow(set) {
  const captured = units.value;
  const displayWeight = toUnits(set.weight, captured);
  return t.li(displayWeight);
}
```

### Mutating an array or object passed to `.set()` doesn't trigger updates

`signal.set()` skips the notification if `Object.is(prev, next)` is true. Pushing into an array (or assigning into an object) and then calling `.set()` with the same reference passes the identity check and silently does nothing. Subscribers stay on the old value visually because no run is scheduled. Always replace the reference.

```javascript
// Wrong. push mutates in place; the reference is unchanged
items.value.push(newItem);
items.set(items.value);            // Object.is(prev, next) is true. No re-run

// Wrong, same shape with objects
const u = user.value;
u.name = 'Alice';
user.set(u);                        // Object.is is true. No re-run

// Correct. Spread or rebuild to get a fresh reference
items.set(list => [...list, newItem]);
user.set(prev => ({ ...prev, name: 'Alice' }));
```

This applies equally to `Map` and `Set` instances and any other reference type. If you need mutable state semantics, wrap the field you actually mutate in its own signal.

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

Full runnable example apps live in the `examples/` directory of the GitHub repo (https://github.com/ryanlsimms/kensington/tree/master/examples). Browseable docs at https://kensingtonjs.com.

### Recipes

Small helpers built on top of `signal` and `effect`. Each is a few lines; copy into your project as needed.

#### styled. CSS-in-JS components with pseudo-selectors, media queries, and composition

Kensington tags accept inline `style` objects. What inline styles cannot do is pseudo-selectors (`:hover`, `:focus-visible`), at-rules (`@media`), or reuse across components. `styled(tag, styles)` fills the gap. It takes a tag closure and a style object (camelCase keys plus nested keys for pseudo-selectors and at-rules), injects a class into a shared stylesheet, and returns a new tag closure.

```javascript
// styled.js
let _id = 0;
let _style;
const sheet = () => (_style ??= document.head.appendChild(document.createElement('style')));
const kebab = s => s.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);

function toCss(selector, styles) {
  const decls = [];
  let nested = '';
  for (const [k, v] of Object.entries(styles)) {
    if (v && typeof v === 'object') {
      nested += k.startsWith('@')
        ? `${k} { ${toCss(selector, v)} } `
        : `${toCss(selector + k, v)} `;
    } else if (v !== null && v !== undefined && v !== false) {
      decls.push(`${kebab(k)}:${v}`);
    }
  }
  return (decls.length ? `${selector} { ${decls.join(';')} } ` : '') + nested;
}

function isAttrs(x) {
  return x !== null
    && typeof x === 'object'
    && !Array.isArray(x)
    && !x._isKensingtonTag
    && !x._isKensingtonSignal;
}

export function styled(tag, styles) {
  const className = `k-${++_id}`;
  sheet().textContent += toCss(`.${className}`, styles);
  return (...args) => {
    const hasAttrs = args.length > 0 && isAttrs(args[0]);
    const attrs = hasAttrs ? args[0] : {};
    const rest = hasAttrs ? args.slice(1) : args;
    const merged = { ...attrs, class: [className, attrs.class].filter(Boolean) };
    return tag(merged, ...rest);
  };
}
```

Usage. The returned tag is a plain kensington tag closure. It takes the same arguments any tag does.

```javascript
import { signal, t } from 'kensington';
import { styled } from './styled.js';

const Card = styled(t.section, {
  background: 'white',
  borderRadius: '0.5rem',
  padding: '1rem',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
});

const Button = styled(t.button, {
  background: 'hsl(220 10% 90%)',
  color: 'hsl(220 10% 20%)',
  border: 0,
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  ':hover':         { background: 'hsl(220 10% 85%)' },
  ':focus-visible': { outline: '2px solid hsl(220 80% 70%)' },
});

const count = signal(0);
Button({ type: 'button', onclick: () => count.set(n => n + 1) }, [
  count.transform(n => `Clicked ${n} times`),
]);
```

Composition. Passing a styled tag as the first argument to `styled` layers both classes. The new tag carries the base's generated class AND its own, and later-defined styles win by source order. Compose to any depth.

```javascript
// Base. Common geometry, no opinion on color.
const Button = styled(t.button, {
  border: '1px solid transparent',
  borderRadius: '4px',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  cursor: 'pointer',
});

// One level. Tone variants extend the base.
const PrimaryButton = styled(Button, {
  background: 'hsl(220 80% 50%)',
  color: 'white',
  fontWeight: 600,
  border: 0,
  ':hover': { background: 'hsl(220 80% 40%)' },
});

const DangerButton = styled(Button, {
  background: 'transparent',
  border: '1px solid hsl(0 70% 50%)',
  color: 'hsl(0 70% 50%)',
  ':hover': { background: 'hsl(0 70% 95%)' },
});

// Two levels. CtaButton extends PrimaryButton with larger sizing.
const CtaButton = styled(PrimaryButton, {
  fontSize: '1rem',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  marginTop: '0.75rem',
});

Card([
  t.h2('Confirm'),
  CtaButton({ type: 'button' }, 'Save and continue'),
  DangerButton({ type: 'button' }, 'Delete'),
]);
```

Each composed tag carries every ancestor class. The CSS cascade resolves overrides by class-rule order in the stylesheet, which mirrors the order `styled(...)` calls run at module load. Define the base before the descendant.

Pattern. A shared primitives module. For any app with more than a handful of styled components, factor common surfaces, buttons, text, and inputs into one `ui.ts` file and extend from there. This is the kensington equivalent of a design system. The CSS deduplication is real (one declaration per base, zero per usage site), and source-level intent becomes scannable.

```javascript
// ui.js. The single source of styled primitives. Imported by every view and widget.
import { t } from 'kensington';
import { styled } from './styled.js';

// surfaces
export const surface = styled(t.div, {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
});
export const card = styled(surface, { padding: '0.75rem 1rem', marginBottom: '0.75rem' });
export const heroSurface = styled(t.section, {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '14px',
  padding: '1.5rem',
  marginBottom: '1rem',
});

// buttons
export const buttonBase = styled(t.button, {
  border: '1px solid transparent',
  borderRadius: '4px',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  cursor: 'pointer',
});
export const primaryBtn = styled(buttonBase, {
  background: 'var(--color-accent)',
  color: '#000',
  fontWeight: 600,
  border: 0,
});
export const ghostBtn = styled(buttonBase, {
  background: 'transparent',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  ':hover': { borderColor: 'var(--color-accent)' },
});
export const dangerBtn = styled(buttonBase, {
  background: 'transparent',
  border: '1px solid var(--color-danger)',
  color: 'var(--color-danger)',
});

// text
export const muted = styled(t.span, {
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
});

// inputs
export const formInput = styled(t.input, {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  padding: '0.5rem 0.75rem',
  color: 'var(--color-text)',
  ':focus': { outline: 'none', borderColor: 'var(--color-accent)' },
});
```

Then in views and widgets, extend the primitives with per-screen sizing or one-off tweaks. Avoid redeclaring the surface or button geometry.

```javascript
// settings-view.js
import { card, muted, primaryBtn, formInput } from './ui.js';
import { styled } from './styled.js';

// per-view extension: a wider input. Not a redeclaration of the base.
const fullWidthInput = styled(formInput, { width: '100%' });

const small = styled(muted, { fontSize: '0.75rem' });
```

Rules of thumb.

- A new color, padding, border, or radius that appears in more than one component is a primitive. Move it to `ui.js`.
- A per-component tweak (one-off size, one-off margin) extends a primitive at the call site. It does not redeclare the base.
- Compose by extension, not by spreading style objects. `styled(Base, overrides)` produces one CSS class per layer. Object spread (`styled(t.div, { ...baseStyles, ... })`) duplicates declarations in the stylesheet.
- Name primitives by *role* (surface, card, primaryBtn) not by *appearance* (whiteBox, bigBlueButton). Roles survive a redesign; appearance names rot.

Variant props. Declare modifier classes inside the styles object and let the caller pick one via `class`. Combine with a signal-valued `class` for reactive variants.

```javascript
const Alert = styled(t.div, {
  padding: '0.75rem 1rem',
  borderRadius: '4px',
  borderLeft: '4px solid',
  '.info':  { background: 'hsl(220 80% 95%)', borderLeftColor: 'hsl(220 80% 50%)' },
  '.warn':  { background: 'hsl(40 90% 95%)',  borderLeftColor: 'hsl(40 90% 50%)'  },
  '.error': { background: 'hsl(0 80% 95%)',   borderLeftColor: 'hsl(0 80% 50%)'   },
});

const level = signal('info');
Alert({ class: level }, level.transform(l => `Status: ${l}`));
```

Flipping `level.set('warn')` swaps the modifier class on the live element. The static base styles live in the generated class once.

#### portal. Render a subtree into a DOM node outside the parent

Kensington has no portal API because `.toElement()` already returns a real DOM node. Append it wherever you want. Wrap the call in an `effect` to tie mount/unmount to a signal.

```javascript
// portal.js
export function portal(target, fn) {
  const node = fn().toElement();
  target.append(node);
  return () => node.remove();
}
```

```javascript
import { signal, effect, t } from 'kensington';
import { portal } from './portal.js';

const modalRoot = document.createElement('div');
document.body.append(modalRoot);

const isOpen = signal(false);

let remove = null;
effect(() => {
  if (isOpen.get()) {
    remove = portal(modalRoot, () =>
      t.div({ class: 'overlay' }, [
        t.div({ class: 'modal' }, [
          t.h2('Confirm'),
          t.button({ type: 'button', onclick: () => isOpen.set(false) }, 'Close'),
        ]),
      ]),
    );
  } else {
    remove?.();
    remove = null;
  }
});
```

#### createContext. Provider/consumer pattern with a signal stack

React's `createContext` / `useContext` translates to a signal stack. Consumers call `context.get()` during synchronous construction to capture the nearest provider's signal; the signal reference stays reactive after construction.

```javascript
// create-context.js
import { signal } from 'kensington';

export function createContext(defaultValue) {
  const _stack = [signal(defaultValue)];
  return {
    get() { return _stack.at(-1); },
    provide(value, fn) {
      const ctx = signal(value);
      _stack.push(ctx);
      try { return fn(ctx); } finally { _stack.pop(); }
    },
    set(val) { return this.get().set(val); },
  };
}
```

```javascript
const ThemeContext = createContext('light');

function themeCard(title) {
  const theme = ThemeContext.get();
  return t.div({ class: theme.transform(v => `card card--${v}`) }, [
    t.strong(title), t.small(['theme: ', theme]),
  ]);
}

const app = t.div([
  ThemeContext.provide('dark', () => t.section([themeCard('Always dark')])),
  themeCard('Default'),
]);
```

#### useReducer. Action-dispatch wrapper around a signal

Wrap `signal.set` with a reducer to centralize state transitions. Call sites only send action objects.

```javascript
// use-reducer.js
import { signal } from 'kensington';

export function useReducer(reducer, initialState) {
  const state = signal(initialState);
  const dispatch = action => state.set(s => reducer(s, action));
  return { state, dispatch };
}
```

#### useLocalStorage. A signal that mirrors a localStorage key

Reads the initial value from `localStorage`, writes back on every change. The `effect` does the sync. Guard the initial read with `isBrowser` so server-rendered components do not throw.

```javascript
// use-local-storage.js
import { signal, effect, isBrowser } from 'kensington';

export function useLocalStorage(key, defaultValue) {
  const stored = isBrowser ? localStorage.getItem(key) : null;
  const s = signal(stored !== null ? JSON.parse(stored) : defaultValue);
  effect(() => { localStorage.setItem(key, JSON.stringify(s.get())); });
  return s;
}
```

#### useDebounce. A derived signal that updates only after the source settles

Each time the source changes, the pending timeout is cleared and restarted. The timeout id lives in the enclosing closure because `effect` does not support a cleanup return value.

```javascript
// use-debounce.js
import { signal, effect } from 'kensington';

export function useDebounce(source, delay) {
  const debounced = signal(source.get());
  let id;
  effect(() => {
    const value = source.get();
    clearTimeout(id);
    id = setTimeout(() => debounced.set(value), delay);
  });
  return debounced;
}
```

#### useFetch. `{ data, loading, error }` signals for a URL signal

When the URL changes, the in-flight request is aborted via `AbortController` before the new one starts.

```javascript
// use-fetch.js
import { signal, effect } from 'kensington';

export function useFetch(urlSignal) {
  const data = signal(null);
  const loading = signal(true);
  const error = signal(null);
  let controller;

  effect(() => {
    if (controller) controller.abort();
    controller = new AbortController();
    loading.set(true);
    error.set(null);
    fetch(urlSignal.get(), { signal: controller.signal })
      .then(r => r.json())
      .then(json => { data.set(json); loading.set(false); })
      .catch(err => {
        if (err.name !== 'AbortError') { error.set(err.message); loading.set(false); }
      });
  });

  return { data, loading, error };
}
```

#### useId. Stable unique IDs for pairing labels with inputs

A module-level counter increments once per call. On the server it produces the same sequence on every request, so SSR-output IDs and client-hydration IDs match as long as components are called in the same order.

```javascript
// use-id.js
let _id = 0;
export function useId(prefix = 'k') { return `${prefix}-${++_id}`; }
```

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

Prefer the [`kensington-express`](#kensington-express-any-express-app) package introduced at the top of this guide. It provides `res.renderView(pageRenderer, locals)` with default layout, per-route layout override, locals merging, and an optional `htmlValidator` for dev-time markup checks. Hand-rolling render middleware is unnecessary for most apps.

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

### TypeScript. Reactive prop types

When you write a component that accepts reactive content or attribute values, **type the parameter as `Reactive<T>`**, not `Signal<T>`. `Signal<T>` is the mutable form (has `.set`); `ReadonlySignal<T>` is what `computed`, `transform`, and `mapWithKey` return; `Reactive<T>` is the union (`T | Signal<T> | ReadonlySignal<T>`) and is what kensington's own attribute/content slots accept. Using `Signal<T>` rejects valid arguments at compile time.

```typescript
import type { Reactive, ContentTag } from 'kensington';

// Right. Accepts a static value, a Signal, OR a ReadonlySignal (e.g. the result of mapWithKey).
function listColumn(items: Reactive<ContentTag[]>): ContentTag {
  return t.div({ class: 'column' }, items);
}

// Wrong. mapWithKey returns ReadonlySignal<ContentTag[]>, which doesn't satisfy Signal<...>.
function listColumnTooStrict(items: Signal<ContentTag[]>): ContentTag { ... }   // tsc errors
```

`Signal<T>` is invariant in `T`, so `Signal<'a' | 'b'>` doesn't widen to `Signal<string>`. When a row's `columnId` is `Signal<ColumnId>`, the interface that holds it must say `Signal<ColumnId>` (or a `Reactive<ColumnId>`), not `Signal<string>`.

### Returning a signal from a component function

`signal.transform(...)`, `computed(...)`, and any signal-producing call return a `ReadonlySignal<T>`. At runtime a signal has `.toElement()`, `.mount(target)`, and `.toString()`, so it can be rendered directly with no wrapping element in the DOM. It is also valid as content of any tag (kensington swaps the rendered child reactively).

```typescript
const view = isOpen.transform(o => o ? t.div('Open') : t.div('Closed'));
document.body.append(view.toElement());
// Rendered DOM: <!---->  <div>Closed</div>  <!---->
// On set(true): the inner <div> is swapped in place between the same two anchors.
```

This is the canonical pattern for inline conditional subtree swap. The transform returns a different tag per value of the signal; the returned tag is rendered between two anchor comment nodes; subsequent value changes replace the inner tree. Use it for "name display vs rename input", "loading spinner vs loaded content", "expanded panel body vs collapsed", and similar one-of-N selections where each branch is its own subtree.

Inside a `mapWithKey` `mapFn` (recursive trees, list rows), this pattern composes safely. The outer `mapWithKey` caches the row tag per key. The inner `transform` lives on that cached tag and runs only when its signal changes, regardless of how often the outer keyed registry is consulted. Pass a key to `transform` (the row id, plus a suffix if the row has more than one inline transform) so the inner derivation is reused across outer re-runs:

```typescript
const rows = items.mapWithKey('id', item => {
  const renaming = signal(false, item.id);
  const display = renaming.transform(
    r => r ? t.input({ prop: { value: item.name } }) : t.span(item.name),
    `${item.id}-display`,
  );
  return t.li([t.span(item.icon), display, t.button({ onclick: () => renaming.set(v => !v) }, 'edit')]);
});
```

At the type level, **do not annotate the function's return as `ContentTag`** when you intend to return a signal. `ReadonlySignal<T>` is not structurally a `ContentTag` (the two `toElement()` signatures differ: `ContentTag.toElement(): Element`, `Signal.toElement(): Node`). Annotate as `ReadonlySignal<unknown>` (or a more specific type) instead. The returned value still flows into any tag's content slot, gets mounted via `view.toElement()`, etc.

```typescript
import type { ReadonlySignal } from 'kensington';

// Right. Return type matches what the function actually returns.
function status(): ReadonlySignal<unknown> {
  return isOpen.transform(o => o ? t.div('Open') : t.div('Closed'));
}

// Right. Used directly as content of a parent tag. No wrapper required at this site either.
const page = t.div([status(), t.button({ onclick: () => isOpen.set(v => !v) }, 'Toggle')]);
```

For a component handle that wants to expose other methods alongside its rendered output, type the field as `ReadonlySignal<unknown>` or `Content`:

```typescript
export interface PickerHandle {
  tag: ReadonlySignal<unknown>;   // rendered subtree; reactive
  open(cb: (x: Item) => void): void;
  close(): void;
}
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

const rows = todos.mapWithKey('id', item =>
  t.li([
    t.span({ style: { textDecoration: item.done ? 'line-through' : 'none' } }, item.text),
    t.button({ type: 'button', onclick: () => toggleTodo(item.id) }, 'Done'),
    t.button({ type: 'button', onclick: () => removeTodo(item.id) }, 'Remove'),
  ])
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
