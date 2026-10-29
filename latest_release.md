## What's Changed in 2.1.3

### 📱 Made for portrait screens
On a portrait screen, such as ncSender's 1080×1920 kiosk:
- The dialog uses more of the screen's height
- **G-code tab:** the file sits on top and its definitions get the full width underneath, instead of two narrow columns; drag the bar between them to give either one more room
- **Explorer tab:** the map spans the full width, with Line to check, Creep & Contour and Jog & Zero side by side beneath it, instead of a tall, narrow map
- Landscape screens look the same as before

Also on every screen:
- The bar between the G-code tab's panes can be dragged with a finger on a touchscreen
- The Explorer legend moves onto a second line when space is tight, instead of breaking each label in two

<p>
<img src="https://raw.githubusercontent.com/stmoha/ncsender-plugin-gcode-reference/cc7be8f2463dfe2f3e4b54926661efa697845b3a/.github/release-images/v2.1.3-gcode-modes.png" width="420" alt="G-code tab in portrait: file above, definitions below with mode badges">
<img src="https://raw.githubusercontent.com/stmoha/ncsender-plugin-gcode-reference/cc7be8f2463dfe2f3e4b54926661efa697845b3a/.github/release-images/v2.1.3-explorer.png" width="420" alt="Explorer tab in portrait: map on top, controls in a row beneath">
</p>

---

## Also new since 2.0.1 (2.1.0, 2.1.1 and 2.1.2, released this week)

### 🧠 Picks up where you left off (2.1.2)
- Close G-code Explorer and open it again, from the Tools menu or a Console lookup, and every tab is as you left it: the Reference search and scroll position, pasted code in the G-code tab, the Explorer map with its selected line and contour, the NC Manual page, and the tab you were on
- Switching between tabs keeps each tab's scroll position too
- Console lookups still open on what you asked for: `?word` searches the Reference, `??line` explains that line, `??` opens the Reference unfiltered
- If ncSender has a different G-code file loaded by then, the G-code and Explorer tabs switch to it
- While hidden, the Explorer no longer keeps asking ncSender for the machine position

### 📐 G-code tab: what each line really does (2.1.2)
- Every explained line shows the modes it runs under, read from the lines before it in the file (not from the machine): **mm or inch**, **absolute or relative**, **G54–G59.3 or machine coordinates (G53)** and the **feed mode**; hover a badge to see which line set it. A dashed badge means the file never set it, so the controller's current mode applies
- Coordinates and feeds say it in words: `Z-0.381` = "-0.381 mm, absolute in G54 work coordinates", `F508` = "508 mm/min"
- Lines that lean on earlier lines are flagged: a move with no G0/G1 on it (and which one it repeats), a feed carried over from another line, a cut with the spindle off, an active G92 offset, a canned cycle still running (pictured above)

### ⌨️ Keyboard shortcut from the plugin (2.1.2)
- Settings → **Keyboard shortcut**: press the keys you want to open G-code Explorer from anywhere in ncSender. It's the same setting as ncSender's Settings → Controls → Plugins, and it warns if the keys are already in use (needs ncSender 2.0.210 or later)

<img src="https://raw.githubusercontent.com/stmoha/ncsender-plugin-gcode-reference/cc7be8f2463dfe2f3e4b54926661efa697845b3a/.github/release-images/v2.1.3-shortcut.png" width="420" alt="Settings tab: Keyboard shortcut set to Ctrl+Shift+E">

### 🖱️ No more accidental closing (2.1.2)
- Selecting text or dragging a slider and letting go outside the dialog no longer closes it; it only closes when you both press and release outside (or use the ✕ / Escape)

### 🧭 NC Manual: Back, Forward and Home (2.1.2)
- New buttons above the manual step back and forward through the pages you've visited, and jump to the manual's home page

### 🔎 Reference: categories in a column, one-click clear (2.1.2)
- The categories now sit in a column on the left, like ncSender's Settings, with a count beside each showing how many entries match your search; the definitions get the full width beside them
- An **×** in the search box clears it and brings back the full list

