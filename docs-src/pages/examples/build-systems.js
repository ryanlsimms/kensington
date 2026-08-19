import { t } from 'kensington';

import { code } from '../../components/ui.js';

export function examplesBuildSystems() {
  return t.section({ id: 'build-systems' }, [
    t.h2('Build systems'),
    t.p([
      'The recommended setup runs the full Kensington build in development (with runtime ',
      t.a({ href: '?page=basics#dev-validation' }, 'validation'),
      ' on) and the ',
      t.a({ href: '?page=basics#prod-slim' }, 'slim build'),
      ' in production (with no validation). The ',
      t.a({ href: '?page=basics#vite' }, 'Vite example'),
      ' on the home page shows the pattern. The same idea works in every bundler that supports module aliasing.',
    ]),

    t.section({ id: 'rollup' }, [
      t.h3('Rollup'),
      t.p([
        'Use ',
        t.code('@rollup/plugin-alias'),
        ' to swap the import in production. ',
        t.code('@rollup/plugin-replace'),
        ' sets ',
        t.code('process.env.NODE_ENV'),
        ' so application code can pick a ',
        t.code('validationLevel'),
        ' at build time.',
      ]),
      code('javascript', `// rollup.config.js
import alias from '@rollup/plugin-alias';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

const production = process.env.NODE_ENV === 'production';

export default {
  input: 'src/main.js',
  output: { file: 'dist/bundle.js', format: 'es' },
  plugins: [
    production && alias({
      entries: [{ find: /^kensington$/, replacement: 'kensington/dist/slim' }],
    }),
    nodeResolve(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
    }),
  ].filter(Boolean),
};`),
      code('javascript', `// src/t.js
import Kensington from 'kensington';

export const t = new Kensington({
  validationLevel: process.env.NODE_ENV === 'production' ? 'off' : 'error',
});`),
      t.p([
        'Run with ',
        t.code('NODE_ENV=production rollup -c'),
        ' for the slim bundle, ',
        t.code('rollup -c'),
        ' for the full one.',
      ]),
    ]),

    t.section({ id: 'esbuild' }, [
      t.h3('esbuild'),
      t.p([
        'Use a small exact-match resolver plugin for the production import swap. This leaves subpath imports such as ',
        t.code("'kensington/live'"),
        ' unchanged. esbuild handles environment-variable replacement through ',
        t.code('define'),
        '.',
      ]),
      code('javascript', `// build.js
import esbuild from 'esbuild';

const production = process.env.NODE_ENV === 'production';

const kensingtonSlim = {
  name: 'kensington-slim',
  setup(build) {
    build.onResolve({ filter: /^kensington$/ }, args =>
      build.resolve('kensington/dist/slim', {
        importer: args.importer,
        kind: args.kind,
        resolveDir: args.resolveDir,
      })
    );
  },
};

await esbuild.build({
  entryPoints: ['src/main.js'],
  outfile: 'dist/bundle.js',
  bundle: true,
  format: 'esm',
  define: {
    'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
  },
  plugins: production ? [kensingtonSlim] : [],
});`),
      code('javascript', `// src/t.js
import Kensington from 'kensington';

export const t = new Kensington({
  validationLevel: process.env.NODE_ENV === 'production' ? 'off' : 'error',
});`),
      t.p([
        'Run ',
        t.code('node build.js'),
        ' for the dev build, ',
        t.code('NODE_ENV=production node build.js'),
        ' for the slim one.',
      ]),
    ]),

    t.section({ id: 'webpack' }, [
      t.h3('Webpack'),
      t.p([
        'Webpack\'s ',
        t.code('mode'),
        ' option auto-sets ',
        t.code('process.env.NODE_ENV'),
        ', and ',
        t.code('resolve.alias'),
        ' handles the import swap. A config function receives the mode so the alias map can be built per environment.',
      ]),
      code('javascript', `// webpack.config.js
const path = require('path');

module.exports = (env, argv) => {
  const alias = argv.mode === 'production' ? { 'kensington$': 'kensington/dist/slim' } : {};
  return {
    entry: './src/main.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
    },
    resolve: { alias },
  };
};`),
      code('javascript', `// src/t.js
import Kensington from 'kensington';

export const t = new Kensington({
  validationLevel: process.env.NODE_ENV === 'production' ? 'off' : 'error',
});`),
      t.p([
        'Run ',
        t.code('webpack --mode development'),
        ' for the full build, ',
        t.code('webpack --mode production'),
        ' for the slim one.',
      ]),
    ]),
  ]);
}
