const tracked = new Map();
const contentTracked = new WeakSet();
let observer = null;

function stopRemoved(node) {
  const stop = tracked.get(node);
  if (stop !== undefined) {
    stop();
    tracked.delete(node);
    return;
  }
  if (node.nodeType !== 1) { return; }
  for (const [el, elStop] of [...tracked]) {
    if (node.contains(el)) {
      elStop();
      tracked.delete(el);
    }
  }
}

function buildOberver() {
  if (observer !== null) { return; }
  observer = new MutationObserver(records => {
    if (tracked.size === 0) { return; }
    for (const record of records) {
      for (const node of record.removedNodes) {
        stopRemoved(node);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export function trackForStop(element, stop) {
  buildOberver();
  tracked.set(element, stop);
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
  }
}
