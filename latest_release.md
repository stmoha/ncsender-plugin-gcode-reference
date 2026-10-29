## What's Changed

### 🧭 Knows which controller you have
ncSender now drives classic **Grbl 1.1** and **FluidNC** as well as grblHAL, and G-code Explorer follows along:
- Every G/M-code and `$` command shows a **Controllers** row: ✓ runs, ◐ runs with limits, ↻ ncSender handles it for you, ✗ not supported, for grblHAL, Grbl 1.1 and FluidNC
- Codes the connected controller can't run are marked **not on this controller**, with the reason (e.g. `G43 H` on Grbl: "use G43.1 Z<offset>")
- The **G-code** tab flags lines your controller can't run, and notes what ncSender does instead (e.g. `M6` on Grbl becomes a "Load tool" pause)
- Settings that work differently on Grbl 1.1 (`$4`, `$5`, `$10`, `$21`, `$22`, `$32`) explain how. On FluidNC, each numbered setting names the `config.yaml` key to change, since FluidNC's numbered settings are read-only
- The "not on this controller" explanation for settings now fits Grbl and FluidNC too

### 📚 New entries
- **`$C`**: check-mode dry run (all controllers)
- **22 FluidNC commands**: `$CD`, `$SS`, `$CMD`, `$S`, `$SC`, `$L`, `$A`, `$E`, `$MD`/`$ME`, `$Bye`, `$LocalFS/…`, `$SD/…`, `$Config/Filename`, `$Message/Level`, `$PL`, `$GD`, `$Limits`, `$T`, `$RM`, `$RI`, `$Heap`, `$NVX` (long names like `$Config/Dump` work too)
- **ncSender's pause dialog**: `(MSG, NCSENDER_PAUSE: Title | Message)` before an `M0`
- **`(MSG, …)` and `(PRINT, …)` / `(DEBUG, …)` comments**, which the G-code tab now recognizes instead of calling them plain comments
- **`M7.1` / `M8.1`**: FluidNC's separate mist/flood off
- **Sienci ATCi keepout**: `M960` (was `M810` on older ATCi builds, which still finds it) and settings `$683`–`$687`
- **Plugin commands**: `$ADB_GOTO` (AutoDustboot), `$PROBE` and `$MEASURE_TLO` (Pneumatic ATC), and Dust Docker's dock/attach/bypass macros and `#<_dust_boot_…>` state
- **`M98`** now explains ncSender's own macros (P9001–P9999) and the "Use controller macros" switch
- `$SLOT<n>` now also covers Pneumatic ATC

### 🔧 Fixes
- Setting notes that were in the database but never displayed now show (e.g. where older SLB firmware numbered a setting differently)
- The G-code tab no longer marks parameter assignments like `#<_depth> = 2.5` as invalid G-code
