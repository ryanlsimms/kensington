import { computed } from 'kensington';

import t from '../template-engine.js';

export function taskStats({ tasks }) {
  const total = computed(() => tasks.get().length);
  const done = computed(() => tasks.get().filter(task => task.done).length);
  const remaining = computed(() => tasks.get().filter(task => !task.done).length);

  return t.div({ class: 'task-stats' }, [
    t.span({ class: 'stat' }, [total, ' total']),
    t.span({ class: 'stat remaining' }, [remaining, ' remaining']),
    t.span({ class: 'stat done-count' }, [done, ' done']),
  ]);
}
