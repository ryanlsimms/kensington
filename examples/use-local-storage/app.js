import { effect,t } from 'kensington';

import { useLocalStorage } from './use-local-storage.js';

const theme = useLocalStorage('theme', 'light');

effect(() => {
  document.documentElement.setAttribute('data-theme', theme.get());
});

const app = t.div([
  t.h1('useLocalStorage'),
  t.p({ class: 'description' }, 'Theme preference is saved to localStorage. Reload the page — it persists.'),
  t.div({ class: 'controls' }, [
    t.button({ type: 'button', onclick: () => theme.set('light') }, 'Light'),
    t.button({ type: 'button', onclick: () => theme.set('dark') }, 'Dark'),
    t.button({ type: 'button', onclick: () => theme.set('system') }, 'System'),
  ]),
  t.p({ class: 'current' }, ['Stored value: ', t.code(theme)]),
]);

document.body.append(app.toElement());
