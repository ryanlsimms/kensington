# Architecture

A map of the source tree for contributors. For commands and the high-level project description see `CLAUDE.md` and `README.md`.

## Source layout

```
esm/                          ESM source (the authoritative one — cjs/ and dist/ are generated)
  index.js                    Package entry. Exports Kensington, t, signal, computed, effect, hydration helpers
  kensington.js               GENERATED — the Kensington class with every tag as a method
  attributes.js               GENERATED — per-element attribute spec maps
  tag-classes/                The classes that an element instance can be
    content-tag.js            Default tag. Holds attributes, content, lifecycle callbacks. toString() and toElement()
    void-tag.js                Self-closing tags (br, img, input). No content, no closing tag
    html-with-doctype-tag.js  <html> wrapper that prepends <!DOCTYPE html> on toString
    literal-tag.js             Raw HTML string (.literal() / .unsafeLiteral()). Re-parses on signal change
    comment-tag.js             Inline HTML comments (.inlineComment()). Strips `--` and updates nodeValue on signal change
  lib/
    reactive/                 Signals + DOM lifecycle. The reactive runtime
      signal.js               Signal class, signal(), computed(), effect(). Microtask batching, SSR mode counter. Reactive loop guards: per-effect run counter (sync) and flush counter (async). Warns on same-run read/write and .set() inside computed
      lifecycle.js            Per-element effect/callback orchestrator. Owns the persist mechanism end-to-end
      dom-tracker.js          Shared MutationObserver. Stops effects on removal, fires connect callbacks on insertion
      reconcile.js            Array reconciler. Keyed by an internal `_kensingtonKey` property stamped on tags by `map-with-key.js`. Reuses cached tag instances per key. Calls stopRemoved synchronously on removed nodes so effects stop before the MutationObserver fires
      map-with-key.js         Keyed list rendering. A key whose mapFn read no signal caches a plain tag forever; a key whose mapFn did read a signal is upgraded to a computed kept alive by a permanent-subscriber effect so the outer render's own reads can't let it sleep between renders
      warnings.js             Throttled console.error/warn helpers (loop detection, invalid usage, duplicate keys) shared by signal.js and map-with-key.js
      ssr.js                  SSR mode counter. effect()/computed() become no-ops/frozen values while renderForHydration runs, so per-request rendering can't leak subscribers onto module-level signals
      hydration-scope.js      Per-mount signal/computed registries used by HMR and SSR hydration. Not swept per render; disposed only when the mount is removed
      devtools.js             window.__KENSINGTON_DEVTOOLS__ hook (signals/effects/bindings maps, event bus). Every notify call is a no-op unless devtools are enabled
      preserve-state.js       captureState/restoreState. Focus + selection, scroll position, form control values. Used by reconcile's rebuildNode (mapWithKey re-emits a fresh tag) and by HMR's hot-swap
    render/                   Turning tag instances into output (HTML strings or DOM elements)
      validate.js             Attribute name and value checks. Uses showInvalid for the on/warn/error contract
      serialize.js            toString() pipeline. Short-content fast path, indentation, literal handling, encoding
      attributes.js           Attribute object → array of [name, value] pairs and → serialized string. Nested namespaces, class arrays, style objects
      stringify-content-array.js  Joins tag/literal/string/Signal children for the toString() multi-line path
      hydration.js            Server-side render (renderForHydration), browser-side rehydration (registerComponents), and HMR (__kInstrument, hmrReplaceComponent, liveInstances registry)
    util/                     Small generic helpers with no dependencies on reactive/ or render/
      he.js                   Wrapper over the `he` HTML-encoder package
      indent.js               Indents a multi-line string by N spaces
      show-invalid.js         The single validation entry point. off → no-op, warn → logger, error → throw
      text-utils.js           camelCase ↔ kebab-case, preserveSpaces, line-break regexes, getAttrName
      style-utils.js          Plain object → CSS string. camelCase keys, drops null/undefined/false
      get-prototype-methods.js  Walks the prototype chain to bind every tag method in the Kensington constructor
      filter-stack.js         Strips kensington-internal frames from warning/error stacks so they point at caller code. Falls back to the unfiltered stack in browser bundles, where library and user code share one URL and frames can't be told apart
  vite/                       The kensington/vite subpath export. Vite plugin for component HMR
    index.js                  kensingtonHmr({ include }). apply: 'serve' only. Lazy-loads optional peer deps (acorn, magic-string). Rewrites matched files to wrap exports with __kInstrument and appends import.meta.hot.accept blocks calling hmrReplaceComponent
  live/                       The kensington/live subpath. A small server/client runtime for signals shared across browsers
    index.js                  Unified entry: liveSignal, connectLive, liveServer
    client.js                 WebSocket transport (connectLive). Reconnect/backoff, write buffering, CAS retry loop
    server.js                 Server handle (liveServer). Registry, Lamport clock, broadcast, canRead/canWrite policy
    state.js                  Module-level transport registry. Placeholder signals (pre-transport) that get transparently upgraded in place once a transport connects
    protocol.js               Wire message constants (MSG_SET, MSG_SET_OK, MSG_SET_FAIL, ...), encode/decode, shape guards. Lamport last-write-wins
    persistence/
      memory.js                Synchronous in-memory adapter
      sqlite.js                Lazy-loads better-sqlite3; debounces writes to coalesce bursts into single transactions
    warn.js                   Once-per-name console.warn helpers for conflicting persist/initial-value declarations
    constants.js               DEFAULT_LIVE_PATH
generate/                     Code generation. Reads spec data, emits esm/kensington.js, attributes.js, tag-info.js, types.d.ts, attributes.d.ts, bin/lib/svg-element-case.js
  bin/
    write-code-files.js       The build entry point (npm run build). Fetches @webref/css and @webref/idl, parses spec data, runs every builder below, writes esm/, cjs/, dist/
    fetch-all.js              Refreshes generate/fetched-data/*.json from the HTML/SVG/MathML living standards (npm run fetch)
    build-browser.js          Rolls up esm/ into the dist/ browser bundles (full, slim, devtools, plus minified variants) via Rollup
    build-cjs.js              Rolls up esm/ into cjs/ via Rollup
  fetched-data/                Cached HTML/SVG/MathML spec data (committed)
  build-kensington.js          Template that emits the Kensington class body (esm/kensington.js)
  build-attributes.js          Template that emits the per-element attribute spec maps (esm/attributes.js)
  build-attributes-declarations.js  Template that emits attributes.d.ts
  build-declarations.js        Template that emits types.d.ts
  build-svg-element-case.js    Template that emits bin/lib/svg-element-case.js (SVG tag-name casing lookup for the CLI)
  build-tag-info.js            Template that emits esm/tag-info.js (tag name → [tag name, tag type] map used by the slim Proxy build)
  parse-data.js                Normalizes spec data into the shape the builders expect
  parse-css-property-types.js  Derives `{ value, type }` entries from @webref/css property syntax; used for SVG presentation attributes and CSS-sourced HTML attributes
  parse-idl-types.js           Last-resort type fallback from @webref/idl for attributes not typed by the HTML spec or CSS data
bin/                          The kensington CLI (html-to-kensington). Independent of esm/ — does not share code
  html-to-kensington.js       Entry. Reads HTML, calls convert-html.js, formats, prints or writes
  lib/                        CLI internals (parse5 → Kensington calls, ESLint/Prettier integration, clipboard)
tests/
  esm/                        Unit tests against esm/ (node:test)
  cjs/                        Unit tests against cjs/ (node:test, type=commonjs)
  typescript/                 Type tests (tsc --noEmit)
  browser/                    Playwright tests
  html-to-kensington-test.js  CLI integration tests
docs/                         The hand-written documentation site
```

