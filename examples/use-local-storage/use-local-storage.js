import { effect, isBrowser,signal } from 'kensington';

function useLocalStorage(key, defaultValue) {
  const stored = isBrowser ? localStorage.getItem(key) : null;
  // stored could be '0', 'false', etc. — null specifically means absent
  const s = signal(stored === null ? defaultValue : JSON.parse(stored));
  effect(() => {
    localStorage.setItem(key, JSON.stringify(s.get()));
  });
  return s;
}

export { useLocalStorage };
