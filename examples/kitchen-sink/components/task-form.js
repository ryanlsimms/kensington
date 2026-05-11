import { signal } from 'kensington';

import t from '../template-engine.js';

export function taskForm({ tasks }) {
  const newTaskText = signal('');
  const disabled = newTaskText.transform(v => !v.trim());

  function submit(e) {
    e.preventDefault();
    const text = newTaskText.get().trim();
    if (!text) {
      return;
    }
    tasks.set(ts => [...ts, { id: Date.now().toString(36), text, done: false }]);
    newTaskText.set('');
    e.target.reset();
  }

  return t.form({ class: 'task-form', onsubmit: submit }, [
    t.input({
      type: 'text',
      class: 'task-input',
      placeholder: 'What needs to be done?',
      aria: { label: 'New task text' },
      oninput: e => newTaskText.set(/** @type {HTMLInputElement} */ (e.target).value),
    }),
    t.button({ type: 'submit', disabled, class: 'add-btn' }, 'Add'),
  ]);
}
