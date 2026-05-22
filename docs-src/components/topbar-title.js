import { computed, effect, isBrowser, t } from 'kensington';
import { currentPage } from '../assets/state.js';

const documentTitles = {
  basics: 'Kensington',
  reactivity: 'Kensington - Reactive data',
  examples: 'Kensington Examples',
  api: 'Kensington API',
};

const labels = {
  basics: 'Kensington',
  reactivity: 'Reactive data',
  examples: 'Examples',
  api: 'API',
};

export function topbarTitle() {
  if (isBrowser) {
    effect(() => {
      document.title = documentTitles[currentPage.get()] || 'Kensington';
    });
  }
  return t.span({ class: 'topbar-title' }, computed(() => labels[currentPage.get()] || currentPage.get()));
}
