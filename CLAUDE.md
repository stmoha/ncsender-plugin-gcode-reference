# G-code Explorer: notes for Claude

An ncSender plugin (`com.cncdocs.gcode-reference`, called "G-code & grblHAL
Reference" before 2.0.0) made with Stefan (GitHub `stmoha`). It has five tabs:
- **Reference:** G/M codes, `$` commands and numbered settings for grblHAL,
  Grbl 1.1 and FluidNC.
- **G-code:** explains the loaded file or pasted code line by line.
- **Explorer:** a 2D toolpath map with line checks and jogging. It was merged in
  from the retired G-code Navigator plugin at 2.0.0.
- **NC Manual** and **Settings.**

Features: `README.md`. How to release: `RELEASING.md`. Build, test and package
commands: README › Development.

## How Stefan likes to work
- **A test ZIP before anything reaches `main`.** Work on a branch, build, run the
  tests, run `.scripts/package.sh vX.Y.Z-test1`, then send him
  `dist/com.cncdocs.gcode-reference_vX.Y.Z-test1.zip`. He installs it from
  ncSender › Settings › Plugins › Install Plugin, then presses Ctrl+F5. Merge to
  `main` only after he says it's good. Changes to docs, tests or CI alone don't
  need a test ZIP.
- **Automate everything you can.** He only clicks what this session can't do:
  Publish release (prefilled link), registry pull requests (prefilled compare
  link), and repo settings and secrets.
- **Release notes tally.** Most people skip versions, so notes roll up recent
  releases (format below).
- **Screenshots for anything visible**, taken on a portrait 1080×1920 screen
  (ncSender's kiosk). Check layout changes in landscape and portrait.
- **Plain words** in the UI and notes: say what to do and why, with no jargon a
  hobbyist wouldn't use.
- His machine runs grblHAL with ncSender set to Imperial. His jobs are often
  Fusion 360 posts in inches with several tools.

## Releasing (details in RELEASING.md)
- Bump `manifest.json` `version` and rewrite `latest_release.md`:
  1. `## What's Changed in X.Y.Z` with `### <emoji> Title` sections.
  2. Then `---` and `## Also new since vA.B.C (…)`, rolling back to the last
     release that has been out about a week. Rolled-up sections get a
     `(X.Y.Z)` suffix, and earlier releases' notes are kept in full.
- Screenshots live in `.github/release-images/` (left out of the ZIP).
  - Make them with `node test/shots.cjs --version vX.Y.Z` (options at the top of
    the file).
  - In the notes, use `<img src="…" width="420">` pointing at raw.githubusercontent
    URLs **pinned to a commit SHA**: commit the images first, then link them.
  - Published notes can't be edited from the session, so a screenshot fix
    needs a new release.
- Session limits:
  - This session can't create tags, releases or Actions secrets, and can't edit
    a published release.
  - GitHub's GraphQL API is blocked, so `gh release …` and `gh workflow run` fail.
    Use REST through `gh api repos/stmoha/ncsender-plugin-gcode-reference/...`.
- Publish link: `https://github.com/stmoha/ncsender-plugin-gcode-reference/releases/new?tag=vX.Y.Z&target=main&title=G-code%20Explorer%20vX.Y.Z`.
  - Tell him to leave the notes box empty.
  - The **Build and Release Plugin** workflow then rebuilds, packages with
    `.scripts/package.sh`, attaches the ZIP, fills the notes from
    `latest_release.md` and posts to Discord.
  - For about a minute the release page shows the commit message instead of the
    notes. Then check the run (`gh api …/actions/runs?per_page=1`) and the asset.
- Discord:
  - The webhook is the Actions secret `DISCORD_WEBHOOK_URL`. Never write it into
    the repo, which is public.
  - The post uses the notes above `## Also new since`, with up to four `<img>`
    screenshots as a gallery (`.github/scripts/announce-discord.sh`; set
    `DRY_RUN=1` to print the post instead of sending it).
  - To re-post: `gh api -X POST repos/stmoha/ncsender-plugin-gcode-reference/actions/workflows/announce-discord.yml/dispatches -f ref=main -f 'inputs[tag]=vX.Y.Z'`.
- Registry (`siganberg/ncSender.plugins-registry`): updates come from GitHub
  releases through the manifest's `repository` field, so the listing's version
  text is cosmetic. To refresh it, push a branch to the `stmoha` fork and give
  him a compare link.
- Commit as `Claude <noreply@anthropic.com>`, not as Stefan.

## Code map
`commands.js` and `config.html` are **generated** by `node build/build.mjs` and
committed. Never edit them; rebuild after every source change.
- `gcode-database.js`:
  - `GCODE_DB` (G/M codes), `SYSTEM_DB` (`$` commands, comments such as
    `(MSG, …)`, plugin commands), `SETTINGS_DB` (numbered `$` settings) and
    `LETTER_DB`.
  - `CONTROLLER_SUPPORT` holds per-code support on grblHAL / Grbl 1.1 / FluidNC,
    built with `yes()` `part()` `ncs()` `no()`. The build merges it in as
    `support`.
  - `SETTING_NOTES` holds per-setting notes, including FluidNC `config.yaml`
    keys. The build merges it in as `ctrl`.
  - An entry's `params` drive the line explainer; its `keywords` drive search.
- `build/build.mjs` merges those tables and injects the Explorer panel into the
  dialog. It also stamps `__BUILD_ID__` (version + hash of the dialog and
  database).
- `build/dialog-core.html` is the whole dialog. Key functions:
  - Reference: `renderChips` (category column), `supportFor`/`renderSupport`.
  - G-code tab: `renderExplain`, `renderExplainOutput`, `loadGcodeFile`.
  - Mode badges: `modalStep`/`modalAt`/`modalBadges`, read from the file, not the
    machine.
  - Controller: `loadMachineSettings`. Shortcut setting: `initShortcut`.
  - One live instance: `rescue`/`adopt`, near the end.
- `build/navigator-panel.html` is the Explorer tab: the parser (`parseGcode`,
  which normalizes every line to mm), map, line analysis, creep, contour and jog,
  plus units (`applyUnits`, `refreshAppSettings`, `safeZCmd`).
- `build/commands-logic.js` is the pro-v2 entry, run by Jint. It handles console
  lookups (`?word`, `??line`, and `??` for the unfiltered Reference) and opens
  dialogs. `index.js` wraps the same logic for v1 / pro-v1.
- `manifest.json`: version, `repository`, `minAppVersion`.

## ncSender facts that matter here
- pro-v2 runs `commands.js` in Jint: one self-contained file, function
  declarations, no imports.
- The dialog is set as `v-html` in ncSender's `PluginDialog.vue`, and its scripts
  re-run on every open.
  - A scoped host rule styles **every** button (accent fill, padding, white
    text), so plugin buttons need `!important` or inline styles.
  - Source: github.com/siganberg/ncSender, `src/NcSender.Client/src/components/PluginDialog.vue`
    and `assets/styles/theme.css` (match these for the look).
- ncSender closes the dialog via ✕, Escape, a backdrop click, or
  `plugin:close-dialog`. Opens keep **one live instance** (`window.__gcodeExplorer`):
  - On close, the root moves into a hidden `#gex-holder` with `moveBefore`, which
    keeps the manual iframe and scroll positions.
  - The next open adopts it unless the build id differs.
  - The backdrop only dismisses on press **and** release outside.
- APIs used:
  - `/api/firmware`: protocol and settings, for controller checks.
  - `/api/settings`: Metric/Imperial and `keyboardBindings`. The shortcut is
    `keyboardBindings['Plugin:com.cncdocs.gcode-reference:open-explorer']`,
    written with PATCH; ncSender broadcasts `settings-changed`. Needs ncSender
    2.0.210+.
  - `/api/gcode-files/current/download`, plus `/api/gcode-job/status` for the
    file name. They're fetched side by side; the name of a big file arrives
    first.
  - `/api/server-state` (WPos, in mm), `/api/send-command`, and
    `/api/gcode-job/analyze-line` and `/start-from-line`.
- Units: the Explorer shows ncSender's Metric/Imperial setting. Files can switch
  G20/G21 midway, so the parser converts per line.
- Portrait (`@media (orientation: portrait)`): the G-code tab stacks the file
  above its definitions, and the Explorer puts the map on top with the control
  boxes in a row beneath.

## Tests
- Build first, then run `node test/run-all.mjs`, or pass a name filter:
  `node test/run-all.mjs e2e-units`.
- `async`, `commands` and `v1` run in plain Node.
- The `e2e-*` suites drive Chromium through Playwright in a stand-in ncSender
  (dialog CSS and a mock API). If Playwright is missing:
  `npm i --no-save playwright && npx playwright install chromium`.
- Screenshots and debug images go to `test/out/` (gitignored).
- Before a test ZIP, run everything. Add a check to the suite that covers what
  you changed.

## Gotchas
- `test/async.mjs` runs the dialog script in a fake DOM. Any new DOM or window
  API used at load time needs a stub there.
- In Playwright, `Shift+1` types "1". Use `Shift+Digit1`.
- In the Explorer, the Jog & Zero box sits **inside** the scrolling controls
  column; the old "pinned" CSS never applied.
  - In landscape at 1080 px tall, it's partly below the fold.
  - Fixing this was offered and is not done. Portrait lays the boxes out as a
    3-column grid.
- `config.html` is shown in two places:
  - The Tools-menu dialog, where ncSender replaces `__TOOL_MENU_LABEL__`.
  - Settings › Plugins (in an iframe), where the token stays literal and the page
    opens on the Settings tab (`build/config-template.html`).
  - Tests act as the dialog by replacing the token with split/join, because it
    appears more than once.

## Open items
- **Next update:** check ncSender's latest source and the plugins in the registry
  for `$` settings and `$` commands the database lacks. Stefan has spotted at
  least one new one (Nov 2026).
- Asked of Francis (siganberg) for the plugin API: right-click actions on
  G-code lines (GitHub Discussion #73 on siganberg/ncSender).
