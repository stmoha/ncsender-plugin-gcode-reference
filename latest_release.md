## What's Changed

### ✨ Initial Public Release
- Inline G-code, M-code and grblHAL settings documentation inside ncSender
- Terminal shortcuts: `?keyword` looks up docs, `??G1 X10 F500` explains a line word by word, `??` alone opens the full reference
- 360+ entries: grblHAL core dialect, canned cycles, probing, G65 macros, plugin M-codes, and all 251 numbered `$` settings through $772 (SLB/SLB-EXT firmware 20260525 aware, with legacy 5.0.x numbering notes)
- Live controller cross-check: entries are flagged "not on this controller" when your firmware build doesn't include them, and show the current value when it does
- Built-in browser for the official ncSender manual
- Category color-keys, theme-aware light/dark palettes, responsive two-row filter layout