<img src="https://raw.githubusercontent.com/stmoha/ncsender-plugin-gcode-reference/cc7be8f2463dfe2f3e4b54926661efa697845b3a/.github/release-images/v2.1.3-reference.png" width="420" alt="Reference tab: categories in a column with match counts">

### 📏 Explorer tab follows your units (2.1.1)
The Explorer tab now uses the same units as ncSender's main window (Settings → Metric / Imperial), and switches when you change it:
- **Jog**: steps are 0.01 / 0.1 / 1 in and feeds 20–160 in/min in Imperial (0.1 / 1 / 10 mm and 500–4000 mm/min in Metric), and jogs are sent in those units
- **Line analysis, map menu and confirmations** show coordinates in your units, labeled, whatever units the G-code file uses
- **Safe Z**, the custom safe height, the status line, the Z filter and the contour perimeter are shown in your units
- **Start From Line**: approach and plunge are entered in your units and converted to the file's units for ncSender's resume engine (an inch file no longer gets a 500 in/min plunge from the mm default)
- **Rotary stock diameter** is entered in your units

### 🔧 Fixes (2.1.1)
- **Spindle marker in the wrong place**: a mm file that switches to inches anywhere (for example a `G20` at the end to put an inch controller back) was treated as inches throughout, so the spindle marker sat about 25× too close to X0 Y0. Each line now uses the units in effect on that line, and the status line says when a file switches units
- Retract, Rapid to Point and Trace Contour no longer leave the controller in mm mode when ncSender is set to Imperial: moves are sent in your units, as ncSender's own moves are

### 🧭 Knows which controller you have (2.1.0)
ncSender now drives classic **Grbl 1.1** and **FluidNC** as well as grblHAL, and G-code Explorer follows along:
- Every G/M-code and `$` command shows a **Controllers** row: ✓ runs, ◐ runs with limits, ↻ ncSender handles it for you, ✗ not supported, for grblHAL, Grbl 1.1 and FluidNC
- Codes the connected controller can't run are marked **not on this controller**, with the reason (e.g. `G43 H` on Grbl: "use G43.1 Z<offset>")
- The **G-code** tab flags lines your controller can't run, and notes what ncSender does instead (e.g. `M6` on Grbl becomes a "Load tool" pause)
- Settings that work differently on Grbl 1.1 (`$4`, `$5`, `$10`, `$21`, `$22`, `$32`) explain how. On FluidNC, each numbered setting names the `config.yaml` key to change, since FluidNC's numbered settings are read-only
- The "not on this controller" explanation for settings now fits Grbl and FluidNC too

### 📚 New entries (2.1.0)
- **`$C`**: check-mode dry run (all controllers)
- **22 FluidNC commands**: `$CD`, `$SS`, `$CMD`, `$S`, `$SC`, `$L`, `$A`, `$E`, `$MD`/`$ME`, `$Bye`, `$LocalFS/…`, `$SD/…`, `$Config/Filename`, `$Message/Level`, `$PL`, `$GD`, `$Limits`, `$T`, `$RM`, `$RI`, `$Heap`, `$NVX` (long names like `$Config/Dump` work too)
- **ncSender's pause dialog**: `(MSG, NCSENDER_PAUSE: Title | Message)` before an `M0`
- **`(MSG, …)` and `(PRINT, …)` / `(DEBUG, …)` comments**, which the G-code tab now recognizes instead of calling them plain comments
- **`M7.1` / `M8.1`**: FluidNC's separate mist/flood off
- **Sienci ATCi keepout**: `M960` (was `M810` on older ATCi builds, which still finds it) and settings `$683`–`$687`
- **Plugin commands**: `$ADB_GOTO` (AutoDustboot), `$PROBE` and `$MEASURE_TLO` (Pneumatic ATC), and Dust Docker's dock/attach/bypass macros and `#<_dust_boot_…>` state
- **`M98`** now explains ncSender's own macros (P9001–P9999) and the "Use controller macros" switch
- `$SLOT<n>` now also covers Pneumatic ATC

### 🔧 Fixes (2.1.0)
- Setting notes that were in the database but never displayed now show (e.g. where older SLB firmware numbered a setting differently)
- The G-code tab no longer marks parameter assignments like `#<_depth> = 2.5` as invalid G-code
