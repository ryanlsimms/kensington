import {
  _enterMapWithKeyInner,
  _exitMapWithKeyInner,
  _internalComputed,
  _internalEffect,
  _isInMapWithKeyInner,
  _isInReactiveContext,
  signal,
} from './signal.js';
import { throttledError, throttledWarn } from './warnings.js';

export const KENSINGTON_KEY = '_kensingtonKey';

function stampKey(tag, key) {
  if (tag !== null && typeof tag === 'object' && tag._isKensingtonTag) {
    tag[KENSINGTON_KEY] = key;
  }
}

// React-style shallow equality by own enumerable keys. Decides whether a
// fresh object ref with unchanged fields triggers a per-row re-run.
// Without this, reordering a list with fresh literals rebuilds every DOM
// node. Nested objects/arrays compare by reference — app-level immutable
// updates still produce a fresh nested ref when the nested value changed.
function itemsEqual(a, b) {
  if (Object.is(a, b)) { return true; }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') { return false; }
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) { return false; }
  for (let i = 0; i < keys.length; i++) {
    if (!Object.is(a[keys[i]], b[keys[i]])) { return false; }
  }
  return true;
}

// Keyed list mapper for signals that hold arrays. `keyOrProp` is a property
// name on each item (e.g. `'id'`) or a key-extractor function. mapFn's
// signature is `(item, key) => tag`.
//
// Reactivity model: per-key itemSignal (kensington-owned via the outer
// computed's keyed-signal registry, auto-swept on key disappearance) + per-
// key inner computed (owned here, kept alive by a keepAwake effect so
// subscribers dropping to zero across outer re-runs doesn't force a re-
// evaluation). When the outer array delivers a new object ref for an
// existing key AND its shallow fields differ, the wrapper writes the new
// item into that key's itemSignal, re-running that key's mapFn. New keys
// create new entries; disappearing keys are swept.
//
// App-layer state shape: one `signal([{...}, {...}])`. Edit / add / remove
// all go through `outerSignal.set(prev => …)`. The reconciler reuses DOM
// nodes across reorderings via the KENSINGTON_KEY stamp on each tag.
export function mapWithKey(keyOrProp, mapFn) {
  let keyFn;
  if (typeof keyOrProp === 'function') {
    keyFn = keyOrProp;
  } else if (typeof keyOrProp === 'string') {
    keyFn = item => item[keyOrProp];
  } else {
    throw new TypeError('mapWithKey: first argument must be a function or a property name string');
  }
  if (typeof mapFn !== 'function') {
    throw new TypeError('mapWithKey: second argument must be a function (mapFn)');
  }
  if (_isInReactiveContext() && !_isInMapWithKeyInner()) {
    throttledWarn(
      'mapwithkey-in-reactive',
      'kensington: mapWithKey called inside a computed or effect callback. ' +
      'The whole per-key registry is rebuilt on every outer re-run, defeating the cache. ' +
      'Call mapWithKey at the top level (where you would call signal()) and pass the result into reactive contexts.',
    );
  }
  const cache = new Map();

  return _internalComputed(() => {
    const items = this.get();
    const result = new Array(items.length);
    const seen = new Set();
    let writeIdx = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const key = keyFn(item);
      if (seen.has(key)) {
        throttledError(
          'mapwithkey-duplicate-key',
          'kensington: mapWithKey saw two items with the same key. The first item wins. The duplicate is skipped.',
        );
        continue;
      }
      seen.add(key);
      // Keyed signal: first sight registers with the outer's keyed-signal
      // registry; subsequent sights return the same instance. _setFromRemote
      // bypasses the set-in-computed loop guard — the guard exists to catch
      // user mistakes; this library-managed write can't loop (outer never
      // reads itemSignal directly, only transitively via inner.get()).
      const itemSignal = signal(item, key);
      if (!itemsEqual(itemSignal.value, item)) {
        itemSignal._setFromRemote(item);
      }
      let entry = cache.get(key);
      if (entry === undefined) {
        const inner = _internalComputed(() => {
          _enterMapWithKeyInner();
          try {
            return mapFn(itemSignal.get(), key);
          } finally {
            _exitMapWithKeyInner();
          }
        });
        const keepAwake = _internalEffect(() => { inner.get(); });
        entry = { inner, keepAwake };
        cache.set(key, entry);
      }
      const tag = entry.inner.get();
      stampKey(tag, key);
      result[writeIdx++] = tag;
    }
    if (writeIdx !== items.length) { result.length = writeIdx; }
    for (const [k, e] of cache) {
      if (!seen.has(k)) {
        e.keepAwake.stop();
        e.inner.stop();
        cache.delete(k);
      }
    }
    return result;
  });
}
