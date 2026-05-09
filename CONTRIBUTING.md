# Contributing

## Bug reports

Open an issue on [GitHub](https://github.com/ryanlsimms/kensington/issues). Include:
- A minimal reproduction (the smallest code that demonstrates the problem)
- Expected vs. actual output
- Node version and package version

## Feature requests

Open an issue describing the use case. Explaining *why* you need the feature is more useful than describing the implementation.

## Pull requests

1. Fork the repo and create a branch from `master`
2. Install dependencies: `npm ci`
3. Set up test symlinks (required once after cloning):
   ```bash
   mkdir -p tests/esm/node_modules tests/cjs/node_modules tests/typescript/node_modules
   ln -s "$(pwd)" tests/esm/node_modules/kensington
   ln -s "$(pwd)" tests/cjs/node_modules/kensington
   ln -s "$(pwd)" tests/typescript/node_modules/kensington
   ```
4. Make your changes — see [Architecture](#architecture) below
5. Add or update tests and run the full suite: `npm test`
6. Run the linter: `npm run lint`
7. Add a line to `## [Unreleased]` in `CHANGELOG.md` (consumer-facing changes only)
8. Open a pull request against `master`

## Running tests

```bash
npm test               # all suites
npm run test-esm       # ESM unit tests
npm run test-cjs       # CJS unit tests
npm run test-ts        # TypeScript type-checking
npm run test-browser   # Playwright browser tests
```

## Linting

```bash
npm run lint    # lint the whole project
npm run build   # regenerate files and lint the generated output
```

ESLint is configured in `eslint.config.js`. The generated files `esm/kensington.js` and `esm/attributes.js` are included in linting — `npm run build` lints them automatically after generation. If you change the generator templates in `generate/build-javascript.js` or `generate/parse-data.js`, run `npm run build` to confirm the output is lint-clean.

## Architecture

See [CLAUDE.md](./CLAUDE.md) for a full description of the codebase. The short version:

- **`esm/kensington.js` and `esm/attributes.js` are generated** — do not edit them directly. Edit the hand-written source in `esm/tag-classes/` and `esm/lib/`, then rebuild:
  ```bash
  node generate/bin/write-code-files.js   # regenerates esm/kensington.js, types, cjs/
  node generate/bin/build-browser.js      # regenerates dist/ bundles
  ```
- **`cjs/` and `dist/` are generated** from `esm/` via Rollup — do not edit them directly
- The `esm/` directory is the authoritative source

## Releasing

Add changes under `## [Unreleased]` in `CHANGELOG.md` as you work, then run the release script. The script requires a clean working tree. If `CHANGELOG.md` has an `## [Unreleased]` section, it is stamped with the new version and date. It bumps the version, commits, tags, pushes, and creates a GitHub Release. GitHub Actions then publishes to npm automatically.

**Stable releases** (from `master`, 0.x line):

```bash
scripts/release.sh patch   # 0.15.3 → 0.15.4
scripts/release.sh minor   # 0.15.3 → 0.16.0
scripts/release.sh major   # 0.15.3 → 1.0.0
```

**Prerelease** (from `next`, 1.x line — `preid` defaults to `beta`):

```bash
scripts/release.sh premajor          # 0.x.x → 1.0.0-beta.0
scripts/release.sh prerelease        # 1.0.0-beta.0 → 1.0.0-beta.1
scripts/release.sh premajor rc       # → 1.0.0-rc.0
```

**Named prerelease lines** (e.g. the `signals` branch, 2.x line — pass the preid as a second argument):

```bash
scripts/release.sh premajor signals  # 1.x.x → 2.0.0-signals.0
scripts/release.sh prerelease signals # 2.0.0-signals.0 → 2.0.0-signals.1
```

Prereleases are published to npm under the preid as the dist-tag (`beta`, `signals`, etc.), so `npm install kensington` stays on the latest stable. Users opt in with `npm install kensington@beta` or `npm install kensington@signals`.

## npm token rotation

The `NPM_TOKEN` GitHub secret is a granular npm access token that expires every 90 days. When it expires, the publish step will fail. To rotate it:

1. Go to **npmjs.com → [your account] → Access Tokens → Generate New Token → Granular Access Token**
2. Set:
   - **Packages and scopes**: `kensington` → Read and write
   - **Two-factor authentication**: Bypass two-factor authentication
   - **Expiration**: 90 days
3. Copy the token
4. Go to **GitHub → ryanlsimms/kensington → Settings → Secrets and variables → Actions → `NPM_TOKEN`** → Update secret
5. Delete the old token from npmjs.com
