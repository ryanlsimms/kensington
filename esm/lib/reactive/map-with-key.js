import {
  _internalComputed,
  _internalEffect,
  _isInReactiveContext,
  _runMapWithKeyProbe,
  computed,
} from './signal.js';
import { throttledError, throttledWarn } from './warnings.js';

// Internal property name used by mapWithKey to stamp a key onto each cached tag, and read
// by reconcile.js to identify the matching DOM node. The string starts with an underscore
// so it's recognizable as Kensington-internal. Storing the key as a JS value (not a DOM
// attribute) keeps the rendered HTML clean of bookkeeping.
export const KENSINGTON_KEY = '_kensingtonKey';

// Stamps the key onto a tag returned from mapWithKey's mapFn. Only applies to Kensington
// tag instances. Non-tag values (e.g. plain strings used as content) ignore the key, which
// is fine since the reconciler treats them as unkeyed.
function stampKey(tag, key) {
  if (tag !== null && typeof tag === 'object' && tag._isKensingtonTag) {
    tag[KENSINGTON_KEY] = key;
  }
}

// Run mapFn under a tracking probe. If it touched nothing reactive (no signal reads, no
// keyed signal/computed creation), return a static entry holding the bare tag. Otherwise,
// unwind the probe's subscriptions, then build a real per-key inner computed plus a
// keep-alive effect that holds the inner awake across outer re-runs.
function buildEntry(item, mapFn) {
  const { result: firstTag, needsReactive } = _runMapWithKeyProbe(() => mapFn(item));
  if (!needsReactive) {
    // Static path. Identical cost to the original mapWithKey: one bare tag in the cache.
    return { tag: firstTag, inner: null, keepAwake: null };
  }
  // Reactive path. mapFn runs once more inside a real inner computed so its reads/creates
  // are scoped properly to that per-key inner. The keep-alive holds a permanent subscriber
  // so the outer's track() cycle can't drop the inner to zero subs and re-run mapFn on the
  // next .get(). _internalComputed clears the outer reactive context around the creation so
  // the "computed-in-computed" warning (meant for user mistakes) doesn't fire here.
  const inner = _internalComputed(() => mapFn(item));
  const keepAwake = _internalEffect(() => { inner.get(); });
  return { tag: null, inner, keepAwake };
}

// Keyed list mapper for signals that hold arrays. `keyOrProp` is either a property name on
// each item (the common case, e.g. `'id'`) or a function that extracts the key. The first
// time a key is seen, mapFn runs and the resulting tag is cached. The cache reuses the same
// tag instance for that key across renders, so the reconciler reuses its DOM node unchanged.
//
// On first sight of a key, mapFn is run under a probe. If it touched any reactive primitive
// (read a signal via .get(), or created a keyed signal/computed), the entry is upgraded to a
// per-key inner computed and mapFn runs again under that inner. From then on, signal changes
// that mapFn depends on re-run only the affected keys' mapFn, the outer wrapper emits new
// tags for those keys, and the reconciler rebuilds those rows in place via preserve-state
// so focus, scroll, input value, and selection survive the rebuild.
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
  if (_isInReactiveContext()) {
    throttledWarn(
      'mapwithkey-in-reactive',
      'kensington: mapWithKey called inside a computed or effect callback. ' +
      'The whole per-key registry is rebuilt on every outer re-run, defeating the cache. ' +
      'Call mapWithKey at the top level (where you would call signal()) and pass the result into reactive contexts.',
    );
  }
  const cache = new Map();
  return computed(() => {
    const items = this.get();
    const result = new Array(items.length);
    const seen = new Set();
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
      let entry = cache.get(key);
      if (entry === undefined) {
        entry = buildEntry(item, mapFn);
        cache.set(key, entry);
      }
      const tag = entry.tag === null ? entry.inner.get() : entry.tag;
      stampKey(tag, key);
      result[i] = tag;
    }
    // Sweep entries whose keys disappeared.
    for (const [k, e] of cache) {
      if (!seen.has(k)) {
        if (e.keepAwake !== null) { e.keepAwake.stop(); }
        if (e.inner !== null) { e.inner.stop?.(); }
        cache.delete(k);
      }
    }
    return result;
  });
}
