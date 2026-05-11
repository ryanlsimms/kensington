import { effect, isBrowser, signal } from 'kensington';

import t from '../template-engine.js';
import { filterBar } from './filter-bar.js';
import { progressBar } from './progress-bar.js';
import { taskForm } from './task-form.js';
import { taskList } from './task-list.js';
import { taskStats } from './task-stats.js';

const STORAGE_KEY = 'kensington-tasks';

// The server sends tasks as plain objects ({ id, text, done: boolean }).
// toReactiveTasks wraps each `done` in a signal so toggling a task only fires
// that one signal rather than replacing the whole tasks array. Components that
// read task.done.get() inside a computed will react to individual changes.
function toReactiveTasks(raw) {
  return raw.map(task => ({ ...task, done: signal(task.done) }));
}

export function dashboard({ tasks: initialTasks }) {
  // signal() creates a reactive value. Any computed or effect that calls .get()
  // on this signal will re-run automatically when it changes.
  const tasks = signal(toReactiveTasks(initialTasks));
  const filter = signal('all');
  const hasSaved = signal(isBrowser && Boolean(localStorage.getItem(STORAGE_KEY)));

  // effect() runs immediately and re-runs whenever any signal read inside changes.
  // Here it tracks tasks and each task's done signal, so the tab title stays in sync.
  effect(() => {
    const remaining = tasks.get().filter(task => !task.done.get()).length;
    document.title = remaining ? `(${remaining}) Kitchen Sink` : 'Kitchen Sink';
  });

  function save() {
    // Signal implements toJSON(), so JSON.stringify resolves every signal in the
    // tree to its current value automatically — no manual .get() calls needed.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    hasSaved.set(true);
  }

  function load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // JSON.parse gives back plain objects, so lift them back to reactive shape.
      tasks.set(toReactiveTasks(JSON.parse(saved)));
    }
  }

  return t.div({ class: 'dashboard' }, [
    t.h2('Task Manager'),
    t.inlineComment('progress and stats'),
    progressBar({ tasks }),
    taskStats({ tasks }),
    t.inlineComment('filters and input'),
    filterBar({ filter }),
    taskForm({ tasks }),
    t.inlineComment('task list'),
    taskList({ tasks, filter }),
    t.div({ class: 'storage-actions' }, [
      t.button({ type: 'button', class: 'storage-btn', onclick: save }, 'Save'),
      t.button({
        type: 'button',
        class: 'storage-btn',
        // transform() is shorthand for computed(() => fn(signal.get())).
        // The button is disabled whenever nothing has been saved yet.
        disabled: hasSaved.transform(v => !v),
        onclick: load,
      }, 'Load'),
    ]),
  ]);
}
