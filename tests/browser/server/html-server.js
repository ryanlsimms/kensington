import * as http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import buildModule from './build-module.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const kensington = await buildModule(path.join(dirname, '..', '..', '..', 'esm', 'kensington.js'));

http.createServer(async (req, res) =>  {
  res.status = 200
  if (req.url === '/kensington.js') {
    res.setHeader('Content-Type', 'text/javascript');
    return res.end(kensington);
  } else {
    try {
      const html = fs.readFileSync(path.join(dirname, '..', 'pages', req.url));
      res.setHeader('Content-Type', 'text/html');
      return res.end(html);
    } catch {
      res.status = 404;
      return res.end('');
    }
  }
}).listen(9615);
