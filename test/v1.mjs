// index.js, the wrapper for the original ncSender (v1 / pro-v1): Tools menu label, console
// lookup, menu opening the dialog. Run: node test/v1.mjs
import { fileURLToPath, pathToFileURL } from 'url';
const ROOT = process.argv[2] || fileURLToPath(new URL('..', import.meta.url));
const mod = await import(pathToFileURL(ROOT + '/index.js').href);
const seen = { menu: null, dialogs: [], handler: null };
const ctx = { log(){}, getSettings: () => ({}), getAppSettings: () => ({}),
  showDialog: (t, h, o) => { seen.dialogs.push(t); return Promise.resolve(null); },
  registerEventHandler: (n, fn) => { seen.handler = fn; },
  registerToolMenu: (label, fn) => { seen.menu = { label, fn }; } };
await mod.onLoad(ctx);
let fails = 0;
const check = (name, ok, got) => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  got: ' + got)); };
check('Tools menu reads "G-code Explorer"', seen.menu && seen.menu.label === 'G-code Explorer', seen.menu && seen.menu.label);
const cmds = [{ command: '?dwell', isOriginal: true, meta: { sourceId: 'client' } }];
await seen.handler(cmds, { sourceId: 'client' });
check('?dwell opens the dialog and is swallowed', seen.dialogs[0] === 'G-code Explorer' && cmds[0].command === '(GCODE-REF)', seen.dialogs[0] + ' / ' + cmds[0].command);
await seen.menu.fn();
check('Tools menu opens the dialog', seen.dialogs[1] === 'G-code Explorer', seen.dialogs[1]);
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
process.exitCode = fails ? 1 : 0;
