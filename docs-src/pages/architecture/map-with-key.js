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

    t.section({ id: 'map-with-key-per-key-signal' }, [
      t.h3('Per-key itemSignal'),
      t.p([
        'Every row gets an internal item signal, created with ',
        t.code('signal(item, key)'),
        ' inside the outer computed. This goes through kensington\'s keyed-signal path in ',
        loc('esm/lib/reactive/signal.js'),
        ', so the signal is registered in the outer\'s keyed-signal registry — kensington auto-suppresses the signal-in-computed warning for it AND auto-sweeps it when the key stops being touched on a later outer run.',
      ]),
      t.p([
        t.code('mapFn'),
        ' runs inside a per-key inner computed whose body reads ',
        t.code('itemSignal.get()'),
        ' before passing the value on. That read is what establishes the row\'s reactive dependency, and it is set up by the wrapper — nothing about ',
        t.code('mapFn'),
        '\'s body is probed. A row updates iff the wrapper writes a new item into its itemSignal.',
      ]),
      code('javascript', `const itemSignal = signal(item, key);           // keyed-signal registry
if (!itemsEqual(itemSignal.value, item)) {
  itemSignal._setFromRemote(item);              // library-internal write
}
// on first sight, build the inner:
const inner = _internalComputed(() =>
  mapFn(itemSignal.get(), key)                  // structural dep
);
const keepAwake = _internalEffect(() => { inner.get(); });`),
    ]),

    t.section({ id: 'map-with-key-shallow-diff' }, [
      t.h3('Shallow-content gate'),
      t.p([
        'The wrapper does NOT fire on every new object ref. Before writing to ',
        t.code('itemSignal'),
        ', ',
        t.code('itemsEqual(a, b)'),
        ' does a React-style shallow diff by own enumerable keys. A fresh object literal whose fields are all reference-equal to the previous item is a no-op — the inner does not re-run, ',
        t.code('mapFn'),
        ' does not run, and the cached tag stays live. This is what preserves DOM node identity when a list is reordered with fresh literals that carry the same content.',
      ]),
      t.p([
        'Any single field that fails ',
        t.code('Object.is'),
        ' — including a nested-object ref change — is enough to fire the itemSignal. The gate is deliberately shallow so the app\'s existing immutable-update pattern (',
        t.code('{ ...row, foo: v }'),
        ') stays the source of truth for "this row changed".',
      ]),
    ]),

    t.section({ id: 'map-with-key-write-guard-bypass' }, [
      t.h3('Bypassing the set-in-computed guard'),
      t.p([
        'The ref-change write happens inside the outer computed\'s body, which would normally trip the ',
        t.code('set-in-computed'),
        ' warning. The wrapper uses ',
        t.code('itemSignal._setFromRemote(item)'),
        ' — the same internal setter kensington/live uses for network-origin updates — to bypass the guard for this library-managed write. The guard stays active for user code. It can\'t cause a reactive loop here because the outer never reads any itemSignal directly, only transitively via ',
        t.code('inner.get()'),
        '.',
      ]),
    ]),

    t.section({ id: 'map-with-key-render' }, [
      t.h3('The render pass and sweeping'),
      t.p([
        'On each render the outer iterates the source array, resolves each key, ensures its itemSignal is up to date, builds the entry on first sight, and reads the tag through ',
        t.code('entry.inner.get()'),
        '. Each tag is stamped with its key via ',
        t.code('stampKey(tag, key)'),
        ', which writes the internal ',
        t.code('KENSINGTON_KEY'),
        ' property (',
        t.code("'_kensingtonKey'"),
        ') that the reconciler reads back. Keys whose items disappeared are swept: the wrapper stops the ',
        t.code('inner'),
        ' and ',
        t.code('keepAwake'),
        ' it owns; kensington sweeps the itemSignal automatically via the keyed-signal registry.',
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
        'When the itemSignal fires (or any signal ',
        t.code('mapFn'),
        ' read via ',
        t.code('.get()'),
        ' changes), the inner re-emits a fresh tag. The reconciler\'s ',
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
