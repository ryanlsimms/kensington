import { signal } from 'kensington';

import t from '../template-engine.js';

export function taskForm({ tasks }) {
  // Local signal for the controlled input — scoped to this component.
  const newTaskText = signal('');
  // transform() creates a derived signal: disabled is true whenever the trimmed
  // input is empty, and updates automatically as newTaskText changes.
  const disabled = newTaskText.transform(v => !v.trim());

  function submit(e) {
    e.preventDefault();
    const text = newTaskText.get().trim();
    if (!text) {
      return;
    }
    // New tasks get done: signal(false) to match the shape liftTasks() produces,
    // so task-list, task-stats, and progress-bar can all call task.done.get().
    tasks.set(ts => [...ts, { id: Date.now().toString(36), text, done: signal(false) }]);
    // Setting the signal to '' clears the input field via the prop binding below.
    newTaskText.set('');
  }

  return t.form({ class: 'task-form', onsubmit: submit }, [
    t.input({
      type: 'text',
      class: 'task-input',
      placeholder: 'What needs to be done?',
      aria: { label: 'New task text' },
      oninput: e => newTaskText.set(e.target.value),
      // prop assigns directly to the DOM property, not the HTML attribute.
      // Binding value to the signal creates a controlled input: when newTaskText
      // is set to '' on submit, the field clears without needing e.target.reset().
      prop: { value: newTaskText },
    }),
    t.button({ type: 'submit', disabled, class: 'add-btn' }, 'Add'),
  ]);
}
