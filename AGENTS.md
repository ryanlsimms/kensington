# Kensington

HTML/SVG/MathML library for JavaScript and TypeScript. Tags are method calls on a `Kensington` instance, returning tag objects that serialize to formatted HTML strings (`.toString()`) or live DOM nodes (`.toElement()`).

Full API reference is in `llms.txt` (same directory as this file).

## Imports

```javascript
import { t } from 'kensington';               // shared default instance — use this in most cases
import Kensington from 'kensington';           // class — use when subclassing or custom config
```

```typescript
import type { ContentTag, VoidTag, LiteralTag, CommentTag, Content, ContentMethod } from 'kensington';
```

## The basics

```javascript
t.div({ class: 'container' }, t.p('Hello'));   // options, then content
t.div(t.p('Hello'));                           // content only — options are optional
t.input({ type: 'checkbox', checked: true });  // void elements take no content
t.div([t.p('one'), t.p('two')]);              // array of children
```

## Critical: call .toString() explicitly

Tag objects coerce to strings in template literals automatically, but not when passed to a function. Always call `.toString()` when passing to `res.send()`, `reply.send()`, `c.html()`, or any similar framework method:

```javascript
res.send(t.div('hello').toString());   // correct
res.send(t.div('hello'));              // wrong — sends [object Object]
```

## Options

The first argument to any tag method is a plain object. It accepts HTML attributes, event handlers, and DOM property assignments.

- camelCase keys convert to kebab-case: `{ dataBsToggle: 'collapse' }` → `data-bs-toggle="collapse"`
- Nested objects flatten: `{ data: { id: '1' } }` → `data-id="1"`
- Boolean: `{ checked: true }` → `checked`; `{ checked: false }` → attribute omitted
- `class` accepts a string or array: `{ class: ['a', 'b'] }` → `class="a b"`
- `style` accepts an object: `{ style: { backgroundColor: 'red' } }` → `style="background-color: red"`. Keys can be camelCase or kebab-case. Values of `null`, `undefined`, `false`, or `''` are silently omitted.
- `data-*` and `aria-*` are always allowed without configuration
- Standard event handler attributes (`onclick`, `oninput`, etc.) accept a string or function. Functions are wired via `addEventListener` in `toElement()`.
- `on` key for custom event listeners — pass a plain object mapping event names verbatim to functions: `{ on: { bricksSelectorChange: handler } }`. Names are passed directly to `addEventListener` with no transformation. Silently ignored in `.toString()`.

### DOM properties with `prop`

HTML attributes and DOM properties diverge after user interaction. `input.value` reflects what the user typed, while `getAttribute('value')` still returns the original default. Use the `prop` key to assign directly to DOM properties via `el[name] = value`, bypassing `setAttribute`:

```javascript
t.input({ type: 'text', prop: { value: '' } }).toElement();  // assigns el.value = ''
t.video({ src: '/intro.mp4', prop: { muted: true, playbackRate: 1.5 } }).toElement();
```

`prop` is silently ignored in `.toString()`. Known properties on the element's DOM interface are typed in TypeScript. Expando properties (arbitrary string keys) are also accepted. Property existence and writability are validated at render time via `validationLevel`.

## Content rules

`null`, `undefined`, `false`, and `''` are silently dropped — use this for conditionals:

```javascript
t.ul([
  t.li('always shown'),
  isAdmin && t.li('admin only'),   // false is dropped, no wrapper needed
  hasError ? t.li('error') : null,
]);
```

Arrays anywhere in content are flattened — `items.map(i => t.li(i))` works directly:

```javascript
t.ul(items.map(item => t.li(item.name)));
```

## Raw HTML

```javascript
t.literal('<p>trusted raw html</p>');    // HTML-encodes content, blocks script tags
t.unsafeLiteral('<script>...</script>'); // no encoding — trusted HTML only
```

## Full documents

```javascript
t.htmlWithDocType({ lang: 'en' }, [     // prepends <!DOCTYPE html>
  t.head([t.meta({ charset: 'utf-8' }), t.title('My Page')]),
  t.body(t.main('content')),
]).toString();
```

## htmx and other attribute namespaces

Pass `additionalNamespaces` to allow `hx-*`, `x-*`, etc.:

