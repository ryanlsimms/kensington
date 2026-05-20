import { signal, t } from 'kensington';

import { useFetch } from './use-fetch.js';

const userId = signal(1);
const MAX_ID = 5;

// derived signal: re-fetches automatically whenever userId changes
const { data, loading, error } = useFetch(userId.transform(id => `/api/users/${id}`));

const app = t.div([
  t.h1('useFetch'),
  t.p({ class: 'description' }, 'Changing the user ID triggers a new fetch. In-flight requests are aborted.'),
  t.div({ class: 'controls' }, [
    t.button({
      type: 'button',
      onclick: () => userId.set(v => Math.max(1, v - 1)),
    }, '← Prev'),
    t.span({ class: 'user-id' }, ['User ', userId, ' of ', MAX_ID]),
    t.button({
      type: 'button',
      onclick: () => userId.set(v => Math.min(MAX_ID, v + 1)),
    }, 'Next →'),
  ]),
  // signal content can be a tag — switches between loading, error, and data views reactively
  loading.transform(l => l
    ? t.p({ class: 'loading' }, 'Loading...')
    : error.get()
      ? t.p({ class: 'error' }, error.get())
      : t.div({ class: 'user-card' }, [
        t.div({ class: 'user-name' }, data.get()?.name ?? '—'),
        t.div({ class: `user-role role-${data.get()?.role}` }, data.get()?.role ?? '—'),
      ]),
  ),
]);

document.body.append(app.toElement());
