// Release-note screenshots: the plugin in a stand-in ncSender dialog (ncSender's dark
// theme and dialog CSS) on a portrait 1080x1920 screen, captured at 1.5x.
//
//   node test/shots.cjs --version v2.1.5
//       -> test/out/v2.1.5-reference.png, -gcode-modes.png, -shortcut.png, -explorer.png
//
// Options (all optional):
//   --version vX.Y.Z      file name prefix (default: v + manifest version)
//   --only a,b            reference, gcode, shortcut, explorer (default: all four)
//   --file job.nc         G-code to load (default: a small built-in engraving job in mm).
//                         Keep real customer/job files out of the repo; pass a path.
//   --name job.nc         file name ncSender reports (default: the file's own name)
//   --units imperial      ncSender's Metric/Imperial setting (default: metric)
//   --search probe        Reference tab search (default: probe)
//   --lines 15-19         G-code tab lines to select, 1-based (default: a good range of
//                         the built-in job; required-ish with --file)
//   --hide T5,rapid       Explorer legend layers to switch off: tools (T5) and/or rapid
//   --line 110000         Explorer line to select
//   --zoom 6 --at 267,485 Explorer: wheel steps to zoom in, at this point (CSS px in the
//                         1080x1920 page); with --at, the line under the map's middle is
//                         then selected by a click, like a user would
//   --out dir             output folder (default: test/out)
// Afterwards the PNGs are shrunk with pngquant when it's installed (pip install pngquant-cli);
// copy the ones you use into .github/release-images/.
const { chromium } = require('playwright');
const fs = require('fs'); const http = require('http'); const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const VERSION = arg('version', 'v' + JSON.parse(fs.readFileSync(path.join(REPO, 'manifest.json'), 'utf8')).version);
const ONLY = arg('only', 'reference,gcode,shortcut,explorer').split(',');
const OUT = path.resolve(arg('out', path.join(__dirname, 'out'))); fs.mkdirSync(OUT, { recursive: true });

const cfg = fs.readFileSync(path.join(REPO, 'config.html'), 'utf8').split('__TOOL_MENU_LABEL__').join('G-code Explorer');

// three engraved fixture labels in mm: an outline, "lettering" strokes and a
// drilled hole each, with moves that lean on earlier lines
const f3 = (v) => v.toFixed(3);
const SAMPLE = (() => {
  const L = ['(Engrave fixture labels - 60 deg V-bit)', 'G21 G90 G17 G94', 'G54', 'M3 S18000', 'G0 Z5.000'];
  for (let k = 0; k < 3; k++) {
    const y0 = 12 + k * 42;
    L.push('G0 X' + f3(10) + ' Y' + f3(y0), 'G1 Z-0.381 F508', 'G1 X' + f3(110) + ' Y' + f3(y0) + ' F1016',
      'X' + f3(110) + ' Y' + f3(y0 + 30), 'X' + f3(10) + ' Y' + f3(y0 + 30), 'X' + f3(10) + ' Y' + f3(y0));
    L.push(k === 0 ? 'G53 G0 Z-5.000' : 'G0 Z1.000');
    for (let i = 0; i < 9; i++) {
      const x = 16 + i * 8.5, h = [16, 12, 18, 14, 16, 10, 18, 13, 15][i];
      L.push('G0 X' + f3(x) + ' Y' + f3(y0 + 7), 'G1 Z-0.381 F508', 'G1 X' + f3(x + 3) + ' Y' + f3(y0 + 7 + h) + ' F1016',
        'X' + f3(x + 6) + ' Y' + f3(y0 + 7), 'G0 Z1.000');
    }
    L.push('G0 X' + f3(98) + ' Y' + f3(y0 + 15), 'G1 Z-0.381 F508', 'G2 X' + f3(98) + ' Y' + f3(y0 + 15) + ' I-6.000 J0.000 F1016', 'G0 Z1.000');
  }
  L.push('M5', 'G53 G0 Z-5.000', 'M30');
  return L.join('\n');
})();
const FILE_ARG = arg('file');
const FILE = FILE_ARG ? fs.readFileSync(FILE_ARG, 'utf8') : SAMPLE;
const FILE_NAME = arg('name', FILE_ARG ? path.basename(FILE_ARG) : 'fixture-labels.nc');
const LINES_ = FILE.split('\n');
const sampleAt = (s) => LINES_.indexOf(s) + 1;
const [L0, L1] = (arg('lines') || (FILE_ARG ? '1-5' : sampleAt('G1 X110.000 Y12.000 F1016') + '-' + (sampleAt('G1 X110.000 Y12.000 F1016') + 4)))
  .split('-').map(Number);
