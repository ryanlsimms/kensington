import { computed, t } from 'kensington';
import { currentPage } from '../assets/state.js';

export function pageTabs(state) {
  return t.div({ class: 'sidebar-pages' },
    state.pages.map(p =>
      t.button({
        dataPageTab: p.id,
        class: computed(() => currentPage.get() === p.id ? 'active' : ''),
        onclick: () => { currentPage.set(p.id); },
      }, p.label)
    )
  );
}
