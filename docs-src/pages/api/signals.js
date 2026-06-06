import { t } from 'kensington';

import { apiTable } from '../../components/table.js';
import { code } from '../../components/ui.js';

export function apiSignals() {
  return t.section({ id: 'api-signals' }, [
    t.h2('Signals'),
    t.p([
      'Signals are reactive values. Read them with ',
      t.code('.get()'),
      ', write them with ',
      t.code('.set()'),
      ', and derive new ones with ',
      t.code('computed()'),
      ' or ',
      t.code('.transform()'),
      '. Pass a signal as an option value or content and ',
      t.code('.toElement()'),
      ' wires up live DOM updates automatically.',
    ]),

    t.h3({ id: 'api-signal' }, 'signal'),
    code('typescript', `import { signal } from 'kensington';

signal<T>(initialValue: T): Signal<T>
signal<T>(initialValue: T, key: SignalKey): Signal<T>  // keyed form`),
    t.p([
      'Creates a writable signal holding ',
      t.code('initialValue'),
      '. Inside a ',
      t.code('computed'),
      ' callback, pass a stable ',
      t.code('key'),
      ' to scope the signal to the surrounding computed. See ',
      t.a({ href: '#api-keyed-forms' }, 'Keyed forms inside a computed'),
      '.',
    ]),

    t.h3({ id: 'signal-methods' }, 'Signal methods'),
    apiTable(['Method', 'Description'], [
      [
        t.code('.get(): T'),
        [
          'Returns the current value. When called inside ',
          t.code('computed()'),
          ' or ',
          t.code('effect()'),
          ', registers this signal as a dependency of the running computation.',
        ],
      ],
      [
        t.code('.value: T'),
        [
          'Property getter. Returns the current value without tracking. Unlike ',
          t.code('.get()'),
          ', reading ',
          t.code('.value'),
          ' inside ',
          t.code('computed()'),
          ' or ',
          t.code('effect()'),
          ' does not subscribe to this signal. The computation will not re-run when this signal changes.',
        ],
      ],
      [
        t.code('.set(value: T | (prev: T) => T): void'),
        [
          'Updates the value and notifies subscribers. Accepts a new value or an updater function. ',
          'Throws if called on a signal created by ',
          t.code('computed()'),
          ' or ',
          t.code('.transform()'),
          '.',
        ],
      ],
      [
        t.code('.transform<U>(fn, key?): Signal<U>'),
        [
          'Returns a new read-only derived signal equivalent to ',
          t.code('computed(() => fn(this.get()), key)'),
          '. Tracks all signals read inside ',
          t.code('fn'),
          ', not just the source. When called inside a ',
          t.code('computed'),
          ' callback with a stable ',
          t.code('key'),
          ', returns the same inner instance across outer re-runs. Same lifecycle as ',
          t.code('computed(fn, key)'),
          '.',
        ],
      ],
      [
        t.code('.stop(): void'),
        [
          'Clears all subscribers. For signals created by ',
          t.code('computed()'),
          ' or ',
          t.code('.transform()'),
          ', also tears down the derived computation and freezes the value.',
        ],
      ],
      [
        t.code('.toJSON(): T'),
        [
          'Returns the raw value without tracking side effects. Makes signals transparent to ',
          t.code('JSON.stringify'),
          '.',
        ],
      ],
      [
        t.code('.toString(): string'),
        [
          'Calls ',
          t.code('.get()'),
          ' and converts to string. Allows signals to be used in template literals inside reactive contexts.',
        ],
      ],
    ]),

    t.h3({ id: 'api-computed' }, 'computed'),
    code('typescript', `import { computed } from 'kensington';

computed<T>(fn: () => T): Signal<T>
computed<T>(fn: () => T, key: SignalKey): Signal<T>  // keyed form`),
    t.p([
      'Creates a read-only signal whose value is derived from other signals. Re-evaluates ',
      t.code('fn'),
      ' synchronously whenever any signal read inside it changes. The returned signal exposes ',
      t.code('.stop()'),
      ' to unsubscribe from all tracked signals and freeze the value.',
    ]),
    code('javascript', `const count = signal(0);
const label = computed(() => count.get() === 1 ? 'item' : 'items');

label.stop(); // unsubscribes from tracked signals, value freezes`),
    t.p([
      'Inside a ',
      t.code('computed'),
      ' callback, pass a stable ',
      t.code('key'),
      ' to scope the inner computed to the surrounding computed. See ',
      t.a({ href: '#api-keyed-forms' }, 'Keyed forms inside a computed'),
      '. The same pattern applies to ',
      t.code('signal()'),
      ' and ',
      t.code('.transform()'),
      '.',
    ]),

    t.h3({ id: 'api-keyed-forms' }, 'Keyed forms inside a computed'),
    t.p([
      'When you create a ',
      t.code('signal()'),
      ', ',
      t.code('computed()'),
      ', or ',
      t.code('.transform()'),
      ' inside a ',
      t.code('computed'),
      ' callback, pass a stable ',
      t.code('key'),
      ' as the second argument. All three forms behave the same way, the same key returns the same instance across outer re-runs, the instance is stopped automatically when its key leaves the list, and the whole registry is torn down when the owning computed is stopped.',
    ]),
    code('javascript', `const filter = signal('fruit');

const list = computed(() => items.get().map(item => {
  // signal(initial, key). Per-item local state
  const highlight = signal(false, item.id);
  // computed(fn, key). Derived value reading multiple signals
  const cls = computed(() => [
    filter.get() === item.category && 'match',
    highlight.get() && 'on',
  ].filter(Boolean).join(' '), item.id);
  // signal.transform(fn, key). Single-source derivation chained off filter
  const tag = filter.transform(f => f === item.category ? 'in' : 'out', item.id);
  return t.li({ dataKey: item.id, class: cls, data: { tag } }, item.name);
}));`),
    t.p([
      'For ',
      t.code('computed(fn, key)'),
      ' and ',
      t.code('signal.transform(fn, key)'),
      ', the fn closure is replaced on every outer re-run so captured variables (e.g. ',
      t.code('item.category'),
      ') stay fresh while the instance identity is stable. For ',
      t.code('signal(initial, key)'),
      ', only the first call\'s ',
      t.code('initial'),
      ' is used. Subsequent calls return the existing signal unchanged. Duplicate keys in the same outer run log an error.',
    ]),
    t.h4({ id: 'api-keyed-no-escape' }, 'Don\'t reference a keyed instance from outside its scope'),
    t.p([
      'The owner can stop a keyed instance whenever its key isn\'t accessed during a re-run (e.g. during a loading or filter state). After that point, external subscribers held in user-land code silently stop receiving updates. Use the instance freely inside the owning callback (read it, transform it, pass it as tag content or an attribute value), but don\'t let the instance reference itself escape. The unsafe patterns are assigning it to a module-level variable, returning it bare from the callback, or passing it to a function that retains it.',
    ]),
    t.p([
      'The library emits a runtime warning, and the ',
      t.code('no-out-of-scope-reactive-reference'),
      ' ESLint rule catches it statically, when a keyed instance is referenced from outside its owner.',
    ]),
    t.h4({ id: 'api-keyed-signalkey' }, 'SignalKey'),
    code('typescript', 'type SignalKey = string | number | object | symbol;'),
    t.p([
      'Any value usable in a ',
      t.code('Map'),
      ' works. Object keys (e.g. passing ',
      t.code('item'),
      ' itself) require a stable reference across outer re-runs. Immutable update patterns that clone the item break the match and lose state. Prefer ',
      t.code('item.id'),
      ' for the common immutable-update style. Reach for object keys only when you have stable item references.',
    ]),
    t.h4({ id: 'api-keyed-unkeyed' }, 'Without a key'),
    t.p([
      t.code('signal()'),
      ', ',
      t.code('computed()'),
      ', and ',
      t.code('.transform()'),
      ' inside a computed without a key still work. The reconciler detects the changed instance reference and replaces the DOM node so the fresh instance drives it. Focus, scroll, input value, and selection are preserved. Local state resets to the initial value. The library logs a ',
      t.code('console.warn'),
      ' for each form steering you toward the keyed alternative. Outside any ',
      t.code('computed'),
      ' callback, the key argument is ignored.',
    ]),

    t.h3({ id: 'api-effect' }, 'effect'),
    code('typescript', `import { effect } from 'kensington';

effect(fn: () => void): { pause(): void, resume(): void, stop(): void }`),
    t.p([
      'Runs ',
      t.code('fn'),
      ' immediately and re-runs it whenever any signal read inside it changes. Re-runs are deferred via ',
      t.code('queueMicrotask'),
      ', so multiple synchronous ',
      t.code('.set()'),
      ' calls in the same turn batch into one re-run. Errors thrown inside the callback are re-surfaced asynchronously so they do not abort other pending effects.',
    ]),
    code('javascript', `const e = effect(() => {
  document.title = \`\${count.get()} items\`;
});

e.pause();  // unsubscribes temporarily
e.resume(); // re-runs fn and re-establishes subscriptions
e.stop();   // permanently destroys. resume() after stop() is a no-op`),
    t.p([
      'Elements created with ',
      t.code('.toElement()'),
      ' automatically stop their signal effects when removed from the DOM. During SSR (',
      t.code('renderForHydration'),
      '), ',
      t.code('effect()'),
      ' is a no-op.',
    ]),

    t.h3({ id: 'prop-key' }, 'prop key'),
    t.p([
      'Use the ',
      t.code('prop'),
      ' key to assign DOM properties directly (',
      t.code('el[name] = value'),
      ') instead of using ',
      t.code('setAttribute'),
      '. This matters for properties that diverge from their HTML attributes after user interaction. Notably ',
      t.code('value'),
      ' and ',
      t.code('checked'),
      ' on form elements. And for properties with no attribute equivalent such as ',
      t.code('muted'),
      ' and ',
      t.code('playbackRate'),
      ' on media elements.',
    ]),
    code('javascript', `const query = signal('');

// Assigns el.value reactively. Keeps the live property in sync
t.input({ type: 'search', prop: { value: query } }).toElement();

// Static prop. Assigned once at render time
t.video({ src: '/intro.mp4', prop: { muted: true, playbackRate: 1.5 } }).toElement();`),
    t.p([
      'Accepts a plain object whose values are static or ',
      t.code('ReadonlySignal'),
      '. Silently ignored in ',
      t.code('.toString()'),
      '. Known writable properties (those on the element\'s DOM interface) are typed in TypeScript. Expando properties and arbitrary string keys are also accepted. Property existence and writability are validated at render time against the live element and reported via ',
      t.code('validationLevel'),
      '.',
    ]),
    code('typescript', `t.input({ prop: { value: 'hello' } });           // typed: HTMLInputElement.value
t.input({ prop: { checked: isChecked } });       // typed: boolean
t.video({ prop: { muted: true, playbackRate: 1.5 } });  // typed: HTMLVideoElement props
t.div({ prop: { _instance: component } });       // expando: accepted as unknown`),

    t.h3({ id: 'render-for-hydration' }, 'renderForHydration'),
    code('typescript', `import { renderForHydration } from 'kensington';

renderForHydration(
  fn: (state: Record<string, unknown>) => ContentTag | ContentTag[] | null | undefined,
  state: Record<string, unknown>,
  name?: string
): LiteralTag`),
    t.p([
      'Renders a component to an HTML string for server-side delivery, then embeds the state as a ',
      t.code('<script type="application/json">'),
      ' block so the browser can replace it with a live reactive DOM. Signal effects are suppressed during the component call. The component function must be synchronous.',
    ]),
    t.p([
      t.code('name'),
      ' defaults to ',
      t.code('fn.name'),
      ' when called server-side. Pass an explicit string when calling in the browser. Bundlers and minifiers rename function identifiers, so ',
      t.code('fn.name'),
      ' is not reliable after a production build. Passing an explicit name is also required for anonymous functions. The same name is used by ',
      t.code('registerComponents'),
      ' to match script blocks to component functions on the client.',
    ]),
    t.p([
      'State must be a plain serializable object. Values that cannot survive ',
      t.code('JSON.stringify'),
      ' (functions, symbols, BigInt, circular references, class instances) cause a warning or throw.',
    ]),
    code('javascript', `// server
res.send(layout(renderForHydration(counter, { count: 0 })).toString());`),

    t.h3({ id: 'register-components' }, 'registerComponents'),
    code('typescript', `import { registerComponents } from 'kensington';

registerComponents(
  components: Record<string, Function>
): { stop(): void }`),
    t.p([
      'Registers component functions and hydrates all server-rendered instances already in the page. Each matching ',
      t.code('<script type="application/json" data-k-component="…">'),
      ' block is replaced with the live reactive DOM produced by the component function. A ',
      t.code('MutationObserver'),
      ' is installed to handle components inserted dynamically after this call.',
    ]),
    t.p([
      'Returns ',
      t.code('{ stop() }'),
      ' to disconnect the observer and halt auto-hydration.',
    ]),
    code('javascript', `// client
const { stop } = registerComponents({ counter, userCard });

// later, if you want to stop watching for new components:
stop();`),
  ]);
}
