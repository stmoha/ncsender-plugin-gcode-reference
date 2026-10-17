## What's Changed

### ⚡ Lookups no longer hold up the machine
- On **ncSender 2.0.191 and later**, `?keyword` and `??line` open G-code Explorer without pausing anything else: console commands, jogs, and the Explorer tab's Rapid to Point / Retract keep working while the dialog is open
- Lookups are now safe while a job is running
- A new lookup replaces the one already open instead of waiting for it to close
- On older ncSender versions nothing changes: the dialog still pauses other commands until it's closed, as before

### 🔧 Fixes
- On the original ncSender (v1 / pro-v1), the Tools menu entry and dialog title now read **G-code Explorer** instead of the old name
