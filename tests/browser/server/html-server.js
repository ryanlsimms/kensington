import * as http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import buildModule from './build-module.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(dirname, 'browser-test.html'));
const kensington = await buildModule(path.join(dirname, '..', '..', '..', 'esm', 'kensington.js'));

http.createServer(async (req, res) =>  {
  res.status = 200
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    return res.end(html);
  } else if (req.url === '/kensington.js') {
    res.setHeader('Content-Type', 'text/javascript');
    return res.end(kensington);
  } else {
    res.status = 404;
    res.end('');
  }
}).listen(9615);
