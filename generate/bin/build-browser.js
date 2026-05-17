import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { rollup } from 'rollup';

const entry = new URL('../../esm/index.js', import.meta.url).pathname;
const attributesId = new URL('../../esm/attributes.js', import.meta.url).pathname;
const attributesHref = new URL('../../esm/attributes.js', import.meta.url).href;
const kensingtonId = new URL('../../esm/kensington.js', import.meta.url).pathname;
const kensingtonSlimId = new URL('../../esm/kensington-slim.js', import.meta.url).pathname;

const attributesModule = await import(attributesHref);
const camelCaseNames = JSON.stringify([...new Set(
  Object.values(attributesModule)
    .flatMap(v => (v && typeof v === 'object' && !Array.isArray(v)) ? Object.keys(v) : [])
    .filter(k => /[A-Z]/.test(k)),
)]);

// The slim bundle swaps two source files inside rollup:
// - esm/kensington.js (huge generated class) -> esm/kensington-slim.js (small Proxy class)
// - esm/attributes.js (per-tag spec maps) -> a stub that only exports __slim__ and camelCaseNames
// Together these eliminate the bulk of the full bundle for slim consumers.
const slimPlugin = {
  name: 'slim-build',
  resolveId(id) {
    if (id === attributesId) { return '\0slim-attributes'; }
    if (id === kensingtonId) { return kensingtonSlimId; }
    return null;
  },
  load(id) {
    if (id === '\0slim-attributes') {
      return `export const __slim__ = true;\nexport const camelCaseNames = new Set(${camelCaseNames});`;
    }
    return null;
  },
};

const bundle = await rollup({
  input: entry,
  onwarn(warning, warn) {
    if (warning.code === 'MISSING_EXPORT') {return;}
    warn(warning);
  },
  plugins: [nodeResolve(), commonjs()],
});

await bundle.write({
  file: new URL('../../dist/kensington.js', import.meta.url).pathname,
  format: 'esm',
  generatedCode: { constBindings: true },
  sourcemap: true,
});

await bundle.write({
  file: new URL('../../dist/kensington.min.js', import.meta.url).pathname,
  format: 'esm',
  plugins: [terser()],
  sourcemap: true,
});

const slimBundle = await rollup({
  input: entry,
  onwarn(warning, warn) {
    if (warning.code === 'MISSING_EXPORT') {return;}
    warn(warning);
  },
  plugins: [nodeResolve(), commonjs(), slimPlugin],
});

await slimBundle.write({
  file: new URL('../../dist/kensington.slim.js', import.meta.url).pathname,
  format: 'esm',
  generatedCode: { constBindings: true },
  sourcemap: true,
});

await slimBundle.write({
  file: new URL('../../dist/kensington.slim.min.js', import.meta.url).pathname,
  format: 'esm',
  plugins: [terser()],
  sourcemap: true,
});

console.log('dist/ browser bundle written');
