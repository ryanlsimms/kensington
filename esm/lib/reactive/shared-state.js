// Module-scope state is normally shared by the ESM loader. Self-contained browser
// bundles each contain their own copy of the reactive modules, so ESM runtimes
// use this versioned global registry to keep scheduler and lifecycle state shared.
// The CommonJS build keeps a module-local registry to preserve its separate runtime.
const REGISTRY_KEY = Symbol.for('kensington.reactive.shared-state.2.v1');
const commonJsStates = new Map();
const fallbackStates = new Map();

function getRegistry() {
  if (typeof module === 'object' && module?.exports) {
    return commonJsStates;
  }

  try {
    const existing = globalThis[REGISTRY_KEY];
    if (existing instanceof Map) { return existing; }
    const registry = new Map();
    Object.defineProperty(globalThis, REGISTRY_KEY, { value: registry, configurable: true });
    return registry;
  } catch {
    return fallbackStates;
  }
}

export function getSharedReactiveState(name, createState) {
  const registry = getRegistry();
  if (registry.has(name)) { return registry.get(name); }
  const state = createState();
  registry.set(name, state);
  return state;
}
