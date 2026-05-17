import LiteralTag from '../../tag-classes/literal-tag.js';
import { _enterSSRMode, _exitSSRMode } from '../reactive/signal.js';

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

  for (const msg of warnings) {
    console.warn(`renderForHydration "${name}": ${msg}`);
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
  const mountEls = [...document.querySelectorAll(`[data-k-mount-target="${script.dataset.kMount}"]`)];
  if (!mountEls.length) {
    console.warn(`renderForHydration: mount point for "${name}" not found. The component may have already been hydrated.`);
    return;
  }
  try {
    const result = fn(JSON.parse(script.textContent));
    assertSync(result, name);
    if (result === null || result === undefined) {
      console.warn(`renderForHydration: "${name}" returned ${String(result)} on the client — skipping hydration, SSR element preserved`);
      return;
    }
    const newEls = Array.isArray(result) ? result : [result];
    mountEls.slice(1).forEach(el => el.remove());
    mountEls[0].replaceWith(...newEls.map(el => el.toElement()));
    script.remove();
  } catch (err) {
    console.error(`renderForHydration: failed to hydrate "${name}"`, err);
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

  function tryHydrate(script) {
    const name = script.dataset.kComponent;
    const fn = registry.get(name);
    if (!fn) {
      console.warn(`renderForHydration: no component registered for "${name}". Did you call registerComponents({ ${name} })?`);
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
 * @param {string} [name] - Component name. Defaults to fn.name. Required for anonymous functions.
 * @returns {LiteralTag}
 * @throws if the component name cannot be determined
 * @throws if the component function is async
 * @throws if the component returns a non-element value (string, number, etc.)
 */
export function renderForHydration(fn, state, name = fn.name) {
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
  const registry = new Map(Object.entries(components));
  return hydrateAll(registry);
}
