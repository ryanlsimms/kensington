import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import t, { renderForHydration } from '#kensington';

import { dashboard } from '../components/dashboard.js';
import { spotlightSection } from '../components/spotlight-section.js';
import { taskSpotlight } from '../components/task-spotlight.js';
import tasks from './data.json' with { type: 'json' };
import { layout } from './layout.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

const app = express();

app.use('/dist', express.static(path.join(projectRoot, 'dist')));
app.use('/esm', express.static(path.join(projectRoot, 'esm')));
app.use('/shared', express.static(path.join(__dirname, '../shared')));
app.use('/components', express.static(path.join(__dirname, '../components')));
app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  const page = [
    t.literal('<p class="intro">Kensington <strong>kitchen sink</strong>: SSR with <em>reactive</em> hydration.'),
    // renderForHydration renders the component as an HTML string and embeds the props
    // in a <script type="application/json"> block so the client can hydrate it.
    // The component function runs in SSR mode: signals resolve to their initial values,
    // effects are skipped entirely (no DOM, no subscriptions).
    renderForHydration(dashboard, { tasks }),
    spotlightSection(),
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
