import { computed } from 'kensington';

import t from '../template-engine.js';

function taskItem(tasks, { id, text, done }) {
  // done is a Signal<boolean>. Passing it as an attribute value tells Kensington
  // to set up a live effect: the attribute updates whenever the signal changes,
  // with no re-render of the surrounding list.
  const itemClass = done.transform(d => d ? 'task-item done' : 'task-item');
  // persist: true so signal effects survive the insertBefore moves during drag-reorder.
  // Without it, dom-tracker permanently stops this item's effects when it sees the
  // node in removedNodes, breaking the done signal's class and checkbox bindings.
  return t.li({ 'data-key': id, class: itemClass, persist: true }, [
    t.label({ class: 'task-label' }, [
      t.input({
        type: 'checkbox',
        checked: done,
        // Toggling only mutates this task's done signal. When filter === 'all'
        // the tasks array never changes, so the list is never re-reconciled.
        onclick: () => done.set(d => !d),
      }),
      t.span({ class: 'task-text' }, text),
    ]),
    t.button({
      type: 'button',
      class: 'remove-btn',
      aria: { label: `Delete task: ${text}` },
      onclick: () => tasks.set(ts => ts.filter(task => task.id !== id)),
    }, '×'),
  ]);
}

export function taskList({ tasks, filter }) {
  const filtered = computed(() => {
    const all = tasks.get();
    const f = filter.get();
    // Reading task.done.get() inside the predicate registers each task's done signal
    // as a dependency. When filter is 'active' or 'done', toggling a task re-runs
    // this computed so the item appears or disappears from the filtered view.
    // When filter is 'all' we return early without reading any done signals,
    // so a toggle doesn't re-run this computed at all.
    if (f === 'active') { return all.filter(task => !task.done.get()); }
    if (f === 'done') { return all.filter(task => task.done.get()); }
    return all;
  });

  // Each update produces new tag objects, but reconcile() matches them to existing
  // DOM nodes by data-key and patches only what changed rather than replacing elements.
  const listItems = filtered.transform(items => items.map(item => taskItem(tasks, item)));
  const hasItems = filtered.transform(items => items.length > 0);
  const emptyMsg = filter.transform(f => ({
    active: 'No active tasks. Add one above!',
    all: 'No tasks yet. Add one above!',
    done: 'Nothing done yet. Check something off!',
  })[f]);

  function onreorder(e) {
    const { fromKey, toKey } = e.detail;
    tasks.set(ts => {
      const from = ts.findIndex(task => task.id === fromKey);
      const to = ts.findIndex(task => task.id === toKey);
      const updated = [...ts];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  }

  return t.div([
    t.sortableList({ onreorder }, t.ul({ class: 'task-list' }, listItems)),
    // hidden accepts a signal — the attribute is added/removed live as hasItems changes.
    t.p({ class: 'empty-msg', hidden: hasItems }, emptyMsg),
  ]);
}
