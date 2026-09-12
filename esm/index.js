import Kensington from './kensington.js';

export { Kensington };

export default Kensington;

// `@__PURE__` lets bundlers drop the Kensington class for slim consumers who only import
// the reactive primitives (signal/effect/computed/applyPendingReactiveUpdates). Combined with `"sideEffects": false`
// in package.json, an unused `t` removes the class and all its transitive imports.
export const t = /* @__PURE__ */ new Kensington();

export {
  applyPendingReactiveUpdates,
  computed,
  effect,
  isKensingtonSignal,
  default as Signal,
  signal,
} from './lib/reactive/signal.js';
export const isBrowser = typeof window !== 'undefined';

export { __kInstrument, hmrReplaceComponent, registerComponents, renderForHydration } from './lib/render/hydration.js';
