import { t } from 'kensington';

import { code } from '../../components/ui.js';

export function reactivityCleanup() {
  return t.section({ id: 'signals-cleanup' }, [
    t.h2('Cleanup'),
    t.p([
      'Elements created with ',
      t.code('.toElement()'),
      ' automatically stop their reactive effects when the element is removed from the DOM, whether by ',
      t.code('el.remove()'),
      ' or by removing an ancestor.',
    ]),
    code('javascript', `const count = signal(0);
const el = t.p(count).toElement();

document.body.append(el);
el.remove(); // effect tracking count stops automatically`),
    t.p([
      'To pause effects instead of stopping them, add ',
      t.code('persist: true'),
      ' to the tag options. Effects resume automatically when the element is re-inserted, and pause again if it is removed a second time. This works across unlimited cycles.',
    ]),
    code('javascript', `const cls = signal('idle');
const el = t.div({ class: cls, persist: true }).toElement();

document.body.append(el);
el.remove();               // effects pause. cls.set() has no DOM effect
document.body.append(el);  // effects resume
cls.set('active');         // DOM updates immediately`),
    t.p([
      'For effects that run outside of any element, call ',
      t.code('e.pause()'),
      ' to temporarily unsubscribe and ',
      t.code('e.resume()'),
      ' to restart. Call ',
      t.code('e.stop()'),
      ' when the effect is no longer needed. It permanently destroys it and ',
      t.code('resume()'),
      ' becomes a no-op. To tie an effect to a component\'s lifetime without manual bookkeeping, use ',
      t.code('addDisconnectedCallback'),
      '. See ',
      t.a({ href: '#lifecycle' }, 'Lifecycle'),
      ' below.',
    ]),
    t.aside([
      t.p([
        t.strong('Computed signals auto-dispose.'),
        ' When a ',
        t.code('computed()'),
        ' loses its last subscriber, it automatically unsubscribes from all its source signals and freezes its value. It wakes again the next time it is read inside a reactive context (',
        t.code('effect()'),
        ' or another ',
        t.code('computed()'),
        '), re-runs its function, and re-subscribes to sources.',
      ]),
    ]),
    t.aside([
      t.p([
        t.strong('Why effects have '),
        t.code('pause()'),
        t.strong(' but signals and computed do not:'),
        ' ',
        t.code('signal.stop()'),
        ' and ',
        t.code('computed().stop()'),
        ' are permanently destructive: stopping a signal clears its subscribers. Stopping a computed tears down the derived computation entirely. There is no state left to resume from. Effects are different. The callback closure is preserved after ',
        t.code('pause()'),
        ', so ',
        t.code('resume()'),
        ' can re-run it and re-establish subscriptions from scratch. ',
        t.code('effect.stop()'),
        ' is the permanent equivalent, matching the semantics of signal and computed ',
        t.code('stop()'),
        '.',
      ]),
    ]),
  ]);
}
