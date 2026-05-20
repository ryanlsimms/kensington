import { Signal, signal } from 'kensington';

export function createContext(defaultValue) {
  const _default = signal(defaultValue);
  const _stack = [];

  return {
    get() {
      return _stack.length > 0 ? _stack[_stack.length - 1] : _default;
    },

    provide(value, fn) {
      const ctx = value instanceof Signal ? value : signal(value);
      _stack.push(ctx);
      const result = fn(ctx);
      _stack.pop();
      return result;
    },

    set(...args) {
      return this.get().set(...args);
    },
  };
}
