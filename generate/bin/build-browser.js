import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const entry = new URL('../../esm/kensington.js', import.meta.url).pathname;
const attributesId = new URL('../../esm/attributes.js', import.meta.url).pathname;

const slimPlugin = {
  name: 'slim-attributes',
  resolveId: id => id === attributesId ? '\0slim-attributes' : null,
  load: id => id === '\0slim-attributes' ? 'export const __slim__ = true;' : null,
};

const bundle = await rollup({
  input: entry,
  plugins: [nodeResolve(), commonjs()],
});

await bundle.write({
  file: new URL('../../dist/kensington.js', import.meta.url).pathname,
  format: 'esm',
  sourcemap: true,
  generatedCode: { constBindings: true },
});

await bundle.write({
  file: new URL('../../dist/kensington.min.js', import.meta.url).pathname,
  format: 'esm',
  sourcemap: true,
  plugins: [terser()],
});

const slimBundle = await rollup({
  input: entry,
  plugins: [nodeResolve(), commonjs(), slimPlugin],
});

await slimBundle.write({
  file: new URL('../../dist/kensington.slim.js', import.meta.url).pathname,
  format: 'esm',
  sourcemap: true,
  generatedCode: { constBindings: true },
});

await slimBundle.write({
  file: new URL('../../dist/kensington.slim.min.js', import.meta.url).pathname,
  format: 'esm',
  sourcemap: true,
  plugins: [terser()],
});

console.log('dist/ browser bundle written');
