import { keyedElements } from './keyed-dom.js';

// State preservation for keyed elements that cannot be updated in place.
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
  for (const index of path ?? []) {
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
        state.focus = { path, tag: active.tagName };
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
      const entry = { path, tag, type: node.type, value: node.value, props: keyedElements.get(node)?.props };
      if (typeof node.checked === 'boolean') { entry.checked = node.checked; }
      if (typeof node.indeterminate === 'boolean') { entry.indeterminate = node.indeterminate; }
      state.inputs.push(entry);
    } else if (tag === 'SELECT') {
      state.inputs.push({ path, tag, type: node.type, value: node.value, props: keyedElements.get(node)?.props });
    } else if (tag === 'DETAILS' || tag === 'DIALOG') {
      state.openables.push({ path, tag, open: node.open, props: keyedElements.get(node)?.props });
    }
  }, null);

  return state;
}

function shouldRestore(node, entry, property) {
  const props = keyedElements.get(node)?.props;
  return !props?.has(property)
    || (entry.props?.has(property) && Object.is(entry.props.get(property), props.get(property)));
}

export function restoreFormState(root, state) {
  for (const entry of state.inputs) {
    const node = resolvePath(root, entry.path);
    const { tag, type } = entry;
    if (node?.tagName !== tag || node.type !== type) { continue; }
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (type !== 'checkbox' && type !== 'radio' && type !== 'file' && shouldRestore(node, entry, 'value')) {
        node.value = entry.value;
      }
      if (entry.checked !== undefined && shouldRestore(node, entry, 'checked')) { node.checked = entry.checked; }
      if (entry.indeterminate !== undefined && shouldRestore(node, entry, 'indeterminate')) {
        node.indeterminate = entry.indeterminate;
      }
    } else if (tag === 'SELECT' && shouldRestore(node, entry, 'value') && shouldRestore(node, entry, 'selectedIndex')) {
      node.value = entry.value;
    }
  }
  for (const entry of state.openables) {
    const node = resolvePath(root, entry.path);
    if (node?.tagName !== entry.tag || !shouldRestore(node, entry, 'open')) { continue; }
    node.open = entry.open;
  }
}

export function restoreViewState(root, state) {
  if (state.focus !== null) {
    const node = resolvePath(root, state.focus.path);
    if (node?.tagName === state.focus.tag && typeof node.focus === 'function') {
      try {
        node.focus({ preventScroll: true });
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
  for (const entry of state.scrolls) {
    const node = resolvePath(root, entry.path);
    if (node === null) { continue; }
    node.scrollTop = entry.top;
    node.scrollLeft = entry.left;
  }
}

export function restoreState(root, state) {
  restoreFormState(root, state);
  restoreViewState(root, state);
}
