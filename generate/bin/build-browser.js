import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { rollup } from 'rollup';

const entry = new URL('../../esm/index.js', import.meta.url).pathname;
const devtoolsScriptEntry = new URL('../../esm/devtools-script.js', import.meta.url).pathname;
const attributesId = new URL('../../esm/attributes.js', import.meta.url).pathname;
const attributesHref = new URL('../../esm/attributes.js', import.meta.url).href;
const kensingtonId = new URL('../../esm/kensington.js', import.meta.url).pathname;
const kensingtonSlimId = new URL('../../esm/kensington-slim.js', import.meta.url).pathname;
const devtoolsId = new URL('../../esm/lib/reactive/devtools.js', import.meta.url).pathname;
const filterStackId = new URL('../../esm/lib/util/filter-stack.js', import.meta.url).pathname;
const reactiveDir = new URL('../../esm/lib/reactive/', import.meta.url).pathname;
const distDir = new URL('../../dist/', import.meta.url).pathname;
const path = await import('node:path');

function reactiveDirRelativeToDist(id) {
  return path.relative(distDir, id).split(path.sep).join('/');
}

const attributesModule = await import(attributesHref);
const camelCaseNames = JSON.stringify([...new Set(
  Object.values(attributesModule)
    .flatMap(v => (v && typeof v === 'object' && !Array.isArray(v)) ? Object.keys(v) : [])
    .filter(k => /[A-Z]/.test(k)),
)]);

// The slim bundle swaps four source files inside rollup:
// - esm/kensington.js (huge generated class) -> esm/kensington-slim.js (small Proxy class)
// - esm/attributes.js (per-tag spec maps) -> a stub that only exports __slim__ and camelCaseNames
// - esm/lib/reactive/devtools.js -> a stub of no-op exports (devtools are a dev-only feature)
// - esm/lib/util/filter-stack.js -> an identity stub (stack filtering is a dev-only DX feature)
// Together these eliminate the bulk of the full bundle for slim consumers.
const slimDevtoolsStub = `
export function enableDevtools() {}
export function notifySignalCreate() {}
export function notifySignalSet() {}
export function notifySignalWake() {}
export function notifySignalEffectSubscription() {}
export function notifySignalEffectUnsubscription() {}
export function notifySignalZeroSubscribers() {}
export function notifySignalStop() {}
export function notifySignalMarkComputed() {}
export function notifySignalMarkKeyed() {}
export function notifyEffectCreate() { return 0; }
export function notifyEffectRun() {}
export function notifyEffectPause() {}
export function notifyEffectResume() {}
export function notifyEffectStop() {}
export function notifyEffectElement() {}
export function markNextEffectAsBinding() {}
export function notifyDomTrack() {}
export function notifyDomUntrack() {}
`;

// Every `esm/lib/reactive/*.js` module that carries mutable module-scope
// state (currentEffect, currentHydrationScope, SSR mode flags, etc.) is
// shared with other entry points (`kensington/live`, hydration flows,
// user code that imports `kensington/reactive`). Externalizing the whole
// reactive directory in the slim bundle guarantees ONE module instance
// per file at runtime — the slim bundle imports them via relative paths
// from `dist/` back into `esm/lib/reactive/`, which matches what every
// other consumer resolves to via source imports.
// See tests/treeshake/signal-identity-test.js for the regression that
// caught the two-instances bug on `signal.js`; the hydration.spec.js
// HMR test caught the same class of bug on `hydration-scope.js`.
const reactiveExternalPaths = {};

const slimPlugin = {
  name: 'slim-build',
  resolveId(id) {
    if (id === attributesId) { return '\0slim-attributes'; }
    if (id === kensingtonId) { return kensingtonSlimId; }
    if (id === devtoolsId) { return '\0slim-devtools'; }
    if (id === filterStackId) { return '\0slim-filter-stack'; }
    if (id.startsWith(reactiveDir) && id.endsWith('.js') && id !== devtoolsId) {
      reactiveExternalPaths[id] = reactiveDirRelativeToDist(id);
      return { id, external: true };
    }
    return null;
  },
  load(id) {
    if (id === '\0slim-attributes') {
      return `export const __slim__ = true;\nexport const camelCaseNames = new Set(${camelCaseNames});`;
    }
    if (id === '\0slim-devtools') { return slimDevtoolsStub; }
    if (id === '\0slim-filter-stack') { return 'export default function filterStack(e) { return e; }'; }
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

// `reactiveExternalPaths` (populated by slimPlugin above) maps absolute
// source paths to relative `../esm/lib/reactive/<file>.js` specifiers
// that resolve from `dist/`. Browsers, Node, and bundlers all follow
// the same path; bundler consumers dedupe by resolved file so slim +
// `kensington/live` + user code share one module instance per file.
const reactivePathMap = reactiveExternalPaths;

const slimJsPath = new URL('../../dist/kensington.slim.js', import.meta.url).pathname;
const slimMinPath = new URL('../../dist/kensington.slim.min.js', import.meta.url).pathname;

await slimBundle.write({
  file: slimJsPath,
  format: 'esm',
  generatedCode: { constBindings: true },
  paths: reactivePathMap,
  sourcemap: true,
});

await slimBundle.write({
  file: slimMinPath,
  format: 'esm',
  paths: reactivePathMap,
  plugins: [terser()],
  sourcemap: true,
});

const devtoolsBundle = await rollup({
  input: devtoolsScriptEntry,
  plugins: [nodeResolve(), commonjs()],
});

await devtoolsBundle.write({
  file: new URL('../../dist/kensington-devtools.js', import.meta.url).pathname,
  format: 'iife',
  generatedCode: { constBindings: true },
});

console.log('dist/ browser bundle written');
