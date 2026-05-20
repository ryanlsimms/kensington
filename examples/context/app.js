import { signal, t } from 'kensington';

function createContext(defaultValue) {
  const _default = signal(defaultValue);
  const _stack = [];

  return {
    signal: _default,

    use() {
      return _stack.length > 0 ? _stack[_stack.length - 1] : _default;
    },

    provide(value, fn) {
      const isSignal = value !== null && typeof value === 'object' && typeof value.get === 'function';
      const ctx = isSignal ? value : signal(value);
      _stack.push(ctx);
      const result = fn(ctx);
      _stack.pop();
      return result;
    },
  };
}

const ThemeContext = createContext('light');
const UserContext = createContext({ name: 'Guest', role: 'viewer' });

function userBadge() {
  const user = UserContext.use();
  return t.div({ class: 'badge' }, [
    t.span({ class: 'badge-name' }, user.transform(u => u.name)),
    t.span({ class: user.transform(u => `badge-role role-${u.role}`) }, user.transform(u => u.role)),
  ]);
}

function card() {
  const theme = ThemeContext.use();
  return t.div({ class: theme.transform(v => `card card--${v}`) }, [
    userBadge(),
    t.div({ class: 'card-theme' }, ['theme: ', theme]),
  ]);
}

const globalTheme = signal('light');

const app = ThemeContext.provide(globalTheme, () =>
  t.div([
    t.h1('createContext / useContext'),
    t.p({ class: 'intro' },
      'The context stack resolves during synchronous construction. '
      + 'Consumers hold a signal reference and update reactively.',
    ),

    t.div({ class: 'controls' }, [
      t.button({
        type: 'button',
        onclick: () => globalTheme.set(v => v === 'light' ? 'dark' : 'light'),
      }, globalTheme.transform(v => `Switch to ${v === 'light' ? 'dark' : 'light'} theme`)),
      t.button({
        type: 'button',
        onclick: () => UserContext.signal.set(
          u => u.name === 'Guest'
            ? { name: 'Alice', role: 'admin' }
            : { name: 'Guest', role: 'viewer' },
        ),
      }, UserContext.signal.transform(u => u.name === 'Guest' ? 'Log in as Alice' : 'Log out')),
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
  ]),
);

document.body.append(app.toElement());
