import { t } from 'kensington';

import { callout, code } from '../../components/ui.js';
import { loc } from './helpers.js';

export function architectureLifecycle() {
  return [
    t.section({ id: 'lifecycle', class: 'stage stage-4' }, [
      t.h2('The Lifecycle Module'),
      t.p({ class: 'file-crumb' }, [
        'esm',
        t.span({ class: 'slash' }, '/'),
        'lib',
        t.span({ class: 'slash' }, '/'),
        'reactive',
        t.span({ class: 'slash' }, '/'),
        loc('esm/lib/reactive/lifecycle.js'),
      ]),
      t.p([
        t.code('createLifecycle({ element, persist })'),
        ' is a closure factory. Each call to ',
        t.code('toElement'),
        ' creates one. The returned object exposes two methods: ',
        t.code('signalEffect(sig, apply, label)'),
        ' and ',
        t.code('finalize({...})'),
        '.',
      ]),
      t.p('This module is the only place that decides whether to pause or stop an effect on removal.'),

      t.h3('Internal state'),
      code('javascript', `export function createLifecycle({ element, persist }) {
  const stops = [];                              // pause-or-stop closures, one per signal effect
  const devIds = [];                             // effect IDs for devtools
  const resumables = persist ? [] : null;        // effect objects for resume() on reconnect
  const elementRef = new WeakRef(element);       // shared across every signalEffect

  function pauseOrStop(eff) {
    return () => persist ? eff.pause() : eff.stop();
  }

  function wireEffect(eff) {
    stops.push(pauseOrStop(eff));
    if (resumables !== null) { resumables.push(eff); }
  }
}`),
      t.p([
        t.code('resumables'),
        ' is allocated only when ',
        t.code('persist'),
        ' is true. The common non-persist case has zero overhead from it.',
      ]),

      t.h3('signalEffect'),
      code('javascript', `signalEffect(sig, apply, label) {
  markNextEffectAsBinding(label);   // devtools: categorise as DOM binding with this label
  const eff = _internalEffect(() => {
    const el = elementRef.deref();
    if (!el) { eff.stop(); return; }  // element collected; self-stop
    apply(el, sig.get());
  });
  notifyEffectElement(eff._devId, element);  // devtools: link effect to element
  wireEffect(eff);
  return eff;
}`),
      t.p([
        'The effect runs once immediately when created, applying the initial signal value. On subsequent runs, it dereferences the WeakRef. If the element has been garbage-collected, the effect self-stops. No zombie subscriptions.',
      ]),
      t.p([
        t.code('_internalEffect'),
        ' is used here instead of ',
        t.code('effect'),
        ' because lifecycle.js legitimately creates effects while other effects are running (during reconcile). The effect-in-effect guard in the public ',
        t.code('effect()'),
        ' export would fire spuriously.',
      ]),
      callout('tip', 'WeakRef is the GC safety net',
        t.p([
          'If a user creates a tag, calls ',
          t.code('toElement'),
          ', and then drops every reference without ever inserting the element, the element is eligible for GC. Without WeakRef, the Signal\'s subscriber set would hold the effect closure, which would hold the element by reference. WeakRef breaks that cycle.',
        ]),
      ),

      t.h3('finalize'),
      t.p([
        t.code('finalize'),
        ' registers the stop chain and (if needed) the connect callback with dom-tracker. Two branches:',
      ]),
      t.div({ class: 'compare-grid' }, [
        t.div([
          t.h4('persist: false (default)'),
          t.p({ style: { fontSize: '0.88rem', margin: '0' } }, `On removal, every effect's stop() is called. Permanent teardown. Disconnect callbacks fire once. Connect callback fires once on first insertion only.`),
        ]),
        t.div([
          t.h4('persist: true'),
          t.p({ style: { fontSize: '0.88rem', margin: '0' } }, `On removal, every effect's pause() is called. The stop chain rebuilds for the next cycle via reFireAndRegister. On reconnect, every effect's resume() is called and the connect callback re-fires.`),
        ]),
      ]),
      t.h4('The disconnect chain'),
      code('javascript', `function registerDisconnectChain() {
  trackForStop(element, () => { for (const stop of stops) { stop(); } }, devIds);
  if (onCleared) { addOnStop(element, onCleared); }
  for (const fn of disconnectCallbacks) {
    addOnStop(element, () => fn.call(element, element));
  }
}`),
      t.p([
        t.code('trackForStop'),
        ' registers the first link: running every signal effect\'s pauseOrStop closure. ',
        t.code('addOnStop'),
        ' appends to that chain: first ',
        t.code('onCleared'),
        ' (which resets the tag\'s ',
        t.code('#domElement'),
        ' cache), then each user-registered disconnect callback.',
      ]),
      t.h4('The persist rebuild'),
      t.p([
        'When persist is true, the chain rebuilds every cycle so disconnect callbacks fire on every removal, not just the first:',
      ]),
      code('javascript', `if (persist) {
  const reFireAndRegister = () => {
    trackForStop(element, () => {});
    if (onCleared) { addOnStop(element, onCleared); }
    for (const fn of disconnectCallbacks) {
      addOnStop(element, () => fn.call(element, element));
    }
    addOnStop(element, reFireAndRegister);  // self-perpetuates
  };
  addOnStop(element, reFireAndRegister);
}`),
      t.h4('The connect path'),
      code('javascript', `const needsConnect = persist || connectCallbacks.length > 0;
if (needsConnect) {
  let firstConnection = true;
  trackForConnect(element, () => {
    if (!firstConnection) {
      if (onReconnect) { onReconnect(); }
      if (resumables !== null && resumables.length > 0) {
        for (const eff of resumables) {
          eff.resume();
          addOnStop(element, () => eff.pause());
        }
      }
    }
    firstConnection = false;
    for (const fn of connectCallbacks) { fn.call(element, element); }
  }, persist);
}`),
      t.p([
        'The shared callback-fire loop runs on both first connection and reconnection. ',
        'Only the reconnect-specific work is gated on !firstConnection.',
      ]),
    ]),

    t.section({ id: 'dom-tracker' }, [
      t.h2('The DOM Tracker'),
      t.p({ class: 'file-crumb' }, [
        'esm',
        t.span({ class: 'slash' }, '/'),
        'lib',
        t.span({ class: 'slash' }, '/'),
        'reactive',
        t.span({ class: 'slash' }, '/'),
        loc('esm/lib/reactive/dom-tracker.js'),
      ]),
      t.p([
        'A shared ',
        t.code('MutationObserver'),
        ' watches ',
        t.code('document.documentElement'),
        ' for any subtree mutation. When tracked elements are added or removed, it fires registered callbacks. This is what closes the loop between "element removed from the DOM" and "effects stop, signals unsubscribe."',
      ]),

      t.h3('The entries map'),
      code('javascript', `const entries = new WeakMap();
const trackedRefs = new Set();
const trackedCleanup = new FinalizationRegistry(ref => trackedRefs.delete(ref));
const contentTracked = new WeakSet();`),
      t.p([
        t.code('entries'),
        ' is a WeakMap keyed by element. Each entry holds a stop function, an optional connect function, and a persist flag. A parallel ',
        t.code('trackedRefs'),
        ' Set (of WeakRefs) supports the iteration in ',
        t.code('visit()'),
        '. The FinalizationRegistry removes dead WeakRefs as elements are collected so the ',
        t.code('trackedRefs.size'),
        ' short-circuit stays approximately accurate.',
      ]),
      callout('key', 'Why WeakMap + a parallel ref set?',
        t.p([
          'A plain Map would pin every tracked element by key, so an element produced by ',
          t.code('toElement()'),
          ' and then dropped without ever being inserted would never be collected. The WeakMap avoids that. ',
          t.code('trackedRefs'),
          ' provides the iterable needed by ',
          t.code('visit()'),
          ' without pinning elements.',
        ]),
      ),

      t.h3('The observer'),
      code('javascript', `function buildObserver() {
  if (observer !== null) { return; }
  observer = new MutationObserver(records => {
    if (trackedRefs.size === 0) { return; }  // skip when nothing is tracked
    for (const record of records) {
      for (const node of record.removedNodes) { if (!node.isConnected) { stopRemoved(node); } }
      for (const node of record.addedNodes)   { fireConnected(node); }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}`),
      t.p([
        'Built lazily on the first ',
        t.code('trackForStop'),
        ' or ',
        t.code('trackForConnect'),
        ' call. There is exactly one for the whole document. The ',
        t.code('trackedRefs.size === 0'),
        ' short-circuit means mutation records are skipped without any per-record work when nothing is tracked.',
      ]),
      t.p([
        'The ',
        t.code('stopRemoved'),
        ' call is guarded by ',
        t.code('if (!node.isConnected)'),
        '. A node removed and immediately reinserted in the same mutation batch will be connected again when the observer fires, so its effects must not be stopped.',
      ]),

      t.h3('The visit helper'),
      t.p([
        t.code('visit(node, fn)'),
        ' handles two cases for a mutation record\'s node: the node itself might be tracked, or it might be an ancestor of one or more tracked elements:',
      ]),
      code('javascript', `function visit(node, fn) {
  const own = entries.get(node);
  if (own !== undefined) {
    fn(node, own);
    // Don't return. Also process tracked child elements so that effects on
    // descendants are paused or stopped together with the parent.
  }
  if (node.nodeType !== 1) { return; }
  for (const ref of [...trackedRefs]) {   // snapshot to avoid mutation during iteration
    const el = ref.deref();
    if (el === undefined) { trackedRefs.delete(ref); continue; }
    if (el === node) { continue; }
    if (own !== undefined && el.nodeType !== 1) { continue; }  // skip comment anchors on persist parents
    if (node.contains(el)) {
      const entry = entries.get(el);
      if (entry !== undefined) { fn(el, entry); }
    }
  }
}`),
      callout('note', 'visit() does not return early',
        t.p([
          'Even when the node itself has an entry, ',
          t.code('visit()'),
          ' continues to check ',
          t.code('trackedRefs'),
          ' for child elements. This ensures that effects on descendants (for example, a ',
          t.code('checked=signal'),
          ' attribute on an ',
          t.code('<input>'),
          ' inside a persist-mode parent ',
          t.code('<li>'),
          ') are paused or stopped together with the parent.',
        ]),
      ),

      t.h3('API surface'),
      t.table([
        t.thead(t.tr([
          t.th('Export'),
          t.th('Purpose'),
        ])),
        t.tbody([
          t.tr([
            t.td(t.code('trackForStop(el, fn, devIds)')),
            t.td('Register the initial stop function and associated devtools effect IDs.'),
          ]),
          t.tr([
            t.td(t.code('trackForConnect(el, fn, persist)')),
            t.td('Register the connect callback. persist controls re-fire and entry survival after removal.'),
          ]),
          t.tr([t.td(t.code('addOnStop(el, fn)')), t.td('Append to the stop chain. No-op if stop is not set.')]),
          t.tr([t.td(t.code('markContentTracked(el)')), t.td('Flag an element as owning signal-content anchors.')]),
          t.tr([t.td(t.code('isTracked(el)')), t.td('Does this element have an active stop registration?')]),
          t.tr([t.td(t.code('isContentTracked(el)')), t.td('Was this element flagged via markContentTracked?')]),
          t.tr([
            t.td(t.code('stopTracked(el)')),
            t.td('Force synchronous teardown. Used by the reconciler for discarded fresh nodes.'),
          ]),
          t.tr([
            t.td(t.code('stopRemoved(node)')),
            t.td([
              'Called by the MutationObserver. ',
              'Calls visit() to find and stop all tracked entries for node or its descendants.',
            ]),
          ]),
        ]),
      ]),
    ]),
  ];
}
