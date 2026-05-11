import t from '../template-engine.js';

export function filterBar({ filter }) {
  function btn(value, label) {
    return t.button({
      type: 'button',
      class: filter.transform(f => f === value ? 'filter-btn active' : 'filter-btn'),
      onclick: () => filter.set(value),
    }, label);
  }

  return t.div({ class: 'filter-bar' }, [
    btn('all', 'All'),
    btn('active', 'Active'),
    btn('done', 'Done'),
  ]);
}
