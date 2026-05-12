# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- `additionalGlobalAttributes` constructor option. Accepts a plain object mapping attribute names to validator types (the same format used by `createCustomTag`). Attributes in this map are allowed on every element and validated against the provided type. camelCase keys are normalized to kebab-case.
- `kensington/attributes` named exports (`buttonAttributes`, `divAttributes`, etc.) are now documented as public API. Import them to extend a built-in element's attribute set via `createCustomTag`.
- `GlobalAttributes`, `GlobalEvents`, and `UniversalAttributes` are now exported types. Import them to annotate utility functions that accept attribute objects.
- Event handler attributes in `GlobalEvents` now use specific DOM event types (`MouseEvent`, `KeyboardEvent`, `FocusEvent`, etc.) instead of the generic `Event`.
- The `style` attribute type now accepts objects with kebab-case property names (e.g. `{ 'background-color': 'red' }`) in addition to camelCase. Mixed objects are also valid.

### Changed
- `literal()` and `inlineComment()` validation now respects `validationLevel` instead of always throwing. With the default `'off'` level, invalid input (non-string, `<script>` tags, `--` in comments) is silently ignored. Use `validationLevel: 'error'` to throw on invalid input.
- `UniversalAttributes` is now a type intersection (`GlobalAttributes & GlobalEvents & NameSpaceAttributes`) rather than a union. This is more correct: attribute objects satisfy all three simultaneously.

## [1.0.0-beta.0] - 2026-05-08

### Added
- Full API documentation site at `docs/index.html`.
- Overhauled README with usage examples and API reference.

## [0.15.4] - 2026-05-12

### Fixed
- Slim build: camelCase SVG attribute names (`viewBox`, `preserveAspectRatio`, `markerWidth`, etc.) are now preserved correctly. Previously they were incorrectly converted to kebab-case (`view-box`, `preserve-aspect-ratio`).

## [0.15.3] - 2026-05-09

### Changed
- SVG elements now accept all CSS properties as presentation attributes. The list is now derived from the `@webref/css` living standard (~744 properties), matching the SVG spec which permits any CSS property as a presentation attribute.
- TypeScript types for SVG presentation attributes are more specific. Types are derived from `@webref/css` syntax definitions.
- The `kensington/attributes` module and `types.d.ts` are significantly smaller. Shared SVG presentation attribute types are emitted once and intersected/spread into each SVG element type, rather than duplicated per element.

## [0.15.2] - 2026-05-07

