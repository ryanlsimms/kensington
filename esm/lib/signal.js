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

function flush() {
  scheduled = false;
  while (pending.size > 0) {
    const batch = [...pending];
    pending.clear();
    for (const fn of batch) {
      try {
        fn();
      } catch (err) {
        queueMicrotask(() => { throw err; });
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
 * Returns an object with a `stop()` method that tears down all subscriptions and prevents further runs.
 * @param {function(): void} fn
 * @returns {{ stop: function(): void }}
 * @example
 * const e = effect(() => { localStorage.setItem('sort', sortKey.get()); });
 * e.stop(); // unsubscribes from all tracked signals
 */
export function effect(fn) {
  // During SSR we only need a static snapshot; skip subscriptions entirely.
  if (ssrDepth > 0) {
    return { stop() {} };
  }
  let stopped = false;
  function run() {
    if (stopped) {
      return;
    }
    track(run, fn);
  }
  run._cleanups = [];
  run._isEffect = true;
  run();
  return {
    stop() {
      stopped = true;
      pending.delete(run);
      for (const cleanup of run._cleanups) {
        cleanup();
      }
      run._cleanups = [];
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
  const s = new Signal(undefined);
  function update() {
    track(update, () => {
      derivedWriteDepth++;
      try {
        s.set(fn());
      } catch (err) {
        queueMicrotask(() => { throw err; });
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
  return s;
}

// Defined here rather than in the class body because transform calls computed, and computed
// must be defined after Signal (it creates one). Putting this inside the class would reference
// computed before its definition, triggering no-use-before-define.
Signal.prototype.transform = function transform(fn) {
  return computed(() => fn(this.get()));
};
