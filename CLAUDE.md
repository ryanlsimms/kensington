# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests (ESM, CJS, TypeScript types, browser, CLI)
npm test

# Individual suites
npm run test-esm      # ESM unit tests
npm run test-cjs      # CJS unit tests
npm run test-ts       # TypeScript type-checking (tsc --noEmit)
npm run test-browser  # Playwright browser tests
npm run test-cli      # html-to-kensington CLI integration tests

# Start dev server for manual browser testing
npm run dom-server

# Regenerate esm/kensington.js, esm/attributes.js, types.d.ts, cjs/, and dist/ from spec data
# Also lints the generated output — if the generator templates produce invalid JS, this fails
npm run build

# Lint the whole project
npm run lint

# Build only the browser dist bundle (dist/kensington.js and dist/kensington.min.js)
npm run build-browser

# Fetch latest HTML/SVG/MathML spec data (without rebuilding)
npm run fetch

# Fetch latest spec data AND regenerate all files
npm run fetch-and-build
```

To run a single test: Node's built-in runner doesn't support filtering by name via the CLI; use `it.only()` temporarily.

## Writing style

- Use American English spellings in all text: comments, docs, README, changelogs.
- Never use em dashes. Use a period and a new sentence instead.
- Never use `label: value` colon patterns in prose. Use a period and a new sentence instead.

## Releasing

```bash
# Stable release (from master — 0.x line)
scripts/release.sh patch
scripts/release.sh minor
scripts/release.sh major

# 1.0 release (from next branch)
scripts/release.sh major
```

`release.sh` requires a clean working tree. If `CHANGELOG.md` has an `## [Unreleased]` section, it is stamped with the new version and date. It bumps the version, stamps the changelog, commits, tags, pushes, and creates a GitHub release.

**Branches**: `master` is the 0.x stable line. `next` is the 1.0 line. `signals` is the 2.0 line, published under the `signals` dist-tag. Cherry-pick fixes from `master` → `next` as needed. Never merge `signals` into `next`.

## Architecture

Kensington is an HTML template library that generates HTML strings (or DOM elements) via nested method calls on a `Kensington` class instance.

### Generated vs. hand-written files

**`esm/kensington.js` and `esm/attributes.js` are generated** — do not edit them directly. They are produced by `generate/bin/write-code-files.js` from:
- `generate/fetched-data/{html,svg,math}.json` — spec data (fetched from HTML/SVG/MathML living standards)
- `@webref/css` (npm, runtime) — CSS property and type syntax; used by `generate/parse-css-property-types.js` to derive TypeScript types and attribute validator values for SVG presentation attributes and CSS-sourced HTML element attributes
- `@webref/idl` (npm, runtime) — WebIDL interface definitions; used by `generate/parse-idl-types.js` as a last-resort type fallback for attributes not typed by the HTML spec or CSS data
- `generate/build-javascript.js` — template that emits the class body and attribute exports
- `generate/build-declarations.js` — template that emits `types.d.ts`
- `generate/parse-data.js` — normalizes spec data into the shape the builders expect
- `generate/parse-css-property-types.js` — derives `{ value, type }` entries from `@webref/css` property syntax; resolves named type references and property references to extract keyword enums or numeric types
- `generate/parse-idl-types.js` — derives `{ value, type }` entries from `@webref/idl` interface attribute types (boolean, integer, float IDL types map to Boolean/Number/[Number,String])

**`cjs/` is entirely generated** via Rollup from `esm/`. The `esm/` directory is the authoritative source.

### Hand-written source (`esm/`)

