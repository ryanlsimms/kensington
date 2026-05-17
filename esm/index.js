import Kensington from './kensington.js';
import Signal, { computed, effect } from './lib/reactive/signal.js';

export default Kensington;

export const t = new Kensington();

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
