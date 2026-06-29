import { t } from 'kensington';

import { apiTable } from '../../components/table.js';
import { code, exLink } from '../../components/ui.js';

export function reactivitySsr() {
  return t.section({ id: 'hydration' }, [
    t.h2('Server-rendered reactive data'),
    t.p([
      'Server-render a component to HTML with ',
      t.code('renderForHydration'),
      ', then pick it up on the client with ',
      t.code('registerComponents'),
      '. The SSR output is replaced with a live, reactive DOM tree using the same state that was passed on the server.',
    ]),
    code('javascript', `// server.js
import { renderForHydration, t } from 'kensington';
import { counter } from './components/counter.js';

app.get('/', (req, res) => {
  res.send(
    t.htmlWithDocType({ lang: 'en' }, [
      t.head([t.meta({ charset: 'utf-8' }), t.title('App')]),
      t.body(renderForHydration(counter, { count: 0 })),
    ]).toString()
  );
});

// client.js
import { registerComponents } from 'kensington';
import { counter } from './components/counter.js';

registerComponents({ counter });`),
    t.p('The component function runs on both server and client. Write it so it works in both environments:'),
    code('javascript', `// components/counter.js
import { t, signal, effect, isBrowser } from 'kensington';

export function counter({ count: initial }) {
  const count = signal(initial);

  // effect() is a no-op on the server: safe to use browser globals inside
  effect(() => {
    document.title = \`Count: \${count.get()}\`;
  });

  // isBrowser guards code that can't go inside effect()
  const stored = isBrowser ? localStorage.getItem('count') : null;

  return t.div([
    t.p(count),
    t.button({ type: 'button', onclick: () => count.set(n => n + 1) }, '+'),
  ]);
}`),
    apiTable(['Export', 'Context', 'Description'], [
      [
        t.code('renderForHydration(fn, state, name?, options?)'),
        'Server',
        [
          'Renders the component to HTML and embeds state as a JSON script block. ',
          t.code('fn'),
          ' is called as ',
          t.code('fn(state, context)'),
          ' where ',
          t.code('context'),
          ' comes from ',
          t.code('options.context'),
          ' (see below) and is never serialized. Uses ',
          t.code('fn.name'),
          ' by default server-side. Pass an explicit ',
          t.code('name'),
          ' for anonymous functions and when calling in the browser. Function names are not safe after minification. ',
          t.code('name'),
          ' must match what is used in ',
          t.code('registerComponents'),
          ' on the client. Throws if the component returns a non-element value or a Promise. Warns on lossy state values (Date, Map, Set, RegExp, undefined, function, Symbol, non-finite numbers, class instances); throws on unserializable ones (BigInt, circular references).',
        ],
      ],
      [
        t.code('registerComponents(components, options?)'),
        'Client',
        [
          'Scans the page for components rendered by ',
          t.code('renderForHydration'),
          ' and mounts each one reactively. Each ',
          t.code('fn'),
          ' is called as ',
          t.code('fn(state, context)'),
          ' where ',
          t.code('context'),
          ' comes from ',
          t.code('options.context'),
          '. Object keys are used as component names: ',
          t.code('{ counter }'),
          ' registers the function under ',
          t.code("'counter'"),
          '. Must match what is passed in ',
          t.code('renderForHydration'),
          ' on the server. Issues a ',
          t.code('console.warn'),
          ' for unregistered component names and missing mount points. If the client component returns ',
          t.code('null'),
          ' or throws, warns or logs the error and leaves the SSR element in place. Defers hydration until ',
          t.code('DOMContentLoaded'),
          ' if called while the page is still loading. Components in dynamically fetched HTML fragments are hydrated automatically, without re-calling ',
          t.code('registerComponents'),
          '. Returns ',
          t.code('{ stop() }'),
          ' to stop watching for new components.',
        ],
      ],
      [
        t.code('options.context'),
        'Both',
        [
          'Non-serializable runtime bag passed as the second argument to every component invocation. The server provides its own via ',
          t.code('renderForHydration'),
          ', the client provides its own via ',
          t.code('registerComponents'),
          ', and the framework wires the appropriate one in for each environment. Use it for transport handles, local signals, identity, or anything else that cannot round-trip through JSON. Never embedded in the SSR script block. The framework also forwards context to HMR hot-swaps so a replaced component keeps its env wiring.',
        ],
      ],
      [
        t.code('isBrowser'),
        'Both',
        [
          t.code('true'),
          ' in a browser environment, ',
          t.code('false'),
          ' in Node.js. Use to guard browser-only code that cannot go inside ',
          t.code('effect()'),
          ', such as module-level expressions or ',
          t.code('computed()'),
          ' values.',
        ],
      ],
    ]),

    t.h3('Passing non-serializable runtime data via context'),
    t.p([
      'When a component needs runtime data the server cannot serialize (a live transport handle, an identity object, locally-created signals), pass an env bag as ',
      t.code('options.context'),
      '. The framework forwards it to ',
      t.code('fn'),
      ' as the second argument. The server provides its own bag; the client provides its own; the two never cross the wire.',
    ]),
    code('javascript', `// shared/env.js. Two factories, same shape.
import { signal } from 'kensington';

export function makeServerEnv() {
  return { userId: 'ssr', userName: signal(''), transport: null };
}
export function makeClientEnv({ userId, transport }) {
  return { userId, userName: signal(''), transport };
}

// shared/app-page.js. Component takes (state, env).
import { t } from 'kensington';

export function appPage(state, env) {
  return t.main([
    t.span(env.userId),
    t.button({ onclick: () => env.transport?.reconnect() }, 'Reconnect'),
  ]);
}

// server.js
import { renderForHydration } from 'kensington';
import { makeServerEnv } from './shared/env.js';
import { appPage } from './shared/app-page.js';

const env = makeServerEnv();
renderForHydration(appPage, {}, 'appPage', { context: env });

// client.js
import { registerComponents } from 'kensington';
import { connectLive } from 'kensington/live';
import { makeClientEnv } from './shared/env.js';
import { appPage } from './shared/app-page.js';

const transport = connectLive({ /* ... */ });
const env = makeClientEnv({ userId: getTabId(), transport });
registerComponents({ appPage }, { context: env });`),
    t.p([
      'Avoid alternatives that solve the same problem in worse ways: closing over ',
      t.code('env'),
      ' in a wrapper at the ',
      t.code('renderForHydration'),
      ' call site (workable but awkward), ',
      t.code('setEnv'),
      '/',
      t.code('getEnv'),
      ' singletons (module-mutable state that races on concurrent SSR), or passing signals through ',
      t.code('state'),
      ' (they lose their methods through ',
      t.code('JSON.stringify'),
      ' and the framework warns).',
    ]),

    t.p([
      exLink('?page=examples#hydrated-like-button', 'Hydrated like button example'),
      ' ',
      exLink('?page=examples#hydrated-form-validation', 'Hydrated form validation example'),
    ]),
  ]);
}
