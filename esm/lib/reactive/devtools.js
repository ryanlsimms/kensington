let enabled = false;
let hook = null;
let nextIsBinding = false;
let nextBindingLabel = '';

const signalIds = new WeakMap();
// Signals created via computed(). Used to restore isComputed: true when a sleeping computed wakes.
const computedSigs = new WeakSet();
// Tracks IDs of computed signals for event payloads where only the ID is available (GC callbacks).
const computedIds = new Set();
let idCounter = 0;
// IDs of plain signals that have reached zero subscribers; removed from devtools on the next
// microtask unless the signal re-subscribes first (e.g. during drag-reorder pause/resume).
const pendingZeroSubscribers = new Set();

// Automatically remove devtools entries for signals that are garbage-collected without
// an explicit .stop() call. Covers embedded signals (e.g. task.done) that become
// unreachable when the containing data structure is updated.
const signalGcRegistry = new FinalizationRegistry(id => {
  if (!hook) { return; }
  hook.signals.delete(id);
  hook._emit('update', { type: 'signal:stop', id, isComputed: computedIds.has(id) });
  computedIds.delete(id);
});

export function enableDevtools() {
  if (enabled) { return; }
  if (typeof window === 'undefined') {
    console.warn('kensington: enableDevtools() has no effect on the server. Call it in browser-only code.');
    return;
  }
  enabled = true;
  hook = {
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
    window.__KENSINGTON_DEVTOOLS__ = hook;
  }
  if (typeof BroadcastChannel !== 'undefined') {
    const ch = new BroadcastChannel('kensington-devtools');
    ch.postMessage('ready');
    ch.close();
  }
}

