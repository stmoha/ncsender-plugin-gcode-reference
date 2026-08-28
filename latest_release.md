## G-code Explorer 2.0

### 🧭 Renamed: G-code & grblHAL Reference → **G-code Explorer**
The plugin now does more than reference lookups, so the name grew with it. Same plugin id — existing installs update normally and keep their settings.

### ✨ New: Explorer tab (G-code Navigator, merged)
The standalone **G-code Navigator** plugin now lives inside G-code Explorer as the **Explorer** tab:
- Interactive **2D toolpath map** of the loaded job — snap to G-code lines graphically and jog the machine to them with safe-Z handling
- **Rubber-band contour tracing** to outline the cut area before committing
- **4th-axis unwrap** to visualize rotary jobs flat
- Opens via **Tools → G-code Explorer**; the map lives on the **Explorer** tab
- Navigator state (traced contours, analysis) persists while you switch to other tabs in the same dialog

**If you had the standalone G-code Navigator installed, uninstall it** — everything is in here now, and two copies means two Tools-menu entries.

### 🔧 Under the hood
- The Explorer pane loads lazily: terminal `?keyword` lookups don't pay its startup cost
- Tabs renamed: **G-code** (was Explain a line) and **Explorer** (the merged Navigator) — the tab row now reads Reference · G-code · Explorer · NC Manual · Settings
- G-code and Explorer tabs share the wide 1800px layout; NC Manual keeps its 1260px reading width
- Jump between them per line: the **⌖ map** button on any explained line shows it on the Explorer map; **explain ↗** next to the Explorer's line input goes the other way
- Explorer: Z-filter slider to hide high-Z travel moves, Z (with inferred-Z notes) in line analysis, creep marker survives zooming, compact 2×2 action buttons, single-scrollbar layout with the jog cluster pinned to the map's bottom edge
