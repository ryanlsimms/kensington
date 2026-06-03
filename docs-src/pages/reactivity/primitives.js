import { t } from 'kensington';

import { code, exLink } from '../../components/ui.js';

export function reactivityPrimitives() {
  return t.section({ id: 'signals' }, [
    t.h2('Signals'),
    t.p([
      'A signal holds a reactive value. Read it with ',
      t.code('.get()'),
      ' and write it with ',
      t.code('.set()'),
      '. Anything using the signal updates automatically when the value changes.',
    ]),
    code('javascript', `import { signal, t } from 'kensington';

const busy = signal(false);
const result = signal('Press the button to fetch a quote.');

function fetchQuote() {
  busy.set(true);
  fetch('/api/quote')
    .then(r => r.json())
    .then(data => result.set(data.text))
    .finally(() => busy.set(false));
}

document.body.append(t.div([
  t.p(result),
  t.button({ type: 'button', disabled: busy, onclick: fetchQuote }, 'Fetch quote'),
]).toElement());`),
    t.p(exLink('?page=examples#counter', 'Counter example')),

    t.h3({ id: 'computed' }, 'computed'),
    t.p('A read-only signal derived from others. Re-evaluates automatically when any dependency changes.'),
    code('javascript', `const firstName = signal('Ada');
const lastName = signal('Lovelace');
const fullName = computed(() => \`\${firstName.get()} \${lastName.get()}\`);

// fullName re-evaluates whenever either signal changes
t.p(fullName).toElement();`),

    t.h3({ id: 'effect' }, 'effect'),
    t.p([
      'Runs immediately and re-runs whenever any signal read via ',
      t.code('.get()'),
      ' inside it changes. Use for side effects that live outside the DOM: ',
      t.code('document.title'),
      ', ',
      t.code('localStorage'),
      ', analytics, etc.',
    ]),
    code('javascript', `const count = signal(0);

const e = effect(() => {
  // runs whenever count changes
  document.title = \`\${count.get()} items\`;
});`),
    t.aside([
      t.p([
        t.strong('SSR note:'),
        ' ',
        t.code('effect()'),
        ' is a no-op during server-side rendering, so browser globals inside it are safe. ',
        t.code('computed()'),
        ' is not suppressed — it runs synchronously on the server. Guard browser-only ',
        t.code('computed()'),
        ' values with ',
        t.code('isBrowser'),
        '.',
      ]),
    ]),
  ]);
}
