import filterStack from '../util/filter-stack.js';
import {
  notifyEffectCreate,
  notifyEffectPause,
  notifyEffectResume,
  notifyEffectRun,
  notifyEffectStop,
  notifySignalCreate,
  notifySignalEffectSubscription,
  notifySignalEffectUnsubscription,
  notifySignalMarkComputed,
  notifySignalMarkKeyed,
  notifySignalSet,
  notifySignalStop,
  notifySignalWake,
  notifySignalZeroSubscribers,
} from './devtools.js';

let currentEffect = null;
// Tracks whether we are inside a renderForHydration call. On the server we only need a static
// HTML snapshot, so effects must not run — they would set up subscriptions with no DOM to update
// and no cleanup path, leaking memory. Counter rather than boolean so nested calls are safe.
let ssrDepth = 0;

// Called by renderForHydration before invoking the component function.
export function _enterSSRMode() {
  ssrDepth++;
}

// Called in the finally block after the component function returns.
export function _exitSSRMode() {
  ssrDepth--;
}

export function isSSRMode() {
  return ssrDepth > 0;
}
const pending = new Set();
const runCounts = new Map();
const MAX_EFFECT_LOOPS = 100;
const MAX_FLUSHES = 500;
let scheduled = false;
let flushCount = 0;
let flushResetScheduled = false;
let inComputedFn = false;
let suppressReactiveCheck = false;
let suppressWakeNotify = false;
let inFlush = false;
const stopFns = new WeakMap();
// sleep/wake hooks for auto-disposing computed signals when subscriber count hits zero.
const sleepFns = new WeakMap();
const wakeFns = new WeakMap();
// Computed signals whose sleep has been deferred until after the current flush. If the
// subscriber comes back before the microtask fires (the common case when a DOM-binding
// effect re-runs), the entry is removed and sleep is cancelled — no sleep/wake round-trip.
const pendingSleep = new Set();
// Tracks signals created by computed()/transform() so .set() can be blocked on them.
const derivedSignals = new WeakSet();
// Counter rather than boolean so nested computed calls don't prematurely re-enable the guard.
let derivedWriteDepth = 0;
const warnLastSeen = new Map();
const WARN_THROTTLE_MS = 1000;

function throttledError(key, msg) {
  const now = Date.now();
  if (now - (warnLastSeen.get(key) ?? 0) >= WARN_THROTTLE_MS) {
    warnLastSeen.set(key, now);
    const error = filterStack(new Error(msg));
    console.error(error.stack ?? msg);
  }
}

function throttledWarn(key, msg) {
  const now = Date.now();
  if (now - (warnLastSeen.get(key) ?? 0) >= WARN_THROTTLE_MS) {
    warnLastSeen.set(key, now);
    const error = filterStack(new Error(msg));
    console.warn(error.stack ?? msg);
  }
}

export function _resetWarningThrottle() {
  warnLastSeen.clear();
}

// Tracks the innermost computed currently running, so signal(initial, key) can scope
// keyed signal lookups to that computed instance. Saved/restored as a stack across nested
// computed runs (which are warned against but otherwise tolerated).
let currentComputed = null;
// Per-computed registry of keyed signals. Each entry has `signals: Map<key, Signal>` and
// `accessed: Set<key>`. After each computed run, keys not accessed are stopped and removed,
// so signals tied to items that have left the list are cleaned up automatically.
const keyedRegistries = new WeakMap();

function rethrowAsync(err) {
  queueMicrotask(() => { throw err; });
}

function flush() {
  scheduled = false;
  flushCount++;
  if (!flushResetScheduled) {
    flushResetScheduled = true;
    setTimeout(() => { flushCount = 0; flushResetScheduled = false; }, 0);
  }
  if (flushCount > MAX_FLUSHES) {
    throttledError(
      'async-loop',
      `kensington: async reactive loop detected. flush() was called ${flushCount} times without a macrotask turn. ` +
      'An effect is likely setting a signal inside a queueMicrotask or Promise callback in a cycle. ' +
      'Guard the write with a condition check to confirm the update is still needed before calling .set().',
    );
    pending.clear();
    return;
  }
  runCounts.clear();
  inFlush = true;
  try {
    while (pending.size > 0) {
      const batch = [...pending];
      pending.clear();
      for (const fn of batch) {
        const count = (runCounts.get(fn) ?? 0) + 1;
        runCounts.set(fn, count);
        if (count > MAX_EFFECT_LOOPS) {
          throttledError(
            'sync-loop',
            `kensington: reactive loop detected. The same effect was re-queued ${count} times in a single flush. ` +
            'Check for an effect that writes to a signal it also reads, or two effects that write to each other\'s signal dependencies. ' +
            'For effects with async callbacks (queueMicrotask, setTimeout, fetch), guard the write with a condition check to confirm the update is still needed before calling .set().',
          );
          continue;
        }
        try {
          fn();
        } catch (err) {
          rethrowAsync(err);
        }
      }
    }
  } finally {
    inFlush = false;
  }
  runCounts.clear();
}

