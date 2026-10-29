# Releasing G-code Explorer

Releases are nearly hands-off: Claude does the editing and testing and
hands you a test ZIP; once you've tried it in ncSender, Claude commits,
and you click one prefilled **Publish release** link. GitHub builds the
release ZIP. Nothing to copy or paste.

Repo: https://github.com/stmoha/ncsender-plugin-gcode-reference
Local clone (optional): C:\Users\stefa\Documents\GitHub\ncsender-plugin-gcode-reference

---

## 1. Ask for the change
In a Claude session with this repo attached (push access), describe the
bug or feature. Claude:
- works on a fresh clone of this repo — GitHub is always the source of truth
- edits the sources (`gcode-database.js`, `build/*`), runs
  `node build/build.mjs`, and tests the result in a headless browser
- bumps `manifest.json`'s version and rewrites `latest_release.md`

## 2. You test the ZIP first
- Claude packages the change exactly like the release workflow does
  (`com.cncdocs.gcode-reference_vX.Y.Z-test.zip`) and sends it to you
- ncSender → Settings → Plugins → Install Plugin → upload the ZIP, then
  hard-refresh (Ctrl+F5) and try the change
- nothing is on GitHub yet; ask for fixes and you get a new test ZIP

## 3. Claude commits, you publish (after you say the ZIP is good)
- Claude commits to `main` and pushes
- Claude can't create tags or releases from its session (GitHub refuses
  them by policy), so it hands you a link to the **new release** page with
  the tag (`vX.Y.Z`), title and notes already filled in from
  `latest_release.md` — click **Publish release**
- publishing creates the tag, and the **Build and Release Plugin**
  workflow rebuilds the generated files, packages
  `com.cncdocs.gcode-reference_vX.Y.Z.zip` and attaches it to the release
  (and posts to Discord if the `DISCORD_WEBHOOK_URL` secret is set)
- Claude checks that the workflow went green and the ZIP is attached

## 4. You
- ncSender → Settings → Plugins shows **Update available** for G-code
  Explorer (it reads this repo's latest release via the manifest's
  `repository` field). Update, hard-refresh (Ctrl+F5), check the version.
- If you also edit locally: GitHub Desktop → **Fetch origin** → **Pull
  origin** to bring the clone up to date before changing anything.

## Registry listing
Updates reach users straight from GitHub releases, so no registry change
is needed per release. The listing's name/version text in
`siganberg/ncSender.plugins-registry` is cosmetic; when it's worth
refreshing, Claude pushes a branch to the `stmoha` fork and gives you a
prefilled "Create pull request" link.

---

## Doing it by hand (fallback)
1. Edit, then `node build/build.mjs`
2. Bump `manifest.json` version, update `latest_release.md`
3. Commit and push to `main` (GitHub Desktop is fine)
4. Push a tag `vX.Y.Z` — or on github.com: Releases → Draft a new release
   → new tag `vX.Y.Z` → paste `latest_release.md` → Publish. Either way
   the workflow attaches the ZIP.

## If something looks wrong
- **No ZIP on the release:** Actions tab → the red run → its log
- **Update installed but looks unchanged:** hard-refresh (Ctrl+F5), check
  the version in Settings → Plugins — usually a cached UI
- **GitHub Desktop acting weird:** keep the clone on a plain local path,
  never inside Google Drive / OneDrive
