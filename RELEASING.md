# Release Checklist — G-code & grblHAL Reference

Claude Desktop now has direct access to this repo folder, so releases are
three steps: describe → review/push → publish.

Repo: https://github.com/stmoha/ncsender-plugin-gcode-reference
Clone: C:\Users\stefa\Documents\GitHub\ncsender-plugin-gcode-reference
(keep it on a plain local path — never inside Google Drive / OneDrive)

---

## Step 1 — Tell Claude what you want changed
Describe the bug or feature in Claude Desktop. Claude:
- re-syncs from GitHub if needed (its own workspace resets between chats —
  this repo on GitHub is always the source of truth)
- edits the files **directly in this folder**
- builds (`build/` sources → `commands.js` + `config.html`) and tests in its
  sandbox before writing anything here
- bumps `manifest.json`'s version and rewrites `latest_release.md`

When Claude says it's done, the changes are already on disk here.

## Step 2 — Review, commit, push in GitHub Desktop
1. Open GitHub Desktop — the changed files appear with diffs; skim them
2. Sanity check: `manifest.json` shows the new version
3. Short commit message → **Commit to main** → **Push origin**

## Step 3 — Publish the release (this triggers the build robot)
1. github.com repo → **Releases** → **Draft a new release**
2. **Choose a tag** → type the new version like `v1.19.0` (the `v` matters)
   → **Create new tag on publish**
3. Title: `G-code & grblHAL Reference v1.19.0`
4. Description: paste the contents of `latest_release.md`
5. **Publish release**

## Step 4 — Verify
1. **Actions** tab → green check (~1 min)
2. **Releases** → `com.cncdocs.gcode-reference_v1.19.0.zip` under Assets
3. ncSender → Settings → Plugins shows an **Update available** badge
   (it checks this repo's latest GitHub release via the manifest's
   `repository` field) — update, then hard-refresh the browser (Ctrl+F5)
   and confirm the new version number

## Done
- No registry PR needed per release — updates flow straight from GitHub
  releases to every user. The registry listing's version text is cosmetic;
  refresh it with a PR every handful of releases if you like.

---

## If something looks wrong
- **No .zip after publishing:** Actions tab → red X → screenshot the log
  for Claude
- **Update installed but looks unchanged:** hard-refresh (Ctrl+F5), check
  version in Settings → Plugins — usually a cached UI
- **Claude Desktop can't see this folder:** Settings → Extensions →
  Filesystem → confirm this path is still allowed; fully quit (system
  tray → Quit) and restart the app if reads hang
- **GitHub Desktop acting weird:** confirm the clone is still on a plain
  local path, not a synced folder
