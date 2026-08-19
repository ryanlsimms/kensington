import fs from 'node:fs';
import * as http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.KENSINGTON_BROWSER_TEST_PORT ?? 4178);

http.createServer((req, res) => {
  res.statusCode = 200;
  try {
    if (req.url === '/__kensington_test_health') {
      res.setHeader('Content-Type', 'text/plain');
      return res.end('kensington-browser-tests');
    }
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
    res.statusCode = 404;
    return res.end('');
  } catch (err) {
    console.error(err);
    res.statusCode = 404;
    return res.end('');
  }
}).listen(port, '127.0.0.1');
