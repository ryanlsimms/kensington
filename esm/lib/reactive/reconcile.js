import { stopRangeBetween, stopRemoved } from './dom-tracker.js';
import { KENSINGTON_KEY } from './map-with-key.js';
import { captureState, restoreState } from './preserve-state.js';

// Reconciliation key per DOM node. Populated when reconcile inserts a new node for a keyed
// item. Read on the next render via WeakMap. Keys live in JS land so the rendered DOM stays
// clean of internal bookkeeping.
const nodeKeys = new WeakMap();

function itemKey(item) {
  if (item === null || typeof item !== 'object') { return null; }
  const key = item[KENSINGTON_KEY];
  if (key !== undefined) { return key; }
  // Stable tag instances passed directly (without mapWithKey) get the tag itself as an
  // implicit key. The reconciler can then recognize the same tag across renders without
  // requiring the user to thread an explicit key through.
  if (item._isKensingtonTag === true) { return item; }
  return null;
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

// True when the tag for a matched key is a fresh instance whose own DOM doesn't back the
// live node. That happens when mapWithKey's per-key computed re-ran because mapFn touched a
// signal that changed. The reconciler treats it as a rebuild.
function tagNeedsRebuild(item, node) {
  if (item === null || typeof item !== 'object') { return false; }
  if (item._isKensingtonTag !== true) { return false; }
  if (typeof item.getDomElement !== 'function') { return false; }
  const cached = item.getDomElement();
  return cached !== node && cached !== item; // cached === item shows up for tags that don't render to a single node
}

// Build the new DOM for `item`, capture user-visible state from `oldNode`, swap in place,
// restore state. Returns the fresh DOM node. dom-tracker stops the old node's effects when
// the removal mutation fires.
function rebuildNode(parent, oldNode, item, key) {
  const fresh = item.toElement();
  if (key !== undefined && key !== null) { nodeKeys.set(fresh, key); }
  const state = captureState(oldNode);
  parent.insertBefore(fresh, oldNode);
  oldNode.remove();
  stopRemoved(oldNode);
  restoreState(fresh, state);
  return fresh;
}

// Items may themselves be arrays. The common case is a flat array, so detect once and avoid
// a generator allocation. The rare nested case flattens into a temporary buffer.
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
// nothing. null/undefined likewise. Treat them all as "skip".
function isRenderableItem(item) {
  return item !== null && item !== undefined && item !== false && item !== true && item !== '';
}

// Strip non-renderable items so the bidirectional pass can index by position. The hot path
// (everything renderable) returns the input array directly with no allocation.
function filterRenderable(items) {
  for (let i = 0; i < items.length; i++) {
    if (!isRenderableItem(items[i])) {
      const out = [];
      for (let j = 0; j < items.length; j++) {
        if (isRenderableItem(items[j])) { out.push(items[j]); }
      }
      return out;
    }
  }
  return items;
}

// Reconciliation against signal-content. Items produced by `signal.mapWithKey` carry their
// reconciliation key on a Kensington-internal property, which is stamped onto the live DOM
// node via the nodeKeys WeakMap. The rendered DOM is left clean of bookkeeping.
//
// Algorithm. Vue 2 / Inferno style bidirectional reconciliation. Four cheap cases handle the
// common shapes with at most one DOM mutation each. Anything that falls through hits the
// keymap path at the bottom. Hot paths (no change, swap, contiguous insert, contiguous
// remove, head-to-tail move) finish without building the keymap.
export function reconcile(parent, startAnchor, endAnchor, newItems) {
  const items = filterRenderable(flattenIfNeeded(newItems));

  // Clear fast path. One TreeWalker plus Range.deleteContents beats a per-row remove loop
  // because each individual removal goes through its own DOM mutation and observer record.
  if (items.length === 0 && startAnchor.nextSibling !== endAnchor) {
    stopRangeBetween(startAnchor.nextSibling, endAnchor);
    const range = document.createRange();
    range.setStartAfter(startAnchor);
    range.setEndBefore(endAnchor);
    range.deleteContents();
    return;
  }

  // Snapshot the current children. Array index access is faster than Map.get on the slow
  // path and lets the bidirectional pass advance and retreat from both ends in O(1).
  const oldChildren = [];
  for (let node = startAnchor.nextSibling; node !== endAnchor; node = node.nextSibling) {
    oldChildren.push(node);
  }

  let oldStart = 0;
  let oldEnd = oldChildren.length - 1;
  let newStart = 0;
  let newEnd = items.length - 1;

  while (oldStart <= oldEnd && newStart <= newEnd) {
    const oldStartNode = oldChildren[oldStart];
    const oldEndNode = oldChildren[oldEnd];
    const oldStartKey = nodeKeys.get(oldStartNode);
    const oldEndKey = nodeKeys.get(oldEndNode);
    const newStartKey = itemKey(items[newStart]);
    const newEndKey = itemKey(items[newEnd]);

    if (oldStartKey === newStartKey && oldStartKey !== undefined) {
      // Prefix match. Rebuild only when the new tag is a fresh instance for the key.
      if (tagNeedsRebuild(items[newStart], oldStartNode)) {
        oldChildren[oldStart] = rebuildNode(parent, oldStartNode, items[newStart], oldStartKey);
      }
      oldStart++;
      newStart++;
    } else if (oldEndKey === newEndKey && oldEndKey !== undefined) {
      // Suffix match.
      if (tagNeedsRebuild(items[newEnd], oldEndNode)) {
        oldChildren[oldEnd] = rebuildNode(parent, oldEndNode, items[newEnd], oldEndKey);
      }
      oldEnd--;
      newEnd--;
    } else if (oldStartKey === newEndKey && oldStartKey !== undefined) {
      // Head moved to tail.
      let node = oldStartNode;
      if (tagNeedsRebuild(items[newEnd], oldStartNode)) {
        node = rebuildNode(parent, oldStartNode, items[newEnd], oldStartKey);
        oldChildren[oldStart] = node;
      }
      parent.insertBefore(node, oldEndNode.nextSibling);
      oldStart++;
      newEnd--;
    } else if (oldEndKey === newStartKey && oldEndKey !== undefined) {
      // Tail moved to head. The js-framework-benchmark swap test lives here.
      let node = oldEndNode;
      if (tagNeedsRebuild(items[newStart], oldEndNode)) {
        node = rebuildNode(parent, oldEndNode, items[newStart], oldEndKey);
        oldChildren[oldEnd] = node;
      }
      parent.insertBefore(node, oldStartNode);
      oldEnd--;
      newStart++;
    } else {
      break; // Fall through to the keymap path.
    }
  }

  // The fence for any remaining inserts. The suffix nodes (oldChildren[oldEnd+1...]) were
  // either left in place by suffix matches or moved into position by the head-to-tail
  // branch above. Either way the first one is the right "insert before this" reference.
  const trailingFence = oldEnd + 1 < oldChildren.length ? oldChildren[oldEnd + 1] : endAnchor;

  if (oldStart > oldEnd) {
    // Pure inserts. Append every remaining new item before the trailing fence.
    while (newStart <= newEnd) {
      const item = items[newStart++];
      const node = itemToNode(item);
      const key = itemKey(item);
      if (key !== null) { nodeKeys.set(node, key); }
      parent.insertBefore(node, trailingFence);
    }
    return;
  }

  if (newStart > newEnd) {
    // Pure removals. Drop every remaining old child.
    while (oldStart <= oldEnd) {
      const node = oldChildren[oldStart++];
      node.remove();
      stopRemoved(node);
    }
    return;
  }

  // Mixed middle. Build a keymap from the remaining old range and walk the new range from
  // right to left so the insert-before reference is always the previous iteration's node.
  // Real-world workloads (sorts, filters, single edits) finish above.
  const keymap = new Map();
  for (let i = oldStart; i <= oldEnd; i++) {
    const node = oldChildren[i];
    const key = nodeKeys.get(node);
    if (key !== undefined) { keymap.set(key, i); }
  }

  let insertRef = trailingFence;
  for (let i = newEnd; i >= newStart; i--) {
    const item = items[i];
    const key = itemKey(item);
    const oldIndex = key === null ? undefined : keymap.get(key);
    let node;
    if (oldIndex === undefined) {
      node = itemToNode(item);
      if (key !== null) { nodeKeys.set(node, key); }
    } else {
      node = oldChildren[oldIndex];
      oldChildren[oldIndex] = null;
      keymap.delete(key);
      if (tagNeedsRebuild(item, node)) {
        node = rebuildNode(parent, node, item, key);
      }
    }
    parent.insertBefore(node, insertRef);
    insertRef = node;
  }

  // Remove any old middle nodes that no new item claimed.
  for (let i = oldStart; i <= oldEnd; i++) {
    const node = oldChildren[i];
    if (node !== null) {
      node.remove();
      stopRemoved(node);
    }
  }
}
