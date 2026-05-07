# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
