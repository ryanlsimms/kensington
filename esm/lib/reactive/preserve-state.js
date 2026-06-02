// State preservation for keyed-list reconciliation. When the reconciler discovers that a
// keyed node's signal references have changed (a fresh signal instance, e.g. an unkeyed
// signal() created inside a computed), it must build a new DOM element so the new signal
// can drive it. Patching the existing node in place would leave its effects subscribed to
// the old signal, breaking interactivity.
//
// To make the swap less disruptive we capture user-visible DOM state from the old node
// just before removal and re-apply it to the new node after insertion. The mapping
// between old and new is positional (child-index path from the root), which assumes the
// tree shape is identical between renders. That assumption holds in the typical case
// (only the signal reference differs) and degrades gracefully otherwise (state for
// missing positions is silently dropped).
//
// What is preserved:
//   - document.activeElement focus and, where applicable, text selection range.
//   - scrollTop/scrollLeft on the root and every scrollable descendant.
//   - INPUT/TEXTAREA value, checked, indeterminate.
//   - SELECT value (selectedIndex follows).
//   - DETAILS and DIALOG open state.
//
// What cannot be preserved (intrinsic to the original element):
//   - IME composition in progress.
//   - CSS transitions and animations.
//   - Pointer capture and active drag operations.
//   - Canvas bitmap contents.
//   - Iframe document state.
//   - Web component instance state.
//   - Third-party event listeners attached outside Kensington.

function walk(node, fn, path) {
  fn(node, path);
  const children = node.childNodes;
  for (let i = 0; i < children.length; i++) {
    walk(children[i], fn, path === null ? [i] : [...path, i]);
  }
}

function resolvePath(root, path) {
  let node = root;
  for (const index of path) {
    if (node === null || node.childNodes === undefined || index >= node.childNodes.length) {
      return null;
    }
    node = node.childNodes[index];
  }
  return node;
}

function pathTo(root, target) {
  if (root === target) { return []; }
  const path = [];
  let node = target;
  while (node !== null && node !== root) {
    const parent = node.parentNode;
    if (parent === null) { return null; }
    const index = Array.prototype.indexOf.call(parent.childNodes, node);
    if (index === -1) { return null; }
    path.push(index);
    node = parent;
  }
  if (node !== root) { return null; }
  return path.reverse();
}

export function captureState(root) {
  const state = { focus: null, scrolls: [], inputs: [], openables: [] };

  if (typeof document !== 'undefined') {
    const active = document.activeElement;
    if (active !== null && active !== document.body && root.contains(active)) {
      const path = pathTo(root, active);
      if (path !== null) {
        state.focus = { path };
        if (typeof active.selectionStart === 'number') {
          state.focus.selectionStart = active.selectionStart;
          state.focus.selectionEnd = active.selectionEnd;
          state.focus.selectionDirection = active.selectionDirection;
        }
      }
    }
  }

  walk(root, (node, path) => {
    if (node.nodeType !== 1) { return; }
    if (node.scrollTop !== 0 || node.scrollLeft !== 0) {
      state.scrolls.push({ path, top: node.scrollTop, left: node.scrollLeft });
    }
    const tag = node.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      const entry = { path, value: node.value };
      if (typeof node.checked === 'boolean') { entry.checked = node.checked; }
      if (typeof node.indeterminate === 'boolean') { entry.indeterminate = node.indeterminate; }
      state.inputs.push(entry);
    } else if (tag === 'SELECT') {
      state.inputs.push({ path, value: node.value });
    } else if (tag === 'DETAILS' || tag === 'DIALOG') {
      state.openables.push({ path, open: node.open });
    }
  }, null);

  return state;
}

export function restoreState(root, state) {
  for (const entry of state.scrolls) {
    const node = resolvePath(root, entry.path);
    if (node === null) { continue; }
    node.scrollTop = entry.top;
    node.scrollLeft = entry.left;
  }
  for (const entry of state.inputs) {
    const node = resolvePath(root, entry.path);
    if (node === null) { continue; }
    const tag = node.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (node.type !== 'checkbox' && node.type !== 'radio') {
        node.value = entry.value;
      }
      if (entry.checked !== undefined) { node.checked = entry.checked; }
      if (entry.indeterminate !== undefined) { node.indeterminate = entry.indeterminate; }
    } else if (tag === 'SELECT') {
      node.value = entry.value;
    }
  }
  for (const entry of state.openables) {
    const node = resolvePath(root, entry.path);
    if (node === null) { continue; }
    node.open = entry.open;
  }
  if (state.focus !== null) {
    const node = resolvePath(root, state.focus.path);
    if (node !== null && typeof node.focus === 'function') {
      try {
        node.focus();
      } catch {
        // focus() can throw on detached or non-focusable elements in some browsers.
      }
      if (state.focus.selectionStart !== undefined && typeof node.setSelectionRange === 'function') {
        try {
          node.setSelectionRange(
            state.focus.selectionStart,
            state.focus.selectionEnd,
            state.focus.selectionDirection,
          );
        } catch {
          // setSelectionRange throws for input types that don't support selection.
        }
      }
    }
  }
}
