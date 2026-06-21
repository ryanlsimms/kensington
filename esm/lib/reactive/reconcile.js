import { isContentTracked, isTracked, stopRangeBetween, stopRemoved, stopTracked } from './dom-tracker.js';
import { transferListeners } from './element-listeners.js';
import { captureState, restoreState } from './preserve-state.js';
import { isKensingtonSignal } from './signal.js';

// Snapshot of a tag's (attributes, content) after the render that produced the keyed DOM
// node. The next reconcile pass compares the new tag against this snapshot by value, not by
// reference, so the naive `arr.map(item => t.li({ class: item.cls }, item.label))` pattern
// hits the fast path when the data is unchanged. The WeakMap key is the DOM node, so entries
// clear automatically on garbage collection.
const snapshots = new WeakMap();

// Static (non-Signal) prop values assigned during toElement(). syncNode reads these to
// replay prop assignments onto the reused existing node when a keyed item re-renders.
const staticProps = new WeakMap();

export function recordStaticProps(element, props) {
  staticProps.set(element, props);
}

function itemKey(item) {
  const attrs = item?.attributes;
  const key = attrs?.dataKey ?? attrs?.['data-key'] ?? attrs?.data?.key;
  return key === undefined ? null : String(key);
}

// Structural equality. Plain objects and arrays compare by their keys/elements. ContentTag
// instances (including VoidTag and HtmlWithDoctypeTag, which extend it) compare by
// tagName + attributes + content. Functions compare by reference. Two arrow functions
// closing over the same variables are still distinct references, so a re-render with a new
// inline handler correctly falls through to syncNode, which calls transferListeners to swap
// the old handler for the new one. Other class instances with private state (Signal,
// LiteralTag, CommentTag, DOM nodes, Maps, Sets, ...) fall back to reference equality.
// Recursion is bounded by tree size and short-circuits on the first mismatch.
function valueEqual(a, b) {
  if (a === b) { return true; }
  if (a === null || b === null) { return false; }
  if (typeof a !== typeof b) { return false; }
  if (typeof a !== 'object') { return false; }
  // ContentTag and its subclasses. attributes is always a plain object or null and content
  // is always an array (collectContent normalises in the constructor), so the comparison
  // can be inlined without re-checking those invariants on every recursion.
  if (a._isKensingtonContentTag && b._isKensingtonContentTag) {
    if (a.tagName !== b.tagName) { return false; }
    const aa = a.attributes, ba = b.attributes;
    if (aa !== ba) {
      if (aa === null || ba === null) { return false; }
      // Attributes are user-passed plain objects (kensington never assigns prototypes to
      // them), so for...in enumerates own keys only. Skip Object.keys allocation.
      const ka = Object.keys(aa);
      const aLen = ka.length;
      if (aLen !== Object.keys(ba).length) { return false; }
      for (let i = 0; i < aLen; i++) {
        const k = ka[i];
        if (!valueEqual(aa[k], ba[k])) { return false; }
      }
    }
    const ac = a.content, bc = b.content;
    if (ac !== bc) {
      const len = ac.length;
      if (len !== bc.length) { return false; }
      for (let i = 0; i < len; i++) {
        if (!valueEqual(ac[i], bc[i])) { return false; }
      }
    }
    return true;
  }
  // Arrays.
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) { return false; }
    for (let i = 0; i < a.length; i++) {
      if (!valueEqual(a[i], b[i])) { return false; }
    }
    return true;
  }
  if (Array.isArray(b)) { return false; }
  // Reference-only for class instances (anything not a plain or null-proto object).
  const protoA = Object.getPrototypeOf(a);
  const protoB = Object.getPrototypeOf(b);
  if (protoA !== Object.prototype && protoA !== null) { return false; }
  if (protoB !== Object.prototype && protoB !== null) { return false; }
  // Plain object.
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) { return false; }
  for (const k of ka) {
    if (!valueEqual(a[k], b[k])) { return false; }
  }
  return true;
}

function snapshotMatches(prev, item) {
  if (prev === undefined) { return false; }
  return valueEqual(prev.attributes, item.attributes)
    && valueEqual(prev.content, item.content);
}

