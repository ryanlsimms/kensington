import { t } from 'kensington';

import { apiTable } from '../../components/table.js';
import { code } from '../../components/ui.js';

export function reactivityBatching() {
  return t.section({ id: 'signals-batching' }, [
    t.h2('Update timing'),
    t.h3({ id: 'automatic-batching' }, 'Automatic batching'),
    t.p([
      'Signal values change immediately. Computed values also stay current. Kensington groups pending effect reruns and DOM updates into a microtask that runs after your current JavaScript finishes. Several writes can therefore produce one update with the final values.',
    ]),
    code('javascript', `import { computed, effect, signal } from 'kensington';

const firstName = signal('Ada');
const lastName = signal('Lovelace');
const fullName = computed(() => \`\${firstName.get()} \${lastName.get()}\`);
const watcher = effect(() => console.log(fullName.get())); // Ada Lovelace

firstName.set('Grace');
lastName.set('Hopper');
console.log(fullName.get()); // Grace Hopper
// The existing effect runs once with Grace Hopper after this code finishes.`),
    t.p([
      'Creating an effect or resuming one runs its callback immediately. Automatic batching applies to reruns caused by signal changes. Computeds still recompute as their sources change. A signal changed and then restored to its original value still causes a pending effect to run once.',
    ]),

    t.h3({ id: 'apply-pending-reactive-updates' }, 'Apply pending updates'),
    t.p([
      'Call ',
      t.code('applyPendingReactiveUpdates()'),
      ' when you need pending DOM updates and user effects to finish before the next line runs. It takes no arguments and returns nothing. Ordinary signal writes do not need it.',
    ]),
    t.p([
      'The pending updates are ordinary JavaScript functions. Kensington normally delays calling them until a microtask runs. ',
      t.code('applyPendingReactiveUpdates()'),
      ' calls them immediately instead, on the current call stack. Your next line runs only after those synchronous callbacks finish. There is no Promise to await.',
    ]),
    code('javascript', `import { applyPendingReactiveUpdates, signal, t } from 'kensington';

const text = signal('Before');
const element = t.p(text).toElement();
document.body.append(element);

text.set('After');
console.log(element.textContent); // Before

applyPendingReactiveUpdates();
console.log(element.textContent); // After`),
    t.p([
      'The call processes the shared queue, including updates queued elsewhere and further work queued synchronously by effects. It does not force clean effects to run again. Later writes are automatically batched as usual.',
    ]),
    t.p([
      'This is Kensington’s own queue of reactive updates, not JavaScript’s microtask queue. If an effect starts a fetch or schedules a Promise callback, that work remains asynchronous and can still be unfinished when the helper returns. Await that separate work if you need its result.',
    ]),

    t.section({ id: 'choosing-update-timing' }, [
      t.h3('Choose how to wait'),
      t.p([
        'Most signal writes need no helper or wait. Let automatic batching update the page. Signal and computed values read with ',
        t.code('.get()'),
        ' are already current. Choose one of these only when the timing of your next action matters.',
      ]),
      apiTable(['Choice', 'When to use it', 'What happens'], [
        [
          t.code('applyPendingReactiveUpdates()'),
          'Your next line must read, measure or focus updated DOM, or inspect an effect result.',
          'Kensington runs its pending reactive updates immediately. Your code does not yield.',
        ],
        [
          t.code('queueMicrotask(callback)'),
          'A callback must run after the current code finishes.',
          'The callback is scheduled for later. The calling code continues without waiting.',
        ],
        [
          t.code('await Promise.resolve()'),
          'An async function needs to let already queued microtasks run before continuing.',
          'The function pauses and its continuation is queued. Other asynchronous work can still remain unfinished.',
        ],
      ]),
      t.p([
        t.code('Promise.resolve()'),
        ' by itself just returns a fulfilled promise. It does not pause your code. ',
        t.code('Promise.resolve().then(callback)'),
        ' also schedules a callback. Prefer ',
        t.code('queueMicrotask(callback)'),
        ' for simple deferral. Use a promise chain when you need its result or rejection handling.',
      ]),
    ]),

    t.section({ id: 'reactive-focus-example' }, [
      t.h3('Focus an input after showing it'),
      t.p([
        'Clicking the button creates an editor. Apply its pending DOM update before looking up the input, focusing it and selecting its text. The click handler does not need to pause.',
      ]),
      code('javascript', `import { applyPendingReactiveUpdates, signal, t } from 'kensington';

const editor = signal(null);
const host = t.div(editor).toElement();
const button = t.button({
  onclick: () => {
    editor.set(t.input({ prop: { value: 'Draft title' } }));
    applyPendingReactiveUpdates();
    const input = host.querySelector('input');
    input.focus();
    input.select();
  },
}, 'Edit title').toElement();
document.body.append(button, host);`),
    ]),

    t.section({ id: 'defer-a-callback' }, [
      t.h3('Run a callback after the current code'),
      t.p([
        'Use ',
        t.code('queueMicrotask'),
        ' when finishing the current callback is part of the requirement. For example, setup may need to finish before a notification runs, or a lazy signal registry may need to create entries outside the effect that discovers them.',
      ]),
      code('javascript', `queueMicrotask(() => console.log('callback'));
console.log('current code');
// Logs current code, then callback.`),
      t.p([
        'A queued callback runs outside the effect that scheduled it. Capture any tracked signal values inside the effect before scheduling the callback. Calling ',
        t.code('applyPendingReactiveUpdates()'),
        ' inside an effect or computed does not leave that scope or start another update pass. Deferring a signal write does not prevent a feedback loop.',
      ]),
    ]),

    t.section({ id: 'wait-for-removal-cleanup' }, [
      t.h3('Let a pending removal observer run'),
      t.p([
        'Direct DOM removal is different from changing a binding. Kensington uses a mutation observer to clean up a removed reactive element. In an async function, ',
        t.code('await Promise.resolve()'),
        ' after removal lets that observer run before you reuse the tag.',
      ]),
      code('javascript', `import { signal, t } from 'kensington';

const tag = t.p(signal('Ready'));
const first = tag.toElement();
document.body.append(first);
first.remove();
await Promise.resolve(); // Let the removal observer run.
const second = tag.toElement();
document.body.append(second);
console.log(first === second); // false`),
      t.p([
        t.code('applyPendingReactiveUpdates()'),
        ' cannot replace this wait because it does not run lifecycle observers or separate computed cleanup microtasks. One ',
        t.code('await Promise.resolve()'),
        ' is not a general way to empty the microtask queue. Other microtasks can schedule more work behind your continuation.',
      ]),
      t.p([
        'Do not stack resolved promise waits to guess when a request or component is ready. Await its actual promise or lifecycle event, then apply any resulting pending reactive updates if the next line needs them.',
      ]),
    ]),

    t.h3({ id: 'reactive-animation-reset' }, 'Reset an animation'),
    t.p([
      'When resetting an animated element, apply pending updates while transitions are disabled. Then let the browser calculate the new layout before restoring transitions. This avoids relying on the ordering of an awaited Promise.',
    ]),
    code('javascript', `import { applyPendingReactiveUpdates, signal, t } from 'kensington';

const width = signal('100px');
const timer = t.div({
  style: { width, height: '10px', transition: 'width 2s linear' },
}).toElement();
document.body.append(timer);
timer.getBoundingClientRect();

function resetTimer() {
  const previousTransition = timer.style.transition;
  timer.style.transition = 'none';
  try {
    width.set('0px');
    applyPendingReactiveUpdates();
    timer.getBoundingClientRect();
  } finally {
    timer.style.transition = previousTransition;
  }
}`),

    t.h3({ id: 'pending-update-limits' }, 'What the call does not wait for'),
    t.p([
      'The call does not wait for promises, browser painting, animations, lifecycle observers or deferred computed cleanup. If an effect starts a request, the request can still be in progress when the call returns. A third party component may also schedule its own later updates. Neither queueMicrotask nor awaiting a resolved promise guarantees that the browser has painted or that an animation has finished.',
    ]),
    t.p([
      'Call it from application code such as an event handler. Calls inside a computed or effect callback do not start a nested update pass. The current work must finish first. Calls during renderForHydration do nothing so server rendering cannot run unrelated pending effects.',
    ]),
    t.p([
      'Signal values are not rolled back if an effect fails. Errors from effect reruns are reported on a microtask and do not prevent other pending effects from running. A try/catch around applyPendingReactiveUpdates does not catch those errors.',
    ]),
    t.p([
      'See ', t.a({ href: '?page=api#api-apply-pending-reactive-updates' }, 'applyPendingReactiveUpdates in the API reference'), '.',
    ]),
  ]);
}
