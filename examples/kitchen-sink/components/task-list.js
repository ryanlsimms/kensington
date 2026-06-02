import t, { computed, signal } from '#kensington';

import { filter, tasks } from '../shared/state.js';

function handleDeleteClick(evt) {
  const id = evt.target.closest('li').dataset.key;
  tasks.set(ts => ts.filter(item => item.id !== id) );
}

function handleDoneClick(evt) {
  const id = evt.target.closest('li').dataset.key;
  const foundTask = tasks.get().find(task => task.id === id);
  foundTask?.done.set(v => !v);
}

function commitRename(id, currentText, newText) {
  const trimmed = newText.trim();
  if (!trimmed || trimmed === currentText) { return; }
  tasks.set(ts => ts.map(task => task.id === id ? { ...task, text: trimmed } : task));
}

function taskItem({ id, text, done, itemClass }) {
  // done is a Signal<boolean>. `itemClass` is a stable `computed` derived once when the
  // task is created. Reusing the same signal reference lets the reconciler snapshot
  // fast-path skip toElement() for unchanged items on every list re-render.
  //
  // `editing` is a keyed signal scoped to the outer transform's computed. The second
  // argument (the task id) tells signal() to return the same instance across re-runs
  // for the same key, so each row keeps its own view/edit mode across reorders and
  // additions. When the row is removed from the list, the keyed signal is stopped and
  // dropped automatically — no manual cleanup.
  const editing = signal('view', id);

  function enterEditMode(evt) {
    const input = evt.target.closest('li').querySelector('.task-edit-input');
    input.value = text;
    editing.set('edit');
    requestAnimationFrame(() => { input.focus(); input.select(); });
  }

  function commitEdit(evt) {
    commitRename(id, text, evt.target.value);
    editing.set('view');
  }

  function cancelEdit(evt) {
    evt.target.value = text;
    editing.set('view');
  }

  // Nested data-* objects flatten to hyphen-separated attribute names.
  // { data: { key: id, editing } } renders as data-key="..." data-editing="view"|"edit".
  // CSS toggles between the static text span and the inline edit input on that attribute,
  // so the swap is a single reactive attribute write with no DOM rebuild.
  return t.li({ data: { key: id, editing }, class: itemClass }, [
    t.label({ class: 'task-label' }, [
      t.input({
        type: 'checkbox',
        checked: done,
        // Toggling only mutates this task's done signal. When filter === 'all'
        // the tasks array never changes, so the list is never re-reconciled.
        onclick: handleDoneClick,
      }),
      t.span({
        class: 'task-text',
        ondblclick: enterEditMode,
        title: 'Double-click to rename',
      }, text),
      t.input({
        type: 'text',
        class: 'task-edit-input',
        aria: { label: `Rename task: ${text}` },
        prop: { value: text },
        onblur: commitEdit,
        onkeydown: e => {
          if (e.key === 'Enter') { e.target.blur(); }
          else if (e.key === 'Escape') { cancelEdit(e); }
        },
      }),
    ]),
    t.button({
      type: 'button',
      class: 'remove-btn',
      aria: { label: `Delete task: ${text}` },
      onclick: handleDeleteClick,
    }, '×'),
  ]);
}

export function taskList() {
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

  const listItems = filtered.transform(items => items.map(taskItem));
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
      if (from === -1 || to === -1) { return ts; }
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
