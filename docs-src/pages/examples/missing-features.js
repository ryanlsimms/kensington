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

export function createContext(defaultValue) {
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

export function useReducer(reducer, initialState) {
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
      t.li([p.name, ' . ', t.button({ type: 'button', onclick: () => dispatch({ type: 'add', item: p }) }, 'Add')])
    )),
    t.h2('Cart'),
    t.ul(state.transform(s =>
      s.items.map(item =>
        t.li([
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
        ' handles the sync. The rest of your code just reads and sets the signal normally. Guard both storage operations with ',
        t.code('isBrowser'),
        ' so server-side calls do not throw.',
      ]),
      code('javascript', `// use-local-storage.js
import { signal, effect, isBrowser } from 'kensington';

export function useLocalStorage(key, defaultValue) {
  const stored = isBrowser ? localStorage.getItem(key) : null;
  const s = signal(stored !== null ? JSON.parse(stored) : defaultValue); // !== null: stored could be '0', 'false', etc.
  if (isBrowser) {
    effect(() => {
      localStorage.setItem(key, JSON.stringify(s.get()));
    });
  }
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

export function useDebounce(source, delay) {
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

export function useFetch(urlSignal) {
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
    // signal content can be a tag. Switches between loading, error, and data views reactively
    loading.transform(l => {
      if (l) { return t.p('Loading...'); }
      const err = error.get();
      return err ? t.p({ class: 'error' }, err) : t.pre(JSON.stringify(data.get(), null, 2));
    }),
  ]).toElement()
);`),
    ]),

    t.section({ id: 'portal' }, [
      t.h3('Portal'),
      t.p([
        'React\'s ',
        t.code('createPortal'),
        ' renders a subtree into a DOM node outside the parent component. Kensington has no portal API because ',
        t.code('.toElement()'),
        ' returns a real DOM node. Mount it wherever you want. A two-line helper appends the node and returns a remover. Wrap the call in an ',
        t.code('effect'),
        ' to tie the mount/unmount lifecycle to a signal.',
      ]),
      code('javascript', `// portal.js
export function portal(target, fn) {
  const node = fn().toElement();
  target.append(node);
  return () => node.remove();
}`),
      code('javascript', `import { signal, effect, t } from 'kensington';
import { portal } from './portal.js';

const modalRoot = document.createElement('div');
modalRoot.id = 'modal-root';
document.body.append(modalRoot);

const isOpen = signal(false);

let remove = null;
effect(() => {
  if (isOpen.get()) {
    remove = portal(modalRoot, () =>
      t.div({
        class: 'overlay',
        onclick: e => { if (e.target === e.currentTarget) { isOpen.set(false); } },
      }, [
        t.div({ class: 'modal' }, [
          t.h2('Confirm'),
          t.p('Rendered outside the main app tree.'),
          t.button({ type: 'button', onclick: () => isOpen.set(false) }, 'Close'),
        ]),
      ]),
    );
  } else {
    remove?.();
    remove = null;
  }
});

document.body.append(
  t.button({ type: 'button', onclick: () => isOpen.set(true) }, 'Open modal').toElement(),
);`),
    ]),

    t.section({ id: 'styled' }, [
      t.h3('Styled components'),
      t.p([
        'Kensington already takes a style object on every tag (',
        t.code('{ style: { backgroundColor: \'red\' } }'),
        '). What inline styles can\'t do is pseudo-selectors, media queries, and reuse across components. ',
        t.code('styled(tag, styles)'),
        ' fills the gap. It takes a tag closure and a style object (same camelCase keys as the built-in ',
        t.code('style'),
        ' attribute, plus nested keys for pseudo-selectors and at-rules), injects a class into a shared stylesheet, and returns a new tag closure.',
      ]),
      code('javascript', `// styled.js
let _id = 0;
let _style;
const sheet = () => (_style ??= document.head.appendChild(document.createElement('style')));
const kebab = s => s.replace(/[A-Z]/g, c => \`-\${c.toLowerCase()}\`);

function toCss(selector, styles) {
  const decls = [];
  let nested = '';
  for (const [k, v] of Object.entries(styles)) {
    if (v && typeof v === 'object') {
      nested += k.startsWith('@')
        ? \`\${k} { \${toCss(selector, v)} } \`     // @media, @supports, ...
        : \`\${toCss(selector + k, v)} \`;          // :hover, > .child, &.primary, ...
    } else if (v !== null && v !== undefined && v !== false) {
      decls.push(\`\${kebab(k)}:\${v}\`);
    }
  }
  return (decls.length ? \`\${selector} { \${decls.join(';')} } \` : '') + nested;
}

// A plain attrs object is anything that isn't a tag, signal, array, or null/primitive.
// Matches how Kensington's own tag closures disambiguate (attrs, content) from (content).
function isAttrs(x) {
  return x !== null
    && typeof x === 'object'
    && !Array.isArray(x)
    && !x._isKensingtonTag
    && !x._isKensingtonSignal;
}

export function styled(tag, styles) {
  const className = \`k-\${++_id}\`;
  sheet().textContent += toCss(\`.\${className}\`, styles);
  return (...args) => {
    const hasAttrs = args.length > 0 && isAttrs(args[0]);
    const attrs = hasAttrs ? args[0] : {};
    const rest = hasAttrs ? args.slice(1) : args;
    const merged = { ...attrs, class: [className, attrs.class].filter(Boolean) };
    return tag(merged, ...rest);
  };
}`),
      t.p([
        'The returned tag is a plain Kensington tag closure. It takes the same arguments any tag does, ',
        'and any extra props the caller passes (attributes, event handlers, content) flow through unchanged.',
      ]),
      code('javascript', `import { signal, t } from 'kensington';
import { styled } from './styled.js';

const Card = styled(t.section, {
  background: 'white',
  borderRadius: '0.5rem',
  padding: '1rem',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
});

const Button = styled(t.button, {
  background: 'hsl(220 10% 90%)',
  color: 'hsl(220 10% 20%)',
  border: 0,
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  ':hover':         { background: 'hsl(220 10% 85%)' },
  ':focus-visible': { outline: '2px solid hsl(220 80% 70%)' },
});

// Caller passes ordinary props: attributes, on-handlers, signal content.
const count = signal(0);
Button({ type: 'button', onclick: () => count.set(n => n + 1) }, [
  count.transform(n => \`Clicked \${n} times\`),
]);`),
      t.h4('Extending a styled component'),
      t.p([
        'Passing a styled tag as the first argument to ',
        t.code('styled'),
        ' composes them. Both classes apply, and later-defined styles win by source order in the stylesheet. No new helper, no new API.',
      ]),
      code('javascript', `const PrimaryButton = styled(Button, {
  background: 'hsl(220 80% 50%)',
  color: 'white',
  ':hover': { background: 'hsl(220 80% 40%)' },
});

const DangerButton = styled(Button, {
  background: 'hsl(0 70% 50%)',
  color: 'white',
  ':hover': { background: 'hsl(0 70% 40%)' },
});

// Each carries Button's base styles AND its own overrides.
Card([
  t.h2('Confirm'),
  PrimaryButton({ type: 'button' }, 'Save'),
  DangerButton({ type: 'button' }, 'Delete'),
]);`),
      t.h4('Variant props'),
      t.p([
        'For per-call variants, declare modifier classes inside the styles object and let the caller pick one. Combine with signal-derived ',
        t.code('class'),
        ' arrays for reactive variants.',
      ]),
      code('javascript', `const Alert = styled(t.div, {
  padding: '0.75rem 1rem',
  borderRadius: '4px',
  borderLeft: '4px solid',
  '.info':    { background: 'hsl(220 80% 95%)', borderLeftColor: 'hsl(220 80% 50%)' },
  '.warn':    { background: 'hsl(40 90% 95%)',  borderLeftColor: 'hsl(40 90% 50%)'  },
  '.error':   { background: 'hsl(0 80% 95%)',   borderLeftColor: 'hsl(0 80% 50%)'   },
});

const level = signal('info');

Alert({ class: level }, level.transform(l => \`Status: \${l}\`));`),
      t.p([
        'Reactive ',
        t.code('class'),
        ' values are already first-class in Kensington. Flipping ',
        t.code('level.set(\'warn\')'),
        ' swaps the modifier class on the live element. The static base styles live in the generated class once.',
      ]),
    ]),

    t.section({ id: 'use-id' }, [
      t.h3('useId'),
      t.p([
        'Generates unique IDs for pairing form labels with inputs. Keep the counter in a factory instead of module scope: a client-only app can create one factory for its lifetime, while an SSR app should create a fresh factory for each request and another fresh factory before hydrating that response. Server and client IDs match when components are constructed in the same order.',
      ]),
      code('javascript', `// use-id.js
export function createIdFactory(prefix = 'k') {
  let id = 0;
  return () => \`\${prefix}-\${++id}\`;
}`),
      code('javascript', `import { t } from 'kensington';
import { createIdFactory } from './use-id.js';

const useId = createIdFactory();

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
