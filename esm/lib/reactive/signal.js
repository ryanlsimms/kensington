import {
  notifyEffectCreate,
  notifyEffectPause,
  notifyEffectResume,
  notifyEffectRun,
  notifyEffectStop,
  notifySignalCreate,
  notifySignalEffectSubscription,
  notifySignalEffectUnsubscription,
  notifySignalMarkComputed,
  notifySignalMarkKeyed,
  notifySignalSet,
  notifySignalStop,
  notifySignalWake,
  notifySignalZeroSubscribers,
} from './devtools.js';
import { getCurrentHydrationScope } from './hydration-scope.js';
import { mapWithKey } from './map-with-key.js';
import { createRuntimeContext, RUNTIME_OWNER } from './runtime-context.js';
import { getSharedReactiveState } from './shared-state.js';
import { renderSignalAsTag } from './signal-render.js';
import { isSSRMode } from './ssr.js';
import { throttledError, throttledWarn, warnKeyedInitialMismatch } from './warnings.js';

// Internal bridge used by tag validation. Standalone reactive calls have no checker.
export const _reactiveRuntime = createRuntimeContext({ isolated: import.meta.url.includes('?') });

const state = getSharedReactiveState('signal', () => ({
  currentEffect: null,
  pending: new Set(),
  runCounts: new Map(),
  asyncTurnCounts: new Map(),
  asyncTurnCountsResetScheduled: false,
  microtaskTurn: 0,
  microtaskTurnAdvanceScheduled: false,
  scheduled: false,
  notificationDepth: 0,
  inComputedFn: false,
  suppressReactiveCheck: false,
  nextComputedInternal: false,
  suppressWakeNotify: false,
  inFlush: false,
  mapWithKeyInnerDepth: 0,
  insideConnectedCallbackDepth: 0,
  stopFns: new WeakMap(),
  sleepFns: new WeakMap(),
  wakeFns: new WeakMap(),
  pendingSleep: new Set(),
  derivedSignals: new WeakSet(),
  computedUpdates: new WeakMap(),
  computedLifecycle: new WeakMap(),
  pendingComputeds: new Set(),
  drainingComputeds: false,
  derivedWriteDepth: 0,
  currentComputed: null,
  computedCallSite: null,
  keyedRegistries: new WeakMap(),
  keyedComputedRegistries: new WeakMap(),
  keyedScopeOwners: new WeakMap(),
  pendingNestedWarning: new WeakMap(),
}));

const MAX_EFFECT_LOOPS = 100;
const MAX_ASYNC_EFFECT_TURNS = 500;

// Set by _internalComputed before calling computed(fn) so the new computed's
// update closure is marked internal. Library-internal wrappers (class-list
// builder, attribute composition, mapWithKey's per-key inner) should not trip
// user-facing warnings about out-of-scope reactive references when they read
// keyed signals owned by user scopes.

// Set true while mapWithKey runs mapFn under a probe to detect whether it reads or creates
// reactive primitives. A keyed signal/computed creation during the probe forces an upgrade
// to the reactive path (mapFn re-runs under a full per-key inner computed) so the keyed
// primitive lives in a stable per-row scope.
// Depth counter set true while a mapWithKey mapFn body is executing (either under the probe
// or inside the real per-key inner computed). Recursive mapWithKey calls (a row component
// that maps its own children) are safe because the inner mapFn only runs once per key, so
// the mapwithkey-in-reactive warning is suppressed for this case.

// Non-zero while a trackForConnect callback is executing. Effects created
// in that scope are auto-marked internal — their lifetime is tied to the
// DOM node (the caller is expected to stop them in a disconnectedCallback)
// so the usual out-of-scope-reactive-reference concern does not apply.

export function _enterConnectedCallback() { state.insideConnectedCallbackDepth++; }
export function _exitConnectedCallback() { state.insideConnectedCallbackDepth--; }

// sleep/wake hooks for auto-disposing computed signals when subscriber count hits zero.

// Computed signals whose sleep has been deferred until after the current flush. If the
// subscriber comes back before the microtask fires (the common case when a DOM-binding
// effect re-runs), the entry is removed and sleep is canceled. No sleep/wake round-trip.

// Tracks signals created by computed()/transform() so .set() can be blocked on them.

// Only internal list aggregators coalesce synchronous dependency notifications. Ordinary
// computeds retain their eager behavior. Reads pull a pending aggregator forward, and the
// outermost notification drains the remainder before Signal.set() returns.

// Counter rather than boolean so nested computed calls don't prematurely re-enable the guard.

// Tracks the innermost computed currently running, so signal(initial, key) can scope
// keyed signal lookups to that computed instance. Saved/restored as a stack across nested
// computed runs (which are warned against but otherwise tolerated).

// Set by Signal.prototype.transform before it calls computed() so the warning fired from
// inside computed() can use transform-specific wording. Cleared in transform's finally.

// Per-computed registry of keyed signals. Each entry has `signals: Map<key, Signal>` and
// `accessed: Set<key>`. After each computed run, keys not accessed are stopped and removed,
// so signals tied to items that have left the list are cleaned up automatically.

// Per-computed registry of keyed inner computeds. Same lifecycle as keyedRegistries.
// Each entry has `computeds: Map<key, { fnSig: Signal, inner: Signal }>` and `accessed: Set<key>`.
// fnSig holds the current fn closure; setting it triggers the inner computed to re-run with the
// updated fn, which handles the case where the fn captures outer-scope variables that changed.

// Maps a keyed inner Signal (signal, computed, or transform created inside a computed
// callback with a stable key) back to its owner outer computed. Signal.get() warns when
// something outside the owner subscribes. The owner can stop the inner at any time when
// its key isn't accessed during a re-run, so external references silently drop subscribers.

