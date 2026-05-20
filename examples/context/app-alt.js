import { signal, t } from 'kensington';

const globalTheme = signal('light');
const globalUser = signal({ name: 'Guest', role: 'viewer' });

const darkTheme = signal('dark');
const bobUser = signal({ name: 'Bob', role: 'editor' });
const carolUser = signal({ name: 'Carol', role: 'admin' });

function userBadge(user) {
  return t.div({ class: 'badge' }, [
    t.span({ class: 'badge-name' }, user.transform(u => u.name)),
    t.span({ class: user.transform(u => `badge-role role-${u.role}`) }, user.transform(u => u.role)),
  ]);
}

function card(theme, user) {
  return t.div({ class: theme.transform(v => `card card--${v}`) }, [
    userBadge(user),
    t.div({ class: 'card-theme' }, ['theme: ', theme]),
  ]);
}

const app = t.div([
  t.h1('Signals as props'),
  t.p({ class: 'intro' },
    'The same result without context. Each component receives theme and user as explicit arguments. '
    + 'Fixed signals stand in for provider overrides.',
  ),

  t.div({ class: 'controls' }, [
    t.button({
      type: 'button',
      onclick: () => globalTheme.set(v => v === 'light' ? 'dark' : 'light'),
    }, globalTheme.transform(v => `Switch to ${v === 'light' ? 'dark' : 'light'} theme`)),
    t.button({
      type: 'button',
      onclick: () => globalUser.set(
        u => u.name === 'Guest'
          ? { name: 'Alice', role: 'admin' }
          : { name: 'Guest', role: 'viewer' },
      ),
    }, globalUser.transform(u => u.name === 'Guest' ? 'Log in as Alice' : 'Log out')),
  ]),

  t.div({ class: 'section' }, [
    t.div({ class: 'section-label' }, 'card(globalTheme, globalUser)'),
    t.p({ class: 'section-desc' }, 'Both signals passed directly. Both buttons affect this subtree.'),
    card(globalTheme, globalUser),
  ]),

  t.div({ class: 'section' }, [
    t.div({ class: 'section-label' }, 'card(darkTheme, globalUser)'),
    t.p({ class: 'section-desc' }, 'Fixed dark signal passed as theme. Login toggle still affects this subtree.'),
    card(darkTheme, globalUser),
  ]),

  t.div({ class: 'section' }, [
    t.div({ class: 'section-label' }, 'card(globalTheme, bobUser)'),
    t.p({ class: 'section-desc' }, 'Fixed Bob signal passed as user. Theme toggle still affects this subtree.'),
    card(globalTheme, bobUser),
  ]),

  t.div({ class: 'section' }, [
    t.div({ class: 'section-label' }, 'card(darkTheme, carolUser)'),
    t.p({ class: 'section-desc' }, 'Neither toggle affects this subtree.'),
    card(darkTheme, carolUser),
  ]),
]);

document.body.append(app.toElement());
