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
    // Pass message as first arg so test harnesses that capture only the first
    // argument keep working. Pass the Error second so browser DevTools render
    // its stack with source-map mapping applied (turns minified bundle
    // positions into .ts source positions in the user's project).
    console.error(msg, error);
  }
}

export function throttledWarn(key, msg) {
  const now = Date.now();
  if (now - (warnLastSeen.get(key) ?? 0) >= WARN_THROTTLE_MS) {
    warnLastSeen.set(key, now);
    const error = filterStack(new Error(msg));
    console.warn(msg, error);
  }
}

export function _resetWarningThrottle() {
  warnLastSeen.clear();
}

// Track which keyed-signal name+key pairs have already produced an
// initial-mismatch warning so the message fires once per offender rather than
// once per throttle window. Cleared by _resetWarningThrottle for tests.
const warnedKeyedInitialMismatches = new Set();

function isPrimitiveValue(v) {
  return v === null || v === undefined || (typeof v !== 'object' && typeof v !== 'function');
}

function formatInitialValue(v) {
  if (v === null) { return 'null'; }
  if (v === undefined) { return 'undefined'; }
  if (typeof v === 'string') { return JSON.stringify(v); }
  return String(v);
}

/**
 * Fires a once-per-key throttled warning when a keyed signal is reused under
 * the same key but with a different primitive initial value than the first
 * caller passed. Object/array initials skip the comparison to avoid false
 * positives on structurally-equal-but-reference-different cases (the common
 * SSR-vs-client shape). Called from signal.js's keyed-signal lookup paths.
 */
export function warnKeyedInitialMismatch(key, originalInitial, newInitial) {
  if (!isPrimitiveValue(originalInitial) || !isPrimitiveValue(newInitial)) { return; }
  if (Object.is(originalInitial, newInitial)) { return; }
  const seenKey = `keyed-initial:${String(key)}`;
  if (warnedKeyedInitialMismatches.has(seenKey)) { return; }
  warnedKeyedInitialMismatches.add(seenKey);
  throttledWarn(
    'keyed-signal-initial-mismatch',
    `kensington: signal(initial, '${String(key)}') was called multiple times with different primitive initial values `
    + `(first: ${formatInitialValue(originalInitial)}, then: ${formatInitialValue(newInitial)}). `
    + 'The second caller\'s initial is ignored; the existing keyed signal is returned with its current value. '
    + 'If this is intentional (a key reused across re-runs of one computed), pass the same initial. '
    + 'If not, check for an accidental key collision.',
  );
}

// Test-only reset.
export function _resetKeyedInitialWarnings() {
  warnedKeyedInitialMismatches.clear();
}