### Fixed
- `false` in content arrays is now silently ignored, matching the documented behaviour for conditional content (`someCondition && t.span('...')`).
- `class` array values: falsy entries (`false`, `''`) are filtered out before joining. An all-falsy array omits the `class` attribute entirely, consistent with how an empty `style` object is handled.
- `literal()` now throws a clear error when passed a non-string argument, and the `<script>` tag check is now case-insensitive so `<SCRIPT>` is also rejected.
- `createCustomTag` attribute type specs now accept a string or number literal directly (e.g. `{ type: 'primary' }`) without incorrectly flagging it as an invalid type. String literals in arrays already worked; this makes the standalone form consistent.
- `toElement()` now detects a non-browser environment correctly (`typeof document === 'undefined'`) so it throws the intended custom message rather than a `ReferenceError`.
- A nested attribute object whose values are all falsy (e.g. `{ data: { key: null } }`) no longer produces a trailing space in the attribute string (`<div id="x" >` → `<div id="x">`).
- `isValidNamespaceAttribute` no longer throws a `TypeError` when an attribute name consists entirely of uppercase letters or starts with one (e.g. `{ ABC: 'value' }`); it now reports a normal validation error.
- `literal().toElement()` now returns a `DocumentFragment` instead of `firstChild`, so multi-root literals (`literal('<li>a</li><li>b</li>')`) append all nodes correctly instead of silently dropping all but the first.
- `inlineComment` normalises `\r\n` and lone `\r` line endings in the comment text before formatting, so they no longer appear verbatim in the output.
- `html-to-kensington`: grouped hyphenated attribute keys (e.g. `data-col-1`) are now quoted when they are not valid JS identifiers, preventing invalid output like `{ data: { col-1: "a" } }`.
- `html-to-kensington`: the `style` attribute converter now handles semicolons inside quoted CSS values (e.g. `content: "a;b"`) without splitting on them.
- `t.literal().toElement()` and `t.inlineComment().toElement()` now throw `"toElement only supported in browser"` in a non-browser environment instead of a bare `ReferenceError: document is not defined`.
- `t.script(Symbol(...))` and `t.style(Symbol(...))` no longer crash with a `TypeError` in the `contentIsLiteral` rendering path with `validationLevel: 'off'`; the Symbol is coerced to a string via `String()`.
- A null-prototype object (`Object.create(null)`) passed as an attribute value no longer crashes (`val.toString is not a function`). It is now treated as a nested attribute object (same as a plain `{}`) and flattened, or omitted if empty.
- A `Symbol`, plain object, or array as a `style` property value no longer crashes or silently produces invalid CSS (e.g. `color: [object Object]`). Such values are now omitted, consistent with how `null`/`false` are handled. The crash also occurred when `validationLevel: 'error'` tried to include the invalid value in its error message — the message now shows `color: Symbol(red)` rather than throwing.
- `toElement()` now wraps primitive content nodes in `String()` before passing to `document.createTextNode()`, preventing a browser crash when a `Symbol` value reaches the DOM path with `validationLevel: 'off'`.
- `Object.create(null)` (null-prototype object) passed as the first argument to a tag method is now correctly treated as the attributes object. Previously it threw `Cannot convert object to primitive value` because the plain-object check used `?.constructor === Object`, which evaluates to `undefined` on a null-prototype object. The check now uses `Object.getPrototypeOf`.
- An object with an own `constructor` property (e.g. `{ constructor: 'x', id: 'y' }`) is now correctly treated as attributes. Previously the own `constructor` property shadowed `Object.constructor`, causing the object to be treated as content.
- `true` passed as content is now silently ignored, consistent with how `false` is handled. Both arise from conditional content patterns.
- A function value on a non-event attribute (e.g. `{ class: () => 'foo' }`) is now omitted from the DOM attribute array used in `toElement()`, matching the existing `toString()` behaviour. Previously it was passed to `setAttribute`, which coerced it to the function's source code string.
- `NaN`, `Infinity`, and `-Infinity` as attribute values are now omitted from the output (matching the treatment of `null`/`undefined`/`false`) and raise a validation error when `validationLevel` is `'warn'` or `'error'`. Previously they rendered literally as `"NaN"`/`"Infinity"` with no diagnostic.
- `class` attribute as a plain object (e.g. `{ class: { active: true } }`) is now omitted. Previously it generated a nonsense attribute like `class-active`.
- Non-string/non-number entries in a `class` array (objects, `Symbol`, etc.) are now filtered out. Previously they produced `[object Object]` in the class string.
- Arrays passed as a non-`class` attribute value (e.g. `{ id: ['a','b'] }`) are now omitted. With `validationLevel: 'warn'` or `'error'`, a validation message is raised; the message now shows the array (`id=["a","b"]`) rather than its coerced string form.
- A `style` attribute set to an array is now omitted. Same validation behaviour as above.
- `Infinity` and `-Infinity` in a `style` object are now omitted, matching how `NaN` was already handled.
- The `Kensington` constructor now throws immediately for invalid `validationLevel` values (only `'off'`, `'warn'`, `'error'` are accepted), non-integer or negative `indentationLevel`, and non-function `logger`.
- `createCustomTag` now throws immediately for a non-string or empty `tagName`, and for a non-plain-object `allowedAttributes`.
- Passing a falsy value (`0`, `false`, `''`) as a second argument when the first is already content now throws, as does passing any defined third argument regardless of truthiness.
- A `Number`-typed attribute in `createCustomTag` (e.g. `{ count: Number }`) now rejects `NaN` and non-finite values. Previously `NaN` passed the `typeof value === 'number'` check and was silently dropped.
- A null-prototype style object (e.g. `Object.create(null)` with CSS properties) is now accepted as a valid `style` value. Previously the `?.constructor === Object` check missed it, causing it to fail validation and then crash when building the error message.
- A circular reference in a nested attribute object no longer causes a stack overflow. The circular path is silently skipped.
- Empty or whitespace-only attribute key strings are now silently skipped in both serialisers, preventing malformed output like `<div ="val">`.
- `createCustomTag` type-spec validation error now names the offending attribute(s) rather than showing their type values (e.g. `undefined`) in the message.
- The `indentationLevel` constructor error message no longer shows `null` when passed `Infinity` or `NaN`; it now uses `String()` rather than `JSON.stringify()`.
- A nested attribute object shared across two keys (e.g. `{ data: obj, aria: obj }`) now renders correctly for both keys. Previously the second key was silently skipped because cycle detection permanently marked the object as visited.
- An enumerable property with a throwing getter in an attribute object is now silently skipped rather than crashing.
- `new Kensington(null)` no longer crashes with `Cannot read properties of null`; `null` is now treated the same as no options (all defaults).
- A `Symbol` passed as an attribute value no longer crashes when `validationLevel` is `'warn'` or `'error'`; the validation error message now correctly shows e.g. `id="Symbol(x)"`.
- `inlineComment` now handles text containing `"--"` (invalid in HTML comments) according to `validationLevel`: with `'error'` it throws, with `'warn'` it warns and strips the `--` sequences, and with `'off'` it strips them silently.
- A circular reference in a content array no longer causes a stack overflow; the circular path is silently skipped.
- `NaN`, `Infinity`, and `-Infinity` passed as content now raise a validation error when `validationLevel` is `'warn'` or `'error'`. With `validationLevel: 'off'` they render literally, consistent with the permissive contract of that mode.
- Empty or whitespace-only property names in a `style` object (e.g. `{ '': 'red' }`) are now silently skipped, preventing invalid CSS like `": red"` in the output.
- Non-string, non-number values (Symbol, array, object, etc.) passed as a `Number`-typed attribute value (e.g. `{ tabindex: Symbol('x') }`) no longer crash via numeric coercion. They are treated as invalid and raise a proper validation error. Only strings are coerced to check for a numeric string representation.
- A `style` object whose properties include throwing getters no longer crashes. Such properties are silently skipped in both serialisation and validation, consistent with how throwing getters on attribute objects are handled.
- A `class` array (e.g. `{ class: ['container', 'main'] }`) is no longer rejected as an invalid attribute value when `validationLevel` is `'warn'` or `'error'`. Class arrays are a documented input form; the validator was incorrectly checking them against the `String` spec type.
- A null-prototype object or other non-serialisable value as an attribute value no longer crashes the validation error message formatter. The message now shows `[non-serializable]` instead of throwing `Cannot convert object to primitive value`.
- A `Symbol` inside an array attribute value (e.g. `{ tabindex: [Symbol('x'), 'y'] }`) no longer shows as `null` in the validation error message; it is now shown as `Symbol(x)`.
- `Number`-typed attributes (e.g. `tabindex`, `colspan`, `rowspan`) now accept a numeric string (e.g. `tabindex="-1"`) in both the runtime validator and the TypeScript type (``number | `${number}` ``). This was already the runtime behaviour; the TypeScript type now reflects it.
- `createCustomTag` return type now infers both kebab-case and camelCase attribute names, eliminating false IDE type warnings at call sites (e.g. `{ customAttr: 4 }` where the spec key is `custom-attr`).