// Deferred `computed-in-computed` / `transform-in-computed` warnings. An unkeyed nested
// computed is only a problem when a *non-internal* subscriber attaches (a user effect or
// user computed). Internal consumers (attribute-composition, class-list, and text/attr
// binding effects) are safe because their run functions are torn down and rebuilt alongside
// the inner. We stamp the created inner here and consult on subscribe: fire once if a
// user subscriber attaches, silently drop if only internal subscribers ever read it.

function rethrowAsync(err) {
  queueMicrotask(() => { throw err; });
}

// Queue the marker after an effect flush. Any Promise/queueMicrotask work started by an
// effect is already ahead of this marker, so an async feedback loop advances the turn on
// every one or two passes. Repeated synchronous .set() calls never yield to the marker and
// therefore remain in one turn, regardless of how many commits the caller intentionally
// performs. A plain per-macrotask run count cannot make that distinction.
// Node nextTick callbacks can starve the microtask queue, so either queue may advance
// the marker. Each scheduled pair advances it only once.
function scheduleMicrotaskTurnAdvance() {
  if (state.microtaskTurnAdvanceScheduled) { return; }
  state.microtaskTurnAdvanceScheduled = true;
  let advanced = false;
  const advance = () => {
    if (advanced) { return; }
    advanced = true;
    state.microtaskTurn += 1;
    state.microtaskTurnAdvanceScheduled = false;
  };
  queueMicrotask(advance);
  if (typeof globalThis.process?.nextTick === 'function') {
    globalThis.process.nextTick(advance);
  }
}

function flush() {
  if (state.inFlush || state.pending.size === 0) { return; }
  if (!state.asyncTurnCountsResetScheduled) {
    state.asyncTurnCountsResetScheduled = true;
    setTimeout(() => { state.asyncTurnCounts.clear(); state.asyncTurnCountsResetScheduled = false; }, 0);
  }
  state.runCounts.clear();
  state.inFlush = true;
  try {
    while (state.pending.size > 0) {
      const runs = [...state.pending];
      for (const fn of runs) {
        // Keep later readers queued while earlier writers run. Their existing turn
        // already observes those writes; writes after their turn still enqueue them.
        if (!state.pending.delete(fn)) { continue; }
        const count = (state.runCounts.get(fn) ?? 0) + 1;
        state.runCounts.set(fn, count);
        if (count > MAX_EFFECT_LOOPS) {
          throttledError(
            'sync-loop',
            `kensington: reactive loop detected. The same effect was re-queued ${count} times in a single flush. ` +
            'Check for an effect that writes to a signal it also reads, or two effects that write to each other\'s signal dependencies. ' +
            'For effects with async callbacks (queueMicrotask, setTimeout, fetch), guard the write with a condition check to confirm the update is still needed before calling .set().',
          );
          continue;
        }
        const previousTurn = state.asyncTurnCounts.get(fn);
        let asyncTurnCount = previousTurn?.count ?? 0;
        if (previousTurn?.turn !== state.microtaskTurn) {
          asyncTurnCount++;
          state.asyncTurnCounts.set(fn, { turn: state.microtaskTurn, count: asyncTurnCount });
        }
        if (asyncTurnCount > MAX_ASYNC_EFFECT_TURNS) {
          throttledError(
            'async-loop',
            `kensington: async reactive loop detected. The same effect re-entered across more than ${MAX_ASYNC_EFFECT_TURNS} microtask turns without yielding to a task. ` +
            'An effect is likely setting a signal inside a queueMicrotask or Promise callback in a cycle. ' +
            'Guard the write with a condition check to confirm the update is still needed before calling .set().',
          );
          continue;
        }
        try {
          fn();
        } catch (err) {
          rethrowAsync(err);
        }
      }
    }
  } finally {
    state.inFlush = false;
    scheduleMicrotaskTurnAdvance();
  }
  state.runCounts.clear();
}

function scheduleRun(fn) {
  state.pending.add(fn);
  if (!state.scheduled && !state.inFlush) {
    state.scheduled = true;
    queueMicrotask(() => {
      state.scheduled = false;
      flush();
    });
  }
}

function notifySubscribers(subscribers, value) {
  state.notificationDepth++;
  try {
    for (const fn of [...subscribers]) {
      if (fn._isEffect) {
        scheduleRun(fn);
      } else if (fn._coalesce) {
        state.pendingComputeds.add(fn);
      } else {
        fn(value);
      }
    }
  } finally {
    state.notificationDepth--;
    if (state.notificationDepth === 0 && !state.drainingComputeds) {
      state.drainingComputeds = true;
      try {
        while (state.pendingComputeds.size > 0) {
          const update = state.pendingComputeds.values().next().value;
          state.pendingComputeds.delete(update);
          update();
        }
      } finally {
        state.drainingComputeds = false;
      }
    }
  }
}

/**
 * Applies pending reactive updates immediately, including DOM bindings and user effects.
 * Processes the shared queue and any further updates queued synchronously by those effects.
 * Does not wait for promises, lifecycle observers, browser painting, or animations.
 * Call from application code outside reactive callbacks. During a reactive callback or
 * server render it does nothing, preserving tracking and SSR isolation.
 * @returns {void}
 */
export function applyPendingReactiveUpdates() {
  _reactiveRuntime.check('applyPendingReactiveUpdates()');
  if (isSSRMode() || state.currentEffect !== null || state.notificationDepth !== 0) { return; }
  flush();
}

