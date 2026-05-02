# Contributing

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
