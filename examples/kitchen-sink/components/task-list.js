import { computed } from 'kensington';

import t from '../template-engine.js';

function taskItem(tasks, { id, text, done }) {
  return t.li({ 'data-key': id, class: done ? 'task-item done' : 'task-item' }, [
    t.label({ class: 'task-label' }, [
      t.input({
        type: 'checkbox',
        checked: done,
        onclick: () => tasks.set(ts => ts.map(task =>
          task.id === id ? { ...task, done: !task.done } : task,
        )),
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
    if (f === 'active') {
      return all.filter(task => !task.done);
    }
    if (f === 'done') {
      return all.filter(task => task.done);
    }
    return all;
  });

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
    t.p({ class: 'empty-msg', hidden: hasItems }, emptyMsg),
  ]);
}
