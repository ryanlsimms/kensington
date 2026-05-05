function itemKey(item) {
  const attrs = item?.attributes;
  const key = attrs?.dataKey ?? attrs?.['data-key'];
  return key === undefined ? null : String(key);
}

function itemToNode(item) {
  if (item !== null && item !== undefined && typeof item.toElement === 'function') {
    return item.toElement();
  }
  if (item === null || item === undefined || item === false) {
    return document.createTextNode('');
  }
  return document.createTextNode(String(item));
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
    if (item === null || item === undefined) { continue; }
    const key = itemKey(item);
    let targetNode;
    if (key !== null && oldNodes.has(key)) {
      targetNode = oldNodes.get(key);
      oldNodes.delete(key);
    } else {
      targetNode = itemToNode(item);
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