## Data flow

A user calls `t.div(...)`. That call chain:

1. `t.div(opts, content)` is a closure made by `Kensington.createTag` (in `kensington.js`).
2. The closure constructs a `ContentTag` (or `VoidTag` etc.) from `tag-classes/`.
3. `ContentTag` constructor calls `collectContent(items)` to flatten nested arrays and strip falsy items.
4. `createTag` runs `tag.validate()` if `validationLevel !== 'off'`. The body lives in `render/validate.js`, which calls `attributeIsValid` and `attributeValueIsValid` for each attribute, then `validateAttributeByType` against the spec map.
5. The tag instance is returned. It now sits in memory waiting for `toString()` or `toElement()` to be called.

### `toString()`

1. `validateContent()` filters non-renderable items.
2. `render/serialize.js#renderToString` opens the tag, calls `attributeString(tag)` (which calls `render/attributes.js#attributesStringFromObject`), then writes content.
3. Three content paths: literal (script/style), short single-line, or multi-line via `stringifyContentArray` + `indent`.
4. Closes the tag and returns the string.

### `toElement()`

1. `validateContent()` filters non-renderable items.
2. Creates the DOM element (with or without namespace).
3. Creates a `Lifecycle` (`reactive/lifecycle.js`), lazily, on first signal binding — a fully static tag never allocates one.
4. For each attribute: plain value → `setAttribute`. Signal value → `lifecycle.signalEffect(sig, apply, label)`. Function value matching `^on[a-z]` → `addEventListener`.
5. For each entry in the `on` events object: → `addEventListener`.
6. For each prop in the `prop` object: plain → property assignment (`el[name] = value`, checked for existence/writability against the live element, never a `setAttribute`). Signal → `lifecycle.signalEffect`.
7. For each content item: tag → recurse into its `toElement()`. Signal → comment anchor pair + `lifecycle.signalEffect` that calls `reconcile`. Plain → text node.
8. `lifecycle.finalize({ connectCallbacks, disconnectCallbacks, onCleared, onReconnect })` registers the stop chain with `dom-tracker`, wires the persist rebuild if needed, and sets up the connect callback path.
9. Returns the element.

