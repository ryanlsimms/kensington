import { t } from 'kensington';

import { callout, code } from '../../components/ui.js';
import { loc } from './helpers.js';

export function architectureMapWithKey() {
  return t.section({ id: 'map-with-key' }, [
    t.h2('mapWithKey internals'),
    t.p({ class: 'file-crumb' }, [
      'esm',
      t.span({ class: 'slash' }, '/'),
      'lib',
      t.span({ class: 'slash' }, '/'),
      'reactive',
      t.span({ class: 'slash' }, '/'),
      loc('esm/lib/reactive/map-with-key.js'),
    ]),
    t.p([
      t.code('signal.mapWithKey(keyOrProp, mapFn)'),
      ' is the keyed list mapper that feeds stable tag instances to the ',
      t.a({ href: '#reconcile' }, 'reconciler'),
      '. It is attached to the prototype as ',
      t.code('Signal.prototype.mapWithKey = mapWithKey'),
      ' and returns an ',
      t.code('_internalComputed'),
      ' wrapper, not a plain ',
      t.code('computed'),
      '. The internal form keeps a nested ',
      t.code('mapWithKey'),
      ' (the documented recursive-tree pattern) from tripping the computed-in-computed warning, and keeps the wrapper\'s own reads of user-keyed signals inside each row from tripping the out-of-scope warning.',
    ]),

    t.section({ id: 'map-with-key-probe' }, [
      t.h3('The probe'),
      t.p([
        'The first time a key is seen, ',
        t.code('buildEntry(item, mapFn)'),
        ' runs ',
        t.code('mapFn'),
        ' under ',
        t.code('_runMapWithKeyProbe'),
        ' (',
        loc('esm/lib/reactive/signal.js'),
        '). The probe swaps ',
        t.code('currentEffect'),
        ' to a throwaway probe object, clears ',
        t.code('currentComputed'),
        ' and ',
        t.code('inComputedFn'),
        ', and runs ',
        t.code('mapFn'),
        ' once to discover whether the row is reactive.',
      ]),
      code('javascript', `const { result, needsReactive } = _runMapWithKeyProbe(() => mapFn(item));
// needsReactive is true if mapFn read any signal (probe._cleanups non-empty)
// or created any signal(initial, key) / computed(fn, key).`),
      t.p([
        t.code('needsReactive'),
        ' is true when ',
        t.code('mapFn'),
        ' read at least one signal (the probe collected a subscription) or created a keyed primitive. On a positive result the probe\'s subscriptions are unwound before returning, so the probe never leaves a dangling subscriber.',
      ]),
    ]),

    t.section({ id: 'map-with-key-entries' }, [
      t.h3('Static versus reactive entries'),
      t.p([
        'The probe result decides the shape of the cache entry. The cache is a plain ',
        t.code('Map'),
        ' keyed by the user key.',
      ]),
      t.ul([
        t.li([
          t.strong('Static. '),
          'When ',
          t.code('needsReactive'),
          ' is false, the entry is ',
          t.code('{ tag, inner: null, keepAwake: null }'),
          '. The same tag is returned on every later render. The cost is identical to a plain ',
          t.code('Map'),
          ' lookup.',
        ]),
        t.li([
          t.strong('Reactive. '),
          'When ',
          t.code('needsReactive'),
          ' is true, the entry is upgraded to ',
          t.code('{ tag: null, inner, keepAwake }'),
          ' where ',
          t.code('inner = _internalComputed(() => mapFn(item))'),
          ' and ',
          t.code('keepAwake = _internalEffect(() => { inner.get(); })'),
          '.',
        ]),
      ]),
      callout('key', 'Why the keep-alive exists',
        t.p([
          'The outer wrapper reads each row\'s tag through ',
          t.code('inner.get()'),
          '. Inside the wrapper\'s own ',
          t.code('track()'),
          ' cycle that subscription is dropped and re-added on every outer re-run. Without a permanent subscriber the inner computed would fall to zero subscribers between runs, go to sleep, and re-run ',
          t.code('mapFn'),
          ' from scratch on the next ',
          t.code('.get()'),
          ', discarding per-row state. The ',
          t.code('keepAwake'),
          ' effect holds one permanent subscription so the inner never sleeps.',
        ]),
      ),
      t.p([
        'When a tracked signal changes, the inner re-emits a fresh tag. The reconciler\'s ',
        t.code('tagNeedsRebuild'),
        ' sees ',
        t.code('item.getDomElement() !== oldNode'),
        ' and ',
        t.code('rebuildNode'),
        ' swaps the row\'s DOM in place via ',
        loc('esm/lib/reactive/preserve-state.js'),
        '.',
      ]),
    ]),

    t.section({ id: 'map-with-key-render' }, [
      t.h3('The render pass and sweeping'),
      t.p([
        'On each render the outer wrapper iterates the source array, looks up each key, and returns the current tag with ',
        t.code('entry.tag === null ? entry.inner.get() : entry.tag'),
        '. Each tag is stamped with its key via ',
        t.code('stampKey(tag, key)'),
        ', which writes the internal ',
        t.code('KENSINGTON_KEY'),
        ' property (',
        t.code("'_kensingtonKey'"),
        ') that the reconciler reads back. Keys whose items disappeared from the array are swept. Their ',
        t.code('inner'),
        ' and ',
        t.code('keepAwake'),
        ' are stopped so per-row signals and computeds tear down.',
      ]),
    ]),

    t.section({ id: 'map-with-key-warnings' }, [
      t.h3('Misuse warnings'),
      t.ul([
        t.li([
          t.strong('Duplicate keys. '),
          'Two items resolving to the same key in one render fire ',
          t.code("throttledError('mapwithkey-duplicate-key', ...)"),
          ' and the first item wins. The duplicate is skipped, so each key always maps to exactly one cached tag.',
        ]),
        t.li([
          t.strong('Called inside a reactive context. '),
          'Calling ',
          t.code('mapWithKey'),
          ' inside a ',
          t.code('computed'),
          ' or ',
          t.code('effect'),
          ' fires ',
          t.code("throttledWarn('mapwithkey-in-reactive', ...)"),
          ' via ',
          t.code('_isInReactiveContext()'),
          ', because the whole per-key registry would rebuild on every outer re-run.',
        ]),
      ]),
    ]),
  ]);
}
