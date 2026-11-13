// commands.js console lookups (?code, ??line): the dialog they open carries the merged
// controller tables (support + ctrl). Run: node test/commands.mjs
import { readFileSync } from 'fs'; import vm from 'vm'; import { fileURLToPath } from 'url';
const ROOT = process.argv[2] || fileURLToPath(new URL('..', import.meta.url));
const src = readFileSync(ROOT + '/commands.js', 'utf8').replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');
const out = []; const sb = { pluginContext: { log(){}, showDialogAsync(t, h) { out.push(h); return 'd'; }, closeDialog(){} } };
vm.createContext(sb); new vm.Script(src).runInContext(sb);
let fails = 0;
for (const q of ['?$CD', '?M960', '??(MSG, NCSENDER_PAUSE: a | b)', '?$MEASURE_TLO']) {
  const c = [{ command: q, isOriginal: true, meta: {} }];
  sb.onBeforeCommand(c, { sourceId: 'client' }, { terminalLookup: true });
  const ok = out.at(-1).includes('"support":') && out.at(-1).includes('"ctrl":');
  if (!ok) fails++;
  console.log((ok ? 'PASS ' : 'FAIL ') + q.padEnd(34) + ' -> ' + c[0].command + (ok ? '' : '  (dialog payload is missing support/ctrl data)'));
}
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
process.exitCode = fails ? 1 : 0;
