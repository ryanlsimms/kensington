import { code, exLink } from '../../components/ui.js';

export function reactivityInTemplates(t) {
  return [
    t.section({ id: 'signals-content' }, [
      t.h2('Content'),
      t.p('Pass a signal as an element\'s content (or anywhere in a content array) and the text node updates in place when the signal changes.'),
      code(t, 'javascript', `const count = signal(0);
const label = computed(() => count.get() === 1 ? 'item' : 'items');

t.p([count, ' ', label]).toElement();

count.set(3);  // renders "3 items"`),
      t.p([
        'A signal returning an array replaces its placeholder nodes on each change. A signal returning ',
        t.code('null'),
        ' or ',
        t.code('undefined'),
        ' renders nothing.',
      ]),
    ]),

    t.section({ id: 'signals-attributes' }, [
      t.h2('Attributes'),
      t.p('Pass a signal as any attribute value. The attribute is set, removed, or toggled automatically when the signal changes.'),
      code(t, 'javascript', `const isLoading = signal(false);
const cls = computed(() => isLoading.get() ? 'btn-secondary' : 'btn-primary');

t.button({ class: cls, disabled: isLoading }, 'Save').toElement();

isLoading.set(true);   // disables button and changes class
isLoading.set(false);  // restores it`),
      t.p([
        exLink(t, '?page=examples#character-counter', 'Character counter example'),
        ' ',
        exLink(t, '?page=examples#dark-mode', 'Dark mode example'),
      ]),
    ]),

    t.section({ id: 'signals-dom-props' }, [
      t.h2('DOM properties'),
      t.p([
        'Sets a property instead of an attribute. ',
        t.code('input.value'),
        ' reflects what the user typed, while ',
        t.code("getAttribute('value')"),
        ' still returns the original default. Use the ',
        t.code('prop'),
        ' key to assign directly to DOM properties via ',
        t.code('el[name] = value'),
        ', bypassing ',
        t.code('setAttribute'),
        ':',
      ]),
      code(t, 'javascript', `const userInput = signal('');

// Assigns el.value = '' reactively, keeping the live property in sync
t.input({ type: 'text', prop: { value: userInput } }).toElement();

// Resetting
userInput.set('');  // el.value resets immediately

// Properties with no HTML attribute equivalent
const isMuted = signal(true);

t.video({ src: '/intro.mp4', prop: { muted: isMuted, playbackRate: 1.5 } }).toElement();

isMuted.set(false); // unmutes video`),
      t.aside([
        t.p([
          t.code('prop'),
          ' is silently ignored in ',
          t.code('.toString()'),
          '. Known writable properties on the element\'s DOM interface are typed in TypeScript. Expando properties are also accepted. Property existence and writability are validated at render time.',
        ]),
      ]),
    ]),

    t.section({ id: 'signals-keyed-lists' }, [
      t.h2('Keyed lists'),
      t.p([
        'When a signal holds an array, add ',
        t.code('dataKey'),
        ' to items. The reconciler matches nodes by ',
        t.code('data-key'),
        ' and reuses DOM elements on reorder, addition, and removal. Reused nodes are diffed recursively: only changed attributes and text are written to the DOM. Signal-managed attributes on reused nodes are preserved, and orphaned effects on discarded nodes are stopped immediately.',
      ]),
      code(t, 'javascript', `const items = signal([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
]);

const rows = computed(() =>
  items.get().map(item => t.li({ dataKey: item.id }, item.name)),
);

t.ul(rows).toElement();`),
      t.p(exLink(t, '?page=examples#sortable-table', 'Sortable table example')),
    ]),

    t.section({ id: 'signals-literal' }, [
      t.h2('With .literal and .inlineComment'),
      code(t, 'javascript', `const html = signal('<b>bold</b>');
t.div(t.literal(html)).toElement();
// element is replaced when html changes

const note = signal('draft');
t.div([t.p('content'), t.inlineComment(note)]).toElement();
// comment nodeValue updates live`),
    ]),

    t.section({ id: 'signals-existing-elements' }, [
      t.h2('Existing elements'),
      t.p([
        'When most of a page is static HTML, it is simpler to reach into the DOM with ',
        t.code('querySelector'),
        ' and drive updates with ',
        t.code('effect()'),
        ' directly rather than rebuilding large chunks of markup with ',
        t.code('.toElement()'),
        '.',
      ]),
      code(t, 'javascript', `import { signal, effect } from 'kensington';

const theme = signal('light');

// Toggle a class on a single element
const root = document.documentElement;
effect(() => {
  root.classList.toggle('dark', theme.get() === 'dark');
});

// Drive a set of elements from one signal
const currentTab = signal('overview');

document.querySelectorAll('[data-tab-content]').forEach(el => {
  effect(() => {
    el.classList.toggle('hidden', el.dataset.tabContent !== currentTab.get());
  });
});

// Update text content
const count = signal(0);
const label = document.getElementById('count-label');
effect(() => {
  label.textContent = count.get();
});`),
      t.aside([
        t.p([
          'Effects created this way are not auto-stopped when the element is removed from the DOM. That is fine for page-lifetime effects. If an element is removed while the effect should keep running, there is nothing to clean up. If the element is removed and the effect ',
          t.em('should'),
          ' stop, store the return value and call ',
          t.code('.stop()'),
          ' manually, or use ',
          t.code('addDisconnectedCallback'),
          ' on a Kensington-created ancestor. See ',
          t.a({ href: '#signals-cleanup' }, 'Cleanup'),
          '.',
        ]),
      ]),
    ]),
  ];
}
