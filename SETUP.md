# Publishing this plugin to GitHub — browser-only guide (Windows friendly)

Everything below happens on **github.com in your browser** while signed in as
**modest-marmot**. No git, no command line, no extra software. Delete this
file from the repo once you're done (or just don't upload it).

---

## Step 1 — Create the repository

1. Go to https://github.com/new
2. **Repository name:** `ncsender-plugin-gcode-reference`
3. **Description:** `Inline G-code, M-code and grblHAL settings documentation for ncSender`
4. Visibility: **Public**
5. Leave ALL the "Initialize this repository with" checkboxes **unchecked**
   (no README, no .gitignore, no license — this folder already has them)
6. Click **Create repository**

## Step 2 — Upload the files

On the empty-repository page that appears:

1. Click the **"uploading an existing file"** link
2. Open the unzipped `ncsender-plugin-gcode-reference` folder in Windows
   Explorer, press **Ctrl+A** to select everything **inside** it (including
   the `.github`, `.scripts` and `build` folders — do NOT select the outer
   folder itself), and drag the selection onto the upload area in the browser
3. Wait for all files to list, type a commit message like
   `Initial release v1.10.0`, and click **Commit changes**

**Verify the hidden folder made it:** on the repo's front page you should see
a `.github` folder at the top of the file list. If it's missing (some
browsers skip dot-folders when dragging):

1. Click **Add file → Create new file**
2. In the filename box type exactly: `.github/workflows/release-build.yml`
   (typing the `/` characters creates the folders)
3. Open the local copy of that file in Notepad, copy everything, paste it
   into the web editor, and click **Commit changes**
4. Do the same for `.scripts/release.sh` if it's missing too

## Step 3 — Publish the first release (this triggers the build robot)

1. On the repo front page, click **Releases** (right-hand sidebar) →
   **Create a new release**
2. Click **"Choose a tag"**, type `v1.10.0`, then click
   **"Create new tag: v1.10.0 on publish"**
3. **Release title:** `G-code & grblHAL Reference v1.10.0`
4. Description: open `latest_release.md` in Notepad, copy its contents,
   paste them here
5. Click **Publish release**

Publishing creates the tag, and the tag wakes up the **GitHub Actions
pipeline** included in `.github/workflows/`. Click the **Actions** tab to
watch it run (takes about a minute). When it's green, go back to
**Releases** — the pipeline will have attached
`com.cncdocs.gcode-reference_v1.10.0.zip` to your release automatically.

**Sanity check:** download that ZIP and install it in ncSender
(Settings → Plugins → Install Plugin). This is the exact artifact the
registry will serve.

## Step 4 — Ask Francis to list it

Post in the Discord:

> The G-code & grblHAL Reference plugin is ready for the registry:
> https://github.com/modest-marmot/ncsender-plugin-gcode-reference
> Patterned on ncsender-plugin-autodustboot — same manifest layout, release
> pipeline, and `<plugin-id>_<tag>.zip` release assets; platforms map covers
> v1 / pro-v1 / pro-v2. First release is v1.10.0.

---

## Releasing future versions (still browser-only)

When Claude gives you an updated plugin:

1. On the repo page, navigate to each changed file → click the **pencil
   icon** → paste the new contents → Commit. (Or use **Add file → Upload
   files** to replace several at once.)
2. Make sure `manifest.json`'s `"version"` is the new number, and paste the
   new notes into `latest_release.md`
3. **Releases → Draft a new release** → new tag (e.g. `v1.10.1`) → publish

The pipeline rebuilds and attaches the ZIP, and once the plugin is on the
registry, users get the update through ncSender automatically.

## Optional, later

- **GitHub Desktop** (https://desktop.github.com) is a friendly Windows app
  that replaces the upload-files dance with one-click sync once you're
  comfortable — worth adopting after a release or two.
- `.scripts/release.sh` is a power-user helper (auto version bump + notes).
  It's a bash script: on Windows it runs inside **Git Bash** (installed with
  https://git-scm.com) — entirely optional, the browser flow above does the
  same job.
- Repo **Settings → Secrets and variables → Actions**: add a
  `DISCORD_WEBHOOK_URL` secret if you want releases auto-announced to a
  Discord channel.
- Add a screenshot to the README: take one of the reference dialog, then on
  the repo page open README.md → pencil icon → drag the image into the
  editor (GitHub hosts it and inserts the link).
