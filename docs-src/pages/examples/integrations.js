import { t } from 'kensington';

import { code } from '../../components/ui.js';

export function examplesIntegrations() {
  return t.section({ id: 'integrations' }, [
    t.h2('Integrations'),

    t.section({ id: 'htmx' }, [
      t.h3('htmx'),
      t.p([
        'Pass ',
        t.code("'hx'"),
        ' to ',
        t.code('additionalNamespaces'),
        ' to allow ',
        t.code('hx-*'),
        ' attributes. Alpine.js uses ',
        t.code("'x'"),
        '.',
      ]),
      code('javascript', `import Kensington from 'kensington';

const t = new Kensington({ additionalNamespaces: ['hx'] });

// Live search: htmx swaps in the result fragment
t.div([
  t.input({
    type: 'search',
    name: 'q',
    placeholder: 'Search...',
    hx: {
      get: '/search',
      trigger: 'input changed delay:300ms',
      target: '#results',
    },
  }),
  t.ul({ id: 'results' }),
]);

// The partial route returns just the <li> items (htmx swaps them into the <ul>)
app.get('/search', async (req, res) => {
  const rows = await db.search(req.query.q);
  res.send(rows.map(r => t.li(r.name)).join('\\n'));
});`),
    ]),

    t.section({ id: 'tailwind' }, [
      t.h3('Tailwind CSS'),
      t.p([
        'The ',
        t.code('class'),
        ' array is a natural fit for Tailwind. Falsy entries are dropped, so conditional classes don\'t need ternaries or string concatenation.',
      ]),
      code('javascript', `import { t } from 'kensington';

function button(label, { variant = 'primary', disabled = false } = {}) {
  return t.button({
    type: 'button',
    disabled,
    class: [
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
      variant === 'primary'   && 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      variant === 'secondary' && 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
      variant === 'danger'    && 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      disabled && 'opacity-50 cursor-not-allowed',
    ],
  }, label);
}

function card(title, body) {
  return t.div({ class: 'rounded-lg border border-gray-200 bg-white shadow-sm p-6' }, [
    t.h3({ class: 'text-lg font-semibold text-gray-900 mb-2' }, title),
    t.div({ class: 'text-gray-600 text-sm' }, body),
  ]);
}

function alert(message, type = 'info') {
  const styles = {
    info:    'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error:   'bg-red-50 text-red-800 border-red-200',
  };
  return t.div({ class: \`rounded-md border px-4 py-3 text-sm \${styles[type]}\` }, message);
}

t.div({ class: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' }, [
  t.h1({ class: 'text-3xl font-bold text-gray-900 mb-6' }, 'Dashboard'),
  alert('Your trial expires in 3 days.', 'warning'),
  t.div({ class: 'mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' }, [
    card('Users', '1,284 total'),
    card('Revenue', '$24,500 this month'),
    card('Active sessions', '42 right now'),
  ]),
  t.div({ class: 'mt-8 flex gap-3' }, [
    button('Save changes'),
    button('Cancel', { variant: 'secondary' }),
    button('Delete account', { variant: 'danger' }),
  ]),
]);`),
    ]),

    t.section({ id: 'alpine' }, [
      t.h3('Alpine.js'),
      t.p([
        'Pass ',
        t.code("'x'"),
        ' to ',
        t.code('additionalNamespaces'),
        ' to allow ',
        t.code('x-*'),
        ' attributes. The camelCase conversion handles ',
        t.code('xOn'),
        ', ',
        t.code('xBind'),
        ', ',
        t.code('xShow'),
        ', etc. automatically.',
      ]),
      code('javascript', `import Kensington from 'kensington';

const t = new Kensington({ additionalNamespaces: ['x'] });

// Dropdown menu
function dropdown(label, items) {
  return t.div({ xData: '{ open: false }', class: 'dropdown' }, [
    t.button({
      type: 'button',
      x: {
        on: { click: 'open = !open' },
        bind: { ariaExpanded: 'open' },
      },
    }, label),
    t.ul({
      x: {
        show: 'open',
        on: { 'click.outside': 'open = false' },
      },
      class: 'dropdown-menu',
    }, items.map(item =>
      t.li(t.a({ href: item.href }, item.label))
    )),
  ]);
}

// Tabs
function tabs(items) {
  return t.div({ xData: '{ active: 0 }', class: 'tabs' }, [
    t.div({ class: 'tab-list', role: 'tablist' },
      items.map((item, i) =>
        t.button({
          type: 'button',
          role: 'tab',
          x: {
            on: { click: \`active = \${i}\` },
            bind: { class: \`active === \${i} ? 'tab--active' : ''\` },
          },
        }, item.label)
      )
    ),
    t.div({ class: 'tab-panels' },
      items.map((item, i) =>
        t.div({ role: 'tabpanel', xShow: \`active === \${i}\` }, item.content)
      )
    ),
  ]);
}`),
    ]),

    t.section({ id: 'elysia' }, [
      t.h3('Elysia'),
      t.p([
        'Elysia runs on Bun. Pass the tag\'s string representation to ',
        t.code('new Response()'),
        ' and set the content-type header manually, since Elysia doesn\'t have a dedicated HTML response method.',
      ]),
      code('javascript', `import { Elysia } from 'elysia';
import { t } from 'kensington';
import { layout } from './layout.js';

const app = new Elysia()
  .get('/', () => new Response(
    layout('Home', t.h1('Welcome')),
    { headers: { 'content-type': 'text/html; charset=utf-8' } }
  ))
  .get('/users', async () => {
    const users = await db.getUsers();
    return new Response(
      layout('Users', [
        t.h1('Users'),
        t.ul(users.map(u => t.li(u.name))),
      ]),
      { headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  })
  .listen(3000);`),
    ]),

    t.section({ id: 'hono' }, [
      t.h3('Hono'),
      t.p([
        t.a({ href: 'https://hono.dev', target: '_blank', rel: 'noopener' }, 'Hono'),
        ' runs on Node, Bun, Deno, and Cloudflare Workers. Use ',
        t.code('c.html()'),
        ' to send a Kensington string as an HTML response.',
      ]),
      code('javascript', `import { Hono } from 'hono';
import { t } from 'kensington';
import { layout } from './layout.js';

const app = new Hono();

app.get('/', c => c.html(
  layout('Home', t.h1('Welcome'))
));

app.get('/users/:id', async c => {
  const user = await db.getUser(c.req.param('id'));
  return c.html(
    layout(user.name, [
      t.h1(user.name),
      t.p(user.bio),
    ])
  );
});

export default app;`),
      t.p([
        'For Cloudflare Workers, export ',
        t.code('app'),
        ' as the default and set ',
        t.code('compatibility_date'),
        ' in ',
        t.code('wrangler.toml'),
        '. The same Kensington code runs unchanged across every Hono runtime.',
      ]),
    ]),

    t.section({ id: 'navigo' }, [
      t.h3('Navigo'),
      t.p([
        t.a({ href: 'https://github.com/krasimir/navigo', target: '_blank', rel: 'noopener' }, 'Navigo'),
        ' is a small (~4 kb) client-side router with named routes, guards, and a ',
        t.code('navigate()'),
        ' helper. Wire its route callbacks into a signal and the rest of your UI reacts automatically.',
      ]),
      code('javascript', `import { t, signal, effect } from 'kensington';
import Navigo from 'navigo';

const route = signal({ page: 'home', params: {} });

const router = new Navigo('/');

router
  .on('/',         ()         => route.set({ page: 'home',     params: {} }))
  .on('/user/:id', ({ data }) => route.set({ page: 'user',     params: data }))
  .on('/settings', ()         => route.set({ page: 'settings', params: {} }))
  .notFound(()                => route.set({ page: '404',      params: {} }))
  .resolve();

const app = document.getElementById('app');

effect(() => {
  const { page, params } = route.get();
  const views = {
    home:     () => homePage(),
    user:     () => userPage(params.id),
    settings: () => settingsPage(),
    '404':    () => notFound(),
  };
  app.replaceChildren((views[page] ?? views['404'])().toElement());
});

function homePage() {
  return t.main([
    t.h1('Home'),
    t.nav([
      t.a({ dataNavigo: true, href: '/user/1' }, 'User 1'),
      ' ',
      t.a({ dataNavigo: true, href: '/settings' }, 'Settings'),
    ]),
  ]);
}

function userPage(id) {
  return t.main([
    t.h1(\`User \${id}\`),
    t.a({ dataNavigo: true, href: '/' }, 'Back'),
  ]);
}

function settingsPage() {
  return t.main([t.h1('Settings')]);
}

function notFound() {
  return t.main([t.h1('404 - Not found')]);
}`),
      t.p([
        'Navigo intercepts link clicks itself when you use its ',
        t.code('navigate()'),
        ' method or annotate links with ',
        t.code('data-navigo'),
        ', so the manual ',
        t.code('click'),
        ' delegation from the pushState example is not needed here.',
      ]),
    ]),

    t.section({ id: 'web-components' }, [
      t.h3('Web Components'),
      t.p([
        'Kensington and signals map naturally onto the custom element lifecycle. Build the element tree with ',
        t.code('toElement()'),
        ' in ',
        t.code('connectedCallback'),
        ' and let the signal effects keep it up to date. Use ',
        t.code('persist: true'),
        ' on ',
        t.code('toElement()'),
        ' so effects pause on removal and resume on re-insertion rather than being destroyed.',
      ]),
      code('javascript', `import { t, signal, computed } from 'kensington';

class UserCard extends HTMLElement {
  #name = signal('');
  #role = signal('');
  #initials = computed(() => {
    return this.#name.get()
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase();
  });

  static get observedAttributes() { return ['name', 'role']; }

  attributeChangedCallback(attr, _prev, next) {
    if (attr === 'name') this.#name.set(next ?? '');
    if (attr === 'role') this.#role.set(next ?? '');
  }

  connectedCallback() {
    this.replaceChildren(
      t.div({ class: 'user-card' }, [
        t.div({ class: 'user-card__avatar' }, this.#initials),
        t.div({ class: 'user-card__body' }, [
          t.strong(this.#name),
          t.span({ class: 'user-card__role' }, this.#role),
        ]),
      ]).toElement()
    );
  }
}

customElements.define('user-card', UserCard);`),
      t.p([
        'Passing a signal directly to a tag (',
        t.code('t.strong(this.#name)'),
        ') sets up a live text effect inside ',
        t.code('toElement()'),
        '. Updating the attribute calls ',
        t.code('attributeChangedCallback'),
        ', which sets the signal, which updates only the affected text node. The effects are cleaned up automatically when the element is removed from the DOM.',
      ]),
    ]),

    t.section({ id: 'd3' }, [
      t.h3('D3'),
      t.p([
        'Use Kensington to build the SVG container, then hand it to D3 for data-driven rendering. Wrap the D3 draw logic in an ',
        t.code('effect'),
        ' so the chart redraws automatically whenever the signal holding the data changes.',
      ]),
      code('javascript', `import { t, signal, effect } from 'kensington';
import * as d3 from 'd3';

const data = signal([12, 40, 28, 55, 33, 20, 47]);

const W = 500, H = 220;
const m = { top: 10, right: 10, bottom: 30, left: 34 };

const svg = t.svg({ width: W, height: H, viewBox: \`0 0 \${W} \${H}\` }).toElement();
document.getElementById('chart').replaceChildren(svg);

effect(() => {
  const values = data.get();

  const x = d3.scaleBand()
    .domain(values.map((_, i) => i))
    .range([m.left, W - m.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(values)])
    .nice()
    .range([H - m.bottom, m.top]);

  const chart = d3.select(svg);
  chart.selectAll('*').remove();

  chart.append('g')
    .attr('transform', \`translate(0,\${H - m.bottom})\`)
    .call(d3.axisBottom(x).tickFormat(i => \`Day \${i + 1}\`));

  chart.append('g')
    .attr('transform', \`translate(\${m.left},0)\`)
    .call(d3.axisLeft(y).ticks(5));

  chart.selectAll('rect')
    .data(values)
    .join('rect')
    .attr('x',      (_, i) => x(i))
    .attr('y',      d => y(d))
    .attr('width',  x.bandwidth())
    .attr('height', d => y(0) - y(d))
    .attr('fill',   'steelblue');
});

// Replace the data to redraw the chart.
document.getElementById('refresh').addEventListener('click', () => {
  data.set(Array.from({ length: 7 }, () => Math.round(Math.random() * 60) + 5));
});`),
      t.p([
        'D3 owns the contents of the SVG element. Kensington owns everything outside it. The surrounding layout, controls, and any other reactive UI on the page belong to Kensington. The two libraries operate in separate parts of the DOM and do not conflict.',
      ]),
    ]),
  ]);
}
