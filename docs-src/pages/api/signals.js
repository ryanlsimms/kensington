import { t } from 'kensington';

import { apiTable } from '../../components/table.js';
import { code } from '../../components/ui.js';

export function apiSignals() {
  return t.section({ id: 'api-signals' }, [
    t.h2('Signals'),
    t.p([
      'Reactive values. Read with ',
      t.code('.get()'),
      ', write with ',
      t.code('.set()'),
      ', derive with ',
      t.code('computed()'),
      ' or ',
      t.code('.transform()'),
      '. See the ',
      t.a({ href: '?page=reactivity' }, 'reactive data guide'),
      ' for usage.',
    ]),

    t.h3({ id: 'api-signal' }, 'signal'),
    code('typescript', `import { signal } from 'kensington';

signal<T>(initialValue: T): Signal<T>
signal<T>(initialValue: T, key: SignalKey): Signal<T>  // keyed form`),
    t.p([
      'Creates a writable signal holding ',
      t.code('initialValue'),
      '. The keyed form is documented under ',
      t.a({ href: '#api-keyed-forms' }, 'Keyed forms'),
      '.',
    ]),

    t.h3({ id: 'signal-methods' }, 'Signal methods'),
    apiTable(['Method', 'Description'], [
      [
        t.code('.get(): T'),
        [
          'Returns the current value. Inside ',
          t.code('computed()'),
          ' or ',
          t.code('effect()'),
          ', registers this signal as a dependency.',
        ],
      ],
      [
        t.code('.value: T'),
        [
          'Property getter. Returns the current value without tracking. Reading it inside ',
          t.code('computed()'),
          ' or ',
          t.code('effect()'),
          ' does not subscribe.',
        ],
      ],
      [
        t.code('.set(value: T | (prev: T) => T): void'),
        [
          'Updates the value and notifies subscribers. Accepts a value or an updater function. Throws on signals from ',
          t.code('computed()'),
          ' or ',
          t.code('.transform()'),
          '.',
        ],
      ],
      [
        t.code('.transform<U>(fn, key?): ReadonlySignal<U>'),
        [
          'Returns a read-only derived signal, equivalent to ',
          t.code('computed(() => fn(this.get()), key)'),
          '. Tracks all signals read inside ',
          t.code('fn'),
          '.',
        ],
      ],
      [
        t.code('.stop(): void'),
        [
          'Clears all subscribers. For derived signals, also tears down the computation and freezes the value.',
        ],
      ],
      [
        t.code('.toJSON(): T'),
        ['Returns the raw value without tracking. Makes signals transparent to ', t.code('JSON.stringify'), '.'],
      ],
      [
        t.code('.toString(): string'),
        ['Calls ', t.code('.get()'), ' and converts to string. Tracks in reactive contexts.'],
      ],
    ]),

    t.h3({ id: 'api-batch' }, 'batch'),
    code('typescript', `import { batch } from 'kensington';

batch<T>(fn: () => T): T`),
    t.p([
      'Runs ',
      t.code('fn'),
      ' immediately and defers effects and DOM bindings caused by signal writes until the outermost batch returns. Nested batches coalesce into the same commit, the callback return value is preserved, and computed values stay current inside the callback. Computeds still recompute after every source write. Creating or resuming an effect still runs it immediately. A net-zero batch still runs a dirtied effect once. Outside a batch, signal updates propagate synchronously.',
    ]),
    code('javascript', `batch(() => {
  firstName.set('Grace');
  lastName.set('Hopper');
}); // dependent effects and DOM bindings run once here`),
    t.p([
      t.code('batch()'),
      ' accepts only callbacks that finish while the call is running. Kensington rejects async functions and generator functions before their bodies run. If an ordinary function returns a Promise, Kensington throws after that function returns. Promise work already scheduled is not cancelled. Writes from that later work run outside the batch. TypeScript reports Promise returning callbacks as errors.',
    ]),
    t.p([
      'Await any asynchronous work before calling ',
      t.code('batch()'),
      '. Then group the signal changes that should update the page together.',
    ]),
    t.p([
      'A batch is not an undo mechanism. If the callback throws an error, signal changes made before the error are kept. Any waiting effects and DOM updates still run.',
    ]),
    t.p([
      t.code('batch()'),
      ' works in browser and server environments, including inside ',
      t.code('renderForHydration'),
      '. It does not permit signal mutation during server rendering. Signals remain read only while a component is rendered for hydration.',
    ]),

    t.h3({ id: 'api-computed' }, 'computed'),
    code('typescript', `import { computed } from 'kensington';

computed<T>(fn: () => T): ReadonlySignal<T>
computed<T>(fn: () => T, key: SignalKey): ReadonlySignal<T>  // keyed form`),
    t.p([
      'Creates a read-only signal derived from other signals. Re-evaluates ',
      t.code('fn'),
      ' synchronously whenever any signal read inside it changes. Exposes ',
      t.code('.stop()'),
      ' to unsubscribe and freeze the value. The keyed form is documented under ',
      t.a({ href: '#api-keyed-forms' }, 'Keyed forms'),
      '.',
    ]),

    t.h3({ id: 'api-keyed-forms' }, 'Keyed forms inside a computed'),
    t.p([
      'Pass a stable ',
      t.code('key'),
      ' as the second argument to scope the instance to the surrounding ',
      t.code('computed'),
      ' callback. The same key returns the same instance across outer re-runs. The instance is stopped automatically when its key leaves the list, and the whole registry is torn down when the owning computed is stopped.',
    ]),
    apiTable(['Form', 'Identity across outer re-runs'], [
      [t.code('signal(initial, key)'), 'Same key returns the same signal. Only the first call\'s initial is used.'],
      [
        t.code('computed(fn, key)'),
        'Same key returns the same inner instance. The fn closure is refreshed each run so captured values stay current.',
      ],
      [t.code('signal.transform(fn, key)'), ['Same lifecycle as ', t.code('computed(fn, key)'), '. Single-source.']],
    ]),
    code('typescript', 'type SignalKey = string | number | object | symbol;'),
    t.p([
      'Without a key these forms still work, but the instance is re-created on every outer re-run, local state resets, and a warning is logged. A keyed instance reference must not escape its owner. The ',
      t.code('no-out-of-scope-reactive-reference'),
      ' ESLint rule and a runtime warning catch escapes. See ',
      t.a({ href: '?page=reactivity#signals-keyed-local-state' }, 'per-item local state'),
      ' in the guide.',
    ]),

    t.h3({ id: 'api-map-with-key' }, 'signal.mapWithKey'),
    code('typescript', `signal.mapWithKey<Item, U>(
  keyOrProp: ((item: Item) => SignalKey) | keyof Item,
  mapFn: (item: Item, key: SignalKey) => U,
): ReadonlySignal<U[]>`),
    t.p([
      'Keyed list mapper. The first argument extracts the key (a function or a property-name string). Each key owns a stable tag instance the reconciler reuses across reorderings, adds, and removes. ',
      t.code('mapFn'),
      ' re-runs when the outer array delivers a new object for a key AND its shallow own-enumerable fields actually differ.',
      t.code('mapWithKey'),
      ' at the same scope as ',
      t.code('signal()'),
      ', not inside a ',
      t.code('computed'),
      ' or ',
      t.code('effect'),
      ' callback. See ',
      t.a({ href: '?page=reactivity#signals-keyed-lists' }, 'keyed lists'),
      ' in the guide.',
    ]),

    t.h3({ id: 'api-effect' }, 'effect'),
    code('typescript', `import { effect } from 'kensington';

effect(fn: () => void): { pause(): void, resume(): void, stop(): void }`),
    t.p([
      'Runs ',
      t.code('fn'),
      ' immediately and re-runs it synchronously whenever any signal read inside it changes. Use ',
      t.code('batch()'),
      ' to coalesce several writes into one re-run. During SSR (',
      t.code('renderForHydration'),
      ') it is a no-op. An error from the initial callback is cleaned up and rethrown synchronously by effect(). Errors from later dependency-triggered re-runs are isolated and surfaced on a microtask, so a try/catch around the originating .set() does not catch them.',
    ]),
    apiTable(['Method', 'Description'], [
      [t.code('.pause()'), 'Unsubscribes temporarily.'],
      [t.code('.resume()'), 'Re-runs fn and re-establishes subscriptions.'],
      [
        t.code('.stop()'),
        ['Permanently destroys the effect. ', t.code('resume()'), ' after ', t.code('stop()'), ' is a no-op.'],
      ],
    ]),

    t.h3({ id: 'prop-key' }, 'prop key'),
    t.p([
      'Assigns DOM properties directly (',
      t.code('el[name] = value'),
      ') instead of ',
      t.code('setAttribute'),
      '. Accepts a plain object whose values are static or ',
      t.code('ReadonlySignal'),
      '. Ignored in ',
      t.code('.toString()'),
      '. Property existence and writability are validated at render time and reported via ',
      t.code('validationLevel'),
      '.',
    ]),
    code('typescript', `t.input({ prop: { value: 'hello' } });           // typed: HTMLInputElement.value
t.input({ prop: { checked: isChecked } });       // typed: boolean
t.video({ prop: { muted: true, playbackRate: 1.5 } });  // typed: HTMLVideoElement props
t.div({ prop: { _instance: component } });       // expando: accepted as unknown`),

    t.h3({ id: 'render-for-hydration' }, 'renderForHydration'),
    code('typescript', `import { renderForHydration } from 'kensington';

renderForHydration<S>(
  fn: (state: S, context?: any) => ContentTag | ContentTag[] | null | undefined,
  state: S,
  name?: string,
  options?: { context?: unknown },
): LiteralTag`),
    t.p([
      'Renders a synchronous component to an HTML string and embeds ',
      t.code('state'),
      ' as a ',
      t.code('<script type="application/json">'),
      ' block for client hydration.',
    ]),
    apiTable(['Argument', 'Description'], [
      [t.code('fn'), [
        'The component function. Receives ',
        t.code('state'),
        ' and ',
        t.code('context'),
        ' as positional arguments. Signal effects are suppressed during the call.',
      ]],
      [
        t.code('state'),
        [
          'A plain serializable object. Values that cannot survive ',
          t.code('JSON.stringify'),
          ' warn or throw.',
        ],
      ],
      [
        t.code('name'),
        [
          'Defaults to ',
          t.code('fn.name'),
          ' server-side. Pass an explicit string in the browser and for anonymous functions. Must match the key used by ',
          t.code('registerComponents'),
          '.',
        ],
      ],
      [
        t.code('options.context'),
        [
          'Non-serializable runtime bag passed to ',
          t.code('fn'),
          ' as its second argument. Use it for transport handles, local signals, identity, or anything else that cannot round-trip through JSON. Never embedded in the SSR script block. The client supplies its own context via ',
          t.code('registerComponents'),
          '.',
        ],
      ],
    ]),

    t.h3({ id: 'register-components' }, 'registerComponents'),
    code('typescript', `import { registerComponents } from 'kensington';

registerComponents(
  components: Record<string, (state: any, context?: any) => ContentTag | ContentTag[] | null>,
  options?: { context?: unknown; nonce?: string },
): void`),
    t.p([
      'Hydrates all server-rendered instances in the page, replacing each matching ',
      t.code('<script type="application/json" data-k-component="…">'),
      ' block with live reactive DOM, and watches for components inserted later. Registrations last for the document\'s lifetime and the function returns nothing. Pass ',
      t.code('options.context'),
      ' to thread a non-serializable runtime bag into every registered component as its second argument. The framework forwards the same context to HMR hot-swaps. Under a strict Content Security Policy, pass ',
      t.code('options.nonce'),
      ' to authorize the transient style element that suppresses transitions during hydration.',
    ]),
    t.p([
      'Register each component name once. A duplicate name produces a warning and is ignored, even if the function is the same. The original function, context, and nonce stay unchanged. New names in the same call still register. HMR updates component functions separately and does not require another registration.',
    ]),
    code('javascript', `// shared/app-page.js
export function appPage(state, env) {
  return t.main([header(env), seatGrid(env)]);
}

// server.js
const env = makeServerEnv();
renderForHydration(appPage, {}, 'appPage', { context: env });

// client.js
const transport = connectLive({ url: '/...' });
const env = makeClientEnv({ transport });
registerComponents({ appPage }, { context: env });`),
    t.section({ id: 'register-components-nonce' }, [
      t.h4('Using a CSP nonce'),
      t.p([
        'If your Content Security Policy requires a nonce for inline styles, pass the page nonce to ',
        t.code('registerComponents'),
        '. Kensington adds it to the temporary style elements that prevent transitions from replaying during hydration.',
      ]),
      t.p([
        'This Express example creates a fresh random nonce for each HTML response, following the ',
        t.a({ href: 'https://www.w3.org/TR/CSP3/#security-nonces' }, 'CSP nonce requirements'),
        '. It uses the same value in the response header and the client script element. Bundle ',
        t.code('client.js'),
        ' to ',
        t.code('public/client.js'),
        ' with your usual build tool. Express serves that bundle from the same origin as the page.',
      ]),
      code('javascript', `// shared/counter.js
import { signal, t } from 'kensington';

export function counter({ initial }) {
  const count = signal(initial);
  return t.button({
    type: 'button',
    onclick: () => count.set(n => n + 1),
  }, [count, ' clicks']);
}`),
      code('javascript', `// server.js
import { randomBytes } from 'node:crypto';
import express from 'express';
import { renderForHydration, t } from 'kensington';
import { counter } from './shared/counter.js';

const app = express();
app.use(express.static('public'));

app.get('/', (req, res) => {
  const nonce = randomBytes(16).toString('base64');
  res.set('Content-Security-Policy', [
    "default-src 'self'",
    \`script-src 'self' 'nonce-\${nonce}'\`,
    \`style-src 'self' 'nonce-\${nonce}'\`,
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join('; '));
  res.set('Cache-Control', 'no-store');

  res.type('html').send(t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.title('Counter'),
    ]),
    t.body([
      renderForHydration(counter, { initial: 0 }, 'counter'),
      t.script({ id: 'app-client', type: 'module', src: '/client.js', nonce }),
    ]),
  ]).toString());
});

app.listen(3000);`),
      code('javascript', `// client.js
import { registerComponents } from 'kensington';
import { counter } from './shared/counter.js';

const nonce = document.getElementById('app-client').nonce;
registerComponents({ counter }, { nonce });`),
      t.p([
        'Read the script element\'s ',
        t.code('.nonce'),
        ' property. Browsers hide the value from ',
        t.code("getAttribute('nonce')"),
        ' under CSP, as described in the ',
        t.a({ href: 'https://html.spec.whatwg.org/multipage/urls-and-fetching.html#attr-nonce' }, 'HTML nonce rules'),
        '. The client reads the server value instead of generating another one. If your server middleware already creates a nonce, use that value throughout.',
      ]),
      t.p([
        'The example disables HTML caching so a later response does not reuse the nonce. The client bundle can still be cached. Keep the page nonce for components inserted later into the same document, and pass it to each ',
        t.code('registerComponents'),
        ' call that needs it.',
      ]),
      t.p([
        'This option only authorizes Kensington\'s hydration style guards. It does not change the page policy or authorize your own inline styles. If your policy also defines ',
        t.code('style-src-elem'),
        ', include the same nonce there because that directive takes precedence for style elements. Adjust the rest of the policy for the resources your application needs.',
      ]),
    ]),
  ]);
}
