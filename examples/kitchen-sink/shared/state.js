import { isBrowser, signal } from '#kensington';

export const STORAGE_KEY = 'kensington-tasks';

export const tasks = signal([]);
export const filter = signal('all');
export const hasSaved = signal(isBrowser && Boolean(localStorage.getItem(STORAGE_KEY)));
