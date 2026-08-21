# Examples

Subdoc of the root AGENTS.md. Read this for runnable patterns: forms, data-driven components, pagination, fragments, caching, inline styles, Alpine.js, SVG, MathML, htmx, hydration forms, TypeScript design system, and ten reactive-data worked examples (counter, live filter, keyed todo, form validation, hydrated like button, sortable table, static-element reactivity, accordion, context, hash router).

### Section index

| Example | Section heading |
|---|---|
| Form with POST and field-level errors | Form with validation errors |
| Data-driven list from a server array | Data-driven component |
| Paginated list with prev/next | Pagination |
| Return multiple sibling elements from one function | Returning fragments |
| Share a tag instance across renders | Caching and reuse |
| Dynamic class list and inline style object | Inline styles and dynamic classes |
| Alpine.js sprinkled on static HTML | Alpine.js |
| SVG chart or icon | SVG |
| Embed server-fetched JSON in a `<script>` block | Embedding server data in the page |
| htmx-powered live search | htmx live search |
| SSR form with server-side validation that re-renders with errors | Hydration. Form with server-side validation |
| Direct DOM manipulation alongside kensington | Browser DOM usage |
| TypeScript. Reactive prop types with `Reactive<T>` | TypeScript. Reactive prop types |
| Return a signal from a component and share across components | Returning a signal from a component function |
| TypeScript. Fully typed component signature | TypeScript. Typed components |
| TypeScript design system with custom elements, htmx, and module augmentation | TypeScript. Design system with custom elements, htmx, and module augmentation |
| MathML formula rendering | MathML |
| Reactive counter (the "hello world" of signals) | Reactive data. Counter |
| Live filter input that narrows a list on keystrokes | Reactive data. Live filter |
| Keyed todo list with add/remove | Reactive data. Keyed todo list |
| Form with inline validation messages that appear on blur | Reactive data. Form with live validation |
| SSR component that hydrates and accepts client-side clicks | Reactive data. Hydrated like button |
| Sortable table with click-to-sort-by-column | Reactive data. Sortable table |
| Make pre-existing static DOM nodes reactive | Reactive data. Making static HTML elements reactive |
| Accordion with per-panel open/close signal | Reactive data. Accordion with per-element signals |
| createContext provider/consumer pattern | Reactive data. Context |
| Hash-router SPA with signal-driven route | Reactive data. Hash router as signals |

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
function productCard({ id, name, price, image, inStock }) {
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
// Head meta tags as a fragment. No wrapping element
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

Tag objects are immutable. Build shared pieces once and reuse them across renders:

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

Pass data from the server to the browser using a `<script type="application/json">` tag. Script content is raw text, so escape `<` in serialized JSON to prevent a string containing `</script>` from ending the element early.

```javascript
import { t } from 'kensington';

function jsonForHtml(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

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
        jsonForHtml(data)
      ),
      t.script({ src: '/app.js', defer: true }),
    ]),
  ]).toString();
}

// In the browser:
// const data = JSON.parse(document.getElementById('page-data').textContent);

// Inline CSS. Array items are joined with newlines
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

// Returns only the result fragment. Htmx swaps it into #results
app.get('/search', async (c) => {
  const rows = await db.search(c.req.query('q') ?? '');
  return c.html(rows.map(r => t.li(r.name).toString()).join(''));
});
```

### Hydration. Form with server-side validation

The form is rendered on the server with `renderForHydration` and mounted as a reactive component on the client. Submitting calls `fetch` with the form data as JSON. On validation failure the server returns `{ errors }` and the `errors` signal updates, reactively showing each message and adding an error class to the affected field. Input values are preserved because the form element stays in place. No DOM swap, no re-render. On success the server returns `{ success: true }` and the client navigates away.

```javascript
// components/registration-form.js
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
}
```

```javascript
// server.js
import { renderForHydration, t } from 'kensington';
import { registrationForm } from './components/registration-form.js';

app.use(express.json());

app.get('/register', (req, res) => {
  res.send(layout('Register', renderForHydration(registrationForm, {})));
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const errors = {};

  if (!name?.trim())                errors.name     = 'Name is required.';
  if (!email?.includes('@'))        errors.email    = 'Enter a valid email address.';
  if ((password?.length ?? 0) < 8) errors.password = 'Password must be at least 8 characters.';

  if (Object.keys(errors).length) {
    return res.json({ errors });
  }

  await db.createUser({ name, email, password });
  res.json({ success: true });
});
```

```javascript
// client.js
import { registerComponents } from 'kensington';
import { registrationForm } from './components/registration-form.js';

registerComponents({ registrationForm });
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

### TypeScript. Reactive prop types

When you write a component that accepts reactive content or attribute values, **type the parameter as `Reactive<T>`**, not `Signal<T>`. `Signal<T>` is the mutable form (has `.set`); `ReadonlySignal<T>` is what `computed`, `transform`, and `mapWithKey` return; `Reactive<T>` is the union (`T | Signal<T> | ReadonlySignal<T>`) and is what kensington's own attribute/content slots accept. Using `Signal<T>` rejects valid arguments at compile time.

```typescript
import type { Reactive, ContentTag } from 'kensington';

// Right. Accepts a static value, a Signal, OR a ReadonlySignal (e.g. the result of mapWithKey).
function listColumn(items: Reactive<ContentTag[]>): ContentTag {
  return t.div({ class: 'column' }, items);
}

// Wrong. mapWithKey returns ReadonlySignal<ContentTag[]>, which doesn't satisfy Signal<...>.
function listColumnTooStrict(items: Signal<ContentTag[]>): ContentTag { ... }   // tsc errors
```

`Signal<T>` is invariant in `T`, so `Signal<'a' | 'b'>` doesn't widen to `Signal<string>`. When a row's `columnId` is `Signal<ColumnId>`, the interface that holds it must say `Signal<ColumnId>` (or a `Reactive<ColumnId>`), not `Signal<string>`.

**Non-signal prop read at construction time.** If a helper accepts a plain value and uses it inside the returned tag, the value is captured once at construction and never updates. Easy to write by accident:

```typescript
// Wrong. value is read once when numberStepper() runs; later writes to the
// caller's signal never propagate because the helper holds a plain number.
function numberStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return t.input({ type: 'number', prop: { value }, oninput: e => onChange(+e.target.value) });
}

