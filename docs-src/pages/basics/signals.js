import { renderForHydration, t } from 'kensington';

import { signalDemo } from '../../components/signal-demo.js';
import { code } from '../../components/ui.js';

export function basicsSignals() {
  return t.section({ id: 'signals' }, [
    t.h2('Reactive Data'),
    t.p([
      'Wrap any value in ',
      t.code('signal()'),
      ' and pass it into a tag. When the signal changes, only the affected text node or attribute updates in place. Nothing re-renders.',
    ]),
    t.div({ class: 'live-demo' }, [
      t.div({ class: 'live-demo-code' }, [
        code('javascript', `import { t, signal } from 'kensington';

const count = signal(0);

document.body.append(
  t.div([
    t.p(['Count: ', count]),
    t.button(
      { onclick: () => count.set(count.value + 1) },
      '+1'
    ),
  ]).toElement()
);`),
      ]),
      t.div({ class: 'live-demo-result' }, [
        t.div({ class: 'live-demo-label' }, 'Live result'),
        renderForHydration(signalDemo, { count: 0 }),
      ]),
    ]),
    t.div({ class: 'card-grid' }, [
      t.div({ class: 'card accent' }, [
        t.div({ class: 'card-title' }, t.code('signal(value)')),
        t.div({ class: 'card-body' }, [
          'Creates a reactive value. Pass it anywhere a static value is accepted — ',
          'content, attributes, or DOM properties — and the DOM updates automatically when the value changes.',
        ]),
      ]),
      t.div({ class: 'card accent' }, [
        t.div({ class: 'card-title' }, t.code('computed(fn)')),
        t.div({ class: 'card-body' }, [
          'Derives a new value from other signals. Use it for calculated state that depends on reactive data. ',
          'Stays in sync automatically whenever its dependencies change.',
        ]),
      ]),
      t.div({ class: 'card accent' }, [
        t.div({ class: 'card-title' }, t.code('effect(fn)')),
        t.div({ class: 'card-body' }, [
          'Runs a callback whenever the signals it reads change. ',
          'Use it for side effects outside the DOM — page title, localStorage, analytics, ',
          'or any imperative update.',
        ]),
      ]),
    ]),
    t.p({ class: 'section-cta' }, t.a({ href: '?page=reactivity' }, [
      'Full reactivity guide: computed, effects, lifecycles, server rendering →',
    ])),
  ]);
}
