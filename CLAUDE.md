# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests (ESM, CJS, TypeScript types, browser)
npm test

# Individual suites
npm run test-esm      # ESM unit tests
npm run test-cjs      # CJS unit tests
npm run test-ts       # TypeScript type-checking (tsc --noEmit)
npm run test-browser  # Playwright browser tests

# Start dev server for manual browser testing
npm run dom-server

# Regenerate esm/kensington.js, esm/attributes.js, types.d.ts, cjs/, and dist/ from spec data
npm run build

# Build only the browser dist bundle (dist/kensington.js and dist/kensington.min.js)
npm run build-browser

# Fetch latest HTML/SVG/MathML spec data (without rebuilding)
npm run fetch

# Fetch latest spec data AND regenerate all files
npm run fetch-and-build
```

To run a single test: Node's built-in runner doesn't support filtering by name via the CLI; use `it.only()` temporarily.

## Architecture

Kensington is an HTML template engine that generates HTML strings (or DOM elements) via nested method calls on a `Kensington` class instance.

### Generated vs. hand-written files

**`esm/kensington.js` and `esm/attributes.js` are generated** — do not edit them directly. They are produced by `generate/bin/write-code-files.js` from:
- `generate/fetched-data/{html,svg,math}.json` — spec data (fetched from HTML/SVG/MathML living standards)
- `generate/build-javascript.js` — template that emits the class body and attribute exports
- `generate/build-declarations.js` — template that emits `types.d.ts`
- `generate/parse-data.js` — normalizes spec data into the shape the builders expect

**`cjs/` is entirely generated** via Rollup from `esm/`. The `esm/` directory is the authoritative source.

### Hand-written source (`esm/`)

- `esm/tag-classes/content-tag.js` — base class for all HTML/SVG/MathML elements; handles attribute validation, content normalization, indentation, string serialization (`toString()`), and DOM creation (`toElement()`)
- `esm/tag-classes/void-tag.js` — subclass for void elements (no closing tag, no content)
- `esm/tag-classes/literal-tag.js` — wraps raw HTML strings passed via `.literal()` / `.unsafeLiteral()`
- `esm/tag-classes/html-with-doctype-tag.js` — subclass for `.htmlWithDocType()` that prepends `<!DOCTYPE html>`
- `esm/lib/` — utilities: attribute string/array builders, indentation, content stringification, `he` encoder wrapper, camelCase↔kebab-case conversion

### Tag creation flow

`Kensington.createTag(tagName, allowedAttributes, Klass, options)` returns a closure. When called, that closure validates arguments, instantiates the appropriate tag class (`ContentTag`, `VoidTag`, etc.), runs attribute validation if `validationLevel !== 'off'`, and returns the instance. Tag methods are bound in the constructor so they can be destructured.

### Attribute handling

- Nested objects flatten to kebab-case: `{ data: { bs: { toggle: 'collapse' } } }` → `data-bs-toggle="collapse"`
- camelCase keys convert to kebab-case: `{ dataBsToggle: 'collapse' }` → `data-bs-toggle="collapse"`
- Boolean attributes are included when `true`, omitted when `false`
- `style` accepts a plain object: `{ style: { backgroundColor: 'red', zIndex: 2 } }` → `style="background-color: red; z-index: 2"`. camelCase keys are converted to kebab-case; `null`/`undefined`/`false` values are silently omitted; other non-string/number values are flagged by validation.
- `data-*` and `aria-*` namespaces are always allowed; additional namespaces (e.g. `hx` for htmx) are passed via constructor

### Testing setup

Each test subdirectory has its own `package.json` and a `node_modules/kensington` symlink to the project root so `import/require('kensington')` resolves locally without a global `npm link`.

- `tests/esm/` — ESM unit tests (`node:test`)
- `tests/cjs/` — CJS unit tests (`node:test`, `"type": "commonjs"`)
- `tests/typescript/` — TypeScript type tests (`tsc --noEmit`)
- `tests/browser/` — Playwright end-to-end tests; a local server serves pages from `tests/browser/pages/`
