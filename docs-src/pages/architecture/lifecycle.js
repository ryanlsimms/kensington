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
  const effects = [];                            // the bound effects themselves
  const devIds = [];                             // effect IDs for devtools
  const elementRef = new WeakRef(element);       // shared across every signalEffect
}`),
      t.p([
        'Effects are stored directly in the ',
        t.code('effects'),
        ' array. The stop chain registered by ',
        t.code('finalize'),
        ' iterates that array and dispatches once based on the captured ',
        t.code('persist'),
        ' flag, rather than allocating a ',
        t.code('() => persist ? eff.pause() : eff.stop()'),
        ' closure per signal effect.',
      ]),

      t.h3('signalEffect'),
      code('javascript', `signalEffect(sig, apply, label) {
  markNextEffectAsBinding(label);                 // devtools: tag as DOM binding
  const eff = _bindingEffect(sig, val => {
    const el = elementRef.deref();
    if (!el) { eff.stop(); return; }              // element collected; self-stop
    apply(el, val);
  });
  notifyEffectElement(eff._devId, element);       // devtools: link effect to element
  effects.push(eff);
  return eff;
}`),
      t.p([
        'The effect runs once immediately when created, applying the initial signal value. On subsequent runs, it dereferences the WeakRef. If the element has been garbage-collected, the effect self-stops. No zombie subscriptions.',
      ]),
      t.p([
        t.code('_bindingEffect'),
        ' is a lightweight effect that subscribes to exactly one signal. It bypasses ',
        t.code('track()'),
        ' entirely. No ',
        t.code('_cleanups'),
        ' iteration, no ',
        t.code('_reads'),
        ' Set, no ',
        t.code('currentEffect'),
        ' dance. It just calls ',
        t.code('fn(sig.value)'),
        ' on each notification. Lifecycle bindings always read exactly one signal, so this fast path collapses the per-run subscribe/resubscribe pair that the general effect machinery does on each fire.',
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
  trackForStop(element, () => {
    if (persist) {
      for (let i = 0; i < effects.length; i++) { effects[i].pause(); }
    } else {
      for (let i = 0; i < effects.length; i++) { effects[i].stop(); }
    }
  }, devIds);
  if (onCleared) { addOnStop(element, onCleared); }
  for (const fn of disconnectCallbacks) {
    addOnStop(element, () => fn.call(element, element));
  }
}`),
      t.p([
        t.code('trackForStop'),
        ' registers the first link in the chain. The branch on ',
        t.code('persist'),
        ' is resolved once per removal, then a tight loop dispatches the right method on every effect; we never allocate a per-effect ',
        t.code('pauseOrStop'),
        ' closure. ',
        t.code('addOnStop'),
        ' appends to the chain: first ',
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
  let initialConnect = true;
  trackForConnect(element, () => {
    if (initialConnect) {
      initialConnect = false;
    } else {
      if (onReconnect) { onReconnect(); }
      if (persist) {
        for (const eff of effects) {
          eff.resume();
          addOnStop(element, () => eff.pause());
        }
      }
    }
    for (const fn of connectCallbacks) { fn.call(element, element); }
  }, persist);
}`),
      t.p([
        'The shared callback-fire loop runs on both first connection and reconnection. ',
        'Only the reconnect-specific work (',
        t.code('onReconnect'),
        ', resume + re-pause wiring) is gated on the else branch.',
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
const contentTracked = new WeakSet();
let hasAnyTracked = false;   // one-shot latch: observer short-circuit when nothing was ever tracked`),
      t.p([
        t.code('entries'),
        ' is a WeakMap keyed by element. Each entry holds a stop function, an optional connect function, and a persist flag. ',
        t.code('hasAnyTracked'),
        ' is a single boolean. The observer reads it to skip all per-record work in the common case where nothing in the document is tracked yet.',
      ]),
      callout('key', 'Why WeakMap and nothing else?',
        t.p([
          'A plain Map would pin every tracked element by key, so an element produced by ',
          t.code('toElement()'),
          ' and then dropped without ever being inserted would never be collected. The WeakMap avoids that. Iteration happens lazily via a ',
          t.code('TreeWalker'),
          ' over the actual subtree of the removed/added node. We never need a parallel iterable of every tracked element across the whole document.',
        ]),
      ),

      t.h3('The observer'),
      code('javascript', `function buildObserver() {
  if (observer !== null) { return; }
  observer = new MutationObserver(records => {
    if (!hasAnyTracked) { return; }
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
        t.code('hasAnyTracked'),
        ' latch means mutation records are skipped without any per-record work when nothing has ever been tracked.',
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
        ' handles two cases for a mutation record\'s node: the node itself might be tracked, or it might be an ancestor of one or more tracked elements. The walk uses ',
        t.code('document.createTreeWalker'),
        ' so the cost scales with the subtree of the removed node, not with the total number of tracked elements:',
      ]),
      code('javascript', `function visit(node, fn) {
  const own = entries.get(node);
  if (own !== undefined) { fn(node, own); }
  if (node.nodeType !== 1) { return; }
  const skipComments = own !== undefined;
  const walker = document.createTreeWalker(node, SHOW_ELEMENT_AND_COMMENT);
  for (let el = walker.nextNode(); el !== null; el = walker.nextNode()) {
    if (skipComments && el.nodeType !== 1) { continue; }  // protect LiteralTag/CommentTag anchors
    const entry = entries.get(el);
    if (entry !== undefined) { fn(el, entry); }
  }
}`),
      callout('key', 'TreeWalker over a parallel ref iterable',
        t.p([
          'An earlier implementation kept a parallel Set of WeakRefs and iterated every tracked element in the document for every mutation record, checking ',
          t.code('node.contains(el)'),
          ' on each. That was O(tracked × removed) per batch. The TreeWalker variant walks only the actual subtree of the removed node, typically a handful of elements per row, and looks each one up in the WeakMap. The change is responsible for the bulk of the speedups on remove, swap, and create-many-rows in the js-framework-benchmark suite.',
        ]),
      ),
      callout('note', 'visit() does not return early',
        t.p([
          'Even when the node itself has an entry, ',
          t.code('visit()'),
          ' continues to walk descendants. This ensures that effects on descendants (for example, a ',
          t.code('checked=signal'),
          ' attribute on an ',
          t.code('<input>'),
          ' inside a persist-mode parent ',
          t.code('<li>'),
          ') are paused or stopped together with the parent.',
        ]),
      ),

      t.h3('stopRangeBetween'),
      code('javascript', `export function stopRangeBetween(firstNode, endAnchor) {
  if (firstNode === null || firstNode === endAnchor || !hasAnyTracked) { return; }
  const walker = document.createTreeWalker(firstNode.parentNode, SHOW_ELEMENT_AND_COMMENT);
  walker.currentNode = firstNode;
  for (let node = firstNode; node !== null && node !== endAnchor; node = walker.nextNode()) {
    const entry = entries.get(node);
    if (entry !== undefined) { stopOne(node, entry); }
  }
}`),
      t.p([
        'Used by the reconciler\'s clear path. Walks an entire sibling range with a single TreeWalker. Building one walker is dramatically cheaper than building 1000 walkers when ',
        t.code('rowsSignal.set([])'),
        ' clears a list with a thousand reactive rows. The shared ',
        t.code('stopOne(element, entry)'),
        ' helper handles the "clear entry then call stop" sequence used by every dom-tracker teardown path.',
      ]),

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
          t.tr([
            t.td(t.code('stopRangeBetween(first, end)')),
            t.td([
              'Stop every tracked entry in a sibling range with one TreeWalker pass. ',
              'Used by reconcile\'s clear shortcut.',
            ]),
          ]),
        ]),
      ]),
    ]),
  ];
}
