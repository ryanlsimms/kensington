import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const MIME = {
  '.html': 'text/html',
  '.js':   'text/javascript',
  '.css':  'text/css',
};

http.createServer((req, res) => {
  const filePath = req.url.startsWith('/dist/')
    ? path.join(projectRoot, req.url)
    : path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  try {
    const content = fs.readFileSync(filePath);
    res.setHeader('Content-Type', MIME[path.extname(filePath)] ?? 'text/plain');
    res.end(content);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
}).listen(3002, () => {
  console.log('http://localhost:3002');
});
