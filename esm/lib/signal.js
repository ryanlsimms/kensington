let currentEffect = null;

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
      fn(this.#value);
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
 * Returns a stop function that tears down all subscriptions and prevents further runs.
 * @param {function(): void} fn
 * @returns {function(): void} stop
 * @example
 * const stop = effect(() => { localStorage.setItem('sort', sortKey.get()); });
 * stop(); // unsubscribes from all tracked signals
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
  run();
  return () => {
    stopped = true;
    for (const cleanup of run._cleanups) {
      cleanup();
    }
    run._cleanups = [];
  };
}

/**
 * Creates a read-only signal derived from other signals. Re-runs automatically whenever
 * any signal read via `.get()` inside the function changes.
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
    track(update, () => s.set(fn()));
  }
  update._cleanups = [];
  update();
  return s;
}
