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
  mapFn: (item: Item) => U,
): ReadonlySignal<U[]>`),
    t.p([
      'Keyed list mapper. The first argument extracts the key (a function or a property-name string). ',
      t.code('mapFn'),
      ' runs once per key the first time the key is seen and the resulting tag is cached and reused on later renders. Call it at the same scope as ',
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
      ' immediately and re-runs it whenever any signal read inside it changes. Synchronous ',
      t.code('.set()'),
      ' calls in the same turn are batched into one re-run. During SSR (',
      t.code('renderForHydration'),
      ') it is a no-op.',
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
  options?: { context?: unknown },
): { stop(): void }`),
    t.p([
      'Hydrates all server-rendered instances in the page, replacing each matching ',
      t.code('<script type="application/json" data-k-component="…">'),
      ' block with live reactive DOM, and watches for components inserted later. Returns ',
      t.code('{ stop() }'),
      ' to halt auto-hydration. Pass ',
      t.code('options.context'),
      ' to thread a non-serializable runtime bag into every registered component as its second argument. The framework forwards the same context to HMR hot-swaps.',
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
  ]);
}
