import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { renderForHydration } from 'kensington';

import { dashboard } from './components/dashboard.js';
import { taskSpotlight } from './components/task-spotlight.js';
import { layout } from './layout.js';
import t from './template-engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const tasks = [
  { id: 't1', text: 'Read the Kensington docs', done: true },
  { id: 't2', text: 'Build a reactive UI', done: false },
  { id: 't3', text: 'Try the filter buttons', done: false },
  { id: 't4', text: 'Add a task of your own', done: false },
];

const app = express();

app.use('/dist', express.static(path.join(projectRoot, 'dist')));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  const spotlightSection = t.div({ class: 'spotlight-section' }, [
    t.h2('Task Spotlight'),
    t.p({ class: 'spotlight-hint' },
      'Fetches a server-rendered fragment — the MutationObserver hydrates it automatically.',
    ),
    t.button({ type: 'button', id: 'spotlight-load', class: 'load-btn' }, 'Load random task'),
    t.div({ id: 'spotlight-container' }),
  ]);

  const page = [
    t.literal('<p class="intro">Kensington <strong>kitchen sink</strong>: SSR with <em>reactive</em> hydration.'),
    // renderForHydration renders the component as an HTML string and embeds the props
    // in a <script type="application/json"> block so the client can hydrate it.
    // The component function runs in SSR mode: signals resolve to their initial values,
    // effects are skipped entirely (no DOM, no subscriptions).
    renderForHydration(dashboard, { tasks }),
    spotlightSection,
  ];

  return res.send(layout(page).toString());
});

app.get('/api/spotlight', (req, res) => {
  const task = tasks[Math.floor(Math.random() * tasks.length)];
  // Dynamically loaded fragments work the same way. registerComponents() sets up a
  // MutationObserver so this fragment is hydrated as soon as it lands in the DOM.
  res.send(renderForHydration(taskSpotlight, { task }).toString());
});

app.listen(3001, () => {
  console.log('http://localhost:3001');
});
