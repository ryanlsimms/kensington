import { t } from 'kensington';

import { code } from '../../components/ui.js';

export function examplesMissingFeatures() {
  return t.section({ id: 'missing-features' }, [
    t.h2('"Missing" features'),
    t.p([
      'These patterns from React have no direct equivalent in Kensington, but can be built in a few lines on top of ',
      t.code('signal'),
      ' and ',
      t.code('effect'),
      '.',
    ]),

    t.section({ id: 'create-context' }, [
      t.h3('createContext'),
      t.p([
        'React\'s ',
        t.code('createContext'),
        ' / ',
        t.code('useContext'),
        ' pattern can be built on top of a signal stack. Components call ',
        t.code('context.get()'),
        ' during synchronous construction to get the nearest provider\'s signal. ',
        t.code('provide(value, fn)'),
        ' wraps the value in a new signal, pushes it onto the stack, calls ',
        t.code('fn()'),
        ' to build the subtree, then pops. Consumers hold the signal reference after construction and update reactively through the normal signal subscription mechanism.',
      ]),
      code('javascript', `// create-context.js
import { signal } from 'kensington';

function createContext(defaultValue) {
  // each nested .provide call pushes a new value onto the stack at the beginning of the content block
  // and pops it off at the end of the content block
  const _stack = [signal(defaultValue)];

  return {
    get() {
      return _stack.at(-1);
    },

    provide(value, fn) {
      const ctx = signal(value);
      _stack.push(ctx);
      try {
        return fn(ctx);
      } finally {
        _stack.pop();
      }
    },

    set(val) {
      return this.get().set(val);
    },
  };
}`),
      code('javascript', `import { t } from 'kensington';
import { createContext } from './create-context.js';

const ThemeContext = createContext('light');
const UserContext = createContext({ name: 'Guest', role: 'viewer' });

function themeCard(title) {
  const theme = ThemeContext.get(); // signal reference captured at construction time; stays reactive
  return t.div({ class: theme.transform(v => \`card card--\${v}\`) }, [
    t.strong(title),
    t.small(['theme: ', theme]),
  ]);
}

function userBadge() {
  const user = UserContext.get();
  return t.span(user.transform(u => \`\${u.name} (\${u.role})\`));
}

const app = t.div([
  t.button({
    type: 'button',
    onclick: () => ThemeContext.set(v => v === 'light' ? 'dark' : 'light'),
  }, 'Toggle theme'),
  t.button({
    type: 'button',
    onclick: () => UserContext.set(u => {
      const alice = { name: 'Alice', role: 'admin' };
      const guest = { name: 'Guest', role: 'viewer' };
      return u.name === 'Guest' ? alice : guest;
    }),
  }, 'Toggle login'),

  // No provider. Reads from the default signals.
  t.section([userBadge(), themeCard('Default')]),

  // Static provide. Always dark regardless of the toggle.
  ThemeContext.provide('dark', () =>
    t.section([userBadge(), themeCard('Always dark')]),
  ),

  // User overridden. The login toggle does not affect this subtree.
  UserContext.provide({ name: 'Bob', role: 'editor' }, () =>
    t.section([userBadge(), themeCard('Bob is always the user here')]),
  ),
]);

document.body.append(app.toElement());`),
    ]),

    t.section({ id: 'use-reducer' }, [
      t.h3('useReducer'),
      t.p([
        t.code('useReducer'),
        ' centralises state transitions behind a ',
        t.code('dispatch'),
        ' function. Wrap ',
        t.code('signal.set'),
        ' with a reducer to get the same pattern: complex state machines stay readable and the call sites only send action objects.',
      ]),
      code('javascript', `// use-reducer.js
import { signal } from 'kensington';

function useReducer(reducer, initialState) {
  const state = signal(initialState);
  function dispatch(action) {
    state.set(s => reducer(s, action)); // updater form: reducer always sees the latest state
  }
  return { state, dispatch };
}`),
      code('javascript', `import { t } from 'kensington';
import { useReducer } from './use-reducer.js';

function cartReducer(state, action) {
  switch (action.type) {
    case 'add':
      return { items: [...state.items, action.item], total: state.total + action.item.price };
    case 'remove': {
      const item = state.items.find(i => i.id === action.id);
      return { items: state.items.filter(i => i.id !== action.id), total: state.total - item.price };
    }
    case 'clear':
      return { items: [], total: 0 };
    default:
      return state;
  }
}

const { state, dispatch } = useReducer(cartReducer, { items: [], total: 0 });

const products = [
  { id: 1, name: 'Widget',    price: 9.99  },
  { id: 2, name: 'Gadget',    price: 24.99 },
  { id: 3, name: 'Doohickey', price: 4.99  },
];

document.body.append(
  t.div([
    t.h2('Shop'),
    t.ul(products.map(p =>
      t.li([p.name, ' — ', t.button({ type: 'button', onclick: () => dispatch({ type: 'add', item: p }) }, 'Add')])
    )),
    t.h2('Cart'),
    t.ul(state.transform(s =>
      s.items.map(item =>
        t.li({ dataKey: item.id }, [
          item.name,
          ' ',
          t.button({ type: 'button', onclick: () => dispatch({ type: 'remove', id: item.id }) }, 'Remove'),
        ])
      )
    )),
    t.p(state.transform(s => \`Total: $\${s.total.toFixed(2)}\`)),
    t.button({ type: 'button', onclick: () => dispatch({ type: 'clear' }) }, 'Clear cart'),
  ]).toElement()
);`),
    ]),

    t.section({ id: 'use-local-storage' }, [
      t.h3('useLocalStorage'),
      t.p([
        'A signal that reads its initial value from ',
        t.code('localStorage'),
        ' and writes back on every change. The ',
        t.code('effect'),
        ' handles the sync; the rest of your code just reads and sets the signal normally. Guard the initial read with ',
        t.code('isBrowser'),
        ' so server-rendered components do not throw.',
      ]),
      code('javascript', `// use-local-storage.js
import { signal, effect, isBrowser } from 'kensington';

function useLocalStorage(key, defaultValue) {
  const stored = isBrowser ? localStorage.getItem(key) : null;
  const s = signal(stored !== null ? JSON.parse(stored) : defaultValue); // !== null: stored could be '0', 'false', etc.
  effect(() => {
    localStorage.setItem(key, JSON.stringify(s.get()));
  });
  return s;
}`),
      code('javascript', `import { t } from 'kensington';
import { useLocalStorage } from './use-local-storage.js';

const theme = useLocalStorage('theme', 'light');

document.body.append(
  t.div([
    t.p(['Current theme: ', theme]),
    t.button({
      type: 'button',
      onclick: () => theme.set(v => v === 'light' ? 'dark' : 'light'),
    }, theme.transform(v => \`Switch to \${v === 'light' ? 'dark' : 'light'} mode\`)),
  ]).toElement()
);`),
    ]),

    t.section({ id: 'use-debounce' }, [
      t.h3('useDebounce'),
      t.p([
        'Returns a derived signal that only updates after the source has been stable for ',
        t.code('delay'),
        ' milliseconds. Each time the source changes, the pending timeout is cleared and restarted. Because ',
        t.code('effect'),
        ' does not support a cleanup return value, the timeout ID lives in the enclosing closure.',
      ]),
      code('javascript', `// use-debounce.js
import { signal, effect } from 'kensington';

function useDebounce(source, delay) {
  const debounced = signal(source.get());
  let id;
  effect(() => {
    const value = source.get();
    clearTimeout(id);
    id = setTimeout(() => debounced.set(value), delay);
  });
  return debounced;
}`),
      code('javascript', `import { signal, effect, t } from 'kensington';
import { useDebounce } from './use-debounce.js';

const query    = signal('');
const debounced = useDebounce(query, 300);
const results  = signal([]);

// fetch fires only after the user pauses, not on every keystroke
effect(() => {
  const q = debounced.get();
  if (!q) { results.set([]); return; }
  fetch(\`/api/search?q=\${encodeURIComponent(q)}\`)
    .then(r => r.json())
    .then(data => results.set(data));
});

document.body.append(
  t.div([
    t.input({
      type: 'search',
      placeholder: 'Search...',
      oninput: e => query.set(e.target.value),
    }),
    t.ul(results.transform(items => items.map(r => t.li(r)))),
  ]).toElement()
);`),
    ]),

    t.section({ id: 'use-fetch' }, [
      t.h3('useFetch'),
      t.p([
        'Returns ',
        t.code('{ data, loading, error }'),
        ' signals that update as the request progresses. When the URL signal changes, the in-flight request is aborted via ',
        t.code('AbortController'),
        ' before the new one starts. The abort controller lives in the closure for the same reason as the debounce timeout -- ',
        t.code('effect'),
        ' does not support a cleanup return value.',
      ]),
      code('javascript', `// use-fetch.js
import { signal, effect } from 'kensington';

function useFetch(urlSignal) {
  const data    = signal(null);
  const loading = signal(true);
  const error   = signal(null);
  let controller;

  effect(() => {
    if (controller) controller.abort(); // cancel any in-flight request before starting a new one
    controller = new AbortController();
    loading.set(true);
    error.set(null);

    fetch(urlSignal.get(), { signal: controller.signal })
      .then(r => r.json())
      .then(json => { data.set(json); loading.set(false); })
      .catch(err => {
        if (err.name !== 'AbortError') { error.set(err.message); loading.set(false); } // AbortError is expected when we cancel; not a real failure
      });
  });

  return { data, loading, error };
}`),
      code('javascript', `import { signal, t } from 'kensington';
import { useFetch } from './use-fetch.js';

const userId = signal(1);
// derived signal: re-fetches automatically whenever userId changes
const { data, loading, error } = useFetch(userId.transform(id => \`/api/users/\${id}\`));

document.body.append(
  t.div([
    t.div([
      t.button({ type: 'button', onclick: () => userId.set(v => v - 1) }, 'Prev'),
      t.span([' User ', userId, ' ']),
      t.button({ type: 'button', onclick: () => userId.set(v => v + 1) }, 'Next'),
    ]),
    // signal content can be a tag — switches between loading, error, and data views reactively
    loading.transform(l => {
      if (l) { return t.p('Loading...'); }
      const err = error.get();
      return err ? t.p({ class: 'error' }, err) : t.pre(JSON.stringify(data.get(), null, 2));
    }),
  ]).toElement()
);`),
    ]),

    t.section({ id: 'use-id' }, [
      t.h3('useId'),
      t.p([
        'Generates a unique, stable ID for pairing form labels with inputs. A module-level counter increments once per call. On the server it produces the same sequence on every request, so IDs in SSR output and client hydration match as long as components are called in the same order.',
      ]),
      code('javascript', `// use-id.js
let _id = 0;

function useId(prefix = 'k') {
  return \`\${prefix}-\${++_id}\`;
}`),
      code('javascript', `import { t } from 'kensington';
import { useId } from './use-id.js';

function labeledInput(label, type = 'text') {
  const id = useId();
  return t.div({ class: 'field' }, [
    t.label({ for: id }, label),
    t.input({ id, type }),
  ]);
}

document.body.append(
  t.form([
    labeledInput('Full name'),
    labeledInput('Email', 'email'),
    labeledInput('Password', 'password'),
    t.button({ type: 'submit' }, 'Sign up'),
  ]).toElement()
);`),
    ]),
  ]);
}
