import { buildPanel, PANEL_ID } from './lib/reactive/devtools-panel.js';

const POLL_INTERVAL = 150;

function run() {
  if (document.getElementById(PANEL_ID)) { return; }
  if (window.__KENSINGTON_DEVTOOLS__) {
    buildPanel(window.__KENSINGTON_DEVTOOLS__);
  } else {
    const timer = setInterval(() => {
      if (window.__KENSINGTON_DEVTOOLS__) {
        clearInterval(timer);
        buildPanel(window.__KENSINGTON_DEVTOOLS__);
      }
    }, POLL_INTERVAL);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run, { once: true });
} else {
  run();
}
