const tracked = new Map();
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
