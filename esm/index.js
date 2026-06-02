import Kensington from './kensington.js';
import Signal, { computed, effect, signal } from './lib/reactive/signal.js';

export { Signal };

export default Kensington;

// `@__PURE__` lets bundlers drop the Kensington class for slim consumers who only import
// the reactive primitives (signal/effect/computed). Combined with `"sideEffects": false`
// in package.json, an unused `t` removes the class and all its transitive imports.
export const t = /* @__PURE__ */ new Kensington();

export { computed, effect, signal };
export const isBrowser = typeof window !== 'undefined';

export { registerComponents, renderForHydration } from './lib/render/hydration.js';
