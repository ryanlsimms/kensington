import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const examplesDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(examplesDir, '..');

const EXAMPLES = [
  { id: 'context', title: 'createContext' },
  { id: 'use-reducer', title: 'useReducer' },
  { id: 'use-local-storage', title: 'useLocalStorage' },
  { id: 'use-debounce', title: 'useDebounce' },
  { id: 'use-fetch', title: 'useFetch' },
  { id: 'use-id', title: 'useId' },
];

const MIME = {
  '.html': 'text/html',
  '.js':   'text/javascript',
  '.css':  'text/css',
};

const NAV_STYLE = `<style>
  #examples-nav {
    position: fixed; top: 0; left: 0; right: 0;
    display: flex; gap: 2px; padding: 8px 12px;
    background: #1a1a2e; z-index: 100;
    font-family: monospace; font-size: 0.8rem;
  }
  #examples-nav a {
    color: #aaa; text-decoration: none;
    padding: 4px 10px; border-radius: 3px;
  }
  #examples-nav a:hover { color: #fff; background: #2a2a4e; }
  #examples-nav a.active { color: #fff; background: #3a3a6e; }
  body { padding-top: 44px; }
</style>`;

function navHtml(activeId) {
  return `<nav id="examples-nav">${
    EXAMPLES.map(e =>
      `<a href="/${e.id}/"${e.id === activeId ? ' class="active"' : ''}>${e.title}</a>`,
    ).join('')
  }</nav>`;
}

const INDEX = [
  '<!DOCTYPE html><html lang="en">',
  '<head><meta charset="utf-8"><title>Kensington Examples</title>',
  NAV_STYLE,
  '</head><body>',
  navHtml(''),
  '<main style="max-width:600px;margin:40px auto;padding:0 16px;font-family:sans-serif">',
  '<h1>Examples</h1>',
  '<ul style="line-height:2.4">',
  EXAMPLES.map(e => `<li><a href="/${e.id}/">${e.title}</a></li>`).join(''),
  '</ul></main></body></html>',
].join('');

export function serve(port = 3000, apiHandler = null) {
  http.createServer((req, res) => {
    if (apiHandler && req.url.startsWith('/api/') && apiHandler(req, res)) {return;}

    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(INDEX);
      return;
    }

    if (req.url.startsWith('/dist/')) {
      try {
        const content = fs.readFileSync(path.join(projectRoot, req.url));
        res.setHeader('Content-Type', MIME[path.extname(req.url)] ?? 'text/plain');
        res.end(content);
      } catch {
        res.statusCode = 404;
        res.end('Not found');
      }
      return;
    }

    const match = req.url.match(/^\/([^/?#]+)(?:\/(.*))?$/);
    if (!match) { res.statusCode = 404; res.end('Not found'); return; }

    const exampleId = match[1];
    const file = match[2] || 'index.html';
    const filePath = path.join(examplesDir, exampleId, file);

    try {
      const raw = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      res.setHeader('Content-Type', MIME[ext] ?? 'text/plain');

      if (ext === '.html') {
        const html = raw.toString()
          .replace('<head>', `<head>${NAV_STYLE}`)
          .replace('<body>', `<body>\n${navHtml(exampleId)}`);
        res.end(html);
      } else {
        res.end(raw);
      }
    } catch {
      res.statusCode = 404;
      res.end('Not found');
    }
  }).listen(port, () => {
    console.log(`http://localhost:${port}`);
  });
}
