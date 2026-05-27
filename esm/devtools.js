import { enableDevtools } from './lib/reactive/devtools.js';
import { buildPanel, PANEL_ID } from './lib/reactive/devtools-panel.js';

enableDevtools();

if (!document.getElementById(PANEL_ID)) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => buildPanel(window.__KENSINGTON_DEVTOOLS__), { once: true });
  } else {
    buildPanel(window.__KENSINGTON_DEVTOOLS__);
  }
}
