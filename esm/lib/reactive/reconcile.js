// Forms a known cycle with content-tag.js (which imports reconcile for signal-content
// effects). Benign because `ContentTag` here is only consulted inside `valueEqual` at
// runtime, not at module-load time. ESM live bindings resolve correctly by the time
// `reconcile()` is called. Rollup emits a CIRCULAR_DEPENDENCY warning that's informational
// only. See content-tag.js for the other half of the cycle.
import ContentTag from '../../tag-classes/content-tag.js';
import { isContentTracked, isTracked, stopTracked } from './dom-tracker.js';

// Snapshot of a tag's (attributes, content) after the render that produced the keyed DOM
// node. The next reconcile pass compares the new tag against this snapshot by value, not by
// reference, so the naive `arr.map(item => t.li({ class: item.cls }, item.label))` pattern
// hits the fast path when the data is unchanged. The WeakMap key is the DOM node, so entries
// clear automatically on garbage collection.
const snapshots = new WeakMap();

function itemKey(item) {
  const attrs = item?.attributes;
  const key = attrs?.dataKey ?? attrs?.['data-key'];
  return key === undefined ? null : String(key);
}

// Structural equality. Plain objects and arrays compare by their keys/elements. ContentTag
// instances (including VoidTag and HtmlWithDoctypeTag, which extend it) compare by
// tagName + attributes + content. Functions and class instances with private state (Signal,
// LiteralTag, CommentTag, DOM nodes, Maps, Sets, ...) fall back to reference equality.
// Recursion is bounded by tree size and short-circuits on the first mismatch.
function valueEqual(a, b) {
  if (a === b) { return true; }
  if (a === null || b === null) { return false; }
  if (typeof a !== typeof b) { return false; }
  if (typeof a !== 'object') { return false; }
  // ContentTag and its subclasses.
  if (a instanceof ContentTag && b instanceof ContentTag) {
    if (a.tagName !== b.tagName) { return false; }
    if (!valueEqual(a.attributes, b.attributes)) { return false; }
    if (a.content.length !== b.content.length) { return false; }
    for (let i = 0; i < a.content.length; i++) {
      if (!valueEqual(a.content[i], b.content[i])) { return false; }
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
  // Skip attribute removal for tracked elements — signal-driven attributes are
  // managed by deferred effects and won't appear on the fresh element yet.
  if (!isTracked(existing)) {
    for (const attr of oldAttrNames) {
      existing.removeAttribute(attr);
    }
  }
  // Skip child patching for content-tracked elements — their children include
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
  stopTracked(fresh);
  return existing;
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

  let cursor = startAnchor.nextSibling;
  for (const item of newItems) {
    if (item === null || item === undefined || item === false) { continue; }
    const key = itemKey(item);
    let targetNode;
    if (key !== null && oldNodes.has(key)) {
      const old = oldNodes.get(key);
      oldNodes.delete(key);
      if (snapshotMatches(snapshots.get(old), item)) {
        // Attributes and content structurally equal the previous render. The DOM under this
        // key cannot have changed shape, so skip the toElement() build and the syncNode diff.
        targetNode = old;
      } else {
        targetNode = syncNode(old, itemToNode(item));
        recordSnapshot(targetNode, item);
      }
    } else {
      targetNode = itemToNode(item);
      recordSnapshot(targetNode, item);
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
    leftover = next;
  }

  for (const old of oldNodes.values()) {
    old.remove();
  }
}
