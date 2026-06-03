import { isBrowser, signal } from 'kensington';

function getActivePage() {
  if (!isBrowser) { return 'basics'; }
  return new URLSearchParams(location.search).get('page') || 'basics';
}

export const currentPage = signal(getActivePage());
export const activeSection = signal(null);
