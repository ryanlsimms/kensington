let currentEffect = null;

export default class Signal {
  #value;
  #subscribers = new Set();

  constructor(initial) {
    this.#value = initial;
  }

  get() {
    if (currentEffect !== null) {
      this.#subscribers.add(currentEffect);
    }
    return this.#value;
  }

  set(valueOrFn) {
    const next = typeof valueOrFn === 'function' ? valueOrFn(this.#value) : valueOrFn;
    if (Object.is(next, this.#value)) {
      return;
    }
    this.#value = next;
    for (const fn of this.#subscribers) {
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

/**
 * Runs `fn` immediately and re-runs it whenever any signal read via `.get()` inside changes.
 * Use for side effects: syncing to localStorage, updating the URL, fetching data, etc.
 * @param {function(): void} fn
 * @example
 * effect(() => { localStorage.setItem('sort', sortKey.get()); });
 */
export function effect(fn) {
  function run() {
    const prev = currentEffect;
    currentEffect = run;
    try {
      fn();
    } finally {
      currentEffect = prev;
    }
  }
  run();
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
    const prev = currentEffect;
    currentEffect = update;
    try {
      s.set(fn());
    } finally {
      currentEffect = prev;
    }
  }
  update();
  return s;
}
