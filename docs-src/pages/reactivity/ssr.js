import { apiTable } from '../../components/table.js';
import { code, exLink } from '../../components/ui.js';

export function reactivitySsr(t) {
  return t.section({ id: 'hydration' }, [
    t.h2('Server-rendered reactive data'),
    t.p([
      'Server-render a component to HTML with ',
      t.code('renderForHydration'),
      ', then pick it up on the client with ',
      t.code('registerComponents'),
      '. The SSR output is replaced with a live, reactive DOM tree using the same state that was passed on the server.',
    ]),
    code(t, 'javascript', `// server.js
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
    code(t, 'javascript', `// components/counter.js
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
    apiTable(t, ['Export', 'Context', 'Description'], [
      [
        t.code('renderForHydration(fn, state, name?)'),
        'Server',
        [
          'Renders the component to HTML and embeds state as a JSON script block. Uses ',
          t.code('fn.name'),
          ' by default or pass an explicit ',
          t.code('name'),
          ' for anonymous functions. ',
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
          ' if called while the page is still loading. Sets up a ',
          t.code('MutationObserver'),
          ' so components in dynamically fetched HTML fragments are hydrated automatically without re-calling ',
          t.code('registerComponents'),
          '. Returns ',
          t.code('{ stop() }'),
          ' to disconnect the observer.',
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

    t.h3({ id: 'known-tradeoffs' }, 'Known tradeoffs'),
    t.p('These are deliberate simplicity choices, not bugs.'),
    t.ul([
      t.li([
        t.strong('DOM replacement, not true hydration.'),
        ' The SSR elements are replaced with a fresh ',
        t.code('toElement()'),
        ' call rather than reusing them. In practice the swap is imperceptible. It is synchronous and the visual output is identical. Transitions are suppressed automatically on SSR elements until hydration completes.',
      ]),
      t.li([t.strong('Non-interactive window.'), ' Elements are non-reactive between the browser\'s first paint and when the hydration script runs. This is inherent to SSR-then-hydrate.']),
      t.li([
        t.strong('State is plaintext.'),
        ' State is embedded as a ',
        t.code('<script type="application/json">'),
        ' tag visible in page source. Do not pass secrets or tokens as hydration state.',
      ]),
      t.li([
        t.strong('Browser globals outside '),
        t.code('effect()'),
        t.strong(' will throw on the server.'),
        ' ',
        t.code('effect()'),
        ' is suppressed during server-side rendering. For browser-only code that cannot go inside ',
        t.code('effect()'),
        ': module-level code, ',
        t.code('computed()'),
        ' values, direct assignments. Use the ',
        t.code('isBrowser'),
        ' export: ',
        t.code("isBrowser && localStorage.getItem('key')"),
        '.',
      ]),
      t.li([
        t.strong('One tag, one element.'),
        ' Each tag instance maps to exactly one DOM node. Passing the same instance as a child of two different parents moves it rather than cloning it. Create separate tag instances if you need the same structure in two places.',
      ]),
      t.li([
        t.strong('Signal-driven '),
        t.code('.literal()'),
        t.strong(' does a full DOM replacement on each change.'),
        ' The entire HTML subtree between the anchor comments is torn down and re-parsed on every signal update. There is no patching. Avoid using a frequently-changing signal with large ',
        t.code('.literal()'),
        ' content.',
      ]),
      t.li([
        t.strong('Reactive element reset after removal is asynchronous.'),
        ' When a reactive element is removed from the DOM, its effects are stopped and the internal reference is cleared via MutationObserver. Calling ',
        t.code('.toElement()'),
        ' immediately after removal in synchronous code still returns the old element. Awaiting a tick (',
        t.code('await Promise.resolve()'),
        ') before the next ',
        t.code('.toElement()'),
        ' call ensures the reset has completed. Non-reactive elements are not affected: ',
        t.code('.toElement()'),
        ' returns the same node after removal and it can be re-inserted directly.',
      ]),
      t.li([
        t.strong('Module-level compute calls that are never subscribed to retain their source subscriptions indefinitely.'),
        ' ',
        t.code('computed()'),
        ' auto-disposes when its last subscriber unsubscribes, but a computed that never gains a subscriber never enters that cycle. Its internal update function stays subscribed to its source signals for the lifetime of the module. Call ',
        t.code('.stop()'),
        ' explicitly on such a computed when it is no longer needed.',
      ]),
    ]),
    t.p([
      exLink(t, '?page=examples#hydrated-like-button', 'Hydrated like button example'),
      ' ',
      exLink(t, '?page=examples#hydrated-form-validation', 'Hydrated form validation example'),
    ]),
  ]);
}
