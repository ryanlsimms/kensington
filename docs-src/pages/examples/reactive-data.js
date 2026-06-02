import { code, panels } from '../../components/ui.js';

export function examplesReactiveData(t) {
  return t.section({ id: 'reactive-data' }, [
    t.h2('Reactive data'),

    t.section({ id: 'counter' }, [
      t.h3('Counter'),
      t.p([
        'A basic counter using ',
        t.code('signal'),
        ', ',
        t.code('computed'),
        ', and ',
        t.code('effect'),
        '. Multiple synchronous ',
        t.code('set()'),
        ' calls batch into a single DOM update via microtask.',
      ]),
      code(t, 'javascript', `import { t, signal, computed, effect } from 'kensington';

const count = signal(0);
const label = computed(() => count.get() === 1 ? 'click' : 'clicks');

effect(() => {
  document.title = \`\${count.get()} \${label.get()}\`;
});

const app = t.div({ class: 'counter' }, [
  t.p([count, ' ', label]),
  t.button({ type: 'button', onclick: () => count.set(n => n + 1) }, '+'),
  t.button({ type: 'button', onclick: () => count.set(n => n - 1) }, '-'),
  t.button({ type: 'button', onclick: () => count.set(0) }, 'Reset'),
]);

document.body.append(app.toElement());`),
    ]),

    t.section({ id: 'live-filter' }, [
      t.h3('Live filter'),
      t.p([
        'A signal holds the search query. A ',
        t.code('computed'),
        ' signal derives the visible rows. Passing the computed signal as content means the table body updates automatically as the user types, with no manual DOM writes needed.',
      ]),
      code(t, 'javascript', `import { t, signal, computed } from 'kensington';

const people = [
  { name: 'Alice', role: 'Admin'  },
  { name: 'Bob',   role: 'Editor' },
  { name: 'Carol', role: 'Viewer' },
  { name: 'Dave',  role: 'Editor' },
  { name: 'Eve',   role: 'Admin'  },
];

const query = signal('');

const rows = computed(() => {
  const q = query.get().toLowerCase();
  return people
    .filter(p => !q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q))
    .map(p => t.tr([t.td(p.name), t.td(p.role)]));
});

document.body.append(
  t.div([
    t.input({
      type: 'search',
      placeholder: 'Filter by name or role...',
      oninput: e => query.set(e.target.value),
    }),
    t.table([
      t.thead(t.tr([t.th('Name'), t.th('Role')])),
      t.tbody(rows),
    ]),
  ]).toElement()
);`),
    ]),

    t.section({ id: 'todo-list' }, [
      t.h3('Todo list'),
      t.p([
        'A signal holds the todo array. ',
        t.code('.transform()'),
        ' derives a signal of rendered list items. Adding ',
        t.code('dataKey'),
        ' to each item lets the reconciler match nodes by key on re-render, so only changed items are written to the DOM.',
      ]),
      code(t, 'javascript', `import { t, signal } from 'kensington';

let nextId = 1;
const todos = signal([
  { id: nextId++, text: 'Buy groceries', done: false },
]);

function addTodo(text) {
  todos.set(list => [...list, { id: nextId++, text, done: false }]);
}

function toggleTodo(id) {
  todos.set(list =>
    list.map(item => item.id === id ? { ...item, done: !item.done } : item)
  );
}

function removeTodo(id) {
  todos.set(list => list.filter(item => item.id !== id));
}

const rows = todos.transform(list =>
  list.map(item =>
    t.li({ dataKey: item.id }, [
      t.span({ style: { textDecoration: item.done ? 'line-through' : 'none' } }, item.text),
      t.button({ type: 'button', onclick: () => toggleTodo(item.id) }, 'Done'),
      t.button({ type: 'button', onclick: () => removeTodo(item.id) }, 'Remove'),
    ])
  )
);

const input = t.input({ type: 'text', placeholder: 'New item...' });

document.body.append(
  t.div([
    t.div([
      input,
      t.button({
        type: 'button',
        onclick: () => {
          const el = input.getDomElement();
          if (el?.value.trim()) { addTodo(el.value.trim()); el.value = ''; }
        },
      }, 'Add'),
    ]),
    t.ul(rows),
  ]).toElement()
);`),
    ]),

    t.section({ id: 'editable-rows' }, [
      t.h3('Editable list rows'),
      t.p([
        'Each row has its own edit mode that does not belong on the outer data array. ',
        t.code('signal(false, item.id)'),
        ' inside the ',
        t.code('computed'),
        ' scopes the per-row state to the surrounding computed so the same signal instance is reused for the same key across renders. State persists when other rows change, and the keyed signal is stopped automatically when its row leaves the list.',
      ]),
      code(t, 'javascript', `import { t, signal, computed } from 'kensington';

const items = signal([
  { id: 1, label: 'Apples' },
  { id: 2, label: 'Bananas' },
  { id: 3, label: 'Cherries' },
]);

function rename(id, label) {
  items.set(list => list.map(it => it.id === id ? { ...it, label } : it));
}

const rows = computed(() => items.get().map(item => {
  // Keyed per row. Same signal instance returned across re-runs for the same item.id.
  const editing = signal(false, item.id);

  return t.li({ dataKey: item.id }, [
    computed(() => editing.get()
      ? t.input({
          type: 'text',
          value: item.label,
          onblur: e => { rename(item.id, e.target.value); editing.set(false); },
        })
      : t.span({ onclick: () => editing.set(true) }, item.label)
    ),
  ]);
}));

document.body.append(t.ul(rows).toElement());`),
      t.p([
        'Click a row to edit, blur to save. Adding or removing items elsewhere in the list does not collapse a row that is currently being edited, because each row\'s ',
        t.code('editing'),
        ' signal kept its identity across the re-render.',
      ]),
    ]),

    t.section({ id: 'dark-mode' }, [
      t.h3('Dark mode'),
      t.p([
        t.code('effect'),
        ' is the right tool when a signal needs to drive something outside the reactive tree. Here it toggles a class on ',
        t.code('document.documentElement'),
        '. The button label is a ',
        t.code('computed'),
        ' that flips with the signal.',
      ]),
      code(t, 'javascript', `import { t, signal, computed, effect } from 'kensington';

const dark = signal(matchMedia('(prefers-color-scheme: dark)').matches);

effect(() => {
  document.documentElement.classList.toggle('dark', dark.get());
});

const label = computed(() => dark.get() ? 'Light mode' : 'Dark mode');

document.body.append(
  t.button({ type: 'button', onclick: () => dark.set(v => !v) }, label).toElement()
);`),
    ]),

    t.section({ id: 'character-counter' }, [
      t.h3('Character counter'),
      t.p([
        t.code('.transform()'),
        ' derives the CSS class directly from the remaining count. Passing the ',
        t.code('remaining'),
        ' signal as content means the number updates in place without replacing surrounding text nodes.',
      ]),
      code(t, 'javascript', `import { t, signal, computed } from 'kensington';

const MAX = 280;
const text = signal('');
const remaining = computed(() => MAX - text.get().length);

document.body.append(
  t.div([
    t.textarea({
      rows: 4,
      placeholder: 'Type something...',
      oninput: e => text.set(e.target.value),
    }),
    t.p({
      class: remaining.transform(n => n < 0 ? 'counter counter--over' : 'counter'),
    }, [remaining, ' characters remaining']),
  ]).toElement()
);`),
    ]),

    t.section({ id: 'incremental-search' }, [
      t.h3('Incremental search'),
      t.p([
        'When the new query extends the previous one (e.g. ',
        t.code('"cat"'),
        ' to ',
        t.code('"cats"'),
        '), existing results can be filtered client-side instantly with no spinner.',
      ]),
      t.aside(
        t.p([
          t.code('previousTerm'),
          ' is read via ',
          t.code('.value'),
          ' rather than ',
          t.code('.get()'),
          '. If ',
          t.code('.get()'),
          ' were used, calling ',
          t.code('previousTerm.set(current)'),
          ' inside the fetch callback would re-trigger the effect and fire a duplicate request for every search. ',
          t.code('previousTerm'),
          ' cannot be a plain variable because it is shown reactively in the UI. The updater pattern cannot help because ',
          t.code('previousTerm'),
          ' is being read to compute ',
          t.code('isRefinement'),
          ', not written back to itself.',
        ])
      ),
      code(t, 'javascript', `import { t, signal, computed, effect } from 'kensington';

const searchTerm   = signal('');
const previousTerm = signal('');
const results      = signal([]);
const isLoading    = signal(false);

const status = computed(() =>
  isLoading.get() ? 'Loading...' : \`\${results.get().length} result(s)\`
);

effect(() => {
  const current = searchTerm.get();
  if (!current.trim()) return;

  // previousTerm must be a signal -- it is shown reactively in the UI below.
  // .value reads it without subscribing, so previousTerm.set(current) inside
  // the fetch callback does not re-trigger this effect and fire a duplicate request.
  const previous = previousTerm.value;
  const isRefinement = previous.length > 0 && current.startsWith(previous);

  if (!isRefinement) {
    isLoading.set(true);
  }

  fetch(\`/search?q=\${encodeURIComponent(current)}\`)
    .then(r => r.json())
    .then(data => {
      results.set(data);
      previousTerm.set(current);
      isLoading.set(false);
    });
});

document.body.append(
  t.div([
    t.input({
      type: 'search',
      placeholder: 'Search...',
      oninput: e => searchTerm.set(e.target.value),
    }),
    t.p(status),
    t.p(previousTerm.transform(p => p ? \`Previous search: "\${p}"\` : '')),
    t.ul(results.transform(items =>
      items.map((item, i) => t.li({ dataKey: i }, item.title))
    )),
  ]).toElement()
);`),
    ]),

    t.section({ id: 'sortable-table' }, [
      t.h3('Sortable table'),
      t.p([
        'Two signals, sort column and sort direction, drive both the data rows and the column headers. Each header creates its own ',
        t.code('computed'),
        ' that tracks only the signals it actually reads: the active header tracks both, inactive headers track only ',
        t.code('sortCol'),
        '. Stale subscriptions are cleaned up automatically between runs.',
      ]),
      code(t, 'javascript', `import { t, signal, computed } from 'kensington';

const people = [
  { name: 'Alice', age: 32, role: 'Admin'  },
  { name: 'Bob',   age: 28, role: 'Editor' },
  { name: 'Carol', age: 41, role: 'Viewer' },
  { name: 'Dave',  age: 25, role: 'Editor' },
];

const sortCol = signal('name');
const sortAsc = signal(true);

const rows = computed(() => {
  const col = sortCol.get();
  const asc = sortAsc.get();
  return [...people]
    .sort((a, b) => {
      const cmp = String(a[col]).localeCompare(String(b[col]));
      return asc ? cmp : -cmp;
    })
    .map(p => t.tr([t.td(p.name), t.td(String(p.age)), t.td(p.role)]));
});

function sortHeader(col, label) {
  const heading = computed(() =>
    sortCol.get() === col
      ? \`\${label} \${sortAsc.get() ? '↑' : '↓'}\`
      : label
  );
  return t.th({
    style: { cursor: 'pointer' },
    onclick: () => {
      if (sortCol.get() === col) {
        sortAsc.set(v => !v);
      } else {
        sortCol.set(col);
        sortAsc.set(true);
      }
    },
  }, heading);
}

document.body.append(
  t.table([
    t.thead(t.tr([
      sortHeader('name', 'Name'),
      sortHeader('age', 'Age'),
      sortHeader('role', 'Role'),
    ])),
    t.tbody(rows),
  ]).toElement()
);`),
    ]),

    t.section({ id: 'static-tab-switcher' }, [
      t.h3('Static HTML tab switcher'),
      t.p([
        'When the page is mostly static HTML, a signal and a few ',
        t.code('effect()'),
        ' calls are enough to add interactivity without rebuilding the markup with Kensington. Here a signal holds the active tab key, and each tab button and content panel reads the signal in its own ',
        t.code('effect'),
        ' to update its class. The initial active tab is read from the HTML itself so the page works before JavaScript runs.',
      ]),
      panels(t, [
        {
          label: 'HTML',
          content: code(t, 'html', `<nav class="tabs">
  <button class="tab tab--active" data-tab="overview">Overview</button>
  <button class="tab" data-tab="install">Install</button>
  <button class="tab" data-tab="api">API</button>
</nav>
<div class="panel" data-panel="overview">Overview content...</div>
<div class="panel panel--hidden" data-panel="install">Install content...</div>
<div class="panel panel--hidden" data-panel="api">API content...</div>`),
        },
        {
          label: 'JavaScript',
          content: code(t, 'javascript', `import { signal, effect } from 'kensington';

// Read the initial active tab from the DOM so the page is valid before JS runs.
const activeTab = signal(
  document.querySelector('.tab--active')?.dataset.tab ?? 'overview'
);

document.querySelectorAll('[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => activeTab.set(btn.dataset.tab));
  effect(() => {
    btn.classList.toggle('tab--active', btn.dataset.tab === activeTab.get());
  });
});

document.querySelectorAll('[data-panel]').forEach(panel => {
  effect(() => {
    panel.classList.toggle('panel--hidden', panel.dataset.panel !== activeTab.get());
  });
});`),
        },
      ]),
    ]),

    t.section({ id: 'static-accordion' }, [
      t.h3('Static HTML accordion'),
      t.p([
        'Each accordion item gets its own ',
        t.code('signal'),
        ', created from its initial ',
        t.code('aria-expanded'),
        ' attribute. An ',
        t.code('effect'),
        ' keeps the attribute and the ',
        t.code('hidden'),
        ' property on the panel in sync as the signal changes. The pattern scales to any number of items with no shared state.',
      ]),
      panels(t, [
        {
          label: 'HTML',
          content: code(t, 'html', `<div class="accordion">
  <button class="accordion-toggle"
    aria-expanded="false"
    aria-controls="panel-1">What is Kensington?</button>
  <div id="panel-1" class="accordion-panel" hidden>
    An HTML library for Node and the browser.
  </div>
</div>
<div class="accordion">
  <button class="accordion-toggle"
    aria-expanded="true"
    aria-controls="panel-2">Does it require a build step?</button>
  <div id="panel-2" class="accordion-panel">
    No. Import it directly from npm or a CDN.
  </div>
</div>`),
        },
        {
          label: 'JavaScript',
          content: code(t, 'javascript', `import { signal, effect } from 'kensington';

document.querySelectorAll('.accordion-toggle').forEach(btn => {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  const open = signal(btn.getAttribute('aria-expanded') === 'true');

  btn.addEventListener('click', () => open.set(v => !v));

  effect(() => {
    const isOpen = open.get();
    btn.setAttribute('aria-expanded', String(isOpen));
    panel.hidden = !isOpen;
  });
});`),
        },
      ]),
    ]),

    t.section({ id: 'hydrated-like-button' }, [
      t.h3('Hydrated component'),
      t.p([
        'A like button rendered on the server with real data, then picked up on the client as a live reactive component. The component function is identical in both environments: ',
        t.code('renderForHydration'),
        ' embeds the initial state and ',
        t.code('registerComponents'),
        ' mounts it reactively. The click handler applies an optimistic update and reverts if the request fails.',
      ]),
      code(t, 'javascript', `// components/like-button.js
import { t, signal } from 'kensington';

export function likeButton({ postId, likeCount, userLiked }) {
  const likes = signal(likeCount);
  const liked = signal(userLiked);

  function toggle() {
    const next = !liked.get();
    liked.set(next);
    likes.set(n => n + (next ? 1 : -1));

    fetch(\`/api/posts/\${postId}/like\`, { method: next ? 'POST' : 'DELETE' })
      .catch(() => {
        liked.set(!next);
        likes.set(n => n + (next ? -1 : 1));
      });
  }

  return t.button({
    type: 'button',
    class: liked.transform(v => v ? 'like-btn like-btn--active' : 'like-btn'),
    ariaPressed: liked.transform(String),
    onclick: toggle,
  }, [t.span({ ariaHidden: 'true' }, '♥'), ' ', likes]);
}`),
      panels(t, [
        {
          label: 'server.js',
          content: code(t, 'javascript', `import { renderForHydration, t } from 'kensington';
import { likeButton } from './components/like-button.js';

app.get('/posts/:id', async (req, res) => {
  const post = await db.getPost(req.params.id);
  const userLiked = await db.hasLiked(req.user?.id, post.id);

  res.send(
    t.htmlWithDocType({ lang: 'en' }, [
      t.head([
        t.meta({ charset: 'utf-8' }),
        t.title(post.title),
        t.script({ src: '/client.js', type: 'module' }),
      ]),
      t.body(
        t.article([
          t.h1(post.title),
          renderForHydration(likeButton, {
            postId: post.id,
            likeCount: post.likeCount,
            userLiked,
          }),
        ])
      ),
    ]).toString()
  );
});`),
        },
        {
          label: 'client.js',
          content: code(t, 'javascript', `import { registerComponents } from 'kensington';
import { likeButton } from './components/like-button.js';

registerComponents({ likeButton });`),
        },
      ]),
    ]),

    t.section({ id: 'hydrated-form-validation' }, [
      t.h3('Form with server-side validation'),
      t.p([
        'The form is rendered on the server with ',
        t.code('renderForHydration'),
        ' and mounted as a reactive component on the client. Submitting calls ',
        t.code('fetch'),
        ' with the form data as JSON. On validation failure the server returns ',
        t.code('{ errors }'),
        ' and the ',
        t.code('errors'),
        ' signal updates, reactively showing each message and adding an error class to the affected field. Input values are preserved because the form element stays in place. On success the server returns ',
        t.code('{ success: true }'),
        ' and the client navigates away.',
      ]),
      code(t, 'javascript', `// components/registration-form.js
import { t, signal } from 'kensington';

export function registrationForm() {
  const errors = signal({});

  async function submit(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.errors) {
      errors.set(data.errors);
    } else {
      window.location = '/register/success';
    }
  }

  return t.form({ class: 'form', onsubmit: submit }, [
    formField('name',     'Full name', 'text',     errors),
    formField('email',    'Email',     'email',    errors),
    formField('password', 'Password',  'password', errors),
    t.button({ type: 'submit' }, 'Create account'),
  ]);
}

function formField(name, label, type, errors) {
  const error = errors.transform(e => e[name]);
  return t.div({
    class: error.transform(e => e ? 'field field--error' : 'field'),
  }, [
    t.label({ for: name }, label),
    t.input({ id: name, name, type }),
    error.transform(e => e ? t.p({ class: 'field-error' }, e) : null),
  ]);
}`),
      panels(t, [
        {
          label: 'server.js',
          content: code(t, 'javascript', `import { renderForHydration, t } from 'kensington';
import { registrationForm } from './components/registration-form.js';

app.use(express.json());

app.get('/register', (req, res) => {
  res.send(layout('Register', renderForHydration(registrationForm, {})));
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const errors = {};

  if (!name?.trim())
    errors.name = 'Name is required.';
  if (!email?.includes('@'))
    errors.email = 'Enter a valid email address.';
  if ((password?.length ?? 0) < 8)
    errors.password = 'Password must be at least 8 characters.';

  if (Object.keys(errors).length) {
    return res.json({ errors });
  }

  await db.createUser({ name, email, password });
  res.json({ success: true });
});`),
        },
        {
          label: 'client.js',
          content: code(t, 'javascript', `import { registerComponents } from 'kensington';
import { registrationForm } from './components/registration-form.js';

registerComponents({ registrationForm });`),
        },
      ]),
    ]),

    t.section({ id: 'lifecycle-widget' }, [
      t.h3('Lifecycle widget'),
      t.p([
        'A polling component that uses ',
        t.code('addConnectedCallback'),
        ' to start a data fetch loop when mounted, and ',
        t.code('addDisconnectedCallback'),
        ' to stop it when removed. ',
        t.code('persist: true'),
        ' keeps the element\'s signal effects paused rather than destroyed on DOM removal, so the element can be re-inserted and resume reactivity. The connected and disconnected callbacks re-fire on each cycle as part of that mechanism.',
      ]),
      code(t, 'javascript', `import { t, signal } from 'kensington';

function PriceTicker({ symbol }) {
  const price = signal('--');
  const direction = signal(0);
  let prevPrice = null;
  let pollId = null;

  const ticker = t.div(
    { class: 'ticker', persist: true },
    [
      t.span({ class: 'symbol' }, symbol),
      t.span({ class: 'price' }, price),
      t.span(
        { class: direction.transform(d => d > 0 ? 'up' : d < 0 ? 'down' : 'flat') },
        direction.transform(d => d > 0 ? '▲' : d < 0 ? '▼' : '–'),
      ),
    ],
  );

  ticker.addConnectedCallback(function() {
    async function poll() {
      const res = await fetch(\`/api/price/\${symbol}\`);
      const { price: p } = await res.json();
      if (prevPrice !== null) { direction.set(Math.sign(p - prevPrice)); }
      price.set(p.toFixed(2));
      prevPrice = p;
    }
    poll();
    pollId = setInterval(poll, 5000);
  });

  ticker.addDisconnectedCallback(() => {
    clearInterval(pollId);
  });

  return ticker.toElement();
}`),
    ]),

    t.section({ id: 'effect-resume' }, [
      t.h3('Effect pause and resume'),
      t.p([
        t.code('effect()'),
        ' returns an object with ',
        t.code('stop()'),
        ' and ',
        t.code('resume()'),
        '. ',
        t.code('stop()'),
        ' unsubscribes the effect from all signals so it stops reacting to changes. ',
        t.code('resume()'),
        ' re-runs the callback and re-establishes subscriptions. Together they let you pause and restart a single effect object without creating a new one on every cycle.',
      ]),
      t.p([
        'The natural home for this is a hand-written web component. The render effect is created once in the constructor and started stopped. ',
        t.code('connectedCallback'),
        ' resumes it; ',
        t.code('disconnectedCallback'),
        ' stops it again so signal updates do not fire against a detached element.',
      ]),
      code(t, 'javascript', `import { signal, effect } from 'kensington';

class LiveClock extends HTMLElement {
  #time = signal('');
  #tickId = null;
  #render;

  constructor() {
    super();
    this.#render = effect(() => {
      this.textContent = this.#time.get();
    });
    this.#render.pause(); // start paused; do not render until connected
  }

  connectedCallback() {
    this.#render.resume();
    const tick = () => this.#time.set(new Date().toLocaleTimeString());
    tick();
    this.#tickId = setInterval(tick, 1000);
  }

  disconnectedCallback() {
    this.#render.pause();
    clearInterval(this.#tickId);
  }
}

customElements.define('live-clock', LiveClock);`),
      t.p([
        'The effect is defined once, created once, and reused across every connection cycle. Without ',
        t.code('resume()'),
        ' you would call ',
        t.code('effect(...)'),
        ' again inside ',
        t.code('connectedCallback'),
        ' on every reconnection, discarding the previous effect object each time.',
      ]),
    ]),

    t.section({ id: 'spa-router' }, [
      t.h3('Single-page app router'),
      t.p([
        'A minimal client-side router built on ',
        t.code('history.pushState'),
        ' and the ',
        t.code('popstate'),
        ' event. The current route is held in a signal so any ',
        t.code('effect'),
        ' or ',
        t.code('computed'),
        ' that reads it re-runs automatically when the URL changes.',
      ]),
      code(t, 'javascript', `import { t, signal, effect } from 'kensington';

function parseRoute() {
  const [path, search] = window.location.pathname.split('?');
  const params = Object.fromEntries(new URLSearchParams(search));
  const segments = path.split('/').filter(Boolean);
  return { path, segments, params };
}

const route = signal(parseRoute());

function navigate(path) {
  history.pushState(null, '', path);
  route.set(parseRoute());
}

window.addEventListener('popstate', () => route.set(parseRoute()));

// Intercept same-origin <a> clicks so internal links do not cause full reloads.
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || a.origin !== location.origin || a.hasAttribute('download')) return;
  e.preventDefault();
  navigate(a.pathname + a.search);
});

const app = document.getElementById('app');

effect(() => {
  const { path } = route.get();
  let view;

  if (path === '/') {
    view = homePage();
  } else if (path.startsWith('/user/')) {
    const id = path.split('/')[2];
    view = userPage(id);
  } else {
    view = notFound();
  }

  app.replaceChildren(view.toElement());
});

function homePage() {
  return t.main([
    t.h1('Home'),
    t.nav([
      t.a({ href: '/user/1' }, 'User 1'),
      ' ',
      t.a({ href: '/user/2' }, 'User 2'),
    ]),
  ]);
}

function userPage(id) {
  return t.main([
    t.h1(\`User \${id}\`),
    t.a({ href: '/' }, 'Back'),
  ]);
}

function notFound() {
  return t.main(t.h1('404 - Not found'));
}`),
      t.p([
        'The ',
        t.code('click'),
        ' interceptor is the part most often omitted. Without it, internal links trigger a full page reload even with ',
        t.code('pushState'),
        ' in place. The ',
        t.code('a.origin !== location.origin'),
        ' check lets external links and ',
        t.code('target="_blank"'),
        ' links through unmodified.',
      ]),
    ]),
  ]);
}
