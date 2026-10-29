/**
 * gcode-database.js
 * ------------------------------------------------------------------
 * Documentation database for the G-code Explorer plugin.
 *
 * Content is organized into these exports:
 *   GCODE_DB    - G-codes, M-codes and plugin M-codes
 *   SETTINGS_DB - grblHAL numbered settings ($0, $110, ...)
 *   SYSTEM_DB   - grblHAL system/$ commands ($H, $X, $J=, ...) plus
 *                 FluidNC's own $ commands
 *   LETTER_DB   - generic word letters (X, F, S, P, ...) used as a
 *                 fallback by the line explainer when a command entry
 *                 does not define a specific meaning for a letter
 *   CONTROLLER_SUPPORT - which G/M/$ codes run on classic Grbl 1.1 and
 *                 FluidNC (grblHAL is the baseline); merged into the
 *                 entries at build time as `support`
 *   SETTING_NOTES - how numbered settings differ on Grbl 1.1 and
 *                 FluidNC; merged into the settings as `ctrl`
 *
 * Each GCODE_DB entry:
 *   code     - canonical command ("G38.2", "M6")
 *   aliases  - other spellings that should match ("G01" for "G1")
 *   name     - short human name
 *   category - one of: motion, coords, spindle, coolant, tool,
 *              program, modes, io, probing, cycles, plugin
 *   modal    - modal group name, or null for non-modal commands
 *   desc     - plain-language description
 *   syntax   - usage pattern
 *   params   - { LETTER: "meaning of this letter for THIS command" }
 *              (drives the per-word breakdown in the explainer)
 *   example  - a short runnable example
 *   tips     - practical notes / gotchas
 *   keywords - lowercase search terms for ?keyword lookup
 *
 * Descriptions are summarized from the grblHAL community reference:
 * https://petervanderwalt.github.io/grblhal_docs/
 * ------------------------------------------------------------------
 */

