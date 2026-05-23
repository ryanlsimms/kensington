import { apiTable } from '../../components/table.js';
import { code } from '../../components/ui.js';

export function apiSignals(t) {
  return t.section({ id: 'signals' }, [
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

    t.h3({ id: 'signal' }, 'signal'),
    code(t, 'typescript', `import { signal } from 'kensington';

signal<T>(initialValue: T): Signal<T>`),
    t.p([
      'Creates a writable signal holding ',
      t.code('initialValue'),
      '.',
    ]),

    t.h3({ id: 'signal-methods' }, 'Signal methods'),
    apiTable(t, ['Method', 'Description'], [
      [
        t.code('.get(): T'),
        ['Returns the current value. When called inside ', t.code('computed()'), ' or ', t.code('effect()'), ', registers this signal as a dependency of the running computation.'],
      ],
      [
        t.code('.value: T'),
        ['Property getter. Returns the current value without tracking. Unlike ', t.code('.get()'), ', reading ', t.code('.value'), ' inside ', t.code('computed()'), ' or ', t.code('effect()'), ' does not subscribe to this signal. The computation will not re-run when this signal changes.'],
      ],
      [
        t.code('.set(value: T | (prev: T) => T): void'),
        ['Updates the value and notifies subscribers. Accepts a new value or an updater function. Throws if called on a signal created by ', t.code('computed()'), ' or ', t.code('.transform()'), '.'],
      ],
      [
        t.code('.transform<U>(fn: (value: T) => U): Signal<U>'),
        ['Returns a new read-only derived signal equivalent to ', t.code('computed(() => fn(this.get()))'), '. Tracks all signals read inside ', t.code('fn'), ', not just the source.'],
      ],
      [
        t.code('.stop(): void'),
        ['Clears all subscribers. For signals created by ', t.code('computed()'), ' or ', t.code('.transform()'), ', also tears down the derived computation and freezes the value.'],
      ],
      [
        t.code('.toJSON(): T'),
        ['Returns the raw value without tracking side effects. Makes signals transparent to ', t.code('JSON.stringify'), '.'],
      ],
      [
        t.code('.toString(): string'),
        ['Calls ', t.code('.get()'), ' and converts to string. Allows signals to be used in template literals inside reactive contexts.'],
      ],
    ]),

    t.h3({ id: 'computed' }, 'computed'),
    code(t, 'typescript', `import { computed } from 'kensington';

computed<T>(fn: () => T): Signal<T>`),
    t.p([
      'Creates a read-only signal whose value is derived from other signals. Re-evaluates ',
      t.code('fn'),
      ' synchronously whenever any signal read inside it changes. The returned signal exposes ',
      t.code('.stop()'),
      ' to unsubscribe from all tracked signals and freeze the value.',
    ]),
    code(t, 'javascript', `const count = signal(0);
const label = computed(() => count.get() === 1 ? 'item' : 'items');

label.stop(); // unsubscribes from tracked signals, value freezes`),

    t.h3({ id: 'effect' }, 'effect'),
    code(t, 'typescript', `import { effect } from 'kensington';

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
    code(t, 'javascript', `const e = effect(() => {
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
      '. This matters for properties that diverge from their HTML attributes after user interaction — notably ',
      t.code('value'),
      ' and ',
      t.code('checked'),
      ' on form elements — and for properties with no attribute equivalent such as ',
      t.code('muted'),
      ' and ',
      t.code('playbackRate'),
      ' on media elements.',
    ]),
    code(t, 'javascript', `const query = signal('');

// Assigns el.value reactively — keeps the live property in sync
t.input({ type: 'search', prop: { value: query } }).toElement();

// Static prop — assigned once at render time
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
    code(t, 'typescript', `t.input({ prop: { value: 'hello' } });           // typed: HTMLInputElement.value
t.input({ prop: { checked: isChecked } });       // typed: boolean
t.video({ prop: { muted: true, playbackRate: 1.5 } });  // typed: HTMLVideoElement props
t.div({ prop: { _instance: component } });       // expando: accepted as unknown`),

    t.h3({ id: 'render-for-hydration' }, 'renderForHydration'),
    code(t, 'typescript', `import { renderForHydration } from 'kensington';

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
    t.p(['State must be a plain serializable object. Values that cannot survive ', t.code('JSON.stringify'), ' (functions, symbols, BigInt, circular references, class instances) cause a warning or throw.']),
    code(t, 'javascript', `// server
res.send(layout(renderForHydration(counter, { count: 0 })).toString());`),

    t.h3({ id: 'register-components' }, 'registerComponents'),
    code(t, 'typescript', `import { registerComponents } from 'kensington';

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
    code(t, 'javascript', `// client
const { stop } = registerComponents({ counter, userCard });

// later, if you want to stop watching for new components:
stop();`),
  ]);
}
