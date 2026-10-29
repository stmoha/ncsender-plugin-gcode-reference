## What's Changed in 2.1.2

### 🧠 Picks up where you left off
- Close G-code Explorer and open it again, from the Tools menu or a Console lookup, and every tab is as you left it: the Reference search and scroll position, pasted code in the G-code tab, the Explorer map with its selected line and contour, the NC Manual page, and the tab you were on
- Switching between tabs keeps each tab's scroll position too
- Console lookups still open on what you asked for: `?word` searches the Reference, `??line` explains that line, `??` opens the Reference unfiltered
- If ncSender has a different G-code file loaded by then, the G-code and Explorer tabs switch to it
- While hidden, the Explorer no longer keeps asking ncSender for the machine position

### 📐 G-code tab: what each line really does
- Every explained line shows the modes it runs under, read from the lines before it in the file (not from the machine): **mm or inch**, **absolute or relative**, **G54–G59.3 or machine coordinates (G53)** and the **feed mode**; hover a badge to see which line set it. A dashed badge means the file never set it, so the controller's current mode applies
- Coordinates and feeds say it in words: `Z-0.381` = "-0.381 mm, absolute in G54 work coordinates", `F508` = "508 mm/min"
- Lines that lean on earlier lines are flagged: a move with no G0/G1 on it (and which one it repeats), a feed carried over from another line, a cut with the spindle off, an active G92 offset, a canned cycle still running

![G-code tab: lines 45-47 with their mode badges - mm, absolute, G54 or G53 machine coords, G1 carried over, F1016 from line 44](https://raw.githubusercontent.com/stmoha/ncsender-plugin-gcode-reference/791582d2883c6dd38f123a719d303b2c248e460d/.github/release-images/v2.1.2-gcode-modes.png)

### ⌨️ Keyboard shortcut from the plugin
- Settings → **Keyboard shortcut**: press the keys you want to open G-code Explorer from anywhere in ncSender. It's the same setting as ncSender's Settings → Controls → Plugins, and it warns if the keys are already in use (needs ncSender 2.0.210 or later)

![Settings tab: Keyboard shortcut set to Ctrl+Shift+E](https://raw.githubusercontent.com/stmoha/ncsender-plugin-gcode-reference/791582d2883c6dd38f123a719d303b2c248e460d/.github/release-images/v2.1.2-shortcut.png)

### 🖱️ No more accidental closing
- Selecting text or dragging a slider and letting go outside the dialog no longer closes it; it only closes when you both press and release outside (or use the ✕ / Escape)

### 🧭 NC Manual: Back, Forward and Home
- New buttons above the manual step back and forward through the pages you've visited, and jump to the manual's home page

### 🔎 Reference: categories in a column, one-click clear
- The categories now sit in a column on the left, like ncSender's Settings, with a count beside each showing how many entries match your search; the definitions get the full width beside them
- An **×** in the search box clears it and brings back the full list

![Reference tab: categories in a column with match counts, search for probe with the clear button](https://raw.githubusercontent.com/stmoha/ncsender-plugin-gcode-reference/791582d2883c6dd38f123a719d303b2c248e460d/.github/release-images/v2.1.2-reference.png)

---

## Also new since 2.0.1 (2.1.0 and 2.1.1, released this week)

### 📏 Explorer tab follows your units (2.1.1)
- Jog steps and feeds, Line Analysis, map menu, confirmations, Safe Z, Start From Line approach/plunge and the rotary stock diameter all use ncSender's Metric / Imperial setting, labeled, and switch when you change it
- Retract, Rapid to Point and Trace Contour send moves in your units, so the controller isn't left in mm mode when ncSender is set to Imperial
- Fixed: a mm file that switches to inches anywhere (e.g. a `G20` at the end) put the spindle marker about 25× too close to X0 Y0

### 🧭 Knows which controller you have (2.1.0)
- Every G/M-code and `$` command shows how it fares on grblHAL, classic Grbl 1.1 and FluidNC; codes the connected controller can't run are marked **not on this controller** with the reason, and the G-code tab flags them
- Settings that differ on Grbl 1.1 explain how; on FluidNC each numbered setting names the `config.yaml` key to change

### 📚 New entries (2.1.0)
- `$C` check mode, 22 FluidNC `$` commands (`$CD`, `$SS`, `$LocalFS/…`, `$SD/…` …), ncSender's `NCSENDER_PAUSE` dialog, `(MSG, …)` / `(PRINT, …)` comments, FluidNC's `M7.1` / `M8.1`
- Sienci ATCi keepout: `M960` (formerly `M810`) and settings `$683`–`$687`
- Plugin commands: `$ADB_GOTO`, `$PROBE`, `$MEASURE_TLO`, Dust Docker's macros and state; `M98` explains ncSender's own macros