const EX_LINE = +(arg('line') || (FILE_ARG ? 1 : sampleAt('G1 X61.500 Y71.000 F1016')));
const HIDE = (arg('hide', '') || '').split(',').filter(Boolean);
const ZOOM = +arg('zoom', 0);
const AT = arg('at') ? arg('at').split(',').map(Number) : null;
const UNITS = arg('units', 'metric');

const halSettings = {}; [0, 1, 4, 5, 10, 22, 32, 100, 101, 102, 110, 111, 112, 120, 130, 131, 132].forEach(n => halSettings[n] = { id: n, name: 'S' + n, value: n === 110 ? 5000 : 1 });
const settings = { unitsPreference: UNITS, safeZHeight: -5, keyboardBindings: { 'Plugin:com.cncdocs.gcode-reference:open-explorer': 'Ctrl+Shift+E' } };
// ncSender's dark theme variables (NcSender.Client/src/assets/styles/theme.css) and the
// PluginDialog.vue styles, including its scoped rule that styles every button
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
<div class="plugin-dialog-content" data-v-x id="content"></div></div></div></div></body></html>`;
const server = http.createServer((req, res) => {
  const j = (o, c) => { res.writeHead(c || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (req.url === '/api/settings' && req.method === 'PATCH') { let b = ''; req.on('data', c => b += c); req.on('end', () => j({ success: true })); return; }
  if (req.url === '/api/settings') return j(settings);
  if (req.url === '/api/firmware') return j({ firmwareVersion: '1.1f.20260525', settings: halSettings, protocol: 'grblhal' });
  if (req.url === '/api/gcode-files/current/download') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end(FILE); }
  if (req.url === '/api/gcode-job/status') return j({ currentFile: FILE_NAME });
  // machine position in mm (what grblHAL reports); the spindle marker sits here
  if (req.url === '/api/server-state') return j({ machineState: { WPos: FILE_ARG ? '0.000,0.000,15.240' : '58.000,66.000,1.000', status: 'Idle' } });
  if (req.url.startsWith('/api/')) return j({}, 404);
  res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(HOST);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1.5, colorScheme: 'dark' });
  const errors = []; p.on('pageerror', e => errors.push(String(e)));
  await p.goto(base);
  // what PluginDialog.vue does: v-html the dialog, then re-run its scripts
  await p.evaluate(h => { const c = document.getElementById('content'); c.innerHTML = h;
    c.querySelectorAll('script').forEach(o => { const n = document.createElement('script'); n.textContent = o.textContent; o.parentNode.replaceChild(n, o); }); }, cfg);
  await p.waitForTimeout(800);
  const dlg = p.locator('.plugin-dialog-container');
  const shot = async (kind) => { const f = path.join(OUT, VERSION + '-' + kind + '.png'); await dlg.screenshot({ path: f }); console.log('wrote', f); return f; };
  const files = [];

  if (ONLY.includes('reference')) {
    await p.fill('#gref-search', arg('search', 'probe')); await p.waitForTimeout(400);
    files.push(await shot('reference'));
  }
  if (ONLY.includes('gcode')) {
    await p.evaluate(() => grefSwitchTab('explain')); await p.waitForTimeout(400);
    await p.evaluate(() => grefSetSrc('file'));
    await p.waitForFunction(() => /\S/.test((document.getElementById('gref-filelist') || {}).innerText || ''), null, { timeout: 60000 });
    await p.waitForTimeout(FILE.length > 1e6 ? 2500 : 600);
    await p.evaluate(([a, z]) => { grefLineClick({ shiftKey: false }, a); grefLineClick({ shiftKey: true }, z); }, [L0 - 1, L1 - 1]);
    await p.waitForTimeout(800);
    // a few lines of context above the selection; definitions from the top
    await p.evaluate((a) => { const el = document.getElementById('gref-filelist'); el.scrollTop = Math.max(0, (a - 6) * 20.2);
      const o = document.getElementById('gref-exout'); if (o) o.scrollTop = 0; }, L0 - 1);
    await p.waitForTimeout(300);
    files.push(await shot('gcode-modes'));
  }
  if (ONLY.includes('shortcut')) {
    await p.evaluate(() => grefSwitchTab('settings')); await p.waitForTimeout(500);
    await p.click('#gcfg-shortcut-set'); await p.keyboard.press('Control+Shift+E'); await p.waitForTimeout(300);
    await p.evaluate(() => { document.getElementById('gcfg-shortcut-status').innerHTML = 'Saved: press <b>Ctrl+Shift+E</b> anywhere in ncSender to open G-code Explorer.';
      document.getElementById('gref-settings').scrollTop = 0; });
    files.push(await shot('shortcut'));
  }
  if (ONLY.includes('explorer')) {
    await p.evaluate(() => grefSwitchTab('navigator'));
    await p.waitForFunction(() => /Loaded/.test((document.getElementById('gn-root') || {}).innerText || ''), null, { timeout: 60000 });
    await p.waitForTimeout(1500);
    for (const h of HIDE) {
      const sel = '#gn-legend .gn-legend-item[data-layer="' + (h === 'rapid' ? 'rapid' : 'tool:' + h.replace(/^T/i, '')) + '"]';
      if (await p.locator(sel).count()) { await p.click(sel); await p.waitForTimeout(800); }
      else console.log('no legend item for', h, '- legend has:', await p.evaluate(() =>
        [...document.querySelectorAll('#gn-legend .gn-legend-item')].map(e => e.dataset.layer).join(' ')));
    }
    await p.mouse.move(1, 1);   // no hover highlight left on the legend
    await p.evaluate((n) => { const i = document.getElementById('gn-line-input'); i.value = String(n);
      i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }, EX_LINE);
    await p.waitForTimeout(1000);
    if (ZOOM) {
      const pt = AT ? { x: AT[0], y: AT[1] } : await p.evaluate(() => {
        const r = document.querySelector('.gn-map-wrap').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      await p.mouse.move(pt.x, pt.y);
      for (let i = 0; i < ZOOM; i++) { await p.mouse.wheel(0, -120); await p.waitForTimeout(120); }
      await p.waitForTimeout(1200);
      if (AT) {
        const mc = await p.evaluate(() => { const r = document.querySelector('.gn-map-wrap').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
        await p.mouse.click(mc.x, mc.y); await p.waitForTimeout(1200);
        console.log('selected line', await p.evaluate(() => document.getElementById('gn-line-input').value));
      }
    }
    files.push(await shot('explorer'));
  }
  if (errors.length) { console.log('page errors:', errors); process.exitCode = 1; }
  await b.close(); server.close();

  const pq = spawnSync('pngquant', ['--version'], { encoding: 'utf8' });
  if (pq.status === 0 && !process.argv.includes('--no-quant')) {
    for (const f of files) spawnSync('pngquant', ['--quality=85-98', '--speed', '1', '--force', '--ext', '.png', f]);
    console.log('shrunk with pngquant');
  } else if (!process.argv.includes('--no-quant')) console.log('(pngquant not found - PNGs left full size; pip install pngquant-cli)');
})();
