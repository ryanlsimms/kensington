import t, { effect, signal } from '#kensington';

import { hasSaved, tasks } from '../shared/state.js';
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
  return raw.map(task => {
    const done = signal(task.done);
    return { ...task, done, itemClass: done.transform(d => d ? 'task-item done' : 'task-item') };
  });
}

export function dashboard({ tasks: initialTasks }) {
  // signal() creates a reactive value. Any computed or effect that calls .get()
  // on this signal will re-run automatically when it changes.
  tasks.set(toReactiveTasks(initialTasks));

  // effect() returns { pause, resume, stop }. Storing the handle lets us
  // pause and resume updates from outside the effect.
  const titleEffect = effect(() => {
    const remaining = tasks.get().filter(task => !task.done.get()).length;
    // .value reads the current value without registering hasSaved as a
    // dependency. The title should update when tasks change, not when hasSaved
    // flips independently.
    const savedTag = hasSaved.value ? ' ★' : '';
    document.title = remaining
      ? `(${remaining}) Kitchen Sink${savedTag}`
      : `Kitchen Sink${savedTag}`;
  });

  // titleLive controls whether the effect is active. pause() temporarily
  // unsubscribes from all signals without destroying the effect. resume()
  // re-runs the callback and re-subscribes, so the title is immediately
  // correct when toggled back on.
  const titleLive = signal(true);
  // titleStopped tracks whether stop() has been called. stop() is permanent —
  // unlike pause(), a stopped effect cannot be resumed.
  const titleStopped = signal(false);

  function toggleTitle() {
    const next = !titleLive.get();
    titleLive.set(next);
    if (next) {
      titleEffect.resume();
    } else {
      titleEffect.pause();
    }
  }

  function stopTitle() {
    titleEffect.stop();
    titleStopped.set(true);
  }

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
    progressBar(),
    taskStats(),
    t.inlineComment('filters and input'),
    filterBar(),
    taskForm(),
    t.inlineComment('task list'),
    taskList(),
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
      t.button({
        type: 'button',
        class: 'storage-btn',
        disabled: titleStopped,
        onclick: toggleTitle,
      }, titleLive.transform(v => v ? 'Pause Title' : 'Resume Title')),
      t.button({
        type: 'button',
        class: 'storage-btn',
        disabled: titleStopped,
        onclick: stopTitle,
      }, 'Stop Title'),
    ]),
  ]);
}
