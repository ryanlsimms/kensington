const tracked = new Map();
const connectCallbacks = new Map();
const contentTracked = new WeakSet();
let observer = null;

function stopRemoved(node) {
  const stop = tracked.get(node);
  if (stop !== undefined) {
    tracked.delete(node);
    if (!connectCallbacks.get(node)?.persist) { connectCallbacks.delete(node); }
    stop();
    return;
  }
  if (node.nodeType !== 1) { return; }
  for (const [el, elStop] of [...tracked]) {
    if (node.contains(el)) {
      tracked.delete(el);
      if (!connectCallbacks.get(el)?.persist) { connectCallbacks.delete(el); }
      elStop();
    }
  }
}

function fireConnected(node) {
  const entry = connectCallbacks.get(node);
  if (entry !== undefined) {
    entry.fn();
    return;
  }
  if (node.nodeType !== 1) { return; }
  for (const [el, { fn }] of connectCallbacks) {
    if (node.contains(el)) {
      fn();
    }
  }
}

function buildOberver() {
  if (observer !== null) { return; }
  observer = new MutationObserver(records => {
    if (tracked.size === 0 && connectCallbacks.size === 0) { return; }
    for (const record of records) {
      for (const node of record.removedNodes) {
        stopRemoved(node);
      }
      for (const node of record.addedNodes) {
        fireConnected(node);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export function trackForStop(element, stop) {
  buildOberver();
  tracked.set(element, stop);
}

export function trackForConnect(element, fn, persist = false) {
  buildOberver();
  connectCallbacks.set(element, { fn, persist });
}

export function addOnStop(element, fn) {
  const existing = tracked.get(element);
  if (existing === undefined) { return; }
  tracked.set(element, () => { existing(); fn(); });
}

export function markContentTracked(element) {
  contentTracked.add(element);
}

export function isTracked(element) {
  return tracked.has(element);
}

export function isContentTracked(element) {
  return contentTracked.has(element);
}

export function stopTracked(element) {
  const stop = tracked.get(element);
  if (stop !== undefined) {
    stop();
    tracked.delete(element);
    if (!connectCallbacks.get(element)?.persist) { connectCallbacks.delete(element); }
  }
}
