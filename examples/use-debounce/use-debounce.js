import { effect, signal } from 'kensington';

function useDebounce(source, delay) {
  const debounced = signal(source.get());
  let id;
  effect(() => {
    const value = source.get();
    clearTimeout(id);
    id = setTimeout(() => debounced.set(value), delay);
  });
  return debounced;
}

export { useDebounce };
