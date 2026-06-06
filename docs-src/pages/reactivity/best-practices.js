import { t } from 'kensington';

import { callout, code } from '../../components/ui.js';

export function reactivityBestPractices() {
  return t.section({ id: 'best-practices' }, [
    t.h2('Best Practices'),
    t.p('A few common mistakes and how to avoid them.'),

    t.h3({ id: 'bp-use-signal' }, 'Use a signal for any value that needs to change after render'),
    t.p([
      'Attributes, content, and ',
      t.code('prop'),
      ' values are read once when the tag is built. A plain variable passed at that point is a snapshot. Changing it later has no effect on the DOM. Wrap the value in a signal so updates flow through automatically.',
    ]),
    code('javascript', `// Problem: the attribute is read once at creation. Changing the variable does nothing.
let submitting = false;
const btn = t.button({ disabled: submitting }, 'Submit').toElement();
submitting = true; // button is still enabled`),
    code('javascript', `// Fixed: the attribute updates whenever the signal changes.
const submitting = signal(false);
const btn = t.button({ disabled: submitting }, 'Submit').toElement();
submitting.set(true); // button becomes disabled`),
    t.p([
      'The same applies to text content (',
      t.code('t.p(mySignal)'),
      ') and ',
      t.code('prop'),
      ' values (',
      t.code('prop: { value: mySignal }'),
      ').',
    ]),

    t.h3({ id: 'bp-reactive-in-callback' }, 'Pass a key to signals created inside a computed'),
    t.p([
      'A ',
      t.code('computed()'),
      ' or ',
      t.code('transform()'),
      ' callback re-runs every time its dependencies change. A bare ',
      t.code('signal()'),
      ' call inside the callback creates a brand-new instance on each re-run, which means the DOM node is replaced on every outer update so the new signal\'s effect can drive the live element. Local interactive state resets to its initial value across the replacement, but focus, scroll position, input values, and selection are preserved.',
    ]),
    t.p([
      'Pass a stable ',
      t.code('key'),
      ' as the second argument to ',
      t.code('signal()'),
      ' to scope the signal to the surrounding ',
      t.code('computed'),
      '. The same key returns the same instance across re-runs, so local state persists and the DOM node stays in place. Use the item identity (typically its id) as the key.',
    ]),
    code('javascript', `// Works, but the DOM node is replaced on every outer re-render and local
// state resets. The library logs a console.warn pointing to the keyed form.
const list = computed(() => items.get().map(item => {
  const highlight = signal(false);
  return t.li({ dataKey: item.id, class: highlight.transform(v => v ? 'on' : '') }, [
    t.button({ onclick: () => highlight.set(true) }, item.label),
  ]);
}));`),
    code('javascript', `// Best: keyed signal. Same instance across re-runs, state persists, DOM node
// is reused, and the signal is stopped automatically when the item leaves the list.
const list = computed(() => items.get().map(item => {
  const highlight = signal(false, item.id);
  return t.li({ dataKey: item.id, class: highlight.transform(v => v ? 'on' : '') }, [
    t.button({ onclick: () => highlight.set(true) }, item.label),
  ]);
}));`),
    t.p([
      'For derived values that depend only on data already on the item, lifting the signal onto the item object is also a good choice. It avoids the key bookkeeping and makes the per-item state explicit in the data model.',
    ]),
    code('javascript', `// Alternative: store reactive state on the item itself.
function makeItem(id, label) {
  const done = signal(false);
  const cls = done.transform(d => d ? 'done' : 'open');
  return { id, label, done, cls };
}

const items = signal([makeItem(1, 'Buy milk'), makeItem(2, 'Walk dog')]);

const rows = items.transform(list =>
  list.map(item => t.li({ dataKey: item.id, class: item.cls }, item.label))
);`),
    callout('note', 'Duplicate keys',
      t.p([
        'Two ',
        t.code('signal(initial, key)'),
        ' calls with the same key in the same computed run would silently share state. Kensington logs an error in that case. Make sure your keys include the item identity (',
        t.code('item.id'),
        ') so each item gets its own signal.',
      ]),
    ),

    t.h3({ id: 'bp-named-handler' }, 'Use a named function for event handlers that read mutable state'),
    t.p([
      'Inline arrow functions in a ',
      t.code('.map()'),
      ' create a new reference on every render. The reconciler sees that the function changed, touches the DOM node to swap in the new handler, and rebuilds a snapshot. That is fine, but it means every re-render does extra work for each list item.',
    ]),
    t.p([
      'A named function defined outside the callback has a stable reference. The reconciler sees nothing changed and skips the node entirely. Because the function reads its closed-over variables at call time rather than capturing them, it always sees the current value.',
    ]),
    code('javascript', `// Inline arrow: new reference each render. Works correctly but the reconciler
// touches every node to swap in the updated handler.
let mode = 'view';
const rows = items.transform(list =>
  list.map(item =>
    t.li({ dataKey: item.id, onclick: () => handleClick(item.id, mode) }, item.label)
  )
);`),
    code('javascript', `// Named function: stable reference. The reconciler skips unchanged nodes.
// mode is read at click time so it always reflects the current value.
let mode = 'view';
function handleClick(e) { doSomething(e.currentTarget.dataset.id, mode); }

const rows = items.transform(list =>
  list.map(item =>
    t.li({ dataKey: item.id, onclick: handleClick }, item.label)
  )
);

mode = 'edit'; // all items see 'edit' when clicked, no re-render needed`),

    t.h3({ id: 'bp-data-key' }, 'Add data-key to list items that may change'),
    t.p([
      'Without a key, every re-render tears down all existing list nodes and builds fresh ones. With a key, the reconciler matches old nodes to new items by ID, reuses any node whose content is unchanged, and only touches the nodes that actually changed.',
    ]),
    code('javascript', `// Problem: all nodes are replaced on every update, even when most items are unchanged.
const rows = items.transform(list =>
  list.map(item => t.li(item.label))
);`),
    code('javascript', `// Fixed: nodes are reused. Only added or removed items touch the DOM.
const rows = items.transform(list =>
  list.map(item => t.li({ dataKey: item.id }, item.label))
);`),
  ]);
}
