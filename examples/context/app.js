import { t } from 'kensington';

import { card } from './card.js';
import { ThemeContext, UserContext } from './contexts.js';

const app = t.div([
  t.h1('createContext / useContext'),
  t.p({ class: 'intro' }, [
    'The context stack resolves during synchronous construction.',
    'Consumers hold a signal reference and update reactively.',
  ]),

  t.div({ class: 'controls' }, [
    t.button({
      type: 'button',
      onclick: () => ThemeContext.set(v => v === 'light' ? 'dark' : 'light'),
    }, ThemeContext.get().transform(v => `Switch to ${v === 'light' ? 'dark' : 'light'} theme`)),
    t.button({
      type: 'button',
      onclick: () => UserContext.set(
        u => u.name === 'Guest'
          ? { name: 'Alice', role: 'admin' }
          : { name: 'Guest', role: 'viewer' },
      ),
    }, UserContext.get().transform(u => u.name === 'Guest' ? 'Log in as Alice' : 'Log out')),
  ]),

  t.div({ class: 'section' }, [
    t.div({ class: 'section-label' }, 'Default context'),
    t.p({ class: 'section-desc' }, 'No provider. Both buttons affect this subtree.'),
    card(),
  ]),

  ThemeContext.provide('dark', () =>
    t.div({ class: 'section' }, [
      t.div({ class: 'section-label' }, 'ThemeContext.provide("dark")'),
      t.p({ class: 'section-desc' }, 'Theme pinned to dark. Login toggle still affects this subtree.'),
      card(),
    ]),
  ),

  UserContext.provide({ name: 'Bob', role: 'editor' }, () =>
    t.div({ class: 'section' }, [
      t.div({ class: 'section-label' }, 'UserContext.provide({ name: "Bob", role: "editor" })'),
      t.p({ class: 'section-desc' }, 'User pinned to Bob. Theme toggle still affects this subtree.'),
      card(),
    ]),
  ),

  ThemeContext.provide('dark', () =>
    UserContext.provide({ name: 'Carol', role: 'admin' }, () =>
      t.div({ class: 'section' }, [
        t.div({ class: 'section-label' }, 'Both contexts overridden'),
        t.p({ class: 'section-desc' }, 'Neither toggle affects this subtree.'),
        card(),
      ]),
    ),
  ),
]);

document.body.append(app.toElement());