// Right. Type the prop as Reactive<number> so callers can pass a signal AND a
// static value. Pass the prop through directly so kensington binds reactively.
function numberStepper({ value, onChange }: { value: Reactive<number>; onChange: (n: number) => void }) {
  return t.input({ type: 'number', prop: { value }, oninput: e => onChange(+e.target.value) });
}
```

The trap appears most often in deeply-nested helpers where the writer assumes the prop is "just data." If the caller's source is a signal (a units toggle, a settings flip), the static-typed helper silently freezes. Default to `Reactive<T>` for any helper prop that could change over the lifetime of the rendered tag.

### Returning a signal from a component function

`signal.transform(...)`, `computed(...)`, and any signal-producing call return a `ReadonlySignal<T>`. At runtime a signal has `.toElement()`, `.mount(target)`, and `.toString()`, so it can be rendered directly with no wrapping element in the DOM. It is also valid as content of any tag (kensington swaps the rendered child reactively).

```typescript
const view = isOpen.transform(o => o ? t.div('Open') : t.div('Closed'));
document.body.append(view.toElement());
// Rendered DOM: <!---->  <div>Closed</div>  <!---->
// On set(true): the inner <div> is swapped in place between the same two anchors.
```

This is the canonical pattern for inline conditional subtree swap. The transform returns a different tag per value of the signal; the returned tag is rendered between two anchor comment nodes; subsequent value changes replace the inner tree. Use it for "name display vs rename input", "loading spinner vs loaded content", "expanded panel body vs collapsed", and similar one-of-N selections where each branch is its own subtree.

Inside a `mapWithKey` `mapFn` (recursive trees, list rows), this pattern composes safely. Each `mapWithKey` key owns a stable tag instance, and the inner `transform` lives on that tag and runs only when its signal changes. Pass a key to `transform` (the row id, plus a suffix if the row has more than one inline transform) so the inner derivation is reused across `mapFn` re-runs:

```typescript
const rows = items.mapWithKey('id', item => {
  const renaming = signal(false, item.id);
  const display = renaming.transform(
    r => r ? t.input({ prop: { value: item.name } }) : t.span(item.name),
    `${item.id}-display`,
  );
  return t.li([t.span(item.icon), display, t.button({ onclick: () => renaming.set(v => !v) }, 'edit')]);
});
```

At the type level, **do not annotate the function's return as `ContentTag`** when you intend to return a signal. `ReadonlySignal<T>` is not structurally a `ContentTag` (the two `toElement()` signatures differ: `ContentTag.toElement(): Element`, `Signal.toElement(): Node`). Annotate as `ReadonlySignal<unknown>` (or a more specific type) instead. The returned value still flows into any tag's content slot, gets mounted via `view.toElement()`, etc.

```typescript
import type { ReadonlySignal } from 'kensington';

