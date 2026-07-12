/**
 * G-code & grblHAL Reference - ncSender plugin
 * Entry for the Node-based ncSender platforms (v1 / pro-v1).
 *
 * The plugin's actual logic lives in commands.js, which is written to
 * run inside the pro-v2 (C#) embedded JS engine where a global
 * `pluginContext` is injected. This wrapper adapts the v1 `ctx` API to
 * that contract so both platforms share one implementation.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { onBeforeCommand, buildInitialConfig } from './commands.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const resolveServerPort = (appSettings = {}) => {
  const appPort = Number.parseInt(appSettings?.senderPort, 10);
  return Number.isFinite(appPort) ? appPort : 8090;
};

export async function onLoad(ctx) {
  ctx.log('G-code & grblHAL Reference plugin loaded');

  // commands.js expects the pro-v2 global; adapt the v1 ctx to it.
  globalThis.pluginContext = {
    log: (...args) => ctx.log(...args),
    showDialog: (title, html, options) => ctx.showDialog(title, html, options),
    getTools: () => (typeof ctx.getTools === 'function' ? ctx.getTools() : [])
  };

  ctx.registerEventHandler('onBeforeCommand', async (commands, context) => {
    const settings = buildInitialConfig(ctx.getSettings() || {});
    return onBeforeCommand(commands, context, settings);
  });

  ctx.registerToolMenu('G-code Reference', async () => {
    const appSettings = typeof ctx.getAppSettings === 'function' ? (ctx.getAppSettings() || {}) : {};
    let html = readFileSync(join(__dirname, 'config.html'), 'utf-8');
    // split/join = replace ALL occurrences, matching the pro-v2 server's behavior
    html = html
      .split('__TOOL_MENU_LABEL__').join('G-code Reference')
      .split('__SERVER_PORT__').join(String(resolveServerPort(appSettings)));
    ctx.showDialog('G-code Reference', html, { closable: true });
  }, { icon: 'icon.png' });
}

export function onUnload() {
  console.log('[PLUGIN:com.cncdocs.gcode-reference] G-code & grblHAL Reference plugin unloaded');
}
