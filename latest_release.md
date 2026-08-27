## G-code Explorer 2.0

### 🧭 Renamed: G-code & grblHAL Reference → **G-code Explorer**
The plugin now does more than reference lookups, so the name grew with it. Same plugin id — existing installs update normally and keep their settings.

### ✨ New: Navigator tab (G-code Navigator, merged)
The standalone **G-code Navigator** plugin now lives inside G-code Explorer as its own tab:
- Interactive **2D toolpath map** of the loaded job — snap to G-code lines graphically and jog the machine to them with safe-Z handling
- **Rubber-band contour tracing** to outline the cut area before committing
- **4th-axis unwrap** to visualize rotary jobs flat
- Opens via **Tools → G-code Navigator** (straight to the tab) or **Tools → G-code Explorer**
- Navigator state (traced contours, analysis) persists while you switch to other tabs in the same dialog

**If you had the standalone G-code Navigator installed, uninstall it** — everything is in here now, and two copies means two Tools-menu entries.

### 🔧 Under the hood
- The Navigator loads lazily: terminal `?keyword` lookups don't pay its startup cost
- Explain a line and Navigator share the wide 1800px layout; NC Manual keeps its 1260px reading width
