// Public reactive-core entry point for source ESM consumers. The package root,
// `kensington/live`, and `kensington/vite` resolve the same source modules.
// Self-contained dist bundles embed their own code and coordinate mutable runtime
// state through the versioned registry in `lib/reactive/shared-state.js`.
//
// Before this shim existed, aliasing `kensington -> dist/kensington
// .slim.min.js` (a common bundle-size optimization) while
// `kensington/live` still resolved to source ESM loaded separate reactive
// state. The registry keeps signal subscriptions, pending updates, SSR mode,
// and hydration scopes coordinated across those entry points.
//
// See tests/treeshake/signal-identity-test.js for the regression test.

export {
  _bindingEffect,
  _internalComputed,
  _internalEffect,
  applyPendingReactiveUpdates,
  computed,
  default,
  effect,
  isKensingtonSignal,
  default as Signal,
  signal,
} from './lib/reactive/signal.js';
