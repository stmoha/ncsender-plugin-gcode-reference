# G-code & grblHAL Reference — ncSender Plugin

Inline G-code, M-code and grblHAL `$`-setting documentation inside [ncSender](https://github.com/siganberg/ncSender), inspired by OctoPrint's Marlin G-code Documentation plugin. Look commands up straight from the Console, get any line of G-code explained word by word, cross-check every setting against your actual controller, and browse the official ncSender manual — all without leaving the sender.

> Written for the grblHAL dialect, with first-class coverage of the Sienci SLB / SLB-EXT (including Main_grblHAL firmware 20260525 numbering and legacy 5.0.x notes). See *Controller applicability* below for other boards.

## Features

**Terminal shortcuts** (nothing is ever sent to the controller — the plugin intercepts and neutralizes the input):

| You type in the Console | You get |
| --- | --- |
| `?G38.2`, `?$110`, `?dwell`, `?tool change` | Documentation lookup, top hit auto-expanded |
| `??G1 X10 Y5 F500` | The line explained word by word, parameters annotated in context |
| `??` | The full reference, unfiltered |

A bare `?` (grblHAL's real-time status query) is never intercepted, and job/macro-sourced lines are never touched.

**Reference browser** — 360+ entries with search, per-category color-keyed filters, syntax, parameter tables, examples and tips. Covers the grblHAL core dialect (motion, coordinate systems, probing, canned cycles, G65 built-in macros), common plugin M-codes, grblHAL `$` system commands, and **251 numbered settings through $772** with SLB-EXT factory defaults.

**Live controller cross-check** — the plugin reads ncSender's cached `$ES`/`$$` enumeration (`/api/firmware`) and flags settings that don't exist on *your* firmware build, while showing the live current value of the ones that do.

**Explain a line** — paste a whole program and every line gets a word-by-word breakdown. Handles `$J=` jog bodies, `$110=5000` setting writes, `G10 L2`/`L20` combos, `G01`→`G1` normalization, and both comment styles.

**Manual tab** — the [official ncSender manual](https://siganberg.github.io/ncSender.manual/) embedded right in the dialog.

**Settings tab** — terminal-lookup options plus full source attribution and controller-applicability notes.

## Installation

**From the ncSender plugin registry** (once listed): Settings → Plugins → Install Plugin → pick *G-code & grblHAL Reference*.

**From a release ZIP**: download the latest ZIP from [Releases](../../releases), then ncSender → Settings → Plugins → Install Plugin → upload it.

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
- `build/dialog-core.html` — the shared UI (all four tabs)
- `build/commands-logic.js` — terminal interception logic
- `build/config-template.html` — thin wrapper choosing the default tab per context

```bash
node build/build.mjs
```

`index.js` adapts the same `commands.js` logic to the Node-based ncSender platforms (v1/pro-v1).

### Releasing

```bash
./.scripts/release.sh
```

Bumps the patch version in `manifest.json`, generates release notes, commits, tags, and pushes — the GitHub Actions pipeline then rebuilds the generated files, packages `<plugin-id>_<tag>.zip`, and publishes the release.

## Credits

Built by Stefan with [Claude](https://claude.ai) (Anthropic). Plugin structure, CI pipeline and packaging patterned on [siganberg's official ncSender plugins](https://github.com/siganberg/ncsender-plugin-autodustboot). Thanks to Francis (siganberg) for ncSender and the plugin API.

## License

MIT — see [LICENSE](LICENSE). Documentation sources retain their own licenses.
