import { signal } from 'kensington';

export function createContext(defaultValue) {
  // each nested .provide call pushes a new value onto the stack at the beginning of the content block
  // and pops it off at the end of the content block
  const _stack = [signal(defaultValue)];

  return {
    provide(value, fn) {
      const ctx = signal(value);
      _stack.push(ctx);
      try {
        return fn(ctx);
      } finally {
        _stack.pop();
      }
    },

    get() {
      return _stack.at(-1);
    },

    set(val) {
      return this.get().set(val);
    },
  };
}
