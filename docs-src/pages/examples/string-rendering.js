import { t } from 'kensington';

import { code, panels } from '../../components/ui.js';

export function examplesStringRendering() {
  return t.section({ id: 'string-rendering' }, [
    t.h2('String rendering'),

    t.section({ id: 'ssr' }, [
      t.h3('Server-side rendering'),
      t.p([
        'Tag objects convert to strings automatically in template literals and string concatenation. Call ',
        t.code('.toString()'),
        ' explicitly when passing to a function like ',
        t.code('res.send()'),
        ', which won\'t coerce the argument otherwise.',
      ]),
      code('javascript', `import express from 'express';
import { t } from 'kensington';

function layout(title, content) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.title(title),
      t.link({ rel: 'stylesheet', href: '/style.css' }),
    ]),
    t.body(t.main({ class: 'container' }, content)),
  ]).toString();
}

function usersPage(users) {
  return [
    t.h1('Users'),
    t.table([
      t.thead(t.tr(['Name', 'Role'].map(h => t.th(h)))),
      t.tbody(users.map(u =>
        t.tr([t.td(u.name), t.td(u.role)])
      )),
    ]),
  ];
}

const app = express();

app.get('/users', async (req, res) => {
  const users = await db.getUsers();
  res.send(layout('Users', usersPage(users)));
});`),
    ]),

    t.section({ id: 'framework-integration' }, [
      t.h3('Framework integration'),
      t.p([
        'Kensington works with any Node.js HTTP framework. The pattern is the same everywhere: build your HTML with Kensington, call ',
        t.code('.toString()'),
        ', and pass the string to the framework\'s response method.',
      ]),
      panels([
        {
          label: 'Hono',
          content: code('javascript', `import { Hono } from 'hono';
import { t } from 'kensington';

const app = new Hono();

app.get('/users', async (c) => {
  const users = await db.getUsers();
  return c.html(layout('Users', usersPage(users)));
});`),
        },
        {
          label: 'Fastify',
          content: code('javascript', `import Fastify from 'fastify';
import { t } from 'kensington';

const app = Fastify();

app.get('/users', async (req, reply) => {
  const users = await db.getUsers();
  reply
    .header('content-type', 'text/html; charset=utf-8')
    .send(layout('Users', usersPage(users)));
});`),
        },
      ]),
      t.p([
        'Hono\'s ',
        t.code('c.html()'),
        ' sets the content-type header automatically. For frameworks that don\'t have a dedicated HTML method, set ',
        t.code('Content-Type: text/html; charset=utf-8'),
        ' manually as shown in the Fastify example.',
      ]),
    ]),

    t.section({ id: 'express-render-helper' }, [
      t.h3('Express render helper'),
      t.p([
        'Attach a ',
        t.code('res.renderKensington'),
        ' helper via middleware so routes never call ',
        t.code('.toString()'),
        ' directly and the layout is applied in one place.',
      ]),
      panels([
        {
          label: 'middleware/render.js',
          content: code('javascript', `import { layout } from './layout.js';

export function renderMiddleware(req, res, next) {
  res.renderKensington = (pageFunc, ...args) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(layout(pageFunc(...args)).toString());
  };
  next();
}`),
        },
        {
          label: 'server.js',
          content: code('javascript', `import express from 'express';
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
});`),
        },
      ]),
    ]),

    t.section({ id: 'kensington-express' }, [
      t.h3('kensington-express'),
      t.p([
        t.a({
          href: 'https://www.npmjs.com/package/kensington-express',
          target: '_blank',
          rel: 'noopener',
        }, 'kensington-express'),
        ' is an Express middleware that attaches ',
        t.code('res.renderView()'),
        ' to each response. It applies a default layout, merges locals, and sets the content-type header automatically.',
      ]),
      code('bash', 'npm install kensington-express'),
      panels([
        {
          label: 'views/layout.js',
          content: code('javascript', `import { t } from 'kensington';

export default function layout(locals, page) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.title(locals.title),
      t.link({ rel: 'stylesheet', href: '/style.css' }),
    ]),
    t.body(page(locals)),
  ]);
}`),
        },
        {
          label: 'views/home.js',
          content: code('javascript', `import { t } from 'kensington';

export default function homePage({ title, items }) {
  return t.main([
    t.h1(title),
    t.ul(items.map(item => t.li(item))),
  ]);
}`),
        },
      ]),
      code('javascript', `// app.js
import express from 'express';
import kensingtonView from 'kensington-express';
import layout from './views/layout.js';
import homePage from './views/home.js';

const app = express();
app.use(kensingtonView(layout));

app.get('/', (req, res) => {
  res.renderView(homePage, { title: 'Home', items: ['foo', 'bar'] });
});`),
      t.p([
        'Locals passed to ',
        t.code('renderView'),
        ' are merged with ',
        t.code('req.route'),
        ', ',
        t.code('app.locals'),
        ', and ',
        t.code('res.locals'),
        ' (later values win). To use a different layout for one route, pass it as ',
        t.code('layout'),
        ' in the options object. Pass ',
        t.code('layout: null'),
        ' to skip the layout entirely, which is useful for returning bare HTML fragments for htmx swap targets.',
      ]),
      code('javascript', `// Alternate layout for one route
app.get('/admin', (req, res) => {
  res.renderView(adminPage, { layout: adminLayout, title: 'Admin' });
});

// No layout (bare fragment)
app.get('/fragment', (req, res) => {
  res.renderView(myFragment, { layout: null });
});`),
    ]),

    t.section({ id: 'kensington-fastify' }, [
      t.h3('kensington-fastify'),
      t.p([
        t.a({
          href: 'https://www.npmjs.com/package/kensington-fastify',
          target: '_blank',
          rel: 'noopener',
        }, 'kensington-fastify'),
        ' is a Fastify plugin that attaches ',
        t.code('reply.renderView()'),
        ' and decorates each reply with ',
        t.code('reply.locals'),
        ' for per-request data.',
      ]),
      code('bash', 'npm install kensington-fastify'),
      code('javascript', `// server.js
import Fastify from 'fastify';
import kensingtonView from 'kensington-fastify';
import layout from './views/layout.js';
import homePage from './views/home.js';

const fastify = Fastify();

await fastify.register(kensingtonView, {
  defaultLayout: layout,
  defaultContext: { appName: 'My App' },
});

fastify.get('/', async (request, reply) => {
  reply.renderView(homePage, { title: 'Home', items: ['foo', 'bar'] });
});`),
      t.p([
        'Locals are merged in this order (later values win): ',
        t.code('defaultContext'),
        ', ',
        t.code('reply.locals'),
        ', options passed to ',
        t.code('renderView'),
        '. Use ',
        t.code('reply.locals'),
        ' in a hook to attach per-request data without passing it to every ',
        t.code('renderView'),
        ' call.',
      ]),
      code('javascript', `// Attach the current user in a hook — available in every page renderer
fastify.addHook('preHandler', async (request, reply) => {
  reply.locals.user = await getUserFromSession(request);
});

fastify.get('/', async (request, reply) => {
  reply.renderView(homePage, { title: 'Home' });
  // locals available to the renderer: { appName, user, title }
});`),
      t.p([
        'To use an alternate layout or skip the layout for one route, pass ',
        t.code('layout'),
        ' in the options object. Pass ',
        t.code('layout: null'),
        ' for bare HTML fragments.',
      ]),
      code('javascript', `// Alternate layout
fastify.get('/admin', async (request, reply) => {
  reply.renderView(adminPage, { layout: adminLayout, title: 'Admin' });
});

// No layout (bare fragment, e.g. for htmx)
fastify.get('/fragment', async (request, reply) => {
  reply.renderView(myFragment, { layout: null });
});`),
    ]),

    t.section({ id: 'form-from-schema' }, [
      t.h3('Form from schema'),
      t.p('Build forms from a field definition array using a helper function.'),
      panels([
        {
          label: 'JavaScript',
          content: code('javascript', `const fields = [
  { name: 'email',    type: 'email',    label: 'Email',    required: true },
  { name: 'password', type: 'password', label: 'Password', required: true },
  { name: 'remember', type: 'checkbox', label: 'Remember me' },
];

function formField({ name, type, label, required }) {
  return t.div({ class: 'field' }, [
    t.label({ for: name }, label),
    t.input({ id: name, name, type, required }),
  ]);
}

t.form({ action: '/login', method: 'post' }, [
  ...fields.map(formField),
  t.button({ type: 'submit' }, 'Log in'),
]);`),
        },
        {
          label: 'HTML output',
          content: code('html', `<form action="/login" method="post">
  <div class="field">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required>
  </div>
  <div class="field">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" required>
  </div>
  <div class="field">
    <label for="remember">Remember me</label>
    <input id="remember" name="remember" type="checkbox">
  </div>
  <button type="submit">Log in</button>
</form>`),
        },
      ]),
    ]),

    t.section({ id: 'preformatted' }, [
      t.h3('Preformatted blocks'),
      t.p([
        t.code('script'),
        ', ',
        t.code('style'),
        ', ',
        t.code('pre'),
        ', and ',
        t.code('textarea'),
        ' join content arrays with newlines and skip indentation, so string content is inserted without modification.',
      ]),
      panels([
        {
          label: 'JavaScript',
          content: code('javascript', `t.style([
  'body { margin: 0; }',
  'h1 { color: steelblue; }',
]);

t.script(\`
  const el = document.getElementById("app");
  el.textContent = "Hello";
\`);`),
        },
        {
          label: 'HTML output',
          content: code('html', `<style>
body { margin: 0; }
h1 { color: steelblue; }
</style>

<script>
  const el = document.getElementById("app");
  el.textContent = "Hello";
</script>`),
        },
      ]),
    ]),
  ]);
}
