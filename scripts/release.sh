#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "major" && "${1:-}" != "minor" && "${1:-}" != "patch" ]]; then
  echo "Usage: scripts/release.sh <major|minor|patch>"
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "Error: gh (GitHub CLI) is not installed — run: brew install gh"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "Error: gh is not authenticated — run: gh auth login"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: uncommitted changes present — commit or stash them before releasing"
  git status --short
  exit 1
fi

if ! grep -q "^## \[Unreleased\]" CHANGELOG.md; then
  echo "Error: no [Unreleased] section found in CHANGELOG.md — add one before releasing"
  exit 1
fi

npm version "$1" --no-git-tag-version

VERSION=$(node -p "require('./package.json').version")
DATE=$(date +%Y-%m-%d)

sed -i '' "s/^## \[Unreleased\]/## [$VERSION] - $DATE/" CHANGELOG.md

git add package.json package-lock.json CHANGELOG.md
git commit -m "release $VERSION"
git tag "v$VERSION"

git push origin --follow-tags

gh release create "v$VERSION" --title "$VERSION" --notes "See CHANGELOG.md"