// Right. Return type matches what the function actually returns.
function status(): ReadonlySignal<unknown> {
  return isOpen.transform(o => o ? t.div('Open') : t.div('Closed'));
}

// Right. Used directly as content of a parent tag. No wrapper required at this site either.
const page = t.div([status(), t.button({ onclick: () => isOpen.set(v => !v) }, 'Toggle')]);
```

For a component handle that wants to expose other methods alongside its rendered output, type the field as `ReadonlySignal<unknown>` or `Content`:

```typescript
export interface PickerHandle {
  tag: ReadonlySignal<unknown>;   // rendered subtree; reactive
  open(cb: (x: Item) => void): void;
  close(): void;
}
```

### TypeScript. Typed components

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

### TypeScript. Design system with custom elements, htmx, and module augmentation

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

### MathML

MathML elements are in the `http://www.w3.org/1998/Math/MathML` namespace. `.toElement()` applies it automatically.

```javascript
import { t } from 'kensington';

// Quadratic formula
const formula = t.math({ display: 'block' },
  t.mrow([
    t.mi('x'),
    t.mo('='),
    t.mfrac([
      t.mrow([
        t.mo('−'), t.mi('b'), t.mo('±'),
        t.msqrt(t.mrow([
          t.msup([t.mi('b'), t.mn('2')]),
          t.mo('−'),
          t.mn('4'), t.mi('a'), t.mi('c'),
        ])),
      ]),
      t.mrow([t.mn('2'), t.mi('a')]),
    ]),
  ])
);

// Inline in a page
t.p(['The solutions are ', formula, '.']);
```

### Reactive data. Counter

```javascript
import { t, signal, computed, effect } from 'kensington';

const count = signal(0);
const label = computed(() => count.get() === 1 ? 'click' : 'clicks');

effect(() => { document.title = `${count.get()} ${label.get()}`; });

document.body.append(
  t.div([
    t.p([count, ' ', label]),
    t.button({ type: 'button', onclick: () => count.set(n => n + 1) }, '+'),
    t.button({ type: 'button', onclick: () => count.set(0) }, 'Reset'),
  ]).toElement()
);
```

### Reactive data. Live filter

```javascript
import { t, signal, computed } from 'kensington';

const items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
const query = signal('');

const rows = computed(() => {
  const q = query.get().toLowerCase();
  return items
    .filter(name => !q || name.toLowerCase().includes(q))
    .map(name => t.li(name));
});

document.body.append(
  t.div([
    t.input({ type: 'search', placeholder: 'Filter...', oninput: e => query.set(e.target.value) }),
    t.ul(rows),
  ]).toElement()
);
```

### Reactive data. Keyed todo list

