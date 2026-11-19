import { stopRemoved } from './dom-tracker.js';
import { getSharedReactiveState } from './shared-state.js';

// Render state is only recorded for descendants of mapWithKey rows.
export const keyedElements = getSharedReactiveState('keyed-elements', () => new WeakMap());

export function moveBefore(parent, node, before) {
  if (node === before || node.nextSibling === before) { return; }
  if (typeof parent.moveBefore === 'function') {
    parent.moveBefore(node, before);
    return;
  }

  const active = node.getRootNode().activeElement;
  if (!active || !node.contains(active)) {
    parent.insertBefore(node, before);
    return;
  }
  // Keep the focused row connected and move the crossed siblings around it.
  if (before === null || node.compareDocumentPosition(before) === 4) { // DOCUMENT_POSITION_FOLLOWING
    while (node.nextSibling !== before) { parent.insertBefore(node.nextSibling, node); }
  } else {
    const after = node.nextSibling;
    while (before !== node) {
      const next = before.nextSibling;
      parent.insertBefore(before, after);
      before = next;
    }
  }
}

export function hasExpectedChildren(parent, slots) {
  let cursor = parent.firstChild;
  for (const { first, last } of slots) {
    if (!first || cursor !== first || last.parentNode !== parent) { return false; }
    cursor = last.nextSibling;
  }
  return cursor === null;
}

export function removeSlot({ first, last }) {
  const removed = [];
  const after = last.nextSibling;
  for (let node = first; node && node !== after; node = node.nextSibling) {
    removed.push(node);
  }
  for (const node of removed) { node.remove(); }
  for (const node of removed) { stopRemoved(node); }
}

// Match compatible slots from both ends before replacing the remaining middle.
// A slot can be a single node or a range, such as a signal's anchored children.
export function updateKeyedChildren(items, slots, compatible, render) {
  const result = new Array(items.length);
  let start = 0;
  let oldEnd = slots.length;
  let newEnd = items.length;
  let before = null;
  while (start < oldEnd && start < newEnd && compatible(slots[start].item, items[start])) {
    result[start] = render(items[start], slots[start], slots[start].first);
    start++;
  }
  while (start < oldEnd && start < newEnd && compatible(slots[oldEnd - 1].item, items[newEnd - 1])) {
    const old = slots[--oldEnd];
    const updated = render(items[--newEnd], old, old.first);
    result[newEnd] = updated;
    before = updated.first ?? before;
  }
  for (let index = start; index < newEnd || index < oldEnd; index++) {
    const old = index < oldEnd ? slots[index] : null;
    if (index < newEnd) {
      result[index] = render(items[index], old, old?.first ?? before);
    } else {
      removeSlot(old);
    }
  }
  return result;
}
