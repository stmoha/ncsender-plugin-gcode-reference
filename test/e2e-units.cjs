// Explorer tab follows ncSender's Metric/Imperial setting; mixed-unit files land in the right place
// Run: node test/e2e-units.cjs   (needs Playwright with Chromium; screenshots go to test/out/)
const { chromium } = require('playwright');
const fs = require('fs'); const http = require('http'); const path = require('path');
const REPO = require('path').resolve(__dirname, '..');
const OUT = require('path').join(__dirname, 'out');
require('fs').mkdirSync(OUT, { recursive: true });
const cfg = fs.readFileSync(path.join(REPO, 'config.html'), 'utf8');
const MM_FILE = 'G21 G90\nG0 Z5\nG0 X0 Y0\nG1 Z-1 F300\nG1 X25.4 Y0 F1000\nG1 X25.4 Y25.4\nG1 X0 Y25.4\nG1 X0 Y0\nG0 Z5\nM30\n';
const IN_FILE = 'G20 G90\nG0 Z0.2\nG0 X0 Y0\nG1 Z-0.04 F10\nG1 X1 Y0 F40\nG1 X1 Y1\nG1 X0 Y1\nG1 X0 Y0\nG0 Z0.2\nM30\n';
let settings = { unitsPreference: 'imperial', safeZHeight: -5 };
let file = MM_FILE;
let wpos = '25.4,0,-2.54';
const MIXED_FILE = 'G21 G90\nG0 Z5\nG0 X-380 Y28.575\nG1 Z-0.381 F300\nG1 X630.851 Y-75.565 F1000\nG0 Z5\nG20\nM30\n';
const SWITCH_FILE = 'G21 G90\nG0 X0 Y0 Z5\nG1 X100 Y0 F500\nG20\nG1 X5 Y0\nM30\n';
const sent = []; const sfl = [];
const server = http.createServer((req, res) => {
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    const j = (o, code) => { res.writeHead(code || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (req.url === '/api/settings') return j(settings);
    if (req.url === '/api/gcode-files/current/download') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end(file); }
    if (req.url === '/api/server-state') return j({ machineState: { WPos: wpos, status: 'Idle' } });
    if (req.url === '/api/send-command') { sent.push(JSON.parse(body).command); return j({ success: true }); }
    if (req.url === '/api/gcode-job/analyze-line') return j({ lineNumber: 5, state: { units: file === MM_FILE ? 'G21' : 'G20' }, resumeSequence: ['G53 G0 Z-5'], warnings: [] });
    if (req.url === '/api/gcode-job/start-from-line') { sfl.push(JSON.parse(body)); return j({ success: true, message: 'ok' }); }
    if (req.url.startsWith('/api/')) return j({}, 404);
    res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(cfg);
  });
});
let failures = 0;
const check = (n, ok, x) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : '  -> ' + JSON.stringify(x))); if (!ok) failures++; };
(async () => {
  await new Promise(r => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  const errors = []; p.on('pageerror', e => errors.push(String(e)));
  await p.goto(base); await p.waitForTimeout(300);
  await p.evaluate(() => grefSwitchTab('navigator')); await p.waitForTimeout(1200);
  const ui = () => p.evaluate(() => ({
    pills: Array.from(document.querySelectorAll('#gn-jog-steps .gn-step-pill')).map(e => e.textContent + (e.classList.contains('gn-step-active') ? '*' : '')),
    feeds: Array.from(document.querySelectorAll('#gn-jog-feed option')).map(o => o.value + (o.selected ? '*' : '')),
    lens: Array.from(document.querySelectorAll('.gn-u-len')).map(e => e.textContent),
    feedsU: Array.from(document.querySelectorAll('.gn-u-feed')).map(e => e.textContent),
    approach: document.getElementById('gn-sfl-approach').value, plunge: document.getElementById('gn-sfl-plunge').value,
    preset: document.getElementById('gn-preset-z-input').value,
    start: document.getElementById('gn-an-end').textContent,
    status: document.getElementById('gn-status').textContent }));
  let u = await ui();
  check('imperial: step pills', JSON.stringify(u.pills) === JSON.stringify(['0.01', '0.1*', '1']), u.pills);
  check('imperial: feed options', JSON.stringify(u.feeds) === JSON.stringify(['20', '40', '80*', '160']), u.feeds);
  check('imperial: length labels', u.lens.length >= 4 && u.lens.every(t => t === 'in'), u.lens);
  check('imperial: feed labels', u.feedsU.length >= 2 && u.feedsU.every(t => t === 'in/min'), u.feedsU);
  check('imperial: inch defaults', u.approach === '0.2' && u.plunge === '20' && u.preset === '0.4', [u.approach, u.plunge, u.preset]);
  check('imperial: line analysis in inches', /X0\.0000 Y0\.0000 Z0\.1969\s*in/.test(u.start), u.start);
  check('imperial: status safe Z in inches', /-0\.1969 in/.test(u.status), u.status);
  await p.screenshot({ path: path.join(OUT, 'explorer-imperial.png') });
  // jog X+ one step
  await p.click('#gn-jog-box button[data-jog="1,0"]'); await p.waitForTimeout(200);
  check('imperial jog command', sent.at(-1) === '$J=G91 G20 X0.1 F80', sent.at(-1));
  await p.click('#gn-jog-box button[data-jogz="1"]'); await p.waitForTimeout(200);
  check('imperial Z jog capped', sent.at(-1) === '$J=G91 G20 Z0.1 F47', sent.at(-1));
  // retract (first motion confirm)
  await p.click('#gn-retract-btn'); await p.waitForTimeout(150);
  const body = await p.textContent('#gn-confirm-body');
  check('imperial retract confirm text', /-0\.1969 in/.test(body), body);
  await p.click('#gn-confirm-ok'); await p.waitForTimeout(200);
  check('imperial retract command', sent.at(-1) === 'G20 G90 G53 G0 Z-0.1969', sent.at(-1));
  // rapid to point: first segment start (0,0 file mm) -> inches
  await p.click('#gn-rapid-point-btn'); await p.waitForTimeout(200);
  check('imperial rapid command', /^G20 G90 G53 G0 Z-0\.1969\nG20 G90 G0 X0\.0000 Y0\.0000$/.test(sent.at(-1)), sent.at(-1));
  // start from line: 0.2 in approach -> 5.08 mm, 20 in/min -> 508 mm/min (mm file)
  await p.click('#gn-sfl-btn'); await p.waitForTimeout(200);
  await p.click('#gn-sfl-go'); await p.waitForTimeout(200);
  check('imperial SFL sends file (mm) units', sfl.at(-1) && sfl.at(-1).approachHeight === 5.08 && sfl.at(-1).plungeFeedRate === 508, sfl.at(-1));

  // switch to metric live
  settings = { unitsPreference: 'metric', safeZHeight: -5 };
  await p.evaluate(() => window.dispatchEvent(new CustomEvent('settings-changed', { detail: { unitsPreference: 'metric' } })));
  await p.waitForTimeout(400);
  u = await ui();
  check('metric: step index kept', JSON.stringify(u.pills) === JSON.stringify(['0.1', '1*', '10']), u.pills);
  check('metric: feed index kept', JSON.stringify(u.feeds) === JSON.stringify(['500', '1000', '2000*', '4000']), u.feeds);
  check('metric: labels', u.lens.every(t => t === 'mm') && u.feedsU.every(t => t === 'mm/min'), [u.lens, u.feedsU]);
  check('metric: typed values converted', u.approach === '5.1' && u.plunge === '508' && u.preset === '10.2', [u.approach, u.plunge, u.preset]);
  check('metric: line analysis mm', /X0\.000 Y0\.000 Z5\.000\s*mm/.test(u.start), u.start);
  check('metric: status mm', /-5\.000 mm/.test(u.status), u.status);
  await p.click('#gn-jog-box button[data-jog="1,0"]'); await p.waitForTimeout(200);
  check('metric jog command', sent.at(-1) === '$J=G91 G21 X1 F2000', sent.at(-1));
  await p.click('#gn-retract-btn'); await p.waitForTimeout(200);
  check('metric retract (custom Z off) command', sent.at(-1) === 'G21 G90 G53 G0 Z-5.000', sent.at(-1));
  check('no page errors (mm file)', errors.length === 0, errors);
  await p.close();

  // inch file, metric app: coordinates converted to mm, SFL sends inches
  file = IN_FILE; settings = { unitsPreference: 'metric', safeZHeight: -5 }; sent.length = 0;
  const p2 = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p2.on('pageerror', e => errors.push(String(e)));
  await p2.goto(base); await p2.waitForTimeout(300);
  await p2.evaluate(() => grefSwitchTab('navigator')); await p2.waitForTimeout(1200);
  const st = await p2.textContent('#gn-an-end');
  check('inch file in metric app: analysis in mm', /X0\.000 Y0\.000 Z5\.080\s*mm/.test(st), st);
  await p2.evaluate(() => { document.getElementById('gn-creep-slider').value = 100; document.getElementById('gn-creep-slider').dispatchEvent(new Event('input')); });
  await p2.click('#gn-rapid-point-btn'); await p2.waitForTimeout(150); await p2.click('#gn-confirm-ok'); await p2.waitForTimeout(200);
  check('inch file rapid sent in mm', /G21 G90 G0 X0\.000 Y0\.000$/.test(sent.at(-1)) || /G21 G90 G0 X[0-9.]+ Y[0-9.]+$/.test(sent.at(-1)), sent.at(-1));
  await p2.click('#gn-sfl-btn'); await p2.waitForTimeout(200);
  await p2.fill('#gn-sfl-approach', '5'); await p2.fill('#gn-sfl-plunge', '254');
  await p2.click('#gn-sfl-go'); await p2.waitForTimeout(200);
  check('inch file SFL sends inches', sfl.at(-1).approachHeight === 0.1969 && sfl.at(-1).plungeFeedRate === 10, sfl.at(-1));
  await p2.screenshot({ path: path.join(OUT, 'explorer-metric.png') });
  check('no page errors (inch file)', errors.length === 0, errors);
  // mm file that ends with G20 (Stefan's SBT file): map + spindle stay in mm
  file = MIXED_FILE; settings = { unitsPreference: 'imperial', safeZHeight: -5 }; wpos = '409.5,-0.005,-28.96';
  const p3 = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p3.on('pageerror', e => errors.push(String(e)));
  await p3.goto(base); await p3.waitForTimeout(300);
  await p3.evaluate(() => grefSwitchTab('navigator')); await p3.waitForTimeout(1500);
  const st3 = await p3.textContent('#gn-status');
  check('trailing G20: not called an inch file', !/inch/.test(st3), st3);
  const tr = await p3.evaluate(() => { const g = document.querySelector('[data-spindle]'); return g && g.getAttribute('transform'); });
  check('trailing G20: spindle marker at X 409.5 mm', /translate\(409\.5/.test(tr || ''), tr);
  await p3.fill('#gn-line-input', '5'); await p3.press('#gn-line-input', 'Enter'); await p3.waitForTimeout(300);
  const end3 = await p3.textContent('#gn-an-end');
  check('trailing G20: X630.851 mm shown as 24.8367 in', /X24\.8367 Y-2\.9750/.test(end3), end3);
  await p3.close();
  // a file that really switches units part way
  file = SWITCH_FILE; settings = { unitsPreference: 'metric', safeZHeight: -5 };
  const p4 = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  p4.on('pageerror', e => errors.push(String(e)));
  await p4.goto(base); await p4.waitForTimeout(300);
  await p4.evaluate(() => grefSwitchTab('navigator')); await p4.waitForTimeout(1500);
  check('switching file flagged', /switches between mm and inch/.test(await p4.textContent('#gn-status')), await p4.textContent('#gn-status'));
  await p4.fill('#gn-line-input', '5'); await p4.press('#gn-line-input', 'Enter'); await p4.waitForTimeout(300);
  const end4 = await p4.textContent('#gn-an-end');
  check('inch line after G20 drawn in mm (X5 in = 127 mm)', /X127\.000 Y0\.000/.test(end4), end4);
  check('no page errors (mixed files)', errors.length === 0, errors);
  await b.close(); server.close();
  console.log(failures ? failures + ' FAILED' : 'ALL PASSED');
  process.exitCode = failures ? 1 : 0;
})();
