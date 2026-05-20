import { signal, t } from 'kensington';

import { useDebounce } from './use-debounce.js';

const PEOPLE = [
  'Alice',
  'Bob',
  'Carol',
  'Dave',
  'Eve',
  'Frank',
  'Grace',
  'Heidi',
  'Ivan',
  'Judy',
];

const query = signal('');
const debounced = useDebounce(query, 400);

const results = debounced.transform(q =>
  q ? PEOPLE.filter(p => p.toLowerCase().includes(q.toLowerCase())) : PEOPLE,
);

const app = t.div([
  t.h1('useDebounce'),
  t.p({ class: 'description' }, 'Type to filter. The list only updates 400 ms after you stop typing.'),
  t.input({
    type: 'search',
    placeholder: 'Search people...',
    oninput: e => query.set(e.target.value),
  }),
  t.div({ class: 'signals' }, [
    t.p(['Live:      ', t.code(query)]),
    t.p(['Debounced: ', t.code(debounced)]),
  ]),
  t.ul(results.transform(items =>
    items.length
      ? items.map(name => t.li(name))
      : [t.li({ class: 'empty' }, 'No results.')],
  )),
]);

document.body.append(app.toElement());
