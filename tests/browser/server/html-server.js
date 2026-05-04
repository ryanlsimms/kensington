import fs from 'node:fs';
import * as http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

http.createServer((req, res) => {
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
}).listen(3000);
