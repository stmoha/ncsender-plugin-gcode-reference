/* ================================================================
 * Terminal interception
 *
 * ncSender runs this file in an embedded Jint (.NET) JS engine:
 *   - no import/require - everything must live in this one file
 *   - handlers must be plain `function` declarations (the host looks
 *     them up as globals via GetValue)
 *   - `pluginContext` global provides log() and showDialog()
 *   - buildInitialConfig(raw) is REQUIRED - the host evaluates it at
 *     load time to sanitize saved settings
 *
 * onBeforeCommand fires for every command before it reaches the
 * controller. We only touch ORIGINAL commands typed in the Console
 * (sourceId === 'client'), so jobs and macros are never affected.
 *
 *   ?keyword   -> documentation lookup dialog (?dwell, ?$110, ?G38.2)
 *   ??<line>   -> word-by-word explanation of a G-code line
 *   bare ?     -> untouched (grblHAL real-time status query)
 *
 * Intercepted text is NEVER sent to grblHAL: the command is replaced
 * with a harmless parenthesis comment marked silent, so the controller
 * just answers "ok" and nothing appears in the terminal.
 *
 * NOTE: ncSender plugin dialogs are modal - showDialog() blocks the
 * plugin engine until the dialog is closed. Close the reference to
 * resume normal command flow; avoid lookups while a job is streaming.
 * ================================================================ */

/** Sanitize persisted settings (required by the plugin host). */
function buildInitialConfig(raw) {
  if (!raw) raw = {};
  return {
    terminalLookup: raw.terminalLookup === undefined ? true : raw.terminalLookup !== false && raw.terminalLookup !== 'false'
  };
}

/** Build the self-contained dialog HTML with the data payload injected. */
function buildDialogHTML(opts) {
  var payload = {
    gcodes: GCODE_DB,
    settings: SETTINGS_DB,
    system: SYSTEM_DB,
    letters: LETTER_DB,
    initialTab: opts.initialTab || 'reference',
    initialQuery: opts.initialQuery || '',
    initialExplain: opts.initialExplain || '',
    showSettingsTab: true
  };
  // split/join (not String.replace) so '$' sequences in the JSON - like
  // the "$$" entry - are never treated as replacement patterns, and
  // escape '</' so the payload can't terminate the <script> tag.
  var json = JSON.stringify(payload).split('</').join('<\\/');
  return DIALOG_TEMPLATE.split('@@PAYLOAD@@').join(json);
}

/** Main hook: intercept ?keyword and ??line typed in the Console. */
function onBeforeCommand(commands, context, settings) {
  try {
    if (!settings || settings.terminalLookup === false) return commands;
    if (!context || context.sourceId !== 'client') return commands;

    for (var i = 0; i < commands.length; i++) {
      var cmd = commands[i];
      if (!cmd || !cmd.isOriginal || typeof cmd.command !== 'string') continue;

      var raw = cmd.command.trim();

      // "??"              -> open the reference blank (no filter/query)
      // "??<gcode line>"  -> explain word by word
      // "?<keyword>"      -> documentation lookup
      // bare "?" (real-time status query) never matches below
      var isBlank = /^\?\?\s*$/.test(raw);
      var explainMatch = isBlank ? null : raw.match(/^\?\?\s*(\S.*)$/);
      var lookupMatch = (isBlank || explainMatch) ? null : raw.match(/^\?\s*(\S.*)$/);
      if (!isBlank && !explainMatch && !lookupMatch) continue;

      // Neutralize FIRST so the typed text can't reach grblHAL even if
      // the dialog fails: a parenthesis comment is a valid no-op line
      // (controller replies "ok") and meta.silent hides it.
      var prevSourceId = cmd.meta && cmd.meta.sourceId ? cmd.meta.sourceId : null;
      cmd.command = '(GCODE-REF)';
      cmd.displayCommand = null;
      cmd.meta = { silent: true, sourceId: prevSourceId };

      var title, html;
      if (isBlank) {
        title = 'G-code Reference';
        html = buildDialogHTML({
          initialTab: 'reference'
        });
      } else if (explainMatch) {
        title = 'G-code Reference - Explain';
        html = buildDialogHTML({
          initialTab: 'explain',
          initialExplain: explainMatch[1]
        });
      } else {
        title = 'G-code Reference';
        html = buildDialogHTML({
          initialTab: 'reference',
          initialQuery: lookupMatch[1]
        });
      }

      try {
        // Blocks until the user closes the dialog (host behavior).
        pluginContext.showDialog(title, html, { size: 'large', closable: true });
      } catch (dlgErr) {
        try { pluginContext.log('gcode-reference: showDialog failed: ' + dlgErr); } catch (ignored) {}
      }
    }

    return commands; // ALWAYS return the array (modified or not)
  } catch (err) {
    try { pluginContext.log('gcode-reference: onBeforeCommand error: ' + err); } catch (ignored) {}
    return commands; // fail open - never break the command chain
  }
}

export { onBeforeCommand, buildInitialConfig };