function wakeForRead(sig) {
  if (state.pendingComputeds.size > 0) {
    const update = state.computedUpdates.get(sig);
    if (state.pendingComputeds.delete(update)) { update(); }
  }
  const wake = state.wakeFns.get(sig);
  if (wake !== undefined) {
    state.suppressWakeNotify = true;
    const woken = wake();
    if (woken) {
      const sleep = state.sleepFns.get(sig);
      if (sleep !== undefined) { sleep(); }
    }
    state.suppressWakeNotify = false;
  }
}

export default class Signal {
  #value;
  #subscribers = new Set();

  constructor(initial) {
    _reactiveRuntime.check('signal()');
    this.#value = initial;
    notifySignalCreate(this, initial);
    if (!state.suppressReactiveCheck) {
      if (state.inComputedFn) {
        throttledWarn(
          'signal-in-computed',
          'kensington: signal() called inside a computed or transform callback without a key. ' +
          'The DOM node will be replaced when outer state changes. ' +
          'Focus, scroll, input value, and selection are preserved across the replacement, ' +
          'but local signal state resets to the initial value. ' +
          'For best performance and to persist local state, pass a stable key as the second argument: signal(initial, key).',
        );
      } else if (state.currentEffect !== null) {
        throttledError(
          'signal-in-effect',
          'kensington: signal() called inside an effect callback. ' +
          'A new signal is created on every effect re-run. ' +
          'Create signals outside the effect and pass them in.',
        );
      }
    }
  }

