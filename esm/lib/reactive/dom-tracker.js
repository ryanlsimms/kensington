// Single per-element record. Any subset of { stop, connect, persist } may be present.
// An entry survives stop or connect cleanup if its other half is still in use (persist=true).
// Entries are held in a WeakMap so an element created with toElement() but never inserted
// (and then dropped by the caller) does not stay pinned by this module. The parallel
// trackedRefs Set holds WeakRefs for the iteration in visit(); the FinalizationRegistry
// prunes WeakRefs whose elements have been collected so size-based short-circuits stay
// approximately correct.
const entries = new WeakMap();
const trackedRefs = new Set();
const trackedCleanup = new FinalizationRegistry(ref => trackedRefs.delete(ref));
const contentTracked = new WeakSet();
let observer = null;

function getOrCreate(element) {
  let entry = entries.get(element);
  if (entry === undefined) {
    const ref = new WeakRef(element);
    entry = { ref };
    entries.set(element, entry);
    trackedRefs.add(ref);
    trackedCleanup.register(element, ref);
  }
  return entry;
}

function deleteEntry(element, entry) {
  trackedRefs.delete(entry.ref);
  entries.delete(element);
}

function clearStop(entry, element) {
  delete entry.stop;
  if (!entry.persist) {
    delete entry.connect;
    delete entry.persist;
  }
  if (entry.connect === undefined && entry.stop === undefined) {
    deleteEntry(element, entry);
  }
}

function visit(node, fn) {
  const own = entries.get(node);
  if (own !== undefined) {
    fn(node, own);
    return;
  }
  if (node.nodeType !== 1) { return; }
  for (const ref of [...trackedRefs]) {
    const el = ref.deref();
    if (el === undefined) {
      trackedRefs.delete(ref);
      continue;
    }
    if (node.contains(el)) {
      const entry = entries.get(el);
      if (entry !== undefined) { fn(el, entry); }
    }
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
    if (trackedRefs.size === 0) { return; }
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
