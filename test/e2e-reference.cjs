// Reference and G-code tabs against grblHAL, Grbl 1.1, FluidNC and no controller: lookups, controller support, explanations
// Run: node test/e2e-reference.cjs   (needs Playwright with Chromium; screenshots go to test/out/)
const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');
const REPO = require('path').resolve(__dirname, '..');
const OUT = require('path').join(__dirname, 'out');
require('fs').mkdirSync(OUT, { recursive: true });

// buildDialogHTML from the generated commands.js
const src = fs.readFileSync(path.join(REPO, 'commands.js'), 'utf8').replace(/export\s*\{[^}]*\};?\s*$/, '');
const buildDialogHTML = new Function(src + '\nreturn buildDialogHTML;')();
const wrap = (body) => '<!doctype html><html><head><meta charset="utf-8"></head><body style="background:#111;color:#e8eaed">' + body + '</body></html>';

const grblSettings = {}; [0,1,2,3,4,5,6,10,11,12,13,20,21,22,23,24,25,26,27,30,31,32,100,101,102,110,111,112,120,121,122,130,131,132].forEach(n => grblSettings[n] = { id: n, value: n === 4 ? 1 : 0 });
const fncSettings = {}; [10,13,20,21,22,23,30,32,100,101,102,110,111,112,120,121,122,130,131,132].forEach(n => fncSettings[n] = { id: n, value: 5 });
const halSettings = {}; [0,1,4,5,10,22,32,100,110,120,130,683,684].forEach(n => halSettings[n] = { id: n, name: 'S' + n, value: 7 });
const FW = {
  grbl: { firmwareVersion: '1.1h', settings: grblSettings, protocol: 'grbl' },
  fluidnc: { firmwareVersion: 'FluidNC v4.0.3', settings: fncSettings, protocol: 'fluidnc' },
  grblhal_offline: { firmwareVersion: '1.1f.20250101', settings: halSettings, protocol: null },
  none: null
};

let current = 'none', pageHtml = '';
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/firmware')) {
    const d = FW[current];
    if (!d) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(d));
  }
  if (req.url.startsWith('/api/')) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(pageHtml);
});

