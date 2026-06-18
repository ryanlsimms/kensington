import LiteralTag from '../../tag-classes/literal-tag.js';
import { captureState, restoreState } from '../reactive/preserve-state.js';
import {
  _disposeHydrationScope,
  _enterHydrationScope,
  _enterSSRMode,
  _exitHydrationScope,
  _exitSSRMode,
  _inHydrationScope,
  isSSRMode,
} from '../reactive/signal.js';

// Tracks every live hydrated component instance so hmrReplaceComponent can find them and
// swap them in place when the source module is hot-reloaded. Keyed by component name.
// Each entry is { mountId, mountNodes: Node[], fn, state }. mountNodes are the live DOM
// roots after hydration. A pre-flight isConnected check on swap drops detached entries.
const liveInstances = new Map();
// Registry of component name -> latest function. Populated by registerComponents and updated
// by hmrReplaceComponent. Used by the MutationObserver to hydrate newly inserted scripts.
const componentRegistry = new Map();

function recordInstance(name, instance) {
  let set = liveInstances.get(name);
  if (set === undefined) {
    set = new Set();
    liveInstances.set(name, set);
  }
  set.add(instance);
}

function dropInstance(name, instance) {
  const set = liveInstances.get(name);
  if (set !== undefined) {
    set.delete(instance);
  }
}

const NAME_UNSET = Symbol('unset');
const SCRIPT_CLOSE_RE = /<\/script>/gi;

const LOSSY_CHECKS = [
  [v => v instanceof Date, 'Date will round-trip as a string'],
  [v => v instanceof Map, 'Map will serialize as {}'],
  [v => v instanceof Set, 'Set will serialize as {}'],
  [v => v instanceof RegExp, 'RegExp will serialize as {}'],
];

function checkState(name, state) {
  const warnings = [];
  const errors = [];

  function walk(value, path, seen) {
    if (value === undefined) {
      warnings.push(`${path}: undefined will be dropped`);
      return;
    }
    if (typeof value === 'function') {
      warnings.push(`${path}: function will be dropped`);
      return;
    }
    if (typeof value === 'symbol') {
      warnings.push(`${path}: Symbol will be dropped`);
      return;
    }
    if (typeof value === 'bigint') {
      errors.push(`${path}: BigInt cannot be serialized`);
      return;
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      warnings.push(`${path}: ${value} will become null`);
      return;
    }
    for (const [check, msg] of LOSSY_CHECKS) {
      if (check(value)) {
        warnings.push(`${path}: ${msg}`);
        return;
      }
    }
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        errors.push(`${path}: circular reference`);
        return;
      }
      if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) {
        warnings.push(`${path}: ${value.constructor?.name ?? 'class instance'} will lose its methods — pass plain objects as state`);
        return;
      }
      seen.add(value);
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          walk(value[i], `${path}[${i}]`, seen);
        }
      } else {
        for (const key of Object.keys(value)) {
          walk(value[key], `${path}.${key}`, seen);
        }
      }
      seen.delete(value);
    }
  }

  walk(state, 'state', new Set());

  const byReason = new Map();
  for (const msg of warnings) {
    const sep = msg.indexOf(': ');
    const reason = sep === -1 ? msg : msg.slice(sep + 2);
    const path = sep === -1 ? '' : msg.slice(0, sep);
    if (!byReason.has(reason)) {
      byReason.set(reason, []);
    }
    byReason.get(reason).push(path);
  }
  for (const [reason, paths] of byReason) {
    if (paths.length === 1) {
      console.warn(`renderForHydration "${name}": ${paths[0]}: ${reason}`);
    } else {
      const shown = paths.slice(0, 3).join(', ');
      const extra = paths.length > 3 ? ` and ${paths.length - 3} more` : '';
      console.warn(`renderForHydration "${name}": ${paths.length} values — ${reason} (${shown}${extra})`);
    }
  }
  if (errors.length > 0) {
    throw new Error(`renderForHydration "${name}": state cannot be serialized — ${errors.join(', ')}`);
  }
}

function assertSync(result, name) {
  if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
    throw new Error(`renderForHydration "${name}": component function must be synchronous`);
  }
}

function makeId() {
  return `k${Math.random().toString(36).slice(2, 9)}`;
}

function withMountTarget(el, id, name) {
  const html = el.toString();
  const injected = html.replace(/^(<[\w-]+)/, `$1 data-k-mount-target="${id}"`);
  if (injected === html) {
    throw new Error(`renderForHydration "${name}": component returned a value that is not an HTML element`);
  }
  return injected;
}

