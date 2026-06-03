import t from '#kensington';

export function spotlightSection() {
  return t.div({ class: 'spotlight-section' }, [
    t.h2('Task Spotlight'),
    t.p({ class: 'spotlight-hint' }, [
      'Fetches a server-rendered fragment — the MutationObserver hydrates it automatically.',
    ]),
    t.button({ type: 'button', id: 'spotlight-load', class: 'load-btn' }, 'Load random task'),
    t.div({ id: 'spotlight-container' }),
  ]);
}
