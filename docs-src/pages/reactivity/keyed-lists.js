import { t } from 'kensington';

import { code, exLink } from '../../components/ui.js';

export function reactivityKeyedLists() {
  return t.section({ id: 'signals-keyed-lists' }, [
    t.h2('Keyed lists'),
    t.p([
      'When a signal holds an array, the most direct way to render it is to ',
      t.code('.transform'),
      ' the signal and use a plain ',
      t.code('array.map'),
      '. This works. The library will pick up every change and the UI stays in sync.',
    ]),
    code('javascript', `const items = signal([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
]);

// Plain map. Correct, but every render builds fresh tag instances and fresh DOM
// for each one. Adding a row rebuilds every existing <li>.
t.ul(items.transform(arr => arr.map(item => t.li(item.name)))).toElement();`),
    t.p([
      'The catch is performance. ',
      t.code('arr.map(item => t.li(...))'),
      ' produces a fresh tag for every item on every re-render, so Kensington cannot tell that the new ',
      t.code('<li>'),
      ' at position 0 is the same Apple as before and builds a fresh DOM node. For a 10-row list this is invisible. For 1000 rows with frequent updates the cost adds up. Focus, scroll, and input value also reset because the DOM nodes are new each time.',
    ]),
    t.p([
      t.code('signal.mapWithKey(keyOrProp, mapFn)'),
      ' is the optimized form. It runs ',
      t.code('mapFn'),
      ' once per key the first time the key is seen and caches the resulting tag. Subsequent renders return the same tag instance, so Kensington reuses the existing DOM node. Reordering, adding, and removing items reorder existing nodes rather than rebuilding them.',
    ]),
    code('javascript', `const items = signal([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
]);

// Property-name string shortcut. Equivalent to passing item => item.id.
const rows = items.mapWithKey('id', item => t.li(item.name));

t.ul(rows).toElement();`),
    t.p('Two argument forms for the first argument:'),
    t.ul([
      t.li([
        t.strong('Function form. '),
        t.code('item => key'),
        '. Use when the key isn\'t a single property on the item, or when you need to compose it (',
        t.code('item => item.group + \'-\' + item.id'),
        ').',
      ]),
      t.li([
        t.strong('Property-name string. '),
        t.code('\'id\''),
        '. Common case. Equivalent to ',
        t.code('item => item.id'),
        '.',
      ]),
    ]),
    t.p([
      t.code('mapWithKey'),
      ' returns a ',
      t.code('ReadonlySignal<Tag[]>'),
      '. Pass it directly into tag content. Calling ',
      t.code('mapWithKey'),
      ' inside a ',
      t.code('computed'),
      ' or ',
      t.code('effect'),
      ' callback logs a warning because the per-key cache would reset on every outer re-run. Call it at the same scope where you call ',
      t.code('signal()'),
      '.',
    ]),
    t.p([
      'Duplicate keys in the same render fire a ',
      t.code('console.error'),
      ' and the first item wins. The duplicate is silently skipped, so each unique key always corresponds to exactly one cached tag.',
    ]),
    t.p(exLink('?page=examples#sortable-table', 'Sortable table example')),

    t.h3({ id: 'signals-keyed-local-state' }, 'Per-item local state and derived values'),
    t.p([
      'Inside ',
      t.code('mapWithKey'),
      '\'s mapFn, the same keying rules that apply inside any ',
      t.code('computed'),
      ' callback apply here. Pass the item id as the key to ',
      t.code('signal()'),
      ', ',
      t.code('computed()'),
      ', or ',
      t.code('.transform()'),
      ' so each per-item instance is scoped to the row and stopped automatically when the item leaves the list.',
    ]),
    code('javascript', `const filter = signal('fruit');

const list = items.mapWithKey('id', item => {
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
    class: cls,
    data: { state: stateLabel },
    onclick: () => highlight.set(v => !v),
  }, item.name);
});

t.ul(list).toElement();`),
    t.p([
      'Because mapFn only runs the first time a key is seen, these per-item primitives are created once and live for the life of the row. Removing the item drops it from the list and its primitives are stopped automatically. See the ',
      exLink('?page=examples#editable-rows', 'editable rows example'),
      ' for a realistic use of these patterns together.',
    ]),

    t.h4({ id: 'signals-keyed-no-escape' }, 'Don\'t reference a keyed instance from outside its scope'),
    t.p([
      'A keyed primitive is stopped whenever its key isn\'t accessed during a re-run (e.g. when the item leaves the list). After that point, external subscribers held in user-land code silently stop receiving updates. Use the instance freely inside the mapFn (read it with ',
      t.code('.get()'),
      ', transform it, pass it as tag content or an attribute value, etc.), but don\'t let the instance reference itself escape. The unsafe patterns are assigning it to a module-level variable, returning it bare from the mapFn, or passing it to a function that retains it.',
    ]),
    t.p([
      'The library emits a runtime warning, and the ',
      t.code('no-out-of-scope-reactive-reference'),
      ' ESLint rule catches it statically, when a keyed instance is referenced from outside its owner.',
    ]),

    t.h4({ id: 'signals-keyed-unkeyed' }, 'When you need a key'),
    t.p([
      'Always pass a key to a nested ',
      t.code('signal()'),
      '. An unkeyed signal inside a computed loses its local state on every outer re-run.',
    ]),
    t.p([
      'For ',
      t.code('computed()'),
      ' and ',
      t.code('.transform()'),
      ', pass a key when the result is read from user code (a ',
      t.code('signal()'),
      ' handler, another ',
      t.code('computed()'),
      ', or an ',
      t.code('effect()'),
      '). Skip the key when the result is only passed to a tag as an attribute value, class entry, text child, or prop. Those inline uses are handled by the runtime and don\'t need a key.',
    ]),
  ]);
}
