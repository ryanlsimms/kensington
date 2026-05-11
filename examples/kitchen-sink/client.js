import './components/sortable-list.js';

import { registerComponents } from 'kensington';

import { dashboard } from './components/dashboard.js';
import { taskSpotlight } from './components/task-spotlight.js';

registerComponents({ dashboard, taskSpotlight });

const loadBtn = document.getElementById('spotlight-load');
const container = document.getElementById('spotlight-container');
if (loadBtn && container) {
  loadBtn.addEventListener('click', async () => {
    const res = await fetch('/api/spotlight');
    container.innerHTML = await res.text();
  });
}