```javascript
const t = new Kensington({ additionalNamespaces: ['hx'] });
t.div({ hxBoost: 'true', hxTarget: '#result' });
```

## Custom elements

```typescript
import Kensington, { type ContentMethod } from 'kensington';

class MyEngine extends Kensington {
  myCard: ContentMethod<{ 'card-type'?: 'primary' | 'secondary' }> =
    this.createCustomTag('my-card', { 'card-type': ['primary', 'secondary'] });
}
```

## Common mistakes to avoid

- Do not use JSX or tagged template literals — Kensington uses method calls only
- Do not pass content to void elements (`input`, `br`, `img`, `hr`, `meta`, `link`) — they take attributes only
- Do not import `t` as a default import — `t` is a named export; the default export is the `Kensington` class
- Do not skip `.toString()` when passing to HTTP framework response methods
- Do not use `onclick="string"` for DOM usage — pass a function; string handlers only serialize in `.toString()`

---

## Examples

### Layout with shared header and footer

```javascript
// layout.js
import { t } from 'kensington';

export function layout(title, content) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.title(title),
      t.link({ rel: 'stylesheet', href: '/style.css' }),
    ]),
    t.body([
      t.header(
        t.nav({ class: 'nav' }, [
          t.a({ href: '/', class: 'nav-brand' }, 'My App'),
          t.ul({ class: 'nav-links' }, [
            t.li(t.a({ href: '/about' }, 'About')),
            t.li(t.a({ href: '/contact' }, 'Contact')),
          ]),
        ])
      ),
      t.main({ class: 'container' }, content),
      t.footer(t.p('© 2025 My App')),
    ]),
  ]).toString();
}
```

### Tailwind CSS

The class array makes long Tailwind class lists easier to read and conditionally modify:

```javascript
import { t } from 'kensington';

// Conditional classes are natural with arrays — false/null entries are dropped
function button(label, { variant = 'primary', disabled = false } = {}) {
  return t.button({
    type: 'button',
    disabled,
    class: [
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
      variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      variant === 'secondary' && 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
      variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      disabled && 'opacity-50 cursor-not-allowed',
    ],
  }, label);
}

// Card component
function card(title, body) {
  return t.div({ class: 'rounded-lg border border-gray-200 bg-white shadow-sm p-6' }, [
    t.h3({ class: 'text-lg font-semibold text-gray-900 mb-2' }, title),
    t.div({ class: 'text-gray-600 text-sm' }, body),
  ]);
}

// Alert banner
function alert(message, type = 'info') {
  const styles = {
    info:    'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error:   'bg-red-50 text-red-800 border-red-200',
  };
  return t.div({ class: `rounded-md border px-4 py-3 text-sm ${styles[type]}` }, message);
}

// Page with a responsive grid
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
]);
```

### Express server with multiple routes

```javascript
// server.js
import express from 'express';
import { t } from 'kensington';
import { layout } from './layout.js';

const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(layout('Home', [
    t.h1('Welcome'),
    t.p('Hello from Kensington.'),
    t.a({ href: '/users', class: 'btn' }, 'View users'),
  ]));
});

app.get('/users', async (req, res) => {
  const users = await db.getUsers();
  res.send(layout('Users', [
    t.h1('Users'),
    t.table({ class: 'table' }, [
      t.thead(t.tr(['Name', 'Email', 'Role'].map(h => t.th(h)))),
      t.tbody(users.map(user =>
        t.tr([
          t.td(user.name),
          t.td(user.email),
          t.td({ class: `badge badge--${user.role}` }, user.role),
        ])
      )),
    ]),
    t.a({ href: '/users/new' }, 'Add user'),
  ]));
});

app.listen(3000);
```

### Express — render helper middleware

Attach a `res.renderKensington` helper so routes never call `.toString()` directly:

```javascript
// middleware/render.js
import { layout } from './layout.js';
export function renderMiddleware(req, res, next) {
  res.renderKensington = (pageFunc, ...args) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(layout(pageFunc(...args)).toString());
  };
  next();
}

// server.js
import express from 'express';
import { t } from 'kensington';

import { homePage, usersPage } from './pages.js';
import { renderMiddleware } from './middleware/render.js';

const app = express();
app.use(renderMiddleware);

app.get('/', (req, res) => {
  res.renderKensington(homePage, { title: 'Home' });
});

app.get('/users', async (req, res) => {
  const users = await db.getUsers();
  res.renderKensington(usersPage, { title: 'Users', users });
});
```

