# G-code Explorer

*(formerly "G-code & grblHAL Reference" — same plugin id, updates continue seamlessly)* — ncSender Plugin

G-code documentation, a line-by-line explainer, and an interactive toolpath navigator inside [ncSender](https://github.com/siganberg/ncSender). Look commands up straight from the Console, get any line of G-code explained word by word, cross-check every setting against your actual controller, snap to toolpath lines on a 2D map and jog the machine there, and browse the official ncSender manual — all without leaving the sender.

> Written for the grblHAL dialect, with first-class coverage of the Sienci SLB / SLB-EXT (including Main_grblHAL firmware 20260525 numbering and legacy 5.0.x notes). See *Controller applicability* below for other boards.

## Features

**Terminal shortcuts** (nothing is ever sent to the controller — the plugin intercepts and neutralizes the input):

| You type in the Console | You get |
| --- | --- |
| `?G38.2`, `?$110`, `?dwell`, `?tool change` | Documentation lookup, every match listed, top hit auto-expanded |
| `??G1 X10 Y5 F500` | The line explained word by word, parameters annotated in context |
| `??` | The full reference, unfiltered |

A bare `?` (grblHAL's real-time status query) is never intercepted, and job/macro-sourced lines are never touched.

**Reference browser** — 360+ entries with search, per-category color-keyed filters, syntax, parameter tables, examples and tips. Covers the grblHAL core dialect (motion, coordinate systems, probing, canned cycles, G65 built-in macros), grblHAL `$` system commands, **251 numbered settings through $772** with SLB-EXT factory defaults, and a **Plugin codes** category documenting both common plugin M-codes and the console commands other ncSender plugins provide — `$TLS`, `$SLOT<n>` (Rapid Change ATC), `$POCKET1` (Manual Tool Changer), and `$ADB_RETRACT`/`$ADB_EXPAND` (AutoDustboot).

<img width="997" height="637" alt="2026-07-12_16h15_29" src="https://github.com/user-attachments/assets/b29999d9-fc66-482f-aa44-da62158bb5ad" />

**Live controller cross-check** — the plugin reads ncSender's cached `$ES`/`$$` enumeration (`/api/firmware`) and flags settings that don't exist on *your* firmware build, while showing the live current value of the ones that do.

**Explain a line** — a split view: the G-code on the left, word-by-word **G-Code Definitions** on the right, each scrolling independently, with a draggable divider. Two sources, one interface: browse the **loaded file** (any length — the list loads in chunks as you scroll) or **paste code** and get the identical treatment. Find with match stepping, line jump ("Loaded file [255-275] of 16828 lines"), an end ↓ shortcut, numbered explanation blocks with click-to-locate, syntax coloring matching ncSender's G-Code Preview, and a validity checker that flags text that isn't G-code (grblHAL macro syntax is recognized as valid).

**Navigator** — an interactive 2D map of the loaded toolpath. Snap to G-code lines graphically and jog the machine to them with safe-Z handling, trace a rubber-band outline of the cut area, and unwrap 4th-axis jobs to see rotary toolpaths flat. Also opens directly via **Tools → G-code Navigator**. Navigator state persists while you switch tabs.

**NC Manual tab** — the [official ncSender manual](https://siganberg.github.io/ncSender.manual/) embedded right in the dialog.

**Settings tab** — the terminal-lookup toggle plus full source attribution and controller-applicability notes.

## Installation

**From the ncSender plugin registry**: in ncSender go to **Settings → Plugins → Install Plugin** and pick *G-code Explorer* (listed as *G-code & grblHAL Reference* until the registry entry is refreshed).

**From a release ZIP**: download the latest `com.cncdocs.gcode-reference_vX.Y.Z.zip` from the
[releases page](https://github.com/stmoha/ncsender-plugin-gcode-reference/releases),
then in ncSender: **Settings → Plugins → Install Plugin** → upload the ZIP.

**Upgrading from the standalone G-code Navigator?** Uninstall it — as of v2.0.0 the Navigator lives inside this plugin.

## Controller applicability

- **Sienci SLB / SLB-EXT (grblHAL)** — fully covered; defaults labeled, Sienci-specific settings included, Main_grblHAL renumbering noted (e.g. laser XY offset $741/$742 → $770/$771, laser signal invert $743 → $716).
- **Other grblHAL boards** — core G/M-codes and settings apply; Sienci-specific entries are simply flagged "not on this controller" by the live check.
- **FluidNC** — basic G-code entries mostly apply, but numbered `$` settings don't exist there (YAML config + `$/` tree commands); the live check reports settings unavailable.
- **Classic Grbl 1.1** — $0–$132 and core codes align; the rest is grblHAL-only.

## Documentation sources

Compiled from the [Sienci Labs SLB firmware documentation](https://resources.sienci.com/view/slb-firmware-flashing/), the [grblHAL core source](https://github.com/grblHAL/core) (canonical setting registry), and the [grblHAL community docs](https://petervanderwalt.github.io/grblhal_docs/). Concept inspired by the [OctoPrint Marlin G-code Documentation plugin](https://plugins.octoprint.org/plugins/marlingcodedocumentation/).

## Development

`commands.js` (the pro-v2 embedded-engine logic) and `config.html` are **generated** — edit the sources and rebuild:

- `gcode-database.js` — the documentation database (entry `params` drive the line explainer, `keywords` drive search)
- `build/dialog-core.html` — the shared UI (all tabs)
- `build/navigator-panel.html` — the Navigator pane (self-contained fragment, merged in at build time)
- `build/commands-logic.js` — terminal interception logic
- `build/config-template.html` — thin wrapper choosing the default tab per context

```bash
node build/build.mjs
```

`index.js` adapts the same `commands.js` logic to the Node-based ncSender platforms (v1/pro-v1).

### Releasing

See `RELEASING.md`. Short version: commit + push, then publish a GitHub release tagged `vX.Y.Z` — the Actions pipeline rebuilds, packages `<plugin-id>_<tag>.zip`, and attaches it; ncSender picks the update up automatically for every user.

## Credits

Built by Stefan with [Claude](https://claude.ai) (Anthropic). Plugin structure, CI pipeline and packaging patterned on [siganberg's official ncSender plugins](https://github.com/siganberg/ncsender-plugin-autodustboot). Thanks to Francis (siganberg) for ncSender and the plugin API.

## License

MIT — see [LICENSE](LICENSE). Documentation sources retain their own licenses.
