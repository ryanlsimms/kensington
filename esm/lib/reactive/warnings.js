import filterStack from '../util/filter-stack.js';

// Throttled console.error / console.warn used by signal.js and map-with-key.js for repeated
// runtime diagnostics (loop detection, invalid usage, duplicate keys, etc.). The throttle
// prevents a hot loop from flooding the devtools console while still surfacing each unique
// problem on first occurrence within the WARN_THROTTLE_MS window.

const warnLastSeen = new Map();
const WARN_THROTTLE_MS = 1000;

export function throttledError(key, msg) {
  const now = Date.now();
  if (now - (warnLastSeen.get(key) ?? 0) >= WARN_THROTTLE_MS) {
    warnLastSeen.set(key, now);
    const error = filterStack(new Error(msg));
    console.error(error.stack ?? msg);
  }
}

export function throttledWarn(key, msg) {
  const now = Date.now();
  if (now - (warnLastSeen.get(key) ?? 0) >= WARN_THROTTLE_MS) {
    warnLastSeen.set(key, now);
    const error = filterStack(new Error(msg));
    console.warn(error.stack ?? msg);
  }
}

export function _resetWarningThrottle() {
  warnLastSeen.clear();
}
