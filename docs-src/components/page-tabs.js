import { computed, t } from 'kensington';

import { currentPage } from '../assets/state.js';

export function pageTabs(state) {
  return t.div({ class: 'sidebar-pages' }, state.pages.map(p =>
    t.button({
      dataPageTab: p.id,
      class: computed(() => currentPage.get() === p.id ? 'active' : ''),
      ariaCurrent: computed(() => currentPage.get() === p.id ? 'page' : null),
      onclick: () => {
        if (currentPage.get() === p.id) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          currentPage.set(p.id);
        }
      },
    }, p.label),
  ));
}
