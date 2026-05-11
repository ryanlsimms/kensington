import { signal } from 'kensington';

import t from '../template-engine.js';

export function taskSpotlight({ task }) {
  const starred = signal(false);

  return t.div({ class: 'spotlight-card' }, [
    t.div({ class: 'spotlight-header' }, [
      t.span({ class: task.done ? 'spotlight-text done' : 'spotlight-text' }, task.text),
      t.button({
        type: 'button',
        class: 'star-btn',
        aria: { label: 'Toggle star' },
        onclick: () => starred.set(v => !v),
      }, starred.transform(v => v ? '★' : '☆')),
    ]),
    t.span({ class: task.done ? 'spotlight-badge done' : 'spotlight-badge' },
      task.done ? 'Done' : 'Active',
    ),
  ]);
}