// Walks the previous snapshot and the new item in parallel. Returns true if any pair of
// values are both Signal instances but reference different signals. Used to distinguish
// "static value changed" (patch in place, preserves DOM identity) from "signal identity
// changed" (must rebuild the node so the fresh signal's effect drives the live element).
function signalRefMismatch(a, b) {
  if (a === b) { return false; }
  if (isKensingtonSignal(a) && isKensingtonSignal(b)) { return true; }
  if (a._isKensingtonContentTag && b._isKensingtonContentTag) {
    if (a.attributes !== undefined && b.attributes !== undefined) {
      for (const k of Object.keys(a.attributes)) {
        if (signalRefMismatch(a.attributes[k], b.attributes[k])) { return true; }
      }
    }
    if (Array.isArray(a.content) && Array.isArray(b.content)) {
      const cLen = Math.min(a.content.length, b.content.length);
      for (let i = 0; i < cLen; i++) {
        if (signalRefMismatch(a.content[i], b.content[i])) { return true; }
      }
    }
    return false;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (signalRefMismatch(a[i], b[i])) { return true; }
    }
    return false;
  }
  if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
    const protoA = Object.getPrototypeOf(a);
    const protoB = Object.getPrototypeOf(b);
    if (
      (protoA === Object.prototype || protoA === null)
      && (protoB === Object.prototype || protoB === null)
    ) {
      for (const k of Object.keys(a)) {
        if (signalRefMismatch(a[k], b[k])) { return true; }
      }
    }
  }
  return false;
}

function snapshotHasSignalRefMismatch(prev, item) {
  if (prev === undefined) { return false; }
  if (prev.attributes !== undefined && item.attributes !== undefined) {
    for (const k of Object.keys(prev.attributes)) {
      if (signalRefMismatch(prev.attributes[k], item.attributes[k])) { return true; }
    }
  }
  if (Array.isArray(prev.content) && Array.isArray(item.content)) {
    const len = Math.min(prev.content.length, item.content.length);
    for (let i = 0; i < len; i++) {
      if (signalRefMismatch(prev.content[i], item.content[i])) { return true; }
    }
  }
  return false;
}

function recordSnapshot(node, item) {
  if (item?.attributes === undefined) { return; }
  snapshots.set(node, { attributes: item.attributes, content: item.content });
}

function itemToNode(item) {
  if (item !== null && item !== undefined && typeof item.toElement === 'function') {
    return item.getDomElement?.() ?? item.toElement();
  }
  if (item === null || item === undefined || item === false) {
    return document.createTextNode('');
  }
  return document.createTextNode(String(item));
}

function syncNode(existing, fresh) {
  if (existing === fresh) { return existing; }
  if (existing.nodeType !== fresh.nodeType || existing.nodeName !== fresh.nodeName) {
    return fresh;
  }
  if (existing.nodeType === 3) {
    if (existing.nodeValue !== fresh.nodeValue) {
      existing.nodeValue = fresh.nodeValue;
    }
    return existing;
  }
  if (existing.nodeType !== 1) {
    return fresh;
  }
  const oldAttrNames = new Set(existing.getAttributeNames());
  for (const attr of fresh.getAttributeNames()) {
    const val = fresh.getAttribute(attr);
    if (existing.getAttribute(attr) !== val) {
      existing.setAttribute(attr, val);
    }
    oldAttrNames.delete(attr);
  }
  // Skip attribute removal for tracked elements. Signal-driven attributes are
  // managed by deferred effects and won't appear on the fresh element yet.
  if (!isTracked(existing)) {
    for (const attr of oldAttrNames) {
      existing.removeAttribute(attr);
    }
  }
  // Skip child patching for content-tracked elements. Their children include
  // signal anchor comment nodes whose references are held in effect closures.
  // Replacing those anchors would break the existing element's content effects.
  if (!isContentTracked(existing)) {
    const oldChildren = [...existing.childNodes];
    const newChildren = [...fresh.childNodes];
    const count = Math.max(oldChildren.length, newChildren.length);
    for (let i = 0; i < count; i++) {
      if (i >= newChildren.length) {
        oldChildren[i].remove();
      } else if (i >= oldChildren.length) {
        existing.appendChild(newChildren[i]);
      } else {
        const synced = syncNode(oldChildren[i], newChildren[i]);
        if (synced !== oldChildren[i]) {
          existing.replaceChild(synced, oldChildren[i]);
        }
      }
    }
  }
  const props = staticProps.get(fresh);
  if (props) {
    for (const [name, val] of Object.entries(props)) {
      if (existing[name] !== val) {
        existing[name] = val;
      }
    }
    staticProps.set(existing, props);
  }
  transferListeners(existing, fresh);
  stopTracked(fresh);
  return existing;
}

// Items in the array may themselves be arrays (a transform callback that returns
// `[t.li(), [t.li(), t.li()]]` for instance). The common case is a flat array, so detect
// it once and avoid a generator allocation entirely. The rare nested case flattens into a
// temporary buffer.
function flattenInto(items, out) {
  for (let i = 0; i < items.length; i++) {
    const v = items[i];
    if (Array.isArray(v)) { flattenInto(v, out); }
    else { out.push(v); }
  }
}

