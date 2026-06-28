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
      ' call inside the callback creates a brand-new instance on each re-run. Local interactive state resets to its initial value and the previous instance becomes a sleeping orphan in the devtools Signals tab.',
    ]),
    t.p([
      'Pass a stable ',
      t.code('key'),
      ' as the second argument to ',
      t.code('signal()'),
      ' to scope the signal to the surrounding ',
      t.code('computed'),
      '. The same key returns the same instance across re-runs, so local state persists. Use the item identity (typically its id) as the key. The same applies inside ',
      t.code('mapWithKey'),
      '\'s mapFn since it wraps an internal computed.',
    ]),
    code('javascript', `// Works, but local state resets on every outer re-render. The library logs a
// console.warn pointing to the keyed form.
const list = items.mapWithKey('id', item => {
  const highlight = signal(false);
  return t.li({ class: highlight.transform(v => v ? 'on' : '') }, [
    t.button({ onclick: () => highlight.set(true) }, item.label),
  ]);
});`),
    code('javascript', `// Best: keyed signal. Same instance across re-runs, state persists, and the
// signal is stopped automatically when the item leaves the list.
const list = items.mapWithKey('id', item => {
  const highlight = signal(false, item.id);
  return t.li({ class: highlight.transform(v => v ? 'on' : '') }, [
    t.button({ onclick: () => highlight.set(true) }, item.label),
  ]);
});`),
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

const rows = items.mapWithKey('id', item => t.li({ class: item.cls }, item.label));`),
    callout('note', 'Duplicate keys',
      t.p([
        'Two ',
        t.code('signal(initial, key)'),
        ' calls with the same key in the same computed run would silently share state. Kensington logs an error in that case. Make sure your keys include the item identity (',
        t.code('item.id'),
        ') so each item gets its own signal.',
      ]),
    ),

    t.h3({ id: 'bp-signal-scope' }, "Don't read a signal outside the scope where it was created"),
    t.p([
      'A signal created inside a ',
      t.code('computed'),
      ', ',
      t.code('effect'),
      ', ',
      t.code('transform'),
      ', or ',
      t.code('mapWithKey'),
      ' mapFn belongs to that reactive scope. Reading it from outside is the bug. The keyed-signal pattern above works precisely because per-row state is only read by tags built inside the row — same scope, same lifecycle.',
    ]),
    t.p([
      'The failure mode is subtle: the signal looks fine at first read, but when the surrounding callback re-runs without the key (the row disappears, the outer state changes), the keyed sweep stops the signal. Any external reader still holding a reference now subscribes to a dead signal. Kensington fires an ',
      t.code('out-of-scope-reactive-reference'),
      ' warning when it can detect this at read time.',
    ]),
    code('javascript', `// Wrong. The signal is created inside the mapFn (a reactive scope), but a
// header component elsewhere also reads it. When the row leaves the list,
// the signal stops; the header is left with a dead reference.
const rows = items.mapWithKey('id', item => {
  const expanded = signal(false, item.id);
  exposeExpandedFlag(item.id, expanded);   // ← reader outside the mapFn
  return t.li({ class: expanded.transform(v => v ? 'on' : '') }, item.label);
});`),
    code('javascript', `// Right. The signal needs to live longer than any single row, so create
// it outside any reactive scope. The mapFn just reads it.
const expandedFlags = new Map();   // module scope. Outside any callback.
for (const id of knownIds) { expandedFlags.set(id, signal(false)); }

const rows = items.mapWithKey('id', item => {
  const expanded = expandedFlags.get(item.id);   // lookup, not creation
  return t.li({ class: expanded.transform(v => v ? 'on' : '') }, item.label);
});`),
    t.p([
      'The diagnostic question. ',
      t.strong('Where will this signal be read?'),
    ]),
    t.ul([
      t.li([
        'Only inside the surrounding callback (and its descendants) → safe to create inline. Pass a key so the same instance is reused across re-runs.',
      ]),
      t.li([
        'From outside that callback too (other components, other effects, module-level code) → create the signal outside the callback. If you need lazy creation, do the lazy creation outside any reactive scope (a one-shot loop in ',
        t.code('addConnectedCallback'),
        ', or a top-level effect that defers via ',
        t.code('queueMicrotask'),
        ').',
      ]),
    ]),
    t.p([
      'Same rule for ',
      t.code('liveSignal'),
      '. Per-user cursors, per-cell raw values, per-document metadata are usually read by multiple components, so the signal needs to outlive any one reactive callback. Create the names outside the reactive scope before the first render that reads them.',
    ]),

    t.h3({ id: 'bp-named-handler' }, 'Use a named function for event handlers that read mutable state'),
    t.p([
      'When you use ',
      t.code('mapWithKey'),
      ', the mapFn runs once per key and the tag is cached. Event handlers attached inside the mapFn therefore close over whatever variables existed at first render. A named function defined outside the mapFn that reads module-level state at call time always sees the current value.',
    ]),
    code('javascript', `// Inline arrow: closes over 'mode' at first render. Cached, never updates.
let mode = 'view';
const rows = items.mapWithKey('id', item =>
  t.li({ onclick: () => handleClick(item.id, mode) }, item.label)
);`),
    code('javascript', `// Named function: reads mode at click time, so it always reflects the
// current value even though the tag itself is cached by mapWithKey.
let mode = 'view';
function handleClick(e) { doSomething(e.currentTarget.dataset.id, mode); }

const rows = items.mapWithKey('id', item =>
  t.li({ data: { id: item.id }, onclick: handleClick }, item.label)
);

mode = 'edit'; // all items see 'edit' when clicked, no re-render needed`),

    t.h3({ id: 'bp-keyed-lists' }, 'Use mapWithKey for lists that may change'),
    t.p([
      'Without a key, every re-render builds fresh DOM nodes for every item. With ',
      t.code('mapWithKey'),
      ', the mapFn runs once per id and the tag is cached. Reorders, additions, and removals reuse existing DOM nodes; only new items pay for tag construction.',
    ]),
    code('javascript', `// Problem: every item rebuilds on every update.
const rows = items.transform(list => list.map(item => t.li(item.label)));`),
    code('javascript', `// Fixed: nodes are reused. Only added items pay for construction.
const rows = items.mapWithKey('id', item => t.li(item.label));`),
  ]);
}
