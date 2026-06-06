import { t } from 'kensington';

import { code } from '../../components/ui.js';

export function reactivityLifecycle() {
  return t.section({ id: 'lifecycle' }, [
    t.h2('Lifecycle'),
    t.p([
      'Kensington tag objects support lifecycle callbacks via ',
      t.code('addConnectedCallback(fn)'),
      ' and ',
      t.code('addDisconnectedCallback(fn)'),
      ', mirroring the web component lifecycle. Call them on a tag object before calling ',
      t.code('.toElement()'),
      '. Both methods return ',
      t.code('this'),
      ' and can be called multiple times to register multiple handlers. Callbacks receive the live DOM element as both the first argument and as ',
      t.code('this'),
      ', matching web component convention.',
    ]),

    t.h3({ id: 'connected-callback' }, 'addConnectedCallback'),
    t.p([
      'Fires when the element is inserted into the DOM. Use it for initialization that requires DOM presence, such as reading layout dimensions, starting side effects that should only run while the element is mounted, or initializing third-party libraries that need a live element.',
    ]),
    code('javascript', `const panel = t.div({ class: 'panel' }, content);

panel.addConnectedCallback(function(el) {
  // el (and \`this\`) is the DOM element. Layout is readable here
  const { width } = el.getBoundingClientRect();
  el.dataset.initialWidth = width;
});

document.body.append(panel.toElement()); // callback fires here`),
    t.p([
      'By default the callback fires once per ',
      t.code('toElement()'),
      ' call and is cleared when the element is removed. With ',
      t.code('persist: true'),
      ' in the tag options, all connected and disconnected callbacks re-fire on every cycle.',
    ]),
    code('javascript', `const tag = t.div({ persist: true }, content);
tag.addConnectedCallback(setup);
tag.addDisconnectedCallback(teardown);
tag.toElement();  // both callbacks re-fire on every insert/remove cycle`),

    t.h3({ id: 'disconnected-callback', style: { fontSize: 'clamp(1rem, 6vw, 1.35rem);' } }, 'addDisconnectedCallback'),
    t.p([
      'Fires when the element leaves the DOM. ',
      'Signal effects are stopped first, then disconnected callbacks run. ',
      'Use it for cleanup that signals cannot handle automatically, ',
      'such as clearing intervals and timers, destroying third-party library instances, ',
      'or removing portal elements.',
    ]),
    t.p([
      'By default the callback fires once and is not re-registered. With ',
      t.code('persist: true'),
      ' in the tag options, all disconnect callbacks re-fire on every removal.',
    ]),
    code('javascript', `let intervalId;
const ticker = t.div({ class: 'ticker' }, price);

ticker.addDisconnectedCallback(() => {
  clearInterval(intervalId);
});`),
    t.p([
      'For a complete example combining both callbacks with an interval timer and a portal element, see the ',
      t.a({ href: '?page=examples#lifecycle-widget' }, 'lifecycle widget'),
      ' on the Examples page.',
    ]),
  ]);
}