export function notifySignalCreate(sig, value) {
  if (!enabled) { return; }
  const id = ++idCounter;
  signalIds.set(sig, id);
  hook.signals.set(id, {
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
  signalGcRegistry.register(sig, id);
  hook._emit('update', { type: 'signal:create', id, isComputed: false });
}

export function notifySignalSet(sig, value, subscriberCount) {
  if (!enabled) { return; }
  const id = signalIds.get(sig);
  if (id === undefined) { return; }
  const meta = hook.signals.get(id);
  if (meta === undefined) { return; }
  meta.value = value;
  meta.subscriberCount = subscriberCount;
  meta.setCount++;
  hook._emit('update', { type: 'signal:set', id, isComputed: computedIds.has(id) });
}

// Re-adds a sleeping computed to the signals map using its original ID so it reappears
// in devtools after being woken by a new subscriber. The value is repopulated by the
// notifySignalSet call that follows immediately from the rerun of update().
export function notifySignalWake(sig, frozenValue) {
  if (!enabled) { return; }
  const id = signalIds.get(sig);
  if (id === undefined) { return; }
  const meta = {
    id,
    value: frozenValue,
    subscriberCount: 0,
    setCount: 0,
    effectIds: new Set(),
    isComputed: computedSigs.has(sig),
    setter: null,
  };
  hook.signals.set(id, meta);
  hook._emit('update', { type: 'signal:wake', id, isComputed: true });
}

export function notifySignalMarkKeyed(sig, key) {
  if (!enabled) { return; }
  const id = signalIds.get(sig);
  if (id === undefined) { return; }
  const meta = hook.signals.get(id);
  if (meta !== undefined) { meta.key = key; }
  hook._emit('update', { type: 'signal:mark-keyed', id, key });
}

export function notifySignalMarkComputed(sig) {
  if (!enabled) { return; }
  computedSigs.add(sig);
  const id = signalIds.get(sig);
  if (id === undefined) { return; }
  computedIds.add(id);
  const meta = hook.signals.get(id);
  if (meta !== undefined) { meta.isComputed = true; }
}

function getEffectMeta(id) {
  return hook.effects.get(id) ?? hook.bindings.get(id);
}

export function notifySignalEffectSubscription(sig, effectId, subscriberCount) {
  if (!enabled) { return; }
  const id = signalIds.get(sig);
  if (id === undefined) { return; }
  const meta = hook.signals.get(id);
  if (meta === undefined) { return; }
  // Always cancel pending removal. Computed intermediate subscribers (effectId undefined)
  // must still keep the source signal alive in devtools.
  pendingZeroSubscribers.delete(id);
  meta.subscriberCount = subscriberCount;
  if (effectId) {
    meta.effectIds.add(effectId);
    const effMeta = getEffectMeta(effectId);
    if (effMeta !== undefined) { effMeta.depIds.add(id); }
  }
}

export function notifySignalZeroSubscribers(sig) {
  if (!enabled) { return; }
  const id = signalIds.get(sig);
  if (id === undefined) { return; }
  if (hook.signals.get(id) === undefined) { return; }
  pendingZeroSubscribers.add(id);
  queueMicrotask(() => {
    if (!pendingZeroSubscribers.delete(id)) { return; }
    hook.signals.delete(id);
    hook._emit('update', { type: 'signal:stop', id, isComputed: false });
  });
}

export function notifySignalEffectUnsubscription(sig, effectId, subscriberCount) {
  if (!enabled) { return; }
  const id = signalIds.get(sig);
  if (id === undefined) { return; }
  const meta = hook.signals.get(id);
  if (meta === undefined) { return; }
  meta.subscriberCount = subscriberCount;
  if (effectId) {
    meta.effectIds.delete(effectId);
    const effMeta = getEffectMeta(effectId);
    if (effMeta !== undefined) { effMeta.depIds.delete(id); }
  }
}

export function notifySignalStop(sig) {
  if (!enabled) { return; }
  const id = signalIds.get(sig);
  if (id === undefined) { return; }
  hook.signals.delete(id);
  hook._emit('update', { type: 'signal:stop', id, isComputed: computedSigs.has(sig) });
  computedIds.delete(id);
}

export function notifyEffectElement(effectId, element) {
  if (!enabled || effectId === 0) { return; }
  const meta = getEffectMeta(effectId);
  if (meta === undefined) { return; }
  meta.elementRef = new WeakRef(element);
}

export function markNextEffectAsBinding(label) {
  if (!enabled) { return; }
  nextIsBinding = true;
  nextBindingLabel = label ?? '';
}

export function notifyEffectCreate(fn) {
  if (!enabled) { return 0; }
  const isBinding = nextIsBinding;
  nextIsBinding = false;
  const label = nextBindingLabel;
  nextBindingLabel = '';
  const id = ++idCounter;
  const src = fn ? fn.toString() : '';
  const meta = { id, state: 'active', runCount: 0, elementRef: null, src, label, depIds: new Set() };
  if (isBinding) {
    hook.bindings.set(id, meta);
  } else {
    hook.effects.set(id, meta);
  }
  hook._emit('update', { type: 'effect:create', id });
  return id;
}

export function notifyEffectRun(id) {
  if (!enabled || id === 0) { return; }
  const meta = getEffectMeta(id);
  if (meta === undefined) { return; }
  meta.state = 'active';
  meta.runCount++;
  if (hook.effects.has(id)) { hook._emit('update', { type: 'effect:run', id }); }
}

export function notifyEffectPause(id) {
  if (!enabled || id === 0) { return; }
  const meta = getEffectMeta(id);
  if (meta === undefined) { return; }
  meta.state = 'paused';
  if (hook.effects.has(id)) { hook._emit('update', { type: 'effect:pause', id }); }
}

export function notifyEffectResume(id) {
  if (!enabled || id === 0) { return; }
  const meta = getEffectMeta(id);
  if (meta === undefined) { return; }
  meta.state = 'active';
  if (hook.effects.has(id)) { hook._emit('update', { type: 'effect:resume', id }); }
}

export function notifyEffectStop(id) {
  if (!enabled || id === 0) { return; }
  const wasUserEffect = hook.effects.delete(id);
  if (!wasUserEffect) { hook.bindings.delete(id); }
  hook._emit('update', { type: 'effect:stop', id });
}

export function notifyDomTrack() {
  if (!enabled) { return; }
  hook.domTrackedCount++;
  hook._emit('update', { type: 'dom:track', count: hook.domTrackedCount });
}

export function notifyDomUntrack(bindingIds) {
  if (!enabled) { return; }
  if (hook.domTrackedCount > 0) { hook.domTrackedCount--; }
  const event = { type: 'dom:untrack', count: hook.domTrackedCount };
  if (bindingIds && bindingIds.length > 0) { event.bindingIds = bindingIds; }
  hook._emit('update', event);
}
