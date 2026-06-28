import { t } from 'kensington';

import { code } from '../../components/ui.js';

export function reactivityLiveSignalsIntro() {
  return t.section({ id: 'signals-live' }, [
    t.h2('Live signals'),
    t.p([
      'A live signal is a signal whose value is shared by name across every connected browser ',
      t.em('and'),
      ' the server. Reads from any tab reflect writes from any other tab. Reads on the server see the same value. The API is the same as ',
      t.code('signal()'),
      '.',
    ]),
    t.p([
      'A shared file declares the signal once and exports it through a helper. Both the SSR component and the server-side observer call the helper, so the name and initial value live in one place.',
    ]),
    code('javascript', `// shared/viewers.js
import { t } from 'kensington';
import { liveSignal } from 'kensington/live';

export const viewerCount = () => liveSignal(0, 'home:viewers');

export function viewers() {
  const count = viewerCount();
  return t.div([
    t.span([count, ' people viewing. ']),
    t.button({ onclick: () => count.set(n => n + 1) }, 'I am here'),
  ]);
}`),
    t.p([
      'The server wires up the live transport, serves the SSR markup for the component, and can read the same signal to react to client writes.',
    ]),
    code('javascript', `// server.js
import http from 'node:http';
import express from 'express';
import { effect, renderForHydration } from 'kensington';
import { liveServer } from 'kensington/live';
import { viewerCount, viewers } from './shared/viewers.js';

const app = express();
app.use(express.static('public')); // serves /client.js and other assets

app.get('/', (req, res) => {
  res.type('html').send(\`<!doctype html>
<script type="module" src="/client.js"></script>
\${renderForHydration(viewers, {})}\`);
});

const httpServer = http.createServer(app);
const live = await liveServer();
await live.attach(httpServer);

// The server sees the same value. Each client write fires this effect.
effect(() => console.log('viewers:', viewerCount().get()));

httpServer.listen(3000);`),
    t.p('The client opens the WebSocket and hydrates the shared component.'),
    code('javascript', `// client.js
import { registerComponents } from 'kensington';
import { connectLive } from 'kensington/live';
import { viewers } from './shared/viewers.js';

connectLive();
registerComponents({ viewers });`),
    t.p([
      'Persistence, permissions, and writes that need to converge across concurrent clients are covered in ',
      t.a({ href: '#live-signals' }, 'live signals'),
      ' under Advanced.',
    ]),
  ]);
}
