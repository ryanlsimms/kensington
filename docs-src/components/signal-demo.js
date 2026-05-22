import { t, signal } from 'kensington';

export function signalDemo(state) {
  const count = signal(state.count);
  return t.div([
    t.p({ style: { margin: '0 0 0.75rem', fontSize: '1rem' } }, ['Count: ', count]),
    t.button({ onclick: () => count.set(v => v + 1), class: 'demo-btn' }, '+1'),
  ]);
}