  get() {
    _reactiveRuntime.check('Signal.get()');
    if (state.pendingComputeds.size > 0) {
      const update = state.computedUpdates.get(this);
      if (state.pendingComputeds.delete(update)) { update(); }
    }
    if (state.currentEffect !== null && !this.#subscribers.has(state.currentEffect)) {
      if (this.#subscribers.size === 0) {
        // Defer to the shared wakeup helper so we also fire _onFirstSubscriber.
        // The inline-only path used to wake computeds but skip the external
        // hook (kensington/live's MSG_SUBSCRIBE), which silently desynced live
        // signals whose subscriber count went 0 → 1 via a .get() inside a
        // computed/effect (the common case). _bindingSubscribe already routes
        // through #wakeIfSleeping; .get() must too.
        this.#wakeIfSleeping();
      }
      this.#subscribers.add(state.currentEffect);
      state.currentEffect._reads.add(this);
      notifySignalEffectSubscription(this, state.currentEffect._devId, this.#subscribers.size);
      // Fire the deferred computed-in-computed / transform-in-computed warning only when a
      // non-internal subscriber attaches. Internal consumers (attribute, class, or text
      // bindings) tear down alongside the inner on outer re-run and don't leak identity.
      if (!state.currentEffect._isInternal) {
        const nestedKind = state.pendingNestedWarning.get(this);
        if (nestedKind !== undefined) {
          const isTransform = nestedKind === 'transform';
          const callName = isTransform ? '.transform()' : 'computed()';
          const keyedCall = isTransform ? 'signal.transform(fn, key)' : 'computed(fn, key)';
          throttledWarn(
            isTransform ? 'transform-in-computed' : 'computed-in-computed',
            `kensington: ${callName} created inside a computed or transform callback ` +
            'without a key is being subscribed to by user code. A fresh inner is allocated on every outer re-run and its ' +
            'subscribers are torn down. Pass a stable key as the second argument to reuse the same inner across re-runs: ' +
            `${keyedCall}.`,
          );
          state.pendingNestedWarning.delete(this);
        }
      }
      const ownerSig = state.keyedScopeOwners.get(this);
      // Sibling keyed primitives (created inside the same owner scope) read each other safely.
      // Their lifetime is tied to the same owner, so a drop affects both together. The warning
      // is for genuinely out-of-scope references held outside the owner's sweep.
      const subscriberOwner = state.currentComputed === null
        ? undefined
        : state.keyedScopeOwners.get(state.currentComputed);
      if (
        ownerSig !== undefined
        && state.currentComputed !== ownerSig
        && subscriberOwner !== ownerSig
        && !state.currentEffect._isInternal
      ) {
        throttledWarn(
          'out-of-scope-reactive-reference',
          'kensington: a signal/computed/transform created inside a computed callback is being subscribed to from outside its owning scope. ' +
          'If the owning computed re-runs and temporarily drops this key (e.g. during a loading state), ' +
          'the instance will be stopped and this subscriber will receive no further updates. ' +
          'Consume the value inline (call .get() on it, or pass it directly to a tag) instead of passing the instance out.',
        );
      }
      state.currentEffect._cleanups.push(this);
    } else if (state.currentEffect === null) {
      wakeForRead(this);
    }
    return this.#value;
  }

  subscribe() {
    return this.get();
  }

  get value() {
    _reactiveRuntime.check('Signal.value');
    wakeForRead(this);
    return this.#value;
  }

  set(valueOrFn) {
    _reactiveRuntime.check('Signal.set()');
    // Blocks external writes to computed/transform signals; depth > 0 means we're inside an update().
    if (state.derivedSignals.has(this) && state.derivedWriteDepth === 0) {
      throw new Error('Cannot call .set() on a computed or derived signal. Use signal() for writable state.');
    }
    if (isSSRMode()) {
      throttledWarn(
        'set-during-ssr',
        'kensington: .set() called inside renderForHydration. ' +
        'Server-render functions should be read-only over signals. ' +
        'Seeding per-request state belongs in the signal() constructor (signal(initialFromState)); ' +
        'server-side liveSignal mutations belong in route handlers or startup code, not inside the render body. ' +
        'For module-scope signals this leaks state across requests; for liveSignals this broadcasts to every connected client on every render.',
      );
    }
    const next = typeof valueOrFn === 'function' ? valueOrFn(this.#value) : valueOrFn;
    if (Object.is(next, this.#value)) {
      return;
    }
    if (state.currentEffect !== null && state.currentEffect._reads.has(this)) {
      throttledError(
        'set-in-effect',
        'kensington: a signal was read via .get() and written via .set() in the same effect or computed run. ' +
        'This creates a reactive loop. The write re-triggers the run, which writes again. ' +
        'Use .value instead of .get() if you need the current value without subscribing.',
      );
    }
    if (state.inComputedFn && state.derivedWriteDepth === 0) {
      throttledError(
        'set-in-computed',
        'kensington: .set() called inside a computed function. ' +
        'Computeds must be pure derivations. Move the write into a separate effect() instead.',
      );
    }
    this.#value = next;
    notifySignalSet(this, next, this.#subscribers.size);
    // Snapshot via spread is required: a computed subscriber's update() unsubscribes itself
    // from this signal at the start of its track() (clearing previous subscriptions) and
    // re-subscribes when its fn re-reads us, and Set iteration revisits entries that were
    // deleted and re-added during the same walk. Without the snapshot, that pattern loops.
    notifySubscribers(this.#subscribers, this.#value);
  }

  // Internal. Used by kensington/live to apply a value received from the server
  // without re-broadcasting it. Bypasses the derived-signal guard and the
  // set-in-effect / set-in-computed loop checks (a remote-origin update can
  // legitimately land while local code is reading the signal). Still notifies
  // subscribers so DOM bindings update.
  _setFromRemote(next) {
    _reactiveRuntime.check('live update');
    if (Object.is(next, this.#value)) {
      return;
    }
    this.#value = next;
    notifySignalSet(this, next, this.#subscribers.size);
    notifySubscribers(this.#subscribers, this.#value);
  }

  stop() {
    const fn = state.stopFns.get(this);
    if (fn !== undefined) {
      fn();
      state.stopFns.delete(this);
    }
    this.#subscribers.clear();
    notifySignalStop(this);
  }

  toJSON() {
    wakeForRead(this);
    return this.#value;
  }

  toString() {
    return String(this.get());
  }

  // Internal: subscribe `run` to this signal without entering the currentEffect tracking
  // dance. Used by _bindingEffect, which never enters track() and so needs a direct hook.
  _bindingSubscribe(run) {
    if (this.#subscribers.size === 0) { this.#wakeIfSleeping(); }
    this.#subscribers.add(run);
    notifySignalEffectSubscription(this, run._devId, this.#subscribers.size);
  }

  // Internal: called from track() (effect/computed re-run) and from createEffect's
  // pause()/stop(), as well as from _bindingEffect's pause/stop. The `run` argument is the
  // effect/computed run function that originally subscribed; it identifies which subscriber
  // to remove from this signal's set.
  _unsubscribeFromRun(run) {
    this.#subscribers.delete(run);
    notifySignalEffectUnsubscription(this, run._devId, this.#subscribers.size);
    if (this.#subscribers.size === 0) { this.#sleepOrNotify(); }
  }

  // When a computed loses its last subscriber it should release its sources. We may need
  // to defer the sleep call: while a flush is in progress, a follow-up subscriber inside
  // the same flush should be able to cancel the sleep before it runs, so we queue it as a
  // microtask and a re-subscribe in `get()` removes the pending entry before this fires.
  #sleepOrNotify() {
    const sleep = state.sleepFns.get(this);
    if (sleep === undefined) {
      notifySignalZeroSubscribers(this);
      if (typeof this._onZeroSubscribers === 'function') { this._onZeroSubscribers(); }
      return;
    }
    // A synchronous downstream computed can also release and reacquire a list during
    // notification. Keep its owned rows awake through that transient unsubscribe.
    if (!state.inFlush && !(state.notificationDepth !== 0 && state.computedLifecycle.has(this))) {
      sleep();
      if (typeof this._onZeroSubscribers === 'function') { this._onZeroSubscribers(); }
      return;
    }
    state.pendingSleep.add(this);
    queueMicrotask(() => {
      if (!state.pendingSleep.delete(this)) { return; }
      sleep();
      if (typeof this._onZeroSubscribers === 'function') { this._onZeroSubscribers(); }
    });
  }

  // First subscriber resumes a sleeping computed (or cancels a deferred sleep). Plain
  // signals have no wake function; the call is a no-op for them.
  //
  // External subscribers (kensington/live's transport) can also install
  // `_onFirstSubscriber` / `_onZeroSubscribers` callbacks on the signal
  // instance to participate in the sleep/wake cycle. The hooks are called
  // alongside the internal computed-sleep machinery; either, both, or
  // neither may be set.
  #wakeIfSleeping() {
    const wasPending = state.pendingSleep.delete(this);
    if (wasPending) { return; }
    const wake = state.wakeFns.get(this);
    if (wake !== undefined) { wake(); }
    if (typeof this._onFirstSubscriber === 'function') { this._onFirstSubscriber(); }
  }
}

// _bindingUnsubscribe is identical to _unsubscribeFromRun: a binding effect that's been
// paused or stopped needs the same teardown as any other run leaving the subscriber set.
// Aliased on the prototype so the binding path has a clear name without a duplicate body.
Signal.prototype._bindingUnsubscribe = Signal.prototype._unsubscribeFromRun;

function track(run, fn) {
  const cleanups = run._cleanups;
  for (let i = 0; i < cleanups.length; i++) {
    cleanups[i]._unsubscribeFromRun(run);
  }
  run._cleanups = [];
  run._reads = new Set();
  const prev = state.currentEffect;
  state.currentEffect = run;
  try {
    return _reactiveRuntime.run(run._validation, fn);
  } finally {
    state.currentEffect = prev;
  }
}

/**
 * Runs `fn` immediately and re-runs it whenever any signal read via `.get()` inside changes.
 * Reruns are automatically batched in a microtask. applyPendingReactiveUpdates() runs pending work immediately.
 * Returns `{ pause(), resume(), stop() }`. `pause()` unsubscribes temporarily; `resume()` restarts.
 * `stop()` permanently destroys the effect. Calling `resume()` after `stop()` is a no-op.
 * @param {function(): void} fn The effect body. Signal reads inside it become dependencies.
 * @param {boolean} [isInternal=false] When true, marks the effect's run as `_isInternal` so
 *   `Signal.get()` skips the `out-of-scope-reactive-reference` warning for subscriptions made
 *   inside it, and devtools categorises it as a DOM binding. Used by `_internalEffect` and
 *   `_bindingEffect` for library-managed effects whose lifetime is tied to the DOM, not to
 *   user-land scope.
 * @returns {{ pause: function(): void, resume: function(): void, stop: function(): void }}
 */
function createEffect(fn, isInternal = false) {
  _reactiveRuntime.check('effect()');
  if (isSSRMode()) {
    return { pause() {}, resume() {}, stop() {} };
  }
  // Effects born inside a connectedCallback are DOM-scoped: the caller
  // is expected to stop them via addDisconnectedCallback. Treat them as
  // internal so Signal.get() skips the out-of-scope-reactive-reference
  // warning — the subscriber dies with the element, not with any outer
  // computed, so the usual leak concern does not apply.
  if (!isInternal && state.insideConnectedCallbackDepth > 0) {
    isInternal = true;
  }
  let paused = false;
  let destroyed = false;
  const _devId = notifyEffectCreate(fn);
  function run() {
    if (paused) {
      return;
    }
    notifyEffectRun(_devId);
    track(run, fn);
  }
  run._cleanups = [];
  run._validation = _reactiveRuntime.capture();
  run._isEffect = true;
  run._isInternal = isInternal;
  run._devId = _devId;
  function unsubscribe() {
    state.pending.delete(run);
    const cleanups = run._cleanups;
    for (let i = 0; i < cleanups.length; i++) {
      cleanups[i]._unsubscribeFromRun(run);
    }
    run._cleanups = [];
  }
  try {
    run();
  } catch (err) {
    // effect() cannot return a handle when its initial run throws. Tear down any
    // dependencies read before the error so an unreachable effect is not left active.
    paused = true;
    destroyed = true;
    unsubscribe();
    notifyEffectStop(_devId);
    throw err;
  }
  return {
    _devId,
    pause() {
      paused = true;
      unsubscribe();
      notifyEffectPause(_devId);
    },
    resume() {
      if (destroyed) {
        return;
      }
      paused = false;
      notifyEffectResume(_devId);
      run();
    },
    stop() {
      this.pause();
      destroyed = true;
      notifyEffectStop(_devId);
    },
  };
}

export function effect(fn) {
  if (state.mapWithKeyInnerDepth > 0) {
    throttledError(
      'effect-in-computed',
      'kensington: effect() called inside a mapWithKey mapFn (a computed-like callback). ' +
      'A new effect is started on every re-run and the previous one is never stopped. ' +
      'Create effects outside the mapFn.',
    );
  } else if (!state.suppressReactiveCheck) {
    if (state.inComputedFn) {
      throttledError(
        'effect-in-computed',
        'kensington: effect() called inside a computed or transform callback. ' +
        'A new effect is started on every re-run and the previous one is never stopped. ' +
        'Create effects outside the reactive callback.',
      );
    } else if (state.currentEffect !== null) {
      throttledError(
        'effect-in-effect',
        'kensington: effect() called inside an effect callback. ' +
        'A new effect is started on every re-run and the previous one is never stopped. ' +
        'Create effects at the top level or return a cleanup from the outer effect.',
      );
    }
  }
  return createEffect(fn);
}

// For library-internal use only. Creates an effect without the effect-in-effect/computed
// warning checks. Lifecycle.js legitimately creates effects inside running effects during
// reconcile, and those effects are correctly managed and stopped by dom-tracker. The
// `_isInternal` flag also tells Signal.get() to skip the keyed-computed-external-subscriber
// warning: DOM-binding effects subscribing to a keyed inner are part of the owner's own
// render cycle, so their lifetime is tied to the DOM and not a true external escape.
export function _internalEffect(fn) {
  return createEffect(fn, true);
}

// Internal: lightweight effect that subscribes to exactly one signal and calls fn(value)
// whenever that signal changes. Bypasses track() entirely. No _cleanups array, no
// per-rerun unsubscribe/resubscribe round-trip, no currentEffect dance. Lifecycle bindings
// (signal-bound attribute, signal-bound content, signal-bound prop) read exactly one
// signal, so this fast path collapses ~20k subscribe+resubscribe pairs to plain calls in
// benchmarks that fire many signal updates.
export function _bindingEffect(sig, fn) {
  _reactiveRuntime.check('DOM binding', sig[RUNTIME_OWNER] ?? sig.constructor);
  if (isSSRMode()) {
    return { pause() {}, resume() {}, stop() {} };
  }
  let paused = false;
  let destroyed = false;
  const _devId = notifyEffectCreate(fn);
  const validation = _reactiveRuntime.capture();
  function run() {
    if (paused) { return; }
    notifyEffectRun(_devId);
    _reactiveRuntime.run(validation, () => fn(sig.value));
  }
  run._isEffect = true;
  run._isInternal = true;
  run._devId = _devId;
  // _cleanups stays empty: _bindingEffect doesn't go through track(), so there are no
  // tracked subscriptions to tear down. The field exists for shape consistency with
  // effects that DO use track() (some lifecycle code iterates run._cleanups generically).
  run._cleanups = [];
  function unsubscribe() {
    if (paused) { return; }
    paused = true;
    state.pending.delete(run);
    sig._bindingUnsubscribe(run);
  }
  sig._bindingSubscribe(run);
  try {
    run();
  } catch (err) {
    unsubscribe();
    notifyEffectStop(_devId);
    throw err;
  }
  return {
    _devId,
    pause() {
      if (paused) { return; }
      unsubscribe();
      notifyEffectPause(_devId);
    },
    resume() {
      if (destroyed || !paused) { return; }
      paused = false;
      sig._bindingSubscribe(run);
      notifyEffectResume(_devId);
      run();
    },
    stop() {
      if (destroyed) { return; }
      unsubscribe();
      destroyed = true;
      notifyEffectStop(_devId);
    },
  };
}

/**
 * Creates a read-only signal derived from other signals. Re-runs automatically whenever
 * any signal read via `.get()` inside the function changes. Call `.stop()` to unsubscribe
 * from all tracked signals and freeze the value.
 *
 * When called inside another `computed` callback with a stable `key`, returns the same
 * inner computed instance across outer re-runs. The fn closure is updated on each outer
 * re-run so the inner computed always reflects the latest captured variables.
 * @template T
 * @param {function(): T} fn
 * @param {string | number | object | symbol} [key]
 * @returns {Signal<T>}
 * @example
 * const active = signal(true);
 * const cls = computed(() => active.get() ? 'btn-primary' : 'btn-outline');
 * @example
 * // Keyed computed inside a computed. Stable instance per key across outer re-runs.
 * const list = computed(() => items.get().map(item =>
 *   computed(() => item.label.toUpperCase(), item.id).get()
 * ));
 */
export function computed(fn, key) {
  _reactiveRuntime.check('computed()');
  // Keyed path: inside an outer computed with a stable key → reuse the same inner computed
  // across outer re-runs, updating the fn closure each time so captured variables stay fresh.
  if (key !== undefined && state.currentComputed !== null) {
    const owner = state.currentComputed;
    let computedReg = state.keyedComputedRegistries.get(owner);
    if (computedReg === undefined) {
      computedReg = { computeds: new Map(), accessed: new Set() };
      state.keyedComputedRegistries.set(owner, computedReg);
    }
    if (computedReg.accessed.has(key)) {
      throttledError(
        'duplicate-keyed-computed',
        `kensington: computed() called twice with key "${key}" in the same computed run. ` +
        'Each keyed computed needs a unique key per computed run, or two items will share state. ' +
        'Use a key that includes the item identity (e.g., item.id).',
      );
    }
    computedReg.accessed.add(key);
    const existing = computedReg.computeds.get(key);
    if (existing !== undefined) {
      // Update the fn wrapper so the inner computed reflects any outer-scope variable changes,
      // then increment the version signal to trigger a re-run. versionSig is a plain number
      // counter. Avoids the issue where Signal.set() treats function arguments as updaters.
      if (existing.fnWrapper.fn !== fn) {
        existing.fnWrapper.fn = fn;
        state.derivedWriteDepth++;
        try {
          existing.versionSig.set(v => v + 1);
        } finally {
          state.derivedWriteDepth--;
        }
      }
      return existing.inner;
    }
    // First time this key is seen: create a mutable fn wrapper and a version counter signal,
    // then create an inner computed that calls fnWrapper.fn() and re-runs when the version
    // increments. Temporarily clear all reactive context so the recursive computed() call
    // below does not trigger warnings and does not enter the keyed path.
    const prevSuppress1 = state.suppressReactiveCheck;
    state.suppressReactiveCheck = true;
    const versionSig = new Signal(0);
    state.suppressReactiveCheck = prevSuppress1;
    const fnWrapper = { fn };
    const prevInComputedFn = state.inComputedFn;
    const prevCurrentComputed = state.currentComputed;
    const prevCurrentEffect = state.currentEffect;
    state.inComputedFn = false;
    state.currentComputed = null;
    state.currentEffect = null;
    let inner;
    try {
      // Register the inner's owner inside the first call to fnWrapper.fn() so signal reads
      // during the first update can see that this inner is a sibling of the keyed source
      // (same owner). Without this, the very first run leaks an `out-of-scope-reactive-reference`
      // warning before the outer `keyedScopeOwners.set(inner, owner)` below has fired.
      inner = computed(() => {
        if (state.currentComputed !== null && !state.keyedScopeOwners.has(state.currentComputed)) {
          state.keyedScopeOwners.set(state.currentComputed, owner);
        }
        versionSig.get();
        return fnWrapper.fn();
      });
    } finally {
      state.inComputedFn = prevInComputedFn;
      state.currentComputed = prevCurrentComputed;
      state.currentEffect = prevCurrentEffect;
    }
    state.keyedScopeOwners.set(inner, owner);
    computedReg.computeds.set(key, { versionSig, fnWrapper, inner });
    notifySignalMarkKeyed(inner, key);
    return inner;
  }

  // Under SSR we want the value but not the subscription. Subscribing to a source signal
  // that outlives the request (e.g. a module-level signal) would permanently retain the
  // computed's update function in that source's subscriber set, leaking once per request.
  // currentEffect is null here, so reading sources via .get() inside fn() will not
  // register a subscription either.
  if (isSSRMode()) {
    const s = new Signal(fn());
    state.derivedSignals.add(s);
    notifySignalMarkComputed(s);
    return s;
  }
  // We defer the nested `computed-in-computed` / `transform-in-computed` warning until we
  // see who actually subscribes. Only fire when a non-internal subscriber attaches; internal
  // consumers (attribute/class/text bindings) are safe.
  let deferredNestedKind = null;
  if (!state.suppressReactiveCheck) {
    if (state.inComputedFn) {
      deferredNestedKind = state.computedCallSite === 'transform' ? 'transform' : 'computed';
    } else if (state.currentEffect !== null) {
      throttledError(
        'computed-in-effect',
        'kensington: computed() called inside an effect callback. ' +
        'A new computed is created on every effect re-run and the previous one is never stopped. ' +
        'Create computeds outside the effect or call .transform() on a signal that outlives the effect.',
      );
    }
  }
  const prevSuppress = state.suppressReactiveCheck;
  state.suppressReactiveCheck = true;
  const s = new Signal(undefined);
  state.suppressReactiveCheck = prevSuppress;
  if (deferredNestedKind !== null) { state.pendingNestedWarning.set(s, deferredNestedKind); }
  notifySignalMarkComputed(s);
  // Tracks the last successfully computed value so notifySignalWake can restore it.
  // Without this, a wake where s.set(result) is a no-op (Object.is match) would leave
  // the devtools entry at value: undefined from notifySignalWake forever.
  let lastResult;
  function update() {
    track(update, () => {
      let result;
      const prevInComputedFn = state.inComputedFn;
      const prevComputed = state.currentComputed;
      state.inComputedFn = true;
      state.currentComputed = s;
      // Reset accessed-key tracking for this run. Any registry entry whose key isn't
      // accessed during this run is swept after the run completes.
      const registry = state.keyedRegistries.get(s);
      if (registry !== undefined) { registry.accessed.clear(); }
      const computedReg = state.keyedComputedRegistries.get(s);
      if (computedReg !== undefined) { computedReg.accessed.clear(); }
      try {
        result = fn();
      } catch (err) {
        rethrowAsync(err);
        return;
      } finally {
        state.inComputedFn = prevInComputedFn;
        state.currentComputed = prevComputed;
      }
      // Sweep keyed signals that weren't touched this run. Their owning item left the list
      // (or was renamed); stop the signal and drop it from the registry so it can be GC'd.
      if (registry !== undefined) {
        for (const [k, sig] of registry.signals) {
          if (!registry.accessed.has(k)) {
            sig.stop();
            registry.signals.delete(k);
          }
        }
      }
      // Sweep keyed inner computeds that weren't touched this run.
      if (computedReg !== undefined) {
        for (const [k, entry] of computedReg.computeds) {
          if (!computedReg.accessed.has(k)) {
            entry.inner.stop();
            entry.versionSig.stop();
            computedReg.computeds.delete(k);
          }
        }
      }
      lastResult = result;
      state.derivedWriteDepth++;
      try {
        s.set(result);
      } catch (err) {
        rethrowAsync(err);
      } finally {
        state.derivedWriteDepth--;
      }
    });
  }
  update._cleanups = [];
  state.computedUpdates.set(s, update);
  update._validation = _reactiveRuntime.capture();
  if (state.nextComputedInternal) {
    update._isInternal = true;
    state.nextComputedInternal = false;
  }
  update();
  // sleeping is false initially: the computed is active (subscribed to sources) even though
  // it has no subscribers yet. It becomes true only after losing its last subscriber, at
  // which point sources are unsubscribed and the value is frozen until a new subscriber wakes it.
  let sleeping = false;
  state.sleepFns.set(s, () => {
    if (sleeping) { return; }
    sleeping = true;
    state.pendingComputeds.delete(update);
    // Suppress during transient wakeForRead reads (.toJSON(), .value, .get() outside reactive
    // context) so serializing a value that contains sleeping computed signals does not emit
    // spurious computed:stop events and trigger unnecessary devtools re-renders.
    if (!state.suppressWakeNotify) { notifySignalStop(s); }
    const cleanups = update._cleanups;
    for (let i = 0; i < cleanups.length; i++) {
      cleanups[i]._unsubscribeFromRun(update);
    }
    update._cleanups = [];
    state.computedLifecycle.get(s)?.sleep?.();
  });
  state.wakeFns.set(s, () => {
    if (!sleeping) { return false; }
    sleeping = false;
    // Re-add to devtools before update() so notifySignalSet can find the entry.
    // suppressWakeNotify is true when called from wakeForRead (transient read for toJSON/.value),
    // so those reads stay silent and don't produce temporary devtools entries.
    if (!state.suppressWakeNotify) { notifySignalWake(s, lastResult); }
    update();
    return true;
  });
  state.stopFns.set(s, () => {
    state.pendingComputeds.delete(update);
    state.computedUpdates.delete(s);
    state.computedLifecycle.get(s)?.stop?.();
    state.computedLifecycle.delete(s);
    state.pendingSleep.delete(s);
    state.sleepFns.delete(s);
    state.wakeFns.delete(s);
    const cleanups = update._cleanups;
    for (let i = 0; i < cleanups.length; i++) {
      cleanups[i]._unsubscribeFromRun(update);
    }
    update._cleanups = [];
    // Stop any keyed signals that this computed owned, so their subscribers are cleared
    // and devtools entries are removed.
    const registry = state.keyedRegistries.get(s);
    if (registry !== undefined) {
      for (const sig of registry.signals.values()) {
        sig.stop();
      }
      state.keyedRegistries.delete(s);
    }
    // Stop any keyed inner computeds that this computed owned.
    const computedReg = state.keyedComputedRegistries.get(s);
    if (computedReg !== undefined) {
      for (const { inner, versionSig } of computedReg.computeds.values()) {
        inner.stop();
        versionSig.stop();
      }
      state.keyedComputedRegistries.delete(s);
    }
  });
  state.derivedSignals.add(s);
  return s;
}

/**
 * Creates a reactive signal. Pass as content or an attribute value. The DOM updates live.
 * When called inside a computed callback with a stable `key`, returns the same signal
 * instance across re-runs (scoped to that computed). This is the recommended pattern for
 * local interactive state inside list mappings: pass the item's id as the key.
 *
 * See also `computed(fn, key)` for keying a derived computation to a list item.
 * @template T
 * @param {T} initial
 * @param {string | number | object | symbol} [key]
 * @returns {Signal<T>}
 * @example
 * // Module-level signal. Same instance for the lifetime of the page.
 * const count = signal(0);
 * @example
 * // Keyed signal inside mapWithKey. Same instance per key across re-runs.
 * const list = items.mapWithKey('id', item => {
 *   const highlight = signal(false, item.id);
 *   return t.li({ class: highlight }, item.label);
 * });
 */
export function signal(initial, key) {
  const hydrationScope = getCurrentHydrationScope();
  if (key !== undefined && state.currentComputed === null && hydrationScope !== null) {
    const scope = hydrationScope;
    const existing = scope.signals.get(key);
    if (existing !== undefined) {
      warnKeyedInitialMismatch(key, scope.initials.get(key), initial);
      return existing;
    }
    const prevSuppress = state.suppressReactiveCheck;
    state.suppressReactiveCheck = true;
    const sig = new Signal(initial);
    state.suppressReactiveCheck = prevSuppress;
    scope.signals.set(key, sig);
    scope.initials.set(key, initial);
    return sig;
  }
  if (key !== undefined && state.currentComputed !== null) {
    const owner = state.currentComputed;
    let registry = state.keyedRegistries.get(owner);
    if (registry === undefined) {
      registry = { signals: new Map(), accessed: new Set(), initials: new Map() };
      state.keyedRegistries.set(owner, registry);
    }
    if (registry.accessed.has(key)) {
      throttledError(
        'duplicate-keyed-signal',
        `kensington: signal() called twice with key "${key}" in the same computed run. ` +
        'Each keyed signal needs a unique key per computed run, or two items will share state. ' +
        'Use a key that includes the item identity (e.g., item.id).',
      );
    }
    registry.accessed.add(key);
    const existing = registry.signals.get(key);
    if (existing !== undefined) {
      warnKeyedInitialMismatch(key, registry.initials.get(key), initial);
      return existing;
    }
    // Suppress the signal-in-computed warning. Keyed signals are the intended pattern;
    // a warning would fire on every fresh key (every item added to a list).
    const prevSuppress = state.suppressReactiveCheck;
    state.suppressReactiveCheck = true;
    const sig = new Signal(initial);
    state.suppressReactiveCheck = prevSuppress;
    notifySignalMarkKeyed(sig, key);
    state.keyedScopeOwners.set(sig, owner);
    registry.signals.set(key, sig);
    registry.initials.set(key, initial);
    return sig;
  }
  return new Signal(initial);
}

// Defined here rather than in the class body because transform calls computed, and computed
// must be defined after Signal (it creates one). Putting this inside the class would reference
// computed before its definition, triggering no-use-before-define.
//
// The optional `key` argument is forwarded to computed. Inside an outer `computed` callback,
// a keyed transform returns the same inner instance across outer re-runs. Same lifecycle as
// `computed(fn, key)`. Outside a computed the key is ignored.
Signal.prototype.transform = function transform(fn, key) {
  const prev = state.computedCallSite;
  state.computedCallSite = 'transform';
  try {
    return computed(() => fn(this.get()), key);
  } finally {
    state.computedCallSite = prev;
  }
};

// Library-internal computed creator. Pairs with `_internalEffect`. Clears the outer reactive
// context around the `computed()` call so the "computed-in-computed without key" entry warning
// (meant for user mistakes) does not fire when the library itself is intentionally creating
// an inner computed (e.g. mapWithKey's per-key reactive path).
export function _internalComputed(fn, options) {
  const prevInComputedFn = state.inComputedFn;
  const prevCurrentEffect = state.currentEffect;
  state.inComputedFn = false;
  state.currentEffect = null;
  state.nextComputedInternal = true;
  try {
    const result = computed(fn);
    if (options !== undefined && !isSSRMode()) {
      state.computedUpdates.get(result)._coalesce = options.coalesce === true;
      state.computedLifecycle.set(result, options);
    }
    return result;
  } finally {
    state.inComputedFn = prevInComputedFn;
    state.currentEffect = prevCurrentEffect;
    // computed(fn) consumed the flag; clear it on the throw path too.
    state.nextComputedInternal = false;
  }
}

export function _isInReactiveContext() {
  return state.inComputedFn || state.currentEffect !== null;
}

export function _enterMapWithKeyInner() { state.mapWithKeyInnerDepth++; }
export function _exitMapWithKeyInner() { state.mapWithKeyInnerDepth--; }
export function _isInMapWithKeyInner() { return state.mapWithKeyInnerDepth > 0; }

Signal.prototype.mapWithKey = mapWithKey;

// A signal whose value is renderable can be rendered directly. toElement() returns a
// DocumentFragment with two comment-node anchors surrounding the rendered content.
// reconcile reads the live parent on each update; adoption into a real parent after
// construction is supported. The effect stops when the start anchor (or any ancestor)
// leaves the DOM, via dom-tracker.
Signal.prototype.toElement = function toElement() {
  return renderSignalAsTag(this);
};

Signal.prototype.mount = function mount(target) {
  if (!target || typeof target.appendChild !== 'function') {
    throw new Error('Signal.mount(target) requires a DOM element');
  }
  target.appendChild(this.toElement());
};

Signal.prototype._isKensingtonSignal = true;
Object.defineProperty(Signal.prototype, RUNTIME_OWNER, { value: _reactiveRuntime.token });

export function isKensingtonSignal(v) {
  return v !== null && typeof v === 'object' && v._isKensingtonSignal === true;
}
