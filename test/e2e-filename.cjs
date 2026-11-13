// G-code tab shows the file name even when the file arrives after its name (big files)
// Run: node test/e2e-filename.cjs   (needs Playwright with Chromium; screenshots go to test/out/)
const { chromium } = require('playwright');
const fs = require('fs'); const http = require('http'); const path = require('path');
const REPO = require('path').resolve(__dirname, '..');
// the file download is held back this long, like a big file (DELAY=0 for a small one)
const DELAY = +(process.env.DELAY || 800);
const OUT = require('path').join(__dirname, 'out');
require('fs').mkdirSync(OUT, { recursive: true });
const cfg = fs.readFileSync(path.join(REPO, 'config.html'), 'utf8').split('__TOOL_MENU_LABEL__').join('G-code Explorer');
// a short engraving job, mm, with a move that leans on earlier lines
const FILE = ['(Engrave fixture labels - 60 deg V-bit)', 'G21 G90 G17 G94', 'G54', 'M3 S18000', 'G0 Z5.000',
  ...Array.from({ length: 36 }, (_, i) => ['G0 X' + (420 + i).toFixed(3) + ' Y940.435', 'G1 Z-0.381 F508', 'G1 X' + (421 + i).toFixed(3) + ' Y943.822 F1016', 'G0 Z1.000'][i % 4]),
  'G0 Z1.000', 'G1 Z-0.381 F508', 'G1 X427.651 Y943.822 F1016', 'X429.345 Y945.515', 'X431.038 Y943.822', 'G53 G0 Z-5.000',
  ...Array.from({ length: 30 }, (_, i) => 'G1 X' + (432 + i).toFixed(3) + ' Y' + (940 + (i % 5)).toFixed(3)), 'M5', 'G53 G0 Z-5.000', 'M30'].join('\n');
const halSettings = {}; [0, 1, 4, 5, 10, 22, 32, 100, 101, 102, 110, 111, 112, 120, 130, 131, 132].forEach(n => halSettings[n] = { id: n, name: 'S' + n, value: n === 110 ? 5000 : 1 });
const settings = { unitsPreference: 'metric', safeZHeight: -5, keyboardBindings: { 'Plugin:com.cncdocs.gcode-reference:open-explorer': 'Ctrl+Shift+E' } };
const THEME = `<style>
:root{--color-bg:#111720;--color-surface:#1a222e;--color-surface-muted:#202a38;--color-text-primary:#e6ecf2;--color-text-secondary:#93a2b4;
--color-border:rgba(255,255,255,0.04);--color-accent:#1abc9c;--radius-medium:16px;--radius-small:10px;--gap-xs:8px;--gap-sm:16px;--gap-md:24px;
--font-family:'Inter',system-ui,sans-serif}
html,body{margin:0;height:100%;background:#0b0f15;font-family:var(--font-family);color:var(--color-text-primary)}
.plugin-dialog-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}
.plugin-dialog-container{background:var(--color-surface);border-radius:16px;box-shadow:0 25px 50px -12px rgba(0,0,0,.25),0 0 0 1px rgba(255,255,255,.1);
  width:auto;min-width:320px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden}
.plugin-dialog{display:flex;flex-direction:column;height:100%;overflow:hidden}
.plugin-dialog-header{display:flex;justify-content:space-between;align-items:center;padding:var(--gap-md);border-bottom:1px solid var(--color-border);flex-shrink:0}
.plugin-dialog-header h3{margin:0;font-size:1.25rem;font-weight:700;color:var(--color-text-primary)}
.close-button{background:transparent;border:none;padding:4px;color:var(--color-text-secondary);cursor:pointer}
.plugin-dialog-content{flex:1;overflow-y:auto;display:flex;flex-direction:column;color:var(--color-text-primary)}
.plugin-dialog-content[data-v-x] button{background:var(--color-accent);color:white;border:none;padding:var(--gap-sm) var(--gap-md);border-radius:var(--radius-small);cursor:pointer;font-weight:500}
</style>`;
const HOST = `<!doctype html><html><head><meta charset="utf-8">${THEME}</head><body>
<div class="plugin-dialog-backdrop"><div class="plugin-dialog-container"><div class="plugin-dialog"><div class="plugin-dialog-header"><h3>G-code Explorer</h3>
<button class="close-button"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button></div>
<div class="plugin-dialog-content" data-v-x id="content"></div></div></div></div>
<script>window.__cfg = null;</script></body></html>`;
const server = http.createServer((req, res) => {
  const j = (o, c) => { res.writeHead(c || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (req.url === '/api/settings' && req.method === 'PATCH') { let b = ''; req.on('data', c => b += c); req.on('end', () => j({ success: true })); return; }
  if (req.url === '/api/settings') return j(settings);
  if (req.url === '/api/firmware') return j({ firmwareVersion: '1.1f.20260525', settings: halSettings, protocol: 'grblhal' });
  if (req.url === '/api/gcode-files/current/download') { return setTimeout(() => { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end(FILE); }, DELAY); }
  if (req.url === '/api/gcode-job/status') return j({ currentFile: 'fixture-labels.nc' });
  if (req.url === '/api/server-state') return j({ machineState: { WPos: '0,0,5', status: 'Idle' } });
  if (req.url === '/api/gcode-job/analyze-line') return j({ lineNumber: 5, state: { units: 'G21' }, resumeSequence: ['G53 G0 Z-5'], warnings: [] });
  if (req.url.startsWith('/api/')) return j({}, 404);
  res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(HOST);
});


(async () => {
  await new Promise(r => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errors = []; p.on('pageerror', e => errors.push(String(e)));
  await p.goto(base);
  await p.evaluate(h => { const c = document.getElementById('content'); c.innerHTML = h;
    c.querySelectorAll('script').forEach(o => { const n = document.createElement('script'); n.textContent = o.textContent; o.parentNode.replaceChild(n, o); }); }, cfg);
  await p.waitForTimeout(500);
  await p.evaluate(() => grefSwitchTab('explain')); await p.evaluate(() => grefSetSrc('file'));
  await p.waitForTimeout(DELAY + 1200);
  const name = await p.evaluate(() => document.getElementById('gref-filename').textContent);
  const ok = name === 'fixture-labels.nc' && errors.length === 0;
  console.log((ok ? 'PASS' : 'FAIL') + ' file name shown with download delay ' + DELAY + 'ms: ' + name, errors.join(' '));
  // reload keeps the name too
  await p.evaluate(() => grefReloadFile()); await p.waitForTimeout(DELAY + 1200);
  const name2 = await p.evaluate(() => document.getElementById('gref-filename').textContent);
  const ok2 = name2 === 'fixture-labels.nc';
  console.log((ok2 ? 'PASS' : 'FAIL') + ' after reload: ' + name2);
  console.log(ok && ok2 ? 'ALL PASSED' : 'FAILED');
  process.exitCode = ok && ok2 ? 0 : 1;
  await b.close(); server.close();
})();
