import { computed } from 'kensington';

import t from '../template-engine.js';

export function taskStats({ tasks }) {
  // Each computed reads both the tasks array and each task's done signal, so it
  // re-runs when tasks are added/removed OR when any individual done is toggled.
  const total = computed(() => tasks.get().length);
  const done = computed(() => tasks.get().filter(task => task.done.get()).length);
  const remaining = computed(() => tasks.get().filter(task => !task.done.get()).length);

  // Passing computed signals as content lets Kensington update just the text node
  // in place — no surrounding markup is touched.
  return t.div({ class: 'task-stats' }, [
    t.span({ class: 'stat' }, [total, ' total']),
    t.span({ class: 'stat remaining' }, [remaining, ' remaining']),
    t.span({ class: 'stat done-count' }, [done, ' done']),
  ]);
}
