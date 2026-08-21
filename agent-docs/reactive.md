# Reactive data

Subdoc of the root `AGENTS.md`. Read this any time the work touches `signal()`, `computed()`, `effect()`, `.transform()`, `mapWithKey`, or any reactive lifecycle (`addConnectedCallback`, `persist: true`, dev-tools, loading state). The root file has only the decision check and the warning table.

---

## Summary. Read this first

If you're writing trivial reactive code (a couple of signals, one computed, a simple effect), this summary may be all you need. Read deeper sections only when your task lands in the table at the bottom.

### Imports

```javascript
import { t, signal, computed, effect, isBrowser } from 'kensington';
import type { Signal, ReadonlySignal, Reactive } from 'kensington';
```

### The five core operations

- `signal(initial, key?)` — writable state. **Read with `.get()`** (subscribes the current reactive context if one is active; equivalent to a plain read otherwise). Write with `.set(v)` or `.set(prev => next)`. `.stop()` tears down subscribers. `.transform(fn, key?)` chains a derivation. `.value` exists as a non-subscribing peek; it is the exception, not a peer of `.get()`. See [Always use `.get()`](#always-use-get).
- `computed(fn, key?)` — derived state. Auto-disposes when it has no subscribers, re-runs when its tracked signals change.
- `effect(fn)` — side effect (DOM updates, fetches, timers). Returns `{ pause, resume, stop }`. Re-runs when tracked signals change.
- `signal.mapWithKey(keyOrProp, mapFn)` — keyed list rendering. Each key owns a stable tag instance. mapFn re-runs for a row when the outer array delivers a new object whose own enumerable fields actually differ (shallow diff). Reorderings with fresh literals of identical content are no-ops, so DOM node identity is preserved.
- `tag.addConnectedCallback(el => …)` / `addDisconnectedCallback(() => …)` — lifecycle hooks tied to the live DOM element.

### The one rule that bites: pass a key when inside a reactive callback

Before writing any `signal()` / `computed()` / `.transform()` call, ask: will this call run on the call stack of `computed(fn)`, `signal.transform(fn)`, `mapWithKey(key, mapFn)`'s mapFn, or `effect(fn)` at runtime? If yes, pass a stable key as the second argument. Call-stack matters, not lexical position. A helper called from inside a reactive callback is in the trap even though the call looks top-level in the source.

### Always use `.get()`

**Read signals with `.get()`. Always.** It reads the current value and, if you happen to be inside a reactive context, subscribes. Outside a reactive context (event handlers, top-level code, `addConnectedCallback` bodies, async callbacks), `.get()` is functionally identical to `.value` — there is no context to subscribe to, so nothing is tracked. There is no penalty for "always use `.get()`."

**`.value` is an escape hatch, not a peer of `.get()`.** It exists for one specific case: you are inside a reactive callback (`computed`, `transform`, `effect`, `mapWithKey` mapFn) AND you deliberately do NOT want to subscribe. Examples include reading a signal you are about to `.set()` later in the same callback (avoids a self-trigger loop) or capturing a "frozen" initial value when you genuinely want the rest of the callback to not re-run on changes. If you are not solving one of those problems, use `.get()`.

The failure mode is silent: `computed(() => list.value.filter(...))` never re-runs when `list` changes, because the computed never subscribed. The DOM bound to that computed shows the initial value forever. The eslint plugin cannot catch this (it cannot know your intent). The discipline is yours.

**The `.transform` trap.** `sigA.transform(a => ... sigB.value ...)` only re-runs when `sigA` changes. The transform is a computed off `sigA` alone. Reading `sigB.value` inside it does NOT add a dependency on `sigB`, so changes to `sigB` will not refresh the derived value. If the transform body needs to react to a second signal, read it with `.get()`. If you actually wanted "compute from `sigA`, sampling `sigB` untracked," prefer an explicit `computed(() => fn(sigA.get(), sigB.value))` so the asymmetry is visible at the call site. The shape `sigA.transform(a => sigB.value)` reads as a mistake even when it isn't.

**Do not cargo-cult `.value` from the [Spreadsheet-style inline-edit cell](#dom-properties-with-prop) recipe.** That recipe uses `.value` deliberately on `prop: { value: draft.value }` so keystrokes (via an `oninput` write to the same `draft` signal) do not rebuild the input and destroy the cursor. The `.value` there is paired with a same-callback `.set()`. Copying `.value` into an unrelated `.transform` or `computed` body without that write pairing is the silent-failure case. The recipe's `[!]` comments mark the spots where untracked reads are intentional; absent that pairing, default to `.get()`.

### Common patterns at a glance

- Live text or attribute: `t.span(sig)`, `t.button({ class: cls, disabled: isLoading })`.
- Live input: `t.input({ type: 'text', prop: { value: sig }, oninput: e => sig.set(e.target.value) })`.
- Conditional subtree containing a keyed list: prefer the **display-toggle** pattern (`style: { display: visible.transform(v => v ? 'block' : 'none', 'k') }`) over `computed(() => visible.get() ? subtree : null)`, which rebuilds the per-key cache on every flip.
- Per-row local state: `signal(false, item.id)` inside a `mapWithKey` mapFn.
- Drag-and-drop sortable items: add `persist: true` to each row tag so effects pause on removal and resume on re-insertion.
- Standalone `effect()` cleanup: capture the return, stop it from `addDisconnectedCallback`. The `kensington/no-ignored-effect-return` lint rule expects an assignment.

### When to read which section

| Task | Section |
|---|---|
| Why `.get()` is always the default | Signal API → Always use .get() |
| Binding `value` / `checked` / `<select>` to a signal | DOM properties with `prop` |
| Side effects, timers, fetches | effect |
| Rendering a list | Keyed lists |
| Row contents that update from outside the row | Updating a row after it's been cached |
| External code driving per-row state | Addressing per-row state from outside the row |
| Lazy module-level signal registry | Lazy registries called from reactive callbacks |
| Drag/drop, view toggling, mount/unmount lifetime | Cleanup, addConnectedCallback / addDisconnectedCallback |
| Loading spinners, view replacement | Loading state |
| Diagnosing a runtime warning | Reactive pitfalls |
| Inspecting state | DevTools |

Full reference follows.

---

## Reactive data

Signals and `computed` work in any JavaScript environment. `.toElement()` and DOM-mutating effects require a browser. During `renderForHydration`, `effect()` is suppressed entirely. Browser-only code inside an `effect()` is safe to call on the server.

```javascript
import { t, signal, computed, effect, isBrowser, Signal } from 'kensington';
import { renderForHydration, registerComponents } from 'kensington';
```

## Signal API

> **Before you write `signal()`, `computed()`, or `.transform()`, ask one question:** is this call going to run on the call stack of a `computed`, `transform`, `mapWithKey` `mapFn`, or any helper function called from one of those? If yes, **pass a key as the second argument**. The key scopes the instance to the surrounding reactive callback so it is reused across re-runs instead of recreated. Without a key the warning fires, DOM nodes get replaced when outer state changes, and per-row local state silently resets. See [Reactive primitives inside a computed need a key](#reactive-primitives-inside-a-computed-need-a-key) for the full rule, the wrong/right helper pair, and which keys collide. The most common failure mode is a row component like `function row(item) { const open = signal(false); ... }` invoked from a `mapWithKey` mapFn — the `signal()` looks top-level in the source but runs inside the per-key computed at execution time.

```javascript
const n = signal(0);
n.get()                   // read. ALWAYS PREFER THIS. Subscribes if inside computed/effect; plain read otherwise.
n.set(1)                  // set
n.set(v => v + 1)         // update via function
n.stop()                  // clear all subscribers; signal retains current value
n.toJSON()                // returns the current value; makes signals transparent to JSON.stringify
n.toString()              // returns String(this.get()); works in template literals and string concatenation

n.value                   // ESCAPE HATCH. Reads without subscribing. See "Always use .get()" before reaching for this.

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

**TypeScript inference for literal initial values.** `signal('light')` infers `Signal<'light'>`, not `Signal<string>`. Subsequent `.set('dark')` then fails to typecheck. Whenever the signal will hold a value the initial form does not exhibit, pass the type parameter explicitly: `signal<'light' | 'dark'>('light')` or `signal<string>('')`. Same applies to `signal(0)` → `Signal<0>` (write `signal<number>(0)`), `signal([])` → `Signal<never[]>` (write `signal<TreeNode[]>([])`), and union arrays. The runtime accepts any value; only the static type is narrow.

**Using JSDoc with `.d.ts` sidecars.** Projects that use JavaScript with `.d.ts` sidecar files (rather than full TypeScript) get `any` for `transform` / `computed` / `mapWithKey` callback parameters under `noImplicitAny`. The fix is an inline JSDoc `@param` annotation on the callback. Annotate the parameter, not the whole function.

```js
// Wrong. parameter `p` is implicit `any`. Fails under strict + checkJs + noImplicitAny.
const connected = presence.transform(p => p.users.length, 'connected-count');

// Right. Inline @param tells tsc the parameter type.
const connected = presence.transform(
  /** @param {PresenceList} p */ p => p.users.length,
  'connected-count',
);

// Same shape for computed.
const visible = computed(
  /** @returns {Sticky[]} */ () => stickies.get().filter(s => !s.archived),
  'visible-stickies',
);

// Same shape for mapWithKey. Annotate the row arg.
const rows = stickyList.mapWithKey(
  s => s.id,
  /** @param {Sticky} s */ s => stickyRow(s),
);
```

The annotation hangs off the parameter, so tsc narrows the function body without inferring through call-graph context. Verbose, but doesn't require switching the whole file to TS. Skip the annotation entirely on full-TypeScript projects. Inference picks up the source signal's element type.

**Reactive collections (arrays, maps, sets).** Store the collection in a `Signal<T[]>` (or `Signal<Map<...>>`, etc.) and always replace it with a NEW value via `.set(newValue)` instead of mutating in place. Reads inside a `computed` then re-run on every replacement. In-place mutation (`arr.push(x)`, `set.add(x)`, `arr.length = 0`) does not notify subscribers because the signal's identity has not changed.

```typescript
const items = signal<string[]>([]);

// Wrong. Mutation in place. No subscribers notified, .length read inside a computed never updates.
items.value.push('new');

// Right. New array. Subscribers notified, .length read inside a computed re-runs.
items.set(curr => [...curr, 'new']);

// Reactive read works because the signal value is replaced.
const count = computed(() => items.get().length);
```

For mutable plain JS arrays/maps used outside a signal (rare; usually a code-smell), shadow the mutable with a `version: Signal<number>` and bump it on every mutation. Reads inside a computed read `version.get()` once to subscribe, then access the plain mutable. This is a workaround. Prefer wrapping the collection in a signal directly.

**Annotating helper-function return types.** When a helper like `function row(item): ??? { return t.tr([...]); }` is called from inside a slot whose content type is branded (most table-shaped slots are. `TheadContent`, `TbodyContent`, `TrContent`, `ColgroupContent`, etc.), the return annotation must be the specific tag class (`TrTag`, `TdTag`, etc.) NOT the generic `ContentTag`. `ContentTag` is the runtime base class; the static slot unions are deliberately strict tag-by-tag (so `<thead>` only accepts `<tr>` children at type level, even though the runtime would accept any `ContentTag`). Annotating `: ContentTag` rejects the helper from a branded slot. Two safe annotations.

- `: TrTag` (or whichever specific tag the helper returns). Always works for branded slots.
- `: Content` (imported from `kensington`). Works for generic helpers that return mixed content shapes and feed into slots that accept the wide `Content` union.

For mostly-typed helpers the cleanest pattern is to drop the return annotation entirely and let inference do the work. Inference produces the exact tag class.

```typescript
import { t, type TrTag, type TdTag, type Content } from 'kensington';

// Right. Specific tag class.
function row(label: string): TrTag {
  return t.tr([t.td(label)]);
}

// Right. Inference.
function cell(value: string) { return t.td(value); }   // inferred as TdTag

// Right. Generic union for slots that accept Content.
function fragment(label: string): Content {
  return [t.span(label), ' '];
}

// Wrong. ContentTag is too wide for the branded slot.
function row(label: string): ContentTag { return t.tr([t.td(label)]); }
// Error: `ContentTag` is not assignable to `TrContent`.
```

`isKensingtonSignal` is exported as a named export for duck-typing signal checks that work across module instances:

```javascript
import { isKensingtonSignal, signal } from 'kensington';

function maybeSignal(value) {
  return isKensingtonSignal(value) ? value : signal(value);
}
```

**Read with `.get()`. Always.** This is restated multiple times in this doc because it is the single most common silent-failure mode in kensington apps.

`.get()` reads the current value and — if a reactive callback (`computed`, `transform`, `effect`, `mapWithKey` mapFn) is currently running — subscribes the callback to this signal so it re-runs on future changes. Outside any reactive callback (event handlers, top-level code, `addConnectedCallback` bodies, async callbacks), `.get()` simply returns the current value. There is no penalty for using `.get()` everywhere. **If you are reaching for `.value`, stop and confirm you actually need to skip subscription.** The number of legitimate reasons is small:

1. Reading a signal you are about to `.set()` later in the same reactive callback, to avoid a self-trigger loop (see [Do not read and write the same signal in the same effect or computed run](#do-not-read-and-write-the-same-signal-in-the-same-effect-or-computed-run)).
2. Capturing a "frozen" initial value inside a reactive callback when you genuinely want subsequent changes NOT to re-trigger the callback (rare; the [Spreadsheet-style inline-edit cell](#dom-properties-with-prop) recipe is one example).
3. Sampling current state from inside an async callback that fires long after the surrounding code returned (e.g., a `setTimeout` or `fetch().then(...)` body).

If your call doesn't match one of those, use `.get()`.

**The silent-failure mode.** A `computed(() => list.value.filter(...))` never re-runs when `list` changes, because the computed never subscribed. The DOM bound to that computed shows the initial value forever. There is no warning. The lint plugin cannot catch this. Fix: `list.get().filter(...)`.

**The `.transform` variant of the same trap.** `sigA.transform(a => ... sigB.value ...)` is a computed off `sigA` only. Reading a second signal via `.value` inside the body does not subscribe the transform to that second signal, so it will not re-run on its changes. The shape `sigA.transform(a => sigB.value)` reads as a mistake even when it isn't. If both signals should drive the result, read the second with `.get()` (or use a freestanding `computed` so the dependencies are explicit at the call site).

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

## As content and option values

```javascript
const count     = signal(0);
const isLoading = signal(false);
const cls       = computed(() => isLoading.get() ? 'btn btn--loading' : 'btn');

t.p(count)                                        // live text content
t.p([count, ' items'])                            // mixed with static text
t.button({ class: cls, disabled: isLoading }, 'Save')  // live attribute + boolean attribute
t.input({ type: 'search', value: query })         // live value attribute
```

An unkeyed `Signal<Tag[]>` passed as content reconciles in place by position — the array becomes the new content on every change. For stable per-item identity (caching tags across re-renders, preserving DOM state per row), use `mapWithKey` instead.

A `Signal<Tag | null>` passed as content works the same way the single-tag case does. When the signal flips between a tag and `null`, the previous DOM is removed and the new one is inserted in place. Use this for "show this only when X" patterns where no list is involved. The "Conditional subtrees that contain a keyed list" guidance in [Keyed lists](#keyed-lists) below covers the case where the conditional subtree contains a `mapWithKey` and the simple `null`-toggle pattern would tear down the keyed cache.

### Whole-object signals on attribute slots

`style`, `data`, `aria`, and any namespaced attribute can take a `Signal<Object>` at any nesting depth, not just per-leaf signals on individual properties.

```javascript
// Per-property (still works). Only the changed property writes to the DOM.
t.div({ style: { color: colorSignal, fontSize: '1rem' } });

// Whole-style signal. The signal yields a {prop: value} object; each emission
// diffs against the previous, applying changed properties and clearing missing ones.
const position = computed(() => ({ top: `${y.get()}px`, left: `${x.get()}px` }), 'pos');
t.div({ style: position });

// Same shape for namespaced attributes.
const bsState = signal({ toggle: 'collapse', target: '#pane' });
t.div({ data: { bs: bsState } });       // → data-bs-toggle="collapse" data-bs-target="#pane"

// And at the top level.
const cursorData = signal({ x: 10, y: 20, color: 'red' });
t.div({ data: cursorData });            // → data-x="10" data-y="20" data-color="red"
```

`prop` and `on` deliberately do NOT support whole-object signals. Use per-property signals there (`prop: { value: sig, disabled: another }`, `on: { input: handler }`). Removal semantics for those slots are undefined when a property disappears from a new signal emission.

When a signal-yielded object contains *other* signals as values, those inner signals are sampled (via `.value`, no subscription) at outer-emission time. The outer signal owns the subscription. If you want inner signals to drive updates independently, use the per-property form instead.

Use `.transform(String)` when an attribute expects a string but the signal holds a non-string value:

```javascript
const liked = signal(false);
t.button({ ariaPressed: liked.transform(String) }, '♥');
```

## DOM properties with `prop`

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

**Editing a number through a text input.** `HTMLInputElement.value` is typed `string` in `lib.dom`, so a `Signal<number>` can't bind to `prop: { value: ... }` directly. The canonical pattern is a string draft signal plus a numeric source signal, with a commit step that parses on blur or Enter:

```javascript
const hours = signal(0);                          // numeric source of truth
const draft = signal(String(hours.get()));        // string scratch, bound to el.value

function commit() {
  // commit() runs from event handlers (blur, keydown), not inside a reactive
  // callback. .get() here is a plain read with no tracking.
  const n = Number(draft.get().trim());
  if (Number.isFinite(n)) {
    hours.set(n);
  } else {
    draft.set(String(hours.get()));               // reset draft on bad input
  }
}

t.input({
  type: 'number',
  prop: { value: draft },
  on: {
    input: e => draft.set(e.target.value),
    blur: commit,
    keydown: e => { if (e.key === 'Enter') { commit(); } },
  },
});
```

The same shape works for any "edit-and-commit" field where the on-screen text and the in-model value need different types. Two signals avoid the value-must-be-string typing constraint without forcing the rest of the app to deal in strings.

**Spreadsheet-style inline-edit cell.** A pattern that combines several of the above pieces. Click the cell to enter edit mode, type a value, press Enter or blur to commit, Escape to cancel. The cell starts in read mode showing the current value; it swaps to an input on click; on commit it goes back to read mode displaying the new value.

```javascript
import { t, signal, computed } from 'kensington';

function cell(weekSig, dayIso, myEdit, empId, projId, commit, cancel) {
  // Boolean signal: "is THIS cell the one being edited?" Shared via the keyed
  // registry so reading it elsewhere (cellClass below) returns the same
  // instance.
  const editing = myEdit.transform(
    e => e !== null && e.empId === empId && e.projId === projId && e.dayIso === dayIso,
    `is-editing:${empId}:${projId}:${dayIso}`,
  );

  // Class string reacts to editing state AND to the underlying cell value
  // (for the heatmap class). Use .get() for both so the class attribute
  // re-renders when either changes. (The week-map entry shape is `{ hours }`;
  // .hours is a plain object property, not a signal read.)
  const cellClass = computed(() => {
    const map = weekSig.get();
    const hours = map[dayIso]?.hours ?? 0;
    return ['cell', `hrs-${Math.min(8, Math.round(hours))}`, editing.get() ? 'cell-editing' : '']
      .filter(Boolean)
      .join(' ');
  }, `cell-class:${empId}:${projId}:${dayIso}`);

  // Body. Read-mode shows the number; edit-mode renders an input that is
  // focused and selected on mount. CRITICAL points marked with [!].
  const body = editing.transform(isEd => {
    if (isEd) {
      const input = t.input({
        type: 'number',
        // [!] Read .value (untracked) here. We want the CURRENT draft at the
        // moment of render. If we read draft.get(), every keystroke would
        // trigger this transform to re-run and rebuild the input element,
        // destroying the user's selection and cursor position.
        prop: { value: myEdit.value ? myEdit.value.draft : '' },
        oninput: e => {
          // Event handler is imperative scope; .get() is a plain read here.
          const cur = myEdit.get();
          if (cur === null) { return; }
          myEdit.set({ ...cur, draft: e.target.value });
        },
        onkeydown: e => {
          if (e.key === 'Enter') { commit(); }
          else if (e.key === 'Escape') { cancel(); }
        },
        onblur: () => commit(),
      });
      // [!] Focus + select on mount. queueMicrotask defers so the prop:value
      // binding lands before .select() runs. Without this, the input
      // appears in the DOM but cannot be typed into because nothing has
      // focused it; users perceive the tab as frozen.
      input.addConnectedCallback(el => {
        queueMicrotask(() => {
          el.focus();
          // [!] <input type="number">.select() throws InvalidStateError in
          // Safari but no-ops in Chrome. Wrap in try/catch.
          try { el.select(); } catch { /* Safari type=number */ }
        });
      });
      return input;
    }
    // [!] Read mode uses .get() (tracked). When the underlying week-map
    // signal changes (e.g., from a remote write), the cell text refreshes.
    // Using .value here would make the text stale.
    const map = weekSig.get();
    const entry = map[dayIso];
    return t.div({ class: 'cell-inner' },
      entry ? String(entry.hours) : '',
    );
  }, `cell-body:${empId}:${projId}:${dayIso}`);

  // The onclick handler runs in imperative scope (event dispatch), not
  // inside a reactive callback. .get() here is a plain read with no tracking.
  return t.div({
    class: cellClass,
    onclick: () => {
      if (myEdit.get() === null) {
        const cur = weekSig.get()[dayIso];
        myEdit.set({
          empId, projId, dayIso,
          draft: cur ? String(cur.hours) : '',
        });
      }
    },
  }, body);
}
```

The footguns marked `[!]` are the ones that bite. (1) The input's `prop: { value: ... }` reads `.value` (untracked) because you want the draft AT the moment the input is rendered, not on every keystroke. (2) The `addConnectedCallback` with `queueMicrotask` for focus is required because the input is inserted into the DOM after the click event finishes, and without a focus call the user has no cursor. (3) Safari throws on `<input type="number">.select()` while Chrome no-ops. Wrap in try/catch. (4) The read-mode branch uses `.get()` so the cell re-renders on underlying signal changes. The edit-mode branch does NOT read the underlying signal so typing doesn't rebuild the input.

**Do not generalise `.value` from this recipe.** The `.value` here is correct because the same callback writes back to `myEdit` via `oninput`. That self-write is what makes the untracked read necessary. In a `.transform` or `computed` body that does NOT write back to the signal it is reading, `.value` is the silent-failure case from [Always use `.get()`](#always-use-get). Default to `.get()` and reach for `.value` only when you are pairing it with a same-callback `.set()` on the same signal.

**The same dance applies to every editable element**, not just `<input type="number">`. Swap the edit-mode tag for a `<textarea>` (multi-line sticky notes), `<input type="text">` (free-text fields), `<input type="email">`, `<select>`, `<input type="checkbox">` (with appropriate event), or any custom element that owns a `value` property. The same four footguns apply. `prop: { value: untracked }` for the initial draft. `queueMicrotask` deferred focus. `try/catch` around `.select()` because some elements/browsers throw on it (notably `<input type="number">` in Safari. `<textarea>.select()` is well-supported but harmless to wrap). Tracked-read read-mode vs. untracked-read edit-mode.

```js
// Textarea variant (e.g. sticky note body).
const ta = t.textarea({
  prop: { value: draft.value },          // untracked initial
  oninput: e => draft.set(e.target.value),
  onblur: () => commit(),
  onkeydown: e => { if (e.key === 'Escape') { cancel(); } },
});
ta.addConnectedCallback(el => {
  queueMicrotask(() => {
    el.focus();
    try { el.select(); } catch { /* defensive; textarea.select() works everywhere */ }
  });
});
```

`prop` is silently ignored in `.toString()`. Known writable properties on the element's DOM interface are typed in TypeScript. Expando properties (arbitrary string keys) are also accepted as `unknown`. Property existence and writability are validated at render time via `validationLevel`.

**`<select>` ordering gotcha.** Setting `prop: { value: ... }` on a `<select>` requires its `<option>` children to be mounted FIRST. If the prop binding fires before children are attached, the assigned value silently does not stick (the browser can't match the value to an option that doesn't exist yet). With kensington's normal `(attrs, content)` argument order this is fine. The risk is when you build the select via `addConnectedCallback` and assign `el.value` synchronously; defer the assignment with `queueMicrotask(...)` so the options land first. The same risk applies if you `.set()` the bound signal from `addConnectedCallback` before the children's binding effects have run.

**SSR plus hydration plus custom elements.** When a component using `prop` is rendered via `renderForHydration` and then hydrated on the client, the SSR HTML contains no `prop` values at all (only the regular attributes the tag declared). On the client, `registerComponents` re-runs the component, replaces the SSR DOM via `.toElement()`, and the `prop` bindings land on the live element. For custom elements (`<sl-input>`, `<wa-input>`, any Lit-based or vanilla web component), the autoloader script tag should appear in `<head>` so the element is already upgraded by the time the hydration script runs; the `prop` assignment then targets the upgraded element's reactive property (`el.value = signalValue`) rather than the attribute, and the custom element's own reactive system observes the change.

## effect

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

**For page-lifetime effects that intentionally never stop**, the `kensington/no-ignored-effect-return` lint rule still expects an assignment. The idiomatic suppression is to assign to a leading-underscore name: `const _keepAlive = effect(() => { presenceSig.get(); });`. The rule allows leading-underscore identifiers because their intentional-unused semantics match the no-stop case (an underscore-prefixed binding tells the next reader "I will never read this back, but the side effect of calling the function is the point"). Same idiom works for top-of-module pinning of a live signal that should outlive every render.

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

## Keyed lists

```javascript
const items = signal([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);

const rows = items.mapWithKey('id', item => t.tr(t.td(item.name)));

t.tbody(rows);
```

`signal.mapWithKey(keyOrProp, mapFn)` is a method on `Signal<Item[]>` (and `ReadonlySignal<Item[]>`). The receiver MUST hold the array directly. For an envelope shape like `Signal<{ tabs: Tab[] }>`, project the array first: `presence.transform(p => p.tabs, 'presence-tabs').mapWithKey('id', tab => ...)`. See the "envelope around a list" note below.

`signal.mapWithKey(keyOrProp, mapFn)` returns a `ReadonlySignal<Tag[]>`. The first argument is either a property name string (the common case) or a function that extracts the key. Each key owns a stable tag instance that the reconciler reuses across renders. mapFn re-runs for a row when the outer array delivers a new object AND that row's own enumerable fields actually differ (shallow diff by `Object.is`). A fresh literal with identical content is a no-op — same tag, same DOM node, same focus/scroll/input state. Keys live on the tag instance via a Kensington-internal property and are read by the reconciler via a `WeakMap`. They do not appear in the rendered DOM.

Both forms of the first argument:

```javascript
// Property-name string. Common case. Picks the value at item[prop] as the key.
items.mapWithKey('id', item => t.tr(t.td(item.name)));

// Function extractor. Required for primitive arrays, composite keys, or
// computed keys.
ids.mapWithKey(id => id, id => t.li(getName(id)));               // primitive array
rows.mapWithKey(r => `${r.sheet}:${r.row}`, r => cellRow(r));    // composite key
```

The function form is the right choice when the array elements are strings/numbers (no `id` property to point at), when the key is composed from multiple fields, or when the key depends on a transform of the element.

`mapWithKey` is a method on `Signal` and `ReadonlySignal`. It is not a method on plain arrays. If the source data is a plain array (e.g. lazily-loaded children), wrap it in a `signal()` first, then call `.mapWithKey()` on the wrapped signal.

**The source signal must hold the array, not an object containing the array.** A signal shaped like `Signal<{ tabs: Tab[] }>` cannot call `.mapWithKey('id', ...)` directly. TypeScript reports `this of type 'Signal<{ tabs: Tab[] }>' is not assignable to method's this of type 'Signal<Tab[]>'`, which reads as a generic-inference error but is structural. Project the inner array first via `.transform`: `presence.transform(p => p.tabs, 'tabs').mapWithKey('id', tab => ...)`. The keyed transform is cheap (one extra inner signal, reused across re-runs) and the cache still keys off `id` on the underlying `Tab`. Common pitfall on live signals that hold a single document shape (`{ users: [...] }`, `{ items: [...] }`, `{ rows: [...] }`).

**TypeScript tip. Source element type must be uniform.** `mapWithKey<Item>` infers `Item` from the source signal's element type. A signal that holds a *union* of inlined object shapes (e.g. `Signal<{ kind: 'emp', name: string }[] | { kind: 'proj', label: string }[]>` produced by a `computed(() => mode.get() === 'employee' ? employees : projects)`) is rejected at `.mapWithKey('id', ...)` because the union does not have a single shared `Item` type. Declare a named row type, narrow both branches before returning, and the inference resolves: `type Row = { kind: 'emp', name: string } | { kind: 'proj', label: string }; const rows = computed<Row[]>(() => ...)`.

Calling `.mapWithKey()` on a derived signal works the same way the writable form does. The canonical "derive a slice then list-map" pattern is `const visible = items.transform(list => list.filter(p), 'visible'); visible.mapWithKey('id', row)` or `computed(() => items.get().filter(p), 'visible').mapWithKey('id', row)`. The per-key cache still keys off `id`; the underlying derivation triggers reconciliation when the slice changes.

For recursive structures like trees, calling `mapWithKey` inside another `mapWithKey`'s `mapFn` is the canonical pattern. The outer `mapFn` runs once per key (cached), so the inner `mapWithKey` is constructed once per row and lives as long as the cached row tag. The `mapwithkey-in-reactive` warning is suppressed in this case. The warning still fires when `mapWithKey` is called inside an arbitrary `computed` or `effect` body that re-runs on every dependency change.

**Conditional subtrees that contain a keyed list.** The natural pattern for "show this only when X" is `computed(() => visible.get() ? buildSubtree() : null)`. If `buildSubtree()` contains a `mapWithKey` call, every flip of `visible` rebuilds the whole per-key cache and trips the `mapwithkey-in-reactive` warning. Don't do that. Two safe patterns instead:

- **Display toggle.** Always build the subtree once. Toggle its visibility with `style: { display: visible.transform(v => v ? 'block' : 'none', 'subtree-display') }`. The DOM stays mounted; the per-key cache stays warm; CSS handles the hide. Costs the initial mount but avoids rebuild churn on every toggle.
- **Lift the mapWithKey out.** Build the keyed list once at component scope: `const rows = items.mapWithKey('id', mapFn)`. Pass `rows` into the conditional: `computed(() => visible.get() ? t.div(rows) : null)`. The list is constructed once; the conditional just decides whether to render the wrapper around it.

Display toggle is the right choice when the subtree includes form fields whose unsaved state you want to preserve across toggles. Lifting the mapWithKey is the right choice when the wrapper itself differs across branches (e.g. a tabbed view where each tab renders a different `mapWithKey` source).

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

## Updating a row after it's been rendered

The natural pattern works: replace the row in the outer array with a new object that has the updated fields, and `mapWithKey` re-runs `mapFn` for that row only. The wrapper shallow-diffs the new item against the previous one; any field that fails `Object.is` (including a nested-object ref change) fires the row.

```javascript
const items = signal(initialTickets);

const rows = items.mapWithKey('id', ticket => t.article({ class: `card status-${ticket.status}` }, [
  t.span(ticket.title),
  t.ul(ticket.comments.map(c => t.li(c.body))),
]));

// SSE / WebSocket / polling handler. Immutable-update pattern.
function applyServerUpdate(ticketId, patch) {
  items.set(list => list.map(t => t.id === ticketId ? { ...t, ...patch } : t));
}
```

The shallow diff is field-level by `Object.is`. If a patch touches only a nested-object field (`comments`, for example), splat the parent and the nested field together: `{ ...t, comments: [...t.comments, newComment] }`. The top-level `comments` ref changes → shallow-diff detects it → row re-runs.

Prefer this shape over "wrap each row in per-row signals." The per-row-signal pattern still works if you have separate reasons to hold field-level signal identity (e.g. you want a `.transform()` chained off a specific field), but it is no longer required for row updates to be visible.

### Addressing per-row state from outside the row

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
    if (!s.childrenLoaded.get()) {
      const rows = await fetchChildren(id);
      s.children.set(rows);
      s.childrenLoaded.set(true);
    }
    s.expanded.set(true);
  }
}
```

The signals in the registry are not keyed (no second argument). They are owned by the module, not by a `mapWithKey` scope, so the `out-of-scope-reactive-reference` warning does not apply. The trade-off is that the registry is never garbage-collected automatically; remove entries when a node is permanently deleted. Use this pattern only when the registry-keyed lookups are needed from outside the rendering pipeline. For self-contained list rows whose state nobody outside reads or writes, keep using `signal(initial, key)` inside the `mapWithKey` `mapFn`.

## Reactive primitives inside a computed need a key

**Decision check before writing any `signal()`, `computed()`, or `.transform()` call.** Will this call run on the call stack of a reactive callback (`computed(fn)`, `signal.transform(fn)`, `signal.mapWithKey(key, mapFn)`'s mapFn, or `effect(fn)`) at runtime? If yes, pass a key as the second argument. This is call-stack, not lexical. If a helper function does the creation and the helper is called from inside one of those callbacks, the runtime walks the call stack and counts the creation as "inside" the reactive scope. The lexical position in the source does not matter.

When in doubt, pass a key. Passing a key outside a reactive context is a no-op; missing a key inside one is a silent UX bug (per-row local state resets on every outer re-run). The key must be unique within the surrounding reactive callback's run. Use item identity (`item.id`) plus a local label when needed (`${item.id}-cls`, `${item.id}-matches`).

The worked example below shows the lexical case. The wrong/right helper pair after it shows the call-stack case, which is how most real code is structured.

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

The same applies anywhere a helper that creates signals or computeds is called from inside a `computed`, `transform`, `effect`, or `mapFn` body. `mapWithKey` is one common case; **any** `computed(() => ...)` wrapper has the same effect. If you wrap a section of UI in `computed(() => ...)` so it rebuilds when a dimension/layout signal changes, every per-row or per-cell helper called from inside is in the trap. Keys per call site (e.g. `${address}-cls` when the wrapping computed iterates addresses).

### Lazy registries called from reactive callbacks

A common pattern is a module-level "get-or-create" registry. `getCellRaw(address)` returns an existing signal from a `Map`, or creates one on first access.

```javascript
const cellRaw = new Map();
function getCellRaw(address) {
  let s = cellRaw.get(address);
  if (!s) {
    s = signal('');   // ← lazy creation
    cellRaw.set(address, s);
  }
  return s;
}
```

The registry's intent is "the signal lives at module scope, shared across the app." Calling it from outside any reactive scope (a click handler, top-level mount code, an effect callback) is fine. Calling it from inside a reactive callback (`computed`, `transform`, `mapWithKey` mapFn) where the address has not yet been seeded triggers the lazy `signal()` call inside the reactive callback, which fires the `signal-in-computed` warning.

Passing a key to the lazy `signal()` is the wrong fix here. The key would scope the signal to the surrounding computed's keyed registry, but the whole point of the module-level Map is to be the owner. Scoping to the computed's registry means the signal disappears when the outer computed re-runs and sweeps unaccessed keys.

The right fix is **eager pre-seeding**. Iterate every address the app will ever access and call `getCellRaw(addr)` once at mount time, outside any reactive scope:

```javascript
// At mount, before any reactive code runs.
export function seedAll(sheet) {
  for (let r = 0; r < sheet.rows; r++) {
    for (let c = 0; c < sheet.cols; c++) {
      getCellRaw(toAddress(r, c));   // creates the signal once, here, outside any computed
    }
  }
}
```

After seeding, every later `getCellRaw(addr)` call (from anywhere, including reactive callbacks) is a Map lookup that returns an existing signal. No `signal()` constructor call inside a reactive scope, no warning.

When the addressable space is unbounded or unknown ahead of time, the alternatives are: only seed addresses that exist in the loaded data set (acceptable if non-existent addresses can be treated as "not in registry, return 0 / fall through"), or restructure the helper so the lazy creation is forced to the outermost call site (the consumer ensures the signal exists before reading it).

**Seed BEFORE the `.set()` that triggers the read, not after.** `.set()` notifies subscribers synchronously. A computed subscribed to the signal re-runs *inside* the `.set` call, before any code that runs after the `.set`. This matters for virtualized lists, infinite-scroll grids, and mode toggles where mutating a "window" signal causes a render computed to re-evaluate over a new range of addresses:

```javascript
// Wrong. seedRange runs AFTER .set, but the rowsBody computed already re-ran
// synchronously inside .set(), found a Map miss, and lazily created a signal
// inside the reactive callback.
function scrollRowsBy(delta) {
  visibleRowStart.set(visibleRowStart.get() + delta);
  visibleRowEnd.set(visibleRowEnd.get() + delta);
  seedRange(...);   // too late
}

// Right. Seed for the NEXT window's coordinates before .set fires. By the time
// the rowsBody computed re-evaluates (synchronously inside .set), every
// address it touches is already in the Map.
function scrollRowsBy(delta) {
  const nextStart = visibleRowStart.get() + delta;
  const nextEnd   = visibleRowEnd.get() + delta;
  seedRange(nextStart, nextEnd, ...);
  visibleRowStart.set(nextStart);
  visibleRowEnd.set(nextEnd);
}
```

The same rule applies to mode/grouping toggles (`groupMode.set('project')` reshapes which addresses the render computed reads) and to any other "small mutation that changes the reactive read set's shape." If you find yourself writing `helper(); signal.set(next);` instead of `signal.set(next); helper();`, the helper probably needs to run first.

**Unique keys per keyed call.** `signal()` lives in its own registry, so `signal(0, item.id)` doesn't collide with `computed(fn, item.id)`. But `computed()` and `.transform()` share a registry, so two of them with the same key inside the same outer run collide and silently return the same instance. Use a per-call label: `${item.id}-cls`, `${item.id}-matches`.

**Don't escape the scope.** Don't reference a keyed instance from outside the owning `computed`. The owner can stop it at any time, after which external subscribers silently stop receiving updates. Safe usage: consume inline via method chain (`.get()`, `.transform(...)`), pass directly to a tag as content or an attribute value, or pass to a helper function. The `no-out-of-scope-reactive-reference` lint rule catches escapes (return-from-nested-fn, assign-to-outside-scope-variable) statically.

**Key types.** Any value usable in a `Map`: `string`, `number`, `symbol`, or `object` (exported as `SignalKey`). Object keys require a stable reference across outer re-runs. Immutable-update patterns that clone the item produce a new reference, so prefer `item.id`.

**Duplicates and unkeyed fallback.** Two calls with the same key in the same outer run share a single instance and log a `throttledError`. Calls without a key still work but the inner is re-created on every re-run (state resets, orphans accumulate in the devtools Signals tab, and the library logs a `console.warn`).

## Cleanup

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

## addConnectedCallback / addDisconnectedCallback

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
- **Window- or document-level listeners** are wired the same way. `panel.addConnectedCallback(() => { window.addEventListener('keydown', handler); }); panel.addDisconnectedCallback(() => { window.removeEventListener('keydown', handler); });` keeps the listener's lifetime tied to the panel's mount. Useful for global keyboard shortcuts, scroll listeners, `online`/`offline` events, etc. Always pair with a `removeEventListener` in the disconnect callback, since these listeners are not on a node that gets garbage collected with the panel.
- **`addConnectedCallback` fires BEFORE `prop` bindings apply.** This is a general rule, not just a `<select>` or focus-and-select special case. When a tag declares `prop: { value: someSignal }`, the binding effect runs as part of the lifecycle setup that happens around (and partly after) the connected callbacks. **Anything inside `addConnectedCallback` that reads `el.value` (or any other prop-bound property) synchronously will see the pre-binding state, even when the signal is non-empty.** Example failures: measuring a textarea's content size to compute character-cell dimensions, calling `el.focus(); el.select()` on a pre-filled input, mirroring `el.value` to a sibling element. Defer any read with `queueMicrotask(() => { ... })` so the prop binding lands first. Plain `el.focus()` (no value read) is safe in either order because focus does not depend on the prop-bound value.

This is the canonical place for `setInterval`/`setTimeout`, `IntersectionObserver`, `ResizeObserver`, manual focus, `effect()` whose lifetime should match the element's mount, or any imperative DOM API that needs symmetric setup/cleanup tied to element mount/unmount.

## isBrowser

```javascript
// Guard module-level or computed() code that calls browser-only APIs
const stored = isBrowser ? localStorage.getItem('theme') : null;

// Inside effect(). Always safe; effect is a no-op on the server
effect(() => { localStorage.setItem('theme', dark.get() ? 'dark' : 'light'); });
```

`isBrowser` is `false` in any Node-like runtime including Bun and Deno, and stays `false` inside `renderForHydration` calls made from those runtimes. It is `true` only inside an actual browser document.

## DevTools

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

## Loading state

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

## Reactive pitfalls

Most of these are caught at lint time by [`kensington-eslint-plugin`](https://www.npmjs.com/package/kensington-eslint-plugin) v0.5.0+ at the `strict` tier, chained with `kensington-check-reactive` for cross-file coverage. See the root `AGENTS.md` → Recommended packages for the canonical install. The condensed form:

```bash
npm install --save-dev 'kensington-eslint-plugin@^0.5.0'
```

```javascript
// eslint.config.js
import kensington from 'kensington-eslint-plugin';

export default [
  kensington.configs.strict,             // mandatory for new projects
];
```

```json
"scripts": { "lint": "eslint . && kensington-check-reactive src --quiet" }
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

### Nested computed and transform without a key

An unkeyed `computed()` or `.transform()` call inside a `computed` or `transform` callback creates a new derived signal on every outer re-run. That is fine when the inner value is consumed inline by an attribute, class, text, or prop slot. Those consumers are internal binding effects; they tear down and rebuild alongside the inner, so no identity is leaked and the warning stays silent.

The `computed-in-computed` / `transform-in-computed` warning fires only when a **user-code subscriber** attaches to the inner. That means a user `effect(() => inner.get())`, or a user `computed(() => ...inner.get()...)` that reads it. In those cases the outer's re-run tears down the inner and creates a fresh one, but the user subscriber is still attached to the dead reference (or must resubscribe to the new one). Pass a stable key so the same inner is reused across re-runs and the user subscription stays valid.

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
// the object. mapWithKey keeps the same tag instance per id, so the same signal
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
