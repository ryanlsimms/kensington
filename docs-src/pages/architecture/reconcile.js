import { t } from 'kensington';

import { callout, code } from '../../components/ui.js';
import { loc } from './helpers.js';

export function architectureReconcile() {
  return t.section({ id: 'reconcile' }, [
    t.h2('Reconciliation'),
    t.p({ class: 'file-crumb' }, [
      'esm',
      t.span({ class: 'slash' }, '/'),
      'lib',
      t.span({ class: 'slash' }, '/'),
      'reactive',
      t.span({ class: 'slash' }, '/'),
      loc('esm/lib/reactive/reconcile.js'),
    ]),
    t.p([
      'Every signal-content update calls ',
      t.code('reconcile'),
      ' at ',
      loc('esm/lib/reactive/reconcile.js'),
      '. The function reorders, inserts, removes, and rebuilds DOM nodes between a pair of comment anchors set up at element construction. Non-arrays are wrapped as ',
      t.code('[val]'),
      ' before passing in, so the algorithm only handles the array case.',
    ]),
    t.p([
      'The algorithm is Vue 2 / Inferno style bidirectional reconciliation. Four cheap cases handle the common shapes (no change, prefix match, suffix match, swap, head-to-tail move) with at most one DOM mutation each. Anything that falls through hits a keymap walk from right to left for the mixed middle.',
    ]),
    t.p([
      'The incoming array is normalized first. ',
      t.code('flattenIfNeeded(items)'),
      ' only allocates a flat buffer when the input actually contains a nested array. The common already-flat case returns the input unchanged. ',
      t.code('filterRenderable(items)'),
      ' strips non-renderable items (',
      t.code('null'),
      ', ',
      t.code('undefined'),
      ', ',
      t.code('false'),
      ', ',
      t.code('true'),
      ', and empty string, the same set ',
      t.code('isRenderableItem'),
      ' rejects) so the bidirectional pass can index by position. The hot path returns the input array directly with no allocation. ',
      t.code('itemToNode(item)'),
      ' calls ',
      t.code('item.getDomElement?.() ?? item.toElement()'),
      ' so a per-key cached tag returns its already-built node.',
    ]),
    callout('note', "What's gone",
      t.p([
        'The previous design used a single forward cursor, a snapshot ',
        t.code('WeakMap'),
        ' fast path that compared attribute and content shapes via ',
        t.code('valueEqual'),
        ', a ',
        t.code('signalRefMismatch'),
        ' replacement path, a ',
        t.code('syncNode'),
        ' helper that patched matched nodes in place, and an orphan-removal pre-pass over a ',
        t.code('Map'),
        ' of old keys. All of that has been removed. Live updates flow through ',
        t.code('_bindingEffect'),
        ' subscriptions on cached tag instances, never through per-render attribute diffs.',
      ]),
    ),

    t.section({ id: 'reconcile-keyed' }, [
      t.h3('Keys and node lookup'),
      t.p([
        'Keys live on the tag instance, not on the rendered element. ',
        t.code('signal.mapWithKey(keyOrProp, mapFn)'),
        ' stamps each tag returned from ',
        t.code('mapFn'),
        ' with a Kensington-internal property (',
        t.code('KENSINGTON_KEY'),
        ' equals ',
        t.code("'_kensingtonKey'"),
        '). The reconciler reads that property via ',
        t.code('itemKey(item)'),
        ' and pairs each key with its live DOM node through the ',
        t.code('nodeKeys'),
        ' ',
        t.code('WeakMap'),
        ', populated when a fresh node is inserted. The rendered HTML stays free of internal bookkeeping attributes.',
      ]),
      code('javascript', `function itemKey(item) {
  if (item === null || typeof item !== 'object') { return null; }
  const key = item[KENSINGTON_KEY];
  if (key !== undefined) { return key; }
  // Stable tag instances passed directly (without mapWithKey) get the tag itself
  // as an implicit key. The reconciler can then recognize the same tag across
  // renders without requiring the user to thread an explicit key through.
  if (item._isKensingtonTag === true) { return item; }
  return null;
}`),
      t.p([
        'Stable tag instances passed directly (not via ',
        t.code('mapWithKey'),
        ') get the tag instance itself as an implicit key, so reusing the same ',
        t.code('t.div(...)'),
        ' reference across renders is enough to keep its DOM node. Items that are neither a stamped tag nor a Kensington tag (plain strings, numbers, plain objects) are unkeyed and always build a fresh DOM node.',
      ]),
    ]),

    t.section({ id: 'reconcile-clear' }, [
      t.h3('Clear fast path'),
      t.p([
        'Before the main loop, an empty ',
        t.code('newItems'),
        ' takes a dedicated fast path. A single ',
        t.code('stopRangeBetween(firstChild, endAnchor)'),
        ' walks every tracked descendant in one ',
        t.code('TreeWalker'),
        ' pass and stops its effects. Then ',
        t.code('Range.deleteContents()'),
        ' removes the DOM in one operation.',
      ]),
      code('javascript', `if (items.length === 0 && startAnchor.nextSibling !== endAnchor) {
  stopRangeBetween(startAnchor.nextSibling, endAnchor);
  const range = document.createRange();
  range.setStartAfter(startAnchor);
  range.setEndBefore(endAnchor);
  range.deleteContents();
  return;
}`),
      callout('key', 'Why a special clear path',
        t.p([
          'Calling ',
          t.code('.remove()'),
          ' on each of 1000 children produces 1000 individual DOM mutations, each going through its own MutationObserver record. A single Range deletion and one TreeWalker for the effect teardown collapses the work into one DOM operation and one walk.',
        ]),
      ),
    ]),

    t.section({ id: 'reconcile-bidirectional' }, [
      t.h3('Bidirectional matching'),
      t.p([
        'After the clear shortcut, the reconciler snapshots the current children into an ',
        t.code('oldChildren'),
        ' array and runs four pointer indices: ',
        t.code('oldStart'),
        ', ',
        t.code('oldEnd'),
        ', ',
        t.code('newStart'),
        ', and ',
        t.code('newEnd'),
        '. On every iteration of the outer loop, it tries four cheap matches in order and falls through to the keymap path only if none apply.',
      ]),
      code('javascript', `while (oldStart <= oldEnd && newStart <= newEnd) {
  const oldStartNode = oldChildren[oldStart];
  const oldEndNode = oldChildren[oldEnd];
  const oldStartKey = nodeKeys.get(oldStartNode);
  const oldEndKey = nodeKeys.get(oldEndNode);
  const newStartKey = itemKey(items[newStart]);
  const newEndKey = itemKey(items[newEnd]);

  if (oldStartKey === newStartKey && oldStartKey !== undefined) {
    // Prefix match. No DOM op (or one rebuild if the tag is stale).
    oldStart++; newStart++;
  } else if (oldEndKey === newEndKey && oldEndKey !== undefined) {
    // Suffix match. No DOM op.
    oldEnd--; newEnd--;
  } else if (oldStartKey === newEndKey && oldStartKey !== undefined) {
    // Head moved to tail. One insertBefore.
    parent.insertBefore(node, oldEndNode.nextSibling);
    oldStart++; newEnd--;
  } else if (oldEndKey === newStartKey && oldEndKey !== undefined) {
    // Tail moved to head. One insertBefore. The js-framework-benchmark swap test lives here.
    parent.insertBefore(node, oldStartNode);
    oldEnd--; newStart++;
  } else {
    break; // Fall through to the keymap path.
  }
}`),
      t.ol({ class: 'numbered' }, [
        t.li([
          t.strong('Prefix match.'),
          ' Old and new agree at the head. Advance both ',
          t.code('Start'),
          ' indices. No DOM mutation.',
        ]),
        t.li([
          t.strong('Suffix match.'),
          ' Old and new agree at the tail. Retreat both ',
          t.code('End'),
          ' indices. No DOM mutation.',
        ]),
        t.li([
          t.strong('Head to tail.'),
          ' The head of the old list now lives at the tail of the new list. One ',
          t.code('insertBefore'),
          ' moves it. ',
          t.code('oldStart++'),
          ', ',
          t.code('newEnd--'),
          '.',
        ]),
        t.li([
          t.strong('Tail to head.'),
          ' The tail of the old list now lives at the head of the new list. One ',
          t.code('insertBefore'),
          ' moves it. ',
          t.code('oldEnd--'),
          ', ',
          t.code('newStart++'),
          '. This is the path the js-framework-benchmark swap row test exercises.',
        ]),
      ]),
      callout('key', 'The swap-1000 case',
        t.p([
          'Swap rows 1 and 998 in a 1000-row list. The prefix match advances through rows 0 to 0. Row 1 doesn\'t match at the head, the tail (row 999) doesn\'t match either, but the head-to-tail and tail-to-head pointers do: the old row 1 lives at new position 998, and the old row 998 lives at new position 1. Two ',
          t.code('insertBefore'),
          ' calls move them. The remaining 997 rows in the middle and 1 row at each end are all prefix/suffix matches with no DOM mutation. Total cost is two DOM operations instead of the ~997 that a single-cursor algorithm would issue.',
        ]),
      ),
    ]),

    t.section({ id: 'reconcile-rebuild' }, [
      t.h3('Rebuild on stale tag'),
      t.p([
        'A keyed match resolves to either the same cached tag (DOM reused as-is) or a fresh tag instance for that key. The fresh case happens when ',
        t.code('mapWithKey'),
        '\'s per-key inner computed re-ran because ',
        t.code('mapFn'),
        ' touched a signal that changed. ',
        t.code('tagNeedsRebuild(item, node)'),
        ' detects it by asking the tag for the DOM it currently backs.',
      ]),
      code('javascript', `function tagNeedsRebuild(item, node) {
  if (item === null || typeof item !== 'object') { return false; }
  if (item._isKensingtonTag !== true) { return false; }
  if (typeof item.getDomElement !== 'function') { return false; }
  const cached = item.getDomElement();
  return cached !== node && cached !== item;
}`),
      t.p([
        'When the tag is stale, ',
        t.code('rebuildNode'),
        ' captures user-visible state from the old node via ',
        loc('esm/lib/reactive/preserve-state.js'),
        ' (',
        t.code('captureState'),
        '), builds the fresh DOM via ',
        t.code('item.toElement()'),
        ', inserts the fresh node before the old, removes the old node (which triggers ',
        t.code('dom-tracker'),
        ' to stop the old effects), and restores state onto the fresh subtree.',
      ]),
      t.p([
        'Focus and selection, ',
        t.code('scrollTop'),
        ' and ',
        t.code('scrollLeft'),
        ', ',
        t.code('input.value'),
        ', ',
        t.code('checked'),
        ', ',
        t.code('indeterminate'),
        ', ',
        t.code('<select>'),
        ' value, and ',
        t.code('<details>'),
        ' / ',
        t.code('<dialog>'),
        ' open all survive the swap. This path is only walked for keys whose ',
        t.code('mapFn'),
        ' re-ran, which is either because the outer array delivered a new object with actually-changed fields (shallow-diff gate in ',
        t.code('mapWithKey'),
        ') or because ',
        t.code('mapFn'),
        ' subscribed to another signal that fired.',
      ]),
    ]),

    t.section({ id: 'reconcile-loop' }, [
      t.h3('Main loop and slow path'),
      t.p([
        'When the bidirectional loop ends, three tails remain to handle. The trailing fence (the first ',
        t.code('oldChildren'),
        ' node after ',
        t.code('oldEnd'),
        ', or ',
        t.code('endAnchor'),
        ' if none survived) is the ',
        t.code('insertBefore'),
        ' reference for new inserts.',
      ]),
      t.ol({ class: 'numbered' }, [
        t.li([
          t.strong('Pure insert tail. '),
          'If ',
          t.code('oldStart > oldEnd'),
          ', every remaining new item is appended before the trailing fence with one ',
          t.code('insertBefore'),
          ' each. Used when a list grows.',
        ]),
        t.li([
          t.strong('Pure remove tail. '),
          'If ',
          t.code('newStart > newEnd'),
          ', every remaining old child is removed with ',
          t.code('.remove()'),
          ' plus ',
          t.code('stopRemoved'),
          ' to stop its tracked effects. Used when a list shrinks.',
        ]),
        t.li([
          t.strong('Mixed middle. '),
          'Otherwise, build a keymap over the remaining ',
          t.code('oldChildren'),
          ' range and walk the new range from right to left, so the ',
          t.code('insertBefore'),
          ' reference is always the previous iteration\'s node. Matched keys reuse their old DOM (or rebuild via ',
          t.code('rebuildNode'),
          ' if the tag is stale), unmatched keys build fresh DOM via ',
          t.code('itemToNode'),
          '. Old nodes that no new item claimed are removed at the end of the loop.',
        ]),
      ]),
      callout('key', 'No in-place patching',
        t.p([
          'A matched key resolves to either the same cached tag (DOM reused as-is) or a freshly built node from ',
          t.code('rebuildNode'),
          '. The reconciler never patches existing nodes in place. Reactive attributes, content, props, and styles travel through ',
          t.code('_bindingEffect'),
          ' subscriptions on the cached tag, so live updates happen via those bindings rather than via per-render diffs.',
        ]),
      ),
    ]),
  ]);
}
