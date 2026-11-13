// G-code tab mode badges: units, distance, WCS/G53, feed mode, carried-over motion and feed, spindle off, G92, TLO
// Run: node test/e2e-modes.cjs   (needs Playwright with Chromium; screenshots go to test/out/)
const { chromium } = require('playwright');
const fs = require('fs'); const http = require('http'); const path = require('path');
const REPO = require('path').resolve(__dirname, '..');
const OUT = require('path').join(__dirname, 'out');
require('fs').mkdirSync(OUT, { recursive: true });
const src = fs.readFileSync(path.join(REPO, 'commands.js'), 'utf8').replace(/export\s*\{[^}]*\};?\s*$/, '');
const buildDialogHTML = new Function(src + '\nreturn buildDialogHTML;')();
const FILE = ['(header)', 'G21 G90 G17 G94', 'G54', 'M3 S18000', 'G0 Z5', 'G0 X0 Y0', 'G1 Z-0.381 F508', 'X10 Y0',
  'G91', 'G1 X5', 'G90', 'G53 G0 Z-5', 'G20', 'G1 X1 F20', 'M5', 'G1 X2', 'G92 X0 Y0', 'G1 X3',
  'G81 R2 Z-3 F100 X1 Y1', 'X2 Y2', 'G80', 'M30'].join('\n');
let page = '';
const server = http.createServer((req, res) => {
  if (req.url === '/api/gcode-files/current/download') { res.writeHead(200); return res.end(FILE); }
  if (req.url.startsWith('/api/')) { res.writeHead(404); return res.end('{}'); }
  res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(page);
});
let failures = 0;
const check = (n, ok, x) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : '  -> ' + JSON.stringify(x))); if (!ok) failures++; };
(async () => {
  await new Promise(r => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1100 } });
  const errors = []; p.on('pageerror', e => errors.push(String(e)));
  // 1. whole program pasted (terminal ??) -> modes tracked from its first line
  page = '<!doctype html><meta charset="utf-8"><body style="background:#111;color:#eee">' + buildDialogHTML({ initialTab: 'explain', initialExplain: FILE });
  await p.goto(base); await p.waitForTimeout(500);
  const L = await p.evaluate(() => Array.from(document.querySelectorAll('.gref-exline')).map(el => ({
    src: el.querySelector('.gref-exline-src').textContent.trim(),
    modes: Array.from(el.querySelectorAll('.gref-mode')).map(m => m.textContent),
    words: Array.from(el.querySelectorAll('.gref-word-desc')).map(d => d.textContent) })));
  const line = (t) => L.find(x => x.src.replace(/^\d+/, '').trim() === t) || { modes: [], words: [] };
  let l = line('X10 Y0');
  check('implicit move: G1 carried over + feed from line 7', l.modes.includes('G1 carried over') && l.modes.includes('F508 from line 7'), l.modes);
  check('implicit move: absolute mm in G54', l.words.some(w => /= 10 mm, absolute in G54 work coordinates/.test(w)), l.words);
  check('units set on line 2 shown solid', l.modes[0] === 'mm · G21', l.modes);
  l = line('G1 X5');
  check('G91: relative', l.modes.includes('relative · G91') && l.words.some(w => /= 5 mm, relative to where the tool is \(G91\)/.test(w)), l);
  l = line('G53 G0 Z-5');
  check('G53: machine coordinates', l.modes.includes('machine coords · G53') && l.words.some(w => /machine coordinates \(G53\)/.test(w)), l);
  l = line('G1 X1 F20');
  check('after G20: inches and in/min', l.modes[0] === 'in · G20' && l.words.some(w => /= 1 in, absolute/.test(w)) && l.words.some(w => /= 20 in\/min/.test(w)), l);
  l = line('G1 X2');
  check('after M5: spindle off warning', l.modes.includes('spindle off (M5)'), l.modes);
  l = line('G92 X0 Y0');
  check('G92 line: values are offsets, no motion badges', !l.modes.some(m => /carried|spindle/.test(m)) && l.words.some(w => /= 0 in$/.test(w)), l);
  l = line('G1 X3');
  check('after G92: offset warning', l.modes.includes('G92 offset active'), l.modes);
  l = line('X2 Y2');
  check('in a canned cycle: warning', l.modes.some(m => /G81 cycle/.test(m)), l.modes);
  l = line('G0 Z5');
  check('first motion lines: units badge solid (set on line 2)', l.modes[0] === 'mm · G21' && !l.modes.includes('spindle off (M5)'), l.modes);
  // 2. a lone line from the loaded file: modes read back through the file
  page = '<!doctype html><meta charset="utf-8"><body style="background:#111;color:#eee">' + buildDialogHTML({ initialTab: 'explain' });
  await p.goto(base); await p.waitForTimeout(500);
  await p.evaluate(() => grefSetSrc('file')); await p.waitForTimeout(400);
  await p.evaluate(() => grefLineClick({ shiftKey: false }, 15)); await p.waitForTimeout(300); // line 16: G1 X2
  const one = await p.evaluate(() => { const el = document.querySelector('.gref-exline'); return { src: el.querySelector('.gref-exline-src').textContent,
    modes: Array.from(el.querySelectorAll('.gref-mode')).map(m => ({ t: m.textContent, title: m.title })), words: Array.from(el.querySelectorAll('.gref-word-desc')).map(d => d.textContent) }; });
  check('lone line 16 from file: inches (set on line 13), spindle off (line 15)', /G1 X2/.test(one.src) && one.modes[0].t === 'in · G20' && /line 13/.test(one.modes[0].title) &&
    one.modes.some(m => m.t === 'spindle off (M5)' && /line 15/.test(m.title)) && one.words.some(w => /= 2 in, absolute in G54/.test(w)), one);
  // 3. no units anywhere: dashed "units?" badge
  page = '<!doctype html><meta charset="utf-8"><body style="background:#111;color:#eee">' + buildDialogHTML({ initialTab: 'explain', initialExplain: 'G0 X1 Y2' });
  await p.goto(base); await p.waitForTimeout(400);
  const nu = await p.evaluate(() => Array.from(document.querySelectorAll('.gref-mode')).map(m => m.className + '|' + m.textContent));
  check('units never set: flagged', nu[0] === 'gref-mode unset warn|units? mm · G21', nu);
  await p.screenshot({ path: path.join(OUT, 'modal.png') });
  check('no page errors', errors.length === 0, errors);
  await b.close(); server.close();
  console.log(failures ? failures + ' FAILED' : 'ALL PASSED');
  process.exitCode = failures ? 1 : 0;
})();
