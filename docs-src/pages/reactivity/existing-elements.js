import { t } from 'kensington';

import { code } from '../../components/ui.js';

export function reactivityExistingElements() {
  return t.section({ id: 'signals-existing-elements' }, [
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
    code('javascript', `import { t, signal, effect } from 'kensington';

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
  ]);
}
