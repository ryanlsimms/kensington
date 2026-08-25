// Public reactive-core entry point. Every other subpath (`kensington`,
// `kensington/live`, `kensington/vite`, the `dist/kensington.slim*.js`
// bundles) imports the reactive primitives through THIS file so all
// consumers share one module identity for `Signal`, `signal`,
// `computed`, and `effect`.
//
// Before this shim existed, aliasing `kensington -> dist/kensington
// .slim.min.js` (a common bundle-size optimization) while
// `kensington/live` still resolved to source ESM would load the
// reactive core twice. Each copy had its own `currentEffect` /
// `pending` module-scoped state, so a `signal.set()` from one entry
// point would not wake an `effect()` from the other. Routing everyone
// through this file fixes the identity guarantee.
//
// See tests/treeshake/signal-identity-test.js for the regression test.

export {
  _bindingEffect,
  _internalComputed,
  _internalEffect,
  computed,
  default,
  effect,
  isKensingtonSignal,
  default as Signal,
  signal,
} from './lib/reactive/signal.js';
