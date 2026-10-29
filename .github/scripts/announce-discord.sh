#!/usr/bin/env bash
# Posts a release announcement to the plugin's Discord channel.
#
#   announce-discord.sh <tag> <notes.md>
#
# Needs DISCORD_WEBHOOK_URL (the repository secret of that name); without it
# the announcement is skipped, so forks and test runs never fail on it.
# The embed carries the release's own changes (everything before the
# "Also new since" roll-up), its screenshots as a gallery, and how to update.
set -euo pipefail

TAG="${1:?tag}"
SRC="${2:?notes file}"
# notes typed on the website come with Windows line endings
NOTES=$(mktemp)
tr -d '\r' < "$SRC" > "$NOTES"

if [ -z "${DISCORD_WEBHOOK_URL:-}" ]; then
  echo "::notice::DISCORD_WEBHOOK_URL is not set - skipping the Discord announcement"
  exit 0
fi

REPO="${GITHUB_REPOSITORY:-stmoha/ncsender-plugin-gcode-reference}"
NAME=$(jq -r '.name' manifest.json)
ID=$(jq -r '.id' manifest.json)
RELEASE_URL="https://github.com/${REPO}/releases/tag/${TAG}"
ZIP_URL="https://github.com/${REPO}/releases/download/${TAG}/${ID}_${TAG}.zip"

# Screenshots: the <img src> URLs, in order (Discord shows up to four).
mapfile -t IMAGES < <(grep -o '<img [^>]*src="[^"]*"' "$NOTES" | sed 's/.*src="\([^"]*\)".*/\1/' | head -4)

# Text: this release's part of the notes, in Discord's markdown. Discord
# shows no HTML and no headings inside embeds, so headings become bold
# lines and the HTML (images, captions) is dropped.
DESC=$(awk '
  /^## Also new since/ { exit }
  /^## What.s Changed/ { next }
  /^<\/?(p|img|sub)/  { next }
  /^---[[:space:]]*$/ { next }
  /^##+ /             { sub(/^##+ /, ""); print "**" $0 "**"; next }
  { print }
' "$NOTES" | sed -E 's#</?(p|img|sub|sup|br|div|span|details|summary)( [^>]*)?/?>##g' | cat -s)
ROLLUP=""
grep -q '^## Also new since' "$NOTES" && ROLLUP=$(grep -m1 '^## Also new since' "$NOTES" | sed 's/^## //')

# Keep inside Discord's 4096-character embed description.
MAX=3600
if [ "${#DESC}" -gt "$MAX" ]; then
  DESC="${DESC:0:$MAX}"
  DESC="${DESC%$'\n'*}"$'\n…'
fi
[ -n "$ROLLUP" ] && DESC="${DESC}"$'\n\n'"**${ROLLUP}:** see the [full release notes](${RELEASE_URL})."

PAYLOAD=$(jq -n \
  --arg title "${NAME} ${TAG} released" \
  --arg url "$RELEASE_URL" \
  --arg desc "$DESC" \
  --arg zip "$ZIP_URL" \
  --arg id "$ID" \
  --args '{
    embeds: (
      [{
        title: $title, url: $url, description: $desc, color: 1941124,
        fields: [{ name: "Update",
                   value: ("ncSender → Settings → Plugins → **Update**, or [download the ZIP](" + $zip + ")") }],
        footer: { text: $id }
      }]
      # embeds sharing the url show their images together as a gallery
      + ($ARGS.positional | to_entries | map(
          if .key == 0 then null else { url: $url, image: { url: .value } } end) | map(select(. != null)))
    )
  } | if ($ARGS.positional | length) > 0 then .embeds[0].image = { url: $ARGS.positional[0] } else . end' \
  "${IMAGES[@]}")

if [ "${DRY_RUN:-}" = "1" ]; then
  echo "$PAYLOAD"
  exit 0
fi

if ! curl -sS --fail-with-body -H "Content-Type: application/json" -d "$PAYLOAD" "$DISCORD_WEBHOOK_URL"; then
  echo "::warning::The Discord announcement for ${TAG} failed - check the DISCORD_WEBHOOK_URL secret"
  exit 1
fi
echo "Announced ${TAG} on Discord"