function scheduleRun(fn) {
  pending.add(fn);
  if (!scheduled) {
    scheduled = true;
    queueMicrotask(flush);
  }
}

function wakeForRead(sig) {
  const wake = wakeFns.get(sig);
  if (wake !== undefined) {
    suppressWakeNotify = true;
    const woken = wake();
    if (woken) {
      const sleep = sleepFns.get(sig);
      if (sleep !== undefined) { sleep(); }
    }
    suppressWakeNotify = false;
  }
}

export default class Signal {
  #value;
  #subscribers = new Set();

  constructor(initial) {
    this.#value = initial;
    notifySignalCreate(this, initial, v => { this.set(v); });
    if (!suppressReactiveCheck) {
      if (inComputedFn) {
        throttledWarn(
          'signal-in-computed',
          'kensington: signal() called inside a computed or transform callback without a key. ' +
          'The DOM node will be replaced when outer state changes. ' +
          'Focus, scroll, input value, and selection are preserved across the replacement, ' +
          'but local signal state resets to the initial value. ' +
          'For best performance and to persist local state, pass a stable key as the second argument: signal(initial, key).',
        );
      } else if (currentEffect !== null) {
        throttledError(
          'signal-in-effect',
          'kensington: signal() called inside an effect callback. ' +
          'A new signal is created on every effect re-run. ' +
          'Create signals outside the effect and pass them in.',
        );
      }
    }
  }

