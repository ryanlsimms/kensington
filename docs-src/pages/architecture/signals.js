import { t } from 'kensington';

import { callout, code } from '../../components/ui.js';
import { loc, mermaid } from './helpers.js';

export function architectureSignals() {
  return t.section({ id: 'signal-anatomy' }, [
    t.h2('Signal Anatomy'),
    t.p([
      'Before tracing the lifecycle module, here is how a Signal works. The full implementation is at ',
      loc('esm/lib/reactive/signal.js'),
      '.',
    ]),

    t.section({ id: 'signal-subscribe' }, [
      t.h3('Subscription via .get()'),
      t.p([
        'A Signal\'s subscribers are kept in a private ',
        t.code('Set'),
        ' on the instance. The mechanism that wires up a subscription is the module-scoped ',
        t.code('currentEffect'),
        ' reference, set during an ',
        t.code('effect()'),
        ' or ',
        t.code('computed()'),
        ' run:',
      ]),
      code('javascript', `get() {
  if (currentEffect !== null && !this.#subscribers.has(currentEffect)) {
    this.#subscribers.add(currentEffect);
    currentEffect._reads.add(this);
    currentEffect._cleanups.push(this);          // push the Signal, not a per-sub closure
  }
  return this.#value;
}`),
      t.ul([
        t.li([
          'Calling ',
          t.code('.get()'),
          ' outside an effect or computed registers no subscription. It\'s just a read.',
        ]),
        t.li([
          'Calling ',
          t.code('.get()'),
          ' twice in the same effect is idempotent. The ',
          t.code('has(currentEffect)'),
          ' check prevents duplicates.',
        ]),
        t.li([
          'The Signal itself is pushed to the effect\'s ',
          t.code('_cleanups'),
          ' array. On re-run or stop, ',
          t.code('track()'),
          ' walks the array and calls ',
          t.code('sig._unsubscribeFromRun(run)'),
          ' on each entry. Pushing the Signal instead of a per-subscription closure removes one closure allocation per signal read, which adds up to many thousands per render of a typical list.',
        ]),
      ]),
      callout('note', '.value and .toJSON() never subscribe',
        t.p([
          t.code('.value'),
          ' (getter) and ',
          t.code('.toJSON()'),
          ' both return ',
          t.code('this.#value'),
          ' directly. Reading ',
          t.code('.value'),
          ' inside an effect does not create a dependency. ',
          t.code('.toString()'),
          ' calls ',
          t.code('.get()'),
          ', so template literals inside reactive contexts do track.',
        ]),
      ),
    ]),

    t.section({ id: 'signal-write' }, [
      t.h3('Writes and the microtask flush'),
      t.p([
        t.code('.set(next)'),
        ' at ',
        loc('esm/lib/reactive/signal.js'),
        ' compares via ',
        t.code('Object.is'),
        ' and bails on equality. Otherwise it updates the value and notifies subscribers:',
      ]),
      mermaid(`sequenceDiagram
  participant U as User code
  participant S as Signal
  participant Q as pending Set
  participant Mt as queueMicrotask
  participant E as effect.run

  U->>S: .set(next)
  S->>S: Object.is(next, current)?
  alt equal
    S-->>U: return early
  else changed
    S->>S: value updated
    loop each subscriber
      alt subscriber is effect
        S->>Q: scheduleRun(fn)
        S->>Mt: queueMicrotask(flush)
      else subscriber is computed.update
        S->>E: update() synchronously
      end
    end
    S-->>U: return
    Mt->>Q: flush()
    loop each pending fn
      Q->>E: run()
    end
  end`),
      t.p([
        'Effects are batched. Multiple ',
        t.code('.set()'),
        ' calls in the same synchronous turn coalesce into a single re-run per effect because ',
        t.code('pending'),
        ' is a ',
        t.code('Set'),
        '.',
      ]),
      t.p([
        'Computed updates run synchronously. This is intentional. A computed reading ',
        t.code('a.get() + b.get()'),
        ' must always be consistent with the latest values of ',
        t.code('a'),
        ' and ',
        t.code('b'),
        '.',
      ]),
      callout('warn', 'Error isolation in batches',
        t.p([
          t.code('flush()'),
          ' wraps each effect run in try/catch and re-throws via ',
          t.code('queueMicrotask'),
          '. One effect\'s thrown error does not abort the batch. Every queued effect still runs.',
        ]),
      ),
      callout('warn', 'Loop guards',
        t.p([
          t.code('flush()'),
          ' tracks re-queue counts per effect via a runCounts Map. After ',
          t.code('MAX_EFFECT_LOOPS = 100'),
          ' re-queues for the same effect in one flush pass, it fires ',
          t.code('console.error'),
          ' and stops re-running that effect. A separate ',
          t.code('flushCount'),
          ' counter catches async flush loops: after ',
          t.code('MAX_FLUSHES = 500'),
          ' consecutive flushes, it fires ',
          t.code('console.error'),
          ' and clears the pending set.',
        ]),
      ),
    ]),

    t.section({ id: 'signal-effect' }, [
      t.h3('effect()'),
      t.p([
        t.code('effect(fn)'),
        ' at ',
        loc('esm/lib/reactive/signal.js'),
        ' guards against misuse before delegating to an internal ',
        t.code('createEffect(fn)'),
        ' helper. If called inside a running effect or computed body, it fires a throttled error because a new effect is started on every re-run without stopping the old one.',
      ]),
      code('javascript', `export function effect(fn) {
  if (inComputedFn) {
    throttledError('effect-in-computed', 'kensington: effect() called inside a computed or transform callback...');
  } else if (currentEffect !== null) {
    throttledError('effect-in-effect', 'kensington: effect() called inside an effect callback...');
  }
  return createEffect(fn);
}`),
      t.p([
        t.code('createEffect(fn)'),
        ' is the shared implementation:',
      ]),
      code('javascript', `function createEffect(fn) {
  if (ssrDepth > 0) {
    return { pause() {}, resume() {}, stop() {} };
  }
  let paused = false;
  let destroyed = false;
  function run() {
    if (paused) { return; }
    track(run, fn);
  }
  run._cleanups = [];
  run._isEffect = true;
  run();
  return {
    pause() {
      paused = true;
      pending.delete(run);
      for (const cleanup of run._cleanups) { cleanup(); }
      run._cleanups = [];
    },
    resume() {
      if (destroyed) { return; }
      paused = false;
      run();
    },
    stop() {
      this.pause();
      destroyed = true;
    },
  };
}`),
      t.p('The three returned methods give the caller control:'),
      t.div({ class: 'compare-grid' }, [
        t.div([
          t.h4('pause'),
          t.p({ style: { margin: '0', fontSize: '0.88rem' } }, [
            'Drains ',
            t.code('_cleanups'),
            ' (unsubscribing from every signal) and removes itself from ',
            t.code('pending'),
            '. The effect won\'t re-run until ',
            t.code('resume()'),
            ' is called.',
          ]),
        ]),
        t.div([
          t.h4('resume'),
          t.p({ style: { margin: '0', fontSize: '0.88rem' } }, [
            'Calls ',
            t.code('run()'),
            ' immediately, re-tracking subscriptions to every signal read inside it. No-op if ',
            t.code('destroyed'),
            ' is true.',
          ]),
        ]),
      ]),
      t.p([
        t.code('stop()'),
        ' calls ',
        t.code('pause()'),
        ' and sets ',
        t.code('destroyed = true'),
        ', making ',
        t.code('resume()'),
        ' a permanent no-op. This is the teardown path when an element is removed without persist mode.',
      ]),
      t.p([
        t.code('_internalEffect(fn)'),
        ' is identical to the internal ',
        t.code('createEffect'),
        ' path but skips the effect-in-effect and effect-in-computed warning checks. The lifecycle module uses it because it legitimately creates effects inside running effects during reconcile, and those effects are correctly managed by dom-tracker.',
      ]),
    ]),

    t.section({ id: 'signal-computed' }, [
      t.h3('computed()'),
      t.p([
        t.code('computed(fn)'),
        ' at ',
        loc('esm/lib/reactive/signal.js'),
        ' creates a Signal whose value is derived from other signals. Updates are synchronous (unlike effects).',
      ]),
      t.p([
        'Under ',
        t.code('ssrDepth > 0'),
        ', ',
        t.code('fn()'),
        ' runs once with no ',
        t.code('currentEffect'),
        ' set, so source ',
        t.code('.get()'),
        ' calls do not register a subscription. The returned Signal carries the snapshot value and never updates. This prevents per-request computed calls from leaking subscribers onto module-level signals that outlive the request.',
      ]),
      t.p([
        'Auto-dispose: when a computed\'s last subscriber is removed, a sleep callback unsubscribes from all sources and freezes the value. On the next ',
        t.code('.get()'),
        ' inside a reactive context, a wake callback re-runs ',
        t.code('fn()'),
        ' and re-subscribes to sources. This means an explicit ',
        t.code('.stop()'),
        ' call is rarely needed. When the parent effect re-runs and clears its subscriptions, the inner computed auto-sleeps and releases its source subscriptions automatically.',
      ]),
      callout('note', 'signal() inside computed',
        t.p([
          t.code('signal()'),
          ' called inside a ',
          t.code('computed'),
          ' callback without a key emits a throttled ',
          t.code('console.warn'),
          ' via filterStack (see ',
          loc('esm/lib/util/filter-stack.js'),
          '). A new signal is created on every re-run. The reconciler handles this by replacing the DOM node so the fresh signal\'s effect drives the new live element, and ',
          loc('esm/lib/reactive/preserve-state.js'),
          ' copies focus, scroll, input values, and selection across the swap. Local signal state still resets to the initial value. Pass a stable key as the second argument (',
          t.code('signal(initial, key)'),
          ') to scope the signal to the surrounding computed so the same instance is reused across re-runs.',
        ]),
      ),
    ]),

    t.section({ id: 'signal-keyed' }, [
      t.h3('Keyed signals'),
      t.p([
        'A second argument to ',
        t.code('signal()'),
        ' turns it into a keyed signal scoped to the innermost running ',
        t.code('computed'),
        '. The implementation in ',
        loc('esm/lib/reactive/signal.js'),
        ' tracks the active computed in a module-level ',
        t.code('currentComputed'),
        ' variable, and stores a per-computed registry in a ',
        t.code('keyedRegistries'),
        ' WeakMap:',
      ]),
      code('javascript', `export function signal(initial, key) {
  if (key !== undefined && currentComputed !== null) {
    const owner = currentComputed;
    let registry = keyedRegistries.get(owner);
    if (registry === undefined) {
      registry = { signals: new Map(), accessed: new Set() };
      keyedRegistries.set(owner, registry);
    }
    if (registry.accessed.has(key)) {
      throttledError('duplicate-keyed-signal', /* ... */);
    }
    registry.accessed.add(key);
    const existing = registry.signals.get(key);
    if (existing !== undefined) { return existing; }
    const sig = new Signal(initial);
    registry.signals.set(key, sig);
    return sig;
  }
  return new Signal(initial);
}`),
      t.p([
        'Each computed run clears its ',
        t.code('accessed'),
        ' set before invoking the user\'s function. After the run completes, any key in the registry that wasn\'t accessed is stopped and removed:',
      ]),
      code('javascript', `// Sweep keyed signals that weren't touched this run.
if (registry !== undefined) {
  for (const [k, sig] of registry.signals) {
    if (!registry.accessed.has(k)) {
      sig.stop();
      registry.signals.delete(k);
    }
  }
}`),
      t.p([
        'This handles list mappings naturally. ',
        t.code('signal(false, item.id)'),
        ' inside ',
        t.code('items.get().map(...)'),
        ' returns the same instance for the same item id across renders. When an item leaves the list, its key is never accessed, so the signal is stopped and the entry removed in the same render cycle.',
      ]),
      t.p([
        'Reuse of the same Signal reference keeps the reconciler\'s snapshot fast path effective: the new render\'s attribute object contains the same keyed-signal reference as the previous snapshot, so ',
        t.code('valueEqual'),
        ' returns true and the DOM node is reused as-is. Even when a sibling change (e.g. an added item) misses the fast path, ',
        t.code('signalRefMismatch'),
        ' returns false for the keyed-signal position, so the reconciler patches in place rather than replacing.',
      ]),
      t.p([
        'The registry uses a plain ',
        t.code('Map'),
        ' for the per-key lookup and a plain ',
        t.code('Set'),
        ' for accessed-key tracking, so the key can be any value with ',
        t.code('SameValueZero'),
        ' identity. String, number, symbol, or object reference. Object keys work when the same reference is passed across outer re-runs (e.g. mutating items in place). Immutable update patterns that clone the item object on every change break the match and lose state, so ',
        t.code('item.id'),
        ' is the safer default. The TypeScript signature reflects this with the exported alias ',
        t.code('SignalKey = string | number | object | symbol'),
        '.',
      ]),
      callout('note', 'sleep vs stop',
        t.p([
          'When the owning computed is permanently stopped (via ',
          t.code('.stop()'),
          '), the registry is torn down: every keyed signal is stopped and the WeakMap entry is deleted. When the computed merely sleeps (its last subscriber went away via auto-dispose), the registry is preserved. If the computed wakes later, the same keys return the same signal instances.',
        ]),
      ),
    ]),

    t.section({ id: 'computed-keyed' }, [
      t.h3('Keyed computeds'),
      t.p([
        'A second argument to ',
        t.code('computed()'),
        ' works the same way as for ',
        t.code('signal()'),
        ': it scopes the inner computed to the innermost running ',
        t.code('computed'),
        ' and returns the same instance for the same key across outer re-runs. The implementation stores a separate ',
        t.code('keyedComputedRegistries'),
        ' WeakMap alongside ',
        t.code('keyedRegistries'),
        '.',
      ]),
      t.p([
        'The fn closure cannot be stored in a ',
        t.code('Signal'),
        ' directly because ',
        t.code('Signal.set()'),
        ' treats function-type arguments as updater functions. Instead, the registry entry holds a mutable ',
        t.code('fnWrapper'),
        ' object and a plain numeric ',
        t.code('versionSig'),
        ' counter. The inner computed closes over both:',
      ]),
      code('javascript', `const versionSig = new Signal(0);
const fnWrapper  = { fn };
const inner = computed(() => { versionSig.get(); return fnWrapper.fn(); });`),
      t.p([
        'On each outer re-run, if the fn reference changed, the wrapper is updated and the version counter is incremented. The increment triggers the inner computed to re-run with the new fn:',
      ]),
      code('javascript', `if (existing.fnWrapper.fn !== fn) {
  existing.fnWrapper.fn = fn;
  derivedWriteDepth++;
  try {
    existing.versionSig.set(v => v + 1);
  } finally {
    derivedWriteDepth--;
  }
}
return existing.inner;`),
      t.p([
        'If the inner computed is sleeping when ',
        t.code('versionSig.set()'),
        ' is called, there are no subscribers to notify. The increment is a no-op at that moment. When the outer then calls ',
        t.code('inner.get()'),
        ', the wake path re-runs the inner\'s ',
        t.code('update()'),
        ' function, which reads ',
        t.code('fnWrapper.fn'),
        '. Already updated. And produces the correct value.',
      ]),
      t.p([
        'A ',
        t.code('keyedComputedOwnerSignals'),
        ' WeakMap records the owner outer computed for each keyed inner computed. ',
        t.code('Signal.get()'),
        ' checks this map when adding a subscriber: if the subscriber is a user-land effect or computed that is not the owner, a throttled warning fires. DOM-binding effects created via ',
        t.code('_internalEffect()'),
        ' carry an ',
        t.code('_isInternal'),
        ' flag and are skipped. Their lifetime is tied to a DOM node that is part of the owner\'s own render cycle, so a key drop and the corresponding DOM removal happen together. The warning only fires for true escapes: user code capturing a keyed instance in a long-lived effect or computed.',
      ]),
      t.p([
        t.code('Signal.prototype.transform'),
        ' is a thin wrapper that forwards its optional key to ',
        t.code('computed'),
        ', so ',
        t.code('signal.transform(fn, key)'),
        ' uses the same keyed-computed registry and lifecycle.',
      ]),
      callout('note', 'sleep vs stop',
        t.p([
          'Same rule as keyed signals: permanent ',
          t.code('.stop()'),
          ' on the outer tears down the ',
          t.code('keyedComputedRegistries'),
          ' entry and stops every inner computed and version signal. Sleep (auto-dispose) preserves the registry so the same instances are returned when the outer wakes.',
        ]),
      ),
    ]),
  ]);
}
