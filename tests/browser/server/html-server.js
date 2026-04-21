import * as http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import buildModule from './build-module.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const he = await buildModule(path.join(dirname, '..', '..', '..', 'node_modules', 'he'));

http.createServer(async (req, res) =>  {
  res.status = 200
  try {
    if (req.url === '/') {
      return res.end('');
    } else if (req.url.endsWith('.html')) {
      const html = fs.readFileSync(path.join(dirname, '..', 'pages', req.url));
      res.setHeader('Content-Type', 'text/html');
      return res.end(html);
    } else if (req.url.endsWith('.js')) {
      let file;
      if (req.url === '/esm/lib/he.js') {
        file = he;
      } else {
        file = fs.readFileSync(path.join(dirname, '..', '..', '..', req.url))
      }
      res.setHeader('Content-Type', 'text/javascript');
      res.end(file);
    }
  } catch (err) {
    console.error(err);
    res.status = 404;
    return res.end('');
  }
}).listen(3000);
