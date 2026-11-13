// commands.js under a stand-in pro-v2 host (no browser): showDialogAsync vs showDialog, console
// lookups ?word / ??line / ??, closing, and the dialog rendered into a fake DOM.
// Run: node test/async.mjs
import { readFileSync } from 'fs';
import vm from 'vm';
import { fileURLToPath } from 'url';
const ROOT = process.argv[2] || fileURLToPath(new URL('..', import.meta.url));
const src = readFileSync(ROOT + '/commands.js', 'utf8').replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  ', m); };

function host(ctx) { const sb = { pluginContext: ctx }; vm.createContext(sb); new vm.Script(src).runInContext(sb); return sb; }
const cmd = (text, src = 'client') => [{ command: text, isOriginal: true, meta: { sourceId: src } }];
const ON = { terminalLookup: true };

// 1. new host: async path, showDialog never touched
{
  const calls = []; let n = 0;
  const sb = host({ log(){}, showDialog(){ calls.push(['sync']); },
    showDialogAsync(t, h, o, cb) { calls.push(['async', t, h, o, cb]); return 'dlg' + (++n); },
    closeDialog(id) { calls.push(['close', id]); } });
  const c1 = cmd('?dwell');
  const r1 = sb.onBeforeCommand(c1, { sourceId: 'client' }, ON);
  ok(calls.length === 1 && calls[0][0] === 'async', 'new host: showDialogAsync used, showDialog not');
  ok(calls[0][1] === 'G-code Explorer' && calls[0][3].size === 'large' && calls[0][3].closable === true, 'title + large/closable options passed');
  ok(calls[0][2].includes('"initialQuery":"dwell"'), 'lookup payload carries the query');
  ok(calls[0][4] === undefined, 'no callback passed (nothing to wait for)');
  ok(r1 === c1 && c1[0].command === '(GCODE-REF)' && c1[0].meta.silent === true, 'typed text neutralized + silent');
  sb.onBeforeCommand(cmd('??G1 X10 F500'), { sourceId: 'client' }, ON);
  ok(calls[1][0] === 'close' && calls[1][1] === 'dlg1' && calls[2][0] === 'async', 'second lookup closes the previous dialog first');
  ok(calls[2][2].includes('"initialExplain":"G1 X10 F500"'), '?? payload carries the line');
  sb.onBeforeCommand(cmd('??'), { sourceId: 'client' }, ON);
  ok(calls[3][1] === 'dlg2', 'then closes the second');
}
// 2. older host: blocking fallback
{
  const calls = [];
  const sb = host({ log(){}, showDialog(t, h, o) { calls.push(['sync', t, o]); } });
  const c = cmd('?$110');
  sb.onBeforeCommand(c, { sourceId: 'client' }, ON);
  ok(calls.length === 1 && calls[0][0] === 'sync' && calls[0][2].size === 'large', 'old host: falls back to showDialog');
  ok(c[0].command === '(GCODE-REF)', 'old host: still neutralized');
}
// 3. host throws: fail open, text still never reaches the controller
{
  const logs = [];
  const sb = host({ log(m){ logs.push(m); }, showDialogAsync(){ throw new Error('boom'); }, closeDialog(){} });
  const c = cmd('?probe');
  const r = sb.onBeforeCommand(c, { sourceId: 'client' }, ON);
  ok(r === c && c[0].command === '(GCODE-REF)' && logs.some(l => /boom/.test(l)), 'dialog error: logged, command still neutralized, chain intact');
}
// 4. things that must never be intercepted
{
  const calls = [];
  const sb = host({ log(){}, showDialogAsync(){ calls.push(1); return 'x'; }, closeDialog(){} });
  const job = cmd('?dwell', 'job'); sb.onBeforeCommand(job, { sourceId: 'job' }, ON);
  const bare = cmd('?'); sb.onBeforeCommand(bare, { sourceId: 'client' }, ON);
  const off = cmd('?dwell'); sb.onBeforeCommand(off, { sourceId: 'client' }, { terminalLookup: false });
  const gc = cmd('G0 X0'); sb.onBeforeCommand(gc, { sourceId: 'client' }, ON);
  ok(calls.length === 0 && job[0].command === '?dwell' && bare[0].command === '?' && off[0].command === '?dwell' && gc[0].command === 'G0 X0',
     'job lines, bare ?, lookups-off, and normal G-code untouched');
}
// 5. the dialog it opens still works (lookup + explain render)
{
  let html = null;
  const sb = host({ log(){}, showDialogAsync(t, h){ html = h; return 'd'; }, closeDialog(){} });
  function render(h) {
    const m = h.match(/<script>([\s\S]*)<\/script>/); const els = {};
    const mk = id => ({ id, innerHTML:'', value:'', style:{display:''}, classList:{toggle(){},add(){},remove(){}}, addEventListener(){}, appendChild(){}, focus(){}, scrollIntoView(){}, getAttribute(){return null;}, insertAdjacentHTML(p, x){this.innerHTML += x;}, getBoundingClientRect(){return {left:0,width:1000};}, contains(){return true;}, querySelector(){return null;} });
    const doc = { getElementById: id => els[id] || (els[id] = mk(id)), createElement: t => ({ tag:t, style:{} }), body: { appendChild(){} }, addEventListener(){} };
    const ctx = { document: doc, window: { dispatchEvent(){}, addEventListener(){} }, setTimeout:(f)=>{f();return 0;}, clearTimeout(){}, setInterval:()=>0, history:{ length:1, back(){}, forward(){} }, CustomEvent:function(){}, JSON, parseInt, Math, isNaN, parseFloat, String, Array, Event: function(){},
      fetch: () => Promise.resolve({ ok:false, json:() => Promise.resolve({}), text:() => Promise.resolve('') }) };
    vm.createContext(ctx); new vm.Script(m[1]).runInContext(ctx); return (els['gref-reflist'] ? els['gref-reflist'].innerHTML : '') + els['gref-body'].innerHTML;
  }
  sb.onBeforeCommand(cmd('?dwell'), { sourceId: 'client' }, ON);
  ok(render(html).includes('G4'), 'rendered lookup shows G4 for ?dwell');
  sb.onBeforeCommand(cmd('??G1 X10 F500'), { sourceId: 'client' }, ON);
  ok(render(html).includes('Linear Interpolation'), 'rendered ?? explains G1');
  ok(html.includes('2.0.191 and later'), 'settings hint updated');
  ok(html.includes('gref-man-back') && /BUILD_ID = '\d+\.\d+\.\d+-[0-9a-f]{12}'/.test(html), 'dialog has manual nav + build id');
}
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
process.exit(fails ? 1 : 0);
