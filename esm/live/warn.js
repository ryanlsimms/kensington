// Shared warning helpers for kensington/live. Used by both the client and
// server transports to detect duplicate-name calls with conflicting initial
// values or persist flags. Throttled once per name per process so the same
// warning doesn't spam on every re-render.

const warnedDuplicateNames = new Set();
const warnedPersistMismatch = new Set();

function isPrimitive(v) {
  return v === null || v === undefined || (typeof v !== 'object' && typeof v !== 'function');
}

function formatInitial(v) {
  if (v === null) { return 'null'; }
  if (v === undefined) { return 'undefined'; }
  if (typeof v === 'string') { return JSON.stringify(v); }
  return String(v);
}

/**
 * Compare a second-caller initial value to the first-caller initial value for
 * the same liveSignal name. Fires once per name per session when both values
 * are primitives that disagree. Object / array initials are skipped to avoid
 * false positives on structurally-equal-but-reference-different cases (the
 * common SSR-vs-client shape).
 */
export function warnIfInitialMismatch(name, originalInitial, newInitial) {
  if (!isPrimitive(originalInitial) || !isPrimitive(newInitial)) { return; }
  if (Object.is(originalInitial, newInitial)) { return; }
  if (warnedDuplicateNames.has(name)) { return; }
  warnedDuplicateNames.add(name);
  console.warn(
    `kensington/live: liveSignal('${name}', ...) was called multiple times with different primitive initial values `
    + `(first: ${formatInitial(originalInitial)}, then: ${formatInitial(newInitial)}). `
    + 'The second caller\'s initial is ignored; the existing signal\'s current value is returned. '
    + 'If this is intentional (shared component imported from multiple places), pass the same initial in both places. '
    + 'If not, check for an accidental name collision.',
  );
}

/**
 * Compare a second-caller persist flag to the first-caller flag for the same
 * liveSignal name. Fires once per name per session when the booleans disagree.
 * The first declaration wins; the second caller's flag is ignored.
 */
export function warnIfPersistMismatch(name, originalPersist, newPersist) {
  if (originalPersist === newPersist) { return; }
  if (warnedPersistMismatch.has(name)) { return; }
  warnedPersistMismatch.add(name);
  console.warn(
    `kensington/live: liveSignal('${name}', ...) was declared with persist=${originalPersist} `
    + `but a later caller passed persist=${newPersist}. `
    + 'The first declaration wins. The persistence policy for a name is global, '
    + 'so every call site must agree. Set persist explicitly at every call site to silence this warning.',
  );
}

// Test-only. Reset the warned-sets so unit tests don't pollute each other.
export function _resetWarnedNames() {
  warnedDuplicateNames.clear();
  warnedPersistMismatch.clear();
}
