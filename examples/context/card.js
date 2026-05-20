import { t } from 'kensington';

import { ThemeContext, UserContext } from './contexts.js';

function userBadge() {
  const user = UserContext.get();
  return t.div({ class: 'badge' }, [
    t.span({ class: 'badge-name' }, user.transform(u => u.name)),
    t.span({ class: user.transform(u => `badge-role role-${u.role}`) }, user.transform(u => u.role)),
  ]);
}

export function card() {
  const theme = ThemeContext.get();
  return t.div({ class: theme.transform(v => `card card--${v}`) }, [
    userBadge(),
    t.div({ class: 'card-theme' }, ['theme: ', theme]),
  ]);
}