let failures = 0;
function check(name, ok, extra) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || !extra ? '' : '  -> ' + extra)); if (!ok) failures++; }

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch();
  async function open(proto, html, shot) {
    current = proto; pageHtml = html;
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
    await page.goto(base);
    await page.waitForTimeout(400);
    page._errors = errors;
    return page;
  }
  async function lookup(page, q) {
    await page.fill('#gref-search', q);
    await page.waitForTimeout(120);
    return page.evaluate(() => {
      const card = document.querySelector('.gref-card');
      return { count: document.querySelector('.gref-count') ? document.querySelector('.gref-count').textContent : '',
               first: card ? card.getAttribute('data-code') : null,
               head: card ? card.querySelector('.gref-card-head').textContent : '',
               detail: card ? card.querySelector('.gref-detail').textContent : '',
               codes: Array.from(document.querySelectorAll('.gref-card')).map(c => c.getAttribute('data-code')) };
    });
  }

  // ---------- Grbl 1.1 ----------
  let p = await open('grbl', wrap(buildDialogHTML({ initialTab: 'reference' })));
  let r = await lookup(p, 'G43');
  check('grbl: G43 flagged', r.first === 'G43' && /not on this controller/i.test(r.head), r.head);
  check('grbl: G43 reason', /Grbl 1\.1 can.t run this: No tool table/.test(r.detail), r.detail.slice(0, 300));
  check('grbl: count names controller', /Grbl 1\.1/.test(r.count) && /1\.1h/.test(r.count), r.count);
  r = await lookup(p, 'M6');
  check('grbl: M6 not flagged', r.first === 'M6' && !/not on this controller/i.test(r.head), r.head);
  check('grbl: M6 ncSender pause note', /Grbl 1\.1: Grbl has no tool change/.test(r.detail) && /connected/.test(r.detail), r.detail.slice(-400));
  r = await lookup(p, '$4');
  check('grbl: $4 live value + note', /= 1/.test(r.head) && /Grbl 1\.1 \(connected\): On Grbl 1\.1 this is one on\/off switch/.test(r.detail), r.detail.slice(-300));
  r = await lookup(p, '$14');
  check('grbl: $14 absent w/ grbl reason', /not on this controller/i.test(r.head) && /Classic Grbl 1\.1 only has/.test(r.detail), r.detail.slice(0, 200));
  r = await lookup(p, '$683');
  check('grbl: $683 exists in DB', r.first === '$683', r.first);
  r = await lookup(p, 'keepout');
  check('search keepout finds M960', r.codes.indexOf('M960') !== -1, r.codes.join(','));
  r = await lookup(p, 'M810');
  check('M810 alias -> M960', r.first === 'M960', r.first);
  r = await lookup(p, '$C');
  check('$C present & runs', r.first === '$C' && !/not on this controller/i.test(r.head), r.head);
  await p.screenshot({ path: require('path').join(OUT, 'grbl-ref.png') });
  check('grbl: no page errors', p._errors.length === 0, p._errors.join(' | '));
  await p.close();

  // ---------- FluidNC ----------
  p = await open('fluidnc', wrap(buildDialogHTML({ initialTab: 'reference' })));
  r = await lookup(p, '$CD');
  check('fluidnc: $CD runs', r.first === '$CD' && !/not on this controller/i.test(r.head), r.head);
  r = await lookup(p, '$config/dump');
  check('fluidnc: long-name alias', r.first === '$CD', r.first);
  r = await lookup(p, '$ES');
  check('fluidnc: $ES flagged', r.first === '$ES' && /not on this controller/i.test(r.head) && /use \$S/.test(r.detail), r.detail.slice(0, 200));
  r = await lookup(p, '$110');
  check('fluidnc: $110 note first & connected', /FluidNC \(connected\): Read-only on FluidNC/.test(r.detail) && r.detail.indexOf('FluidNC (connected)') < r.detail.indexOf('Grbl 1.1:'), r.detail.slice(-400));
  r = await lookup(p, 'M62');
  check('fluidnc: M62 runs', !/not on this controller/i.test(r.head), r.head);
  r = await lookup(p, 'G81');
  check('fluidnc: G81 flagged', /not on this controller/i.test(r.head), r.head);
  r = await lookup(p, '$TLS');
  check('plugin note shown once', (r.detail.match(/Handled by the ncSender plugin/g) || []).length === 1, r.detail.slice(-300));
  r = await lookup(p, '$14');
  check('fluidnc: absent reason', /FluidNC only mirrors/.test(r.detail), r.detail.slice(0, 200));
  await p.screenshot({ path: require('path').join(OUT, 'fluidnc-ref.png') });
  check('fluidnc: no page errors', p._errors.length === 0, p._errors.join(' | '));
  await p.close();

  // ---------- grblHAL inferred (disconnected, named cache) ----------
  p = await open('grblhal_offline', wrap(buildDialogHTML({ initialTab: 'reference' })));
  r = await lookup(p, '$CD');
  check('grblhal: $CD flagged FluidNC only', /not on this controller/i.test(r.head) && /FluidNC only/.test(r.detail), r.detail.slice(0, 200));
  r = await lookup(p, '$S');
  const iS = r.codes.indexOf('$S'), iSLP = r.codes.indexOf('$SLP');
  check('grblhal: $S exact first even though FluidNC only', r.first === '$S', r.codes.slice(0, 5).join(','));
  r = await lookup(p, 'list');
  const firstFnc = r.codes.findIndex(c => ['$CMD','$S','$A','$E','$SC','$L','$LocalFS/List','$SD/List','$PL'].includes(c));
  const lastHal = Math.max(...['$$','$EA','$EE','$ES','$SPINDLES','$F'].map(c => r.codes.indexOf(c)));
  await p.fill('#gref-search', ''); await p.evaluate(() => grefSetCategory('system')); await p.waitForTimeout(100);
  const sysCodes = await p.evaluate(() => Array.from(document.querySelectorAll('.gref-card')).map(c => c.getAttribute('data-code')));
  const fncOnly = ['$CD','$SS','$CMD','$S','$SC','$L','$A','$E','$MD','$Bye','$LocalFS/List','$SD/List','$Config/Filename','$Message/Level','$PL','$GD','$Limits','$T','$RM','$RI','$Heap','$NVX'];
  const firstF = sysCodes.findIndex(c => fncOnly.includes(c));
  const lastRun = Math.max(...sysCodes.map((c, i) => (!fncOnly.includes(c) && !['$TLR','$TPW','$TTLOAD','$SPINDLES','$EG','$pins','$pinstate','$F','$REBOOT','$ES','$EE','$EA'].includes(c)) ? i : -1));
  check('grblhal: FluidNC-only entries sink below runnable ones', firstF > lastRun, sysCodes.join(','));
  await p.evaluate(() => grefSetCategory('all'));
  r = await lookup(p, '$683');
  check('grblhal: $683 present w/ live value', /= 7/.test(r.head), r.head);
  r = await lookup(p, '$700');
  check('grblhal: absent generic reason', /isn.t in your controller.s settings list/.test(r.detail), r.detail.slice(0, 200));
  r = await lookup(p, '$716');
  check('settings tips now shown', /\$743/.test(r.detail), r.detail.slice(-200));
  check('grblhal: no page errors', p._errors.length === 0, p._errors.join(' | '));
  await p.close();

  // ---------- no controller info ----------
  p = await open('none', wrap(buildDialogHTML({ initialTab: 'reference' })));
  r = await lookup(p, 'G43');
  check('none: no flags', !/not on this controller/i.test(r.head), r.head);
  check('none: pills still shown', /Controllers/.test(r.detail) && /Grbl 1\.1/.test(r.detail), r.detail.slice(-300));
  check('none: count says unavailable', /unavailable/.test(r.count), r.count);
  check('none: no page errors', p._errors.length === 0, p._errors.join(' | '));
  await p.close();

  // ---------- explain, Grbl ----------
  const lines = ['G43 H1', 'M62 P1', '(MSG, NCSENDER_PAUSE: Dust shoe | Fit the dust shoe, then Continue)', 'M0',
                 '#<_dust_boot_attached> = 0', '#<_depth> = [#<_z> - 2.5]', '$Config/Dump', '$MEASURE_TLO T3', 'M7.1', 'M6 T2', '(PRINT, Z is #5063)', 'G1 X10 F500'];
  p = await open('grbl', wrap(buildDialogHTML({ initialTab: 'explain', initialExplain: lines.join('\n') })));
  await p.waitForTimeout(300);
  const ex = await p.evaluate(() => Array.from(document.querySelectorAll('.gref-exline')).map(el => el.textContent));
  const L = (i) => ex[i] || '';
  check('explain lines rendered', ex.length === lines.length, ex.length);
  check('explain: G43 blocked banner', /Grbl 1\.1 can.t run G43/.test(L(0)), L(0).slice(0, 200));
  check('explain: M62 blocked', /can.t run M62/.test(L(1)), L(1).slice(0, 200));
  check('explain: pause recognized', /Operator Pause Dialog/.test(L(2)) && /title "Dust shoe"/.test(L(2)), L(2).slice(0, 300));
  check('explain: dust param recognized, no invalid', /Dust Boot State/.test(L(4)) && !/not valid G-code|does not appear/.test(L(4)), L(4).slice(0, 300));
  check('explain: assignment w/ expression no invalid', !/not valid G-code|does not appear/.test(L(5)), L(5).slice(0, 300));
  check('explain: $Config/Dump', /Show running config/.test(L(6)) && /FluidNC only/.test(L(6)), L(6).slice(0, 300));
  check('explain: $MEASURE_TLO', /Load and Measure a Tool/.test(L(7)), L(7).slice(0, 200));
  check('explain: M7.1 blocked on grbl', /can.t run M7\.1/.test(L(8)), L(8).slice(0, 200));
  check('explain: M6 ncs note', /Grbl 1\.1: Grbl has no tool change/.test(L(9)) && !/can.t run/.test(L(9)), L(9).slice(0, 300));
  check('explain: PRINT recognized + blocked on grbl', /Print Values Comment/.test(L(10)) && /can.t run \(PRINT\)/.test(L(10)), L(10).slice(0, 300));
  check('explain: plain line clean', !/can.t run|not valid/.test(L(11)), L(11).slice(0, 200));
  await p.screenshot({ path: require('path').join(OUT, 'grbl-explain.png'), fullPage: false });
  check('explain: no page errors', p._errors.length === 0, p._errors.join(' | '));
  await p.close();

  await browser.close(); server.close();
  console.log(failures ? failures + ' FAILED' : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})();
