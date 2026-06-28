import fs from 'node:fs';
import * as http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { liveServer } from '../../../esm/live/server.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const server = http.createServer((req, res) => {
  res.status = 200;
  try {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      return res.end('<!DOCTYPE html><html><head></head><body></body></html>');
    }
    if (req.url.endsWith('.html')) {
      const html = fs.readFileSync(path.join(dirname, '..', 'pages', req.url));
      res.setHeader('Content-Type', 'text/html');
      return res.end(html);
    }
    if (req.url.endsWith('.js')) {
      const file = fs.readFileSync(path.join(dirname, '..', '..', '..', req.url));
      res.setHeader('Content-Type', 'text/javascript');
      return res.end(file);
    }
    return res.end('');
  } catch (err) {
    console.error(err);
    res.status = 404;
    return res.end('');
  }
});

// Live signals server. Attaches a WebSocket endpoint at the kensington/live
// default path. In-memory persistence; heartbeats disabled (browser tests
// drive lifecycle explicitly via the transport's reconnect/disconnect methods).
const live = await liveServer({
  persistence: { kind: 'memory' },
  heartbeatInterval: false,
});
await live.attach(server);

server.listen(3847);
