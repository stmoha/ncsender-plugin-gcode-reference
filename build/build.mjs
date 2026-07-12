/**
 * Build script for the G-code Reference ncSender plugin.
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
const db = await import(join(root, 'gcode-database.js'));

const dialogCore = readFileSync(join(root, 'build/dialog-core.html'), 'utf8');
const logic = readFileSync(join(root, 'build/commands-logic.js'), 'utf8');
const configTemplate = readFileSync(join(root, 'build/config-template.html'), 'utf8');

// Escape '</' so embedded JSON can never terminate a <script> block.
const safeJson = (v) => JSON.stringify(v).split('</').join('<\\/');

// ---------- commands.js ----------
const header = `/**
 * G-code & grblHAL Reference - ncSender plugin (commands file)
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
