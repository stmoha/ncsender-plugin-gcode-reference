#!/usr/bin/env bash
# Packages the plugin ZIP the way ncSender installs it (one top-level folder named
# after the plugin id). The release workflow and test builds both use this, so a
# test ZIP holds exactly what the release will.
#
#   .scripts/package.sh                 -> dist/com.cncdocs.gcode-reference_v<version>.zip
#   .scripts/package.sh v2.1.5-test1    -> dist/com.cncdocs.gcode-reference_v2.1.5-test1.zip
#
# Run `node build/build.mjs` first: the ZIP takes commands.js and config.html as
# they are on disk. Everything in the repo goes in except what EXCLUDE lists.
set -euo pipefail
cd "$(dirname "$0")/.."

EXCLUDE=(.git .github .scripts dist tmp test node_modules latest_release.md CLAUDE.md .DS_Store)

ID=$(node -p "require('./manifest.json').id")
LABEL="${1:-v$(node -p "require('./manifest.json').version")}"
ZIP="dist/${ID}_${LABEL}.zip"

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/$ID" dist
TAR_EXCLUDES=()
for e in "${EXCLUDE[@]}"; do TAR_EXCLUDES+=("--exclude=./$e"); done
tar "${TAR_EXCLUDES[@]}" -cf - . | tar -xf - -C "$STAGE/$ID"

rm -f "$ZIP"
(cd "$STAGE" && zip -qr - "$ID") > "$ZIP"
echo "Created $ZIP ($(du -h "$ZIP" | cut -f1)), $(unzip -Z1 "$ZIP" | grep -vc '/$') files"
