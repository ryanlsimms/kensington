// Tracks event listeners added by toElement() so syncNode can remove stale handlers
// and wire fresh ones when keyed list items are reconciled.
const listenerMap = new WeakMap();

export function recordListeners(element, listeners) {
  listenerMap.set(element, listeners);
}

// Called by syncNode when it reuses an existing keyed node. Removes handlers that are
// no longer present or have changed, adds the new ones, and updates the record for
// the existing element. The fresh element's record is cleared — it is discarded.
export function transferListeners(existing, fresh) {
  const oldMap = listenerMap.get(existing);
  const newMap = listenerMap.get(fresh);
  if (oldMap === undefined && newMap === undefined) { return; }
  if (newMap !== undefined) {
    for (const [type, newFn] of newMap) {
      const oldFn = oldMap === undefined ? undefined : oldMap.get(type);
      if (oldFn !== newFn) {
        if (oldFn !== undefined) { existing.removeEventListener(type, oldFn); }
        existing.addEventListener(type, newFn);
      }
    }
  }
  if (oldMap !== undefined) {
    for (const type of oldMap.keys()) {
      if (newMap === undefined || !newMap.has(type)) {
        existing.removeEventListener(type, oldMap.get(type));
      }
    }
  }
  if (newMap === undefined) {
    listenerMap.delete(existing);
  } else {
    listenerMap.set(existing, newMap);
    listenerMap.delete(fresh);
  }
}