### Hono server

```javascript
import { Hono } from 'hono';
import { t } from 'kensington';
import { layout } from './layout.js';

const app = new Hono();

app.get('/users', async (c) => {
  const users = await db.getUsers();
  return c.html(layout('Users', usersTable(users)));
});

function usersTable(users) {
  return t.table([
    t.thead(t.tr(['Name', 'Email'].map(h => t.th(h)))),
    t.tbody(users.map(u => t.tr([t.td(u.name), t.td(u.email)]))),
  ]);
}
```

### Fastify

```javascript
import Fastify from 'fastify';
import { t } from 'kensington';
import { layout } from './layout.js';

const app = Fastify();

// Add a reply decorator so routes don't call toString() directly
app.decorateReply('html', function (content) {
  return this.header('content-type', 'text/html; charset=utf-8')
             .send(typeof content === 'string' ? content : content.toString());
});

app.get('/', async (req, reply) => {
  return reply.html(layout('Home', t.h1('Welcome')));
});

app.get('/users', async (req, reply) => {
  const users = await db.getUsers();
  return reply.html(layout('Users', [
    t.h1('Users'),
    t.table([
      t.thead(t.tr(['Name', 'Email'].map(h => t.th(h)))),
      t.tbody(users.map(u => t.tr([t.td(u.name), t.td(u.email)]))),
    ]),
  ]));
});

await app.listen({ port: 3000 });
```

### Elysia (Bun)

```javascript
import { Elysia } from 'elysia';
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
  .listen(3000);
```

### Form with validation errors

```javascript
function contactForm(values = {}, errors = {}) {
  return t.form({ action: '/contact', method: 'post', class: 'form' }, [
    formField('name', 'Name', 'text', values.name, errors.name),
    formField('email', 'Email', 'email', values.email, errors.email),
    t.div({ class: 'field' }, [
      t.label({ for: 'message' }, 'Message'),
      t.textarea({ id: 'message', name: 'message', rows: 5 }, values.message ?? ''),
      errors.message && t.span({ class: 'error' }, errors.message),
    ]),
    t.button({ type: 'submit' }, 'Send'),
  ]);
}

function formField(name, label, type, value, error) {
  return t.div({ class: ['field', error && 'field--error'] }, [
    t.label({ for: name }, label),
    t.input({ id: name, name, type, value: value ?? '' }),
    error && t.span({ class: 'error' }, error),
  ]);
}

// Route handler
app.post('/contact', async (req, res) => {
  const errors = validate(req.body);
  if (Object.keys(errors).length) {
    return res.send(layout('Contact', contactForm(req.body, errors)));
  }
  await sendEmail(req.body);
  res.redirect('/contact/thanks');
});
```

### Data-driven component

```javascript
function productCard({ name, price, image, inStock }) {
  return t.div({ class: ['card', !inStock && 'card--out-of-stock'] }, [
    t.img({ src: image, alt: name, class: 'card-image' }),
    t.div({ class: 'card-body' }, [
      t.h3({ class: 'card-title' }, name),
      t.span({ class: 'card-price' }, `$${price.toFixed(2)}`),
      inStock
        ? t.button({ type: 'button', class: 'btn btn--primary', dataProductId: String(id) }, 'Add to cart')
        : t.span({ class: 'badge badge--muted' }, 'Out of stock'),
    ]),
  ]);
}

// Render a grid
t.div({ class: 'product-grid' }, products.map(productCard));
```

### Pagination

```javascript
function pagination(currentPage, totalPages, baseUrl) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return t.nav({ ariaLabel: 'Pagination', class: 'pagination' },
    t.ul(pages.map(page =>
      t.li(
        t.a({
          href: `${baseUrl}?page=${page}`,
          class: ['pagination-link', page === currentPage && 'pagination-link--active'],
          ariaCurrent: page === currentPage ? 'page' : undefined,
        }, String(page))
      )
    ))
  );
}
```

### Returning fragments

A function can return an array of elements instead of a single wrapper. Kensington flattens arrays anywhere in content, so no wrapper element is needed:

