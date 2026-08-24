## What's Changed

### ✨ Explain a line — rebuilt around the loaded file
- **Split view**: the G-code on the left, word-by-word **G-Code Definitions** on the right, each scrolling independently
- **Source toggle — Loaded file | Paste code**: browse the program currently loaded in ncSender, or paste any G-code and get the identical interface; pasted blocks are explained the moment you paste
- **No more 20,000-line limit** — the file list renders in chunks and loads more as you scroll, so files of any length can be browsed to the end; an **end ↓** link jumps straight to the last line
- **Find**: search box with match counter ("1 of 171"), Enter / Shift+Enter stepping (wraps around), each match selected and explained as you step
- **Line jump**: "Loaded file [255-275] of 16828 lines" — type a line number or range and press Enter to jump; stays in sync with any selection
- Every explanation block shows its **file line number**, and clicking a block highlights and scrolls to that line for easy orientation in long selections
- Terminal `??<line>` explanations open in Paste mode — numbered and browsable

### ✨ ncSender plugin commands documented
- New **Plugin codes** entries for the console commands other ncSender plugins provide, sourced from each plugin's repository:
  - `$TLS` — tool length setter probe cycle (Rapid Change ATC / Manual Tool Changer / Pneumatic ATC)
  - `$SLOT<n>` — rapid to magazine slot n (Rapid Change ATC); `$SLOT1`, `$slot03` etc. all resolve
  - `$POCKET1` — rapid to the manual tool-change pocket (Manual Tool Changer)
  - `$ADB_RETRACT` / `$ADB_EXPAND` — dust boot control (AutoDustboot)
- `$H` documentation notes the tool-changer plugins' optional TLS-after-home expansion
- `?slot`, `?pocket`, `?dust boot`, `??$SLOT3`, `??$TLS` etc. all work in the Console; each entry notes which plugin must be installed

### ✨ G-code validity checking
- Explanations now flag text that is not valid G-code: a per-line warning banner ("This line does not appear to be G-code" / "Parts of this line are not valid G-code") with the unrecognized fragments marked in red
- grblHAL macro syntax (o-words, `#<variables>`, `[expressions]`, IF/WHILE/EQ...) is recognized as valid, so pasted macro expansions don't false-positive

### 🔧 Layout
- Per-tab sizing on wide screens: **Explain a line** stretches up to 1800px so long G-code lines aren't clipped; **NC Manual** caps at 1260px (the manual's Material-for-MkDocs layout is fully rendered at that width — anything more is dead margin); Reference keeps its two-row filter width
- **Draggable divider** between the G-code pane and G-Code Definitions — grab it to rebalance (20–78%); long definition lines wrap instead of clipping, and long G-code lines ellipsize instead of stretching the pane
