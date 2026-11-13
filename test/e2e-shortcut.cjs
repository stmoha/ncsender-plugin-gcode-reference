// Settings tab keyboard shortcut: load, capture, save via PATCH /api/settings, clash handling
// Run: node test/e2e-shortcut.cjs   (needs Playwright with Chromium; screenshots go to test/out/)
const { chromium } = require('playwright');
const fs = require('fs'); const http = require('http'); const path = require('path');
const REPO = require('path').resolve(__dirname, '..');
const OUT = require('path').join(__dirname, 'out');
require('fs').mkdirSync(OUT, { recursive: true });
const cfg = fs.readFileSync(path.join(REPO, 'config.html'), 'utf8').split('__TOOL_MENU_LABEL__').join('G-code Explorer');
const src = fs.readFileSync(path.join(REPO, 'commands.js'), 'utf8').replace(/export\s*\{[^}]*\};?\s*$/, '');
const buildDialogHTML = new Function(src + '\nreturn buildDialogHTML;')();
const FILE = 'G21 G90\nG0 Z5\nG0 X0 Y0\nG1 Z-1 F300\n' + Array.from({ length: 300 }, (_, i) => 'G1 X' + (i % 50) + ' Y' + Math.floor(i / 50) + ' F1000').join('\n') + '\nM30\n';
let stateCalls = 0;
const patches = []; const appSettings = { unitsPreference: 'metric', safeZHeight: -5, keyboardBindings: { JogXPlus: 'ArrowRight' } };
// a stand-in for ncSender: PluginDialog.vue's open/close/executeScripts
const HOST = `<!doctype html><html><head><meta charset="utf-8"></head><body style="background:#111;color:#eee">
<style>:root{--color-accent:#1abc9c;--gap-sm:8px;--gap-md:16px;--radius-small:6px}
.plugin-dialog-content[data-v-x] button{background:var(--color-accent);color:white;border:none;padding:var(--gap-sm) var(--gap-md);border-radius:var(--radius-small);cursor:pointer;font-weight:500;transition:opacity .2s ease}
.plugin-dialog-content[data-v-x] button:hover{opacity:.9}
.plugin-dialog-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:10}
.plugin-dialog-container{width:85vw;height:90vh;overflow:auto;background:#1c2128}</style>
<div id="app">main screen</div>
<script>
  window.openDlg = function (html) {
    closeDlgNow();
    var bd = document.createElement('div'); bd.className = 'plugin-dialog-backdrop';
    bd.innerHTML = '<div class="plugin-dialog-container"><div class="plugin-dialog"><div class="plugin-dialog-header"><h3>G-code Explorer</h3>' +
      '<button class="close-button" id="xbtn">X</button></div><div class="plugin-dialog-content" data-v-x></div></div></div>';
    bd.addEventListener('click', function (e) { if (e.target === bd) closeDlg(); });
    bd.querySelector('.close-button').addEventListener('click', function () { closeDlg(); });
    document.body.appendChild(bd);
    var c = bd.querySelector('.plugin-dialog-content'); c.innerHTML = html;
    c.querySelectorAll('script').forEach(function (o) { var n = document.createElement('script'); n.textContent = o.textContent; o.parentNode.replaceChild(n, o); });
  };
  function closeDlgNow() { var bd = document.querySelector('.plugin-dialog-backdrop'); if (bd) bd.remove(); }
  window.closeDlg = function () { setTimeout(closeDlgNow, 0); }; // Vue removes on its next tick
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDlg(); });
</script></body></html>`;
const MAN = (title, links) => `<!doctype html><html><body><h1>${title}</h1>${links}<div style="height:3000px"></div><h2 id="sec">Section</h2></body></html>`;
const server = http.createServer((req, res) => {
  const j = (o, c) => { res.writeHead(c || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (req.url === '/api/settings' && req.method === 'PATCH') {
    let body = ''; req.on('data', c => body += c); req.on('end', () => { const d = JSON.parse(body); patches.push(d);
      Object.assign(appSettings.keyboardBindings, d.keyboardBindings || {}); j({ success: true }); }); return; }
  if (req.url === '/api/settings') return j(appSettings);
  if (req.url === '/api/gcode-files/current/download') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end(FILE); }
  if (req.url === '/api/server-state') { stateCalls++; return j({ machineState: { WPos: '1,2,3', status: 'Idle' } }); }
  if (req.url.startsWith('/api/')) return j({}, 404);
  res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(HOST);
});
let failures = 0;
const check = (n, ok, x) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : '  -> ' + JSON.stringify(x))); if (!ok) failures++; };
(async () => {
  await new Promise(r => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(String(e)));
  await p.goto(base);
  await p.evaluate(h => openDlg(h), cfg); await p.waitForTimeout(400);
  await p.evaluate(() => grefSwitchTab('settings')); await p.waitForTimeout(300);
  const key = () => p.inputValue('#gcfg-shortcut');
  check('starts not set', (await key()) === 'Not set', await key());
  await p.click('#gcfg-shortcut-set'); await p.keyboard.press('Control+Shift+E'); await p.waitForTimeout(300);
  check('Ctrl+Shift+E saved to ncSender', (await key()) === 'Ctrl+Shift+E' && patches.at(-1).keyboardBindings['Plugin:com.cncdocs.gcode-reference:open-explorer'] === 'Ctrl+Shift+E', patches.at(-1));
  await p.click('#gcfg-shortcut-set'); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(200);
  const st = await p.textContent('#gcfg-shortcut-status');
  check('clash with a built-in key is caught', /ArrowUp is already used by Jog Y\+/.test(st) && (await key()) === 'Ctrl+Shift+E', st);
  await p.click('#gcfg-shortcut-take'); await p.waitForTimeout(300);
  const last = patches.at(-1).keyboardBindings;
  check('taking it moves the key', last['Plugin:com.cncdocs.gcode-reference:open-explorer'] === 'ArrowUp' && last.JogYPlus === null && (await key()) === 'ArrowUp', last);
  await p.click('#gcfg-shortcut-set'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  check('Esc cancels capture, dialog stays open', (await key()) === 'ArrowUp' && await p.evaluate(() => !!document.querySelector('.plugin-dialog-backdrop')), await key());
  await p.click('#gcfg-shortcut-clear'); await p.waitForTimeout(300);
  check('Clear removes it', (await key()) === 'Not set' && patches.at(-1).keyboardBindings['Plugin:com.cncdocs.gcode-reference:open-explorer'] === null, patches.at(-1));
  appSettings.keyboardBindings['Plugin:com.cncdocs.gcode-reference:open-explorer'] = 'Alt+G';
  await p.evaluate(() => window.dispatchEvent(new CustomEvent('settings-changed', { detail: { keyboardBindings: { 'Plugin:com.cncdocs.gcode-reference:open-explorer': 'Alt+G' } } })));
  await p.waitForTimeout(300);
  check('a change made in ncSender shows here', (await key()) === 'Alt+G', await key());
  await p.click('#gcfg-shortcut-set'); await p.keyboard.press('Shift+Digit1'); await p.waitForTimeout(200);
  const st2 = await p.textContent('#gcfg-shortcut-status');
  check('Shift+1 named like ncSender (Shift+!) and clashes with Job pause', /Shift\+! is already used by Job Pause/.test(st2), st2);
  await p.click('#gcfg-shortcut-keep');
  await p.screenshot({ path: require('path').join(OUT, 'shortcut.png'), clip: { x: 0, y: 60, width: 1300, height: 420 } });
  check('no page errors', errors.length === 0, errors);
  await b.close(); server.close();
  console.log(failures ? failures + ' FAILED' : 'ALL PASSED');
  process.exitCode = failures ? 1 : 0;
})();
