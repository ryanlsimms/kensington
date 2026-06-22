import { t } from 'kensington';

import { code, exLink } from '../../components/ui.js';

export function reactivityValueAndTransform() {
  return [
    t.section({ id: 'signal-value' }, [
      t.h2('.value'),
      t.p([
        'Use ',
        t.code('.value'),
        ' instead of ',
        t.code('.get()'),
        ' inside ',
        t.code('effect()'),
        ' or ',
        t.code('computed()'),
        ' when you need the current value of a signal without subscribing to changes:',
      ]),
      code('javascript', `const searchTerm   = signal('');
const previousTerm = signal('');

// Re-runs when searchTerm changes. previousTerm.value reads without subscribing.
// Using .get() would subscribe the effect to previousTerm, and the .set()
// in the callback would re-trigger the effect, firing a duplicate request.
effect(() => {
  const current = searchTerm.get();
  const previous = previousTerm.value;
  const isRefinement = current.startsWith(previous) && previous.length > 0;

  fetch(\`/search?q=\${current}\`)
    .then(r => r.json())
    .then(data => {
      results.set(data);
      previousTerm.set(current);
    });
});`),
      t.p(exLink('?page=examples#incremental-search', 'Incremental search example')),
    ]),

    t.section({ id: 'signal-transform' }, [
      t.h2('.transform'),
      t.p([
        'Returns a new read-only signal whose value is derived by passing the source signal\'s value through a function. Equivalent to ',
        t.code('computed(() => fn(source.get()), key)'),
        ', but attached directly to the signal.',
      ]),
      code('javascript', `const count = signal(0);
const label = count.transform(n => n === 1 ? '1 item' : \`\${n} items\`);

t.p(label).toElement(); // "0 items", updates when count changes

// useful for coercing a signal's type before passing it as an attribute
const sortAsc = signal(true);
t.th({ ariaSort: sortAsc.transform(v => v ? 'ascending' : 'descending') });`),
      t.p([
        'Inside a ',
        t.code('computed'),
        ' callback, pass an optional stable ',
        t.code('key'),
        ' as the second argument to scope the transform to the owning computed. Same lifecycle as ',
        t.code('computed(fn, key)'),
        ': the same instance is reused across outer re-runs, the fn closure is updated automatically, and the instance is stopped when its key leaves the list.',
      ]),
      code('javascript', `const filter = signal('fruit');

const list = items.mapWithKey('id', item =>
  t.li({
    class: filter.transform(f => f === item.category ? 'match' : '', item.id),
  }, item.name),
);`),
    ]),
  ];
}
