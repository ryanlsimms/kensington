import { callout, code } from '../../components/ui.js';
import { loc, mermaid } from './helpers.js';

export function architectureSignals(t) {
  return t.section({ id: 'signal-anatomy' }, [
    t.h2('Signal Anatomy'),
    t.p([
      'Before tracing the lifecycle module, here is how a Signal works. The full implementation is at ',
      loc(t, 'esm/lib/reactive/signal.js'),
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
      code(t, 'javascript', `get() {
  if (currentEffect !== null && !this.#subscribers.has(currentEffect)) {
    this.#subscribers.add(currentEffect);
    const sub = currentEffect;
    sub._cleanups.push(() => this.#subscribers.delete(sub));
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
          'The cleanup function is pushed to the effect\'s ',
          t.code('_cleanups'),
          ' array, which the ',
          t.code('track'),
          ' helper drains and resets on each re-run.',
        ]),
      ]),
      callout(t, 'note', '.value and .toJSON() never subscribe',
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
        loc(t, 'esm/lib/reactive/signal.js'),
        ' compares via ',
        t.code('Object.is'),
        ' and bails on equality. Otherwise it updates the value and notifies subscribers:',
      ]),
      mermaid(t, `sequenceDiagram
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
      callout(t, 'warn', 'Error isolation in batches',
        t.p([
          t.code('flush()'),
          ' wraps each effect run in try/catch and re-throws via ',
          t.code('queueMicrotask'),
          '. One effect\'s thrown error does not abort the batch. Every queued effect still runs.',
        ]),
      ),
      callout(t, 'warn', 'Loop guards',
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
        loc(t, 'esm/lib/reactive/signal.js'),
        ' guards against misuse before delegating to an internal ',
        t.code('createEffect(fn)'),
        ' helper. If called inside a running effect or computed body, it fires a throttled error because a new effect is started on every re-run without stopping the old one.',
      ]),
      code(t, 'javascript', `export function effect(fn) {
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
      code(t, 'javascript', `function createEffect(fn) {
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
          t.p({ style: 'margin:0;font-size:0.88rem' }, [
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
          t.p({ style: 'margin:0;font-size:0.88rem' }, [
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
        loc(t, 'esm/lib/reactive/signal.js'),
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
      callout(t, 'note', 'computed inside effect',
        t.p([
          t.code('signal()'),
          ' called inside a ',
          t.code('computed'),
          ' or ',
          t.code('effect'),
          ' callback emits a throttled error via filterStack (see ',
          loc(t, 'esm/lib/util/filter-stack.js'),
          '). A new signal is created on every re-run, breaking the reconciler\'s snapshot fast path and leaving orphaned sleeping signals.',
        ]),
      ),
    ]),
  ]);
}