function hydrateComponent(script, fn, name) {
  const mountId = script.dataset.kMount;
  const mountEls = [...document.querySelectorAll(`[data-k-mount-target="${mountId}"]`)];
  if (!mountEls.length) {
    console.warn(`renderForHydration: mount point for "${name}" not found. The component may have already been hydrated.`);
    return;
  }
  try {
    const state = JSON.parse(script.textContent);
    _enterHydrationScope(mountId);
    let result;
    try {
      result = fn(state);
    } finally {
      _exitHydrationScope();
    }
    assertSync(result, name);
    if (result === null || result === undefined) {
      console.warn(`renderForHydration: "${name}" returned ${String(result)} on the client — skipping hydration, SSR element preserved`);
      return;
    }
    const newEls = Array.isArray(result) ? result : [result];
    mountEls.slice(1).forEach(el => el.remove());
    const newNodes = newEls.map(el => el.toElement());
    // Stamp the live nodes with the mount-target attribute so external tooling (DOM-morph
    // HMR, devtools, etc.) can identify kensington-managed regions in the rendered DOM.
    for (const node of newNodes) {
      if (node !== null && node !== undefined && typeof node.setAttribute === 'function') {
        node.setAttribute('data-k-mount-target', mountId);
      }
    }
    mountEls[0].replaceWith(...newNodes);
    script.remove();
    recordInstance(name, { mountId, mountNodes: newNodes, fn, state });
  } catch (err) {
    console.error(`renderForHydration: failed to hydrate "${name}"`, err);
  }
}

/**
 * Hot-swaps every live instance of a component with a new function. State held in keyed
 * signals (signal(initial, key) called inside the component) persists across the swap.
 * Form state (focus, scroll, input values, selection) is preserved via preserve-state.js.
 * Effects on the discarded DOM are stopped automatically by dom-tracker's MutationObserver.
 *
 * Intended to be called from a Vite (or other bundler) HMR accept handler:
 *   import.meta.hot?.accept(mod => hmrReplaceComponent('counter', mod.counter));
 *
 * @param {string} name - The component name passed to registerComponents.
 * @param {function} newFn - The new component function.
 */
export function hmrReplaceComponent(name, newFn) {
  const actualFn = newFn !== null && newFn !== undefined && newFn.__kFn !== undefined ? newFn.__kFn : newFn;
  componentRegistry.set(name, actualFn);
  const set = liveInstances.get(name);
  if (set === undefined || set.size === 0) {
    return;
  }
  for (const inst of [...set]) {
    const firstNode = inst.mountNodes[0];
    if (firstNode === undefined || !firstNode.isConnected) {
      _disposeHydrationScope(inst.mountId);
      dropInstance(name, inst);
      continue;
    }
    const parent = firstNode.parentNode;
    if (parent === null) {
      dropInstance(name, inst);
      continue;
    }
    let captured = null;
    try {
      captured = captureState(firstNode);
    } catch (err) {
      console.warn(`hmrReplaceComponent: failed to capture state for "${name}"`, err);
    }
    let newNodes;
    try {
      _enterHydrationScope(inst.mountId);
      let result;
      try {
        result = actualFn(inst.state);
      } finally {
        _exitHydrationScope();
      }
      assertSync(result, name);
      if (result === null || result === undefined) {
        console.warn(`hmrReplaceComponent: "${name}" returned ${String(result)} on swap — keeping previous DOM`);
        continue;
      }
      const newEls = Array.isArray(result) ? result : [result];
      newNodes = newEls.map(el => el.toElement());
    } catch (err) {
      console.error(`hmrReplaceComponent: failed to render new version of "${name}"`, err);
      continue;
    }
    const before = firstNode;
    inst.mountNodes.slice(1).forEach(n => { if (n.parentNode !== null) { n.remove(); } });
    before.replaceWith(...newNodes);
    if (captured !== null) {
      try {
        restoreState(newNodes[0], captured);
      } catch (err) {
        console.warn(`hmrReplaceComponent: failed to restore state for "${name}"`, err);
      }
    }
    inst.mountNodes = newNodes;
    inst.fn = actualFn;
  }
}

function injectSSRStyle() {
  if (document.head.querySelector('[data-k-ssr]')) { return; }
  const style = document.createElement('style');
  style.setAttribute('data-k-ssr', '');
  style.textContent = '[data-k-mount-target],[data-k-mount-target] *' +
    '{transition:none !important;animation:none !important}';
  document.head.appendChild(style);
}

function hydrateAll(registry) {
  if (typeof document === 'undefined') {
    return { stop() {} };
  }

  injectSSRStyle();

  const warnedMissing = new Set();
  function tryHydrate(script) {
    const name = script.dataset.kComponent;
    const fn = registry.get(name);
    if (!fn) {
      if (!warnedMissing.has(name)) {
        warnedMissing.add(name);
        console.warn(`renderForHydration: no component registered for "${name}". Did you call registerComponents({ ${name} })?`);
      }
      return;
    }
    hydrateComponent(script, fn, name);
  }

  const run = () => {
    document.querySelectorAll('script[type="application/json"][data-k-component]')
      .forEach(tryHydrate);
  };

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) { continue; }
        if (node.matches('script[type="application/json"][data-k-component]')) {
          tryHydrate(node);
        } else {
          node.querySelectorAll('script[type="application/json"][data-k-component]')
            .forEach(tryHydrate);
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  return { stop() { observer.disconnect(); } };
}