```javascript
import { t, signal } from 'kensington';

let nextId = 1;
const todos = signal([]);

function addTodo(text) {
  todos.set(list => [...list, { id: nextId++, text, done: false }]);
}

function toggleTodo(id) {
  todos.set(list => list.map(item => item.id === id ? { ...item, done: !item.done } : item));
}

function removeTodo(id) {
  todos.set(list => list.filter(item => item.id !== id));
}

const rows = todos.mapWithKey('id', item =>
  t.li([
    t.span({ style: { textDecoration: item.done ? 'line-through' : 'none' } }, item.text),
    t.button({ type: 'button', onclick: () => toggleTodo(item.id) }, 'Done'),
    t.button({ type: 'button', onclick: () => removeTodo(item.id) }, 'Remove'),
  ])
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
);
```

### Reactive data. Form with live validation

```javascript
import { t, signal, computed } from 'kensington';

const email    = signal('');
const password = signal('');

const emailOk    = email.transform(v => v.includes('@') && v.includes('.'));
const passwordOk = password.transform(v => v.length >= 8);
const formOk     = computed(() => emailOk.get() && passwordOk.get());

document.body.append(
  t.form([
    t.div([
      t.label({ for: 'email' }, 'Email'),
      t.input({ id: 'email', type: 'email', oninput: e => email.set(e.target.value) }),
      t.span({
        class: emailOk.transform(v => v ? 'hint hint--ok' : 'hint hint--error'),
      }, emailOk.transform(v => v ? '✓' : 'Enter a valid email')),
    ]),
    t.div([
      t.label({ for: 'pw' }, 'Password'),
      t.input({ id: 'pw', type: 'password', oninput: e => password.set(e.target.value) }),
      t.span({
        class: passwordOk.transform(v => v ? 'hint hint--ok' : 'hint hint--error'),
      }, passwordOk.transform(v => v ? '✓' : 'At least 8 characters')),
    ]),
    t.button({ type: 'submit', disabled: formOk.transform(v => !v) }, 'Sign up'),
  ]).toElement()
);
```

### Reactive data. Hydrated like button

Optimistic update with revert on error. The component runs unchanged on server and client.

```javascript
// components/like-button.js
import { t, signal } from 'kensington';

export function likeButton({ postId, likeCount, userLiked }) {
  const likes = signal(likeCount);
  const liked = signal(userLiked);

  function toggle() {
    const next = !liked.get();
    liked.set(next);
    likes.set(n => n + (next ? 1 : -1));

    fetch(`/api/posts/${postId}/like`, { method: next ? 'POST' : 'DELETE' })
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
}
```

```javascript
// server.js
import { renderForHydration, t } from 'kensington';
import { likeButton } from './components/like-button.js';

app.get('/posts/:id', async (req, res) => {
  const post      = await db.getPost(req.params.id);
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
          renderForHydration(likeButton, { postId: post.id, likeCount: post.likeCount, userLiked }),
        ])
      ),
    ]).toString()
  );
});
```

```javascript
// client.js
import { registerComponents } from 'kensington';
import { likeButton } from './components/like-button.js';

registerComponents({ likeButton });
```

### Reactive data. Sortable table

Two signals drive both the rows and the column headers. Each header creates its own `computed` that tracks only the signals it reads. The active header tracks both `sortCol` and `sortAsc`; inactive headers track only `sortCol`. Stale subscriptions are cleaned up automatically between runs.

```javascript
import { t, signal, computed } from 'kensington';

const people = [
  { name: 'Alice', age: 32, role: 'Admin'  },
  { name: 'Bob',   age: 28, role: 'Editor' },
  { name: 'Carol', age: 41, role: 'Viewer' },
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
    sortCol.get() === col ? `${label} ${sortAsc.get() ? '↑' : '↓'}` : label
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
    t.thead(t.tr([sortHeader('name', 'Name'), sortHeader('age', 'Age'), sortHeader('role', 'Role')])),
    t.tbody(rows),
  ]).toElement()
);
```

### Reactive data. Making static HTML elements reactive

When most of a page is static HTML, use `effect()` directly against existing DOM elements rather than rebuilding markup with `.toElement()`. A signal holds the shared state; each element gets its own `effect` that reads the signal and updates the DOM.

