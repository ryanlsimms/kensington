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
    void-tag.js               Self-closing tags (br, img, input). No content, no closing tag
    html-with-doctype-tag.js  <html> wrapper that prepends <!DOCTYPE html> on toString
    literal-tag.js            Raw HTML string (.literal() / .unsafeLiteral()). Re-parses on signal change
    comment-tag.js            Inline HTML comments (.inlineComment()). Strips `--` and updates nodeValue on signal change
  lib/
    reactive/                 Signals + DOM lifecycle. The reactive runtime
      signal.js               Signal class, signal(), computed(), effect(). Microtask batching, SSR mode counter
      lifecycle.js            Per-element effect/callback orchestrator. Owns the persist mechanism end-to-end
      dom-tracker.js          Shared MutationObserver. Stops effects on removal, fires connect callbacks on insertion
      reconcile.js            Array reconciler. Keyed by data-key. Recursive node patching with tracker-aware guards
    render/                   Turning tag instances into output (HTML strings or DOM elements)
      validate.js             Attribute name and value checks. Uses showInvalid for the on/warn/error contract
      serialize.js            toString() pipeline. Short-content fast path, indentation, literal handling, encoding
      attributes.js           Attribute object → array of [name, value] pairs and → serialized string. Nested namespaces, class arrays, style objects
      stringify-content-array.js  Joins tag/literal/string/Signal children for the toString() multi-line path
      hydration.js            Server-side render (renderForHydration) and browser-side rehydration (registerComponents)
    util/                     Small generic helpers with no dependencies on reactive/ or render/
      he.js                   Wrapper over the `he` HTML-encoder package
      indent.js               Indents a multi-line string by N spaces
      show-invalid.js         The single validation entry point. off → no-op, warn → logger, error → throw
      text-utils.js           camelCase ↔ kebab-case, preserveSpaces, line-break regexes, getAttrName
      style-utils.js          Plain object → CSS string. camelCase keys, drops null/undefined/false
      get-prototype-methods.js  Walks the prototype chain to bind every tag method in the Kensington constructor
generate/                     Code generation. Reads spec data, emits esm/kensington.js, attributes.js, types.d.ts, dist/, cjs/
  bin/                        Scripts. write-code-files.js (build), fetch-all.js (refresh spec data)
  fetched-data/               Cached HTML/SVG/MathML spec data (committed)
  build-kensington.js         Template that emits the Kensington class body
  build-declarations.js       Template that emits types.d.ts
  parse-data.js               Normalizes spec data
  parse-css-property-types.js  Derives types from @webref/css
  parse-idl-types.js          Last-resort type fallback from @webref/idl
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
3. Creates a `Lifecycle` (`reactive/lifecycle.js`).
4. For each attribute: plain value → `setAttribute`. Signal value → `lifecycle.signalEffect(sig, apply)`. Function value matching `^on[a-z]` → `addEventListener`.
5. For each entry in the `on` events object: → `addEventListener`.
6. For each prop in the `prop` object: plain → property assignment. Signal → `lifecycle.signalEffect`.
7. For each content item: tag → recurse into its `toElement()`. Signal → comment anchor pair + `lifecycle.signalEffect` that calls `reconcile`. Plain → text node.
8. `lifecycle.finalize({ connectCallbacks, disconnectCallbacks, onCleared, onReconnect })` registers the stop chain with `dom-tracker`, wires the persist rebuild if needed, and sets up the connect callback path.
9. Returns the element.

## Where things live

| If you're working on…                              | Look at…                                              |
| -------------------------------------------------- | ----------------------------------------------------- |
| The reactive system (signals, effects, computed)   | `lib/reactive/signal.js`                              |
| When effects stop or pause (DOM lifecycle)         | `lib/reactive/lifecycle.js` + `lib/reactive/dom-tracker.js` |
| Signal-array rendering and keyed reconciliation    | `lib/reactive/reconcile.js`                           |
| Attribute validation rules                         | `lib/render/validate.js`                              |
| HTML string output                                 | `lib/render/serialize.js`                             |
| Attribute object → string/array conversion         | `lib/render/attributes.js`                            |
| SSR and rehydration                                | `lib/render/hydration.js`                             |
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
- **`reconcile.js` uses two guards.** `isTracked(existing)` skips attribute removal on signal-managed elements. `isContentTracked(existing)` skips child patching on elements that hold signal-content comment anchors.
- **`.value` and `.toJSON()` do NOT subscribe.** Only `.get()` and `.toString()` register reactive dependencies. This is intentional — see the docstring in `signal.js`.