/**
 * Renders a component to an HTML string and embeds the state as a JSON script block
 * so the browser can hydrate it reactively. The component may return a single element,
 * an array of elements, or null/undefined (renders a placeholder script block only).
 * Each root element is flagged with data-k-mount-target.
 *
 * @param {function} fn - Component function. Must be a named function.
 * @param {Record<string, *>} state - Plain serializable state object.
 * @param {string | symbol} [name] - Component name. Required when called in the browser (function names are not safe after minification). Defaults to fn.name server-side.
 * @returns {LiteralTag}
 * @throws if the component name cannot be determined
 * @throws if the component function is async
 * @throws if the component returns a non-element value (string, number, etc.)
 */
export function renderForHydration(fn, state, name = NAME_UNSET) {
  if (name === NAME_UNSET) {
    if (typeof window !== 'undefined') {
      throw new Error(`renderForHydration: pass an explicit name as the third argument when calling in the browser. Function names are not safe after minification`);
    }
    name = fn.name;
  }
  if (!name) {
    throw new Error('renderForHydration: component function must be named, or pass a name as the third argument');
  }
  const id = makeId();
  _enterSSRMode();
  let result;
  let tagHtml;
  try {
    result = fn(state);
    assertSync(result, name);
    const elements = (result === null || result === undefined)
      ? []
      : (Array.isArray(result) ? result : [result]).filter(el => el !== null && el !== undefined);
    tagHtml = elements.length === 0 ? null : elements.map(el => withMountTarget(el, id, name)).join('\n');
  } finally {
    _exitSSRMode();
  }
  checkState(name, state);
  const json = JSON.stringify(state).replace(SCRIPT_CLOSE_RE, '<\\/script>');
  if (tagHtml === null) {
    const attrs = `data-k-component="${name}" data-k-mount="${id}" data-k-mount-target="${id}"`;
    return new LiteralTag(`<script type="application/json" ${attrs}>${json}</script>`, false);
  }
  const html = `${tagHtml}\n` +
    `<script type="application/json" data-k-component="${name}" data-k-mount="${id}">${json}</script>`;
  return new LiteralTag(html, false);
}

/**
 * Registers component functions and hydrates all server-rendered instances in the page.
 * A MutationObserver is installed to hydrate components inserted dynamically after this call.
 *
 * @param {Record<string, function>} components - Map of component name to component function.
 * @returns {{ stop(): void }} Call stop() to disconnect the observer and halt auto-hydration.
 * @example
 * const { stop } = registerComponents({ counter, userCard });
 */
export function registerComponents(components) {
  for (const [name, fn] of Object.entries(components)) {
    const actualFn = fn !== null && fn !== undefined && fn.__kFn !== undefined ? fn.__kFn : fn;
    componentRegistry.set(name, actualFn);
  }
  return hydrateAll(componentRegistry);
}

/**
 * Dev-only HMR instrumentation. Wraps a component function so that the live DOM element it
 * produces gets recorded in liveInstances, the same registry hmrReplaceComponent reads from.
 *
 * Injected automatically by the kensington Vite plugin (apply: 'serve'). User code never
 * references this. Production builds strip the wrapping entirely.
 *
 * The wrapper:
 *   1. Calls the original fn(state) inside a hydration scope, so signal(initial, key) calls
 *      keyed state survives hot-swaps.
 *   2. Replaces the returned tag's toElement on the instance with a version that, on first
 *      call, attaches a mount-target attribute and records the instance.
 *
 * Only single-tag returns are tracked. Array returns and null/undefined are passed through.
 *
 * @param {string} name - Component name. Used to look up live instances on hot-replace.
 * @param {function} fn - The original component function.
 * @returns {function} Wrapper with fn exposed as wrapper.__kFn.
 */
export function __kInstrument(name, fn) {
  componentRegistry.set(name, fn);
  function instrumented(...args) {
    // Server-side or inside renderForHydration/hydrateComponent: the SSR/hydration code
    // owns instance tracking. The wrapper steps aside and just calls the original. Pass all
    // arguments through, since non-component exports (layouts, helpers) may take more than
    // one argument and the plugin can't always tell them apart from components.
    if (typeof window === 'undefined' || isSSRMode() || _inHydrationScope()) {
      return fn(...args);
    }
    const state = args[0];
    const mountId = makeId();
    _enterHydrationScope(mountId);
    let result;
    try {
      result = fn(state);
    } finally {
      _exitHydrationScope();
    }
    if (result === null || result === undefined || Array.isArray(result)) {
      return result;
    }
    if (typeof result.toElement !== 'function') {
      return result;
    }
    const origToElement = result.toElement.bind(result);
    let recorded = false;
    result.toElement = function toElement() {
      const el = origToElement();
      if (!recorded && el !== null && el !== undefined && typeof el.setAttribute === 'function') {
        recorded = true;
        el.setAttribute('data-k-mount-target', mountId);
        recordInstance(name, { mountId, mountNodes: [el], fn, state });
      }
      return el;
    };
    return result;
  }
  instrumented.__kFn = fn;
  // Keep the original component name visible on the wrapper so server-side calls like
  // renderForHydration(counter, state) (which read fn.name when no explicit name is given)
  // see "counter" rather than the wrapper's internal name. Without this the SSR mount
  // markers would carry the wrong component name and registerComponents wouldn't match.
  Object.defineProperty(instrumented, 'name', { value: name, configurable: true });
  return instrumented;
}
