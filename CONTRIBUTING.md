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
6. Add a line to `## [Unreleased]` in `CHANGELOG.md` (consumer-facing changes only)
7. Open a pull request against `master`

## Running tests

```bash
npm test               # all suites
npm run test-esm       # ESM unit tests
npm run test-cjs       # CJS unit tests
npm run test-ts        # TypeScript type-checking
npm run test-browser   # Playwright browser tests
```

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

Add changes under `## [Unreleased]` in `CHANGELOG.md` as you work, then run:

```bash
scripts/release.sh patch   # 0.12.0 → 0.12.1
scripts/release.sh minor   # 0.12.0 → 0.13.0
scripts/release.sh major   # 0.12.0 → 1.0.0
```

The script promotes `[Unreleased]` to the new version with today's date, commits, tags, pushes, and creates a GitHub Release. GitHub Actions then publishes to npm automatically with provenance attestation.

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
