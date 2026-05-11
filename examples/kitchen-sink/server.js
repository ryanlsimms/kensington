import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { renderForHydration } from 'kensington';

import { dashboard } from './components/dashboard.js';
import { layout } from './layout.js';
import t from './template-engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const app = express();

app.use('/dist', express.static(path.join(projectRoot, 'dist')));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  const tasks = [
    { id: 't1', text: 'Read the Kensington docs', done: true },
    { id: 't2', text: 'Build a reactive UI', done: false },
    { id: 't3', text: 'Try the filter buttons', done: false },
    { id: 't4', text: 'Add a task of your own', done: false },
  ];

  const page = [
    t.literal('<p class="intro">Kensington <strong>kitchen sink</strong>: SSR with <em>reactive</em> hydration.'),
    renderForHydration(dashboard, { tasks }),
  ];

  return res.send(layout(page).toString());
});

app.listen(3001, () => {
  console.log('http://localhost:3001');
});
