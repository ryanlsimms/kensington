import { getSharedReactiveState } from './shared-state.js';
// SSR mode counter. When `ssrDepth > 0`, effect() returns a no-op stub and computed() runs
// its fn once to populate a frozen value without registering subscriptions. The counter is
// incremented on each renderForHydration call so a single page render can build deep trees
// without leaking subscribers onto module-level signals that outlive the request.

const state = getSharedReactiveState('ssr', () => ({
  ssrDepth: 0,
}));

export function _enterSSRMode() {
  state.ssrDepth++;
}

export function _exitSSRMode() {
  state.ssrDepth--;
}

export function isSSRMode() {
  return state.ssrDepth > 0;
}
