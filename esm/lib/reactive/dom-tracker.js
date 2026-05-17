// Single per-element record. Any subset of { stop, connect, persist } may be present.
// An entry survives stop or connect cleanup if its other half is still in use (persist=true).
const entries = new Map();
const contentTracked = new WeakSet();
let observer = null;

function getOrCreate(element) {
  let entry = entries.get(element);
  if (entry === undefined) {
    entry = {};
    entries.set(element, entry);
  }
  return entry;
}

function clearStop(entry, element) {
  delete entry.stop;
  if (!entry.persist) {
    delete entry.connect;
    delete entry.persist;
  }
  if (entry.connect === undefined && entry.stop === undefined) {
    entries.delete(element);
  }
}

function visit(node, fn) {
  if (entries.has(node)) {
    fn(node, entries.get(node));
    return;
  }
  if (node.nodeType !== 1) { return; }
  for (const [el, entry] of [...entries]) {
    if (node.contains(el)) { fn(el, entry); }
  }
}

function stopRemoved(node) {
  visit(node, (el, entry) => {
    if (entry.stop === undefined) { return; }
    const stop = entry.stop;
    clearStop(entry, el);
    stop();
  });
}

function fireConnected(node) {
  visit(node, (_, entry) => {
    if (entry.connect !== undefined) { entry.connect(); }
  });
}

function buildObserver() {
  if (observer !== null) { return; }
  observer = new MutationObserver(records => {
    if (entries.size === 0) { return; }
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
  buildObserver();
  getOrCreate(element).stop = stop;
}

export function trackForConnect(element, fn, persist = false) {
  buildObserver();
  const entry = getOrCreate(element);
  entry.connect = fn;
  entry.persist = persist;
}

export function addOnStop(element, fn) {
  const entry = entries.get(element);
  if (entry === undefined || entry.stop === undefined) { return; }
  const existing = entry.stop;
  entry.stop = () => { existing(); fn(); };
}

export function markContentTracked(element) {
  contentTracked.add(element);
}

export function isTracked(element) {
  return entries.get(element)?.stop !== undefined;
}

export function isContentTracked(element) {
  return contentTracked.has(element);
}

export function stopTracked(element) {
  const entry = entries.get(element);
  if (entry === undefined || entry.stop === undefined) { return; }
  const stop = entry.stop;
  clearStop(entry, element);
  stop();
}