```javascript
function labelAndInput(name, label, type = 'text') {
  return [
    t.label({ for: name }, label),
    t.input({ id: name, name, type }),
  ];
}

t.form([
  t.div({ class: 'field' }, labelAndInput('email', 'Email address', 'email')),
  t.div({ class: 'field' }, labelAndInput('name', 'Full name')),
  t.button({ type: 'submit' }, 'Submit'),
]);
```

```javascript
// Head meta tags as a fragment — no wrapping element
function standardMeta(title, description) {
  return [
    t.meta({ charset: 'utf-8' }),
    t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
    t.meta({ name: 'description', content: description }),
    t.title(title),
  ];
}

t.head([
  ...standardMeta('My Page', 'Welcome to my site'),
  t.link({ rel: 'stylesheet', href: '/style.css' }),
]);
```

### Caching and reuse

Tag objects are immutable — build shared pieces once and reuse them across renders:

```javascript
const loadingSpinner = t.div({ class: 'spinner', role: 'status', ariaLabel: 'Loading' });

const siteNav = t.nav({ class: 'nav' }, [
  t.a({ href: '/', class: 'nav-brand' }, 'My App'),
  t.ul({ class: 'nav-links' }, [
    t.li(t.a({ href: '/' }, 'Home')),
    t.li(t.a({ href: '/about' }, 'About')),
    t.li(t.a({ href: '/contact' }, 'Contact')),
  ]),
]);

function layout(content, isLoading = false) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head(t.meta({ charset: 'utf-8' })),
    t.body([
      siteNav,
      t.main(isLoading ? loadingSpinner : content),
    ]),
  ]).toString();
}
```

### Inline styles and dynamic classes

```javascript
function progressBar(percent, color = 'blue') {
  return t.div({ class: 'progress' },
    t.div({
      class: 'progress-bar',
      role: 'progressbar',
      style: { width: `${percent}%`, backgroundColor: color },
      ariaValuenow: percent,
      ariaValuemin: 0,
      ariaValuemax: 100,
    })
  );
}
```

### Alpine.js

```javascript
import Kensington from 'kensington';

const t = new Kensington({ additionalNamespaces: ['x'] });

// Dropdown menu with Alpine state
function dropdown(label, items) {
  return t.div({ xData: '{ open: false }', class: 'dropdown' }, [
    t.button({
      type: 'button',
      xOn: { click: 'open = !open' },
      xBind: { ariaExpanded: 'open' },
    }, label),
    t.ul({
      xShow: 'open',
      xOn: { 'click.outside': 'open = false' },
      class: 'dropdown-menu',
    }, items.map(item =>
      t.li(t.a({ href: item.href }, item.label))
    )),
  ]);
}

// Reactive form with live validation
function emailForm() {
  return t.div({
    xData: `{
      email: '',
      get valid() { return this.email.includes('@') },
    }`,
  }, [
    t.input({
      type: 'email',
      xModel: 'email',
      placeholder: 'you@example.com',
    }),
    t.p({
      xShow: 'email && !valid',
      class: 'error',
    }, 'Enter a valid email address.'),
    t.button({
      type: 'submit',
      xBind: { disabled: '!valid' },
    }, 'Subscribe'),
  ]);
}

// Tabs component
function tabs(items) {
  return t.div({ xData: '{ active: 0 }', class: 'tabs' }, [
    t.div({ class: 'tab-list', role: 'tablist' },
      items.map((item, i) =>
        t.button({
          type: 'button',
          role: 'tab',
          xOn: { click: `active = ${i}` },
          xBind: { class: `active === ${i} ? 'tab--active' : ''` },
        }, item.label)
      )
    ),
    t.div({ class: 'tab-panels' },
      items.map((item, i) =>
        t.div({
          role: 'tabpanel',
          xShow: `active === ${i}`,
        }, item.content)
      )
    ),
  ]);
}
```

### SVG

SVG elements use `createElementNS` automatically in `.toElement()`, so namespacing is handled for you. All CSS properties are valid as presentation attributes on SVG elements.

