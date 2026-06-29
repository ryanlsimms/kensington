import { unlinkSync, watch, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import { generateHtml } from './docs-src/build.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexHtml = join(__dirname, 'docs-src/index.html');

function docsPlugin() {
  let html = '';

  return {
    name: 'docs',

    buildStart() {
      writeFileSync(indexHtml, generateHtml());
    },

    closeBundle() {
      try { unlinkSync(indexHtml); } catch { /* empty */ }
    },

    configureServer(server) {
      html = generateHtml();

      let debounce = null;
      const watcher = watch(join(__dirname, 'docs-src'), { recursive: true }, (_, filename) => {
        if (!filename || filename === 'index.html' || filename.startsWith(`assets${ sep}`)) { return; }
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          html = generateHtml();
          server.ws.send({ type: 'full-reload' });
        }, 200);
      });
      server.httpServer?.once('close', () => watcher.close());

      return () => {
        server.middlewares.use(async (req, res, next) => {
          const urlPath = req.url.split('?')[0];
          if (urlPath !== '/' && urlPath !== '/index.html') { return next(); }
          try {
            const transformed = await server.transformIndexHtml(req.url, html);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.end(transformed);
          } catch (e) {
            return next(e);
          }
        });
      };
    },
  };
}

export default defineConfig(({ command }) => ({
  root: 'docs-src',
  resolve: {
    alias: command === 'build' ? { 'kensington': join(__dirname, 'dist/kensington.slim.min.js') } : {},
  },
  server: {
    host: true,
    port: 4000,
  },
  preview: { host: true },
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
  plugins: [
    docsPlugin(),
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
}));
