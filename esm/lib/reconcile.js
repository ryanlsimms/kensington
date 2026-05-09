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

function syncNode(existing, fresh) {
  if (existing.nodeType !== fresh.nodeType || existing.nodeName !== fresh.nodeName) {
    return fresh;
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
  for (const attr of oldAttrNames) {
    existing.removeAttribute(attr);
  }
  existing.replaceChildren(...[...fresh.childNodes]);
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
      targetNode = syncNode(old, itemToNode(item));
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