```javascript
import { t } from 'kensington';

// Inline icon
function chevronIcon(direction = 'down') {
  const rotate = { down: 0, up: 180, left: 90, right: -90 }[direction];
  return t.svg({
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    width: 20,
    height: 20,
    style: rotate ? { transform: `rotate(${rotate}deg)` } : {},
    ariaHidden: 'true',
  },
    t.path({
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: 'M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z',
    })
  );
}

// Simple bar chart
function barChart(data) {
  const max = Math.max(...data.map(d => d.value));
  const barWidth = 40;
  const gap = 16;
  const height = 120;
  const width = data.length * (barWidth + gap) - gap;

  return t.svg({ viewBox: `0 0 ${width} ${height}`, width, height },
    data.map((d, i) => {
      const barHeight = (d.value / max) * height;
      return t.g({ transform: `translate(${i * (barWidth + gap)}, 0)` }, [
        t.rect({
          x: 0,
          y: height - barHeight,
          width: barWidth,
          height: barHeight,
          fill: '#3b82f6',
          rx: 4,
        }),
        t.text({
          x: barWidth / 2,
          y: height - barHeight - 4,
          textAnchor: 'middle',
          fontSize: 11,
          fill: '#6b7280',
        }, String(d.value)),
      ]);
    })
  );
}

// Use in a page
t.div({ class: 'chart-container' }, [
  t.h3('Monthly signups'),
  barChart([
    { label: 'Jan', value: 42 },
    { label: 'Feb', value: 68 },
    { label: 'Mar', value: 55 },
    { label: 'Apr', value: 91 },
  ]),
]);
```

### Embedding server data in the page

Pass data from the server to the browser using a `<script type="application/json">` tag. `script` and `style` content is not HTML-encoded, so JSON is safe to embed directly.

```javascript
import { t } from 'kensington';

function pageWithData(title, data, content) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.title(title),
      t.link({ rel: 'stylesheet', href: '/style.css' }),
    ]),
    t.body([
      t.main({ class: 'container' }, content),
      // Embed server data for client-side JS to read
      t.script({ type: 'application/json', id: 'page-data' },
        JSON.stringify(data)
      ),
      t.script({ src: '/app.js', defer: true }),
    ]),
  ]).toString();
}

// In the browser:
// const data = JSON.parse(document.getElementById('page-data').textContent);

// Inline CSS — array items are joined with newlines
function pageWithInlineStyles(content) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.style([
        'body { margin: 0; font-family: sans-serif; }',
        'h1 { color: #1a1a1a; }',
        '.container { max-width: 960px; margin: 0 auto; padding: 2rem; }',
      ]),
    ]),
    t.body(t.div({ class: 'container' }, content)),
  ]).toString();
}
```

### htmx live search

```javascript
import Kensington from 'kensington';
import { Hono } from 'hono';

const t = new Kensington({ additionalNamespaces: ['hx'] });
const app = new Hono();

// The search input triggers GET /search on each keystroke
function searchPage() {
  return layout('Search', [
    t.input({
      type: 'search',
      name: 'q',
      placeholder: 'Search...',
      hxGet: '/search',
      hxTrigger: 'input changed delay:300ms',
      hxTarget: '#results',
    }),
    t.ul({ id: 'results' }),
  ]);
}

// Returns only the result fragment — htmx swaps it into #results
app.get('/search', async (c) => {
  const rows = await db.search(c.req.query('q') ?? '');
  return c.html(rows.map(r => t.li(r.name).toString()).join(''));
});
```

### Browser DOM usage

```javascript
import { t } from 'kensington';

// Build and insert a modal
function createModal(title, bodyContent) {
  return t.div({ class: 'modal', role: 'dialog', ariaModal: 'true', ariaLabel: title }, [
    t.div({ class: 'modal-header' }, [
      t.h2(title),
      t.button({
        type: 'button',
        class: 'modal-close',
        ariaLabel: 'Close',
        onclick: () => modal.remove(),
      }, '×'),
    ]),
    t.div({ class: 'modal-body' }, bodyContent),
  ]).toElement();
}

const modal = createModal('Confirm', t.p('Are you sure?'));
document.body.append(modal);
```

### TypeScript — typed components

```typescript
import { t } from 'kensington';
import type { ContentTag } from 'kensington';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

function userRow(user: User): ContentTag {
  return t.tr([
    t.td(user.name),
    t.td(t.a({ href: `mailto:${user.email}` }, user.email)),
    t.td(t.span({ class: `badge badge--${user.role}` }, user.role)),
    t.td([
      t.a({ href: `/users/${user.id}/edit` }, 'Edit'),
      t.a({ href: `/users/${user.id}`, dataMethod: 'delete' }, 'Delete'),
    ]),
  ]);
}

function usersTable(users: User[]): ContentTag {
  return t.table({ class: 'table' }, [
    t.thead(t.tr(['Name', 'Email', 'Role', 'Actions'].map(h => t.th(h)))),
    t.tbody(users.map(userRow)),
  ]);
}
```

