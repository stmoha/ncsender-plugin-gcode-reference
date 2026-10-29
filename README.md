# G-code Explorer

*(formerly "G-code & grblHAL Reference" — same plugin id, updates continue seamlessly)* — ncSender Plugin

Inline G-code, M-code and `$`-setting documentation for grblHAL, classic Grbl 1.1 and FluidNC inside [ncSender](https://github.com/siganberg/ncSender), inspired by OctoPrint's Marlin G-code Documentation plugin. Look commands up straight from the Console, get any line of G-code explained word by word (the **G-code** tab), cross-check every setting against your actual controller, and browse the official ncSender manual — all without leaving the sender.

> Written for the grblHAL dialect, with first-class coverage of the Sienci SLB / SLB-EXT (including Main_grblHAL firmware 20260525 numbering and legacy 5.0.x notes). Every entry also says how it fares on classic Grbl 1.1 and FluidNC — see *Controller applicability* below.

## Features

**Terminal shortcuts** (nothing is ever sent to the controller — the plugin intercepts and neutralizes the input):

| You type in the Console | You get |
| --- | --- |
| `?G38.2`, `?$110`, `?dwell`, `?tool change` | Documentation lookup, top hit auto-expanded |
| `??G1 X10 Y5 F500` | The line explained word by word, parameters annotated in context |
| `??` | The full reference, unfiltered |

A bare `?` (grblHAL's real-time status query) is never intercepted, and job/macro-sourced lines are never touched.

**Reference browser** — 400+ entries with search, a category column (with match counts) like ncSender's Settings, syntax, parameter tables, examples and tips. Covers the grblHAL core dialect (motion, coordinate systems, probing, canned cycles, G65 built-in macros), common plugin M-codes, ncSender's own codes (macros, the `NCSENDER_PAUSE` dialog), ncSender plugin commands (`$TLS`, `$SLOT<n>`, `$PROBE`, `$MEASURE_TLO`, `$ADB_…`, Dust Docker), grblHAL and FluidNC `$` system commands, and **256 numbered settings through $772** with SLB-EXT factory defaults.

<img width="997" height="637" alt="2026-07-12_16h15_29" src="https://github.com/user-attachments/assets/b29999d9-fc66-482f-aa44-da62158bb5ad" />

**Live controller cross-check** — the plugin reads `/api/firmware` to learn which controller is connected (grblHAL, Grbl 1.1 or FluidNC) and its settings list. It flags settings that don't exist on *your* firmware build, shows the live value of the ones that do, and marks G/M/`$` codes your controller can't run, with the reason. Each entry's **Controllers** row shows all three at a glance.

**Explorer tab** — an interactive 2D map of the loaded toolpath. Snap to G-code lines graphically and jog the machine to them with safe-Z handling, trace a rubber-band outline of the cut area, and unwrap 4th-axis jobs to see rotary toolpaths flat. Everything it shows and sends follows ncSender's Metric/Imperial setting, whatever units the file uses. Open **Tools → G-code Explorer** and pick the Explorer tab.

**G-code tab (explain a line)** — paste a whole program, or use the loaded file, and every line gets a word-by-word breakdown. Handles `$J=` jog bodies, `$110=5000` setting writes, FluidNC `$Long/Names`, `G10 L2`/`L20` combos, `G01`→`G1` normalization, parameter assignments, `(MSG, …)` / `(PRINT, …)` / `NCSENDER_PAUSE` comments, and both comment styles. With a controller connected, lines it can't run are flagged. Each line also shows the modes it runs under, read from the lines before it (mm/inch, absolute/relative, work or machine coordinates, feed mode), and calls out what it inherits: a repeated motion mode, a carried-over feed, a cut with the spindle off, an active G92 offset.

**Manual tab** — the [official ncSender manual](https://siganberg.github.io/ncSender.manual/) embedded right in the dialog, with Back, Forward and Home buttons.

**Picks up where you left off** — close the dialog and open it again (Tools menu or a Console lookup) and every tab is as you left it: search, scroll positions, pasted code, the Explorer map and selection, the manual page.

**Settings tab** — terminal-lookup options, the keyboard shortcut that opens G-code Explorer (shared with ncSender's Settings → Controls), plus full source attribution and controller-applicability notes.

**Portrait screens** — on a portrait display such as ncSender's 1080×1920 kiosk, the G-code tab stacks the file above its definitions and the Explorer puts the map on top with its controls in a row beneath; landscape keeps the side-by-side layout.

## Installation

**From the ncSender plugin registry**: in ncSender go to **Settings → Plugins → Install Plugin** and pick *G-code Explorer*. Installed copies update themselves from this repo's releases.

**From a release ZIP**: download the latest `com.cncdocs.gcode-reference_vX.Y.Z.zip` from the
[releases page](https://github.com/stmoha/ncsender-plugin-gcode-reference/releases),
then in ncSender: **Settings → Plugins → Install Plugin** → upload the ZIP.

## Controller applicability

- **Sienci SLB / SLB-EXT (grblHAL)** — fully covered; defaults labeled, Sienci-specific settings included (button macros, LEDs, spindle slots, ATCi keepout `$683`–`$687`), Main_grblHAL renumbering noted (e.g. laser XY offset $741/$742 → $770/$771, laser signal invert $743 → $716).
- **Other grblHAL boards** — core G/M-codes and settings apply; Sienci-specific entries are simply flagged "not on this controller" by the live check.
- **Classic Grbl 1.1** — ncSender translates for it (expressions, parameters and o-word IF/ELSE worked out by ncSender, `M6` turned into a "load tool" pause) and stops what Grbl can't run (`M62`–`M68`, `G43 H`, `G59.1`–`G59.3`, `G65`, override control, loops). The entries say which codes run, which ncSender handles, and how `$4`, `$5`, `$10`, `$21`, `$22` and `$32` differ.
- **FluidNC** — runs most grblHAL G-code as written (expressions, o-word flow control, `M62`–`M68` with pins in config.yaml, `M70`–`M73`); no canned cycles, tool table or `G65`. Its numbered settings are read-only copies of `config.yaml`, so their entries name the key to change. FluidNC's own `$` commands are included.

## Documentation sources

Compiled from the [Sienci Labs SLB firmware documentation](https://resources.sienci.com/view/slb-firmware-flashing/), the [grblHAL core source](https://github.com/grblHAL/core) (canonical setting registry), the [grblHAL community docs](https://petervanderwalt.github.io/grblhal_docs/), the [Grbl 1.1 wiki](https://github.com/gnea/grbl/wiki), the [FluidNC source](https://github.com/bdring/FluidNC), the [Sienci ATCi plugin](https://github.com/Sienci-Labs/sienci-atci-plugin), ncSender's Grbl/FluidNC support, and the ncSender plugin repositories for plugin commands. Descriptions are written in our own words. Concept inspired by the [OctoPrint Marlin G-code Documentation plugin](https://plugins.octoprint.org/plugins/marlingcodedocumentation/).

## Development

`commands.js` (the pro-v2 embedded-engine logic) and `config.html` are **generated** — edit the sources and rebuild:

- `gcode-database.js` — the documentation database (entry `params` drive the line explainer, `keywords` drive search; `CONTROLLER_SUPPORT` and `SETTING_NOTES` hold the Grbl 1.1 / FluidNC differences)
- `build/dialog-core.html` — the shared UI (all tabs)
- `build/navigator-panel.html` — the Explorer tab (2D toolpath map)
- `build/commands-logic.js` — terminal interception logic
- `build/config-template.html` — thin wrapper choosing the default tab per context

```bash
node build/build.mjs
```

`index.js` adapts the same `commands.js` logic to the Node-based ncSender platforms (v1/pro-v1).

### Releasing

Publishing a release with a version tag (`vX.Y.Z`, matching `manifest.json`) triggers the GitHub Actions pipeline, which rebuilds the generated files and attaches `<plugin-id>_<tag>.zip` (pushing just the tag works too: the pipeline then creates the release with `latest_release.md` as the notes). See [RELEASING.md](RELEASING.md) for the full checklist. `./.scripts/release.sh` does the bump-commit-tag-push in one go from a terminal.

## Credits

Built by Stefan with [Claude](https://claude.ai) (Anthropic). Plugin structure, CI pipeline and packaging patterned on [siganberg's official ncSender plugins](https://github.com/siganberg/ncsender-plugin-autodustboot). Thanks to Francis (siganberg) for ncSender and the plugin API.

## License

MIT — see [LICENSE](LICENSE). Documentation sources retain their own licenses.
