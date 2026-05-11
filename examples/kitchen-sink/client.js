import './components/sortable-list.js';

import { registerComponents } from 'kensington';

import { dashboard } from './components/dashboard.js';
import { taskSpotlight } from './components/task-spotlight.js';

// registerComponents scans the DOM for <script type="application/json" data-k-component>
// blocks on DOMContentLoaded, then hydrates each one by calling the matching component
// function with the embedded props and replacing the SSR placeholder with a live DOM tree.
// It also sets up a MutationObserver so any fragments loaded after the initial page
// render (e.g. via fetch) are hydrated automatically without re-calling registerComponents.
// Call .stop() on the return value to disconnect the observer.
registerComponents({ dashboard, taskSpotlight });

const loadBtn = document.getElementById('spotlight-load');
const container = document.getElementById('spotlight-container');
if (loadBtn && container) {
  loadBtn.addEventListener('click', async () => {
    const res = await fetch('/api/spotlight');
    // Dropping the HTML into the DOM is all that's needed. The MutationObserver
    // in registerComponents detects the new <script> block and hydrates it.
    container.innerHTML = await res.text();
  });
}
