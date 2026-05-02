# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
