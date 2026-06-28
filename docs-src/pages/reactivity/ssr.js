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
        t.code('renderForHydration(fn, state, name?)'),
        'Server',
        [
          'Renders the component to HTML and embeds state as a JSON script block. Uses ',
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
        t.code('registerComponents(components)'),
        'Client',
        [
          'Scans the page for components rendered by ',
          t.code('renderForHydration'),
          ' and mounts each one reactively. Object keys are used as component names: ',
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

    t.p([
      exLink('?page=examples#hydrated-like-button', 'Hydrated like button example'),
      ' ',
      exLink('?page=examples#hydrated-form-validation', 'Hydrated form validation example'),
    ]),
  ]);
}
