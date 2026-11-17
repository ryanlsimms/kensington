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

    t.h3({ id: 'owned-effects' }, 'Tag-owned effects'),
    t.p([
      'Use tag.effect(fn) for reactive work owned by an element. It returns the tag for chaining. ',
      'Registration is safe inside mapWithKey row builders because execution waits for connection.',
    ]),
    code('javascript', `return t.div(content).effect(() => updateChart(data.get()));`),
    t.ul([
      t.li('Register before .toElement(). Each run receives the live element as its first argument and this.'),
      t.li('Starts on connection; stops on normal removal. Own or inherited persistence pauses/resumes it.'),
      t.li('Effects start/resume before connected callbacks. Moves within the document do not restart them.'),
      t.li('Never runs during SSR or for a tag that is never mounted. Each tag can own multiple effects.'),
      t.li('Errors do not skip other effects. Initial failures remove partial subscriptions and are not retried.'),
      t.li('Effect-body returns are ignored. Timers, listeners and async work still need explicit resource cleanup.'),
    ]),
    t.p([
      'Use standalone effect() inside a connected callback if it depends on that callback\'s setup, ',
      'and stop its handle in addDisconnectedCallback. Use standalone effect() for manual pause/resume/stop control.',
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

document.body.append(panel.toElement()); // callback runs after insertion is observed`),
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

    t.p([
      'Connected callback return values are ignored, including functions and promises. ',
      'Register resource teardown with addDisconnectedCallback. Setup is observed after insertion; ',
      'server rendering does not run lifecycle callbacks. ',
      'Thrown callback errors are reported asynchronously without skipping other callbacks or descendant teardown.',
    ]),

    t.h3({ id: 'disconnected-callback', style: { fontSize: 'clamp(1rem, 6vw, 1.35rem);' } }, 'addDisconnectedCallback'),
    t.p([
      'Fires when the element leaves the DOM, after its signal effects have been cleaned up. ',
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
