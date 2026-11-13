// One live instance across opens (state, scroll, build swap), dismiss only on press+release outside, NC Manual back/forward/home, category column, search clear
// Run: node test/e2e-persist.cjs   (needs Playwright with Chromium; screenshots go to test/out/)
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
  if (req.url === '/api/settings') return j({ unitsPreference: 'metric', safeZHeight: -5 });
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
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
  await ctx.route('https://siganberg.github.io/**', route => {
    const u = route.request().url();
    const body = /page2\/?$/.test(u) ? MAN('Page 2', '<a id="to3" href="../page3/">to page 3</a> <a id="anchor" href="#sec">section</a>')
      : /page3\/?$/.test(u) ? MAN('Page 3', '')
      : MAN('Manual home', '<a id="to2" href="page2/">to page 2</a>');
    route.fulfill({ status: 200, contentType: 'text/html', body });
  });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', e => errors.push(String(e)));
  await p.goto(base);
  const topUrl = p.url();
  const open = async (html) => { await p.evaluate(h => openDlg(h), html); await p.waitForTimeout(400); };
  const closeX = async () => { await p.click('#xbtn'); await p.waitForTimeout(150); };

  // ---- first open (Tools menu) ----
  await open(cfg);
  const rootId1 = await p.evaluate(() => { window.__r1 = document.getElementById('gref-root'); return !!window.__gcodeExplorer; });
  check('instance registered', rootId1, rootId1);
  await p.fill('#gref-search', 'probe'); await p.waitForTimeout(100);
  await p.evaluate(() => { document.getElementById('gref-reflist').scrollTop = 400; }); await p.waitForTimeout(150);
  // G-code tab: paste code and scroll it
  await p.evaluate(() => grefSwitchTab('explain')); await p.waitForTimeout(150);
  await p.evaluate(() => grefSetSrc('paste')); await p.waitForTimeout(100);
  await p.fill('#gref-paste', Array.from({ length: 200 }, (_, i) => 'G1 X' + i + ' F500').join('\n')); await p.waitForTimeout(300);
  await p.evaluate(() => { var el = document.getElementById('gref-exout'); if (el) el.scrollTop = 600; }); await p.waitForTimeout(150);
  const exScroll = await p.evaluate(() => document.getElementById('gref-exout').scrollTop);
  // back to Reference: query and scroll still there
  await p.evaluate(() => grefSwitchTab('reference')); await p.waitForTimeout(200);
  let r = await p.evaluate(() => ({ q: document.getElementById('gref-search').value, top: document.getElementById('gref-reflist').scrollTop }));
  check('tab switch keeps reference search + scroll', r.q === 'probe' && r.top === 400, r);
  await p.evaluate(() => grefSwitchTab('explain')); await p.waitForTimeout(200);
  r = await p.evaluate(() => ({ paste: document.getElementById('gref-paste').value.split('\n').length, top: document.getElementById('gref-exout').scrollTop }));
  check('tab switch keeps pasted code + scroll', r.paste === 200 && r.top === exScroll && exScroll > 0, [r, exScroll]);

  // ---- Explorer: select a line ----
  await p.evaluate(() => grefSwitchTab('navigator')); await p.waitForTimeout(1500);
  await p.fill('#gn-line-input', '50'); await p.press('#gn-line-input', 'Enter'); await p.waitForTimeout(300);
  const g1 = await p.textContent('#gn-an-gcode');

  // ---- manual: navigate, then back/forward ----
  await p.evaluate(() => grefSwitchTab('manual')); await p.waitForTimeout(800);
  const fr = () => p.frameLocator('#gref-manual-frame');
  const btn = () => p.evaluate(() => ({ back: !document.getElementById('gref-man-back').disabled, fwd: !document.getElementById('gref-man-fwd').disabled }));
  check('manual: nothing to go back to at first', JSON.stringify(await btn()) === '{"back":false,"fwd":false}', await btn());
  await fr().locator('#to2').click(); await p.waitForTimeout(700);
  await fr().locator('#to3').click(); await p.waitForTimeout(700);
  check('manual: on page 3, back enabled', (await fr().locator('h1').textContent()) === 'Page 3' && (await btn()).back, await btn());
  await p.click('#gref-man-back'); await p.waitForTimeout(700);
  check('manual: back -> page 2', (await fr().locator('h1').textContent()) === 'Page 2' && (await btn()).fwd, await btn());
  await p.click('#gref-man-fwd'); await p.waitForTimeout(700);
  check('manual: forward -> page 3', (await fr().locator('h1').textContent()) === 'Page 3', await fr().locator('h1').textContent());
  await p.click('#gref-man-back'); await p.waitForTimeout(40); await p.click('#gref-man-back'); await p.waitForTimeout(1500); // quick double Back
  check('manual: back twice -> home, back disabled', (await fr().locator('h1').textContent()) === 'Manual home' && !(await btn()).back, await btn());
  await p.click('#gref-man-back', { force: true }).catch(() => {}); await p.waitForTimeout(500);
  check('manual: extra back never leaves ncSender', p.url() === topUrl, p.url());
  await fr().locator('#to2').click(); await p.waitForTimeout(700);
  await fr().locator('#anchor').click(); await p.waitForTimeout(700);
  check('manual: #anchor step counted', (await btn()).back, await btn());

  // ---- close with X, reopen from the Tools menu ----
  const callsBefore = stateCalls;
  await closeX();
  check('closed: dialog gone, root kept in holder', await p.evaluate(() => !document.querySelector('.plugin-dialog-backdrop') && document.getElementById('gex-holder').contains(window.__r1)), null);
  await p.waitForTimeout(1200);
  check('closed: Explorer stops polling', stateCalls - callsBefore <= 1, stateCalls - callsBefore);
  await open(cfg);
  r = await p.evaluate(() => ({ same: document.getElementById('gref-root') === window.__r1, roots: document.querySelectorAll('#gref-root').length,
    inDialog: !!window.__r1.closest('.plugin-dialog-content') }));
  check('reopen: same root back in the new dialog, one copy', r.same && r.roots === 1 && r.inDialog, r);
  check('reopen: still on the manual tab, same page', (await p.evaluate(() => document.getElementById('gref-manual').style.display)) === 'flex' &&
    (await fr().locator('h1').textContent()) === 'Page 2', await fr().locator('h1').textContent());
  check('reopen: manual back still works', (await btn()).back, await btn());
  await p.evaluate(() => grefSwitchTab('navigator')); await p.waitForTimeout(500);
  check('reopen: Explorer kept its selected line', (await p.textContent('#gn-an-gcode')) === g1, [g1, await p.textContent('#gn-an-gcode')]);
  await p.evaluate(() => grefSwitchTab('reference')); await p.waitForTimeout(200);
  r = await p.evaluate(() => ({ q: document.getElementById('gref-search').value, top: document.getElementById('gref-reflist').scrollTop }));
  check('reopen: reference search + scroll kept', r.q === 'probe' && r.top === 400, r);

  // ---- Escape closes, terminal ?G38.2 reopens on the lookup ----
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  await open(buildDialogHTML({ initialTab: 'reference', initialQuery: 'G38.2' }));
  r = await p.evaluate(() => ({ same: document.getElementById('gref-root') === window.__r1, q: document.getElementById('gref-search').value,
    first: document.querySelector('.gref-card') && document.querySelector('.gref-card').getAttribute('data-code') }));
  check('?G38.2 after Escape: same instance, shows the lookup', r.same && r.q === 'G38.2' && r.first === 'G38.2', r);
  // ---- ?? (blank) clears the search; ??line opens the G-code tab ----
  await closeX(); await open(buildDialogHTML({ initialTab: 'reference', entry: 'blank' }));
  check('?? clears the search', (await p.inputValue('#gref-search')) === '', await p.inputValue('#gref-search'));
  await closeX(); await open(buildDialogHTML({ initialTab: 'explain', initialExplain: 'G0 X1 Y2' }));
  r = await p.evaluate(() => ({ tab: document.getElementById('gref-paste') && document.getElementById('gref-paste').value }));
  check('??G0 X1 Y2 opens the G-code tab with that line', r.tab === 'G0 X1 Y2', r);
  // ---- backdrop click closes; a lookup that replaces an open dialog (no rescue) still adopts ----
  await p.evaluate(() => { var bd = document.querySelector('.plugin-dialog-backdrop'); bd.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await p.waitForTimeout(150);
  check('backdrop click: root rescued', await p.evaluate(() => document.getElementById('gex-holder').contains(window.__r1)), null);
  await open(cfg);
  await p.evaluate(h => { document.querySelector('.plugin-dialog-backdrop').remove(); openDlg(h); }, buildDialogHTML({ initialTab: 'reference', initialQuery: 'dwell' }));
  await p.waitForTimeout(400);
  r = await p.evaluate(() => ({ same: document.getElementById('gref-root') === window.__r1, q: document.getElementById('gref-search').value, roots: document.querySelectorAll('#gref-root').length }));
  check('replaced without warning: re-adopted', r.same && r.q === 'dwell' && r.roots === 1, r);

  // ---- a different build starts fresh and retires the old copy ----
  await closeX();
  await open(cfg.replace(/BUILD_ID = '[^']+'/, "BUILD_ID = 'other-build'"));
  r = await p.evaluate(() => ({ fresh: document.getElementById('gref-root') !== window.__r1, oldGone: !window.__r1.isConnected, build: window.__gcodeExplorer.build }));
  check('new build: fresh instance, old one removed', r.fresh && r.oldGone && r.build === 'other-build', r);
  // ---- clear-search button ----
  await closeX(); await open(buildDialogHTML({ initialTab: 'reference', initialQuery: 'spindle' }));
  r = await p.evaluate(() => ({ shown: getComputedStyle(document.getElementById('gref-search-clear')).display !== 'none',
    n: document.querySelectorAll('.gref-card').length }));
  await p.click('#gref-search-clear'); await p.waitForTimeout(150);
  const r2 = await p.evaluate(() => ({ q: document.getElementById('gref-search').value, hidden: getComputedStyle(document.getElementById('gref-search-clear')).display === 'none',
    n: document.querySelectorAll('.gref-card').length, focus: document.activeElement && document.activeElement.id }));
  check('clear button: shown with text, one click resets to the full list', r.shown && r2.q === '' && r2.hidden && r2.n > r.n * 5 && r2.focus === 'gref-search', [r, r2]);
  await p.fill('#gref-search', 'g0'); await p.waitForTimeout(100);
  check('clear button reappears when typing', await p.evaluate(() => getComputedStyle(document.getElementById('gref-search-clear')).display !== 'none'), null);
  await p.screenshot({ path: require('path').join(OUT, 'search-clear.png'), clip: { x: 0, y: 80, width: 1300, height: 200 } });
  // host button CSS must not swallow the icons
  await p.evaluate(() => grefSwitchTab('manual')); await p.waitForTimeout(300);
  const measure = (ids) => p.evaluate((ids) => ids.map(id => {
    const b = document.getElementById(id), svg = b.querySelector('svg'), cs = getComputedStyle(b);
    return { id, bg: cs.backgroundColor, pad: cs.paddingLeft, svgW: svg.getBoundingClientRect().width };
  }), ids);
  let look = await measure(['gref-man-back', 'gref-man-fwd', 'gref-man-home']);
  await p.screenshot({ path: require('path').join(OUT, 'manual-nav-host.png'), clip: { x: 0, y: 60, width: 900, height: 220 } });
  await p.evaluate(() => grefSwitchTab('reference')); await p.fill('#gref-search', 'test'); await p.waitForTimeout(150);
  look = look.concat(await measure(['gref-search-clear']));
  await p.screenshot({ path: require('path').join(OUT, 'search-clear-host.png'), clip: { x: 0, y: 60, width: 900, height: 220 } });
  check('buttons keep their own look under ncSender CSS', look.every(l => l.pad === '0px' && l.bg !== 'rgb(26, 188, 156)' && l.svgW >= 13), look);
  // ---- category column ----
  await p.fill('#gref-search', 'probe'); await p.waitForTimeout(150);
  const nav = await p.evaluate(() => Array.from(document.querySelectorAll('#gref-catnav .gref-cat')).map(b => ({
    label: b.querySelector('.gref-cat-label').textContent, n: +b.querySelector('.gref-cat-n').textContent, active: b.hasAttribute('data-active'),
    left: b.getBoundingClientRect().left })));
  const cards = await p.evaluate(() => document.querySelectorAll('#gref-reflist .gref-card').length);
  const sameColumn = nav.every(x => Math.abs(x.left - nav[0].left) < 1);
  const probing = nav.find(x => x.label === 'Probing');
  check('category column: one column, counts per category, All active', nav.length === 14 && sameColumn && nav[0].active && nav[0].n === cards && probing.n > 0, { nav: nav.slice(0, 5), cards });
  await p.click('#gref-catnav .gref-cat:nth-child(4)'); await p.waitForTimeout(150); // Probing
  const after = await p.evaluate(() => ({ active: document.querySelector('#gref-catnav [data-active] .gref-cat-label').textContent,
    cats: Array.from(document.querySelectorAll('#gref-reflist .gref-card .gref-badge')).map(b => b.textContent).filter(t => /probing/i.test(t)).length,
    n: document.querySelectorAll('#gref-reflist .gref-card').length, q: document.getElementById('gref-search').value }));
  check('category click filters, keeps the search', after.active === 'Probing' && after.n === probing.n && after.q === 'probe', [after, probing]);
  await p.screenshot({ path: require('path').join(OUT, 'catnav-host.png'), clip: { x: 0, y: 60, width: 1500, height: 560 } });
  await p.evaluate(() => grefSetCategory('all'));
  // ---- dismiss only on press AND release outside ----
  const isOpen = () => p.evaluate(() => !!document.querySelector('.plugin-dialog-backdrop'));
  const sb = await p.locator('#gref-search').boundingBox();
  await p.mouse.move(sb.x + 20, sb.y + 10); await p.mouse.down(); await p.mouse.move(8, 8, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(200);
  check('drag from inside to outside does NOT close', await isOpen(), null);
  await p.mouse.move(8, 8); await p.mouse.down(); await p.mouse.move(sb.x + 20, sb.y + 10, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(200);
  check('press outside, release inside does NOT close', await isOpen(), null);
  await p.evaluate(() => { window.__r2 = document.getElementById('gref-root'); });
  await p.mouse.click(8, 8); await p.waitForTimeout(250);
  const closed = !(await isOpen()), kept = await p.evaluate(() => document.getElementById('gex-holder').contains(window.__r2));
  check('press + release outside closes (and keeps state)', closed && kept, { closed, kept });
  await open(cfg);
  check('no page errors', errors.length === 0, errors);
  await b.close(); server.close();
  console.log(failures ? failures + ' FAILED' : 'ALL PASSED');
  process.exitCode = failures ? 1 : 0;
})();
