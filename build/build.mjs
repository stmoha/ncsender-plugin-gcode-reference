/**
 * Build script for the G-code Explorer ncSender plugin.
 * Assembles:
 *   commands.js  = database (as plain vars) + dialog template string + logic
 *                  (single Jint-compatible file, no imports)
 *   config.html  = settings form + reference UI with the database embedded
 *
 * Run: node build/build.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = await import(join(root, 'gcode-database.js'));

// Merge the controller tables into the entries so both outputs carry
// them: G/M/$ commands get `support`, numbered settings get `ctrl`.
const withSupport = (list) => list.map((e) => {
  const s = src.CONTROLLER_SUPPORT[e.code];
  return s ? { ...e, support: s } : e;
});
const withNotes = (list) => list.map((e) => {
  const n = src.SETTING_NOTES[e.code];
  return n ? { ...e, ctrl: n } : e;
});
const db = {
  GCODE_DB: withSupport(src.GCODE_DB),
  SYSTEM_DB: withSupport(src.SYSTEM_DB),
  SETTINGS_DB: withNotes(src.SETTINGS_DB),
  LETTER_DB: src.LETTER_DB
};
{
  const codes = new Set([...db.GCODE_DB, ...db.SYSTEM_DB].map((e) => e.code));
  const missing = [...codes].filter((c) => !src.CONTROLLER_SUPPORT[c]);
  if (missing.length) console.warn('note: no controller-support row for', missing.join(' '));
}

let dialogCore = readFileSync(join(root, 'build/dialog-core.html'), 'utf8');

// ---- merge the G-code Navigator panel (build/navigator-panel.html) ----
// The panel is a self-contained fragment: <style> + markup + one <script>
// IIFE. Markup (incl. styles) and script are embedded as JSON strings and
// injected lazily on first Navigator-tab activation (see gnActivate in
// dialog-core). __SERVER_PORT__ is a last-resort fallback only (the host
// bridge window.ncSender.getApiBaseUrl is preferred), so 8090 is safe.
{
  const panel = readFileSync(join(root, 'build/navigator-panel.html'), 'utf8');
  const scriptOpen = panel.indexOf('<script>');
  const scriptClose = panel.lastIndexOf('</' + 'script>');
  if (scriptOpen < 0 || scriptClose < 0) throw new Error('navigator-panel.html: script block not found');
  const navMarkup = panel.slice(0, scriptOpen);
  const navScript = panel.slice(scriptOpen + '<script>'.length, scriptClose)
    .replace('__SERVER_PORT__', '8090');
  const markupJson = JSON.stringify(navMarkup).split('</').join('<\\/');
  const scriptJson = JSON.stringify(navScript).split('</').join('<\\/');
  if (!dialogCore.includes("'__NAV_MARKUP__'") || !dialogCore.includes("'__NAV_SCRIPT__'"))
    throw new Error('dialog-core.html: NAV tokens missing');
  dialogCore = dialogCore
    .replace("'__NAV_MARKUP__'", markupJson)
    .replace("'__NAV_SCRIPT__'", scriptJson);
}
// Build id: a dialog only adopts the live instance left by an earlier
// open (see "one live instance" in dialog-core) when it is the same build.
{
  const { createHash } = await import('crypto');
  const version = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8')).version;
  const hash = createHash('sha1').update(dialogCore).update(JSON.stringify(db)).digest('hex').slice(0, 12);
  if (!dialogCore.includes('__BUILD_ID__')) throw new Error('dialog-core.html: __BUILD_ID__ token missing');
  dialogCore = dialogCore.split('__BUILD_ID__').join(version + '-' + hash);
}
const logic = readFileSync(join(root, 'build/commands-logic.js'), 'utf8');
const configTemplate = readFileSync(join(root, 'build/config-template.html'), 'utf8');

// Escape '</' so embedded JSON can never terminate a <script> block.
const safeJson = (v) => JSON.stringify(v).split('</').join('<\\/');

// ---------- commands.js ----------
const header = `/**
 * G-code Explorer - ncSender plugin (commands file)
 * ------------------------------------------------------------------
 * GENERATED FILE - edit gcode-database.js / build/*.js|html and re-run
 * \`node build/build.mjs\`. Runs inside ncSender's embedded Jint engine:
 * one self-contained file, function declarations, no imports.
 * ------------------------------------------------------------------
 */

/* ---------- documentation database (generated) ---------- */
var GCODE_DB = ${JSON.stringify(db.GCODE_DB)};
var SETTINGS_DB = ${JSON.stringify(db.SETTINGS_DB)};
var SYSTEM_DB = ${JSON.stringify(db.SYSTEM_DB)};
var LETTER_DB = ${JSON.stringify(db.LETTER_DB)};

/* ---------- dialog UI template (generated) ---------- */
var DIALOG_TEMPLATE = ${JSON.stringify(dialogCore)};

`;
writeFileSync(join(root, 'commands.js'), header + logic);

// ---------- config.html ----------
const payload = safeJson({
  gcodes: db.GCODE_DB,
  settings: db.SETTINGS_DB,
  system: db.SYSTEM_DB,
  letters: db.LETTER_DB,
  initialTab: 'reference',
  initialQuery: '',
  initialExplain: '',
  maxResults: 8,
  showSettingsTab: true
});
const referenceUi = dialogCore.split('@@PAYLOAD@@').join(payload);
const configHtml = configTemplate.split('@@REFERENCE_UI@@').join(referenceUi);
writeFileSync(join(root, 'config.html'), configHtml);

console.log('built commands.js (%d KB) and config.html (%d KB)',
  Math.round((header + logic).length / 1024), Math.round(configHtml.length / 1024));
