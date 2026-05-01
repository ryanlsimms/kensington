import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const entry = new URL('../../esm/kensington.js', import.meta.url).pathname;

const bundle = await rollup({
  input: entry,
  plugins: [nodeResolve(), commonjs()],
});

await bundle.write({
  file: new URL('../../dist/kensington.js', import.meta.url).pathname,
  format: 'esm',
  generatedCode: { constBindings: true },
});

await bundle.write({
  file: new URL('../../dist/kensington.min.js', import.meta.url).pathname,
  format: 'esm',
  plugins: [terser()],
});

console.log('dist/ browser bundle written');
