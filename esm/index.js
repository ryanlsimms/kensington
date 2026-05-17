import Kensington from './kensington.js';
import Signal, { computed, effect } from './lib/reactive/signal.js';

export default Kensington;

// `@__PURE__` lets bundlers drop the Kensington class for slim consumers who only import
// the reactive primitives (signal/effect/computed). Combined with `"sideEffects": false`
// in package.json, an unused `t` removes the class and all its transitive imports.
export const t = /* @__PURE__ */ new Kensington();

/**
 * Creates a reactive signal. Pass as content or an attribute value — the DOM updates live.
 * @template T
 * @param {T} initial
 * @returns {Signal<T>}
 * @example
 * const count = signal(0);
 * document.body.append(t.div(count).toElement());
 * count.set(n => n + 1);
 */
export function signal(initial) {
  return new Signal(initial);
}

export { computed, effect };
export const isBrowser = typeof window !== 'undefined';
export { registerComponents, renderForHydration } from './lib/render/hydration.js';
