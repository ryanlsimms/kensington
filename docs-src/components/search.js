import { signal, computed, effect, isBrowser, t } from 'kensington';
import { currentPage } from '../assets/state.js';
import { searchIndex } from '../assets/search-index.js';

const pageLabels = { basics: 'Kensington', reactivity: 'Reactive data', examples: 'Examples', api: 'API' };

export function searchDocs() {
  const query = signal('');
  const focusedIndex = signal(-1);

  const matches = computed(() => {
    const q = query.get().trim().toLowerCase();
    if (!q) { return []; }
    return searchIndex.filter(entry =>
      entry.label.toLowerCase().includes(q) ||
      entry.keywords.some(kw => kw.includes(q))
    ).slice(0, 12);
  });

  function navigateToResult(entry) {
    currentPage.set(entry.page);
    query.set('');
    focusedIndex.set(-1);
    requestAnimationFrame(() => {
      const target = document.getElementById(entry.id);
      if (target) {
        target.scrollIntoView();
        const base = entry.page === 'basics' ? location.pathname : `?page=${entry.page}`;
        history.replaceState(null, '', base + '#' + entry.id);
      }
    });
  }

  const resultsContent = computed(() => {
    const list = matches.get();
    if (!list.length) {
      if (!query.get().trim()) { return []; }
      return [t.div({ class: 'search-no-results' }, 'No results')];
    }
    return list.map(entry =>
      t.button({
        'data-key': `${entry.page}-${entry.id}`,
        class: 'search-result',
        type: 'button',
        onclick: () => navigateToResult(entry),
      }, [
        t.span({ class: 'search-result-label' }, entry.label),
        t.span({ class: 'search-result-page' }, pageLabels[entry.page]),
      ])
    );
  });

  const searchResults = t.div({
    id: 'search-results',
    class: computed(() => query.get().trim() ? 'open' : ''),
  }, resultsContent);

  const searchInput = t.input({
      id: 'search-input',
      type: 'search',
      placeholder: 'Search docs...',
      ariaLabel: 'Search documentation',
      autocomplete: 'off',
      spellcheck: 'false',
      prop: { value: query },
      oninput: e => {
        focusedIndex.set(-1);
        query.set(e.target.value);
      },
      onkeydown: e => {
        if (e.key === 'Escape') {
          query.set('');
          focusedIndex.set(-1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const count = matches.get().length;
          if (count) { focusedIndex.set(v => Math.min(v + 1, count - 1)); }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          focusedIndex.set(v => Math.max(v - 1, -1));
        } else if (e.key === 'Enter') {
          const idx = focusedIndex.value;
          const list = matches.get();
          if (idx >= 0 && list[idx]) { navigateToResult(list[idx]); }
        }
      },
    });

  if (isBrowser) {
    effect(() => {
      const idx = focusedIndex.get();
      const resultsEl = searchResults.getDomElement();
      if (!resultsEl) { return; }
      resultsEl.querySelectorAll('.search-result').forEach((el, i) => {
        el.classList.toggle('focused', i === idx);
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        query.set('');
        focusedIndex.set(-1);
      }
    });

    document.addEventListener('click', e => {
      const inputEl = searchInput.getDomElement();
      const resultsEl = searchResults.getDomElement();
      if (inputEl && resultsEl && !inputEl.contains(e.target) && !resultsEl.contains(e.target)) {
        query.set('');
        focusedIndex.set(-1);
      }
    });
  }

  const searchIcon = t.svg({ class: 'search-icon', width: '13', height: '13', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round', ariaHidden: 'true' }, [
    t.circle({ cx: '11', cy: '11', r: '8' }),
    t.line({ x1: '21', y1: '21', x2: '16.65', y2: '16.65' }),
  ]);

  return t.div({ class: 'search-wrap' }, [
    searchIcon,
    searchInput,
    searchResults,
  ]);
}
