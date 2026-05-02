# Contributing

## Releasing

Add changes under `## [Unreleased]` in `CHANGELOG.md` as you work, then run:

```bash
scripts/release.sh patch   # 0.12.0 → 0.12.1
scripts/release.sh minor   # 0.12.0 → 0.13.0
scripts/release.sh major   # 0.12.0 → 1.0.0
```

The script promotes `[Unreleased]` to the new version with today's date, commits, tags, pushes, and creates a GitHub Release. GitHub Actions then publishes to npm automatically with provenance attestation.