function flattenIfNeeded(items) {
  for (let i = 0; i < items.length; i++) {
    if (Array.isArray(items[i])) {
      const out = [];
      flattenInto(items, out);
      return out;
    }
  }
  return items;
}

// false/true/'' are common conditional-content patterns (`cond && t.span()`) that resolve to
// nothing; null/undefined likewise. Treat them all as "skip" in the reconcile pass.
function isRenderableItem(item) {
  return item !== null && item !== undefined && item !== false && item !== true && item !== '';
}

export function reconcile(parent, startAnchor, endAnchor, newItems) {
  const oldNodes = new Map();
  let node = startAnchor.nextSibling;
  while (node !== endAnchor) {
    const key = node.dataset?.key;
    if (key !== undefined) {
      oldNodes.set(key, node);
    }
    node = node.nextSibling;
  }

  const items = flattenIfNeeded(newItems);

  // Clear fast path: when the new list is empty, the per-node .remove() loop costs ~10x
  // more than a single Range.deleteContents() because every removal goes through its own
  // DOM mutation and MutationObserver record. Stop the per-node effects synchronously,
  // then drop the whole range in one DOM op.
  if (items.length === 0 && startAnchor.nextSibling !== endAnchor) {
    // One TreeWalker pass over the whole range stops every tracked effect in the subtree;
    // building a fresh walker per child is the dominant overhead at 1000+ rows.
    stopRangeBetween(startAnchor.nextSibling, endAnchor);
    const range = document.createRange();
    range.setStartAfter(startAnchor);
    range.setEndBefore(endAnchor);
    range.deleteContents();
    return;
  }

  // Pre-pass: remove old nodes whose keys are no longer present in newItems. Without this,
  // a deletion in the middle of the list leaves the orphaned node in the cursor path. Every
  // subsequent kept row then triggers an insertBefore to skip past it, turning an O(1)
  // deletion into O(N) DOM operations. The pre-pass keeps the main loop's cursor advancing
  // over nodes that all line up with their new positions (typically the swap-only or
  // insert-only paths).
  if (oldNodes.size > 0) {
    const newKeys = new Set();
    for (let idx = 0; idx < items.length; idx++) {
      if (!isRenderableItem(items[idx])) { continue; }
      const k = itemKey(items[idx]);
      if (k !== null) { newKeys.add(k); }
    }
    for (const [key, oldNode] of oldNodes) {
      if (!newKeys.has(key)) {
        oldNodes.delete(key);
        oldNode.remove();
        stopRemoved(oldNode);
      }
    }
  }

  let cursor = startAnchor.nextSibling;
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    if (!isRenderableItem(item)) { continue; }
    const key = itemKey(item);
    const old = key === null ? undefined : oldNodes.get(key);
    let targetNode;
    if (old === undefined) {
      targetNode = itemToNode(item);
      recordSnapshot(targetNode, item);
    } else {
      oldNodes.delete(key);
      const prevSnapshot = snapshots.get(old);
      if (snapshotMatches(prevSnapshot, item)) {
        // Attributes and content structurally equal the previous render. The DOM under this
        // key cannot have changed shape, so skip the toElement() build and the syncNode diff.
        targetNode = old;
      } else if (snapshotHasSignalRefMismatch(prevSnapshot, item)) {
        // A Signal instance changed reference between renders (typically an unkeyed signal()
        // created inside a computed). Patching the old node in place would leave its effects
        // bound to the stale signal, so we build a fresh node and swap. User-visible DOM
        // state (focus, scroll, input value, selection, details/dialog open) is copied
        // across so the interaction feels continuous.
        const fresh = itemToNode(item);
        const state = captureState(old);
        parent.insertBefore(fresh, cursor);
        old.remove();
        stopRemoved(old);
        restoreState(fresh, state);
        recordSnapshot(fresh, item);
        cursor = fresh.nextSibling;
        continue;
      } else {
        targetNode = syncNode(old, itemToNode(item));
        recordSnapshot(targetNode, item);
      }
    }

    if (cursor === targetNode) {
      cursor = cursor.nextSibling;
    } else {
      parent.insertBefore(targetNode, cursor);
    }
  }

  let leftover = cursor;
  while (leftover !== endAnchor) {
    const next = leftover.nextSibling;
    leftover.remove();
    stopRemoved(leftover);
    leftover = next;
  }

  for (const old of oldNodes.values()) {
    old.remove();
    stopRemoved(old);
  }
}
