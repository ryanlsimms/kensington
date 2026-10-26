import { getSharedReactiveState } from './shared-state.js';
const state = getSharedReactiveState('devtools', () => ({
  enabled: false,
  hook: null,
  nextIsBinding: false,
  nextBindingLabel: '',
  signalIds: new WeakMap(),
  computedSigs: new WeakSet(),
  computedIds: new Set(),
  idCounter: 0,
  pendingZeroSubscribers: new Set(),
  signalGcRegistry: typeof FinalizationRegistry === 'undefined'
    ? { register() {}, unregister() {} }
    : new FinalizationRegistry(id => {
      if (!state.hook) { return; }
      state.hook.signals.delete(id);
      state.hook._emit('update', { type: 'signal:stop', id, isComputed: state.computedIds.has(id) });
      state.computedIds.delete(id);
    }),
}));

// Signals created via computed(). Used to restore isComputed: true when a sleeping computed wakes.

// Tracks IDs of computed signals for event payloads where only the ID is available (GC callbacks).

// IDs of plain signals that have reached zero subscribers; removed from devtools on the next
// microtask unless the signal re-subscribes first (e.g. during drag-reorder pause/resume).

// Automatically remove devtools entries for signals that are garbage-collected without
// an explicit .stop() call. The cleanup callback lives in the shared runtime state.

export function enableDevtools() {
  if (state.enabled) { return; }
  if (typeof window === 'undefined') {
    console.warn('kensington: enableDevtools() has no effect on the server. Call it in browser-only code.');
    return;
  }
  state.enabled = true;
  state.hook = {
    signals: new Map(),
    effects: new Map(),
    bindings: new Map(),
    domTrackedCount: 0,
    _listeners: new Map(),
    on(event, cb) {
      let set = this._listeners.get(event);
      if (set === undefined) {
        set = new Set();
        this._listeners.set(event, set);
      }
      set.add(cb);
    },
    off(event, cb) {
      this._listeners.get(event)?.delete(cb);
    },
    _emit(event, data) {
      const listeners = this._listeners.get(event);
      if (listeners === undefined) { return; }
      for (const cb of listeners) {
        try {
          cb(data);
        } catch (err) {
          console.error('kensington devtools listener error', err);
        }
      }
    },
  };
  if (typeof window !== 'undefined') {
    window.__KENSINGTON_DEVTOOLS__ = state.hook;
  }
  if (typeof BroadcastChannel !== 'undefined') {
    const ch = new BroadcastChannel('kensington-devtools');
    ch.postMessage('ready');
    ch.close();
  }
}

export function notifySignalCreate(sig, value) {
  if (!state.enabled) { return; }
  const id = ++state.idCounter;
  state.signalIds.set(sig, id);
  state.hook.signals.set(id, {
    id,
    value,
    subscriberCount: 0,
    setCount: 0,
    effectIds: new Set(),
    isComputed: false,
    // Setter for the devtools panel's "edit value" affordance. Built here (not in the
    // Signal constructor) so signal() doesn't allocate this closure on every call when
    // devtools is disabled. The early `if (!enabled)` return above skips this path.
    setter: v => { sig.set(v); },
  });
  state.signalGcRegistry.register(sig, id);
  state.hook._emit('update', { type: 'signal:create', id, isComputed: false });
}

export function notifySignalSet(sig, value, subscriberCount) {
  if (!state.enabled) { return; }
  const id = state.signalIds.get(sig);
  if (id === undefined) { return; }
  const meta = state.hook.signals.get(id);
  if (meta === undefined) { return; }
  meta.value = value;
  meta.subscriberCount = subscriberCount;
  meta.setCount++;
  state.hook._emit('update', { type: 'signal:set', id, isComputed: state.computedIds.has(id) });
}

// Re-adds a sleeping computed to the signals map using its original ID so it reappears
// in devtools after being woken by a new subscriber. The value is repopulated by the
// notifySignalSet call that follows immediately from the rerun of update().
export function notifySignalWake(sig, frozenValue) {
  if (!state.enabled) { return; }
  const id = state.signalIds.get(sig);
  if (id === undefined) { return; }
  const meta = {
    id,
    value: frozenValue,
    subscriberCount: 0,
    setCount: 0,
    effectIds: new Set(),
    isComputed: state.computedSigs.has(sig),
    setter: null,
  };
  state.hook.signals.set(id, meta);
  state.hook._emit('update', { type: 'signal:wake', id, isComputed: true });
}

export function notifySignalMarkKeyed(sig, key) {
  if (!state.enabled) { return; }
  const id = state.signalIds.get(sig);
  if (id === undefined) { return; }
  const meta = state.hook.signals.get(id);
  if (meta !== undefined) { meta.key = key; }
  state.hook._emit('update', { type: 'signal:mark-keyed', id, key });
}

export function notifySignalMarkComputed(sig) {
  if (!state.enabled) { return; }
  state.computedSigs.add(sig);
  const id = state.signalIds.get(sig);
  if (id === undefined) { return; }
  state.computedIds.add(id);
  const meta = state.hook.signals.get(id);
  if (meta !== undefined) { meta.isComputed = true; }
}

