let currentEffect = null;
const pending = new Set();
let scheduled = false;
const stopFns = new WeakMap();

function flush() {
  scheduled = false;
  while (pending.size > 0) {
    const batch = [...pending];
    pending.clear();
    for (const fn of batch) {
      fn();
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

  subscribe(fn) {
    this.#subscribers.add(fn);
    return () => this.#subscribers.delete(fn);
  }

  transform(fn) {
    const derived = new Signal(fn(this.get()));
    this.subscribe(v => derived.set(fn(v)));
    return derived;
  }

  stop() {
    const fn = stopFns.get(this);
    if (fn !== undefined) {
      fn();
      stopFns.delete(this);
    }
    this.#subscribers.clear();
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
      try {
        s.set(fn());
      } catch (err) {
        queueMicrotask(() => { throw err; });
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
  return s;
}
