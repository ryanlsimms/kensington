import { callout, code } from '../../components/ui.js';
import { loc } from './helpers.js';

export function architectureReconcile(t) {
  return t.section({ id: 'reconcile' }, [
    t.h2('Reconciliation'),
    t.p({ class: 'file-crumb' }, [
      'esm', t.span({ class: 'slash' }, '/'),
      'lib', t.span({ class: 'slash' }, '/'),
      'reactive', t.span({ class: 'slash' }, '/'),
      loc(t, 'esm/lib/reactive/reconcile.js'),
    ]),
    t.p([
      'Every signal-content update calls ',
      t.code('reconcile'),
      ' at ',
      loc(t, 'esm/lib/reactive/reconcile.js'),
      '. The function patches the DOM in place rather than tearing it down and rebuilding. It handles both single-value and array-valued signals. Non-arrays are wrapped as ',
      t.code('[val]'),
      ' before passing in, so the algorithm only handles the array case.',
    ]),
    t.p([
      'Reconciliation runs between a pair of comment anchors set up at element construction. The anchors give the function stable boundaries: ',
      t.code('startAnchor.nextSibling'),
      ' is the first child to consider, ',
      t.code('endAnchor'),
      ' is the sentinel.',
    ]),

    t.section({ id: 'reconcile-keyed' }, [
      t.h3('Keyed matching'),
      t.p([
        'Each item can have a ',
        t.code('data-key'),
        ' attribute. Keyed items match against existing children with the same key, not the same positional index. This enables efficient reordering:',
      ]),
      code(t, 'javascript', `export function reconcile(parent, startAnchor, endAnchor, newItems) {
  const oldNodes = new Map();
  let node = startAnchor.nextSibling;
  while (node !== endAnchor) {
    const key = node.dataset?.key;
    if (key !== undefined) { oldNodes.set(key, node); }
    node = node.nextSibling;
  }
  // ...
}`),
      t.p('Without a key, items are matched positionally and recreated if the shape differs.'),
    ]),

    t.section({ id: 'reconcile-snapshot' }, [
      t.h3('Snapshot fast path'),
      t.p([
        'Once a keyed match is found, the reconciler checks a structural snapshot of the previous render. A WeakMap keyed by DOM node holds the last (attributes, content) pair that produced it. If the new tag\'s attributes and content are value-equal to the snapshot, the entire ',
        t.code('itemToNode(item)'),
        ' and ',
        t.code('syncNode'),
        ' chain is skipped. The existing DOM node is reused unchanged.',
      ]),
      code(t, 'javascript', `if (snapshotMatches(snapshots.get(old), item)) {
  targetNode = old;   // skip itemToNode() and syncNode(); reuse existing
} else {
  targetNode = syncNode(old, itemToNode(item));
  recordSnapshot(targetNode, item);
}`),
      t.p([
        t.code('valueEqual'),
        ' compares plain objects and arrays structurally, recurses into ContentTag instances (matching on tagName + attributes + content), and falls back to reference equality for everything else (functions, Signal, LiteralTag, CommentTag, DOM nodes, Date, class instances).',
      ]),
      callout(t, 'key', 'Why value equality, not reference equality',
        t.p([
          'The natural pattern ',
          t.code("arr.map(item => t.li({ class: item.cls }, item.label))"),
          ' allocates a fresh attribute object literal on every render. Reference equality on those literals would always miss. Value equality detects the structurally identical literal and skips the rebuild without requiring the developer to memoize.',
        ]),
      ),
      t.p([
        'A stable Signal reference hits the fast path via reference equality. A fresh closure or fresh LiteralTag on each render does not. The snapshot is recorded only on the non-fast-path branch, so an item that keeps hitting the fast path retains its original snapshot indefinitely.',
      ]),
      callout(t, 'note', 'Circular import',
        t.p([
          t.code('reconcile.js'),
          ' imports ContentTag for the ',
          t.code('instanceof'),
          ' check in ',
          t.code('valueEqual'),
          ', and ',
          t.code('content-tag.js'),
          ' imports reconcile for its signal-content effect. Both sides use the other inside function bodies at call time, not at module-load time, so ESM live bindings resolve correctly. Rollup emits a CIRCULAR_DEPENDENCY warning that is informational only.',
        ]),
      ),
    ]),

    t.section({ id: 'reconcile-sync' }, [
      t.h3('syncNode'),
      t.p([
        t.code('syncNode(existing, fresh)'),
        ' handles a matched pair. If the node types differ, the fresh node replaces the existing one. If they\'re both text nodes, only ',
        t.code('nodeValue'),
        ' is patched. If they\'re both elements, it applies fresh attributes and recursively syncs child pairs.',
      ]),
      t.h4('The guards'),
      callout(t, 'key', 'Why guards are needed',
        t.p([
          'The fresh node passed to syncNode is the result of calling ',
          t.code('itemToNode(item)'),
          ', which calls ',
          t.code('item.toElement()'),
          '. That fresh node is fully wired with its own signal effects pointing at the fresh element. Patching attributes or children naively would corrupt the live element\'s effects.',
        ]),
      ),
      code(t, 'javascript', `// Attribute guard
if (!isTracked(existing)) {
  for (const attr of oldAttrNames) {
    existing.removeAttribute(attr);
  }
}
// Content guard
if (!isContentTracked(existing)) {
  // positional sync of child nodes
}`),
      t.ul([
        t.li([
          t.strong('isTracked(existing).'),
          ' If true, the existing element has signal-managed attributes. Don\'t remove attributes that weren\'t on the fresh node. The signal effects haven\'t yet applied their initial values to the fresh element when reconcile inspects it.',
        ]),
        t.li([
          t.strong('isContentTracked(existing).'),
          ' If true, the existing element holds signal-content comment anchors. Don\'t patch its children at all. Replacing the anchors would break the live content effects whose closures still reference them.',
        ]),
      ]),
      t.p([
        'After patching, ',
        t.code('stopTracked(fresh)'),
        ' tears down the discarded fresh node\'s effects. This is called synchronously (not waiting for the MutationObserver) to close the window where a just-removed node could still respond to signal changes.',
      ]),
    ]),

    t.section({ id: 'reconcile-loop' }, [
      t.h3('Insertion, reuse, leftover cleanup'),
      t.p('The main reconcile loop walks newItems in order:'),
      t.ol({ class: 'numbered' }, [
        t.li([t.code('null'), ', ', t.code('undefined'), ', and ', t.code('false'), ' items are skipped.']),
        t.li('If the item has a key and matches an existing keyed node, call syncNode. The result is either the patched existing node or the fresh node if types diverged.'),
        t.li('If no match (or no key), build a new node via itemToNode.'),
        t.li([
          'If ',
          t.code('cursor === targetNode'),
          ', advance. The node is already in position. Otherwise call ',
          t.code('parent.insertBefore(targetNode, cursor)'),
          ' to slide it into place.',
        ]),
        t.li([
          'After the loop, every node between cursor and endAnchor is leftover. Remove them and call ',
          t.code('stopRemoved'),
          ' synchronously to stop their signal effects.',
        ]),
        t.li([
          'Every entry remaining in the oldNodes map is a keyed node whose key was not in newItems. Remove and stop them too.',
        ]),
      ]),
    ]),
  ]);
}