function getEffectMeta(id) {
  return state.hook.effects.get(id) ?? state.hook.bindings.get(id);
}

export function notifySignalEffectSubscription(sig, effectId, subscriberCount) {
  if (!state.enabled) { return; }
  const id = state.signalIds.get(sig);
  if (id === undefined) { return; }
  const meta = state.hook.signals.get(id);
  if (meta === undefined) { return; }
  // Always cancel pending removal. Computed intermediate subscribers (effectId undefined)
  // must still keep the source signal alive in devtools.
  state.pendingZeroSubscribers.delete(id);
  meta.subscriberCount = subscriberCount;
  if (effectId) {
    meta.effectIds.add(effectId);
    const effMeta = getEffectMeta(effectId);
    if (effMeta !== undefined) { effMeta.depIds.add(id); }
  }
}

export function notifySignalZeroSubscribers(sig) {
  if (!state.enabled) { return; }
  const id = state.signalIds.get(sig);
  if (id === undefined) { return; }
  if (state.hook.signals.get(id) === undefined) { return; }
  state.pendingZeroSubscribers.add(id);
  queueMicrotask(() => {
    if (!state.pendingZeroSubscribers.delete(id)) { return; }
    state.hook.signals.delete(id);
    state.hook._emit('update', { type: 'signal:stop', id, isComputed: false });
  });
}

export function notifySignalEffectUnsubscription(sig, effectId, subscriberCount) {
  if (!state.enabled) { return; }
  const id = state.signalIds.get(sig);
  if (id === undefined) { return; }
  const meta = state.hook.signals.get(id);
  if (meta === undefined) { return; }
  meta.subscriberCount = subscriberCount;
  if (effectId) {
    meta.effectIds.delete(effectId);
    const effMeta = getEffectMeta(effectId);
    if (effMeta !== undefined) { effMeta.depIds.delete(id); }
  }
}

export function notifySignalStop(sig) {
  if (!state.enabled) { return; }
  const id = state.signalIds.get(sig);
  if (id === undefined) { return; }
  state.hook.signals.delete(id);
  state.hook._emit('update', { type: 'signal:stop', id, isComputed: state.computedSigs.has(sig) });
  state.computedIds.delete(id);
}

export function notifyEffectElement(effectId, element) {
  if (!state.enabled || effectId === 0) { return; }
  const meta = getEffectMeta(effectId);
  if (meta === undefined) { return; }
  meta.elementRef = new WeakRef(element);
}

export function markNextEffectAsBinding(label) {
  if (!state.enabled) { return; }
  state.nextIsBinding = true;
  state.nextBindingLabel = label ?? '';
}

export function notifyEffectCreate(fn) {
  if (!state.enabled) { return 0; }
  const isBinding = state.nextIsBinding;
  state.nextIsBinding = false;
  const label = state.nextBindingLabel;
  state.nextBindingLabel = '';
  const id = ++state.idCounter;
  const src = fn ? fn.toString() : '';
  const meta = { id, state: 'active', runCount: 0, elementRef: null, src, label, depIds: new Set() };
  if (isBinding) {
    state.hook.bindings.set(id, meta);
  } else {
    state.hook.effects.set(id, meta);
  }
  state.hook._emit('update', { type: 'effect:create', id });
  return id;
}

export function notifyEffectRun(id) {
  if (!state.enabled || id === 0) { return; }
  const meta = getEffectMeta(id);
  if (meta === undefined) { return; }
  meta.state = 'active';
  meta.runCount++;
  if (state.hook.effects.has(id)) { state.hook._emit('update', { type: 'effect:run', id }); }
}

export function notifyEffectPause(id) {
  if (!state.enabled || id === 0) { return; }
  const meta = getEffectMeta(id);
  if (meta === undefined) { return; }
  meta.state = 'paused';
  if (state.hook.effects.has(id)) { state.hook._emit('update', { type: 'effect:pause', id }); }
}

export function notifyEffectResume(id) {
  if (!state.enabled || id === 0) { return; }
  const meta = getEffectMeta(id);
  if (meta === undefined) { return; }
  meta.state = 'active';
  if (state.hook.effects.has(id)) { state.hook._emit('update', { type: 'effect:resume', id }); }
}

export function notifyEffectStop(id) {
  if (!state.enabled || id === 0) { return; }
  const wasUserEffect = state.hook.effects.delete(id);
  if (!wasUserEffect) { state.hook.bindings.delete(id); }
  state.hook._emit('update', { type: 'effect:stop', id });
}

export function notifyDomTrack() {
  if (!state.enabled) { return; }
  state.hook.domTrackedCount++;
  state.hook._emit('update', { type: 'dom:track', count: state.hook.domTrackedCount });
}

export function notifyDomUntrack(bindingIds) {
  if (!state.enabled) { return; }
  if (state.hook.domTrackedCount > 0) { state.hook.domTrackedCount--; }
  const event = { type: 'dom:untrack', count: state.hook.domTrackedCount };
  if (bindingIds && bindingIds.length > 0) { event.bindingIds = bindingIds; }
  state.hook._emit('update', event);
}
