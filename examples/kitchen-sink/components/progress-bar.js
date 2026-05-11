import { computed } from 'kensington';

import t from '../template-engine.js';

const BAR_WIDTH = 200;

export function progressBar({ tasks }) {
  // computed() derives a value from other signals. This reads both tasks.get() and
  // each task.done.get(), so it re-runs whenever tasks change or a task is toggled.
  const pct = computed(() => {
    const all = tasks.get();
    if (!all.length) {
      return 0;
    }
    return Math.round(all.filter(task => task.done.get()).length / all.length * 100);
  });

  // transform() is shorthand for a single-signal computed. barFill and label each
  // derive from pct, so they update whenever pct changes.
  const barFill = pct.transform(p => String(Math.round(p / 100 * BAR_WIDTH)));
  const label = pct.transform(p => `${p}% complete`);

  return t.div({
    class: 'progress-wrap',
    role: 'progressbar',
    // Signals work as attribute values on SVG elements the same as HTML elements.
    aria: { valuenow: pct, valuemin: '0', valuemax: '100', label: 'Task completion' },
  }, [
    t.svg({
      viewBox: `0 0 ${BAR_WIDTH} 12`,
      style: { width: '100%', height: '12px', display: 'block' },
      'aria-hidden': 'true',
    }, [
      t.rect({ x: 0, y: 0, width: String(BAR_WIDTH), height: 12, rx: 6, fill: '#eee' }),
      // barFill is a signal — the width attribute updates in place as pct changes.
      t.rect({ x: 0, y: 0, width: barFill, height: 12, rx: 6, fill: '#4caf50' }),
    ]),
    t.span({ class: 'progress-label' }, label),
  ]);
}
