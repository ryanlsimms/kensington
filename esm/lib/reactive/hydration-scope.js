import { getSharedReactiveState } from './shared-state.js';
// Hydration scope. A per-mount registry of signals and computeds keyed by user-supplied keys.
// renderForHydration pushes a scope keyed by the mount instance id. Inside the scope,
// signal(initial, key) and computed(fn, key) look up a per-scope registry instead of creating
// a fresh instance. Across a hot-swap, the same scope id means the new module's signal/computed
// calls reuse the existing instances, so user-visible values persist. Unlike keyedRegistries
// inside a computed, hydration scopes do not sweep unaccessed keys per run. They are disposed
// only when the mount is removed via _disposeHydrationScope.

const state = getSharedReactiveState('hydration-scope', () => ({
  hydrationScopes: new Map(),
  hydrationScopeStack: [],
  currentHydrationScope: null,
}));

export function _enterHydrationScope(scopeId) {
  let scope = state.hydrationScopes.get(scopeId);
  if (scope === undefined) {
    scope = { signals: new Map(), computeds: new Map(), initials: new Map() };
    state.hydrationScopes.set(scopeId, scope);
  }
  state.hydrationScopeStack.push(state.currentHydrationScope);
  state.currentHydrationScope = scope;
}

export function _exitHydrationScope() {
  state.currentHydrationScope = state.hydrationScopeStack.length > 0 ? state.hydrationScopeStack.pop() : null;
}

export function _inHydrationScope() {
  return state.currentHydrationScope !== null;
}

export function _disposeHydrationScope(scopeId) {
  const scope = state.hydrationScopes.get(scopeId);
  if (scope === undefined) {
    return;
  }
  for (const sig of scope.signals.values()) {
    sig.stop();
  }
  for (const sig of scope.computeds.values()) {
    sig.stop();
  }
  state.hydrationScopes.delete(scopeId);
}

// Read accessor for signal()/computed() to look up the active scope without owning the state.
export function getCurrentHydrationScope() {
  return state.currentHydrationScope;
}