export const GCODE_DB = [
 {
  "code": "G0",
  "aliases": [
   "G00"
  ],
  "name": "Rapid Positioning",
  "category": "motion",
  "modal": "Motion Mode",
  "desc": "Moves at the machine's maximum travel rate to the target position. Non-cutting move used to reposition quickly between operations. The F word is ignored; speed comes from $110-$115 max rates.",
  "syntax": "G0 <axes>",
  "params": {
   "X": "Target X coordinate",
   "Y": "Target Y coordinate",
   "Z": "Target Z coordinate",
   "A": "Target A (rotary) coordinate",
   "B": "Target B coordinate",
   "C": "Target C coordinate"
  },
  "example": "G90 G0 X100 Y50",
  "tips": "Retract Z to a safe height before rapid XY moves. Modal: stays active until another motion command (G1/G2/G3...) is issued.",
  "keywords": [
   "rapid",
   "move",
   "travel",
   "position",
   "fast",
   "jog"
  ]
 },
 {
  "code": "G1",
  "aliases": [
   "G01"
  ],
  "name": "Linear Interpolation (Feed Move)",
  "category": "motion",
  "modal": "Motion Mode",
  "desc": "Straight-line move at the programmed feed rate. The primary command for cutting and engraving. All specified axes move in a coordinated straight line.",
  "syntax": "G1 <axes> F<feed>",
  "params": {
   "X": "Target X coordinate",
   "Y": "Target Y coordinate",
   "Z": "Target Z coordinate",
   "A": "Target A coordinate",
   "B": "Target B coordinate",
   "C": "Target C coordinate",
   "F": "Feed rate (units/min in G94)"
  },
  "example": "G1 X200 F500",
  "tips": "F is modal — once set it applies to all following feed moves. A feed rate must be active or the move errors out.",
  "keywords": [
   "linear",
   "cut",
   "feed",
   "straight",
   "line",
   "mill",
   "engrave"
  ]
 },
 {
  "code": "G2",
  "aliases": [
   "G02"
  ],
  "name": "Arc — Clockwise",
  "category": "motion",
  "modal": "Motion Mode",
  "desc": "Clockwise circular arc at the current feed rate on the active plane (G17/G18/G19). Adding the off-plane axis produces helical motion. Defined by center offsets (I/J/K) or radius (R).",
  "syntax": "G2 X- Y- (I- J- | R-) F-",
  "params": {
   "X": "Arc end X",
   "Y": "Arc end Y",
   "Z": "Arc end Z (helical if off-plane)",
   "I": "X offset from start point to arc center",
   "J": "Y offset from start point to arc center",
   "K": "Z offset from start point to arc center",
   "R": "Arc radius (alternative to IJK)",
   "P": "Number of full circles",
   "F": "Feed rate"
  },
  "example": "G17 G2 X10 Y10 I10 J0 F200",
  "tips": "IJK center-offset form is preferred — it is unambiguous. In R form, positive R gives the shorter (<180°) arc, negative R the longer one.",
  "keywords": [
   "arc",
   "circle",
   "clockwise",
   "cw",
   "helix",
   "helical",
   "radius",
   "curve"
  ]
 },
 {
  "code": "G3",
  "aliases": [
   "G03"
  ],
  "name": "Arc — Counter-Clockwise",
  "category": "motion",
  "modal": "Motion Mode",
  "desc": "Counter-clockwise circular arc at the current feed rate on the active plane. Otherwise identical to G2, including IJK/R forms and helical motion.",
  "syntax": "G3 X- Y- (I- J- | R-) F-",
  "params": {
   "X": "Arc end X",
   "Y": "Arc end Y",
   "Z": "Arc end Z (helical if off-plane)",
   "I": "X offset to arc center",
   "J": "Y offset to arc center",
   "K": "Z offset to arc center",
   "R": "Arc radius (alternative to IJK)",
   "P": "Number of full circles",
   "F": "Feed rate"
  },
  "example": "G3 X20 Y0 R10 F200",
  "tips": "Direction is judged looking at the active plane from the positive side of its normal axis (for G17, looking down at XY).",
  "keywords": [
   "arc",
   "circle",
   "counterclockwise",
   "ccw",
   "helix",
   "curve"
  ]
 },
 {
  "code": "G4",
  "aliases": [
   "G04"
  ],
  "name": "Dwell (Pause)",
  "category": "motion",
  "modal": null,
  "desc": "Pauses motion for a set time. Spindle, coolant and other outputs keep their current state. Useful for letting a spindle spin up or clearing chips at hole bottom.",
  "syntax": "G4 P<seconds>",
  "params": {
   "P": "Dwell time in seconds (decimals allowed)"
  },
  "example": "M3 S18000\nG4 P2  ; wait 2s for spindle spin-up",
  "tips": "Non-modal — only affects its own block. Any queued motion completes before the pause begins.",
  "keywords": [
   "dwell",
   "pause",
   "wait",
   "delay",
   "sleep",
   "timer"
  ]
 },
 {
  "code": "G5",
  "aliases": [
   "G5.1"
  ],
  "name": "Spline Interpolation",
  "category": "motion",
  "modal": "Motion Mode",
  "desc": "Moves along a quadratic (G5) or cubic (G5.1) spline defined by control points, producing smoother free-form curves than arcs. Nearly always generated by CAM rather than written by hand.",
  "syntax": "G5 X- Y- I- J- P- | G5.1 X- Y- I- J- K- L-",
  "params": {
   "X": "Spline end X",
   "Y": "Spline end Y",
   "Z": "Spline end Z",
   "I": "Control point offset",
   "J": "Control point offset",
   "K": "Control point (cubic)",
   "L": "Control point (cubic)",
   "P": "Second control point (G5)",
   "F": "Feed rate"
  },
  "example": "G5 X20 Y10 I10 J15 F100",
  "tips": "Elliptical arcs cannot be produced by combining splines with G51 scaling.",
  "keywords": [
   "spline",
   "curve",
   "bezier",
   "smooth",
   "nurbs"
  ]
 },
 {
  "code": "G7",
  "aliases": [],
  "name": "Lathe Diameter Mode",
  "category": "modes",
  "modal": "Lathe Mode",
  "desc": "Lathe only ($32=2): X-axis values are interpreted as workpiece diameters. G1 X50 moves the tool to produce a 50-unit diameter.",
  "syntax": "G7",
  "params": {},
  "example": "G7\nG0 X20 Z0",
  "tips": "Most lathe CAM outputs diameter mode. Machine coordinates always display as radius.",
  "keywords": [
   "lathe",
   "diameter",
   "turning"
  ]
 },
 {
  "code": "G8",
  "aliases": [],
  "name": "Lathe Radius Mode",
  "category": "modes",
  "modal": "Lathe Mode",
  "desc": "Lathe only ($32=2): X-axis values are interpreted as radii. G1 X25 produces a 50-unit diameter.",
  "syntax": "G8",
  "params": {},
  "example": "G8\nG0 X25 Z0",
  "tips": "Set G7 or G8 explicitly at the top of every lathe program.",
  "keywords": [
   "lathe",
   "radius",
   "turning"
  ]
 },
 {
  "code": "G10 L2",
  "aliases": [
   "G10"
  ],
  "name": "Set WCS Origin (Absolute)",
  "category": "coords",
  "modal": null,
  "desc": "Programmatically sets a work coordinate system origin relative to the machine origin. P selects the WCS (P1=G54 ... P9=G59.3). Values persist across resets.",
  "syntax": "G10 L2 P<1-9> <axes>",
  "params": {
   "L": "Data mode: 2 = absolute from machine zero",
   "P": "WCS number: 1=G54, 2=G55 ... 9=G59.3",
   "X": "New origin X (machine coords)",
   "Y": "New origin Y",
   "Z": "New origin Z"
  },
  "example": "G10 L2 P2 X100 Y250.5 Z-20  ; set G55 origin",
  "tips": "Omitted axes are left unchanged. Great for repeatable multi-fixture setups.",
  "keywords": [
   "work offset",
   "wcs",
   "zero",
   "origin",
   "coordinate",
   "fixture",
   "g54",
   "set zero"
  ]
 },
 {
  "code": "G10 L20",
  "aliases": [],
  "name": "Set WCS Origin (From Current Position)",
  "category": "coords",
  "modal": null,
  "desc": "Sets a work coordinate system origin so the machine's current position becomes the given coordinate. \"Make here X0 Y0\" — this is what most senders send when you click Zero.",
  "syntax": "G10 L20 P<1-9> <axes>",
  "params": {
   "L": "Data mode: 20 = relative to current position",
   "P": "WCS number: 1=G54 ... 9=G59.3",
   "X": "Value current X should read",
   "Y": "Value current Y should read",
   "Z": "Value current Z should read"
  },
  "example": "G10 L20 P1 X0 Y0  ; current spot becomes G54 X0 Y0",
  "tips": "Preferred over G92 for zeroing — the offset is stored in the WCS and survives resets.",
  "keywords": [
   "zero",
   "touch off",
   "work offset",
   "wcs",
   "origin",
   "set zero",
   "xyz zero"
  ]
 },
 {
  "code": "G17",
  "aliases": [],
  "name": "XY Plane Select",
  "category": "modes",
  "modal": "Plane Select",
  "desc": "Selects the XY plane for arcs, cutter compensation and canned cycles. Default on startup. Arcs use I (X offset) and J (Y offset).",
  "syntax": "G17",
  "params": {},
  "example": "G17\nG2 X10 Y15 I5 J0 F300",
  "tips": "Set the plane explicitly at program start; arcs on the wrong plane move in surprising directions.",
  "keywords": [
   "plane",
   "xy",
   "arc plane"
  ]
 },
 {
  "code": "G18",
  "aliases": [],
  "name": "XZ Plane Select",
  "category": "modes",
  "modal": "Plane Select",
  "desc": "Selects the XZ plane (lathes, side profiling). Arcs use I (X offset) and K (Z offset).",
  "syntax": "G18",
  "params": {},
  "example": "G18\nG3 X20 Z-5 I10 K0 F250",
  "tips": null,
  "keywords": [
   "plane",
   "xz",
   "lathe plane"
  ]
 },
 {
  "code": "G19",
  "aliases": [],
  "name": "YZ Plane Select",
  "category": "modes",
  "modal": "Plane Select",
  "desc": "Selects the YZ plane. Arcs use J (Y offset) and K (Z offset).",
  "syntax": "G19",
  "params": {},
  "example": "G19\nG2 Y10 Z-2 J5 K0 F250",
  "tips": null,
  "keywords": [
   "plane",
   "yz"
  ]
 },
 {
  "code": "G20",
  "aliases": [],
  "name": "Inch Units",
  "category": "modes",
  "modal": "Units",
  "desc": "All coordinates, offsets and feed rates are interpreted as inches (feeds in inches/min).",
  "syntax": "G20",
  "params": {},
  "example": "G20\nG1 X4 F20",
  "tips": "Put G20 or G21 at the top of every file — a 10 mm move read as 10 inches is a crash. Display units are separate ($13).",
  "keywords": [
   "inch",
   "inches",
   "imperial",
   "units"
  ]
 },
 {
  "code": "G21",
  "aliases": [],
  "name": "Millimeter Units",
  "category": "modes",
  "modal": "Units",
  "desc": "All coordinates, offsets and feed rates are interpreted as millimeters (feeds in mm/min).",
  "syntax": "G21",
  "params": {},
  "example": "G21\nG1 X100 F500",
  "tips": "Interpreter units only — does not change steps/mm calibration ($100-$102) or the report units ($13).",
  "keywords": [
   "mm",
   "millimeter",
   "metric",
   "units"
  ]
 },
 {
  "code": "G28",
  "aliases": [],
  "name": "Go to Stored Position 1",
  "category": "coords",
  "modal": null,
  "desc": "Rapid move to the position stored by G28.1 (in machine coordinates). With axis words, first moves through that intermediate point, then to the stored position.",
  "syntax": "G28 [<axes>]",
  "params": {
   "X": "Intermediate X before final move",
   "Y": "Intermediate Y",
   "Z": "Intermediate Z"
  },
  "example": "G53 G0 Z0\nG28  ; retract, then go to park position",
  "tips": "DANGER: only use on a homed machine — the stored position is in machine coordinates. G28 Z0 lifts Z (in the current WCS) before traveling.",
  "keywords": [
   "park",
   "home position",
   "stored position",
   "safe position",
   "predefined"
  ]
 },
 {
  "code": "G28.1",
  "aliases": [],
  "name": "Store Position 1",
  "category": "coords",
  "modal": null,
  "desc": "Saves the machine's current absolute position as the G28 target. Persists across resets and power cycles.",
  "syntax": "G28.1",
  "params": {},
  "example": "G53 G0 X-50 Y-50 Z-5\nG28.1",
  "tips": "Move with G53 first so the stored spot is independent of work offsets. Takes no axis words.",
  "keywords": [
   "store",
   "save position",
   "park",
   "set park"
  ]
 },
 {
  "code": "G30",
  "aliases": [],
  "name": "Go to Stored Position 2",
  "category": "coords",
  "modal": null,
  "desc": "Same as G28 but uses the second stored position (set by G30.1). Commonly used for a tool-change or probing location.",
  "syntax": "G30 [<axes>]",
  "params": {
   "X": "Intermediate X",
   "Y": "Intermediate Y",
   "Z": "Intermediate Z"
  },
  "example": "G30",
  "tips": "Only use on a homed machine.",
  "keywords": [
   "park",
   "second position",
   "tool change position",
   "stored position"
  ]
 },
 {
  "code": "G30.1",
  "aliases": [],
  "name": "Store Position 2",
  "category": "coords",
  "modal": null,
  "desc": "Saves the current absolute machine position as the G30 target.",
  "syntax": "G30.1",
  "params": {},
  "example": "G53 G0 X-200 Y-400 Z-10\nG30.1",
  "tips": null,
  "keywords": [
   "store",
   "save position",
   "set park"
  ]
 },
 {
  "code": "G53",
  "aliases": [],
  "name": "Move in Machine Coordinates",
  "category": "coords",
  "modal": null,
  "desc": "For one block only, moves in the absolute machine coordinate system, ignoring all work offsets, G92 and tool offsets. Must be combined with G0 or G1.",
  "syntax": "G53 G0 <axes> | G53 G1 <axes> F-",
  "params": {
   "X": "Machine X target",
   "Y": "Machine Y target",
   "Z": "Machine Z target",
   "F": "Feed rate (with G1)"
  },
  "example": "G53 G0 Z0  ; retract Z fully, regardless of offsets",
  "tips": "G53 G0 Z0 is one of the safest moves in G-code — but only on a homed machine. Reverts to the active WCS on the next line.",
  "keywords": [
   "machine coordinates",
   "absolute",
   "retract",
   "safe move",
   "ignore offsets"
  ]
 },
 {
  "code": "G54",
  "aliases": [
   "G55",
   "G56",
   "G57",
   "G58",
   "G59",
   "G59.1",
   "G59.2",
   "G59.3"
  ],
  "name": "Work Coordinate Systems",
  "category": "coords",
  "modal": "WCS",
  "desc": "Selects one of nine work coordinate systems (G54-G59.3), each with its own user-set origin. Separates the program zero from machine home. G54 is the default.",
  "syntax": "G54 | G55 | ... | G59.3",
  "params": {},
  "example": "G54\n(run part 1)\nG55\n(run same file on fixture 2)",
  "tips": "Origins are set with G10 L2/L20 or the Zero buttons and are stored persistently. G59.3 doubles as the tool change position in tool change modes 2 & 3.",
  "keywords": [
   "wcs",
   "work coordinate",
   "offset",
   "g55",
   "g56",
   "g57",
   "g58",
   "g59",
   "fixture",
   "datum"
  ]
 },
 {
  "code": "G92",
  "aliases": [],
  "name": "Temporary Coordinate Offset",
  "category": "coords",
  "modal": "G92 Offset",
  "desc": "Applies a volatile offset so the current position reads as the given values (\"you are now X0 Y0\"). Applied on top of the active WCS. Cleared by G92.1.",
  "syntax": "G92 <axes>",
  "params": {
   "X": "Value current X should read",
   "Y": "Value current Y should read",
   "Z": "Value current Z should read",
   "A": "Value current A should read"
  },
  "example": "G92 X0 Y0 Z0",
  "tips": "Easy to forget and a common crash cause — prefer G10 L20 with a spare WCS. $384 controls whether the offset persists across resets.",
  "keywords": [
   "offset",
   "temporary zero",
   "shift",
   "coordinate offset"
  ]
 },
 {
  "code": "G92.1",
  "aliases": [
   "G92.2",
   "G92.3"
  ],
  "name": "Clear / Suspend / Restore G92",
  "category": "coords",
  "modal": "G92 Offset",
  "desc": "G92.1 clears the G92 offset (and zeroes the stored values). G92.2 suspends it without erasing. G92.3 re-applies a suspended offset.",
  "syntax": "G92.1 | G92.2 | G92.3",
  "params": {},
  "example": "G92.1  ; back to the plain G54 system",
  "tips": null,
  "keywords": [
   "clear offset",
   "cancel g92",
   "reset offset"
  ]
 },
 {
  "code": "G38.2",
  "aliases": [],
  "name": "Probe Toward (Error on Miss)",
  "category": "probing",
  "modal": null,
  "desc": "Moves toward the target until the probe input triggers, then stops and records the trigger position. Raises an error if the target is reached without contact.",
  "syntax": "G38.2 <axes> F<feed>",
  "params": {
   "X": "Probe travel limit X",
   "Y": "Probe travel limit Y",
   "Z": "Probe travel limit Z",
   "F": "Probing feed rate"
  },
  "example": "G91 G38.2 Z-20 F100  ; probe down max 20mm",
  "tips": "Probe fast to find the surface, back off, then re-probe slowly for accuracy. The trigger position is reported and stored in probe parameters (see $# output, PRB).",
  "keywords": [
   "probe",
   "touch",
   "toolsetter",
   "surface",
   "zero probe",
   "touch plate",
   "probing"
  ]
 },
 {
  "code": "G38.3",
  "aliases": [],
  "name": "Probe Toward (No Error on Miss)",
  "category": "probing",
  "modal": null,
  "desc": "Like G38.2, but completing the move without contact is not an error. Useful for checking whether something is present.",
  "syntax": "G38.3 <axes> F<feed>",
  "params": {
   "X": "Probe travel limit X",
   "Y": "Probe travel limit Y",
   "Z": "Probe travel limit Z",
   "F": "Probing feed rate"
  },
  "example": "G38.3 Z-10 F150",
  "tips": "Check the probe result flag in the report to see whether contact happened.",
  "keywords": [
   "probe",
   "optional",
   "check",
   "detect",
   "probing"
  ]
 },
 {
  "code": "G38.4",
  "aliases": [],
  "name": "Probe Away (Error on Fail)",
  "category": "probing",
  "modal": null,
  "desc": "Moves away until the probe input releases (loses contact). Errors if the probe starts un-triggered or never releases within the move.",
  "syntax": "G38.4 <axes> F<feed>",
  "params": {
   "X": "Travel limit X",
   "Y": "Travel limit Y",
   "Z": "Travel limit Z",
   "F": "Probing feed rate"
  },
  "example": "G91 G38.4 Z5 F100",
  "tips": null,
  "keywords": [
   "probe away",
   "release",
   "retract probe",
   "probing"
  ]
 },
 {
  "code": "G38.5",
  "aliases": [],
  "name": "Probe Away (No Error on Fail)",
  "category": "probing",
  "modal": null,
  "desc": "Like G38.4 but does not error if the probe never releases within the move.",
  "syntax": "G38.5 <axes> F<feed>",
  "params": {
   "X": "Travel limit X",
   "Y": "Travel limit Y",
   "Z": "Travel limit Z",
   "F": "Probing feed rate"
  },
  "example": "G38.5 G91 Z50 F200",
  "tips": null,
  "keywords": [
   "probe away",
   "optional",
   "probing"
  ]
 },
 {
  "code": "G40",
  "aliases": [],
  "name": "Cancel Cutter Compensation",
  "category": "tool",
  "modal": "Cutter Comp",
  "desc": "Disables cutter radius compensation. This is the default state; full G41/G42 compensation is not in the grblHAL core (plugin territory), so G40 mainly guarantees a known state.",
  "syntax": "G40",
  "params": {},
  "example": "G40",
  "tips": "Include in your safety preamble: G90 G21 G17 G40 G49 G80 G94.",
  "keywords": [
   "cutter compensation",
   "comp",
   "cancel",
   "g41",
   "g42"
  ]
 },
 {
  "code": "G43.1",
  "aliases": [],
  "name": "Dynamic Tool Length Offset",
  "category": "tool",
  "modal": "Tool Length Offset",
  "desc": "Applies a tool length offset given directly in the command (usually Z). Typically issued after probing a new tool to shift the Z origin by the measured length difference.",
  "syntax": "G43.1 Z<offset>",
  "params": {
   "Z": "Offset to apply to Z",
   "A": "Offset for A",
   "B": "Offset for B"
  },
  "example": "G43.1 Z5.2  ; tool is 5.2mm longer than reference",
  "tips": "Cancel with G49 before tool changes and at program end.",
  "keywords": [
   "tool length",
   "tlo",
   "offset",
   "tool offset",
   "length compensation"
  ]
 },
 {
  "code": "G43",
  "aliases": [
   "G43.2"
  ],
  "name": "Tool Length Offset from Tool Table",
  "category": "tool",
  "modal": "Tool Length Offset",
  "desc": "With a tool table enabled, G43 H<n> applies the stored Z-length offset for tool n. G43.2 adds a second, stacked offset.",
  "syntax": "G43 H<tool> | G43.2 <axes>",
  "params": {
   "H": "Tool table entry whose offset to apply",
   "Z": "Additional offset (G43.2)"
  },
  "example": "T1 M6\nG43 H1",
  "tips": "H should normally match the active tool number.",
  "keywords": [
   "tool table",
   "tool length",
   "h word",
   "offset"
  ]
 },
 {
  "code": "G49",
  "aliases": [],
  "name": "Cancel Tool Length Offset",
  "category": "tool",
  "modal": "Tool Length Offset",
  "desc": "Removes any active tool length offset.",
  "syntax": "G49",
  "params": {},
  "example": "G49\nM6 T2",
  "tips": "Issue before M6 and at program end.",
  "keywords": [
   "cancel",
   "tool length",
   "clear offset"
  ]
 },
 {
  "code": "G50",
  "aliases": [],
  "name": "Cancel Scaling",
  "category": "modes",
  "modal": "Scaling",
  "desc": "Disables G51 coordinate scaling, restoring 1:1 motion. Default state.",
  "syntax": "G50",
  "params": {},
  "example": "G50",
  "tips": "On lathes in G96 mode, G50 S<rpm> also sets the max spindle RPM cap (Mach3 style).",
  "keywords": [
   "scaling",
   "cancel scale",
   "unscale"
  ]
 },
 {
  "code": "G51",
  "aliases": [],
  "name": "Coordinate Scaling / Mirroring",
  "category": "modes",
  "modal": "Scaling",
  "desc": "Scales subsequent motion per-axis. A factor of -1 mirrors that axis. Lets you resize or flip a program without editing it.",
  "syntax": "G51 X<f> Y<f> Z<f>",
  "params": {
   "X": "X scale factor (-1 mirrors)",
   "Y": "Y scale factor",
   "Z": "Z scale factor"
  },
  "example": "G51 X0.5 Y0.5 Z0.5\n(half-size part)\nG50",
  "tips": "Unequal XY factors are not allowed with G2/G3 (no elliptical arcs). Always cancel with G50.",
  "keywords": [
   "scale",
   "mirror",
   "flip",
   "resize"
  ]
 },
 {
  "code": "G81",
  "aliases": [],
  "name": "Drilling Cycle",
  "category": "cycles",
  "modal": "Motion Mode",
  "desc": "Simple drill cycle: rapid to R plane, feed to Z depth, rapid retract. Once active, every new XY position drills a hole until G80 cancels.",
  "syntax": "G81 Z<depth> R<retract> F<feed>",
  "params": {
   "Z": "Final hole depth",
   "R": "Retract plane (Z height to rapid to before feeding)",
   "F": "Drilling feed rate",
   "L": "Optional repeat count"
  },
  "example": "G99 G81 Z-10 R2 F150\nX10 Y10\nX20\nG80",
  "tips": "Retract height between holes is controlled by G98 (initial Z) / G99 (R plane).",
  "keywords": [
   "drill",
   "hole",
   "canned cycle",
   "drilling"
  ]
 },
 {
  "code": "G82",
  "aliases": [],
  "name": "Drilling Cycle with Dwell",
  "category": "cycles",
  "modal": "Motion Mode",
  "desc": "Like G81 but dwells at the bottom of the hole for P seconds — improves hole-bottom finish (spot drilling, countersinking).",
  "syntax": "G82 Z- R- P<sec> F-",
  "params": {
   "Z": "Final depth",
   "R": "Retract plane",
   "P": "Dwell at bottom (seconds)",
   "F": "Feed rate"
  },
  "example": "G82 Z-3 R2 P0.5 F100",
  "tips": null,
  "keywords": [
   "drill",
   "dwell",
   "spot",
   "countersink",
   "canned cycle"
  ]
 },
 {
  "code": "G83",
  "aliases": [],
  "name": "Peck Drilling (Full Retract)",
  "category": "cycles",
  "modal": "Motion Mode",
  "desc": "Deep-hole peck drilling: after each peck of depth Q, the drill fully retracts out of the hole to clear chips, then returns.",
  "syntax": "G83 Z- R- Q<peck> F-",
  "params": {
   "Z": "Final depth",
   "R": "Retract plane",
   "Q": "Depth of each peck",
   "F": "Feed rate"
  },
  "example": "G83 Z-25 R2 Q5 F120",
  "tips": "Use for holes deeper than ~3x drill diameter.",
  "keywords": [
   "peck",
   "deep hole",
   "drill",
   "chip clearing",
   "canned cycle"
  ]
 },
 {
  "code": "G73",
  "aliases": [],
  "name": "Peck Drilling (Chip Break)",
  "category": "cycles",
  "modal": "Motion Mode",
  "desc": "High-speed peck cycle: after each peck of depth Q, retracts a small fixed amount ($28) to snap the chip without leaving the hole.",
  "syntax": "G73 Z- R- Q<peck> F-",
  "params": {
   "Z": "Final depth",
   "R": "Retract plane",
   "Q": "Depth of each peck",
   "F": "Feed rate"
  },
  "example": "G73 Z-15 R2 Q4 F150",
  "tips": "Retract amount per peck comes from setting $28.",
  "keywords": [
   "peck",
   "chip break",
   "drill",
   "canned cycle"
  ]
 },
 {
  "code": "G85",
  "aliases": [],
  "name": "Boring Cycle (Feed Out)",
  "category": "cycles",
  "modal": "Motion Mode",
  "desc": "Feeds to depth and feeds back out — no rapid retract inside the hole, leaving a better surface finish (reaming/boring).",
  "syntax": "G85 Z- R- F-",
  "params": {
   "Z": "Final depth",
   "R": "Retract plane",
   "F": "Feed rate (both directions)"
  },
  "example": "G85 Z-12 R2 F80",
  "tips": null,
  "keywords": [
   "bore",
   "ream",
   "finish",
   "canned cycle"
  ]
 },
 {
  "code": "G86",
  "aliases": [],
  "name": "Boring Cycle (Spindle Stop)",
  "category": "cycles",
  "modal": "Motion Mode",
  "desc": "Feeds to depth, stops the spindle, then rapids out.",
  "syntax": "G86 Z- R- F-",
  "params": {
   "Z": "Final depth",
   "R": "Retract plane",
   "F": "Feed rate"
  },
  "example": "G86 Z-12 R2 F80",
  "tips": null,
  "keywords": [
   "bore",
   "canned cycle"
  ]
 },
 {
  "code": "G89",
  "aliases": [],
  "name": "Boring Cycle with Dwell",
  "category": "cycles",
  "modal": "Motion Mode",
  "desc": "Feeds to depth, dwells P seconds, feeds back out.",
  "syntax": "G89 Z- R- P<sec> F-",
  "params": {
   "Z": "Final depth",
   "R": "Retract plane",
   "P": "Dwell (seconds)",
   "F": "Feed rate"
  },
  "example": "G89 Z-10 R2 P1 F80",
  "tips": null,
  "keywords": [
   "bore",
   "dwell",
   "canned cycle"
  ]
 },
 {
  "code": "G76",
  "aliases": [],
  "name": "Threading Cycle (Lathe)",
  "category": "cycles",
  "modal": "Motion Mode",
  "desc": "Multi-pass lathe threading cycle. Requires a spindle encoder for spindle-synchronized motion; only a few grblHAL boards support the hardware.",
  "syntax": "G76 Z- R- I- J- K- L- P- Q- F-",
  "params": {
   "Z": "Thread end",
   "P": "Thread pitch",
   "I": "Thread peak offset",
   "J": "Initial cut depth",
   "K": "Full thread depth",
   "Q": "Compound slide angle",
   "L": "Taper mode",
   "R": "Depth regression",
   "F": "Feed"
  },
  "example": "(lathe threading — see grblHAL docs)",
  "tips": "Related: G33 spindle-synchronized motion, also encoder-dependent.",
  "keywords": [
   "thread",
   "threading",
   "lathe",
   "tap"
  ]
 },
 {
  "code": "G80",
  "aliases": [],
  "name": "Cancel Canned Cycle",
  "category": "cycles",
  "modal": "Motion Mode",
  "desc": "Immediately ends any active canned cycle so later coordinates are not interpreted as more holes. Critical safety command after cycle blocks.",
  "syntax": "G80",
  "params": {},
  "example": "G81 Z-10 R2 F100\nX10\nX20\nG80",
  "tips": "Any new motion command (G0/G1/G2/G3) also cancels an active cycle.",
  "keywords": [
   "cancel",
   "canned cycle",
   "end cycle"
  ]
 },
 {
  "code": "G98",
  "aliases": [],
  "name": "Cycle Retract to Initial Z",
  "category": "cycles",
  "modal": "Cycle Return",
  "desc": "Between canned-cycle holes, retract all the way to the Z height held before the cycle started. Safest mode — clears clamps between holes.",
  "syntax": "G98",
  "params": {},
  "example": "G0 Z20\nG98 G81 Z-5 R2 F100",
  "tips": null,
  "keywords": [
   "retract",
   "initial",
   "canned cycle",
   "return"
  ]
 },
 {
  "code": "G99",
  "aliases": [],
  "name": "Cycle Retract to R Plane",
  "category": "cycles",
  "modal": "Cycle Return",
  "desc": "Between holes, retract only to the R plane. Faster on flat unobstructed surfaces.",
  "syntax": "G99",
  "params": {},
  "example": "G99 G81 Z-5 R2 F100",
  "tips": null,
  "keywords": [
   "retract",
   "r plane",
   "canned cycle",
   "return"
  ]
 },
 {
  "code": "G90",
  "aliases": [],
  "name": "Absolute Distance Mode",
  "category": "modes",
  "modal": "Distance Mode",
  "desc": "Coordinates are destinations measured from the active WCS origin. X10 means \"go to the X=10 line\". Default mode; what most CAM output uses.",
  "syntax": "G90",
  "params": {},
  "example": "G90\nG0 X10 Y20",
  "tips": null,
  "keywords": [
   "absolute",
   "distance mode",
   "positioning"
  ]
 },
 {
  "code": "G91",
  "aliases": [],
  "name": "Incremental Distance Mode",
  "category": "modes",
  "modal": "Distance Mode",
  "desc": "Coordinates are distances from the current position. X10 means \"move +10 in X from here\". Ideal for macros and probing routines that must work anywhere.",
  "syntax": "G91",
  "params": {},
  "example": "G91\nG1 X50 F300\nG1 Y30",
  "tips": "Forgetting to switch back to G90 is a classic crash. In G91, arc IJK offsets are still measured from the arc start point.",
  "keywords": [
   "incremental",
   "relative",
   "distance mode"
  ]
 },
 {
  "code": "G93",
  "aliases": [],
  "name": "Inverse Time Feed Mode",
  "category": "modes",
  "modal": "Feed Mode",
  "desc": "F means 1/minutes: the move must complete in 1/F minutes. Used mainly for simultaneous multi-axis (4/5-axis) motion where tool-tip speed is complex.",
  "syntax": "G93",
  "params": {
   "F": "Move completes in 1/F minutes"
  },
  "example": "G93\nG1 X10 A90 F2  ; complete in 30 seconds",
  "tips": "F must be given on every motion line in G93.",
  "keywords": [
   "inverse time",
   "feed mode",
   "5 axis",
   "rotary feed"
  ]
 },
 {
  "code": "G94",
  "aliases": [],
  "name": "Units per Minute Feed Mode",
  "category": "modes",
  "modal": "Feed Mode",
  "desc": "F is linear units (mm or inch) per minute. Standard for mills and routers; the default.",
  "syntax": "G94",
  "params": {
   "F": "Feed in units/min"
  },
  "example": "G94\nG1 X100 F500",
  "tips": null,
  "keywords": [
   "feed mode",
   "units per minute",
   "mm/min"
  ]
 },
 {
  "code": "G95",
  "aliases": [],
  "name": "Units per Revolution Feed Mode",
  "category": "modes",
  "modal": "Feed Mode",
  "desc": "F is units per spindle revolution — the lathe standard, tying chip load directly to RPM. Needs spindle speed feedback.",
  "syntax": "G95",
  "params": {
   "F": "Feed in units/rev"
  },
  "example": "G95\nS1000 M3\nG1 Z-50 F0.2  ; effective 200mm/min",
  "tips": null,
  "keywords": [
   "feed per rev",
   "lathe feed",
   "units per revolution"
  ]
 },
 {
  "code": "G96",
  "aliases": [],
  "name": "Constant Surface Speed (Lathe)",
  "category": "modes",
  "modal": "Spindle Mode",
  "desc": "S is a surface speed; the controller varies spindle RPM with the X diameter to hold it constant at the cutting edge. Lathe builds only.",
  "syntax": "G96 S<surface speed> [D<max rpm>]",
  "params": {
   "S": "Target surface speed (m/min or ft/min)",
   "D": "Max RPM cap"
  },
  "example": "G50 S4000\nG96 S150 M3",
  "tips": "Always cap RPM (G50 S / D word) — RPM rises sharply as diameter shrinks.",
  "keywords": [
   "css",
   "surface speed",
   "lathe",
   "constant speed"
  ]
 },
 {
  "code": "G97",
  "aliases": [],
  "name": "Constant RPM Mode",
  "category": "modes",
  "modal": "Spindle Mode",
  "desc": "S is plain revolutions per minute. Default; required for drilling, tapping and threading.",
  "syntax": "G97 S<rpm>",
  "params": {
   "S": "Spindle RPM"
  },
  "example": "G97 S800 M3",
  "tips": null,
  "keywords": [
   "rpm",
   "spindle mode",
   "constant rpm"
  ]
 },
 {
  "code": "G61",
  "aliases": [
   "G61.1"
  ],
  "name": "Exact Stop Path Mode",
  "category": "modes",
  "modal": "Path Control",
  "desc": "Machine fully stops at the end of each move before starting the next — perfectly sharp corners at the cost of speed and smoothness.",
  "syntax": "G61",
  "params": {},
  "example": "G61\n(precise engraving moves)",
  "tips": "Can leave witness marks/divots at corners due to the momentary stop. Continuous blending is the usual default.",
  "keywords": [
   "exact stop",
   "path control",
   "corners",
   "sharp"
  ]
 },
 {
  "code": "G65",
  "aliases": [],
  "name": "Macro Call with Arguments",
  "category": "program",
  "modal": null,
  "desc": "Calls a macro (P<n>.macro on SD/LittleFS) and passes letter arguments as local variables. Requires NGC expressions enabled in the firmware. P1-P7 are reserved built-ins (settings read/write, tool offsets, machine state, probe select, spindle delay skip, Modbus messaging).",
  "syntax": "G65 P<number> [L<repeat>] [A- B- C- ...]",
  "params": {
   "P": "Macro number: P100+ user macros; P1-P7 built-ins",
   "L": "Repeat count",
   "A": "Argument (becomes #1)",
   "B": "Argument (#2)",
   "C": "Argument (#3)",
   "Q": "Argument (built-ins: setting/tool/probe number)",
   "R": "Argument (built-ins: register/axis)",
   "S": "Argument (built-ins: value/slave address)",
   "I": "Argument (P3: parameter number)",
   "F": "Argument (P7: Modbus function code)"
  },
  "example": "G65 P100 A5.0 B200  ; call P100.macro with args\nG65 P1 Q110  ; built-in: read setting $110 into _value",
  "tips": "Notable built-ins: P1 read/write settings, P4 machine state, P5 select probe input (0 probe, 1 toolsetter), P7 Modbus (talk to a VFD from G-code). Nesting G65 is not allowed.",
  "keywords": [
   "macro",
   "subprogram",
   "call",
   "arguments",
   "modbus",
   "vfd",
   "expression",
   "p100"
  ]
 },
 {
  "code": "G66",
  "aliases": [
   "G67"
  ],
  "name": "Modal Macro Call / Cancel",
  "category": "program",
  "modal": "Modal Macro",
  "desc": "G66 works like G65 but repeats the macro after every subsequent motion command until G67 cancels it — handy for custom drilling or probing cycles at many locations.",
  "syntax": "G66 P<number> [args] ... G67",
  "params": {
   "P": "Macro number",
   "L": "Repeat count"
  },
  "example": "G66 P110 A2\nX10 Y10\nX20\nG67",
  "tips": null,
  "keywords": [
   "modal macro",
   "repeat",
   "custom cycle"
  ]
 },
 {
  "code": "M0",
  "aliases": [
   "M00"
  ],
  "name": "Program Stop",
  "category": "program",
  "modal": null,
  "desc": "Unconditionally pauses the program — motion, spindle and coolant stop. Cycle Start resumes from the next line. An optional (message) shows in the sender.",
  "syntax": "M0 [(message)]",
  "params": {},
  "example": "G0 Z20\nM0 (Clear chips, then press start)",
  "tips": "Manual tool change setups often transform M6 into M0 with a message.",
  "keywords": [
   "stop",
   "pause",
   "hold",
   "wait",
   "operator"
  ]
 },
 {
  "code": "M1",
  "aliases": [
   "M01"
  ],
  "name": "Optional Stop",
  "category": "program",
  "modal": null,
  "desc": "Pauses like M0, but only when the Optional Stop switch is enabled in the sender/machine; ignored otherwise. Good for inspection points you don't need every run.",
  "syntax": "M1 [(message)]",
  "params": {},
  "example": "(finishing pass)\nM1",
  "tips": null,
  "keywords": [
   "optional stop",
   "pause",
   "inspection"
  ]
 },
 {
  "code": "M2",
  "aliases": [
   "M02"
  ],
  "name": "Program End",
  "category": "program",
  "modal": null,
  "desc": "Ends the program, resets the parser to defaults and leaves the machine idle.",
  "syntax": "M2",
  "params": {},
  "example": "M5\nM2",
  "tips": null,
  "keywords": [
   "end",
   "program end",
   "finish"
  ]
 },
 {
  "code": "M30",
  "aliases": [],
  "name": "Program End & Rewind",
  "category": "program",
  "modal": null,
  "desc": "The standard end-of-file: does everything M2 does and rewinds to the start, ready for the next part.",
  "syntax": "M30",
  "params": {},
  "example": "G0 Z20\nM5 M9\nM30",
  "tips": "When running from SD card, $FR before start enables rewind-and-rerun on cycle start.",
  "keywords": [
   "end",
   "rewind",
   "program end",
   "m30"
  ]
 },
 {
  "code": "M3",
  "aliases": [
   "M03"
  ],
  "name": "Spindle On — Clockwise",
  "category": "spindle",
  "modal": "Spindle",
  "desc": "Starts the spindle clockwise at the last programmed S speed. In laser mode ($32=1), fires the laser at constant power while moving.",
  "syntax": "M3 S<rpm>",
  "params": {
   "S": "Spindle speed (RPM) or laser power"
  },
  "example": "S18000 M3",
  "tips": "With spindle-at-speed enabled ($340 tolerance) the controller waits for the VFD to reach speed. For laser engraving prefer M4 dynamic power.",
  "keywords": [
   "spindle",
   "on",
   "clockwise",
   "cw",
   "start spindle",
   "laser on"
  ]
 },
 {
  "code": "M4",
  "aliases": [
   "M04"
  ],
  "name": "Spindle On — CCW / Laser Dynamic",
  "category": "spindle",
  "modal": "Spindle",
  "desc": "Starts the spindle counter-clockwise (left-hand tools). In laser mode ($32=1), enables dynamic power: output scales with actual velocity so accel/decel zones don't burn darker.",
  "syntax": "M4 S<rpm>",
  "params": {
   "S": "Spindle speed (RPM) or max laser power"
  },
  "example": "M4 S800  ; laser dynamic mode",
  "tips": "This is the mode LightBurn's grbl profiles use for engraving.",
  "keywords": [
   "spindle",
   "ccw",
   "counterclockwise",
   "laser",
   "dynamic power",
   "variable power"
  ]
 },
 {
  "code": "M5",
  "aliases": [
   "M05"
  ],
  "name": "Spindle / Laser Off",
  "category": "spindle",
  "modal": "Spindle",
  "desc": "Stops spindle rotation (or laser output).",
  "syntax": "M5",
  "params": {},
  "example": "M5",
  "tips": "$394 sets a spin-down delay so motion waits for the spindle to actually stop.",
  "keywords": [
   "spindle off",
   "stop",
   "laser off"
  ]
 },
 {
  "code": "M6",
  "aliases": [
   "M06"
  ],
  "name": "Tool Change",
  "category": "tool",
  "modal": null,
  "desc": "Executes a tool change to the tool selected by T. With an ATC, runs the tool change macro (tc.macro / P200.macro for RapidChange). Without one, behavior follows $341: pause like M0, move to a change position, and/or run the manual probe protocol ($TPW).",
  "syntax": "T<n> M6 | M6 T<n>",
  "params": {
   "T": "Tool number to load"
  },
  "example": "T2 M6\nG43 H2",
  "tips": "T only selects; M6 performs the change. Apply the new length offset (G43/G43.1) afterward. See $341-$346 for tool change configuration. In ncSender, a tool-changer plugin (Rapid Change ATC, Pneumatic ATC, Manual Tool Changer) expands M6 into its own sequence before it reaches the controller, and the Dust Docker plugin docks the dust boot before the change and re-attaches it after.",
  "keywords": [
   "tool change",
   "atc",
   "change tool",
   "m6",
   "rapidchange",
   "toolchange"
  ]
 },
 {
  "code": "M7",
  "aliases": [
   "M07"
  ],
  "name": "Mist Coolant On",
  "category": "coolant",
  "modal": "Coolant",
  "desc": "Turns on the mist coolant output pin (air/oil mist). Often repurposed for an air blast or accessory relay.",
  "syntax": "M7",
  "params": {},
  "example": "M7",
  "tips": null,
  "keywords": [
   "mist",
   "coolant",
   "air",
   "output"
  ]
 },
 {
  "code": "M8",
  "aliases": [
   "M08"
  ],
  "name": "Flood Coolant On",
  "category": "coolant",
  "modal": "Coolant",
  "desc": "Turns on the flood coolant output pin — the primary coolant output. Commonly repurposed for dust collection or a dust boot.",
  "syntax": "M8",
  "params": {},
  "example": "M8\nG1 Z-5 F300",
  "tips": null,
  "keywords": [
   "flood",
   "coolant",
   "dust boot",
   "dust collection",
   "output"
  ]
 },
 {
  "code": "M9",
  "aliases": [
   "M09"
  ],
  "name": "All Coolant Off",
  "category": "coolant",
  "modal": "Coolant",
  "desc": "Turns off both mist (M7) and flood (M8) outputs.",
  "syntax": "M9",
  "params": {},
  "example": "G0 Z20\nM9",
  "tips": null,
  "keywords": [
   "coolant off",
   "mist off",
   "flood off"
  ]
 },
 {
  "code": "M7.1",
  "aliases": [
   "M8.1"
  ],
  "name": "Mist or Flood Off Separately (FluidNC)",
  "category": "coolant",
  "modal": "Coolant",
  "desc": "FluidNC only: M7.1 turns off just the mist output and M8.1 just the flood output, leaving the other one as it is. M9 turns both off.",
  "syntax": "M7.1 | M8.1",
  "params": {},
  "example": "M7 M8   (air blast + dust collector on)\nM7.1    (air blast off, dust collector stays on)",
  "tips": "grblHAL and Grbl 1.1 don't have these - use M9 and turn the one you still want back on.",
  "keywords": [
   "mist off",
   "flood off",
   "coolant off",
   "fluidnc",
   "m7.1",
   "m8.1"
  ]
 },
 {
  "code": "M48",
  "aliases": [],
  "name": "Enable Overrides",
  "category": "program",
  "modal": "Override",
  "desc": "Re-enables the real-time feed, rapid and spindle override controls (the default).",
  "syntax": "M48",
  "params": {},
  "example": "M48",
  "tips": null,
  "keywords": [
   "override",
   "enable",
   "feed override"
  ]
 },
 {
  "code": "M49",
  "aliases": [],
  "name": "Disable Overrides",
  "category": "program",
  "modal": "Override",
  "desc": "Ignores all override controls; the program runs at exactly 100% of programmed feed, rapid and spindle values.",
  "syntax": "M49",
  "params": {},
  "example": "M49\nG1 X100 F150\nM48",
  "tips": "Use sparingly — it removes the operator's ability to slow a bad cut.",
  "keywords": [
   "override",
   "disable",
   "lock feed"
  ]
 },
 {
  "code": "M50",
  "aliases": [
   "M51",
   "M53"
  ],
  "name": "Selective Override Control",
  "category": "program",
  "modal": null,
  "desc": "Granular override disabling: M50 feed override off, M51 spindle override off, M53 rapid override off. M48 re-enables all.",
  "syntax": "M50 | M51 | M53",
  "params": {},
  "example": "M50 M51\n(critical finishing pass)\nM48",
  "tips": null,
  "keywords": [
   "override",
   "feed",
   "spindle",
   "rapid",
   "selective"
  ]
 },
 {
  "code": "M56",
  "aliases": [],
  "name": "Parking Motion Override",
  "category": "program",
  "modal": null,
  "desc": "Enables (P1) or disables (P0) automatic parking motion. Requires parking support plus this override option compiled into the firmware.",
  "syntax": "M56 P<0|1>",
  "params": {
   "P": "1 = enable parking motion, 0 = disable"
  },
  "example": "M56 P0\n(critical moves)\nM56 P1",
  "tips": null,
  "keywords": [
   "parking",
   "park",
   "override"
  ]
 },
 {
  "code": "M61",
  "aliases": [],
  "name": "Set Current Tool",
  "category": "tool",
  "modal": null,
  "desc": "Tells the controller which tool is currently loaded (Q word) without performing a change — used to sync state after manual swaps.",
  "syntax": "M61 Q<tool>",
  "params": {
   "Q": "Tool number now in the spindle"
  },
  "example": "M61 Q3",
  "tips": null,
  "keywords": [
   "set tool",
   "current tool",
   "sync tool"
  ]
 },
 {
  "code": "M62",
  "aliases": [
   "M63"
  ],
  "name": "Digital Output — Synced",
  "category": "io",
  "modal": null,
  "desc": "Queues a digital output change (M62 on, M63 off) to fire at the exact start of the next motion command. Ideal for laser gating, cameras, or anything that must align with motion.",
  "syntax": "M62 P<port> | M63 P<port>",
  "params": {
   "P": "Digital output port number"
  },
  "example": "M62 P1\nG1 X20 F500  ; output 1 goes high as this move starts\nM63 P1\nG0 X30",
  "tips": "On the plasma/THC plugin these same codes toggle torch height control.",
  "keywords": [
   "digital output",
   "synchronized",
   "io",
   "laser gate",
   "output on",
   "output off"
  ]
 },
 {
  "code": "M64",
  "aliases": [
   "M65"
  ],
  "name": "Digital Output — Immediate",
  "category": "io",
  "modal": null,
  "desc": "Sets a digital output high (M64) or low (M65) immediately when read, without waiting for motion.",
  "syntax": "M64 P<port> | M65 P<port>",
  "params": {
   "P": "Digital output port number"
  },
  "example": "M400\nM64 P1  ; trigger once fully stopped",
  "tips": "Use $pins / $pinstate in the terminal to see which aux ports exist and their live state.",
  "keywords": [
   "digital output",
   "immediate",
   "io",
   "relay",
   "aux output"
  ]
 },
 {
  "code": "M66",
  "aliases": [],
  "name": "Wait for Input",
  "category": "io",
  "modal": null,
  "desc": "Pauses execution until a digital input reaches the requested state, or a timeout expires. Requires configured aux inputs.",
  "syntax": "M66 P<port> L<0|1> [Q<timeout s>]",
  "params": {
   "P": "Digital input port number",
   "L": "State to wait for: 0 low, 1 high",
   "Q": "Timeout in seconds (error if exceeded)"
  },
  "example": "M66 P2 L1 Q10  ; wait up to 10s for input 2 high",
  "tips": null,
  "keywords": [
   "wait",
   "input",
   "sensor",
   "io",
   "interlock"
  ]
 },
 {
  "code": "M67",
  "aliases": [
   "M68"
  ],
  "name": "Analog Output",
  "category": "io",
  "modal": null,
  "desc": "Sets an analog output value — M67 synchronized with the next motion, M68 immediately. Used for laser power ramps, flow control, etc.",
  "syntax": "M67 P<port> Q<value> | M68 P<port> Q<value>",
  "params": {
   "P": "Analog output port number",
   "Q": "Target analog value (range depends on DAC/PWM resolution)",
   "E": "Port (plasma plugin velocity-reduction variant)"
  },
  "example": "M67 P0 Q150\nG1 X20 F500",
  "tips": null,
  "keywords": [
   "analog output",
   "pwm",
   "dac",
   "laser power",
   "io"
  ]
 },
 {
  "code": "M70",
  "aliases": [
   "M71",
   "M72",
   "M73"
  ],
  "name": "Modal State Save/Restore",
  "category": "program",
  "modal": null,
  "desc": "Saves (M70) and restores (M72) the full modal state — active G modes, feed, spindle speed — so macros can change modes freely without disturbing the main program. M71 invalidates a saved state; M73 saves with auto-restore for subprograms.",
  "syntax": "M70 ... M72",
  "params": {},
  "example": "M70\nG91 G1 F100\n(probe moves)\nM72",
  "tips": "Wrap any probing or tool change macro in M70/M72 — cheap insurance against leaving the machine in G91.",
  "keywords": [
   "save state",
   "restore",
   "modal",
   "macro safety"
  ]
 },
 {
  "code": "M98",
  "aliases": [],
  "name": "Subroutine Call",
  "category": "program",
  "modal": null,
  "desc": "Calls a subroutine. In ncSender, M98 P9001-P9999 runs one of ncSender's own macros (the Macros tab) on any controller: ncSender sends the macro's lines in place of the M98, so the controller never sees it. Any other P number is refused with an error unless \"Use controller macros\" is turned on in the Macros tab. With that on, M98 goes to grblHAL instead: with $700=1 it first looks for an O<n> sub label in the current file, otherwise (or if not found) runs external file P<n> from SD/LittleFS. L repeats the call.",
  "syntax": "M98 P<number> [L<repeat>]",
  "params": {
   "P": "Macro number (9001-9999 = ncSender macro) or controller subroutine number/filename",
   "L": "Repeat count (controller subroutines)"
  },
  "example": "M98 P9001   (run ncSender macro 9001)\n\n(controller subroutine, needs \"Use controller macros\":)\nM98 P100 L3\nM30\nO100 sub\nG91 G0 X10\nM99",
  "tips": "ncSender macros can call each other up to 16 deep; a macro that calls itself is stopped. Plugins can also answer specific M98 numbers - Dust Docker uses P9001-P9003 by default to dock, attach and bypass the dust boot.",
  "keywords": [
   "subroutine",
   "call",
   "subprogram",
   "repeat",
   "macro",
   "ncsender macro",
   "9001"
  ]
 },
 {
  "code": "M99",
  "aliases": [],
  "name": "Return from Subroutine",
  "category": "program",
  "modal": null,
  "desc": "Ends a subroutine and returns to the line after the call. In a main program it acts as rewind-and-loop. Also terminates tool change macros.",
  "syntax": "M99",
  "params": {
   "P": "Optional return line (implementation-dependent)"
  },
  "example": "M99",
  "tips": null,
  "keywords": [
   "return",
   "subroutine",
   "end macro"
  ]
 },
 {
  "code": "M42",
  "aliases": [],
  "name": "Set Digital Output (OpenPNP)",
  "category": "plugin",
  "modal": null,
  "desc": "OpenPNP plugin: directly sets a digital I/O port state.",
  "syntax": "M42 P<port> S<0|1>",
  "params": {
   "P": "I/O port number",
   "S": "0 = off, 1 = on"
  },
  "example": "M42 P1 S1",
  "tips": null,
  "keywords": [
   "digital output",
   "openpnp",
   "io",
   "relay"
  ]
 },
 {
  "code": "M104",
  "aliases": [],
  "name": "Select Spindle",
  "category": "plugin",
  "modal": null,
  "desc": "Spindle plugin: selects which configured spindle (VFD, PWM, laser...) subsequent S/M3/M4 commands address. Essential on dual-spindle setups.",
  "syntax": "M104 P<spindle>",
  "params": {
   "P": "Spindle number (see $SPINDLES for the list)"
  },
  "example": "M104 P1  ; switch to spindle 1 (e.g. PWM laser)",
  "tips": "Run $SPINDLES in the terminal to enumerate configured spindles and their numbers.",
  "keywords": [
   "spindle select",
   "dual spindle",
   "laser",
   "vfd",
   "switch spindle",
   "multi spindle"
  ]
 },
 {
  "code": "M106",
  "aliases": [
   "M107"
  ],
  "name": "Fan Control",
  "category": "plugin",
  "modal": null,
  "desc": "Fan plugin: M106 turns a fan on with PWM speed 0-255; M107 turns it off.",
  "syntax": "M106 P<fan> S<0-255> | M107 P<fan>",
  "params": {
   "P": "Fan index",
   "S": "PWM duty 0-255"
  },
  "example": "M106 P0 S255",
  "tips": null,
  "keywords": [
   "fan",
   "cooling",
   "pwm"
  ]
 },
 {
  "code": "M114",
  "aliases": [],
  "name": "Report Position (Encoder)",
  "category": "plugin",
  "modal": null,
  "desc": "Encoder plugin: reports current position, including spindle encoder data when available.",
  "syntax": "M114",
  "params": {},
  "example": "M114",
  "tips": null,
  "keywords": [
   "position",
   "report",
   "encoder"
  ]
 },
 {
  "code": "M122",
  "aliases": [],
  "name": "Trinamic Driver Report",
  "category": "plugin",
  "modal": null,
  "desc": "Motor plugin: dumps Trinamic stepper driver status/debug info for the given axes.",
  "syntax": "M122 [axes]",
  "params": {
   "X": "Report X driver",
   "Y": "Report Y driver",
   "Z": "Report Z driver"
  },
  "example": "M122",
  "tips": "Related: M906 set RMS current, M569 StealthChop/SpreadCycle, M911/M912 prewarn flags, M913 hybrid threshold, M914 homing sensitivity.",
  "keywords": [
   "trinamic",
   "stepper",
   "driver",
   "debug",
   "tmc"
  ]
 },
 {
  "code": "M150",
  "aliases": [],
  "name": "RGB LED Control",
  "category": "plugin",
  "modal": null,
  "desc": "Misc plugin: sets color and brightness for an RGB/RGBW LED strip or a single LED by index. Used for status lighting on machines with LED rails/rings.",
  "syntax": "M150 [R<0-255>] [U<0-255>] [B<0-255>] [W<0-255>] [P<0-255>] [I<index>] [S<strip>] [K]",
  "params": {
   "R": "Red 0-255",
   "U": "Green 0-255",
   "B": "Blue 0-255",
   "W": "White 0-255",
   "P": "Brightness 0-255",
   "I": "LED index for individual control",
   "S": "Strip index (0 or 1)",
   "K": "Keep unspecified components unchanged"
  },
  "example": "M150 R255 U0 B0 S1  ; strip 1 solid red\nM150 R0 U0 B0 S1    ; off",
  "tips": "Note green is U, not G (G would parse as a G-code).",
  "keywords": [
   "led",
   "rgb",
   "light",
   "strip",
   "neopixel",
   "status light"
  ]
 },
 {
  "code": "M220",
  "aliases": [],
  "name": "Set Feed Override %",
  "category": "plugin",
  "modal": null,
  "desc": "Sets the feed override percentage from G-code (Marlin heritage). B backs up the current value, R restores it, S sets a percentage.",
  "syntax": "M220 [S<percent>] [B] [R]",
  "params": {
   "S": "Feed override percent (100 = programmed feed)",
   "B": "Backup current override",
   "R": "Restore backed-up override"
  },
  "example": "M220 S50\n(difficult section)\nM220 S100",
  "tips": null,
  "keywords": [
   "feed override",
   "percent",
   "slow down",
   "speed"
  ]
 },
 {
  "code": "M280",
  "aliases": [],
  "name": "Set Servo Position",
  "category": "plugin",
  "modal": null,
  "desc": "Servo plugin: moves a PWM servo to a position — typically 0-180 degrees. Used for probe deployers, dust shoes, clamps.",
  "syntax": "M280 P<servo> S<position>",
  "params": {
   "P": "Servo index",
   "S": "Target position (deg or µs)"
  },
  "example": "M280 P0 S90  ; deploy\nM280 P0 S0   ; stow",
  "tips": null,
  "keywords": [
   "servo",
   "deploy",
   "position",
   "pwm"
  ]
 },
 {
  "code": "M400",
  "aliases": [],
  "name": "Finish Moves",
  "category": "plugin",
  "modal": null,
  "desc": "Waits for the planner buffer to fully empty before the next command — the machine is completely stationary. Roughly a G4 P0.",
  "syntax": "M400",
  "params": {},
  "example": "G0 X50 Y50\nM400\nM64 P1",
  "tips": null,
  "keywords": [
   "wait",
   "finish",
   "buffer",
   "sync"
  ]
 },
 {
  "code": "M960",
  "aliases": [
   "M810"
  ],
  "name": "ATCi Keepout Zone On/Off (Sienci)",
  "category": "plugin",
  "modal": null,
  "desc": "Sienci ATCi firmware plugin: turns enforcement of the keepout zone around the tool rack on (P1) or off (P0) until something changes it again. While it is on, jogs stop at the zone's edge and program moves into or across the zone are refused. With no P word it just prints a usage hint. The zone itself and the master switch are settings $683-$687.",
  "syntax": "M960 P<0|1>",
  "params": {
   "P": "1 = enforce the keepout zone, 0 = stop enforcing it"
  },
  "example": "M960 P0   (keepout off - entering the rack)\n(... tool change moves ...)\nM960 P1   (keepout back on)",
  "tips": "Sienci ATCi builds before January 2026 used M810 for this. The Pneumatic ATC plugin (Sienci profile) adds M960 P0 / P1 around its rack moves automatically, and with $683 \"Monitor TC Macro\" on the firmware drops the zone during its own tool change macro. If the spindle ends up inside the zone, turn enforcement off before jogging out.",
  "keywords": [
   "sienci",
   "atc",
   "atci",
   "keepout",
   "magazine",
   "rack",
   "m810"
  ]
 },
 {
  "code": "$TLS",
  "aliases": [],
  "name": "Tool Length Set (ATC/MTC plugins)",
  "category": "plugin",
  "modal": null,
  "desc": "Runs the tool length setter probe cycle for the currently loaded tool: raises to safe Z, rapids to the configured TLS position, probes down (G38.2), applies the measured tool length offset, and retracts. Provided by the Rapid Change ATC, Manual Tool Changer, and Pneumatic ATC plugins - the exact motions come from that plugin's settings, including any Pre/Post TLS g-code hooks.",
  "syntax": "$TLS",
  "params": {},
  "example": "$TLS",
  "tips": "Only works when one of the tool-changer plugins is installed and enabled. The macro expansion can be shown line by line by enabling \"show macro commands\" in the plugin settings.",
  "keywords": [
   "tool length",
   "tls",
   "tool setter",
   "probe tool",
   "rapidchange",
   "atc",
   "tool changer",
   "offset"
  ]
 },
 {
  "code": "$SLOT1",
  "aliases": [
   "$SLOT2",
   "$SLOT<n>"
  ],
  "name": "Go To Tool Slot n (ATC plugins)",
  "category": "plugin",
  "modal": null,
  "desc": "Raises to safe Z, then rapids (G53 machine coordinates) to the XY position of magazine slot n as configured in the Rapid Change ATC or Pneumatic ATC plugin. Nothing is picked up or dropped - it only positions the spindle. $SLOT1, $slot2, $SLOT03 all work - leading zeros are tolerated. Slot numbers outside the configured slot count are deliberately left alone (they fall through to the controller as unknown commands) so a typo cannot send the spindle to a nonexistent slot.",
  "syntax": "$SLOT<n>",
  "params": {},
  "example": "$SLOT3",
  "tips": "Provided by the Rapid Change ATC and Pneumatic ATC plugins ($SLOT1-$SLOT8 on Pneumatic ATC) - only works when one is installed and enabled. Useful for aligning the magazine or verifying slot positions without a tool change. Pneumatic ATC's $PROBE does the same for its probe holder.",
  "keywords": [
   "slot",
   "pocket",
   "magazine",
   "rapidchange",
   "atc",
   "tool changer",
   "position"
  ]
 },
 {
  "code": "$POCKET1",
  "aliases": [],
  "name": "Go To Pocket 1 (Manual Tool Changer)",
  "category": "plugin",
  "modal": null,
  "desc": "Raises to safe Z, then rapids (G53 machine coordinates) to the Pocket 1 XY position configured in the Manual Tool Changer plugin - the parking spot where manual tool swaps happen.",
  "syntax": "$POCKET1",
  "params": {},
  "example": "$POCKET1",
  "tips": "Provided by the Manual Tool Changer plugin - only works when it is installed and enabled.",
  "keywords": [
   "pocket",
   "manual tool change",
   "tool changer",
   "park",
   "position"
  ]
 },
 {
  "code": "$ADB_RETRACT",
  "aliases": [],
  "name": "Retract Dust Boot (AutoDustboot)",
  "category": "plugin",
  "modal": null,
  "desc": "Retracts the pneumatic dust boot. The AutoDustboot plugin injects this automatically before tool changes (M6/M98) in a loaded job, but it can also be typed in the Console or embedded in your own macros.",
  "syntax": "$ADB_RETRACT",
  "params": {},
  "example": "$ADB_RETRACT",
  "tips": "Provided by the AutoDustboot plugin - only works when it is installed and enabled.",
  "keywords": [
   "dust boot",
   "dustboot",
   "retract",
   "pneumatic",
   "adb"
  ]
 },
 {
  "code": "$ADB_EXPAND",
  "aliases": [],
  "name": "Expand Dust Boot (AutoDustboot)",
  "category": "plugin",
  "modal": null,
  "desc": "Expands (lowers) the pneumatic dust boot. The AutoDustboot plugin injects this automatically after the first rapid XY move following a tool change, and it can also be typed in the Console or embedded in macros.",
  "syntax": "$ADB_EXPAND",
  "params": {},
  "example": "$ADB_EXPAND",
  "tips": "Provided by the AutoDustboot plugin - only works when it is installed and enabled.",
  "keywords": [
   "dust boot",
   "dustboot",
   "expand",
   "deploy",
   "pneumatic",
   "adb"
  ]
 },
 {
  "code": "$ADB_GOTO",
  "aliases": [],
  "name": "Move Dust Boot to Height (AutoDustboot)",
  "category": "plugin",
  "modal": null,
  "desc": "Moves the wireless dust boot to an exact height, given in mm below its retracted (home) position, and holds it there - automatic raising and lowering is paused until the next retract. Values beyond the boot's configured travel are clamped. A Z in front of the number is accepted ($ADB_GOTO Z12).",
  "syntax": "$ADB_GOTO <mm>",
  "params": {},
  "example": "$ADB_GOTO 12   (boot 12 mm below retracted)\n$ADB_RETRACT   (back to automatic)",
  "tips": "Provided by the AutoDustboot plugin (0.3.16 and later) and only for the wireless boot - with the wired hookup, or a missing number, the line is turned into a comment telling you why and nothing moves.",
  "keywords": [
   "dust boot",
   "dustboot",
   "height",
   "goto",
   "position",
   "wireless",
   "adb"
  ]
 },
 {
  "code": "$PROBE",
  "aliases": [],
  "name": "Go To Probe Holder (Pneumatic ATC)",
  "category": "plugin",
  "modal": null,
  "desc": "Moves the spindle over the probe holder at safe Z so you can check the holder's position - the probe's counterpart of $SLOT<n>. Nothing is picked up; loading the probe is a normal M6 with the probe's tool number.",
  "syntax": "$PROBE",
  "params": {},
  "example": "$PROBE",
  "tips": "Provided by the Pneumatic ATC plugin and only when its probe holder (probe auto-loader) is turned on; otherwise the command is ignored.",
  "keywords": [
   "probe holder",
   "probe",
   "atc",
   "pneumatic",
   "position",
   "auto loader"
  ]
 },
 {
  "code": "$MEASURE_TLO",
  "aliases": [],
  "name": "Load and Measure a Tool (Pneumatic ATC)",
  "category": "plugin",
  "modal": null,
  "desc": "One step of Pneumatic ATC's \"Measure all tools\": loads tool n (putting away whatever is in the spindle), measures it on the tool setter whatever the TLS settings say, saves its length offset, and stays parked at the tool setter. If tool n is already in the spindle it just measures it. T0 puts the current tool away; add X and Y to return there afterward.",
  "syntax": "$MEASURE_TLO T<n> | $MEASURE_TLO T0 [X<x> Y<y>]",
  "params": {
   "T": "Tool to load and measure (0 = put the current tool away)",
   "X": "Machine X to return to after T0",
   "Y": "Machine Y to return to after T0"
  },
  "example": "$MEASURE_TLO T3\n$MEASURE_TLO T0 X-400 Y-300",
  "tips": "Normally sent one tool at a time by the plugin's Measure all tools dialog, which waits for each measurement to come back. Provided by the Pneumatic ATC plugin.",
  "keywords": [
   "measure",
   "tool length",
   "tlo",
   "measure all",
   "tool setter",
   "pneumatic",
   "atc"
  ]
 },
 {
  "code": "M98 P9001",
  "aliases": [
   "M98 P9002",
   "M98 P9003"
  ],
  "name": "Dock / Attach / Bypass Dust Boot (Dust Docker)",
  "category": "plugin",
  "modal": null,
  "desc": "The Dust Docker plugin answers three macro calls itself: P9001 docks the dust boot (if it is attached and not bypassed), P9002 attaches it again (if docked and not bypassed), and P9003 toggles bypass on or off. The numbers are the defaults and can be changed in the plugin. With its automation on, it also docks and re-attaches the boot around every M6 and $TLS.",
  "syntax": "M98 P9001 [X<x> Y<y>] | M98 P9002 [X<x> Y<y>] | M98 P9003",
  "params": {
   "P": "9001 dock, 9002 attach, 9003 toggle bypass (defaults)",
   "X": "Machine X to return to after docking/attaching",
   "Y": "Machine Y to return to after docking/attaching"
  },
  "example": "M98 P9001 X120 Y-80",
  "tips": "A plain M98 P9001 can't see where the machine is, so it only returns to a spot when you give X and Y. The Dock and Attach buttons in the plugin card capture the current position for you.",
  "keywords": [
   "dust boot",
   "dust docker",
   "dock",
   "attach",
   "bypass",
   "macro",
   "9001",
   "9002",
   "9003"
  ]
 },
 {
  "code": "#<_dust_boot_attached>",
  "aliases": [
   "#<_dust_boot_bypass>"
  ],
  "name": "Dust Boot State (Dust Docker)",
  "category": "plugin",
  "modal": null,
  "desc": "Dust Docker keeps track of where the dust boot is. Setting these tells it without moving anything: #<_dust_boot_attached> = 1 means the boot is on the spindle, 0 means it is in its dock; #<_dust_boot_bypass> = 1 skips all docking until you set it back to 0. The plugin answers these lines itself - they never reach the controller.",
  "syntax": "#<_dust_boot_attached> = 0|1 | #<_dust_boot_bypass> = 0|1",
  "params": {},
  "example": "#<_dust_boot_attached> = 0   (boot is in the dock)\n#<_dust_boot_bypass> = 1     (run this job without docking)",
  "tips": "After a successful $H the plugin assumes the boot is attached and bypass is off. If a tool change is blocked because the boot's location is unknown, check the machine and set the state (or use Mark Attached / Mark Docked in the plugin card) before restarting.",
  "keywords": [
   "dust boot",
   "dust docker",
   "attached",
   "docked",
   "bypass",
   "state"
  ]
 },
 {
  "code": "NCSENDER_PAUSE",
  "aliases": [],
  "name": "Operator Pause Dialog (ncSender)",
  "category": "program",
  "modal": null,
  "desc": "Write (MSG, NCSENDER_PAUSE: Title | Message) on the line before an M0 and ncSender shows a dialog with your title and message while the machine is paused. Continue resumes (cycle start); Abort stops the job with a soft reset. Works in G-code files, ncSender macros and plugin event fields (Pre/Post tool change and the like).",
  "syntax": "(MSG, NCSENDER_PAUSE: <title> | <message>)\nM0",
  "params": {},
  "example": "(MSG, NCSENDER_PAUSE: Dust shoe | Fit the dust shoe, then press Continue)\nM0",
  "tips": "Text before the | is the title, text after it is the message. Without the M0 the machine doesn't stop. On classic Grbl 1.1 ncSender uses this same dialog for M6 (\"Load tool T<n>, then press Continue\").",
  "keywords": [
   "pause",
   "dialog",
   "prompt",
   "operator",
   "message",
   "msg",
   "ncsender",
   "continue"
  ]
 },
 {
  "code": "(MSG)",
  "aliases": [],
  "name": "Message Comment",
  "category": "program",
  "modal": null,
  "desc": "A comment that starts with MSG, is shown to the operator instead of being ignored: grblHAL and FluidNC report it back as a message when the line runs, and ncSender shows it in the console. On classic Grbl 1.1, which ignores comments, ncSender reports it for you.",
  "syntax": "(MSG, <text>)",
  "params": {},
  "example": "(MSG, Roughing pass done - check the stock)",
  "tips": "A message doesn't stop anything. To wait for the operator, follow it with M0 - or use the NCSENDER_PAUSE form to get a dialog with Continue and Abort buttons.",
  "keywords": [
   "msg",
   "message",
   "comment",
   "operator",
   "display",
   "notify"
  ]
 },
 {
  "code": "(PRINT)",
  "aliases": [
   "(DEBUG)"
  ],
  "name": "Print Values Comment",
  "category": "program",
  "modal": null,
  "desc": "Like (MSG, ...) but parameters in the text are replaced with their values when the line runs - handy for checking probe results and macro math. (DEBUG, ...) prints only when the controller's debug messages are turned on. Needs grblHAL with expressions enabled, or FluidNC.",
  "syntax": "(PRINT, <text with #<name> or #number>)",
  "params": {},
  "example": "G38.2 Z-20 F100\n(PRINT, Probe touched at Z = #5063)",
  "tips": "On FluidNC a %.3f style format right before a parameter sets the number of decimals. Classic Grbl 1.1 has no parameters, so it ignores these lines.",
  "keywords": [
   "print",
   "debug",
   "message",
   "parameter",
   "variable",
   "value",
   "comment"
  ]
 }
];