- `esm/index.js` — package entry point; re-exports `Kensington`, `t`, `signal()`, `computed`, and `effect`
- `esm/tag-classes/content-tag.js` — base class for all HTML/SVG/MathML elements; handles attribute validation, content normalization, indentation, string serialization (`toString()`), and DOM creation (`toElement()`). `attributeValueIsValid` accepts `Signal` instances unconditionally — the actual value is only resolved at render time. `validateContent()` filters invalid items and reports via `showInvalid` (same `'off'`/`'warn'`/`'error'` contract as attribute validation — no unconditional throws). `toElement({ persist? })` collects cleanup functions from every signal attribute effect and signal content effect, then registers the element with `dom-tracker.js`. Without `persist`, removal calls `eff.stop()` (permanent); with `persist`, removal calls `eff.pause()` (temporary). When `persist: true` is passed, `toElement()` also collects the effect objects themselves into a `resumables` array; on each reconnection the connect callback calls `eff.resume()` on each and wires the pauses back into the new stop chain so effects pause on removal and resume on re-insertion across unlimited cycles. `persist` is independent of `addConnectedCallback` — an element can pause/resume effects without any connected callbacks. The `prop` key is extracted from `options.attributes` in the constructor and stored in `this.prop`; `attributeIsValid` and `attributeValueIsValid` both accept `prop` (like `on`) so it is not flagged as an unknown attribute when validation runs. `toElement()` processes `this.prop` via direct property assignment (`el[name] = value`), validating existence and writability on the live element before assigning. `attributesArrayFromObject` skips `prop` (alongside `on`) so it never appears in the HTML attribute pipeline.
- `esm/tag-classes/void-tag.js` — subclass for void elements (no closing tag, no content)
- `esm/tag-classes/literal-tag.js` — wraps raw HTML strings passed via `.literal()` / `.unsafeLiteral()`; accepts a `Signal` — `toElement()` re-parses and replaces the element on each change. Constructed with `safe`, `validationLevel`, and `logger` from the Kensington instance. `toString()` and `toElement()` run the type check and (when `safe`) the `<script>` check via `showInvalid` — invalid input renders nothing at `'off'`, logs at `'warn'`, throws at `'error'`. The signal effect is registered with `dom-tracker` via `trackForStop(startAnchor, ...)` so it stops when the surrounding subtree is removed. The `WeakRef` to the anchors is a secondary safety net for the case where the anchors are GC'd before the tracker sees the removal.
- `esm/tag-classes/comment-tag.js` — wraps HTML comments created via `.inlineComment()`; accepts a `Signal` — `toElement()` updates `nodeValue` in place on each change. Constructed with `validationLevel` and `logger`. The `_normalize(raw)` helper checks the type and strips `--` sequences via `showInvalid`; it runs in both `toString()` and `toElement()` including on every signal update.
- `esm/tag-classes/html-with-doctype-tag.js` — subclass for `.htmlWithDocType()` that prepends `<!DOCTYPE html>`
- `esm/lib/reactive/signal.js` — `Signal` class with `.get()`, `.value`, `.set()`, `.stop()`, `.transform()`, `.toJSON()`, and `.toString()`; exports `computed(fn)` and `effect(fn)`. **Under `ssrDepth > 0`, both `effect()` and `computed()` skip subscription tracking.** `effect()` returns a no-op stub. `computed()` runs `fn()` once to populate the value (no `currentEffect` is set, so `.get()` reads do not register) and returns a frozen-value signal — this prevents per-request `computed`/`transform` calls from leaking subscribers onto module-level signals that outlive the request. `Signal.stop()` clears all subscribers. Computed signals also expose `.stop()` via a `WeakMap` that tears down the derived computation. `effect` returns `{ pause(), resume(), stop() }` — `pause()` temporarily unsubscribes without destroying the effect; `resume()` re-runs the callback and re-establishes all signal subscriptions (no-op if `stop()` was called); `stop()` permanently destroys the effect and prevents future `resume()` calls. Both `effect` and `computed` clean up stale subscriptions between runs. `effect` runs are deferred via `queueMicrotask` so multiple synchronous `set()` calls batch into one re-run. `computed` updates remain synchronous. Errors thrown inside an `effect` callback during a batched flush are caught and re-surfaced via `queueMicrotask` so they don't abort other effects in the same batch. `.transform(fn)` is implemented as `computed(() => fn(this.get()))` and is defined as a prototype assignment after `computed` to avoid a forward reference — it correctly tracks all signals read inside `fn`, not just the source. `.value` is a getter that returns `this.#value` directly without registering a subscription. Use it inside `computed` or `effect` when you need the current value but do not want to create a dependency. `.toJSON()` also returns `this.#value` directly (no tracking side effect) so signals are transparent to `JSON.stringify`. `.toString()` calls `this.get()` so template literal coercion tracks dependencies in reactive contexts. Computed signals auto-dispose: when a computed's last subscriber is removed, it enters a sleeping state — it unsubscribes from all source signals and freezes its value. When a new subscriber reads it inside a reactive context (`effect` or another `computed`), it wakes: re-runs `fn()`, re-subscribes to sources, and returns a fresh value. A `sleeping` flag distinguishes "newly created with no subscribers yet" (still active) from "had subscribers and lost them" (dormant), so the first `.get()` inside an effect on a fresh computed does not trigger a spurious wake. Direct `.get()` calls outside a reactive context return the last frozen value while sleeping. Auto-dispose replaces the previous explicit `currentEffect._cleanups.push(() => s.stop())` pattern for computeds created inside effects — when the parent effect re-runs and clears its subscriptions, the inner computed auto-sleeps and releases its source subscriptions automatically.
- `esm/lib/reactive/dom-tracker.js` — shared `MutationObserver` that stops signal effects when their host element is removed from the DOM. A single observer on `document.documentElement` handles both direct removal and ancestor removal. `trackForStop(element, stop)` registers an element; the observer calls `stop()` when the element or any of its ancestors is removed. `stopTracked(element)` stops and deregisters an element's effects immediately — used by `syncNode` in `reconcile.js` to clean up orphaned effects on discarded fresh nodes. `isTracked(element)` returns whether an element has registered effects. `markContentTracked(element)` / `isContentTracked(element)` flag elements that hold signal content anchors (comment node pairs held in effect closures) so `syncNode` skips child patching on them. Used by `ContentTag.toElement()` to wire cleanup automatically. Entries are stored in a `WeakMap` keyed by element so an element passed to `toElement()` and then dropped without ever being inserted into the document is not pinned by this module — a parallel `Set<WeakRef<Element>>` (`trackedRefs`) supports the iteration in `visit()`, and a `FinalizationRegistry` removes dead WeakRefs as their elements are collected.
- `esm/lib/reactive/reconcile.js` — DOM reconciler for signal arrays; matches nodes by `data-key` attribute for efficient reordering, addition, and removal. **Snapshot fast path**: a `WeakMap` keyed by DOM node holds the last `(attributes, content)` pair that produced it. On the next render, `snapshotMatches` runs `valueEqual` against the new tag; on a match, `itemToNode` and `syncNode` are skipped entirely and the existing node is reused. `valueEqual` compares plain objects and arrays structurally, recurses into `ContentTag` instances (matching by `tagName` + attributes + content), and falls back to reference equality for everything else (functions, `Signal`, `LiteralTag`, `CommentTag`, DOM nodes, `Date`, anything with a non-plain prototype). The snapshot is recorded only on the non-fast-path branch, so an item that keeps hitting the fast path retains its original snapshot indefinitely. The `ContentTag` import here forms a known benign circular dependency with `content-tag.js`; both sides use the other only inside function bodies at call time, so ESM live bindings resolve correctly. Rollup emits a CIRCULAR_DEPENDENCY warning that is informational only. `syncNode` performs a full recursive positional diff on reused keyed nodes when the fast path declines: attributes are patched in place, children are diffed recursively. Two guards prevent incorrect patching: `isTracked(existing)` skips attribute removal (signal-managed attributes on `existing` are applied by deferred effects and won't appear on the fresh element yet); `isContentTracked(existing)` skips child patching entirely (signal content uses comment anchor pairs held in effect closures — replacing them would break the live content tracking). `stopTracked(fresh)` is called before returning `existing` to clean up any signal effects that were queued for the discarded fresh node.
- `esm/lib/` — utilities: attribute string/array builders, indentation, content stringification, `he` encoder wrapper, camelCase↔kebab-case conversion

### Error policy

**Never throw when `validationLevel` is `'off'`.** Production deployments run with `'off'` for performance. An unexpected throw can take down a server or break a user-facing page. Invalid input at `'off'` level must be silently skipped — render nothing, omit the attribute, filter the content item — rather than crashing. Use `showInvalid(message, this.validationLevel, this.logger)` for every validation check: it does nothing at `'off'`, logs at `'warn'`, and throws at `'error'`. The only exceptions are hard invariants that indicate a programming error at library setup time (e.g. an invalid `validationLevel` value passed to the constructor, a non-string `tagName` passed to `createCustomTag`) — those throw unconditionally because they can only be caused by incorrect integration code, not by runtime data.

### Tag creation flow

`Kensington.createTag(tagName, allowedAttributes, Klass, options)` returns a closure. When called, that closure validates arguments, instantiates the appropriate tag class (`ContentTag`, `VoidTag`, etc.), runs attribute validation if `validationLevel !== 'off'`, and returns the instance. Tag methods are bound in the constructor so they can be destructured.

### Options handling

- Nested objects flatten to kebab-case: `{ data: { bs: { toggle: 'collapse' } } }` → `data-bs-toggle="collapse"`
- camelCase keys convert to kebab-case: `{ dataBsToggle: 'collapse' }` → `data-bs-toggle="collapse"`
- Boolean attributes are included when `true`, omitted when `false`
- `style` accepts a plain object: `{ style: { backgroundColor: 'red', zIndex: 2 } }` → `style="background-color: red; z-index: 2"`. camelCase keys are converted to kebab-case (CSS property names are always kebab-case; camelCase is only the JS DOM convention for `element.style` properties — this applies to SVG styles too); `null`/`undefined`/`false` values are silently omitted; other non-string/number values are flagged by validation.
- `data-*` and `aria-*` namespaces are always allowed; additional namespaces (e.g. `hx` for htmx) are passed via constructor
- SVG elements accept all CSS properties as presentation attributes (per the SVG spec). In `esm/attributes.js` a single `svgPresentationAttributes` export object is spread into each SVG element's attribute object to avoid duplicating ~744 entries per element. In `types.d.ts` a single `SvgPresentationAttributes` type is intersected into each SVG element's attribute type for the same reason.
- Event handler attributes (`onclick`, `oninput`, and all `on*`) accept `[String, Function]`. Functions are valid at tag creation and wired via `addEventListener` in `toElement()`. In `toString()`, function values cannot be serialized — they are omitted, with the `handleFunctionValues` callback in `attributesStringFromObject` invoking `showInvalid` at that point rather than at creation time.
- `prop` key: accepts a plain object mapping DOM property names to static values or signals. Applied in `toElement()` via `el[name] = value` (property assignment, not `setAttribute`). Property existence and writability are checked against the live element at render time via `isPropWritable()`. Silently ignored in `toString()`. TypeScript types are derived from `HTMLElementTagNameMap`/`SVGElementTagNameMap` via the `PropFor<Tag>` utility type in `types.d.ts`. Known writable properties are typed against the element's DOM interface. Arbitrary string keys (expandos) are also accepted via an index signature (`{ [key: string]: unknown }`).

### CLI — html-to-kensington

`bin/html-to-kensington.js` is the `kensington` binary (set in `package.json` `"bin"`). It reads HTML from a file argument, stdin (pipe/redirect), or interactive terminal paste using bracketed paste mode, then converts it to Kensington code via `bin/lib/convert-html.js`.

- `bin/lib/convert-html.js` — top-level converter; uses `parse5` to parse HTML/fragments, then delegates per-node to `node-to-code.js`
- `bin/lib/node-to-code.js` — converts a single parse5 node to a Kensington method call string
- `bin/lib/attrs-to-code.js` — converts a parse5 attribute list to a JS object literal string; groups `data-*`/`aria-*` prefixes, expands `style`, converts kebab-case to camelCase
- `bin/lib/formatter.js` — detects ESLint or Prettier in the cwd; reads `max-len`/`printWidth` for line-breaking and runs the formatter over the output
- `bin/lib/read-html.js` — reads HTML from stdin (TTY: bracketed paste mode; non-TTY: stream)
- `bin/lib/clipboard.js` — copies output to the system clipboard (`--copy` flag)

### Testing setup

Each test subdirectory has its own `package.json` and a `node_modules/kensington` symlink to the project root so `import/require('kensington')` resolves locally without a global `npm link`.

- `tests/esm/` — ESM unit tests (`node:test`)
- `tests/cjs/` — CJS unit tests (`node:test`, `"type": "commonjs"`)
- `tests/typescript/` — TypeScript type tests (`tsc --noEmit`)
- `tests/browser/` — Playwright end-to-end tests; a local server serves pages from `tests/browser/pages/`
- `tests/html-to-kensington-test.js` — CLI integration tests (`node:test`); spawns the CLI via `spawnSync` with piped stdin, including ESLint and Prettier formatting tests using temp directories
