// Runs every test and prints one line per suite. Exit code 1 if any failed.
//   node test/run-all.mjs            all suites
//   node test/run-all.mjs e2e-units  only suites whose name contains "e2e-units"
// Build first (node build/build.mjs): the tests read the generated commands.js
// and config.html. The e2e-* suites need Playwright with Chromium.
import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join } from 'path';

const dir = fileURLToPath(new URL('.', import.meta.url));
const only = process.argv[2] || '';
const suites = readdirSync(dir)
  .filter((f) => /^(async|commands|v1)\.mjs$|^e2e-.*\.cjs$/.test(f))
  .filter((f) => f.includes(only))
  .sort((a, b) => (a.startsWith('e2e-') - b.startsWith('e2e-')) || a.localeCompare(b));

let failed = 0;
for (const f of suites) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [join(dir, f)], { encoding: 'utf8', timeout: 300000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const ok = r.status === 0 && /ALL PASSED/.test(out);
  if (!ok) failed++;
  const secs = ((Date.now() - t0) / 1000).toFixed(0).padStart(3);
  console.log((ok ? 'PASS ' : 'FAIL ') + f.padEnd(22) + secs + 's');
  if (!ok) {
    const lines = out.split('\n').filter((l) => /FAIL|Error|error/.test(l)).slice(0, 12);
    console.log((lines.length ? lines : out.split('\n').slice(-12)).map((l) => '      ' + l).join('\n'));
    if (/Cannot find module 'playwright'|Executable doesn't exist/.test(out))
      console.log('      -> Playwright is missing: npm i --no-save playwright && npx playwright install chromium');
  }
}
console.log(failed ? `\n${failed} of ${suites.length} suites FAILED` : `\nALL ${suites.length} SUITES PASSED`);
process.exitCode = failed ? 1 : 0;
