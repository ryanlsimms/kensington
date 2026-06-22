import { trackForStop } from './dom-tracker.js';
import { _internalEffect } from './signal.js';

function clearBetween(start, end) {
  let node = start.nextSibling;
  while (node !== end && node !== null) {
    const next = node.nextSibling;
    node.remove();
    node = next;
  }
}

function renderItem(item) {
  if (item === null || item === undefined || item === false || item === true || item === '') {
    return null;
  }
  if (item._isKensingtonTag === true) {
    return item.toElement();
  }
  return document.createTextNode(String(item));
}

// Renders a Signal as a standalone DOM node. Returns a DocumentFragment with two comment-node
// anchors and reactive content between them. On every signal change the prior siblings are
// cleared and the new value is rendered fresh.
//
// Deliberately simple. Unlike signal-as-content (a child of a real tag), this path does not
// route through reconcile. Reconcile's keyed-list matching, preserve-state restoration, and
// bidirectional matching are unnecessary for a standalone signal whose value is typically
// a single tag (the "swap between two views" pattern). Keeping this off the slim build's
// hot path is the reason. If you need keyed reconciliation around a signal, wrap it in a
// tag: `t.div([signal.mapWithKey(...)])`.
//
// The effect is created via `_internalEffect` so it does not trip the
// "effect inside computed/transform" warning when a parent's reactive callback wires this
// up during its own render. dom-tracker stops the effect when the start anchor (or any of
// its ancestors) is removed from the DOM.
export function renderSignalAsTag(signal) {
  if (typeof document === 'undefined') {
    throw new Error('toElement only supported in browser');
  }
  const startAnchor = document.createComment('');
  const endAnchor = document.createComment('');
  const frag = document.createDocumentFragment();
  frag.append(startAnchor, endAnchor);
  const startRef = new WeakRef(startAnchor);
  const endRef = new WeakRef(endAnchor);

  const eff = _internalEffect(() => {
    const start = startRef.deref();
    const end = endRef.deref();
    if (!start || !end) {
      eff.stop();
      return;
    }
    clearBetween(start, end);
    const value = signal.get();
    const items = Array.isArray(value) ? value : [value];
    const parent = start.parentNode;
    if (!parent) {
      return;
    }
    for (const item of items) {
      const node = renderItem(item);
      if (node !== null) {
        parent.insertBefore(node, end);
      }
    }
  });

  trackForStop(startAnchor, () => eff.stop());
  return frag;
}
