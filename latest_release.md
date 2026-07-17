## What's Changed

### ✨ Initial Public Release
- Inline G-code, M-code and grblHAL settings documentation inside ncSender
- Terminal shortcuts: `?keyword` looks up docs, `??G1 X10 F500` explains a line word by word, `??` alone opens the full reference
- 360+ entries: grblHAL core dialect, canned cycles, probing, G65 macros, plugin M-codes, and all 251 numbered `$` settings through $772 (SLB/SLB-EXT firmware 20260525 aware, with legacy 5.0.x numbering notes)
- Live controller cross-check: entries are flagged "not on this controller" when your firmware build doesn't include them, and show the current value when it does
- Built-in browser for the official ncSender manual
- Category color-keys, theme-aware light/dark palettes, responsive two-row filter layout

### ✨ Explain from the loaded file
- The **Explain a line** tab shows the currently loaded G-code file with line numbers — click a line to explain it word by word, Shift+click for a range
- **Line jump control** in the file header: "Loaded file [255-275] of 16828 lines" — type a line number or range and press Enter to jump there
- The explanation pane is titled **G-Code Definitions**; every explained block shows its **file line number**, and clicking a block highlights and scrolls to that line in the file for easy orientation in long selections
- Loaded filename with a *reload* link; paste-in fallback when no file is loaded

### 🎨 Syntax coloring matching ncSender's G-Code Preview
- Same rules and palette as the built-in preview, including colored chained words (X0.5Y0.2 colors both)
- Explanation tables color each token (G/M/T/S/F/X/Y/Z/axis words) to match

### 🔧 Other
- File pane and explanation pane now scroll **independently** — the breakdown stays on screen while you scroll the G-code
- **Find in file**: search box above the file with match counter ("1 of 171"), next/previous (Enter / Shift+Enter), and clear — each match is selected and explained as you step through
- Manual tab renamed to **NC Manual**
- Terminal lookups now always list every match (the max-results setting is removed)