  get() {
    if (currentEffect !== null && !this.#subscribers.has(currentEffect)) {
      if (this.#subscribers.size === 0) {
        if (pendingSleep.has(this)) {
          pendingSleep.delete(this);
        } else {
          const wake = wakeFns.get(this);
          if (wake !== undefined) { wake(); }
        }
      }
      this.#subscribers.add(currentEffect);
      currentEffect._reads.add(this);
      notifySignalEffectSubscription(this, currentEffect._devId, this.#subscribers.size);
      const sub = currentEffect;
      sub._cleanups.push(() => {
        this.#subscribers.delete(sub);
        notifySignalEffectUnsubscription(this, sub._devId, this.#subscribers.size);
        if (this.#subscribers.size === 0) {
          const sleep = sleepFns.get(this);
          if (sleep === undefined) {
            notifySignalZeroSubscribers(this);
          } else if (inFlush) {
            pendingSleep.add(this);
            queueMicrotask(() => {
              if (!pendingSleep.has(this)) { return; }
              pendingSleep.delete(this);
              sleep();
            });
          } else {
            sleep();
          }
        }
      });
    } else if (currentEffect === null) {
      wakeForRead(this);
    }
    return this.#value;
  }

  get value() {
    wakeForRead(this);
    return this.#value;
  }

  set(valueOrFn) {
    // Blocks external writes to computed/transform signals; depth > 0 means we're inside an update().
    if (derivedSignals.has(this) && derivedWriteDepth === 0) {
      throw new Error('Cannot call .set() on a computed or derived signal. Use signal() for writable state.');
    }
    const next = typeof valueOrFn === 'function' ? valueOrFn(this.#value) : valueOrFn;
    if (Object.is(next, this.#value)) {
      return;
    }
    if (currentEffect !== null && currentEffect._reads.has(this)) {
      throttledError(
        'set-in-effect',
        'kensington: a signal was read via .get() and written via .set() in the same effect or computed run. ' +
        'This creates a reactive loop — the write re-triggers the run, which writes again. ' +
        'Use .value instead of .get() if you need the current value without subscribing.',
      );
    }
    if (inComputedFn && derivedWriteDepth === 0) {
      throttledError(
        'set-in-computed',
        'kensington: .set() called inside a computed function. ' +
        'Computeds must be pure derivations. Move the write into a separate effect() instead.',
      );
    }
    this.#value = next;
    notifySignalSet(this, next, this.#subscribers.size);
    for (const fn of [...this.#subscribers]) {
      if (fn._isEffect) {
        scheduleRun(fn);
      } else {
        fn(this.#value);
      }
    }
  }

  stop() {
    const fn = stopFns.get(this);
    if (fn !== undefined) {
      fn();
      stopFns.delete(this);
    }
    this.#subscribers.clear();
    notifySignalStop(this);
  }

  toJSON() {
    wakeForRead(this);
    return this.#value;
  }

  toString() {
    return String(this.get());
  }
}

function track(run, fn) {
  for (const cleanup of run._cleanups) {
    cleanup();
  }
  run._cleanups = [];
  run._reads = new Set();
  const prev = currentEffect;
  currentEffect = run;
  try {
    return fn();
  } finally {
    currentEffect = prev;
  }
}

/**
 * Runs `fn` immediately and re-runs it whenever any signal read via `.get()` inside changes.
 * Returns `{ pause(), resume(), stop() }`. `pause()` unsubscribes temporarily; `resume()` restarts.
 * `stop()` permanently destroys the effect — calling `resume()` after `stop()` is a no-op.
 * @param {function(): void} fn
 * @returns {{ pause: function(): void, resume: function(): void, stop: function(): void }}
 */
function createEffect(fn) {
  if (ssrDepth > 0) {
    return { pause() {}, resume() {}, stop() {} };
  }
  let paused = false;
  let destroyed = false;
  const _devId = notifyEffectCreate(fn);
  function run() {
    if (paused) {
      return;
    }
    notifyEffectRun(_devId);
    track(run, fn);
  }
  run._cleanups = [];
  run._isEffect = true;
  run._devId = _devId;
  run();
  return {
    _devId,
    pause() {
      paused = true;
      pending.delete(run);
      for (const cleanup of run._cleanups) {
        cleanup();
      }
      run._cleanups = [];
      notifyEffectPause(_devId);
    },
    resume() {
      if (destroyed) {
        return;
      }
      paused = false;
      notifyEffectResume(_devId);
      run();
    },
    stop() {
      this.pause();
      destroyed = true;
      notifyEffectStop(_devId);
    },
  };
}

export function effect(fn) {
  if (inComputedFn) {
    throttledError(
      'effect-in-computed',
      'kensington: effect() called inside a computed or transform callback. ' +
      'A new effect is started on every re-run and the previous one is never stopped. ' +
      'Create effects outside the reactive callback.',
    );
  } else if (currentEffect !== null) {
    throttledError(
      'effect-in-effect',
      'kensington: effect() called inside an effect callback. ' +
      'A new effect is started on every re-run and the previous one is never stopped. ' +
      'Create effects at the top level or return a cleanup from the outer effect.',
    );
  }
  return createEffect(fn);
}

// For library-internal use only. Creates an effect without the effect-in-effect/computed
// warning checks — lifecycle.js legitimately creates effects inside running effects during
// reconcile, and those effects are correctly managed and stopped by dom-tracker.
export function _internalEffect(fn) {
  return createEffect(fn);
}

/**
 * Creates a read-only signal derived from other signals. Re-runs automatically whenever
 * any signal read via `.get()` inside the function changes. Call `.stop()` to unsubscribe
 * from all tracked signals and freeze the value.
 * @template T
 * @param {function(): T} fn
 * @returns {Signal<T>}
 * @example
 * const active = signal(true);
 * const cls = computed(() => active.get() ? 'btn-primary' : 'btn-outline');
 */
export function computed(fn) {
  // Under SSR we want the value but not the subscription. Subscribing to a source signal
  // that outlives the request (e.g. a module-level signal) would permanently retain the
  // computed's update function in that source's subscriber set, leaking once per request.
  // currentEffect is null here, so reading sources via .get() inside fn() will not
  // register a subscription either.
  if (ssrDepth > 0) {
    const s = new Signal(fn());
    derivedSignals.add(s);
    notifySignalMarkComputed(s);
    return s;
  }
  if (inComputedFn) {
    throttledError(
      'computed-in-computed',
      'kensington: computed() called inside a computed or transform callback. ' +
      'A new computed is created on every re-run, breaking the reconciler snapshot fast-path and leaving orphaned sleeping signals. ' +
      'Create computeds outside the reactive callback and pass them in.',
    );
  } else if (currentEffect !== null) {
    throttledError(
      'computed-in-effect',
      'kensington: computed() called inside an effect callback. ' +
      'A new computed is created on every effect re-run and the previous one is never stopped. ' +
      'Create computeds outside the effect or call .transform() on a signal that outlives the effect.',
    );
  }
  suppressReactiveCheck = true;
  const s = new Signal(undefined);
  suppressReactiveCheck = false;
  notifySignalMarkComputed(s);
  // Tracks the last successfully computed value so notifySignalWake can restore it.
  // Without this, a wake where s.set(result) is a no-op (Object.is match) would leave
  // the devtools entry at value: undefined from notifySignalWake forever.
  let lastResult;
  function update() {
    track(update, () => {
      let result;
      const prevInComputedFn = inComputedFn;
      const prevComputed = currentComputed;
      inComputedFn = true;
      currentComputed = s;
      // Reset accessed-key tracking for this run. Any registry entry whose key isn't
      // accessed during this run is swept after the run completes.
      const registry = keyedRegistries.get(s);
      if (registry !== undefined) { registry.accessed.clear(); }
      try {
        result = fn();
      } catch (err) {
        rethrowAsync(err);
        return;
      } finally {
        inComputedFn = prevInComputedFn;
        currentComputed = prevComputed;
      }
      // Sweep keyed signals that weren't touched this run. Their owning item left the list
      // (or was renamed); stop the signal and drop it from the registry so it can be GC'd.
      if (registry !== undefined) {
        for (const [k, sig] of registry.signals) {
          if (!registry.accessed.has(k)) {
            sig.stop();
            registry.signals.delete(k);
          }
        }
      }
      lastResult = result;
      derivedWriteDepth++;
      try {
        s.set(result);
      } catch (err) {
        rethrowAsync(err);
      } finally {
        derivedWriteDepth--;
      }
    });
  }
  update._cleanups = [];
  update();
  // sleeping is false initially: the computed is active (subscribed to sources) even though
  // it has no subscribers yet. It becomes true only after losing its last subscriber, at
  // which point sources are unsubscribed and the value is frozen until a new subscriber wakes it.
  let sleeping = false;
  sleepFns.set(s, () => {
    sleeping = true;
    // Suppress during transient wakeForRead reads (.toJSON(), .value, .get() outside reactive
    // context) so serializing a value that contains sleeping computed signals does not emit
    // spurious computed:stop events and trigger unnecessary devtools re-renders.
    if (!suppressWakeNotify) { notifySignalStop(s); }
    for (const cleanup of update._cleanups) {
      cleanup();
    }
    update._cleanups = [];
  });
  wakeFns.set(s, () => {
    if (!sleeping) { return false; }
    sleeping = false;
    // Re-add to devtools before update() so notifySignalSet can find the entry.
    // suppressWakeNotify is true when called from wakeForRead (transient read for toJSON/.value),
    // so those reads stay silent and don't produce temporary devtools entries.
    if (!suppressWakeNotify) { notifySignalWake(s, lastResult); }
    update();
    return true;
  });
  stopFns.set(s, () => {
    pendingSleep.delete(s);
    sleepFns.delete(s);
    wakeFns.delete(s);
    for (const cleanup of update._cleanups) {
      cleanup();
    }
    update._cleanups = [];
    // Stop any keyed signals that this computed owned, so their subscribers are cleared
    // and devtools entries are removed.
    const registry = keyedRegistries.get(s);
    if (registry !== undefined) {
      for (const sig of registry.signals.values()) {
        sig.stop();
      }
      keyedRegistries.delete(s);
    }
  });
  derivedSignals.add(s);
  return s;
}

/**
 * Creates a reactive signal. Pass as content or an attribute value — the DOM updates live.
 * When called inside a computed callback with a stable `key`, returns the same signal
 * instance across re-runs (scoped to that computed). This is the recommended pattern for
 * local interactive state inside list mappings: pass the item's id as the key.
 * @template T
 * @param {T} initial
 * @param {string | number} [key]
 * @returns {Signal<T>}
 * @example
 * // Module-level signal — same instance for the lifetime of the page.
 * const count = signal(0);
 * @example
 * // Keyed signal inside a computed — same instance per key across re-runs.
 * const list = computed(() => items.get().map(item => {
 *   const highlight = signal(false, item.id);
 *   return t.li({ dataKey: item.id, class: highlight }, item.label);
 * }));
 */
export function signal(initial, key) {
  if (key !== undefined && currentComputed !== null) {
    const owner = currentComputed;
    let registry = keyedRegistries.get(owner);
    if (registry === undefined) {
      registry = { signals: new Map(), accessed: new Set() };
      keyedRegistries.set(owner, registry);
    }
    if (registry.accessed.has(key)) {
      throttledError(
        'duplicate-keyed-signal',
        `kensington: signal() called twice with key "${key}" in the same computed run. ` +
        'Each keyed signal needs a unique key per computed run, or two items will share state. ' +
        'Use a key that includes the item identity (e.g., item.id).',
      );
    }
    registry.accessed.add(key);
    const existing = registry.signals.get(key);
    if (existing !== undefined) {
      return existing;
    }
    // Suppress the signal-in-computed warning. Keyed signals are the intended pattern;
    // a warning would fire on every fresh key (every item added to a list).
    const prevSuppress = suppressReactiveCheck;
    suppressReactiveCheck = true;
    const sig = new Signal(initial);
    suppressReactiveCheck = prevSuppress;
    notifySignalMarkKeyed(sig, key);
    registry.signals.set(key, sig);
    return sig;
  }
  return new Signal(initial);
}

// Defined here rather than in the class body because transform calls computed, and computed
// must be defined after Signal (it creates one). Putting this inside the class would reference
// computed before its definition, triggering no-use-before-define.
Signal.prototype.transform = function transform(fn) {
  return computed(() => fn(this.get()));
};
