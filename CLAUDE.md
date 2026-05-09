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

## Releasing

```bash
# Stable release (from master)
scripts/release.sh patch
scripts/release.sh minor
scripts/release.sh major

# Prerelease (from next branch) — second arg is the preid, defaults to 'beta'
scripts/release.sh premajor          # → 1.0.0-beta.0
scripts/release.sh prerelease        # → 1.0.0-beta.1
scripts/release.sh premajor rc       # → 1.0.0-rc.0
```

`release.sh` requires a clean working tree and an `## [Unreleased]` section in `CHANGELOG.md`. It bumps the version, stamps the changelog, commits, tags, pushes, and creates a GitHub release. Prerelease builds are marked as pre-release on GitHub.

**npm dist-tag**: `publish.yml` detects a prerelease version (contains `-`) and publishes with `--tag <preid>` so `npm install kensington` stays on the latest stable. Users opt in with `npm install kensington@beta`.

**Branches**: `master` is the 0.x stable line. `next` is the 1.0 beta line. Cherry-pick fixes from `master` → `next` as needed.

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

- `esm/tag-classes/content-tag.js` — base class for all HTML/SVG/MathML elements; handles attribute validation, content normalization, indentation, string serialization (`toString()`), and DOM creation (`toElement()`)
- `esm/tag-classes/void-tag.js` — subclass for void elements (no closing tag, no content)
- `esm/tag-classes/literal-tag.js` — wraps raw HTML strings passed via `.literal()` / `.unsafeLiteral()`
- `esm/tag-classes/comment-tag.js` — wraps HTML comments created via `.inlineComment()`; `toString()` formats single/multi-line, `toElement()` uses `document.createComment()`
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
- SVG elements accept all CSS properties as presentation attributes (per the SVG spec). In `esm/attributes.js` a single `svgPresentationAttributes` export object is spread into each SVG element's attribute object to avoid duplicating ~744 entries per element. In `types.d.ts` a single `SvgPresentationAttributes` type is intersected into each SVG element's attribute type for the same reason.
- Event handler attributes (`onclick`, `oninput`, and all `on*`) accept `[String, Function]`. Functions are valid at tag creation and wired via `addEventListener` in `toElement()`. In `toString()`, function values cannot be serialized — they are omitted, with the `handleFunctionValues` callback in `attributesStringFromObject` invoking `showInvalid` at that point rather than at creation time.

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