```javascript
import { signal, effect } from 'kensington';

// Tab switcher. Read initial state from the HTML so the page works before JS runs
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
});
```

Effects created this way are not auto-stopped when the element is removed from the DOM. For page-lifetime effects that is fine. If cleanup is needed, store the return value and call `.stop()` manually, or use `addDisconnectedCallback` on a Kensington-created ancestor.

### Reactive data. Accordion with per-element signals

Each accordion item gets its own signal, seeded from its `aria-expanded` attribute so the HTML is the source of truth. An `effect` keeps `aria-expanded` and the `hidden` property in sync on every change.

```javascript
import { signal, effect } from 'kensington';

document.querySelectorAll('.accordion-toggle').forEach(btn => {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  const open = signal(btn.getAttribute('aria-expanded') === 'true');

  btn.addEventListener('click', () => open.set(v => !v));

  effect(() => {
    const isOpen = open.get();
    btn.setAttribute('aria-expanded', String(isOpen));
    panel.hidden = !isOpen;
  });
});
```

### Reactive data. Context

The `createContext` pattern builds a signal stack so components read the nearest provider's value during synchronous construction. Consumers hold the signal reference and update reactively. `provide()` always wraps its argument in a new signal.

```javascript
import { signal, t } from 'kensington';

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
}

const ThemeContext = createContext('light');
const UserContext  = createContext({ name: 'Guest', role: 'viewer' });

function card() {
  const theme = ThemeContext.get();
  const user  = UserContext.get();
  return t.div({ class: theme.transform(v => `card card--${v}`) }, [
    t.p(user.transform(u => `${u.name} (${u.role})`)),
    t.small(theme),
  ]);
}

const app = t.div([
  t.button({
    type: 'button',
    onclick: () => ThemeContext.set(v => v === 'light' ? 'dark' : 'light'),
  }, 'Toggle theme'),

  card(), // reads default context

  ThemeContext.provide('dark', () =>
    card(), // pinned to dark regardless of toggle
  ),

  UserContext.provide({ name: 'Alice', role: 'admin' }, () =>
    ThemeContext.provide('dark', () =>
      card(), // both contexts overridden
    ),
  ),
]);

document.body.append(app.toElement());
```

### Reactive data. Hash router as signals

For client-only SPAs that route via `window.location.hash`, expose the parsed route AS signals so consuming components subscribe naturally. The wrong shape is a single `currentRoute` signal whose `.params` is a plain object — downstream code can't subscribe to a specific param without re-reading the whole route. The right shape is a small registry of derived signals.

```javascript
import { signal, computed } from 'kensington';

// Module-level. Lives for the lifetime of the page.
const rawHash = signal(window.location.hash.slice(1) || '/');
window.addEventListener('hashchange', () => rawHash.set(window.location.hash.slice(1) || '/'));

// Match patterns once, derive named signals from the raw hash.
export const path = rawHash.transform(parsePath, 'router-path');
export const params = rawHash.transform(parseParams, 'router-params');

// Convenience: per-param helpers if a handful of consumers each read one param.
export function paramSignal(name) {
  return params.transform(p => p[name] ?? null, `router-param-${name}`);
}

function parsePath(hash) { return hash.split('?')[0]; }
function parseParams(hash) {
  const q = hash.split('?')[1] ?? '';
  const out = {};
  for (const pair of q.split('&').filter(Boolean)) {
    const [k, v] = pair.split('=');
    out[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
  }
  return out;
}
```

Consumers then bind reactively without unpacking the whole route:

```javascript
const exerciseId = paramSignal('id');
const detailView = exerciseId.transform(id => id ? loadExercise(id) : welcomeScreen());
document.body.append(detailView.toElement());
```

Reading `params.value` (snapshot) at construction time fails the same way as any non-signal prop. Always read via `.get()` inside a computed/transform, or pass the signal itself into a tag's content/attribute slot. If you need a single derived value used by many consumers, expose it as a named module-level signal (`activeExerciseId`, `currentTabName`) rather than asking each consumer to derive it from `params`.
