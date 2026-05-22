import { code, exLink } from '../../components/ui.js';

export function reactivityValueAndTransform(t) {
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
      code(t, 'javascript', `const searchTerm   = signal('');
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
      t.p(exLink(t, '?page=examples#incremental-search', 'Incremental search example')),
    ]),

    t.section({ id: 'signal-transform' }, [
      t.h2('.transform'),
      t.p([
        'Returns a new read-only signal whose value is derived by passing the source signal\'s value through a function. Equivalent to ',
        t.code('computed(() => fn(source.get()))'),
        ', but attached directly to the signal.',
      ]),
      code(t, 'javascript', `const count = signal(0);
const label = count.transform(n => n === 1 ? '1 item' : \`\${n} items\`);

t.p(label).toElement(); // "0 items", updates when count changes

// useful for coercing a signal's type before passing it as an attribute
const sortAsc = signal(true);
t.th({ 'aria-sort': sortAsc.transform(v => v ? 'ascending' : 'descending') });`),
    ]),
  ];
}