/**
 * grblHAL numbered settings. Core grbl 1.1 settings plus the common
 * grblHAL extensions. Run $ES in the terminal to enumerate every
 * setting your specific build supports, with ranges and descriptions.
 */
export const SETTINGS_DB = [
 {
  "code": "$0",
  "name": "Step pulse time",
  "desc": "SLB-EXT default: 5 microseconds. Sets time length per step. Minimum 2 microseconds. This needs to be reduced from the default value of 10 when max. step rates exceed approximately 80 kHz.",
  "keywords": [
   "invert",
   "pulse",
   "signal",
   "step",
   "stepper",
   "time"
  ]
 },
 {
  "code": "$1",
  "name": "Step idle delay",
  "desc": "SLB-EXT default: 254 milliseconds. Sets a short hold delay when stopping to let dynamics settle before disabling steppers. Value 255 keeps motors enabled.",
  "keywords": [
   "delay",
   "idle",
   "invert",
   "signal",
   "step",
   "stepper"
  ]
 },
 {
  "code": "$2",
  "name": "Step pulse invert",
  "desc": "SLB-EXT default: X: OFF Y: OFF Z: OFF A: OFF (0). Inverts the step signals (active low).",
  "keywords": [
   "invert",
   "pulse",
   "signal",
   "step",
   "stepper"
  ]
 },
 {
  "code": "$3",
  "name": "Step direction invert",
  "desc": "SLB-EXT default: X: OFF Y: ON Z: ON A: OFF (6). Inverts the direction signals (active low).",
  "keywords": [
   "direction",
   "invert",
   "signal",
   "step",
   "stepper"
  ]
 },
 {
  "code": "$4",
  "name": "Invert stepper enable pin(s)",
  "desc": "SLB-EXT default: X: ON Y: ON Z: ON A: ON (15). Inverts the stepper driver enable signals. Most drivers uses active low enable requiring inversion. NOTE: If the stepper drivers shares the same enable signal only X is used.",
  "keywords": [
   "enable",
   "invert",
   "pin",
   "signal",
   "stepper"
  ]
 },
 {
  "code": "$5",
  "name": "Invert limit pins",
  "desc": "SLB-EXT default: X: ON Y: ON Z: ON A: ON (15). Inverts the axis limit input signals.",
  "keywords": [
   "invert",
   "limit",
   "pins",
   "signal",
   "stepper"
  ]
 },
 {
  "code": "$6",
  "name": "Invert probe pin",
  "desc": "SLB-EXT default: Enabled (1). Inverts the probe input pin signal.",
  "keywords": [
   "invert",
   "pin",
   "probe",
   "signal",
   "stepper"
  ]
 },
 {
  "code": "$7",
  "name": "Deprecated",
  "desc": "Deprecated",
  "keywords": [
   "deprecated"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$8",
  "name": "Ganged axes direction invert",
  "desc": "SLB-EXT default: Disabled (0). Inverts the direction signals for the second motor used for ganged axes. NOTE: This inversion will be applied in addition to the inversion from setting $3.",
  "keywords": [
   "axes",
   "direction",
   "ganged",
   "invert",
   "signal",
   "stepper"
  ]
 },
 {
  "code": "$9",
  "name": "PWM Spindle",
  "desc": "SLB-EXT default: Enable: ON RPM controls spindle en signal: OFF (1). Enable: Controls PWM output availability. RPM controls spindle enable signal: When M3 or M4 is active, S > 0 turns on spindle enable and S0 turns it off.",
  "keywords": [
   "invert",
   "pwm",
   "signal",
   "spindle",
   "stepper"
  ]
 },
 {
  "code": "$10",
  "name": "Status report options",
  "desc": "SLB-EXT default: Position in machine coords: ON Buffer state: ON Line numbers: ON Feed & speed: ON Pin state: ON Work coord offset: ON Overrides: ON Probe coords: ON Buffer sync on WCO change: ON Parser state: OFF Alarm substatus: OFF Run substatus: OFF (511). Specifies optional data included in status reports. If Run substatus is enabled it may be used for simple probe protection. NOTE: Parser state will be sent separately after the status report and only on changes.",
  "keywords": [
   "options",
   "report",
   "status"
  ]
 },
 {
  "code": "$11",
  "name": "Junction deviation",
  "desc": "SLB-EXT default: 0.010 mm. Sets how fast Grbl travels through consecutive motions. Lower value slows it down.",
  "keywords": [
   "deviation",
   "junction"
  ]
 },
 {
  "code": "$12",
  "name": "Arc tolerance",
  "desc": "SLB-EXT default: 0.002 mm. Sets the G2 and G3 arc tracing accuracy based on radial error. Beware: A very small value may effect performance.",
  "keywords": [
   "arc",
   "tolerance"
  ]
 },
 {
  "code": "$13",
  "name": "Report in inches",
  "desc": "SLB-EXT default: Disabled (0). Enables inch units when returning any position and rate value that is not a settings value.",
  "keywords": [
   "inches",
   "report"
  ]
 },
 {
  "code": "$14",
  "name": "Invert control pins",
  "desc": "SLB-EXT default: Reset: OFF Feed hold: ON Cycle start: ON Safety door: ON EStop: OFF (14). Inverts the control signals (active low). NOTE: Block delete, Optional stop, EStop and Probe connected are optional signals, availability is driver dependent.",
  "keywords": [
   "control",
   "invert",
   "pins"
  ]
 },
 {
  "code": "$15",
  "name": "Invert coolant pins",
  "desc": "SLB-EXT default: Flood: OFF Mist: OFF (0). Inverts the coolant and mist signals (active low).",
  "keywords": [
   "coolant",
   "invert",
   "pins"
  ]
 },
 {
  "code": "$16",
  "name": "Invert spindle signals",
  "desc": "SLB-EXT default: Spindle en: OFF Spindle dir: OFF PWM: OFF (0). Inverts the spindle on, counterclockwise and PWM signals (active low). NOTE: A hard reset of the controller is required after changing this setting.",
  "keywords": [
   "invert",
   "signals",
   "spindle"
  ]
 },
 {
  "code": "$17",
  "name": "Pullup disable control pins",
  "desc": "SLB-EXT default: Reset: OFF Feed hold: OFF Cycle start: OFF Safety door: OFF EStop: OFF (0). Disable the control signals pullup resistors. Potentially enables pulldown resistor if available. NOTE: Block delete, Optional stop and EStop are optional signals, availability is driver dependent.",
  "keywords": [
   "control",
   "disable",
   "pins",
   "pullup"
  ]
 },
 {
  "code": "$18",
  "name": "Pullup disable limit pins",
  "desc": "SLB-EXT default: X: OFF Y: OFF Z: OFF A: OFF (0). Disable the limit signals pullup resistors. Potentially enables pulldown resistor if available.",
  "keywords": [
   "disable",
   "limit",
   "pins",
   "pullup"
  ]
 },
 {
  "code": "$19",
  "name": "Pullup disable probe pin",
  "desc": "SLB-EXT default: Disabled (0). Disable the probe signal pullup resistor. Potentially enables pulldown resistor if available.",
  "keywords": [
   "disable",
   "pin",
   "probe",
   "pullup"
  ]
 },
 {
  "code": "$20",
  "name": "Soft limits enable",
  "desc": "SLB-EXT default: Disabled (0). Enables soft limits checks within machine travel and sets alarm when exceeded. Requires homing.",
  "keywords": [
   "enable",
   "homing",
   "limits",
   "soft"
  ]
 },
 {
  "code": "$21",
  "name": "Hard limits enable",
  "desc": "SLB-EXT default: Enable: OFF Strict mode: OFF (0). When enabled immediately halts motion and throws an alarm when a limit switch is triggered. In strict mode only homing is possible when a switch is engaged.",
  "keywords": [
   "enable",
   "hard",
   "homing",
   "limits"
  ]
 },
 {
  "code": "$22",
  "name": "Homing cycle",
  "desc": "SLB-EXT default: Enable: OFF Single axis commands: OFF Homing on startup: OFF Set machine origin: OFF Two switches share one input: OFF Allow manual: OFF Override locks: OFF Keep homed status on reset: OFF (0). Enables homing cycle. Requires limit switches on axes to be automatically homed. When `Enable single axis commands` is checked, single axis homing can be performed by $H<axis letter> commands. When `Allow manual` is checked, axes not homed automatically may be homed manually by $H or $H<axis letter> commands. `Override locks` is for allowing a soft reset to disable `Homing on startup required`.",
  "keywords": [
   "cycle",
   "homing",
   "limits"
  ]
 },
 {
  "code": "$23",
  "name": "Homing direction invert",
  "desc": "SLB-EXT default: X: ON Y: ON Z: OFF A: ON (11). Homing searches for a switch in the positive direction. Set axis bit to search in negative direction.",
  "keywords": [
   "direction",
   "homing",
   "invert",
   "limits"
  ]
 },
 {
  "code": "$24",
  "name": "Homing locate feed rate",
  "desc": "SLB-EXT default: 150 mm/min. Feed rate to slowly engage limit switch to determine its location accurately.",
  "keywords": [
   "feed",
   "homing",
   "limits",
   "locate",
   "rate"
  ]
 },
 {
  "code": "$25",
  "name": "Homing search seek rate",
  "desc": "SLB-EXT default: 4300 mm/min. Seek rate to quickly find the limit switch before the slower locating phase.",
  "keywords": [
   "homing",
   "limits",
   "rate",
   "search",
   "seek"
  ]
 },
 {
  "code": "$26",
  "name": "Homing switch debounce delay",
  "desc": "SLB-EXT default: 25 milliseconds. Sets a short delay between phases of homing cycle to let a switch debounce.",
  "keywords": [
   "debounce",
   "delay",
   "homing",
   "limits",
   "switch"
  ]
 },
 {
  "code": "$27",
  "name": "Homing switch pull-off distance",
  "desc": "SLB-EXT default: 1.5 mm. Retract distance after triggering switch to disengage it. Homing will fail if switch isn't cleared.",
  "keywords": [
   "distance",
   "homing",
   "limits",
   "off",
   "pull",
   "switch"
  ]
 },
 {
  "code": "$28",
  "name": "G73 retract distance",
  "desc": "SLB-EXT default: 0.1 mm. G73 retract distance (for chip breaking drilling).",
  "keywords": [
   "distance",
   "retract"
  ]
 },
 {
  "code": "$29",
  "name": "Pulse delay",
  "desc": "SLB-EXT default: 0 microseconds. Step pulse delay. Normally leave this at 0 as there is an implicit delay on direction changes when AMASS is active.",
  "keywords": [
   "delay",
   "invert",
   "pulse",
   "signal",
   "stepper"
  ]
 },
 {
  "code": "$30",
  "name": "Maximum spindle speed",
  "desc": "SLB-EXT default: 24000 RPM. Maximum spindle speed, can be overridden by spindle plugins.",
  "keywords": [
   "maximum",
   "speed",
   "spindle"
  ]
 },
 {
  "code": "$31",
  "name": "Minimum spindle speed",
  "desc": "SLB-EXT default: 7500 RPM. Minimum spindle speed, can be overridden by spindle plugins.",
  "keywords": [
   "minimum",
   "speed",
   "spindle"
  ]
 },
 {
  "code": "$32",
  "name": "Mode of operation",
  "desc": "SLB-EXT default: Normal (0). Laser mode: consecutive G1/2/3 commands will not halt when spindle speed is changed. Lathe mode: allows use of G7, G8, G96 and G97.",
  "keywords": [
   "mode",
   "operation",
   "spindle"
  ]
 },
 {
  "code": "$33",
  "name": "Spindle PWM frequency",
  "desc": "SLB-EXT default: 1000 Hz. Spindle PWM frequency.",
  "keywords": [
   "frequency",
   "pwm",
   "spindle"
  ]
 },
 {
  "code": "$34",
  "name": "Spindle PWM off value",
  "desc": "SLB-EXT default: 0 percent. Spindle PWM off value in percent (duty cycle).",
  "keywords": [
   "off",
   "pwm",
   "spindle",
   "value"
  ]
 },
 {
  "code": "$35",
  "name": "Spindle PWM min value",
  "desc": "SLB-EXT default: 0 percent. Spindle PWM min value in percent (duty cycle).",
  "keywords": [
   "min",
   "pwm",
   "spindle",
   "value"
  ]
 },
 {
  "code": "$36",
  "name": "Spindle PWM max value",
  "desc": "SLB-EXT default: 100 percent. Spindle PWM max value in percent (duty cycle).",
  "keywords": [
   "max",
   "pwm",
   "spindle",
   "value"
  ]
 },
 {
  "code": "$37",
  "name": "Steppers de-energize",
  "desc": "SLB-EXT default: X: OFF Y: OFF Z: OFF A: OFF (0). Specifies which steppers not to disable when stopped.",
  "keywords": [
   "energize",
   "invert",
   "signal",
   "stepper",
   "steppers"
  ]
 },
 {
  "code": "$38",
  "name": "Spindle pulses per revolution (PPR)",
  "desc": "Spindle encoder pulses per revolution.",
  "keywords": [
   "spindle",
   "pulses",
   "per",
   "revolution",
   "ppr"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$39",
  "name": "Enable legacy RT commands",
  "desc": "SLB-EXT default: Enabled (1). Enables \"normal\" processing of ?, ! and ~ characters when part of $-setting or comment. If disabled then they are added to the input string instead.",
  "keywords": [
   "commands",
   "enable",
   "invert",
   "legacy",
   "signal",
   "stepper"
  ]
 },
 {
  "code": "$40",
  "name": "Limit jog commands",
  "desc": "SLB-EXT default: Enabled (1). Limit jog commands to machine limits for homed axes.",
  "keywords": [
   "commands",
   "jog",
   "limit"
  ]
 },
 {
  "code": "$41",
  "name": "Parking cycle",
  "desc": "SLB-EXT default: Enable: ON Parking override control: OFF Deactivate upon init: OFF (1). Enables parking cycle, requires parking axis homed.",
  "keywords": [
   "cycle",
   "parking"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$42",
  "name": "Parking axis",
  "desc": "SLB-EXT default: Z (2). Define which axis that performs the parking motion.",
  "keywords": [
   "axis",
   "parking"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$43",
  "name": "Homing passes",
  "desc": "SLB-EXT default: 1. Number of homing passes. Minimum 1, maximum 128.",
  "keywords": [
   "homing",
   "limits",
   "passes"
  ]
 },
 {
  "code": "$44",
  "name": "Axes homing, first pass",
  "desc": "SLB-EXT default: X: OFF Y: OFF Z: ON A: OFF (4). Axes to home in first pass.",
  "keywords": [
   "axes",
   "first",
   "homing",
   "limits",
   "pass"
  ]
 },
 {
  "code": "$45",
  "name": "Axes homing, second pass",
  "desc": "SLB-EXT default: X: ON Y: ON Z: OFF A: OFF (3). Axes to home in second pass.",
  "keywords": [
   "axes",
   "homing",
   "limits",
   "pass",
   "second"
  ]
 },
 {
  "code": "$46",
  "name": "Axes homing, third pass",
  "desc": "SLB-EXT default: X: OFF Y: OFF Z: OFF A: OFF (0). Axes to home in third pass.",
  "keywords": [
   "axes",
   "homing",
   "limits",
   "pass",
   "third"
  ]
 },
 {
  "code": "$47",
  "name": "Axes homing, fourth pass",
  "desc": "SLB-EXT default: X: OFF Y: OFF Z: OFF A: OFF (0). Axes to home in fourth pass.",
  "keywords": [
   "axes",
   "fourth",
   "homing",
   "limits",
   "pass"
  ]
 },
 {
  "code": "$48",
  "name": "Axes homing, fifth phase",
  "desc": "Axes to home in fifth phase.",
  "keywords": [
   "axes",
   "homing",
   "fifth",
   "phase"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$49",
  "name": "Axes homing, sixth phase",
  "desc": "Axes to home in sixth phase.",
  "keywords": [
   "axes",
   "homing",
   "sixth",
   "phase"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$56",
  "name": "Parking pull-out distance",
  "desc": "SLB-EXT default: 5 mm. Spindle pull-out and plunge distance in mm.Incremental distance.",
  "keywords": [
   "distance",
   "out",
   "parking",
   "pull"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$57",
  "name": "Parking pull-out rate",
  "desc": "SLB-EXT default: 100 mm/min. Spindle pull-out/plunge slow feed rate in mm/min.",
  "keywords": [
   "out",
   "parking",
   "pull",
   "rate"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$58",
  "name": "Parking target",
  "desc": "SLB-EXT default: -5 mm. Parking axis target. In mm, as machine coordinate [-max_travel, 0].",
  "keywords": [
   "parking",
   "target"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$59",
  "name": "Parking fast rate",
  "desc": "SLB-EXT default: 500 mm/min. Parking fast rate to target after pull-out in mm/min.",
  "keywords": [
   "fast",
   "parking",
   "rate"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$60",
  "name": "Restore overrides",
  "desc": "SLB-EXT default: Enabled (1). Restore overrides to default values at program end.",
  "keywords": [
   "overrides",
   "restore"
  ]
 },
 {
  "code": "$61",
  "name": "Safety door options",
  "desc": "SLB-EXT default: Ignore when idle: ON Keep coolant state: ON (3). Enable this if it is desirable to open the safety door when in IDLE mode (eg. for jogging).",
  "keywords": [
   "door",
   "options",
   "safety"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$62",
  "name": "Sleep enable",
  "desc": "SLB-EXT default: Disabled (0). Enable sleep mode.",
  "keywords": [
   "enable",
   "sleep"
  ]
 },
 {
  "code": "$63",
  "name": "Feed hold actions",
  "desc": "SLB-EXT default: Disable laser: ON Restore spindle and coolant state: ON (3). Actions taken during feed hold and on resume from feed hold.",
  "keywords": [
   "actions",
   "feed",
   "hold"
  ]
 },
 {
  "code": "$64",
  "name": "Force init alarm",
  "desc": "SLB-EXT default: Disabled (0). Starts Grbl in alarm mode after a cold reset.",
  "keywords": [
   "alarm",
   "force",
   "init"
  ]
 },
 {
  "code": "$65",
  "name": "Probing feed override",
  "desc": "SLB-EXT default: Disabled (0). Allow feed override during probing.",
  "keywords": [
   "feed",
   "override",
   "probing"
  ]
 },
 {
  "code": "$66",
  "name": "Spindle linearisation, 1st point",
  "desc": "Comma separated list of values: RPM_MIN, RPM_LINE_A1, RPM_LINE_B1, set to blank to disable.",
  "keywords": [
   "spindle",
   "linearisation",
   "point"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$67",
  "name": "Spindle linearisation, 2nd point",
  "desc": "Comma separated list of values: RPM_POINT12, RPM_LINE_A2, RPM_LINE_B2, set to blank to disable.",
  "keywords": [
   "spindle",
   "linearisation",
   "point"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$68",
  "name": "Spindle linearisation, 3rd point",
  "desc": "Comma separated list of values: RPM_POINT23, RPM_LINE_A3, RPM_LINE_B3, set to blank to disable.",
  "keywords": [
   "spindle",
   "linearisation",
   "point"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$69",
  "name": "Spindle linearisation, 4th point",
  "desc": "Comma separated list of values: RPM_POINT34, RPM_LINE_A4, RPM_LINE_B4, set to blank to disable.",
  "keywords": [
   "spindle",
   "linearisation",
   "point"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$70",
  "name": "Network services",
  "desc": "SLB-EXT default: Telnet: ON Websocket: ON FTP: ON (11). Network services/protocols to enable. NOTE: A hard reset of the controller is required after changing this setting.",
  "keywords": [
   "ethernet",
   "ip",
   "network",
   "services"
  ]
 },
 {
  "code": "$90",
  "name": "Spindle sync P-gain",
  "desc": "Spindle sync P-gain",
  "keywords": [
   "spindle",
   "sync",
   "gain"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$91",
  "name": "Spindle sync I-gain",
  "desc": "Spindle sync I-gain",
  "keywords": [
   "spindle",
   "sync",
   "gain"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$92",
  "name": "Spindle sync D-gain",
  "desc": "Spindle sync D-gain",
  "keywords": [
   "spindle",
   "sync",
   "gain"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$95",
  "name": "Spindle sync PID max I error",
  "desc": "Spindle sync PID max integrator error.",
  "keywords": [
   "spindle",
   "sync",
   "pid",
   "max",
   "error"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$100",
  "name": "X-axis travel resolution",
  "desc": "SLB-EXT default: 800 step/mm. Travel resolution in steps per millimeter.",
  "keywords": [
   "axis",
   "calibration",
   "motion",
   "resolution",
   "steps",
   "travel"
  ]
 },
 {
  "code": "$101",
  "name": "Y-axis travel resolution",
  "desc": "SLB-EXT default: 800 step/mm. Travel resolution in steps per millimeter.",
  "keywords": [
   "axis",
   "calibration",
   "motion",
   "resolution",
   "steps",
   "travel"
  ]
 },
 {
  "code": "$102",
  "name": "Z-axis travel resolution",
  "desc": "SLB-EXT default: 800 step/mm. Travel resolution in steps per millimeter.",
  "keywords": [
   "axis",
   "calibration",
   "motion",
   "resolution",
   "steps",
   "travel"
  ]
 },
 {
  "code": "$103",
  "name": "A-axis travel resolution",
  "desc": "SLB-EXT default: 79.012345679 step/deg. Travel resolution in steps per millimeter.",
  "keywords": [
   "axis",
   "calibration",
   "motion",
   "resolution",
   "steps",
   "travel"
  ]
 },
 {
  "code": "$110",
  "name": "X-axis maximum rate",
  "desc": "SLB-EXT default: 4000 mm/min. Maximum rate. Used as G0 rapid rate.",
  "keywords": [
   "axis",
   "calibration",
   "maximum",
   "motion",
   "rate",
   "steps"
  ]
 },
 {
  "code": "$111",
  "name": "Y-axis maximum rate",
  "desc": "SLB-EXT default: 4000 mm/min. Maximum rate. Used as G0 rapid rate.",
  "keywords": [
   "axis",
   "calibration",
   "maximum",
   "motion",
   "rate",
   "steps"
  ]
 },
 {
  "code": "$112",
  "name": "Z-axis maximum rate",
  "desc": "SLB-EXT default: 4000 mm/min. Maximum rate. Used as G0 rapid rate.",
  "keywords": [
   "axis",
   "calibration",
   "maximum",
   "motion",
   "rate",
   "steps"
  ]
 },
 {
  "code": "$113",
  "name": "A-axis maximum rate",
  "desc": "SLB-EXT default: 8000 deg/min. Maximum rate. Used as G0 rapid rate.",
  "keywords": [
   "axis",
   "calibration",
   "maximum",
   "motion",
   "rate",
   "steps"
  ]
 },
 {
  "code": "$120",
  "name": "X-axis acceleration",
  "desc": "SLB-EXT default: 750 mm/sec^2. Acceleration. Used for motion planning to not exceed motor torque and lose steps.",
  "keywords": [
   "acceleration",
   "axis",
   "calibration",
   "motion",
   "steps"
  ]
 },
 {
  "code": "$121",
  "name": "Y-axis acceleration",
  "desc": "SLB-EXT default: 750 mm/sec^2. Acceleration. Used for motion planning to not exceed motor torque and lose steps.",
  "keywords": [
   "acceleration",
   "axis",
   "calibration",
   "motion",
   "steps"
  ]
 },
 {
  "code": "$122",
  "name": "Z-axis acceleration",
  "desc": "SLB-EXT default: 750 mm/sec^2. Acceleration. Used for motion planning to not exceed motor torque and lose steps.",
  "keywords": [
   "acceleration",
   "axis",
   "calibration",
   "motion",
   "steps"
  ]
 },
 {
  "code": "$123",
  "name": "A-axis acceleration",
  "desc": "SLB-EXT default: 1000 deg/sec^2. Acceleration. Used for motion planning to not exceed motor torque and lose steps.",
  "keywords": [
   "acceleration",
   "axis",
   "calibration",
   "motion",
   "steps"
  ]
 },
 {
  "code": "$130",
  "name": "X-axis maximum travel",
  "desc": "SLB-EXT default: 810 mm. Maximum axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.",
  "keywords": [
   "axis",
   "calibration",
   "maximum",
   "motion",
   "steps",
   "travel"
  ]
 },
 {
  "code": "$131",
  "name": "Y-axis maximum travel",
  "desc": "SLB-EXT default: 855 mm. Maximum axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.",
  "keywords": [
   "axis",
   "calibration",
   "maximum",
   "motion",
   "steps",
   "travel"
  ]
 },
 {
  "code": "$132",
  "name": "Z-axis maximum travel",
  "desc": "SLB-EXT default: 120 mm. Maximum axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.",
  "keywords": [
   "axis",
   "calibration",
   "maximum",
   "motion",
   "steps",
   "travel"
  ]
 },
 {
  "code": "$133",
  "name": "A-axis maximum travel",
  "desc": "SLB-EXT default: 0 deg. Maximum axis travel distance from homing switch. Determines valid machine space for soft-limits and homing search distances.",
  "keywords": [
   "axis",
   "calibration",
   "maximum",
   "motion",
   "steps",
   "travel"
  ]
 },
 {
  "code": "$140",
  "name": "X-axis motor current",
  "desc": "SLB-EXT default: 2800 mA. Motor current in mA (RMS). NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "current",
   "driver",
   "motor",
   "trinamic"
  ]
 },
 {
  "code": "$141",
  "name": "Y-axis motor current",
  "desc": "Motor current in mA (RMS). NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "current",
   "driver",
   "motor",
   "trinamic"
  ]
 },
 {
  "code": "$142",
  "name": "Z-axis motor current",
  "desc": "Motor current in mA (RMS). NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "current",
   "driver",
   "motor",
   "trinamic"
  ]
 },
 {
  "code": "$143",
  "name": "A-axis motor current",
  "desc": "SLB-EXT default: 0. Motor current in mA (RMS). NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "current",
   "driver",
   "motor",
   "trinamic"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$150",
  "name": "X-axis microsteps",
  "desc": "SLB-EXT default: 32 steps. Microsteps per fullstep. NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "driver",
   "microsteps",
   "motor",
   "trinamic"
  ]
 },
 {
  "code": "$151",
  "name": "Y-axis microsteps",
  "desc": "Microsteps per fullstep. NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "driver",
   "microsteps",
   "motor",
   "trinamic"
  ]
 },
 {
  "code": "$152",
  "name": "Z-axis microsteps",
  "desc": "Microsteps per fullstep. NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "driver",
   "microsteps",
   "motor",
   "trinamic"
  ]
 },
 {
  "code": "$153",
  "name": "A-axis microsteps",
  "desc": "SLB-EXT default: 16. Microsteps per fullstep. NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "driver",
   "microsteps",
   "motor",
   "trinamic"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$180",
  "name": "X-axis homing locate feed rate",
  "desc": "SLB-EXT default: 150 mm/min. Feed rate to slowly engage limit switch to determine its location accurately. NOTE: Defaults to $24 setting if axis isn't controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "feed",
   "homing",
   "limits",
   "locate",
   "rate"
  ]
 },
 {
  "code": "$181",
  "name": "Y-axis homing locate feed rate",
  "desc": "Feed rate to slowly engage limit switch to determine its location accurately. NOTE: Defaults to $24 setting if axis isn't controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "feed",
   "homing",
   "limits",
   "locate",
   "rate"
  ]
 },
 {
  "code": "$182",
  "name": "Z-axis homing locate feed rate",
  "desc": "Feed rate to slowly engage limit switch to determine its location accurately. NOTE: Defaults to $24 setting if axis isn't controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "feed",
   "homing",
   "limits",
   "locate",
   "rate"
  ]
 },
 {
  "code": "$183",
  "name": "A-axis homing locate feed rate",
  "desc": "Feed rate to slowly engage limit switch to determine its location accurately. NOTE: Defaults to $24 setting if axis isn't controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "feed",
   "homing",
   "limits",
   "locate",
   "rate"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$190",
  "name": "X-axis homing search seek rate",
  "desc": "SLB-EXT default: 4300 mm/min. Seek rate to quickly find the limit switch before the slower locating phase. NOTE: Defaults to $25 setting if axis isn't controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "homing",
   "limits",
   "rate",
   "search",
   "seek"
  ]
 },
 {
  "code": "$191",
  "name": "Y-axis homing search seek rate",
  "desc": "Seek rate to quickly find the limit switch before the slower locating phase. NOTE: Defaults to $25 setting if axis isn't controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "homing",
   "limits",
   "rate",
   "search",
   "seek"
  ]
 },
 {
  "code": "$192",
  "name": "Z-axis homing search seek rate",
  "desc": "Seek rate to quickly find the limit switch before the slower locating phase. NOTE: Defaults to $25 setting if axis isn't controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "homing",
   "limits",
   "rate",
   "search",
   "seek"
  ]
 },
 {
  "code": "$193",
  "name": "A-axis homing search seek rate",
  "desc": "Seek rate to quickly find the limit switch before the slower locating phase. NOTE: Defaults to $25 setting if axis isn't controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "homing",
   "limits",
   "rate",
   "search",
   "seek"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$200",
  "name": "X-axis StallGuard2 fast threshold",
  "desc": "SLB-EXT default: 22. StallGuard threshold for fast (seek) homing phase. NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "driver",
   "fast",
   "motor",
   "stallguard",
   "threshold",
   "trinamic"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$201",
  "name": "Y-axis StallGuard2 fast threshold",
  "desc": "StallGuard threshold for fast (seek) homing phase. NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "driver",
   "fast",
   "motor",
   "stallguard",
   "threshold",
   "trinamic"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$202",
  "name": "Z-axis StallGuard2 fast threshold",
  "desc": "StallGuard threshold for fast (seek) homing phase. NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "driver",
   "fast",
   "motor",
   "stallguard",
   "threshold",
   "trinamic"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$203",
  "name": "A-axis StallGuard2 fast threshold",
  "desc": "StallGuard threshold for fast (seek) homing phase. NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "driver",
   "fast",
   "motor",
   "stallguard",
   "threshold",
   "trinamic"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$210",
  "name": "X-axis hold current",
  "desc": "SLB-EXT default: 35 %. Motor current at standstill as a percentage of full current. NOTE: If grblHAL is configured to disable motors on standstill this setting has no use. Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "current",
   "driver",
   "hold",
   "motor",
   "trinamic"
  ]
 },
 {
  "code": "$211",
  "name": "Y-axis hold current",
  "desc": "Motor current at standstill as a percentage of full current. NOTE: If grblHAL is configured to disable motors on standstill this setting has no use. Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "current",
   "driver",
   "hold",
   "motor",
   "trinamic"
  ]
 },
 {
  "code": "$212",
  "name": "Z-axis hold current",
  "desc": "Motor current at standstill as a percentage of full current. NOTE: If grblHAL is configured to disable motors on standstill this setting has no use. Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "current",
   "driver",
   "hold",
   "motor",
   "trinamic"
  ]
 },
 {
  "code": "$213",
  "name": "A-axis hold current",
  "desc": "SLB-EXT default: 50. Motor current at standstill as a percentage of full current. NOTE: If grblHAL is configured to disable motors on standstill this setting has no use. Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "current",
   "driver",
   "hold",
   "motor",
   "trinamic"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$220",
  "name": "X-axis stallGuard2 slow threshold",
  "desc": "SLB-EXT default: 22. StallGuard threshold for slow (feed) homing phase. NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "driver",
   "motor",
   "slow",
   "stallguard",
   "threshold",
   "trinamic"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$221",
  "name": "Y-axis stallGuard2 slow threshold",
  "desc": "StallGuard threshold for slow (feed) homing phase. NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "driver",
   "motor",
   "slow",
   "stallguard",
   "threshold",
   "trinamic"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$222",
  "name": "Z-axis stallGuard2 slow threshold",
  "desc": "StallGuard threshold for slow (feed) homing phase. NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "driver",
   "motor",
   "slow",
   "stallguard",
   "threshold",
   "trinamic"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$223",
  "name": "A-axis stallGuard2 slow threshold",
  "desc": "StallGuard threshold for slow (feed) homing phase. NOTE: Only used for axes controlled by a Trinamic driver.",
  "keywords": [
   "axis",
   "driver",
   "motor",
   "slow",
   "stallguard",
   "threshold",
   "trinamic"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$300",
  "name": "Hostname",
  "desc": "SLB-EXT default: grblHAL. Network hostname. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "ethernet",
   "hostname",
   "ip",
   "network"
  ]
 },
 {
  "code": "$301",
  "name": "IP mode",
  "desc": "SLB-EXT default: Static (0). IP mode. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "ethernet",
   "ip",
   "mode",
   "network"
  ]
 },
 {
  "code": "$302",
  "name": "IP address",
  "desc": "SLB-EXT default: 192.168.5.1. Static IP address. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "address",
   "ethernet",
   "ip",
   "network"
  ]
 },
 {
  "code": "$303",
  "name": "Gateway",
  "desc": "SLB-EXT default: 192.168.5.1. Static gateway address. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "ethernet",
   "gateway",
   "ip",
   "network"
  ]
 },
 {
  "code": "$304",
  "name": "Netmask",
  "desc": "SLB-EXT default: 255.255.255.0. Static netmask. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "ethernet",
   "ip",
   "netmask",
   "network"
  ]
 },
 {
  "code": "$305",
  "name": "Telnet port",
  "desc": "SLB-EXT default: 23. (Raw) Telnet port number listening for incoming connections. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "ethernet",
   "ip",
   "network",
   "port",
   "telnet"
  ]
 },
 {
  "code": "$307",
  "name": "Websocket port",
  "desc": "SLB-EXT default: 80. Websocket port number listening for incoming connections. NOTE: WebUI requires this to be HTTP port number + 1. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "ethernet",
   "ip",
   "network",
   "port",
   "websocket"
  ]
 },
 {
  "code": "$308",
  "name": "FTP port",
  "desc": "SLB-EXT default: 21. FTP port number listening for incoming connections. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "ethernet",
   "ftp",
   "ip",
   "network",
   "port"
  ]
 },
 {
  "code": "$338",
  "name": "Trinamic driver",
  "desc": "SLB-EXT default: X: ON Y: ON Z: ON A: OFF (7). Enable SPI or UART controlled Trinamic drivers for axes.",
  "keywords": [
   "driver",
   "ethernet",
   "ip",
   "motor",
   "network",
   "trinamic"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$339",
  "name": "Sensorless homing",
  "desc": "SLB-EXT default: X: OFF Y: OFF Z: OFF A: OFF (0). Enable sensorless homing for axes. Requires SPI or UART controlled Trinamic drivers.",
  "keywords": [
   "driver",
   "ethernet",
   "homing",
   "ip",
   "motor",
   "network",
   "sensorless",
   "trinamic"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$340",
  "name": "Spindle at speed tolerance",
  "desc": "SLB-EXT default: 0 percent. Spindle at speed tolerance as percentage deviation from programmed speed, set to 0 to disable. If not within tolerance when checked after spindle on delay ($392) alarm 14 is raised.",
  "keywords": [
   "speed",
   "spindle",
   "tolerance"
  ]
 },
 {
  "code": "$341",
  "name": "Tool change mode",
  "desc": "SLB-EXT default: Normal (0). Normal: allows jogging for manual touch off. Set new position manually. Manual touch off: retracts tool axis to home position for tool change, use jogging or $TPW for touch off. Manual touch off @ G59.3: retracts tool axis to home position then to G59.3 position for tool change, use jogging or $TPW for touch off. Automatic touch off @ G59.3: retracts tool axis to home position for tool change, then to G59.3 position for automatic touch off. All modes except \"Normal\" and \"Ignore M6\" returns the tool (controlled point) to original position after touch off.",
  "keywords": [
   "change",
   "mode",
   "probe",
   "tool",
   "tool change",
   "toolchange",
   "touch off"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$342",
  "name": "Tool change probing distance",
  "desc": "SLB-EXT default: 30 mm. Maximum probing distance for automatic or $TPW touch off.",
  "keywords": [
   "change",
   "distance",
   "probe",
   "probing",
   "tool",
   "tool change",
   "toolchange",
   "touch off"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$343",
  "name": "Tool change locate feed rate",
  "desc": "SLB-EXT default: 25 mm/min. Feed rate to slowly engage tool change sensor to determine the tool offset accurately.",
  "keywords": [
   "change",
   "feed",
   "locate",
   "probe",
   "rate",
   "tool",
   "tool change",
   "toolchange",
   "touch off"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$344",
  "name": "Tool change search seek rate",
  "desc": "SLB-EXT default: 200 mm/min. Seek rate to quickly find the tool change sensor before the slower locating phase.",
  "keywords": [
   "change",
   "probe",
   "rate",
   "search",
   "seek",
   "tool",
   "tool change",
   "toolchange",
   "touch off"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$345",
  "name": "Tool change probe pull-off rate",
  "desc": "SLB-EXT default: 200 mm/min. Pull-off rate for the retract move before the slower locating phase.",
  "keywords": [
   "change",
   "off",
   "probe",
   "pull",
   "rate",
   "tool",
   "tool change",
   "toolchange",
   "touch off"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$346",
  "name": "Restore position after M6",
  "desc": "SLB-EXT default: Enabled (1). When set the spindle is moved so that the controlled point (tool tip) is the same as before the M6 command, if not the spindle is only moved to the Z home position.",
  "keywords": [
   "after",
   "position",
   "probe",
   "restore",
   "tool change",
   "toolchange",
   "touch off"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$347",
  "name": "Dual axis length fail",
  "desc": "(percent) Dual axis length fail in percent of axis max travel.",
  "keywords": [
   "dual",
   "axis",
   "length",
   "fail"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$348",
  "name": "Dual axis length fail min",
  "desc": "(mm) Dual axis length fail minimum distance.",
  "keywords": [
   "dual",
   "axis",
   "length",
   "fail",
   "min"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$349",
  "name": "Dual axis length fail max",
  "desc": "(mm) Dual axis length fail maximum distance.",
  "keywords": [
   "dual",
   "axis",
   "length",
   "fail",
   "max"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$370",
  "name": "Invert I/O Port inputs",
  "desc": "SLB-EXT default: (0). Invert IOPort inputs.",
  "keywords": [
   "inputs",
   "invert",
   "port"
  ]
 },
 {
  "code": "$372",
  "name": "Invert I/O Port outputs",
  "desc": "SLB-EXT default: (0). Invert IOPort output.",
  "keywords": [
   "invert",
   "outputs",
   "port"
  ]
 },
 {
  "code": "$374",
  "name": "Modbus baud rate",
  "desc": "SLB-EXT default: 19200 (3).",
  "keywords": [
   "baud",
   "modbus",
   "rate",
   "rs485",
   "vfd"
  ]
 },
 {
  "code": "$375",
  "name": "Modbus RX timeout",
  "desc": "SLB-EXT default: 50 milliseconds.",
  "keywords": [
   "modbus",
   "rs485",
   "timeout",
   "vfd"
  ]
 },
 {
  "code": "$376",
  "name": "Rotational axes",
  "desc": "SLB-EXT default: A-Axis: ON (1).",
  "keywords": [
   "axes",
   "rotational"
  ]
 },
 {
  "code": "$384",
  "name": "Disable G92 persistence",
  "desc": "SLB-EXT default: Disabled (0). Disables save/restore of G92 offset to non-volatile storage (NVS).",
  "keywords": [
   "disable",
   "persistence"
  ]
 },
 {
  "code": "$392",
  "name": "Spindle on delay",
  "desc": "SLB-EXT default: 11 s. Delay to allow spindle to spin up after safety door is opened.",
  "keywords": [
   "delay",
   "spindle"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$393",
  "name": "Coolant on delay",
  "desc": "SLB-EXT default: 1 s. Delay to allow coolant to restart after safety door is opened.",
  "keywords": [
   "coolant",
   "delay"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$394",
  "name": "Spindle off delay (s)",
  "desc": "grblHAL: pause after M5 — spin-down time.",
  "keywords": [
   "spindle",
   "delay",
   "spindown",
   "off delay"
  ]
 },
 {
  "code": "$395",
  "name": "Default spindle",
  "desc": "SLB-EXT default: SLB_SPINDLE (0). Spindle selected on startup.",
  "keywords": [
   "default",
   "laser",
   "spindle"
  ]
 },
 {
  "code": "$398",
  "name": "Planner buffer blocks",
  "desc": "SLB-EXT default: 128. Number of blocks in the planner buffer. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "blocks",
   "buffer",
   "planner"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$399",
  "name": "CAN bus baud rate",
  "desc": "CAN bus baud rate",
  "keywords": [
   "can",
   "bus",
   "baud",
   "rate"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$450",
  "name": "Button 1 action",
  "desc": "SLB-EXT default: Cycle start (1). Assign a real-time action to button 1, or run your own macro g-code.",
  "keywords": [
   "action",
   "button",
   "macro"
  ]
 },
 {
  "code": "$451",
  "name": "Button 2 action",
  "desc": "SLB-EXT default: Pause (2). Assign a real-time action to button 2, or run your own macro g-code.",
  "keywords": [
   "action",
   "button",
   "macro"
  ]
 },
 {
  "code": "$452",
  "name": "Button 3 action",
  "desc": "SLB-EXT default: Halt (4). Assign a real-time action to button 3, or run your own macro g-code.",
  "keywords": [
   "action",
   "button",
   "macro"
  ]
 },
 {
  "code": "$453",
  "name": "Button 1 macro",
  "desc": "SLB-EXT default: G4P0. Macro content, limited to 127 characters. Separate lines with the vertical bar character |.",
  "keywords": [
   "action",
   "button",
   "macro"
  ]
 },
 {
  "code": "$454",
  "name": "Button 2 macro",
  "desc": "SLB-EXT default: G4P0. Macro content, limited to 127 characters. Separate lines with the vertical bar character |.",
  "keywords": [
   "action",
   "button",
   "macro"
  ]
 },
 {
  "code": "$455",
  "name": "Button 3 macro",
  "desc": "SLB-EXT default: G4P0. Macro content, limited to 127 characters. Separate lines with the vertical bar character |.",
  "keywords": [
   "action",
   "button",
   "macro"
  ]
 },
 {
  "code": "$456",
  "name": "Aux output 0 trigger",
  "desc": "SLB-EXT default: Spindle/Laser enable (0). A second, more common action can be assigned to trigger this output. M62/63 P# is always available as a buffered on/off or M64/65 P# as an immediate on/off.",
  "keywords": [
   "action",
   "aux",
   "button",
   "macro",
   "output",
   "trigger"
  ]
 },
 {
  "code": "$457",
  "name": "Aux output 1 trigger",
  "desc": "SLB-EXT default: Flood enable (2). A second, more common action can be assigned to trigger this output. M62/63 P# is always available as a buffered on/off or M64/65 P# as an immediate on/off.",
  "keywords": [
   "action",
   "aux",
   "button",
   "macro",
   "output",
   "trigger"
  ]
 },
 {
  "code": "$458",
  "name": "Aux output 2 trigger",
  "desc": "SLB-EXT default: Spindle/Laser enable (0). A second, more common action can be assigned to trigger this output. M62/63 P# is always available as a buffered on/off or M64/65 P# as an immediate on/off.",
  "keywords": [
   "action",
   "aux",
   "button",
   "macro",
   "output",
   "trigger"
  ]
 },
 {
  "code": "$459",
  "name": "Aux output 3 trigger",
  "desc": "SLB-EXT default: Flood enable (2). A second, more common action can be assigned to trigger this output. M62/63 P# is always available as a buffered on/off or M64/65 P# as an immediate on/off.",
  "keywords": [
   "action",
   "aux",
   "button",
   "macro",
   "output",
   "trigger"
  ]
 },
 {
  "code": "$462",
  "name": "Run/stop register",
  "desc": "SLB-EXT default: 8192 decimal. MODVFD register for run/stop.",
  "keywords": [
   "modbus",
   "register",
   "rs485",
   "run",
   "stop",
   "vfd"
  ]
 },
 {
  "code": "$463",
  "name": "Frequency set register",
  "desc": "SLB-EXT default: 8193 decimal. MODVFD register to set frequency.",
  "keywords": [
   "frequency",
   "modbus",
   "register",
   "rs485",
   "set",
   "vfd"
  ]
 },
 {
  "code": "$464",
  "name": "Frequency get register",
  "desc": "SLB-EXT default: 8451 decimal. MODVFD register to get frequency.",
  "keywords": [
   "frequency",
   "get",
   "modbus",
   "register",
   "rs485",
   "vfd"
  ]
 },
 {
  "code": "$465",
  "name": "Run CW command",
  "desc": "SLB-EXT default: 18 decimal. MODVFD command word for CW.",
  "keywords": [
   "command",
   "modbus",
   "rs485",
   "run",
   "vfd"
  ]
 },
 {
  "code": "$466",
  "name": "Run CCW command",
  "desc": "SLB-EXT default: 34 decimal. MODVFD command word for CCW.",
  "keywords": [
   "ccw",
   "command",
   "modbus",
   "rs485",
   "run",
   "vfd"
  ]
 },
 {
  "code": "$467",
  "name": "Stop command",
  "desc": "SLB-EXT default: 1 decimal. MODVFD command word for stop.",
  "keywords": [
   "command",
   "modbus",
   "rs485",
   "stop",
   "vfd"
  ]
 },
 {
  "code": "$468",
  "name": "RPM input multiplier",
  "desc": "SLB-EXT default: 50. MODVFD RPM value multiplier for programming RPM.",
  "keywords": [
   "input",
   "modbus",
   "multiplier",
   "rpm",
   "rs485",
   "vfd"
  ]
 },
 {
  "code": "$469",
  "name": "RPM input divider",
  "desc": "SLB-EXT default: 60. MODVFD RPM value divider for programming RPM.",
  "keywords": [
   "divider",
   "input",
   "modbus",
   "rpm",
   "rs485",
   "vfd"
  ]
 },
 {
  "code": "$470",
  "name": "RPM output multiplier",
  "desc": "SLB-EXT default: 60. MODVFD RPM value multiplier for reading RPM.",
  "keywords": [
   "modbus",
   "multiplier",
   "output",
   "rpm",
   "rs485",
   "vfd"
  ]
 },
 {
  "code": "$471",
  "name": "RPM output divider",
  "desc": "SLB-EXT default: 100. MODVFD RPM value divider for reading RPM.",
  "keywords": [
   "divider",
   "modbus",
   "output",
   "rpm",
   "rs485",
   "vfd"
  ]
 },
 {
  "code": "$478",
  "name": "Spindle 2 Modbus address",
  "desc": "SLB-EXT default: 3. Spindle 2 Modbus address.",
  "keywords": [
   "address",
   "modbus",
   "rs485",
   "spindle",
   "vfd"
  ]
 },
 {
  "code": "$479",
  "name": "Spindle 3 Modbus address",
  "desc": "SLB-EXT default: 4. Spindle 3 Modbus address.",
  "keywords": [
   "address",
   "modbus",
   "rs485",
   "spindle",
   "vfd"
  ]
 },
 {
  "code": "$481",
  "name": "Autoreport interval",
  "desc": "SLB-EXT default: 0 ms. Interval the real time report will be sent, set to 0 to disable. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "autoreport",
   "interval"
  ]
 },
 {
  "code": "$482",
  "name": "Timezone offset",
  "desc": "Offset in hours from UTC.",
  "keywords": [
   "timezone",
   "offset"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$484",
  "name": "Unlock required after E-stop",
  "desc": "SLB-EXT default: Enabled (1). If set, unlock (by sending $X) is required after resetting a cleared E-Stop condition.",
  "keywords": [
   "after",
   "required",
   "stop",
   "unlock"
  ]
 },
 {
  "code": "$485",
  "name": "Keep tool number over reboot",
  "desc": "Keep tool number over reboot",
  "keywords": [
   "keep",
   "tool",
   "number",
   "over",
   "reboot"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$486",
  "name": "Lock coordinate systems",
  "desc": "SLB-EXT default: G59.1: OFF G59.2: OFF G59.3: OFF (0). Lock coordinate systems against accidental changes.",
  "keywords": [
   "coordinate",
   "lock",
   "systems"
  ]
 },
 {
  "code": "$487",
  "name": "PWM2 spindle on port",
  "desc": "On/off aux port.",
  "keywords": [
   "pwm",
   "spindle",
   "port"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$488",
  "name": "PWM2 spindle direction port",
  "desc": "Direction aux port, set to -1 if not required.",
  "keywords": [
   "pwm",
   "spindle",
   "direction",
   "port"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$489",
  "name": "PWM2 spindle PWM port",
  "desc": "Spindle analog aux port. Must be PWM capable!",
  "keywords": [
   "pwm",
   "spindle",
   "port"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$511",
  "name": "Spindle 1",
  "desc": "SLB-EXT default: SLB_LASER (7). Spindle to use as spindle 1. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "laser",
   "spindle"
  ]
 },
 {
  "code": "$512",
  "name": "Spindle 2",
  "desc": "SLB-EXT default: MODVFD (5). Spindle to use as spindle 2. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "laser",
   "spindle"
  ]
 },
 {
  "code": "$513",
  "name": "Spindle 3",
  "desc": "SLB-EXT default: Disabled (8). Spindle to use as spindle 3. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "laser",
   "spindle"
  ]
 },
 {
  "code": "$519",
  "name": "Encoder spindle",
  "desc": "Specifies which spindle has the encoder attached.",
  "keywords": [
   "encoder",
   "spindle"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$520",
  "name": "Spindle 0 tool number start",
  "desc": "SLB-EXT default: 0. Start of tool numbers for selecting spindle 0 (default spindle). Normally leave this at 0.",
  "keywords": [
   "laser",
   "number",
   "spindle",
   "start",
   "tool"
  ]
 },
 {
  "code": "$521",
  "name": "Spindle 1 tool number start",
  "desc": "SLB-EXT default: 0. Start of tool numbers for selecting spindle 1.",
  "keywords": [
   "laser",
   "number",
   "spindle",
   "start",
   "tool"
  ]
 },
 {
  "code": "$522",
  "name": "Spindle 2 tool number start",
  "desc": "SLB-EXT default: 0. Start of tool numbers for selecting spindle 2.",
  "keywords": [
   "laser",
   "number",
   "spindle",
   "start",
   "tool"
  ]
 },
 {
  "code": "$523",
  "name": "Spindle 3 tool number start",
  "desc": "SLB-EXT default: 0. Start of tool numbers for selecting spindle 3.",
  "keywords": [
   "laser",
   "number",
   "spindle",
   "start",
   "tool"
  ]
 },
 {
  "code": "$534",
  "name": "Output NGC debug messages",
  "desc": "Example: (debug, metric mode: #<_metric>, coord system: #5220)",
  "keywords": [
   "output",
   "ngc",
   "debug",
   "messages"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$536",
  "name": "LED strip 1 length",
  "desc": "Number of LEDS in strip 1.",
  "keywords": [
   "led",
   "strip",
   "length"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$537",
  "name": "LED strip 2 length",
  "desc": "Number of LEDS in strip 2.",
  "keywords": [
   "led",
   "strip",
   "length"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$538",
  "name": "Fast rotary go to G28",
  "desc": "Fast rotary go to G28",
  "keywords": [
   "fast",
   "rotary"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$539",
  "name": "Spindle off delay",
  "desc": "(s) Spindle off delay",
  "keywords": [
   "spindle",
   "off",
   "delay"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$650",
  "name": "Chopper toff",
  "desc": "SLB-EXT default: 1. Off time. Duration of slow decay phase as a multiple of system clock periods: NCLK= 24 + (32 x TOFF). This will limit the maximum chopper frequency (0-15). 0: MOSFETs shut off, driver disabled. 1: Use with TBL of minimum 24 clocks.",
  "keywords": [
   "chopper",
   "toff"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$651",
  "name": "Chopper tbl",
  "desc": "SLB-EXT default: 1. Blanking time interval in system clock periods (0-3 = 16,24,36,54). Needs to cover the switching event and the duration of the ringing on the sense resistor.",
  "keywords": [
   "chopper",
   "tbl"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$652",
  "name": "Chopper chm",
  "desc": "SLB-EXT default: 0. Chopper mode. Affects HDEC, HEND, and HSTRT parameters. 0: Standard mode (SpreadCycle). 1: Constant TOFF with fast decay time. Fast decay is after on time. Fast decay time is also terminated when the negative nominal current is reached.",
  "keywords": [
   "chm",
   "chopper"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$653",
  "name": "Chopper hstr",
  "desc": "SLB-EXT default: 2. CHM=0: Hysteresis start, offset from HEND (0-7 = 1-8). To be effective, HEND+HSTRT must be ≤15. CHM=1: Fast decay time. Three least-significant bits of the duration of the fast decay phase. The MSB is HDEC0. Fast decay time is a multiple of system clock periods: NCLK= 32 x (HDEC0+HSTRT).",
  "keywords": [
   "chopper",
   "hstr"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$654",
  "name": "Chopper hend",
  "desc": "SLB-EXT default: 8. Can be either negative, zero, or positive, 0-15 = -3 to 12. CHM=0: Hysteresis end (low). Sets the hysteresis end value after a number of decrements, used for the hysteresis chopper and controlled by HDEC. HSTRT+HEND must be less than 16. 1/512 adds to the current setting. CHM=1: Sine wave offset. A positive offset corrects for zero crossing error. 1/512 adds to the absolute value of each sine wave entry.",
  "keywords": [
   "chopper",
   "hend"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$655",
  "name": "Chopper hdec",
  "desc": "SLB-EXT default: 0. CHM=0: Hysteresis decrement interval period in system clock periods. Determines the slope of the hysteresis during on time from fast to very slow (0-3 = 16,32,48,64). CHM=1: Fast decay mode.",
  "keywords": [
   "chopper",
   "hdec"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$656",
  "name": "Chopper rndtf",
  "desc": "SLB-EXT default: 1. Change from fixed to randomized TOFF times, by dNCLK= -24 to +6 clocks. Only for CHM=1.",
  "keywords": [
   "chopper",
   "rndtf"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$657",
  "name": "THRESH",
  "desc": "SLB-EXT default: 22. StallGuard threshold.",
  "keywords": [
   "thresh"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$658",
  "name": "CoolStep semin",
  "desc": "SLB-EXT default: 7. Lower CoolStep threshold. If the SG value falls below SEMIN x 32, the coil current scaling factor is increased (0-15). 0: CoolStep disabled.",
  "keywords": [
   "coolstep",
   "semin"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$659",
  "name": "CoolStep seup",
  "desc": "SLB-EXT default: 3. Number of increments of the coil current each time SG is sampled below the lower threshold (0-3 = 1,2,4,8).",
  "keywords": [
   "coolstep",
   "seup"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$660",
  "name": "CoolStep semax",
  "desc": "SLB-EXT default: 0. Upper CoolStep threshold offset from lower threshold. If SG is sampled above (SEMIN+SEMAX+1)x32 enough times, the coil current scaling factor is decremented (0-15).",
  "keywords": [
   "coolstep",
   "semax"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$661",
  "name": "CoolStep sedn",
  "desc": "SLB-EXT default: 3. Number of times SG must be sampled above the upper threshold before the coil current is decremented (0-3 = 32,8,2,1).",
  "keywords": [
   "coolstep",
   "sedn"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$662",
  "name": "CoolStep seimin",
  "desc": "SLB-EXT default: 0. Minimum CoolStep current as a factor of the set motor current. 0: 1/2, 1: 1/4",
  "keywords": [
   "coolstep",
   "seimin"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$663",
  "name": "drvconf_reg",
  "desc": "SLB-EXT default: 41759. DRVCONF register defaults 0xA31F. All protections enabled.",
  "keywords": [
   "drvconf",
   "reg"
  ],
  "tips": "Sienci marks this as advanced - supported, but change with care."
 },
 {
  "code": "$664",
  "name": "Ring pixels",
  "desc": "SLB-EXT default: 0. Number of individual pixels or LEDs connected. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "led",
   "lights",
   "pixels",
   "ring"
  ]
 },
 {
  "code": "$665",
  "name": "Rail pixels",
  "desc": "SLB-EXT default: 1. Number of individual pixels or LEDs connected. Include the onboard LED. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "led",
   "lights",
   "pixels",
   "rail"
  ]
 },
 {
  "code": "$666",
  "name": "Using add-ons",
  "desc": "SLB-EXT default: (0). Sienci specific capability flags.",
  "keywords": [
   "add",
   "ons",
   "using"
  ],
  "tips": "Sienci marks this as currently unused on the SLB - it may still apply on the SLB-EXT; run $ES to check your build."
 },
 {
  "code": "$668",
  "name": "Invert TLS input",
  "desc": "SLB-EXT default: Enabled (1). Invert the TLS input ahead of the OR function. ~Controller reset required for setting change to take effect~",
  "keywords": [
   "input",
   "invert",
   "tls"
  ]
 },
 {
  "code": "$671",
  "name": "Invert home inputs",
  "desc": "Inverts the axis home input signals.",
  "keywords": [
   "invert",
   "home",
   "inputs"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$673",
  "name": "Coolant on delay",
  "desc": "(s) Delay to allow coolant to start. 0 or 0.5 - 20s.",
  "keywords": [
   "coolant",
   "delay"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$676",
  "name": "Reset actions",
  "desc": "Controls actions taken on a soft reset.",
  "keywords": [
   "reset",
   "actions"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$680",
  "name": "Stepper enable delay",
  "desc": "(ms) Delay from stepper enable to first step output. The driver typically adds ~2ms to this.",
  "keywords": [
   "stepper",
   "enable",
   "delay"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$681",
  "name": "ModBus serial format",
  "desc": "ModBus serial format",
  "keywords": [
   "modbus",
   "serial",
   "format"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$683",
  "name": "ATCi plugin options",
  "desc": "Plugin default: all off (0). Sienci ATCi firmware plugin. Enable (1) turns on the keepout zone around the tool rack set by $684-$687. Monitor Rack Presence (2) only enforces the zone while the rack sensor sees the rack installed. Monitor TC Macro (4) drops the zone automatically while the firmware's own tool change macro runs. Add the values together.",
  "keywords": [
   "atci",
   "keepout",
   "sienci",
   "rack",
   "atc",
   "enable"
  ],
  "tips": "M960 P0 / P1 turns enforcement off and on at run time without changing this setting. ncSender plugins such as QuickCut (surfacing) read the zone to work around it."
 },
 {
  "code": "$684",
  "name": "ATCi keepout X min",
  "desc": "Plugin default: 10 mm. Lower X edge of the keepout zone around the tool rack, in machine coordinates. With $685-$687 it forms the rectangle the spindle can't enter while the zone is enforced.",
  "keywords": [
   "atci",
   "keepout",
   "x min",
   "rack",
   "zone"
  ]
 },
 {
  "code": "$685",
  "name": "ATCi keepout Y min",
  "desc": "Plugin default: 10 mm. Lower Y edge of the keepout zone around the tool rack, in machine coordinates.",
  "keywords": [
   "atci",
   "keepout",
   "y min",
   "rack",
   "zone"
  ]
 },
 {
  "code": "$686",
  "name": "ATCi keepout X max",
  "desc": "Plugin default: 50 mm. Upper X edge of the keepout zone around the tool rack, in machine coordinates. If min and max are entered the wrong way round the plugin swaps them.",
  "keywords": [
   "atci",
   "keepout",
   "x max",
   "rack",
   "zone"
  ]
 },
 {
  "code": "$687",
  "name": "ATCi keepout Y max",
  "desc": "Plugin default: 50 mm. Upper Y edge of the keepout zone around the tool rack, in machine coordinates.",
  "keywords": [
   "atci",
   "keepout",
   "y max",
   "rack",
   "zone"
  ]
 },
 {
  "code": "$700",
  "name": "Subroutine options",
  "desc": "Enable prescan for internal M98 subroutines.",
  "keywords": [
   "subroutine",
   "options"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$709",
  "name": "PWM2 spindle options",
  "desc": "Options for the secondary PWM spindle output (PWM2, the SLB-EXT laser channel).",
  "keywords": [
   "laser",
   "options",
   "pwm",
   "pwm2",
   "spindle"
  ]
 },
 {
  "code": "$716",
  "name": "PWM2 spindle signals invert",
  "desc": "Inverts the PWM2 (laser) enable, counterclockwise and PWM signals (active low). Hard reset required after changing.",
  "keywords": [
   "invert",
   "laser",
   "pwm",
   "pwm2",
   "signals",
   "spindle"
  ],
  "tips": "On older SLB 5.0.x firmware this lived at $743 (Invert laser signals)."
 },
 {
  "code": "$730",
  "name": "Maximum laser power",
  "desc": "SLB-EXT default: 255. Maximum S word power for laser.",
  "keywords": [
   "laser",
   "maximum",
   "power",
   "pwm"
  ]
 },
 {
  "code": "$731",
  "name": "Minimum laser power",
  "desc": "SLB-EXT default: 0. Minimum S word power for laser.",
  "keywords": [
   "laser",
   "minimum",
   "power",
   "pwm"
  ]
 },
 {
  "code": "$733",
  "name": "Laser PWM frequency",
  "desc": "SLB-EXT default: 1000 Hz. Laser PWM frequency.",
  "keywords": [
   "frequency",
   "laser",
   "pwm"
  ]
 },
 {
  "code": "$734",
  "name": "Laser PWM off value",
  "desc": "SLB-EXT default: 0 percent. Laser PWM off value in percent (duty cycle).",
  "keywords": [
   "laser",
   "off",
   "pwm",
   "value"
  ]
 },
 {
  "code": "$735",
  "name": "Laser PWM min value",
  "desc": "SLB-EXT default: 0 percent. Laser PWM min value in percent (duty cycle).",
  "keywords": [
   "laser",
   "min",
   "pwm",
   "value"
  ]
 },
 {
  "code": "$736",
  "name": "Laser PWM max value",
  "desc": "SLB-EXT default: 100 percent. Laser PWM max value in percent (duty cycle).",
  "keywords": [
   "laser",
   "max",
   "pwm",
   "value"
  ]
 },
 {
  "code": "$737",
  "name": "PWM2 spindle linearisation, 1st point",
  "desc": "Comma separated list of values: RPM_MIN, RPM_LINE_A1, RPM_LINE_B1, set to blank to disable.",
  "keywords": [
   "pwm",
   "spindle",
   "linearisation",
   "point"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$738",
  "name": "PWM2 spindle linearisation, 2nd point",
  "desc": "Comma separated list of values: RPM_POINT12, RPM_LINE_A2, RPM_LINE_B2, set to blank to disable.",
  "keywords": [
   "pwm",
   "spindle",
   "linearisation",
   "point"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$739",
  "name": "PWM2 spindle linearisation, 3rd point",
  "desc": "Comma separated list of values: RPM_POINT23, RPM_LINE_A3, RPM_LINE_B3, set to blank to disable.",
  "keywords": [
   "pwm",
   "spindle",
   "linearisation",
   "point"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$740",
  "name": "PWM2 spindle linearisation, 4th point",
  "desc": "Comma separated list of values: RPM_POINT34, RPM_LINE_A4, RPM_LINE_B4, set to blank to disable.",
  "keywords": [
   "pwm",
   "spindle",
   "linearisation",
   "point"
  ],
  "tips": "Core grblHAL setting - only present if your firmware build includes the feature. The reference flags whether your controller has it."
 },
 {
  "code": "$742",
  "name": "Motor warning inputs enable",
  "desc": "Enables the external stepper driver warning inputs per motor (SLB-EXT external drivers report warnings before faulting).",
  "keywords": [
   "alarm",
   "driver",
   "enable",
   "fault",
   "inputs",
   "motor",
   "warning"
  ],
  "tips": "Current Main_grblHAL numbering. On older SLB 5.0.x firmware $742 was the Laser Y offset - that is now $771."
 },
 {
  "code": "$743",
  "name": "Invert motor warning inputs",
  "desc": "Inverts the motor warning input signals (active low).",
  "keywords": [
   "alarm",
   "driver",
   "fault",
   "inputs",
   "invert",
   "motor",
   "warning"
  ],
  "tips": "On older SLB 5.0.x firmware $743 was Invert laser signals - that is now $716."
 },
 {
  "code": "$744",
  "name": "Motor fault inputs enable",
  "desc": "Enables the external stepper driver fault/alarm inputs per motor. A fault triggers an alarm and halts the machine.",
  "keywords": [
   "alarm",
   "driver",
   "enable",
   "fault",
   "inputs",
   "motor"
  ]
 },
 {
  "code": "$745",
  "name": "Invert motor fault inputs",
  "desc": "Inverts the motor fault input signals (active low).",
  "keywords": [
   "alarm",
   "driver",
   "fault",
   "inputs",
   "invert",
   "motor"
  ]
 },
 {
  "code": "$750",
  "name": "Macro 0 content",
  "desc": "G-code for aux-input macro 0. Separate lines with the vertical bar character |. Runs when the assigned aux input (set by $760) triggers; controller must be Idle.",
  "keywords": [
   "action",
   "aux input",
   "content",
   "macro"
  ]
 },
 {
  "code": "$751",
  "name": "Macro 1 content",
  "desc": "G-code for aux-input macro 1. Separate lines with the vertical bar character |. Runs when the assigned aux input (set by $761) triggers; controller must be Idle.",
  "keywords": [
   "action",
   "aux input",
   "content",
   "macro"
  ]
 },
 {
  "code": "$752",
  "name": "Macro 2 content",
  "desc": "G-code for aux-input macro 2. Separate lines with the vertical bar character |. Runs when the assigned aux input (set by $762) triggers; controller must be Idle.",
  "keywords": [
   "action",
   "aux input",
   "content",
   "macro"
  ]
 },
 {
  "code": "$753",
  "name": "Macro 3 content",
  "desc": "G-code for aux-input macro 3. Separate lines with the vertical bar character |. Runs when the assigned aux input (set by $763) triggers; controller must be Idle.",
  "keywords": [
   "action",
   "aux input",
   "content",
   "macro"
  ]
 },
 {
  "code": "$754",
  "name": "Macro 4 content",
  "desc": "G-code for aux-input macro 4. Separate lines with the vertical bar character |. Runs when the assigned aux input (set by $764) triggers; controller must be Idle.",
  "keywords": [
   "action",
   "aux input",
   "content",
   "macro"
  ]
 },
 {
  "code": "$755",
  "name": "Macro 5 content",
  "desc": "G-code for aux-input macro 5. Separate lines with the vertical bar character |. Runs when the assigned aux input (set by $765) triggers; controller must be Idle.",
  "keywords": [
   "action",
   "aux input",
   "content",
   "macro"
  ]
 },
 {
  "code": "$756",
  "name": "Macro 6 content",
  "desc": "G-code for aux-input macro 6. Separate lines with the vertical bar character |. Runs when the assigned aux input (set by $766) triggers; controller must be Idle.",
  "keywords": [
   "action",
   "aux input",
   "content",
   "macro"
  ]
 },
 {
  "code": "$757",
  "name": "Macro 7 content",
  "desc": "G-code for aux-input macro 7. Separate lines with the vertical bar character |. Runs when the assigned aux input (set by $767) triggers; controller must be Idle.",
  "keywords": [
   "action",
   "aux input",
   "content",
   "macro"
  ]
 },
 {
  "code": "$758",
  "name": "Macro 8 content",
  "desc": "G-code for aux-input macro 8. Separate lines with the vertical bar character |. Runs when the assigned aux input (set by $768) triggers; controller must be Idle.",
  "keywords": [
   "action",
   "aux input",
   "content",
   "macro"
  ]
 },
 {
  "code": "$759",
  "name": "Macro 9 content",
  "desc": "G-code for aux-input macro 9. Separate lines with the vertical bar character |. Runs when the assigned aux input (set by $769) triggers; controller must be Idle.",
  "keywords": [
   "action",
   "aux input",
   "content",
   "macro"
  ]
 },
 {
  "code": "$760",
  "name": "Macro 0 trigger port",
  "desc": "Aux input port number that triggers macro 0 (content in $750). Set to -1 to disable. The pin must be interrupt-capable.",
  "keywords": [
   "action",
   "aux input",
   "macro",
   "port",
   "trigger"
  ]
 },
 {
  "code": "$761",
  "name": "Macro 1 trigger port",
  "desc": "Aux input port number that triggers macro 1 (content in $751). Set to -1 to disable. The pin must be interrupt-capable.",
  "keywords": [
   "action",
   "aux input",
   "macro",
   "port",
   "trigger"
  ]
 },
 {
  "code": "$762",
  "name": "Macro 2 trigger port",
  "desc": "Aux input port number that triggers macro 2 (content in $752). Set to -1 to disable. The pin must be interrupt-capable.",
  "keywords": [
   "action",
   "aux input",
   "macro",
   "port",
   "trigger"
  ]
 },
 {
  "code": "$763",
  "name": "Macro 3 trigger port",
  "desc": "Aux input port number that triggers macro 3 (content in $753). Set to -1 to disable. The pin must be interrupt-capable.",
  "keywords": [
   "action",
   "aux input",
   "macro",
   "port",
   "trigger"
  ]
 },
 {
  "code": "$764",
  "name": "Macro 4 trigger port",
  "desc": "Aux input port number that triggers macro 4 (content in $754). Set to -1 to disable. The pin must be interrupt-capable.",
  "keywords": [
   "action",
   "aux input",
   "macro",
   "port",
   "trigger"
  ]
 },
 {
  "code": "$765",
  "name": "Macro 5 trigger port",
  "desc": "Aux input port number that triggers macro 5 (content in $755). Set to -1 to disable. The pin must be interrupt-capable.",
  "keywords": [
   "action",
   "aux input",
   "macro",
   "port",
   "trigger"
  ]
 },
 {
  "code": "$766",
  "name": "Macro 6 trigger port",
  "desc": "Aux input port number that triggers macro 6 (content in $756). Set to -1 to disable. The pin must be interrupt-capable.",
  "keywords": [
   "action",
   "aux input",
   "macro",
   "port",
   "trigger"
  ]
 },
 {
  "code": "$767",
  "name": "Macro 7 trigger port",
  "desc": "Aux input port number that triggers macro 7 (content in $757). Set to -1 to disable. The pin must be interrupt-capable.",
  "keywords": [
   "action",
   "aux input",
   "macro",
   "port",
   "trigger"
  ]
 },
 {
  "code": "$768",
  "name": "Macro 8 trigger port",
  "desc": "Aux input port number that triggers macro 8 (content in $758). Set to -1 to disable. The pin must be interrupt-capable.",
  "keywords": [
   "action",
   "aux input",
   "macro",
   "port",
   "trigger"
  ]
 },
 {
  "code": "$769",
  "name": "Macro 9 trigger port",
  "desc": "Aux input port number that triggers macro 9 (content in $759). Set to -1 to disable. The pin must be interrupt-capable.",
  "keywords": [
   "action",
   "aux input",
   "macro",
   "port",
   "trigger"
  ]
 },
 {
  "code": "$770",
  "name": "Laser X offset",
  "desc": "Laser offset from the spindle on the X axis, applied when switching between spindle and laser so files stay aligned. Pairs with gSender Spindle/Laser offset settings.",
  "keywords": [
   "alignment",
   "laser",
   "offset",
   "pwm"
  ],
  "tips": "Moved here in Main_grblHAL firmware - older SLB 5.0.x used $741."
 },
 {
  "code": "$771",
  "name": "Laser Y offset",
  "desc": "Laser offset from the spindle on the Y axis.",
  "keywords": [
   "alignment",
   "laser",
   "offset",
   "pwm"
  ],
  "tips": "Moved here in Main_grblHAL firmware - older SLB 5.0.x used $742."
 },
 {
  "code": "$772",
  "name": "Laser offset options",
  "desc": "Options controlling how the laser/spindle XY offset ($770/$771) is applied.",
  "keywords": [
   "laser",
   "offset",
   "options",
   "pwm"
  ]
 }
];

/**
 * grblHAL system ($) commands — configuration, control and queries.
 */
export const SYSTEM_DB = [
  { code: '$$',  name: 'View settings', desc: 'Prints every numbered setting and its current value.', keywords: ['settings', 'list', 'view', 'dump'] },
  { code: '$#',  name: 'View G-code parameters', desc: 'Shows WCS offsets (G54-G59.3), G28/G30 positions, G92 offset, tool length offset and last probe result (PRB).', keywords: ['parameters', 'offsets', 'probe result', 'wcs', 'prb'] },
  { code: '$G',  name: 'View parser state', desc: 'Shows the active modal G-codes (motion mode, WCS, plane, units, distance mode...), plus current T, F and S.', keywords: ['parser', 'state', 'modal', 'active modes'] },
  { code: '$I',  name: 'Build info', desc: 'Prints the firmware build/version string and enabled options.', keywords: ['build', 'version', 'info', 'firmware'] },
  { code: '$N',  name: 'View startup blocks', desc: 'Shows the G-code lines run automatically at startup ($N0=, $N1= to set).', keywords: ['startup', 'blocks', 'boot'] },
  { code: '$X',  name: 'Kill alarm lock', desc: 'Unlocks the machine from an alarm state without homing. Position may be unknown afterward — use with caution.', keywords: ['unlock', 'alarm', 'kill', 'reset alarm'] },
  { code: '$C',  name: 'Check G-code mode', desc: 'Toggles check mode: the controller reads and checks every line it is sent but does not move, start the spindle or switch coolant — a dry run that turns up errors before you cut. Send $C again to leave check mode; Grbl and grblHAL reset themselves on the way out.', syntax: '$C', example: '$C\n(send or run the program)\n$C', tips: 'Probing and tool-change sequences can\'t really be tested this way — they depend on the machine actually moving.', keywords: ['check', 'check mode', 'dry run', 'verify', 'simulate', 'test program'] },
  { code: '$H',  name: 'Run homing cycle', desc: 'Homes all configured axes per $22/$44-$47. $HX / $HY / $HZ home a single axis (grblHAL). Note: with the Rapid Change ATC or Manual Tool Changer plugin installed and "perform TLS after home" enabled, the plugin expands $H so that after homing, if a tool is loaded but has no length offset yet, an automatic $TLS probe cycle runs.', keywords: ['home', 'homing', 'cycle', 'tls after home'] },
  { code: '$J=', name: 'Jog', desc: 'Executes a jog move, e.g. $J=G91 X10 F1000. Jogs don\'t alter the G-code parser state and can be cancelled instantly (0x85).', keywords: ['jog', 'jogging', 'move', 'manual'] },
  { code: '$SLP', name: 'Sleep', desc: 'Puts the controller to sleep (steppers and spindle off). Wake with a soft reset. Requires $62=1.', keywords: ['sleep', 'power down'] },
  { code: '$TLR', name: 'Set tool length reference', desc: 'Tool change protocol: records the current tool offset as the job\'s reference after probing the first tool.', keywords: ['tool length', 'reference', 'toolsetter', 'tool change'] },
  { code: '$TPW', name: 'Tool probe workpiece', desc: 'Tool change protocol: probes the new tool to compute its dynamic offset. Available in tool change modes 1 and 2.', keywords: ['tool probe', 'toolsetter', 'tool change'] },
  { code: '$EA', name: 'Enumerate alarms', desc: 'Lists every alarm code with its description — decode alarm numbers here.', keywords: ['alarms', 'codes', 'enumerate', 'list'] },
  { code: '$EE', name: 'Enumerate errors', desc: 'Lists every error code with its description — decode error:NN messages here.', keywords: ['errors', 'codes', 'enumerate', 'list'] },
  { code: '$ES', name: 'Enumerate settings', desc: 'Lists every setting the build supports with type, range, unit and description — the authoritative settings reference for YOUR controller.', keywords: ['settings', 'enumerate', 'describe', 'list'] },
  { code: '$EG', name: 'Enumerate setting groups', desc: 'Lists the hierarchy of setting groups.', keywords: ['groups', 'settings', 'enumerate'] },
  { code: '$pins', name: 'Enumerate pins', desc: 'Lists processor pin assignments — which MCU pin does what.', keywords: ['pins', 'mapping', 'enumerate'] },
  { code: '$pinstate', name: 'Pin states', desc: 'Shows the live state of auxiliary pins — great for debugging wiring.', keywords: ['pins', 'state', 'debug', 'aux'] },
  { code: '$SPINDLES', name: 'Enumerate spindles', desc: 'Lists configured spindles and their numbers (for M104 P selection on multi-spindle setups).', keywords: ['spindles', 'enumerate', 'list', 'dual spindle'] },
  { code: '$F', name: 'List files', desc: 'Lists G-code files in the current directory on SD/LittleFS. $F+ lists all files; $F=<file> runs one; $FD=<file> deletes; $FM/$FU mount/unmount; $CWD= changes directory; $PWD prints it.', keywords: ['files', 'sd card', 'list', 'run file', 'littlefs'] },
  { code: '$RST', name: 'Restore defaults', desc: '$RST=$ restores settings to defaults, $RST=# clears WCS/G28/G30 offsets, $RST=* resets everything. Irreversible — note your settings first.', keywords: ['reset', 'restore', 'defaults', 'factory'] },
  { code: '$REBOOT', name: 'Reboot controller', desc: 'Hard-resets the controller. The connection drops.', keywords: ['reboot', 'restart', 'reset'] },
  { code: '$TTLOAD', name: 'Reload tool table', desc: 'Reloads the tool table from storage.', keywords: ['tool table', 'reload'] },

  /* ---- FluidNC's own $ commands. Most have a short and a long name
     ($CD = $Config/Dump); both work, in any letter case. ---- */
  { code: '$CD', aliases: ['$Config/Dump'], name: 'Show running config (FluidNC)', desc: 'Prints the configuration FluidNC is actually running, as YAML — including the default values your config file leaves out. $CD=<file> writes it to a file on the controller instead.', syntax: '$CD | $CD=<file>', example: '$CD', keywords: ['config', 'yaml', 'dump', 'configuration', 'fluidnc', 'show config'] },
  { code: '$SS', aliases: ['$Startup/Show'], name: 'Show startup log (FluidNC)', desc: 'Prints the messages from the last boot, including any problems found in config.yaml — the first thing to check when FluidNC starts in alarm or a feature doesn\'t work.', syntax: '$SS', example: '$SS', keywords: ['startup', 'boot', 'log', 'config error', 'fluidnc'] },
  { code: '$CMD', aliases: ['$Commands/List'], name: 'List commands (FluidNC)', desc: 'Lists every $ command this FluidNC build accepts, with its short and long name.', syntax: '$CMD', example: '$CMD', keywords: ['commands', 'list', 'help', 'fluidnc'] },
  { code: '$S', aliases: ['$Settings/List'], name: 'List settings (FluidNC)', desc: 'Lists FluidNC\'s named settings and their values (WiFi, message level, config file name and so on). Machine setup itself lives in config.yaml — see $CD.', syntax: '$S', example: '$S', keywords: ['settings', 'list', 'named settings', 'fluidnc'] },
  { code: '$SC', aliases: ['$Settings/ListChanged'], name: 'List changed settings (FluidNC)', desc: 'Lists only the named settings that differ from their defaults. Passwords are not shown.', syntax: '$SC', example: '$SC', keywords: ['settings', 'changed', 'non default', 'fluidnc'] },
  { code: '$L', aliases: ['$GrblNames/List'], name: 'List Grbl setting numbers (FluidNC)', desc: 'Shows which FluidNC setting or config.yaml value each Grbl-style number ($10, $110, $130 …) stands for.', syntax: '$L', example: '$L', keywords: ['grbl names', 'numbers', 'mapping', 'fluidnc'] },
  { code: '$A', aliases: ['$Alarms/List'], name: 'List alarm codes (FluidNC)', desc: 'Lists every alarm number with its meaning. ncSender sends this for you when you type grblHAL\'s $EA.', syntax: '$A', example: '$A', keywords: ['alarms', 'alarm codes', 'list', 'fluidnc'] },
  { code: '$E', aliases: ['$Errors/List'], name: 'List error codes (FluidNC)', desc: 'Lists every error:NN code with its meaning.', syntax: '$E', example: '$E', keywords: ['errors', 'error codes', 'list', 'fluidnc'] },
  { code: '$MD', aliases: ['$Motor/Disable', '$ME', '$Motor/Enable'], name: 'Turn motors off / on (FluidNC)', desc: '$MD turns the stepper motors off so the axes can be moved by hand; $ME turns them back on. Add an axis to do just one ($MD=Z) — not possible when the motors share one enable pin.', syntax: '$MD | $MD=<axis> | $ME | $ME=<axis>', example: '$MD=X\n$ME', tips: 'Position is no longer trustworthy after moving an axis by hand — re-home before cutting.', keywords: ['motors', 'disable', 'enable', 'steppers off', 'free', 'fluidnc'] },
  { code: '$Bye', aliases: [], name: 'Restart controller (FluidNC)', desc: 'Restarts FluidNC — the same as cycling power. The connection drops; reconnect afterwards. Needed for changes to config.yaml or $Config/Filename to take effect.', syntax: '$Bye', example: '$Bye', keywords: ['restart', 'reboot', 'reset', 'bye', 'fluidnc'] },
  { code: '$LocalFS/List', aliases: ['$LocalFS/Show', '$LocalFS/Run', '$LocalFS/Delete', '$LocalFS/Rename'], name: 'Controller files (FluidNC)', desc: 'Works with the files in FluidNC\'s own flash memory, where config.yaml lives: $LocalFS/List lists them, $LocalFS/Show=<file> prints one, $LocalFS/Run=<file> runs a G-code file on the controller, $LocalFS/Delete=<file> removes one.', syntax: '$LocalFS/List | $LocalFS/Show=<file> | $LocalFS/Run=<file> | $LocalFS/Delete=<file>', example: '$LocalFS/List', tips: 'ncSender sends console lines in capitals, so files with lower-case names (config.yaml) can\'t be reached this way yet — use ncSender\'s Config tab or FluidNC\'s web page for those.', keywords: ['files', 'localfs', 'flash', 'littlefs', 'config.yaml', 'fluidnc'] },
  { code: '$SD/List', aliases: ['$SD/Run', '$SD/Show', '$SD/Delete', '$SD/Status'], name: 'SD card files (FluidNC)', desc: '$SD/List lists the files on the controller\'s SD card, $SD/Run=<file> runs one as a job on the controller, $SD/Show=<file> prints it, $SD/Delete=<file> removes it and $SD/Status shows whether a card is in.', syntax: '$SD/List | $SD/Run=<file> | $SD/Show=<file> | $SD/Status', example: '$SD/List', tips: 'A job run from the SD card is streamed by FluidNC itself, not by ncSender. File names are sent in capitals from ncSender\'s console.', keywords: ['sd card', 'files', 'run file', 'fluidnc'] },
  { code: '$Config/Filename', aliases: [], name: 'Active config file (FluidNC)', desc: 'Shows which YAML file FluidNC loads at boot (config.yaml unless changed). $Config/Filename=<file> picks another one; it takes effect after $Bye.', syntax: '$Config/Filename | $Config/Filename=<file>', example: '$Config/Filename', tips: 'ncSender reads this to open the right file in its Config tab.', keywords: ['config file', 'yaml', 'filename', 'fluidnc'] },
  { code: '$Message/Level', aliases: [], name: 'Message level (FluidNC)', desc: 'Sets how much FluidNC reports: None, Error, Warning, Info (the default), Debug or Verbose. At Debug, (DEBUG, …) comments are printed too.', syntax: '$Message/Level=<None|Error|Warning|Info|Debug|Verbose>', example: '$Message/Level=Debug', keywords: ['messages', 'log level', 'debug', 'verbose', 'fluidnc'] },
  { code: '$PL', aliases: ['$Parameters/List'], name: 'List parameters (FluidNC)', desc: 'Lists the # parameters FluidNC is holding — numbered and named — with their values. Handy when a macro\'s math isn\'t doing what you expect.', syntax: '$PL', example: '$PL', keywords: ['parameters', 'variables', 'named parameters', 'macro', 'fluidnc'] },
  { code: '$GD', aliases: ['$GPIO/Dump'], name: 'Show GPIO pins (FluidNC)', desc: 'Lists the ESP32\'s pins with what each is used for and its current state — FluidNC\'s counterpart of grblHAL\'s $pins and $pinstate.', syntax: '$GD', example: '$GD', keywords: ['gpio', 'pins', 'pin state', 'wiring', 'fluidnc'] },
  { code: '$Limits', aliases: ['$Limits/Show'], name: 'Watch limit switches (FluidNC)', desc: 'Prints the state of the limit switches, probe and tool setter twice a second, so you can press each switch by hand and see it register. Send ! (feed hold) to stop it.', syntax: '$Limits', example: '$Limits', tips: 'Keeps running until stopped — use ncSender\'s Pause (feed hold).', keywords: ['limits', 'switches', 'test', 'probe', 'wiring', 'fluidnc'] },
  { code: '$T', aliases: ['$State'], name: 'Show machine state (FluidNC)', desc: 'Prints the current machine state by number and name (Idle, Run, Hold, Alarm …).', syntax: '$T', example: '$T', keywords: ['state', 'status', 'fluidnc'] },
  { code: '$RM', aliases: ['$Macros/Run'], name: 'Run config macro (FluidNC)', desc: 'Runs one of the four macros defined under macros: in config.yaml (macro0–macro3).', syntax: '$RM=<0-3>', example: '$RM=0', keywords: ['macro', 'run macro', 'config macro', 'fluidnc'] },
  { code: '$RI', aliases: ['$Report/Interval'], name: 'Automatic status reports (FluidNC)', desc: 'Makes FluidNC send a status report on its own every <ms> milliseconds on this connection; 0 turns it off.', syntax: '$RI=<ms>', example: '$RI=0', tips: 'ncSender asks for status itself, so you normally leave this alone.', keywords: ['report', 'interval', 'status', 'auto report', 'fluidnc'] },
  { code: '$Heap', aliases: ['$Heap/Show'], name: 'Free memory (FluidNC)', desc: 'Shows how much memory the controller has free — mainly useful when chasing crashes or WiFi trouble.', syntax: '$Heap', example: '$Heap', keywords: ['memory', 'heap', 'free', 'fluidnc'] },
  { code: '$NVX', aliases: ['$Settings/Erase'], name: 'Erase stored settings (FluidNC)', desc: 'Erases everything FluidNC keeps in its settings memory — named settings such as WiFi and the config file name, and the saved work offsets — back to defaults. The config.yaml file itself is not touched.', syntax: '$NVX', example: '$NVX', tips: 'Irreversible: note your work offsets ($#) and settings ($SC) first.', keywords: ['erase', 'factory reset', 'nvs', 'settings', 'fluidnc'] }
];

/**
 * Generic letter-word meanings — the explainer falls back to these
 * when the line's command entry doesn't define the letter.
 */
export const LETTER_DB = {
  X: 'X-axis coordinate/value', Y: 'Y-axis coordinate/value', Z: 'Z-axis coordinate/value',
  A: 'A-axis (rotary) value', B: 'B-axis value', C: 'C-axis value',
  U: 'U-axis value', V: 'V-axis value',
  F: 'Feed rate (modal — persists until changed)',
  S: 'Spindle speed / laser power (used by M3/M4)',
  T: 'Tool select (pre-selects for M6)',
  I: 'Arc center offset from start, X direction',
  J: 'Arc center offset from start, Y direction',
  K: 'Arc center offset from start, Z direction',
  R: 'Radius, or retract plane in canned cycles',
  P: 'Parameter: dwell seconds, WCS/port/macro number (command-dependent)',
  Q: 'Parameter: peck depth, value, tool number (command-dependent)',
  L: 'Parameter: repeat count or data mode (command-dependent)',
  H: 'Tool table index for length offset (G43)',
  D: 'Parameter: max RPM cap (G96) or tool radius index',
  N: 'Line number (ignored by execution)',
  E: 'Analog port (plugin M-codes)',
  O: 'Program label / subroutine number',
  W: 'W-axis value, or white channel (M150)'
};

/* ==================================================================
 * Controller support
 * ------------------------------------------------------------------
 * ncSender drives three controller families. The entries above are
 * written for grblHAL; this table records how each code fares on the
 * other two (and on grblHAL where it isn't a plain yes). The build
 * merges it into the entries as `support`, and the UI marks codes the
 * connected controller can't run.
 *
 * Status per controller:
 *   yes  - runs as documented
 *   part - runs with a limitation (see note)
 *   ncs  - the controller can't, but ncSender handles it for you
 *   plug - handled by an ncSender plugin, whatever the controller
 *   no   - doesn't run (ncSender stops the line, or the controller
 *          answers with an error)
 * A missing controller key means "yes" for grblHAL and "unknown" for
 * the others.
 *
 * Sources: ncSender's Grbl and FluidNC translators (classic Grbl 1.1
 * support from v2.0.20x, FluidNC from late Oct 2026), the Grbl 1.1
 * wiki, and the FluidNC source. Notes are our own wording.
 * ================================================================== */
const Y = ['yes'];
const yes = (note) => ['yes', note];
const part = (note) => ['part', note];
const ncs = (note) => ['ncs', note];
const no = (note) => ['no', note];
const PLUG = ['plug', 'Handled by the ncSender plugin before anything reaches the controller.'];

const BOTH = (s) => ({ grbl: s, fluidnc: s });
const GRBL_NO_CYCLES = no('No canned cycles - CAM has to output the moves in full.');
const FNC_NO_CYCLES = no('No canned cycles - CAM has to output the moves in full.');
const HAL_PLUGIN = no('A grblHAL firmware-plugin code; not available here.');
const FLUIDNC_ONLY = { grblhal: no('FluidNC only.'), grbl: no('FluidNC only.'), fluidnc: Y };

export const CONTROLLER_SUPPORT = {
  // ---- motion, planes, units, coordinates ----
  'G0': BOTH(Y), 'G1': BOTH(Y), 'G2': BOTH(Y), 'G3': BOTH(Y), 'G4': BOTH(Y),
  'G5': BOTH(no('No spline moves - CAM has to output lines and arcs.')),
  'G7': BOTH(no('Lathe modes are grblHAL only.')),
  'G8': BOTH(no('Lathe modes are grblHAL only.')),
  'G10 L2': BOTH(Y), 'G10 L20': BOTH(Y),
  'G17': BOTH(Y), 'G18': BOTH(Y), 'G19': BOTH(Y), 'G20': BOTH(Y), 'G21': BOTH(Y),
  'G28': BOTH(Y), 'G28.1': BOTH(Y), 'G30': BOTH(Y), 'G30.1': BOTH(Y), 'G53': BOTH(Y),
  'G54': { grbl: part('G54-G59 only - ncSender stops G59.1, G59.2 and G59.3 before they are sent.'), fluidnc: Y },
  'G92': BOTH(Y),
  'G92.1': BOTH(part('G92.1 only - G92.2 / G92.3 (suspend and restore) are not supported.')),
  'G38.2': BOTH(Y), 'G38.3': BOTH(Y), 'G38.4': BOTH(Y), 'G38.5': BOTH(Y),
  // ---- tool ----
  'G40': BOTH(Y), 'G43.1': BOTH(Y), 'G49': BOTH(Y),
  'G43': { grbl: no('No tool table - ncSender stops G43 H and asks for G43.1 Z<offset> instead.'),
           fluidnc: no('No tool table (H word) - use G43.1 Z<offset>.') },
  // ---- modes ----
  'G50': BOTH(no('No coordinate scaling.')), 'G51': BOTH(no('No coordinate scaling.')),
  'G90': BOTH(Y), 'G91': BOTH(Y), 'G93': BOTH(Y), 'G94': BOTH(Y),
  'G95': BOTH(no('No feed per revolution.')),
  'G96': BOTH(no('No constant surface speed (lathe).')),
  'G97': BOTH(no('Not accepted - spindle speed is always plain RPM.')),
  'G61': BOTH(part('G61 only - G61.1 is not accepted.')),
  // ---- canned cycles ----
  'G81': { grbl: GRBL_NO_CYCLES, fluidnc: FNC_NO_CYCLES }, 'G82': { grbl: GRBL_NO_CYCLES, fluidnc: FNC_NO_CYCLES },
  'G83': { grbl: GRBL_NO_CYCLES, fluidnc: FNC_NO_CYCLES }, 'G73': { grbl: GRBL_NO_CYCLES, fluidnc: FNC_NO_CYCLES },
  'G85': { grbl: GRBL_NO_CYCLES, fluidnc: FNC_NO_CYCLES }, 'G86': { grbl: GRBL_NO_CYCLES, fluidnc: FNC_NO_CYCLES },
  'G89': { grbl: GRBL_NO_CYCLES, fluidnc: FNC_NO_CYCLES }, 'G76': { grbl: GRBL_NO_CYCLES, fluidnc: FNC_NO_CYCLES },
  'G98': { grbl: GRBL_NO_CYCLES, fluidnc: FNC_NO_CYCLES }, 'G99': { grbl: GRBL_NO_CYCLES, fluidnc: FNC_NO_CYCLES },
  'G80': BOTH(Y),
  // ---- program flow, macros ----
  'G65': { grbl: no('No macros - ncSender quietly drops G65 P5 / P6 (probe select, spindle delay) and stops any other G65.'),
           fluidnc: no('No G65 - ncSender quietly drops G65 P6 (spindle delay); other macro calls fail.') },
  'G66': BOTH(no('No modal macro calls.')),
  'M0': BOTH(Y),
  'M1': { grbl: Y, fluidnc: part('Accepted but never stops - FluidNC has no optional-stop switch.') },
  'M2': BOTH(Y), 'M30': BOTH(Y),
  'M48': { grbl: no('No override control - ncSender stops the line.'), fluidnc: no('No override control.') },
  'M49': { grbl: no('No override control - ncSender stops the line.'), fluidnc: no('No override control.') },
  'M50': { grbl: no('No override control - ncSender stops the line.'),
           fluidnc: no('No override control - ncSender quietly drops M51; the others fail.') },
  'M56': { grbl: part('Only if parking override control was compiled in (off in stock Grbl 1.1).'),
           fluidnc: part('Only when parking override control is enabled in config.yaml.') },
  'M70': { grbl: no('No modal state save/restore.'), fluidnc: Y },
  'M98': { grbl: ncs('Only ncSender\'s own macros (P9001-P9999) - Grbl has no subroutines.'),
           fluidnc: ncs('Only ncSender\'s own macros (P9001-P9999) - FluidNC has no M98.') },
  'M99': BOTH(no('No subroutines.')),
  // ---- spindle, coolant, tool ----
  'M3': BOTH(Y), 'M5': BOTH(Y),
  'M4': { grbl: Y, fluidnc: part('Needs a reversible spindle or a laser in config.yaml.') },
  'M6': { grbl: ncs('Grbl has no tool change: ncSender keeps the T number and pauses with a "Load tool T<n>, then press Continue" dialog. Tool-changer plugins still expand M6 first.'),
          fluidnc: yes('What happens depends on FluidNC\'s tool-change setup in config.yaml - or on your ncSender tool-changer plugin, which expands M6 first.') },
  'M61': { grbl: ncs('Grbl has no M61: ncSender sends it as a T word once queued moves finish, and remembers the tool through resets.'),
           fluidnc: yes('ncSender also puts the tool back after a reset, which FluidNC would otherwise forget.') },
  'M7': { grbl: part('Only if compiled in - stock Grbl 1.1 has M7 turned off.'), fluidnc: Y },
  'M8': BOTH(Y), 'M9': BOTH(Y),
  'M7.1': { grblhal: no('Not in grblHAL - use M9, then turn the other output back on.'),
            grbl: no('Not in Grbl 1.1 - use M9, then turn the other output back on.'), fluidnc: Y },
  // ---- I/O ----
  'M62': { grbl: no('No controller I/O - ncSender stops the line.'), fluidnc: yes('Outputs must be defined in config.yaml.') },
  'M64': { grbl: no('No controller I/O - ncSender stops the line.'), fluidnc: yes('Outputs must be defined in config.yaml.') },
  'M66': { grbl: no('No controller I/O - ncSender stops the line.'), fluidnc: part('Only with digital inputs (digitalN_pin) set up in config.yaml.') },
  'M67': { grbl: no('No controller I/O - ncSender stops the line.'), fluidnc: yes('Analog outputs must be defined in config.yaml.') },
  // ---- grblHAL firmware plugin codes ----
  'M42': BOTH(HAL_PLUGIN), 'M104': BOTH(HAL_PLUGIN), 'M106': BOTH(HAL_PLUGIN), 'M114': BOTH(HAL_PLUGIN),
  'M122': BOTH(HAL_PLUGIN), 'M150': BOTH(HAL_PLUGIN), 'M220': BOTH(HAL_PLUGIN), 'M280': BOTH(HAL_PLUGIN),
  'M400': BOTH(HAL_PLUGIN),
  'M960': { grblhal: part('Sienci SLB / SLB-EXT firmware with the ATCi plugin only.'), grbl: HAL_PLUGIN, fluidnc: HAL_PLUGIN },
  // ---- ncSender plugin commands ----
  '$TLS': { grblhal: PLUG, grbl: PLUG, fluidnc: PLUG },
  '$SLOT1': { grblhal: PLUG, grbl: PLUG, fluidnc: PLUG },
  '$POCKET1': { grblhal: PLUG, grbl: PLUG, fluidnc: PLUG },
  '$ADB_RETRACT': { grblhal: PLUG, grbl: PLUG, fluidnc: PLUG },
  '$ADB_EXPAND': { grblhal: PLUG, grbl: PLUG, fluidnc: PLUG },
  '$ADB_GOTO': { grblhal: PLUG, grbl: PLUG, fluidnc: PLUG },
  '$PROBE': { grblhal: PLUG, grbl: PLUG, fluidnc: PLUG },
  '$MEASURE_TLO': { grblhal: PLUG, grbl: PLUG, fluidnc: PLUG },
  'M98 P9001': { grblhal: PLUG, grbl: PLUG, fluidnc: PLUG },
  '#<_dust_boot_attached>': { grblhal: PLUG, grbl: PLUG, fluidnc: PLUG },
  // ---- comments and ncSender messages ----
  'NCSENDER_PAUSE': BOTH(Y),
  '(MSG)': { grbl: ncs('Grbl ignores comments; ncSender reports the message for you.'), fluidnc: Y },
  '(PRINT)': { grbl: no('Ignored - Grbl 1.1 has no parameters.'), fluidnc: Y },

  // ---- $ commands ----
  '$$': { grbl: Y, fluidnc: part('Lists only the Grbl-style numbers FluidNC mirrors from config.yaml; $S lists its own settings.') },
  '$#': BOTH(Y), '$G': BOTH(Y), '$I': BOTH(Y), '$X': BOTH(Y), '$C': BOTH(Y), '$J=': BOTH(Y), '$SLP': BOTH(Y),
  '$N': { grbl: Y, fluidnc: no('No startup blocks - use startup_line0 / startup_line1 under macros: in config.yaml.') },
  '$H': { grbl: part('$H only - single-axis $HX / $HY / $HZ only if compiled in.'),
          fluidnc: yes('$HX, $HY, $HZ (and $HA …) home one axis.') },
  '$TLR': BOTH(no('Part of grblHAL\'s tool-change protocol only.')),
  '$TPW': BOTH(no('Part of grblHAL\'s tool-change protocol only.')),
  '$EA': { grbl: no('Not in Grbl 1.1.'), fluidnc: ncs('ncSender sends FluidNC\'s $A (alarm list) for you.') },
  '$EE': { grbl: no('Not in Grbl 1.1.'), fluidnc: no('ncSender doesn\'t pass it on - use FluidNC\'s $E.') },
  '$ES': { grbl: no('Not in Grbl 1.1 - $$ lists the values.'), fluidnc: no('ncSender doesn\'t pass it on - use $S (settings) or $CD (config).') },
  '$EG': BOTH(no('grblHAL only.')),
  '$pins': { grbl: no('grblHAL only.'), fluidnc: no('Use FluidNC\'s $GD.') },
  '$pinstate': { grbl: no('grblHAL only.'), fluidnc: no('ncSender doesn\'t pass it on - use FluidNC\'s $GD.') },
  '$SPINDLES': BOTH(no('grblHAL only.')),
  '$F': { grbl: no('No file system.'), fluidnc: no('Use $LocalFS/List or $SD/List.') },
  '$RST': { grbl: Y, fluidnc: yes('$RST=@ also clears the WiFi settings.') },
  '$REBOOT': { grbl: no('grblHAL only - power-cycle or use the reset button.'), fluidnc: no('Use FluidNC\'s $Bye.') },
  '$TTLOAD': BOTH(no('No tool table.')),
  '$CD': FLUIDNC_ONLY, '$SS': FLUIDNC_ONLY, '$CMD': FLUIDNC_ONLY, '$S': FLUIDNC_ONLY, '$SC': FLUIDNC_ONLY,
  '$L': FLUIDNC_ONLY, '$A': FLUIDNC_ONLY, '$E': FLUIDNC_ONLY, '$MD': FLUIDNC_ONLY, '$Bye': FLUIDNC_ONLY,
  '$LocalFS/List': FLUIDNC_ONLY, '$SD/List': FLUIDNC_ONLY, '$Config/Filename': FLUIDNC_ONLY,
  '$Message/Level': FLUIDNC_ONLY, '$PL': FLUIDNC_ONLY, '$GD': FLUIDNC_ONLY, '$Limits': FLUIDNC_ONLY,
  '$T': FLUIDNC_ONLY, '$RM': FLUIDNC_ONLY, '$RI': FLUIDNC_ONLY, '$Heap': FLUIDNC_ONLY, '$NVX': FLUIDNC_ONLY
};

/* ------------------------------------------------------------------
 * How numbered settings differ on classic Grbl 1.1 and FluidNC.
 * FluidNC's numbered settings are read-only copies of config.yaml
 * (only $10 and $13 can be changed with $n=); the notes name the
 * config.yaml key to edit instead.
 * ------------------------------------------------------------------ */
const FNC_RO = (key) => 'Read-only on FluidNC - it mirrors config.yaml. Change ' + key + ' there instead (writing $n= returns a read-only error).';
const FNC_YAML = (key) => 'Not a numbered setting on FluidNC - set ' + key + ' in config.yaml.';
const GRBL_SAME = 'Same meaning on Grbl 1.1.';

export const SETTING_NOTES = {
  '$0': { grbl: 'Same meaning on Grbl 1.1 (default 10 µs).', fluidnc: FNC_YAML('stepping: pulse_us') },
  '$1': { grbl: 'Same meaning on Grbl 1.1 (default 25 ms; 255 keeps the motors on).', fluidnc: FNC_YAML('stepping: idle_ms') },
  '$2': { grbl: 'Same per-axis mask on Grbl 1.1.', fluidnc: FNC_YAML('the :low attribute on an axis\'s step_pin') },
  '$3': { grbl: 'Same per-axis mask on Grbl 1.1.', fluidnc: FNC_YAML('the :low attribute on an axis\'s direction_pin') },
  '$4': { grbl: 'On Grbl 1.1 this is one on/off switch (0 or 1) for all axes, not a per-axis mask.', fluidnc: FNC_YAML('the :low / :high attribute on each motor\'s disable_pin') },
  '$5': { grbl: 'On Grbl 1.1 this is one on/off switch (0 or 1) for all limit pins, not a per-axis mask.', fluidnc: FNC_YAML('the :low attribute on each limit pin') },
  '$6': { grbl: 'Same on/off switch on Grbl 1.1.', fluidnc: FNC_YAML('the :low attribute on the probe pin') },
  '$10': { grbl: 'Grbl 1.1 has only two options: 1 = report machine position (MPos; without it, work position WPos), 2 = include buffer state. Add them together; default 1.',
           fluidnc: 'Same two options as Grbl 1.1 (1 = MPos, 2 = buffer state). A real FluidNC setting ($Report/Status), so $10= works.' },
  '$11': { grbl: GRBL_SAME, fluidnc: FNC_YAML('junction_deviation_mm') },
  '$12': { grbl: GRBL_SAME, fluidnc: FNC_YAML('arc_tolerance_mm') },
  '$13': { grbl: 'Same on/off switch on Grbl 1.1. ncSender converts inch reports back to mm for you.', fluidnc: '$13=1 / $13=0 switches inch reporting, as on Grbl.' },
  '$20': { grbl: 'On/off (0 or 1) on Grbl 1.1, and needs homing turned on ($22=1) - Grbl refuses soft limits without it.', fluidnc: FNC_RO('soft_limits: true on each axis') },
  '$21': { grbl: 'On/off (0 or 1) on Grbl 1.1 - there is no strict mode.', fluidnc: FNC_RO('the limit pins and hard_limits: true on the motors') },
  '$22': { grbl: 'On/off (0 or 1) on Grbl 1.1. The extra grblHAL options (single-axis $HX, homing at startup, machine origin at 0) are compile-time choices there, not bits here.',
           fluidnc: FNC_RO('each axis\'s homing: cycle') },
  '$23': { grbl: 'Same per-axis mask on Grbl 1.1.', fluidnc: FNC_RO('each axis\'s homing: positive_direction') },
  '$24': { grbl: GRBL_SAME, fluidnc: FNC_YAML('each axis\'s homing: feed_mm_per_min') },
  '$25': { grbl: GRBL_SAME, fluidnc: FNC_YAML('each axis\'s homing: seek_mm_per_min') },
  '$26': { grbl: GRBL_SAME, fluidnc: FNC_YAML('each axis\'s homing: settle_ms') },
  '$27': { grbl: GRBL_SAME, fluidnc: FNC_YAML('pulloff_mm on each axis\'s motor') },
  '$30': { grbl: 'Same meaning on Grbl 1.1 (default 1000 RPM).', fluidnc: FNC_RO('the top of the spindle\'s speed_map') },
  '$31': { grbl: GRBL_SAME, fluidnc: FNC_YAML('the bottom of the spindle\'s speed_map') },
  '$32': { grbl: 'On Grbl 1.1 this is just laser mode on/off (0 or 1) - there is no lathe mode.', fluidnc: FNC_RO('the spindle type (a Laser spindle turns it on)') }
};
['X', 'Y', 'Z', 'A'].forEach(function (axis, i) {
  const grblAxis = i < 3 ? GRBL_SAME : 'Not in Grbl 1.1 - it only has X, Y and Z.';
  SETTING_NOTES['$' + (100 + i)] = { grbl: grblAxis, fluidnc: FNC_RO('axes: ' + axis.toLowerCase() + ': steps_per_mm') };
  SETTING_NOTES['$' + (110 + i)] = { grbl: grblAxis, fluidnc: FNC_RO('axes: ' + axis.toLowerCase() + ': max_rate_mm_per_min') };
  SETTING_NOTES['$' + (120 + i)] = { grbl: grblAxis, fluidnc: FNC_RO('axes: ' + axis.toLowerCase() + ': acceleration_mm_per_sec2') };
  SETTING_NOTES['$' + (130 + i)] = { grbl: grblAxis, fluidnc: FNC_RO('axes: ' + axis.toLowerCase() + ': max_travel_mm') };
});