## [0.15.1] - 2026-05-07

### Added
- `style` object attributes are now typed with [`csstype`](https://www.npmjs.com/package/csstype), providing autocomplete for CSS property names and values in TypeScript.

## [0.15.0] - 2026-05-06

### Added
- `html-to-kensington` CLI: convert HTML to Kensington code via `npx kensington`. Accepts a file argument, pipe/redirect, or interactive terminal paste. The `--copy`/`-c` flag copies output to the clipboard. If ESLint or Prettier is installed in the working directory, the converter runs the formatter over the output.

## [0.14.0] - 2026-05-04

### Added
- `.inlineComment(str)` method creates an HTML comment node. Multi-line strings are formatted across multiple lines. `.toElement()` returns a `Comment` DOM node via `document.createComment()`.

### Fixed
- Disallow functions as attribute values when `.toString()` is called.

## [0.13.0] - 2026-05-04

### Added
- Multiple consecutive spaces in text content are replaced with non-breaking spaces (` `) so spacing is preserved when rendered in a browser. Single spaces are unaffected. Preformatted elements (`pre`, `script`, `style`, `textarea`) are exempt.
- `style` attribute accepts a JS object: `{ style: { backgroundColor: 'red', zIndex: 2 } }` → `style="background-color: red; z-index: 2"`. camelCase keys are converted to kebab-case. Values of `null`, `undefined`, `false`, or empty string are silently omitted. When `validationLevel` is `'warn'` or `'error'`, object values that are not a string, number, `false`, `null`, or `undefined` are flagged as invalid.

## [0.12.1] - 2026-05-02

### Added
- Separate type declarations for the `kensington/attributes` subpath export;
- `typesVersions` field in `package.json` for TypeScript < 4.7 compatibility with subpath exports
- Source maps for all four dist bundles (`dist/*.map`)
- Publishes to npm with provenance attestation
- Documentation for AI Agents

### Changed
- External dependency for `he` removed.

## [0.12.0]

### Added
- Browser distribution bundles: `dist/kensington.js` / `dist/kensington.min.js` (full, with attribute validation data)
- Slim browser bundle: `dist/kensington.slim.js` / `dist/kensington.slim.min.js` — omits validation data (~77% smaller minified); requires `validationLevel: 'off'`
- `logger` constructor option — receives validation warning messages; defaults to `console.log`

## [0.11.5]

### Added
- Event listener support: function-valued attributes in `toElement()` are wired via `addEventListener` rather than set as attribute strings

## [0.11.4]

### Fixed
- `style` tag content is no longer HTML-encoded

## [0.11.3]

### Fixed
- `he` package import resolved correctly in CJS build

## [0.11.2]

### Changed
- HTML encoding now occurs only during string serialization (`toString()`), not at construction time

## [0.11.1]

### Added
- `toElement()` available in CJS build

## [0.11.0]

### Added
- `toElement()` — renders a tag tree to a live DOM node via `document.createElement` / `createElementNS`

## [0.10.1]

### Fixed
- MathML elements re-included (had been accidentally removed)

### Changed
- Internal string building uses concatenation instead of template literals

## [0.10.0]

### Changed
- Performance improvements

## [0.9.3]

### Added
- Hyphenated `data-*` attributes (e.g. `data-bs-toggle`)
- Function attribute type for custom validation

### Fixed
- SVG filter effect and CSS masking spec fetch URLs updated
- Input `type` attribute validation improved
- `textarea` indentation
- Literal content handling
