import { trackForStop } from './dom-tracker.js';
import { reconcile } from './reconcile.js';
import { _internalEffect } from './signal.js';

// Renders a Signal as a standalone DOM node. Returns a DocumentFragment with two comment-node
// anchors and reactive content between them. Uses the same reconciliation as tag content,
// preserving existing nodes when the fragment is adopted into its live parent.
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
    const value = signal.get();
    const items = Array.isArray(value) ? value : [value];
    const parent = start.parentNode;
    if (!parent) {
      return;
    }
    reconcile(parent, start, end, items);
  });

  trackForStop(startAnchor, () => eff.stop());
  return frag;
}
