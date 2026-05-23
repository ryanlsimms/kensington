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
const stopFns = new WeakMap();
// sleep/wake hooks for auto-disposing computed signals when subscriber count hits zero.
const sleepFns = new WeakMap();
const wakeFns = new WeakMap();
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
    console.error(msg);
  }
}

export function _resetWarningThrottle() {
  warnLastSeen.clear();
}

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
  if (wake !== undefined && wake()) {
    const sleep = sleepFns.get(sig);
    if (sleep !== undefined) { sleep(); }
  }
}

export default class Signal {
  #value;
  #subscribers = new Set();

  constructor(initial) {
    this.#value = initial;
  }

  get() {
    if (currentEffect !== null && !this.#subscribers.has(currentEffect)) {
      if (this.#subscribers.size === 0) {
        const wake = wakeFns.get(this);
        if (wake !== undefined) { wake(); }
      }
      this.#subscribers.add(currentEffect);
      currentEffect._reads.add(this);
      const sub = currentEffect;
      sub._cleanups.push(() => {
        this.#subscribers.delete(sub);
        if (this.#subscribers.size === 0) {
          const sleep = sleepFns.get(this);
          if (sleep !== undefined) { sleep(); }
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
export function effect(fn) {
  // During SSR we only need a static snapshot; skip subscriptions entirely.
  if (ssrDepth > 0) {
    return { pause() {}, resume() {}, stop() {} };
  }
  let paused = false;
  let destroyed = false;
  function run() {
    if (paused) {
      return;
    }
    track(run, fn);
  }
  run._cleanups = [];
  run._isEffect = true;
  run();
  return {
    pause() {
      paused = true;
      pending.delete(run);
      for (const cleanup of run._cleanups) {
        cleanup();
      }
      run._cleanups = [];
    },
    resume() {
      if (destroyed) {
        return;
      }
      paused = false;
      run();
    },
    stop() {
      this.pause();
      destroyed = true;
    },
  };
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
    return s;
  }
  const s = new Signal(undefined);
  function update() {
    track(update, () => {
      let result;
      const prevInComputedFn = inComputedFn;
      inComputedFn = true;
      try {
        result = fn();
      } catch (err) {
        rethrowAsync(err);
        return;
      } finally {
        inComputedFn = prevInComputedFn;
      }
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
    for (const cleanup of update._cleanups) {
      cleanup();
    }
    update._cleanups = [];
  });
  wakeFns.set(s, () => {
    if (!sleeping) { return false; }
    sleeping = false;
    update();
    return true;
  });
  stopFns.set(s, () => {
    sleepFns.delete(s);
    wakeFns.delete(s);
    for (const cleanup of update._cleanups) {
      cleanup();
    }
    update._cleanups = [];
  });
  derivedSignals.add(s);
  return s;
}

// Defined here rather than in the class body because transform calls computed, and computed
// must be defined after Signal (it creates one). Putting this inside the class would reference
// computed before its definition, triggering no-use-before-define.
Signal.prototype.transform = function transform(fn) {
  return computed(() => fn(this.get()));
};
