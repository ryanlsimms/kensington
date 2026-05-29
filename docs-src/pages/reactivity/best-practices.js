import { code } from '../../components/ui.js';

export function reactivityBestPractices(t) {
  return t.section({ id: 'best-practices' }, [
    t.h2('Best Practices'),
    t.p('A few common mistakes and how to avoid them.'),

    t.h3({ id: 'bp-use-signal' }, 'Use a signal for any value that needs to change after render'),
    t.p([
      'Attributes, content, and ',
      t.code('prop'),
      ' values are read once when the tag is built. A plain variable passed at that point is a snapshot — changing it later has no effect on the DOM. Wrap the value in a signal so updates flow through automatically.',
    ]),
    code(t, 'javascript', `// Problem: the attribute is read once at creation. Changing the variable does nothing.
let submitting = false;
const btn = t.button({ disabled: submitting }, 'Submit').toElement();
submitting = true; // button is still enabled`),
    code(t, 'javascript', `// Fixed: the attribute updates whenever the signal changes.
const submitting = signal(false);
const btn = t.button({ disabled: submitting }, 'Submit').toElement();
submitting.set(true); // button becomes disabled`),
    t.p([
      'The same applies to text content (',
      t.code('t.p(mySignal)'),
      ') and ',
      t.code('prop'),
      ' values (',
      t.code("prop: { value: mySignal }"),
      ').',
    ]),

    t.h3({ id: 'bp-reactive-in-callback' }, 'Do not create signals or computeds inside a computed or transform callback'),
    t.p([
      'A ',
      t.code('computed()'),
      ' or ',
      t.code('transform()'),
      ' callback re-runs every time its dependencies change. Any ',
      t.code('signal()'),
      ' or ',
      t.code('computed()'),
      ' call inside the callback creates a brand-new instance on each re-run. These fresh instances never gain subscribers, so they go dormant immediately and leave behind orphaned entries in the devtools Signals panel. They also prevent the reconciler from reusing existing DOM nodes, because a new signal reference never matches the stored snapshot.',
    ]),
    code(t, 'javascript', `// Problem: a new computed is created on every re-render.
const rows = items.transform(list =>
  list.map(item => {
    const cls = computed(() => item.done ? 'done' : 'open'); // new instance each time
    return t.li({ dataKey: item.id, class: cls }, item.label);
  })
);`),
    t.p([
      'Create the reactive value once, when the item is first made, and store it on the item object.',
    ]),
    code(t, 'javascript', `// Fixed: the computed is created once per item, not once per render.
function makeItem(id, label) {
  const done = signal(false);
  const cls = done.transform(d => d ? 'done' : 'open');
  return { id, label, done, cls };
}

const items = signal([makeItem(1, 'Buy milk'), makeItem(2, 'Walk dog')]);

const rows = items.transform(list =>
  list.map(item => t.li({ dataKey: item.id, class: item.cls }, item.label))
);`),

    t.h3({ id: 'bp-named-handler' }, 'Use a named function for event handlers that read mutable state'),
    t.p([
      'Inline arrow functions in a ',
      t.code('.map()'),
      ' create a new reference on every render. The reconciler sees that the function changed, touches the DOM node to swap in the new handler, and rebuilds a snapshot. That is fine, but it means every re-render does extra work for each list item.',
    ]),
    t.p([
      'A named function defined outside the callback has a stable reference. The reconciler sees nothing changed and skips the node entirely. Because the function reads its closed-over variables at call time rather than capturing them, it always sees the current value.',
    ]),
    code(t, 'javascript', `// Inline arrow: new reference each render. Works correctly but the reconciler
// touches every node to swap in the updated handler.
let mode = 'view';
const rows = items.transform(list =>
  list.map(item =>
    t.li({ dataKey: item.id, onclick: () => handleClick(item.id, mode) }, item.label)
  )
);`),
    code(t, 'javascript', `// Named function: stable reference. The reconciler skips unchanged nodes.
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
    code(t, 'javascript', `// Problem: all nodes are replaced on every update, even when most items are unchanged.
const rows = items.transform(list =>
  list.map(item => t.li(item.label))
);`),
    code(t, 'javascript', `// Fixed: nodes are reused. Only added or removed items touch the DOM.
const rows = items.transform(list =>
  list.map(item => t.li({ dataKey: item.id }, item.label))
);`),
  ]);
}
