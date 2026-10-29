## What's Changed in 2.1.1

### 📏 Explorer tab follows your units
The Explorer tab now uses the same units as ncSender's main window (Settings → Metric / Imperial), and switches when you change it:
- **Jog**: steps are 0.01 / 0.1 / 1 in and feeds 20–160 in/min in Imperial (0.1 / 1 / 10 mm and 500–4000 mm/min in Metric), and jogs are sent in those units
- **Line analysis, map menu and confirmations** show coordinates in your units, labeled, whatever units the G-code file uses
- **Safe Z**, the custom safe height, the status line, the Z filter and the contour perimeter are shown in your units
- **Start From Line**: approach and plunge are entered in your units and converted to the file's units for ncSender's resume engine (an inch file no longer gets a 500 in/min plunge from the mm default)
- **Rotary stock diameter** is entered in your units

### 🔧 Fixes
- **Spindle marker in the wrong place**: a mm file that switches to inches anywhere (for example a `G20` at the end to put an inch controller back) was treated as inches throughout, so the spindle marker sat about 25× too close to X0 Y0. Each line now uses the units in effect on that line, and the status line says when a file switches units
- Retract, Rapid to Point and Trace Contour no longer leave the controller in mm mode when ncSender is set to Imperial: moves are sent in your units, as ncSender's own moves are

---

## Also new since 2.0.1 (from 2.1.0, released the same day)

### 🧭 Knows which controller you have
ncSender now drives classic **Grbl 1.1** and **FluidNC** as well as grblHAL, and G-code Explorer follows along:
- Every G/M-code and `$` command shows a **Controllers** row (✓ runs, ◐ with limits, ↻ ncSender handles it, ✗ not supported) for grblHAL, Grbl 1.1 and FluidNC
- Codes the connected controller can't run are marked **not on this controller**, with the reason, and the **G-code** tab flags lines it can't run
- Settings that differ on Grbl 1.1 explain how; on FluidNC each numbered setting names the `config.yaml` key to change

### 📚 New entries
- `$C` check mode, 22 FluidNC `$` commands (`$CD`, `$SS`, `$LocalFS/…`, `$SD/…` …), ncSender's `NCSENDER_PAUSE` dialog, `(MSG, …)` / `(PRINT, …)` comments, FluidNC's `M7.1` / `M8.1`
- Sienci ATCi keepout: `M960` (formerly `M810`) and settings `$683`–`$687`
- Plugin commands: `$ADB_GOTO`, `$PROBE`, `$MEASURE_TLO`, Dust Docker's macros and state; `M98` explains ncSender's own macros

### 🔧 Fixes
- Setting notes that were never displayed now show
- Parameter assignments like `#<_depth> = 2.5` are no longer marked invalid
