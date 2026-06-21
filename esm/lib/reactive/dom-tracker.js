import { notifyDomTrack, notifyDomUntrack } from './devtools.js';

// Single per-element record. Any subset of { stop, connect, persist } may be present.
// An entry survives stop or connect cleanup if its other half is still in use (persist=true).
// Entries are held in a WeakMap so an element created with toElement() but never inserted
// (and then dropped by the caller) does not stay pinned by this module.
const entries = new WeakMap();
const contentTracked = new WeakSet();
// `hasAnyTracked` gates the MutationObserver callback's per-record work. It's a one-shot
// latch: once anything has ever been tracked, the observer always runs. We don't try to
// decrement it on cleanup because the only saving would be when an app temporarily reaches
// zero tracked elements, which is rare in practice; in exchange we skip a
// FinalizationRegistry.register call per tracked element (measurable in benchmarks that
// create tens of thousands of reactive elements).
let hasAnyTracked = false;
let observer = null;
// Bitmask for TreeWalker: elements (NodeFilter.SHOW_ELEMENT = 0x1) + comments
// (NodeFilter.SHOW_COMMENT = 0x80). LiteralTag and CommentTag track their anchor comments.
// Text nodes are never tracked, so skip them.
const SHOW_ELEMENT_AND_COMMENT = 129;

function getOrCreate(element) {
  let entry = entries.get(element);
  if (entry === undefined) {
    entry = {};
    entries.set(element, entry);
    hasAnyTracked = true;
    notifyDomTrack();
  }
  return entry;
}

function deleteEntry(element, entry) {
  entries.delete(element);
  notifyDomUntrack(entry.bindingDevIds);
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

// Stops the effect registered on `element` if there is one. Shared by every code path
// that drops tracked elements out of the DOM (single removal, range removal, MO observer).
function stopOne(element, entry) {
  if (entry.stop === undefined) { return; }
  const stop = entry.stop;
  clearStop(entry, element);
  stop();
}

// Walks the subtree rooted at `node` (including `node` itself) and invokes `fn(el, entry)`
// for every tracked element or comment found. When `node` itself is tracked, descendant
// non-element nodes are skipped so that the comment-anchor entries owned by LiteralTag and
// CommentTag are not collateral damage of a persist parent's pause-on-removal cycle.
function visit(node, fn) {
  const own = entries.get(node);
  if (own !== undefined) { fn(node, own); }
  if (node.nodeType !== 1) { return; }
  const skipComments = own !== undefined;
  const walker = document.createTreeWalker(node, SHOW_ELEMENT_AND_COMMENT);
  for (let el = walker.nextNode(); el !== null; el = walker.nextNode()) {
    if (skipComments && el.nodeType !== 1) { continue; }
    const entry = entries.get(el);
    if (entry !== undefined) { fn(el, entry); }
  }
}

export function stopRemoved(node) {
  visit(node, stopOne);
}

// Stop tracked effects across an entire sibling range in a single TreeWalker pass. The
// reconciler's clear path uses this instead of calling stopRemoved() per child: building
// one walker is cheaper than 1000 walkers, and the walk itself is over the same elements
// either way. The range is half-open. firstNode is included, endAnchor is excluded.
export function stopRangeBetween(firstNode, endAnchor) {
  if (firstNode === null || firstNode === endAnchor) { return; }
  if (!hasAnyTracked) { return; }
  const parent = firstNode.parentNode;
  if (parent === null) { return; }
  const walker = document.createTreeWalker(parent, SHOW_ELEMENT_AND_COMMENT);
  walker.currentNode = firstNode;
  for (let node = firstNode; node !== null && node !== endAnchor; node = walker.nextNode()) {
    const entry = entries.get(node);
    if (entry !== undefined) { stopOne(node, entry); }
  }
}

function fireConnected(node) {
  visit(node, (_, entry) => {
    if (entry.connect !== undefined) { entry.connect(); }
  });
}

function buildObserver() {
  if (observer !== null) { return; }
  observer = new MutationObserver(records => {
    if (!hasAnyTracked) { return; }
    for (const record of records) {
      for (const node of record.removedNodes) {
        if (!node.isConnected) { stopRemoved(node); }
      }
      for (const node of record.addedNodes) {
        fireConnected(node);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export function trackForStop(element, stop, devIds = []) {
  buildObserver();
  const entry = getOrCreate(element);
  entry.stop = stop;
  if (devIds.length > 0) { entry.bindingDevIds = devIds; }
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
  if (entry !== undefined) { stopOne(element, entry); }
}
