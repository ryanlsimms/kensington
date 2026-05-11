import t from '../template-engine.js';

export function filterBar({ filter }) {
  function btn(value, label) {
    return t.button({
      type: 'button',
      // transform() creates a new derived signal per button. Each button's class
      // updates independently when filter changes — only the affected attributes
      // are written to the DOM, not the whole bar.
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
