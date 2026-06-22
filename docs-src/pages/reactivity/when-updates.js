import { t } from 'kensington';

import { apiTable } from '../../components/table.js';
import { code } from '../../components/ui.js';

export function reactivityAdvancedHeader() {
  return t.header([
    t.h1('Advanced Usage'),
    t.p([
      'The above usage may be enough for many projects, ',
      'but if you are building a more complex app, you may need these tools.',
    ]),
  ]);
}

export function reactivityWhenUpdates() {
  return [
    t.section({ id: 'when-updates-fire' }, [
      t.h2('When updates fire'),
      t.p([
        'A signal notifies its subscribers when ',
        t.code('.set()'),
        ' is called with a value that differs from the current one. The check is reference-style (',
        t.code('Object.is'),
        '), not deep.',
      ]),
      apiTable(['Value type', 'What "differs" means'], [
        [
          [
            t.code('string'),
            ', ',
            t.code('number'),
            ', ',
            t.code('boolean'),
            ', ',
            t.code('null'),
            ', ',
            t.code('undefined'),
          ],
          [
            'Different value. ',
            t.code('signal.set(3)'),
            ' when the current value is ',
            t.code('3'),
            ' is a no-op.',
          ],
        ],
        [
          [t.code('Array'), ', ', t.code('Object'), ', anything else'],
          'Different reference. Mutating the existing value in place does not count. You must produce a new array or object.',
        ],
      ]),
      t.p('This is the most common source of "my signal isn\'t updating" confusion. The fix is to update immutably.'),

      t.h3({ id: 'immutable-updates' }, 'Immutable update patterns'),
      t.p('The same shapes work for any reactive library and all have built-in support in modern JavaScript.'),
      code('javascript', `// Array: replace one item by id, keep the others
items.set(prev => prev.map(it => it.id === 5 ? { ...it, done: true } : it));

// Array: add an item
items.set(prev => [...prev, newItem]);

// Array: remove an item
items.set(prev => prev.filter(it => it.id !== 5));

// Object: change one field
user.set(prev => ({ ...prev, name: 'Ada' }));

// Nested object: change a deep field (each level needs a spread)
state.set(prev => ({
  ...prev,
  profile: { ...prev.profile, name: 'Ada' },
}));`),
      t.p([
        'If a field needs to update frequently and is deeply nested, give it its own signal rather than reaching for spreads on every level. See ',
        t.a({ href: '#per-row-signals' }, 'Per-row signals'),
        ' below.',
      ]),

      t.h3({ id: 'what-does-not-trigger' }, ['What does ', t.em('not'), ' trigger an update']),
      code('javascript', `const items = signal([{ id: 1, label: 'a' }, { id: 2, label: 'b' }]);

// 1. Mutating an element of the array. No update.
items.get()[0].label = 'changed';

// 2. Setting the signal to the same array reference. No update.
items.set(items.get());

// 3. Mutating then re-setting with the same reference. Still no update.
items.get()[0].label = 'changed';
items.set(items.get());

// 4. In-place array methods like push, pop, shift, unshift, splice, sort, reverse.
//    All mutate the existing array. The signal isn't notified.
items.get().push({ id: 3, label: 'c' });
items.get().splice(0, 1);   // remove the first item
items.get().sort((a, b) => a.label.localeCompare(b.label));

// 5. Object.assign on an existing object. The returned value is the same target reference,
//    so even re-setting after it does nothing.
Object.assign(items.get()[0], { label: 'changed', done: true });

// 5a. Capturing the array first, mutating, then re-setting doesn't help either. \`arr\` is
//     the same reference as items.get(), so signal.set short-circuits via Object.is. The
//     value returned by Object.assign is also the same target reference.
const arr = items.get();
Object.assign(arr[0], { label: 'changed', done: true });
items.set(arr);                       // no update`),
      t.p([
        'All five patterns leave the DOM stale. The first, fourth, and fifth update internal state but never tell the signal anything happened. The second, third, and 5a get short-circuited because ',
        t.code('Object.is(items.get(), items.get())'),
        ' is true regardless of whether the value was mutated in between.',
      ]),
      t.p([
        'Mutating helpers like ',
        t.code('splice'),
        ', ',
        t.code('sort'),
        ', and ',
        t.code('Object.assign'),
        ' are particularly easy to reach for because they look like they "update" the value. They do, but the signal doesn\'t know. The non-mutating forms work as expected:',
      ]),
      code('javascript', `// Remove an item: filter to a new array
items.set(prev => prev.filter((_, i) => i !== 0));

// Add an item: spread into a new array
items.set(prev => [...prev, { id: 3, label: 'c' }]);

// Sort: toSorted returns a new array (ES2023+, or use [...prev].sort())
items.set(prev => prev.toSorted((a, b) => a.label.localeCompare(b.label)));

// Patch fields on an item: spread the item into a new object
items.set(prev => prev.map(it =>
  it.id === 1 ? { ...it, label: 'changed', done: true } : it,
));`),

      t.h3({ id: 'when-the-dom-updates' }, 'When the DOM actually updates'),
      t.p('Once a signal fires, what happens to the DOM depends on where the signal is used.'),
      apiTable(['Use site', 'What updates'], [
        [
          [t.code('t.div(signal)'), ' (signal as content)'],
          'The text node (or the matching set of child nodes for an array signal) is patched in place. Surrounding content is untouched.',
        ],
        [
          [t.code('t.input({ value: signal })'), ' (signal as attribute)'],
          ['Just that attribute. ', t.code('setAttribute'), ' is called. Boolean attributes are added or removed.'],
        ],
        [
          [t.code('t.input({ prop: { value: signal } })'), ' (signal as DOM property)'],
          [
            'Just that property. ',
            t.code('element[prop] = value'),
            ' is called. Required for things like ',
            t.code('input.value'),
            ' after the user has typed into the field.',
          ],
        ],
        [
          [t.code('effect(() => ...)'), ' inside'],
          [
            'The effect re-runs. Multiple ',
            t.code('.set()'),
            ' calls in the same synchronous turn coalesce into a single re-run via microtask batching.',
          ],
        ],
        [
          [t.code('computed(() => ...)'), ' inside'],
          'The computed re-evaluates synchronously. Its subscribers then update as above.',
        ],
      ]),

      t.h3({ id: 'per-row-signals' }, 'Per-row signals for fine-grained updates'),
      t.p([
        'For lists where individual rows change often, store a signal on each item ',
        'rather than reactively re-rendering the entire array.',
      ]),
      code('javascript', `// The whole \`items\` array doesn't need to re-render when one row's done flag flips.
const items = signal([
  { id: 1, label: 'Buy milk', done: signal(false) },
  { id: 2, label: 'Walk dog', done: signal(true)  },
]);

function row(item) {
  return t.li(
    { class: item.done.transform(d => d ? 'done' : 'open') },
    item.label,
  );
}

const list = t.ul(items.mapWithKey('id', row)).toElement();

// Update one row. The parent \`items\` signal does not fire. Only the affected element's
// class attribute is rewritten. Adding or removing a row still uses items.set() with a
// fresh array.
items.get()[0].done.set(true);`),
      t.p(`The keyed reconciler is built for the array-set path (adding, removing, reordering rows). Per-row signals are the right tool when only a row's contents change.`),
    ]),
  ];
}
