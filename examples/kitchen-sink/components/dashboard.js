import { effect, isBrowser, signal } from 'kensington';

import t from '../template-engine.js';
import { filterBar } from './filter-bar.js';
import { progressBar } from './progress-bar.js';
import { taskForm } from './task-form.js';
import { taskList } from './task-list.js';
import { taskStats } from './task-stats.js';

const STORAGE_KEY = 'kensington-tasks';

export function dashboard({ tasks: initialTasks }) {
  const tasks = signal(initialTasks);
  const filter = signal('all');
  const hasSaved = signal(isBrowser && Boolean(localStorage.getItem(STORAGE_KEY)));

  effect(() => {
    const remaining = tasks.get().filter(task => !task.done).length;
    document.title = remaining ? `(${remaining}) Kitchen Sink` : 'Kitchen Sink';
  });

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.get()));
    hasSaved.set(true);
  }

  function load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      tasks.set(JSON.parse(saved));
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
        disabled: hasSaved.transform(v => !v),
        onclick: load,
      }, 'Load'),
    ]),
  ]);
}
