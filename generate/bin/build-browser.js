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
const runtimeGuardId = new URL('../../esm/lib/reactive/runtime-guard.js', import.meta.url).pathname;
const signalId = new URL('../../esm/lib/reactive/signal.js', import.meta.url).pathname;
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

// The slim bundle swaps these source files inside rollup:
// - esm/kensington.js (huge generated class) -> esm/kensington-slim.js (small Proxy class)
// - esm/attributes.js (per-tag spec maps) -> a stub that only exports __slim__ and camelCaseNames
// - esm/lib/reactive/devtools.js -> a stub of no-op exports (devtools are a dev-only feature)
// - esm/lib/util/filter-stack.js -> an identity stub (stack filtering is a dev-only DX feature)
// - esm/lib/reactive/runtime-guard.js -> an off scope wrapper without diagnostic code
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
// state (currentEffect, pending effects, hydration scopes,
// SSR mode flags, etc.) must be shared by EVERY ESM dist build and every
// source subpath. A foreign Signal can be recognized by its brand, but a
// pending update call from another module instance cannot process its private scheduler.
//
// DO NOT limit this externalization to the slim build. Both full and slim
// dist files import these modules via relative paths from `dist/` back into
// `esm/lib/reactive/`, matching `kensington`, `kensington/reactive`, and
// `kensington/live`. That guarantees one module instance per resolved file
// when applications mix entry points.
// See tests/treeshake/signal-identity-test.js for the regression that
// covers cross-entry effects and applyPendingReactiveUpdates(), and hydration.spec.js for the
// same class of bug on `hydration-scope.js`.
const reactiveExternalPaths = {};

const sharedReactiveCorePlugin = {
  name: 'shared-reactive-core',
  resolveId(id) {
    if (id.startsWith(reactiveDir) && id.endsWith('.js')) {
      reactiveExternalPaths[id] = reactiveDirRelativeToDist(id);
      return { id, external: true };
    }
    return null;
  },
};

const slimPlugin = {
  name: 'slim-build',
  resolveId(id) {
    if (id === attributesId) { return '\0slim-attributes'; }
    if (id === kensingtonId) { return kensingtonSlimId; }
    if (id === devtoolsId) { return '\0slim-devtools'; }
    if (id === runtimeGuardId) { return '\0slim-runtime-guard'; }
    if (id === filterStackId) { return '\0slim-filter-stack'; }
    return null;
  },
  load(id) {
    if (id === '\0slim-attributes') {
      return `export const __slim__ = true;\nexport const camelCaseNames = new Set(${camelCaseNames});`;
    }
    if (id === '\0slim-devtools') { return slimDevtoolsStub; }
    if (id === '\0slim-runtime-guard') {
      return `import { _reactiveRuntime } from ${JSON.stringify(signalId)};
export function withRuntimeValidation(_level, _logger, fn) {
  return _reactiveRuntime.run(undefined, fn);
}`;
    }
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
  plugins: [nodeResolve(), commonjs(), sharedReactiveCorePlugin],
});

await bundle.write({
  file: new URL('../../dist/kensington.js', import.meta.url).pathname,
  format: 'esm',
  generatedCode: { constBindings: true },
  paths: reactiveExternalPaths,
  sourcemap: true,
});

await bundle.write({
  file: new URL('../../dist/kensington.min.js', import.meta.url).pathname,
  format: 'esm',
  paths: reactiveExternalPaths,
  plugins: [terser()],
  sourcemap: true,
});

const slimBundle = await rollup({
  input: entry,
  onwarn(warning, warn) {
    if (warning.code === 'MISSING_EXPORT') {return;}
    warn(warning);
  },
  plugins: [nodeResolve(), commonjs(), slimPlugin, sharedReactiveCorePlugin],
});

// `reactiveExternalPaths` (populated by sharedReactiveCorePlugin during both builds) maps absolute
// source paths to relative `../esm/lib/reactive/<file>.js` specifiers
// that resolve from `dist/`. Browsers, Node, and bundlers all follow
// the same path; bundler consumers dedupe by resolved file so full +
// slim + `kensington/live` + user code share one module instance per file.
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
