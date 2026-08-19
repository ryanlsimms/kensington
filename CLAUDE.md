# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests (ESM, CJS, TypeScript types, browser, CLI, treeshake)
npm test

# Individual suites
npm run test-esm        # ESM unit tests
npm run test-cjs        # CJS unit tests
npm run test-ts         # TypeScript type-checking (tsc --noEmit)
npm run test-browser    # Playwright browser tests
npm run test-cli        # html-to-kensington CLI integration tests
npm run test-treeshake  # Verifies slim consumers don't pull the Kensington class

# Start dev server for manual browser testing
npm run dom-server

# Regenerate generated files (esm/kensington.js, esm/attributes.js, esm/tag-info.js,
# types.d.ts, attributes.d.ts, bin/lib/svg-element-case.js, cjs/, and dist/) from spec data.
# Also lints the generated output. If the generator templates produce invalid JS, this fails
npm run build

# Lint the whole project
npm run lint

# Build the dist/ browser bundles (full, slim, devtools, plus minified variants)
npm run build-browser

# Fetch latest HTML/SVG/MathML spec data (without rebuilding)
npm run fetch

# Fetch latest spec data AND regenerate all files
npm run fetch-and-build
```

To run a single test by name: `node --test --test-name-pattern='partial name' ./tests/esm/esm-test.js`. The Playwright suite supports `npx playwright test -g 'partial name'`.

## Writing style

- Use American English spellings in all text: comments, docs, README, changelogs.
- Never use em dashes. Use a period and a new sentence instead.
- Never use `label: value` colon patterns in prose. Use a period and a new sentence instead.

## Releasing

```bash
# Stable release (from master. 0.x line)
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

See `ARCHITECTURE.md` for the source-tree map, the `toString()`/`toElement()` data flow, the HMR and live-signals subsystems, a "where things live" table, and the internal invariants (cache/rebuild rules, reconciler guards, hydration-scope lifetime, and more).

**`esm/kensington.js` and `esm/attributes.js` are generated.** Do not edit them directly; they come from `npm run build` (see `generate/` in `ARCHITECTURE.md`). **`cjs/` is entirely generated** via Rollup from `esm/`, which is the authoritative source.

### Error policy

**Never throw when `validationLevel` is `'off'`.** Production deployments run with `'off'` for performance. An unexpected throw can take down a server or break a user-facing page. Invalid input at `'off'` level must be silently skipped. Render nothing, omit the attribute, filter the content item. Rather than crashing. Use `showInvalid(message, this.validationLevel, this.logger)` for every validation check: it does nothing at `'off'`, logs at `'warn'`, and throws at `'error'`. The only exceptions are hard invariants that indicate a programming error at library setup time (e.g. an invalid `validationLevel` value passed to the constructor, a non-string `tagName` passed to `createCustomTag`). Those throw unconditionally because they can only be caused by incorrect integration code, not by runtime data.

### Tag creation flow

`Kensington.createTag(tagName, allowedAttributes, Klass, options)` returns a closure. When called, that closure validates arguments, instantiates the appropriate tag class (`ContentTag`, `VoidTag`, etc.), runs attribute validation if `validationLevel !== 'off'`, and returns the instance. Tag methods are bound in the constructor so they can be destructured.

### Options handling

- Nested objects flatten to kebab-case: `{ data: { bs: { toggle: 'collapse' } } }` → `data-bs-toggle="collapse"`
- camelCase keys convert to kebab-case: `{ dataBsToggle: 'collapse' }` → `data-bs-toggle="collapse"`
- Boolean attributes are included when `true`, omitted when `false`
- `style` accepts a plain object: `{ style: { backgroundColor: 'red', zIndex: 2 } }` → `style="background-color: red; z-index: 2"`. camelCase keys are converted to kebab-case (CSS property names are always kebab-case; camelCase is only the JS DOM convention for `element.style` properties. This applies to SVG styles too); `null`/`undefined`/`false` values are silently omitted; other non-string/number values are flagged by validation.
- `data-*` and `aria-*` namespaces are always allowed; additional namespaces (e.g. `hx` for htmx) are passed via constructor
- SVG-capable element maps combine shared global, event, presentation, conditional, and XLink attribute-definition groups. Shared groups are exported from `kensington/attributes`, while per-element maps clone mutable array definitions so consumers can safely reuse or customize them.
- Event handler attributes (`onclick`, `oninput`, and all `on*`) accept `[String, Function]`. Functions are valid at tag creation and wired via `addEventListener` in `toElement()`. In `toString()`, function values cannot be serialized. They are omitted, with the `handleFunctionValues` callback in `attributesStringFromObject` invoking `showInvalid` at that point rather than at creation time.
- `prop` key: accepts a plain object mapping DOM property names to static values or signals. Applied in `toElement()` via `el[name] = value` (property assignment, not `setAttribute`). Property existence and writability are checked against the live element at render time via `isPropWritable()`. Silently ignored in `toString()`. TypeScript types are derived from `HTMLElementTagNameMap`/`SVGElementTagNameMap` via the `PropFor<Tag>` utility type in `types.d.ts`. Known writable properties are typed against the element's DOM interface. Arbitrary string keys (expandos) are also accepted via an index signature (`{ [key: string]: unknown }`).

### Testing setup

Each test subdirectory has its own `package.json` and a `node_modules/kensington` symlink to the project root so `import/require('kensington')` resolves locally without a global `npm link`. See `ARCHITECTURE.md` for the `tests/` layout.
