// Portrait (1080x1920) layout: stacked G-code panes, Explorer map on top, divider drag by mouse and touch, rotation
// Run: node test/e2e-portrait.cjs   (needs Playwright with Chromium; screenshots go to test/out/)
const { chromium } = require('playwright');
const fs = require('fs'); const http = require('http'); const path = require('path');
const REPO = require('path').resolve(__dirname, '..');
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
  if (req.url === '/api/gcode-files/current/download') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end(FILE); }
  if (req.url === '/api/gcode-job/status') return j({ currentFile: 'fixture-labels.nc' });
  if (req.url === '/api/server-state') return j({ machineState: { WPos: '0,0,5', status: 'Idle' } });
  if (req.url === '/api/gcode-job/analyze-line') return j({ lineNumber: 5, state: { units: 'G21' }, resumeSequence: ['G53 G0 Z-5'], warnings: [] });
  if (req.url.startsWith('/api/')) return j({}, 404);
  res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(HOST);
});


let fails = 0; const check = (n, ok, d) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : '  ' + JSON.stringify(d))); if (!ok) fails++; };
(async () => {
  await new Promise(r => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, hasTouch: true });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', e => errors.push(String(e)));
  await p.goto(base);
  await p.evaluate(h => { const c = document.getElementById('content'); c.innerHTML = h;
    c.querySelectorAll('script').forEach(o => { const n = document.createElement('script'); n.textContent = o.textContent; o.parentNode.replaceChild(n, o); }); }, cfg);
  await p.waitForTimeout(800);
  const fits = () => p.evaluate(() => { const c = document.querySelector('.plugin-dialog-container'), k = document.getElementById('content');
    return { h: Math.round(c.getBoundingClientRect().height), vh85: Math.round(innerHeight * 0.85), scroll: k.scrollHeight > k.clientHeight + 1 }; });
  let f = await fits(); check('portrait: dialog fits 85vh, no host scrollbar', f.h <= f.vh85 && !f.scroll, f);
  await p.evaluate(() => grefSwitchTab('explain')); await p.waitForTimeout(300);
  await p.evaluate(() => grefSetSrc('file')); await p.waitForTimeout(600);
  const panes = () => p.evaluate(() => { const l = document.getElementById('gref-leftpane').getBoundingClientRect(), r = document.getElementById('gref-exout').getBoundingClientRect(), d = document.querySelector('.gref-divider').getBoundingClientRect();
    return { lx: l.x, ly: l.y, lw: l.width, lh: l.height, rx: r.x, ry: r.y, rw: r.width, dx: d.x + d.width / 2, dy: d.y + d.height / 2, cur: getComputedStyle(document.querySelector('.gref-divider')).cursor }; });
  let a = await panes();
  check('portrait G-code: file above definitions', a.ry > a.ly + a.lh - 2 && Math.abs(a.lx - a.rx) < 20, a);
  check('portrait G-code: definitions get the full width', a.rw > 900, a.rw);
  check('portrait G-code: divider resizes up/down', a.cur === 'row-resize', a.cur);
  // mouse drag
  await p.mouse.move(a.dx, a.dy); await p.mouse.down(); await p.mouse.move(a.dx, a.dy + 200, { steps: 5 }); await p.mouse.up();
  let a2 = await panes(); check('portrait G-code: mouse drag grows the file pane', a2.lh > a.lh + 150, [a.lh, a2.lh]);
  // touch drag via CDP touch events
  const cdp = await ctx.newCDPSession(p);
  const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', a2.dx, a2.dy); for (let i = 1; i <= 6; i++) await touch('touchMove', a2.dx, a2.dy - i * 50); await touch('touchEnd');
  await p.waitForTimeout(100);
  let a3 = await panes(); check('portrait G-code: finger drag shrinks the file pane', a3.lh < a2.lh - 200, [a2.lh, a3.lh]);
  check('portrait G-code: drag is clamped', a3.lh > 100, a3.lh);
  // rotate to landscape: side by side again, horizontal split untouched
  await p.setViewportSize({ width: 1920, height: 1080 }); await p.waitForTimeout(300);
  let L = await panes();
  check('landscape G-code: side by side', L.rx > L.lx + L.lw - 2 && Math.abs(L.ly - L.ry) < 60, L);
  check('landscape G-code: divider resizes left/right', L.cur === 'col-resize', L.cur);
  const wrapW = await p.evaluate(() => document.getElementById('gref-exwrap').getBoundingClientRect().width);
  check('landscape G-code: file pane keeps its 42% share', Math.abs(L.lw / wrapW - 0.42) < 0.02, L.lw / wrapW);
  await p.mouse.move(L.dx, L.dy); await p.mouse.down(); await p.mouse.move(L.dx + 200, L.dy, { steps: 5 }); await p.mouse.up();
  let L2 = await panes(); check('landscape G-code: mouse drag still works', L2.lw > L.lw + 150, [L.lw, L2.lw]);
  f = await fits(); check('landscape: dialog height unchanged (75vh)', Math.abs(f.h - (1080 * 0.75 + 86)) < 4 && !f.scroll, f);
  // back to portrait: the vertical share is remembered
  await p.setViewportSize({ width: 1080, height: 1920 }); await p.waitForTimeout(300);
  let P = await panes(); check('portrait again: file pane height remembered', Math.abs(P.lh - a3.lh) < 4, [a3.lh, P.lh]);
  // Explorer
  await p.evaluate(() => grefSwitchTab('navigator')); await p.waitForTimeout(1500);
  const ex = () => p.evaluate(() => { const m = document.querySelector('.gn-map-wrap').getBoundingClientRect(), s = document.getElementById('gn-line-svg').getBoundingClientRect();
    const boxes = [...document.querySelectorAll('.gn-controls-scroll > .gn-panel-box')].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width)]; });
    const lg = document.getElementById('gn-legend').getBoundingClientRect(); const items = [...document.querySelectorAll('#gn-legend > span')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect().height);
    return { mw: m.width, mh: m.height, sw: s.width, sh: s.height, my: m.y, boxes, legendH: lg.height, maxItemH: Math.max(...items), draw: (() => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; document.querySelectorAll('#gn-line-svg path, #gn-line-svg polyline, #gn-line-svg line').forEach(e => { const r = e.getBoundingClientRect(); if (!r.width && !r.height) return; x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }); return { inside: x0 >= s.x - 1 && y0 >= s.y - 1 && x1 <= s.right + 1 && y1 <= s.bottom + 1, fill: Math.max((x1 - x0) / s.width, (y1 - y0) / s.height) }; })() }; });
  let E = await ex();
  check('portrait Explorer: map spans the width', E.mw > 940, E.mw);
  check('portrait Explorer: three control boxes in one row below the map', E.boxes.length === 3 && E.boxes.every(x => x[1] === E.boxes[0][1]) && E.boxes[0][1] > E.my + E.mh && E.boxes[0][0] < E.boxes[1][0] && E.boxes[1][0] < E.boxes[2][0], E.boxes);
  check('portrait Explorer: map gets most of the height', E.mh > 900, E.mh);
  check('Explorer legend: labels stay on one line', E.maxItemH < 22, E.maxItemH);
  const shown = await p.evaluate(() => { const c = document.querySelector('.gn-controls-scroll'); return c.scrollHeight <= c.clientHeight + 1; });
  check('portrait Explorer: controls fit without scrolling', shown, null);
  await p.setViewportSize({ width: 1920, height: 1080 }); await p.waitForTimeout(500);
  let E2 = await ex();
  check('landscape Explorer: controls back in a column at the right', E2.boxes.every(x => x[0] === E2.boxes[0][0]) && E2.boxes[0][0] > E2.mw, E2.boxes);
  check('portrait Explorer: drawing fits the map', E.draw.inside && E.draw.fill > 0.7, E.draw);
  check('landscape Explorer: map follows the resize', Math.abs(E2.sw - E2.mw) < 4 && E2.draw.inside && E2.draw.fill > 0.7, [E2.sw, E2.mw, E2.draw]);
  check('no page errors', errors.length === 0, errors);
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  process.exitCode = fails ? 1 : 0;
  await b.close(); server.close();
})();