Re-calling `toElement()` on a tag that already built a node reuses that node in most cases; see the cache-check invariant below for the exact rules.

## HMR

`kensington/vite`'s `kensingtonHmr({ include })` plugin (`esm/vite/index.js`) parses each matched component file to an AST and rewrites every top-level component export to flow through `__kInstrument(name, fn)`, then appends an `import.meta.hot.accept` block that calls `hmrReplaceComponent(name, mod.<access>.__kFn)` on save. `include` accepts a glob string, an array of globs, or a callback `(server) => string | string[] | null` (used by adapters that read globs from late-binding runtime config). It only runs while Vite serves (`apply: 'serve'`); production builds skip the transform entirely. `acorn` and `magic-string` are optional peer deps, loaded lazily so installing kensington without them stays harmless.

`__kInstrument` (in `esm/lib/render/hydration.js`) wraps a component so that a client-side call enters a hydration scope keyed by a fresh mount id, calls the original function, and stamps the returned element with `data-k-mount-target=<mountId>`, recording the live instance (`{ mountId, mountNodes, fn, state }`) in a module-level map. SSR (`isSSRMode()`) and re-entrant calls (`_inHydrationScope()`) skip instrumentation. `registerComponents` (the SSR-hydration entry point) records live instances the same way, so hot-swap behaves uniformly whether a component was server-rendered or mounted client-only.

`hmrReplaceComponent(name, newFn)` walks every live instance under that name: it captures user-visible DOM state (`preserve-state.js#captureState`), re-renders inside the *same* hydration scope — so keyed `signal`/`computed` instances are reused rather than recreated and their values survive the swap — replaces the live nodes in place, and restores the captured state. Disconnected instances are pruned and their hydration scopes disposed via `_disposeHydrationScope`; effects on the discarded DOM are stopped automatically by `dom-tracker`'s `MutationObserver`.

## Live signals

`kensington/live` lets one named `Signal` synchronize across browser tabs and clients. `liveServer(opts)` (`esm/live/server.js`) owns the authoritative value and a Lamport clock per name, a `canRead`/`canWrite` policy, and an optional persistence adapter (`persistence/memory.js` or `persistence/sqlite.js`, both `get`/`set`/`delete`/`entries`/`close`). `attach(httpServer)` wires a `ws` `WebSocketServer` with ping/pong heartbeat. Outbound broadcasts are coalesced per microtask into a single `MSG_BATCH_UPDATE` when more than one name changes in the same tick. Names declared `persist: false` are dropped from the registry 30 seconds after every subscriber (client or server-side observer) is gone.

