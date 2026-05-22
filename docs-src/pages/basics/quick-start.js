import { callout, code, panels } from '../../components/ui.js';

export function basicsQuickStart(t) {
  return t.section({ id: 'quick-start' }, [
    t.h2('Quick start'),
    t.p([
      'Components are plain functions. Call ',
      t.code('.toString()'),
      ' to get an HTML string for server rendering or static generation.',
    ]),
    panels(t, [
      {
        label: 'JavaScript',
        content: code(t, 'javascript', `import { t } from 'kensington';

function profileCard(name, title) {
  return t.article({ class: 'profile' },
    t.h2(name),
    t.p({ class: 'title' }, title),
    t.a({ href: \`/users/\${name.toLowerCase()}\` }, 'View profile'),
  );
}

profileCard('Alice', 'Senior Engineer').toString();`),
      },
      {
        label: 'Output',
        content: code(t, 'html', `<article class="profile">
  <h2>Alice</h2>
  <p class="title">Senior Engineer</p>
  <a href="/users/alice">View profile</a>
</article>`),
      },
    ]),
    t.p([
      'For live DOM, call ',
      t.code('.toElement()'),
      ' instead. Pass a ',
      t.code('signal()'),
      ' anywhere a static value is accepted and the DOM updates automatically when the value changes.',
    ]),
    panels(t, [
      {
        label: 'JavaScript',
        content: code(t, 'javascript', `import { t, signal, computed } from 'kensington';

const count = signal(0);
const label = computed(() => count.get() === 1 ? 'item' : 'items');

const counter = t.div([
  t.p([count, ' ', label]),
  t.button({ onclick: () => count.set(n => n + 1) }, '+'),
  t.button({ onclick: () => count.set(n => n - 1) }, '-'),
]).toElement();

document.body.append(counter);`),
      },
      {
        label: 'TypeScript',
        content: code(t, 'typescript', `import { t, signal, computed, Signal } from 'kensington';

const count: Signal<number> = signal(0);
const label = computed(() => count.get() === 1 ? 'item' : 'items');

const counter = t.div([
  t.p([count, ' ', label]),
  t.button({ onclick: () => count.set(n => n + 1) }, '+'),
  t.button({ onclick: () => count.set(n => n - 1) }, '-'),
]).toElement();

document.body.append(counter);`),
      },
    ]),
    t.p([
      'Signals work as content, as attribute values, inside ',
      t.code('style'),
      ' objects, and in the ',
      t.code('prop'),
      ' key. Calling ',
      t.code('.toElement()'),
      ' wires up all updates.',
    ]),
    callout(t, 'tip', 'Two output modes, one codebase',
      t.p([
        t.code('.toString()'),
        ' renders an HTML string for server-side rendering or static generation. ',
        t.code('.toElement()'),
        ' builds a live DOM element and wires signal subscriptions automatically. The same tag instance works both ways.',
      ])
    ),
  ]);
}