### TypeScript — design system with custom elements, htmx, and module augmentation

A more complete pattern: a `Kensington` subclass that defines typed custom design-system elements, module augmentation for htmx attributes, typed domain components, and a typed layout function.

```typescript
// design-system.ts
import Kensington, { type ContentMethod, type Content, type ContentTag } from 'kensington';

// Allow hx-* attributes on every element in this project
declare module 'kensington' {
  interface NameSpaceAttributes {
    [key: `hx${string}`]: string | object;
  }
}

// Subclass adds typed custom elements for the design system
class DS extends Kensington {
  alert: ContentMethod<{ variant?: 'info' | 'success' | 'warning' | 'error' }> =
    this.createCustomTag('ds-alert', { variant: ['info', 'success', 'warning', 'error'] });

  badge: ContentMethod<{ color?: 'blue' | 'green' | 'yellow' | 'red' | 'grey' }> =
    this.createCustomTag('ds-badge', { color: ['blue', 'green', 'yellow', 'red', 'grey'] });
}

const t = new DS({ additionalNamespaces: ['hx'] });

export { t };
export type { Content, ContentTag };
```

```typescript
// issues-page.ts
import { t } from './design-system.js';
import type { ContentTag, Content } from './design-system.js';

interface Issue {
  id: number;
  title: string;
  status: 'open' | 'in-progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
}

const statusColor = {
  open: 'blue',
  'in-progress': 'yellow',
  closed: 'green',
} as const satisfies Record<Issue['status'], 'blue' | 'yellow' | 'green'>;

const priorityColor = {
  low: 'grey',
  medium: 'yellow',
  high: 'red',
} as const satisfies Record<Issue['priority'], 'grey' | 'yellow' | 'red'>;

function issueRow(issue: Issue): ContentTag {
  return t.tr({ dataIssueId: String(issue.id) }, [
    t.td(t.a({ href: `/issues/${issue.id}` }, issue.title)),
    t.td(t.badge({ color: statusColor[issue.status] }, issue.status)),
    t.td(t.badge({ color: priorityColor[issue.priority] }, issue.priority)),
    t.td(issue.assignee ?? t.span({ class: 'muted' }, 'Unassigned')),
    t.td({ class: 'actions' }, [
      t.button({
        type: 'button',
        hxGet: `/issues/${issue.id}/edit`,
        hxTarget: '#modal',
        hxSwap: 'innerHTML',
      }, 'Edit'),
      t.button({
        type: 'button',
        hxDelete: `/issues/${issue.id}`,
        hxConfirm: 'Delete this issue?',
        hxTarget: `[data-issue-id="${issue.id}"]`,
        hxSwap: 'outerHTML swap:0.3s',
      }, 'Delete'),
    ]),
  ]);
}

export function issuesPage(issues: Issue[], flash?: string): string {
  return layout('Issues', [
    flash && t.alert({ variant: 'success' }, flash),
    t.div({ class: 'page-header' }, [
      t.h1('Issues'),
      t.button({
        type: 'button',
        hxGet: '/issues/new',
        hxTarget: '#modal',
        hxSwap: 'innerHTML',
      }, 'New issue'),
    ]),
    t.table({ class: 'table' }, [
      t.thead(t.tr(
        ['Title', 'Status', 'Priority', 'Assignee', ''].map(h => t.th(h))
      )),
      t.tbody(
        issues.length
          ? issues.map(issueRow)
          : t.tr(t.td({ colspan: 5, class: 'empty' }, 'No issues found.'))
      ),
    ]),
    t.div({ id: 'modal' }),
  ]);
}

function layout(title: string, content: Content): string {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.title(title),
      t.link({ rel: 'stylesheet', href: '/style.css' }),
      t.script({ src: 'https://unpkg.com/htmx.org@2', defer: true }),
    ]),
    t.body(t.main({ class: 'container' }, content)),
  ]).toString();
}
```