`connectLive(opts)` (`esm/live/client.js`) is a single WebSocket-per-tab transport with exponential-backoff reconnect and outbound write buffering while disconnected. `sig.set(fn)` goes through a CAS retry loop (`casUpdate`, re-running the updater against the server's authoritative value on conflict); `sig.set(value)` is a direct write. Both return a `Promise` that resolves on `MSG_SET_OK` and rejects with a `LiveSetRejected` error on `MSG_SET_FAIL` (conflict, policy, or unserializable value), rolling the local signal back to the server's authoritative value first.

`liveSignal(initial, name)` (`esm/live/state.js`) returns a real registry-backed signal once a transport is registered. Called before that — e.g. at module scope, before `connectLive` runs — it returns a placeholder tagged `_isLivePlaceholder` that is transparently upgraded in place the moment a transport registers, so `export const x = liveSignal(0, 'x')` works regardless of import order. **`live.delete(name)` on the server is registry cleanup only.** It does not call `_setFromRemote` on cached subscribers and does not broadcast; existing subscribers keep their last value. Use `live.set(name, null)` when subscribers must observe a removal.

## Where things live

| If you're working on…                              | Look at…                                              |
| -------------------------------------------------- | ----------------------------------------------------- |
| The reactive system (signals, effects, computed)   | `lib/reactive/signal.js`                              |
| When effects stop or pause (DOM lifecycle)         | `lib/reactive/lifecycle.js` + `lib/reactive/dom-tracker.js` |
| Signal-array rendering and keyed reconciliation    | `lib/reactive/reconcile.js`                           |
| Keyed list rendering perf model (static vs. reactive rows) | `lib/reactive/map-with-key.js`                |
| Attribute validation rules                         | `lib/render/validate.js`                              |
| HTML string output                                 | `lib/render/serialize.js`                             |
| Attribute object → string/array conversion         | `lib/render/attributes.js`                            |
| SSR and rehydration                                | `lib/render/hydration.js`                             |
| Component HMR runtime                              | `lib/render/hydration.js` (`__kInstrument`, `hmrReplaceComponent`, `liveInstances`) |
| Vite plugin that rewrites component exports        | `esm/vite/index.js`                                   |
| Per-mount keyed signal/computed scopes for HMR     | `lib/reactive/hydration-scope.js`                     |
| Cross-browser synced signals ("live signals")      | `live/` (`server.js` for the server handle, `client.js` for the transport, `state.js` for `liveSignal`) |
| HTML entity encoding                               | `lib/util/he.js`                                      |
| The on/warn/error validation contract              | `lib/util/show-invalid.js`                            |
| A new tag-class flavor                             | `tag-classes/`                                        |
| How tags become methods on the Kensington class    | `generate/build-kensington.js` (template)             |
| Type declarations                                  | `generate/build-declarations.js` (template)           |
| The CLI converter                                  | `bin/`                                                |

## Invariants worth knowing

- **Generated files are not edited by hand.** `esm/kensington.js`, `esm/attributes.js`, `cjs/`, `dist/`, and `types.d.ts` are all output of `npm run build`.
- **`validationLevel: 'off'` must never throw.** All runtime validation goes through `showInvalid`, which silently skips at `'off'`. Hard invariants (bad constructor input) can still throw at the boundary.
- **`Signal` values are accepted everywhere a plain value is accepted.** `attributeValueIsValid` returns true for Signals unconditionally. Resolution happens at render time.
- **The `persist` mechanism lives entirely in `lifecycle.js`.** It pauses effects on removal and resumes them on reconnection, rebuilds the disconnect-callback chain on every cycle, and restores `#domElement` via the `onReconnect` callback. No other file should know about pause-vs-stop selection.
- **`reconcile.js` uses two patching guards and one removal guard.** `isTracked(existing)` skips attribute removal on signal-managed elements. `isContentTracked(existing)` skips child patching on elements that hold signal-content comment anchors. `stopRemoved` is called synchronously on every node the reconciler removes so effects stop immediately, before the MutationObserver fires.
- **`_reads` tracks which signals were read via `.get()` in the current reactive run.** `track()` resets the set at the start of each run. `Signal.set()` checks `currentEffect._reads` to warn on same-run read/write cycles, and checks `inComputedFn` to warn on writes inside a `computed()` body. Both are `console.error` warnings, not throws.
- **`.value` and `.toJSON()` do NOT subscribe.** Only `.get()` and `.toString()` register reactive dependencies. This is intentional — see the docstring in `signal.js`.
- **HMR is opt-in via the Vite plugin.** Importing `kensington` never pulls in `acorn` or `magic-string`. Those are optional peer deps and only load when `kensington/vite` is used. `__kInstrument` and `hmrReplaceComponent` are no-ops in SSR mode (`isSSRMode()`) and re-entrant calls (`_inHydrationScope()`), so production hot paths are unaffected.
- **Hydration scopes are not swept per render.** A `computed`'s keyed registry drops entries that weren't accessed on the latest run. Hydration scopes do NOT. They are tied to a mount id and disposed only when the mount is removed via `_disposeHydrationScope`. Re-rendering a component during a hot-swap intentionally keeps every keyed signal alive, even if the new module doesn't read it.
- **`ContentTag#toElement()`'s cache check has four branches, not a single yes/no.** A cached element still connected to the real DOM is returned as-is (flagged via `showInvalid`, since reusing a live node usually means the caller lost track of it). `persist: true` always returns the cached node with its effects paused rather than stopped. A disconnected node whose descendants have stale (permanently stopped) bindings is rebuilt from scratch. A disconnected node with no stale bindings is reused as-is. Skipping this check would let a static parent reuse a cached element whose signal-bearing descendants had their effects permanently stopped when they were removed.
- **`mapWithKey` only pays for reactivity when a row needs it.** The first render of a key runs `mapFn` under a probe (`_runMapWithKeyProbe`). If it read no signal, the tag is cached as a plain value and every later render is a `Map` lookup. If it did, the entry is upgraded to a `computed` wrapping `mapFn`, kept alive by a permanent-subscriber effect so the outer render's own `.get()` calls can't let the inner computed sleep between renders.
- **Live signals: `delete(name)` on the server does not notify anyone.** It only clears server-side registry/store/subscriber bookkeeping; existing subscribers (client or server-side cached signals) keep their last value. Use `live.set(name, null)` if subscribers must observe a removal.
- **`prop` values are applied via property assignment (`el[name] = value`), not `setAttribute`.** Existence and writability are checked against the live element at render time, and the key never appears in `toString()` output or the HTML attribute pipeline.
