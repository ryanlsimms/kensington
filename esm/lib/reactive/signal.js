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
let scheduled = false;
const stopFns = new WeakMap();
// Tracks signals created by computed()/transform() so .set() can be blocked on them.
const derivedSignals = new WeakSet();
// Counter rather than boolean so nested computed calls don't prematurely re-enable the guard.
let derivedWriteDepth = 0;

function rethrowAsync(err) {
  queueMicrotask(() => { throw err; });
}

function flush() {
  scheduled = false;
  while (pending.size > 0) {
    const batch = [...pending];
    pending.clear();
    for (const fn of batch) {
      try {
        fn();
      } catch (err) {
        rethrowAsync(err);
      }
    }
  }
}

function scheduleRun(fn) {
  pending.add(fn);
  if (!scheduled) {
    scheduled = true;
    queueMicrotask(flush);
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
      this.#subscribers.add(currentEffect);
      const sub = currentEffect;
      sub._cleanups.push(() => this.#subscribers.delete(sub));
    }
    return this.#value;
  }

  get value() {
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
      derivedWriteDepth++;
      try {
        s.set(fn());
      } catch (err) {
        rethrowAsync(err);
      } finally {
        derivedWriteDepth--;
      }
    });
  }
  update._cleanups = [];
  update();
  stopFns.set(s, () => {
    for (const cleanup of update._cleanups) {
      cleanup();
    }
    update._cleanups = [];
  });
  derivedSignals.add(s);
  // If created inside an effect's run or another computed's update, attach our stop to the
  // parent's _cleanups so we are torn down when the parent re-runs or is stopped. Without
  // this, calling computed() in an effect body leaks one update closure per parent run —
  // each one stays subscribed to its source signals forever.
  if (currentEffect !== null) {
    currentEffect._cleanups.push(() => s.stop());
  }
  return s;
}

// Defined here rather than in the class body because transform calls computed, and computed
// must be defined after Signal (it creates one). Putting this inside the class would reference
// computed before its definition, triggering no-use-before-define.
Signal.prototype.transform = function transform(fn) {
  return computed(() => fn(this.get()));
};
