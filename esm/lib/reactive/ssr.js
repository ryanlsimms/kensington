// SSR mode counter. When `ssrDepth > 0`, effect() returns a no-op stub and computed() runs
// its fn once to populate a frozen value without registering subscriptions. The counter is
// incremented on each renderForHydration call so a single page render can build deep trees
// without leaking subscribers onto module-level signals that outlive the request.

let ssrDepth = 0;

export function _enterSSRMode() {
  ssrDepth++;
}

export function _exitSSRMode() {
  ssrDepth--;
}

export function isSSRMode() {
  return ssrDepth > 0;
}
