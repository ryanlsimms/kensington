import { t } from 'kensington';

import { code, exLink } from '../../components/ui.js';

export function reactivityKeyedLists() {
  return t.section({ id: 'signals-keyed-lists' }, [
    t.h2('Keyed lists'),
    t.p([
      'When a signal holds an array, add ',
      t.code('dataKey'),
      ' to items. The reconciler matches nodes by ',
      t.code('data-key'),
      ' and reuses DOM elements on reorder, addition, and removal. Reused nodes are diffed recursively: only changed attributes and text are written to the DOM. Signal-managed attributes on reused nodes are preserved, and orphaned effects on discarded nodes are stopped immediately.',
    ]),
    code('javascript', `const items = signal([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
]);

const rows = computed(() =>
  items.get().map(item => t.li({ dataKey: item.id }, item.name)),
);

t.ul(rows).toElement();`),
    t.p(exLink('?page=examples#sortable-table', 'Sortable table example')),

    t.h3({ id: 'signals-keyed-local-state' }, 'Reactive primitives created inside a computed need a key'),
    t.p([
      'The same rule applies anywhere a ',
      t.code('signal()'),
      ', ',
      t.code('computed()'),
      ', or ',
      t.code('.transform()'),
      ' is created inside another ',
      t.code('computed'),
      ' callback. List mappings are the most common case, but the rule covers any nested creation. Pass a stable key as the second argument. The registry reuses the same primitive instance across outer re-runs and stops it automatically when the key isn\'t accessed.',
    ]),
    t.p([
      'In a keyed list, the natural choice is the item id, so ',
      t.code('dataKey'),
      ' and the keyed-primitive key are the same value. The reconciler reuses the DOM node by ',
      t.code('data-key'),
      '; the reactive registry reuses the primitive by the same id. DOM identity and reactive state identity stay aligned with one item identity.',
    ]),
    code('javascript', `const filter = signal('fruit');

const list = computed(() => items.get().map(item => {
  // signal(initial, key). Per-item local interactive state.
  const highlight = signal(false, item.id);
  // computed(fn, key). Derived value that reads multiple signals.
  const cls = computed(() => [
    filter.get() === item.category && 'match',
    highlight.get() && 'on',
  ].filter(Boolean).join(' '), item.id);
  // signal.transform(fn, key). Single-source derivation chained off filter.
  const stateLabel = filter.transform(f => f === item.category ? 'in' : 'out', item.id);
  return t.li({
    dataKey: item.id,
    class: cls,
    data: { state: stateLabel },
    onclick: () => highlight.set(v => !v),
  }, item.name);
}));

t.ul(list).toElement();`),
    t.p([
      'All three forms share the same lifecycle: the same key returns the same instance across outer re-runs, the instance is stopped automatically when its key leaves the list, and the whole registry is torn down when the owning computed is stopped. For ',
      t.code('computed(fn, key)'),
      ' and ',
      t.code('signal.transform(fn, key)'),
      ' the fn closure is replaced on every outer re-run, so captured variables stay fresh while the instance identity stays stable. Duplicate keys inside a single outer run log an error.',
    ]),
    t.p([
      'See the ',
      exLink('?page=examples#editable-rows', 'editable rows example'),
      ' for a realistic use of these patterns together.',
    ]),
    t.h4({ id: 'signals-keyed-no-escape' }, 'Don\'t reference a keyed instance from outside its scope'),
    t.p([
      'The owning ',
      t.code('computed'),
      ' can stop a keyed instance whenever its key isn\'t accessed during a re-run (e.g. during a loading or filter state). After that point, external subscribers held in user-land code silently stop receiving updates. The rule is straightforward. Use the instance freely inside the owning callback (read it with ',
      t.code('.get()'),
      ', transform it, pass it as tag content or an attribute value, etc.), but don\'t let the instance reference itself escape. The unsafe patterns are assigning it to a module-level variable, returning it bare from the callback, or passing it to a function that retains it.',
    ]),
    t.p([
      'The library emits a runtime warning, and the ',
      t.code('no-out-of-scope-reactive-reference'),
      ' ESLint rule catches it statically, when a keyed instance is referenced from outside its owner.',
    ]),
    t.h4({ id: 'signals-keyed-unkeyed' }, 'Without a key'),
    t.p([
      t.code('signal()'),
      ', ',
      t.code('computed()'),
      ', and ',
      t.code('.transform()'),
      ' inside a computed without a key still work. The reconciler detects the changed instance reference and replaces the DOM node so the fresh instance drives it. Focus, scroll, input value, and selection are preserved across the swap. Local state resets to the initial value. The library logs a ',
      t.code('console.warn'),
      ' for each form, steering you toward the keyed alternative.',
    ]),
  ]);
}
