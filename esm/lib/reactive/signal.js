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
import { renderSignalAsTag } from './signal-render.js';
import { isSSRMode } from './ssr.js';
import { throttledError, throttledWarn, warnKeyedInitialMismatch } from './warnings.js';

let currentEffect = null;
const pending = new Set();
const runCounts = new Map();
const MAX_EFFECT_LOOPS = 100;
const MAX_FLUSHES = 500;
let scheduled = false;
let flushCount = 0;
let flushResetScheduled = false;
let inComputedFn = false;
let suppressReactiveCheck = false;
// Set by _internalComputed before calling computed(fn) so the new computed's
// update closure is marked internal. Library-internal wrappers (class-list
// builder, attribute composition, mapWithKey's per-key inner) should not trip
// user-facing warnings about out-of-scope reactive references when they read
// keyed signals owned by user scopes.
let nextComputedInternal = false;
let suppressWakeNotify = false;
let inFlush = false;
// Set true while mapWithKey runs mapFn under a probe to detect whether it reads or creates
// reactive primitives. A keyed signal/computed creation during the probe forces an upgrade
// to the reactive path (mapFn re-runs under a full per-key inner computed) so the keyed
// primitive lives in a stable per-row scope.
let inMapWithKeyProbe = false;
let mapWithKeyProbeNeedsReactive = false;
// Depth counter set true while a mapWithKey mapFn body is executing (either under the probe
// or inside the real per-key inner computed). Recursive mapWithKey calls (a row component
// that maps its own children) are safe because the inner mapFn only runs once per key, so
// the mapwithkey-in-reactive warning is suppressed for this case.
let mapWithKeyInnerDepth = 0;
const stopFns = new WeakMap();
// sleep/wake hooks for auto-disposing computed signals when subscriber count hits zero.
const sleepFns = new WeakMap();
const wakeFns = new WeakMap();
// Computed signals whose sleep has been deferred until after the current flush. If the
// subscriber comes back before the microtask fires (the common case when a DOM-binding
// effect re-runs), the entry is removed and sleep is canceled. No sleep/wake round-trip.
const pendingSleep = new Set();
// Tracks signals created by computed()/transform() so .set() can be blocked on them.
const derivedSignals = new WeakSet();
// Counter rather than boolean so nested computed calls don't prematurely re-enable the guard.
let derivedWriteDepth = 0;

// Tracks the innermost computed currently running, so signal(initial, key) can scope
// keyed signal lookups to that computed instance. Saved/restored as a stack across nested
// computed runs (which are warned against but otherwise tolerated).
let currentComputed = null;
// Set by Signal.prototype.transform before it calls computed() so the warning fired from
// inside computed() can use transform-specific wording. Cleared in transform's finally.
let computedCallSite = null;
// Per-computed registry of keyed signals. Each entry has `signals: Map<key, Signal>` and
// `accessed: Set<key>`. After each computed run, keys not accessed are stopped and removed,
// so signals tied to items that have left the list are cleaned up automatically.
const keyedRegistries = new WeakMap();
// Per-computed registry of keyed inner computeds. Same lifecycle as keyedRegistries.
// Each entry has `computeds: Map<key, { fnSig: Signal, inner: Signal }>` and `accessed: Set<key>`.
// fnSig holds the current fn closure; setting it triggers the inner computed to re-run with the
// updated fn, which handles the case where the fn captures outer-scope variables that changed.
const keyedComputedRegistries = new WeakMap();
// Maps a keyed inner Signal (signal, computed, or transform created inside a computed
// callback with a stable key) back to its owner outer computed. Signal.get() warns when
// something outside the owner subscribes. The owner can stop the inner at any time when
// its key isn't accessed during a re-run, so external references silently drop subscribers.
const keyedScopeOwners = new WeakMap();

function rethrowAsync(err) {
  queueMicrotask(() => { throw err; });
}

function flush() {
  scheduled = false;
  flushCount++;
  if (!flushResetScheduled) {
    flushResetScheduled = true;
    setTimeout(() => { flushCount = 0; flushResetScheduled = false; }, 0);
  }
  if (flushCount > MAX_FLUSHES) {
    throttledError(
      'async-loop',
      `kensington: async reactive loop detected. flush() was called ${flushCount} times without a macrotask turn. ` +
      'An effect is likely setting a signal inside a queueMicrotask or Promise callback in a cycle. ' +
      'Guard the write with a condition check to confirm the update is still needed before calling .set().',
    );
    pending.clear();
    return;
  }
  runCounts.clear();
  inFlush = true;
  try {
    while (pending.size > 0) {
      const batch = [...pending];
      pending.clear();
      for (const fn of batch) {
        const count = (runCounts.get(fn) ?? 0) + 1;
        runCounts.set(fn, count);
        if (count > MAX_EFFECT_LOOPS) {
          throttledError(
            'sync-loop',
            `kensington: reactive loop detected. The same effect was re-queued ${count} times in a single flush. ` +
            'Check for an effect that writes to a signal it also reads, or two effects that write to each other\'s signal dependencies. ' +
            'For effects with async callbacks (queueMicrotask, setTimeout, fetch), guard the write with a condition check to confirm the update is still needed before calling .set().',
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
    inFlush = false;
  }
  runCounts.clear();
}

function scheduleRun(fn) {
  pending.add(fn);
  if (!scheduled) {
    scheduled = true;
    queueMicrotask(flush);
  }
}

function wakeForRead(sig) {
  const wake = wakeFns.get(sig);
  if (wake !== undefined) {
    suppressWakeNotify = true;
    const woken = wake();
    if (woken) {
      const sleep = sleepFns.get(sig);
      if (sleep !== undefined) { sleep(); }
    }
    suppressWakeNotify = false;
  }
}

export default class Signal {
  #value;
  #subscribers = new Set();

  constructor(initial) {
    this.#value = initial;
    notifySignalCreate(this, initial);
    if (!suppressReactiveCheck) {
      if (inComputedFn) {
        throttledWarn(
          'signal-in-computed',
          'kensington: signal() called inside a computed or transform callback without a key. ' +
          'The DOM node will be replaced when outer state changes. ' +
          'Focus, scroll, input value, and selection are preserved across the replacement, ' +
          'but local signal state resets to the initial value. ' +
          'For best performance and to persist local state, pass a stable key as the second argument: signal(initial, key).',
        );
      } else if (currentEffect !== null) {
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
    if (currentEffect !== null && !this.#subscribers.has(currentEffect)) {
      if (this.#subscribers.size === 0) {
        // Defer to the shared wakeup helper so we also fire _onFirstSubscriber.
        // The inline-only path used to wake computeds but skip the external
        // hook (kensington/live's MSG_SUBSCRIBE), which silently desynced live
        // signals whose subscriber count went 0 → 1 via a .get() inside a
        // computed/effect (the common case). _bindingSubscribe already routes
        // through #wakeIfSleeping; .get() must too.
        this.#wakeIfSleeping();
      }
      this.#subscribers.add(currentEffect);
      currentEffect._reads.add(this);
      notifySignalEffectSubscription(this, currentEffect._devId, this.#subscribers.size);
      const ownerSig = keyedScopeOwners.get(this);
      // Sibling keyed primitives (created inside the same owner scope) read each other safely.
      // Their lifetime is tied to the same owner, so a drop affects both together. The warning
      // is for genuinely out-of-scope references held outside the owner's sweep.
      const subscriberOwner = currentComputed === null ? undefined : keyedScopeOwners.get(currentComputed);
      if (
        ownerSig !== undefined
        && currentComputed !== ownerSig
        && subscriberOwner !== ownerSig
        && !currentEffect._isInternal
      ) {
        throttledWarn(
          'out-of-scope-reactive-reference',
          'kensington: a signal/computed/transform created inside a computed callback is being subscribed to from outside its owning scope. ' +
          'If the owning computed re-runs and temporarily drops this key (e.g. during a loading state), ' +
          'the instance will be stopped and this subscriber will receive no further updates. ' +
          'Consume the value inline (call .get() on it, or pass it directly to a tag) instead of passing the instance out.',
        );
      }
      currentEffect._cleanups.push(this);
    } else if (currentEffect === null) {
      wakeForRead(this);
    }
    return this.#value;
  }

  get value() {
    wakeForRead(this);
    return this.#value;
  }

  set(valueOrFn) {
    // Blocks external writes to computed/transform signals; depth > 0 means we're inside an update().
    if (derivedSignals.has(this) && derivedWriteDepth === 0) {
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
    if (currentEffect !== null && currentEffect._reads.has(this)) {
      throttledError(
        'set-in-effect',
        'kensington: a signal was read via .get() and written via .set() in the same effect or computed run. ' +
        'This creates a reactive loop. The write re-triggers the run, which writes again. ' +
        'Use .value instead of .get() if you need the current value without subscribing.',
      );
    }
    if (inComputedFn && derivedWriteDepth === 0) {
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
    for (const fn of [...this.#subscribers]) {
      if (fn._isEffect) {
        scheduleRun(fn);
      } else {
        fn(this.#value);
      }
    }
  }

  // Internal. Used by kensington/live to apply a value received from the server
  // without re-broadcasting it. Bypasses the derived-signal guard and the
  // set-in-effect / set-in-computed loop checks (a remote-origin update can
  // legitimately land while local code is reading the signal). Still notifies
  // subscribers so DOM bindings update.
  _setFromRemote(next) {
    if (Object.is(next, this.#value)) {
      return;
    }
    this.#value = next;
    notifySignalSet(this, next, this.#subscribers.size);
    for (const fn of [...this.#subscribers]) {
      if (fn._isEffect) {
        scheduleRun(fn);
      } else {
        fn(this.#value);
      }
    }
  }

  stop() {
    const fn = stopFns.get(this);
    if (fn !== undefined) {
      fn();
      stopFns.delete(this);
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
    const sleep = sleepFns.get(this);
    if (sleep === undefined) {
      notifySignalZeroSubscribers(this);
      if (typeof this._onZeroSubscribers === 'function') { this._onZeroSubscribers(); }
      return;
    }
    if (!inFlush) { sleep(); if (typeof this._onZeroSubscribers === 'function') { this._onZeroSubscribers(); } return; }
    pendingSleep.add(this);
    queueMicrotask(() => {
      if (!pendingSleep.delete(this)) { return; }
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
    const wasPending = pendingSleep.delete(this);
    if (wasPending) { return; }
    const wake = wakeFns.get(this);
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
  const prev = currentEffect;
  currentEffect = run;
  try {
    return fn();
  } finally {
    currentEffect = prev;
  }
}

/**
 * Runs `fn` immediately and re-runs it whenever any signal read via `.get()` inside changes.
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
  if (isSSRMode()) {
    return { pause() {}, resume() {}, stop() {} };
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
  run._isEffect = true;
  run._isInternal = isInternal;
  run._devId = _devId;
  run();
  return {
    _devId,
    pause() {
      paused = true;
      pending.delete(run);
      const cleanups = run._cleanups;
      for (let i = 0; i < cleanups.length; i++) {
        cleanups[i]._unsubscribeFromRun(run);
      }
      run._cleanups = [];
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
  if (inMapWithKeyProbe) {
    // The probe sets currentEffect to a sentinel and turns on suppressReactiveCheck
    // to silence the signal()/computed() in-computed warnings. effect() is the one
    // case where we still want a diagnostic, because the call cannot be valid here
    // (a fresh effect leaks on every probe re-run). Emit a mapWithKey-specific
    // message so the user is not sent looking for an outer effect that does not
    // exist.
    throttledError(
      'effect-in-computed',
      'kensington: effect() called inside a mapWithKey mapFn (a computed-like callback). ' +
      'A new effect is started on every re-run and the previous one is never stopped. ' +
      'Create effects outside the mapFn.',
    );
  } else if (!suppressReactiveCheck) {
    if (inComputedFn) {
      throttledError(
        'effect-in-computed',
        'kensington: effect() called inside a computed or transform callback. ' +
        'A new effect is started on every re-run and the previous one is never stopped. ' +
        'Create effects outside the reactive callback.',
      );
    } else if (currentEffect !== null) {
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
  if (isSSRMode()) {
    return { pause() {}, resume() {}, stop() {} };
  }
  let paused = false;
  let destroyed = false;
  const _devId = notifyEffectCreate(fn);
  function run() {
    if (paused) { return; }
    notifyEffectRun(_devId);
    fn(sig.value);
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
    pending.delete(run);
    sig._bindingUnsubscribe(run);
  }
  sig._bindingSubscribe(run);
  run();
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
  if (inMapWithKeyProbe && key !== undefined) {
    mapWithKeyProbeNeedsReactive = true;
  }
  // Keyed path: inside an outer computed with a stable key → reuse the same inner computed
  // across outer re-runs, updating the fn closure each time so captured variables stay fresh.
  if (key !== undefined && currentComputed !== null) {
    const owner = currentComputed;
    let computedReg = keyedComputedRegistries.get(owner);
    if (computedReg === undefined) {
      computedReg = { computeds: new Map(), accessed: new Set() };
      keyedComputedRegistries.set(owner, computedReg);
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
        derivedWriteDepth++;
        try {
          existing.versionSig.set(v => v + 1);
        } finally {
          derivedWriteDepth--;
        }
      }
      return existing.inner;
    }
    // First time this key is seen: create a mutable fn wrapper and a version counter signal,
    // then create an inner computed that calls fnWrapper.fn() and re-runs when the version
    // increments. Temporarily clear all reactive context so the recursive computed() call
    // below does not trigger warnings and does not enter the keyed path.
    const prevSuppress1 = suppressReactiveCheck;
    suppressReactiveCheck = true;
    const versionSig = new Signal(0);
    suppressReactiveCheck = prevSuppress1;
    const fnWrapper = { fn };
    const prevInComputedFn = inComputedFn;
    const prevCurrentComputed = currentComputed;
    const prevCurrentEffect = currentEffect;
    inComputedFn = false;
    currentComputed = null;
    currentEffect = null;
    let inner;
    try {
      // Register the inner's owner inside the first call to fnWrapper.fn() so signal reads
      // during the first update can see that this inner is a sibling of the keyed source
      // (same owner). Without this, the very first run leaks an `out-of-scope-reactive-reference`
      // warning before the outer `keyedScopeOwners.set(inner, owner)` below has fired.
      inner = computed(() => {
        if (currentComputed !== null && !keyedScopeOwners.has(currentComputed)) {
          keyedScopeOwners.set(currentComputed, owner);
        }
        versionSig.get();
        return fnWrapper.fn();
      });
    } finally {
      inComputedFn = prevInComputedFn;
      currentComputed = prevCurrentComputed;
      currentEffect = prevCurrentEffect;
    }
    keyedScopeOwners.set(inner, owner);
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
    derivedSignals.add(s);
    notifySignalMarkComputed(s);
    return s;
  }
  if (!suppressReactiveCheck) {
    if (inComputedFn) {
      if (computedCallSite === 'transform') {
        throttledWarn(
          'transform-in-computed',
          'kensington: .transform() called inside a computed or transform callback without a key. ' +
          'The DOM node will be replaced when outer state changes. ' +
          'For best performance and to persist inner state, pass a stable key as the second argument: signal.transform(fn, key).',
        );
      } else {
        throttledWarn(
          'computed-in-computed',
          'kensington: computed() called inside a computed or transform callback without a key. ' +
          'The DOM node will be replaced when outer state changes. ' +
          'For best performance and to persist inner computed state, pass a stable key as the second argument: computed(fn, key).',
        );
      }
    } else if (currentEffect !== null) {
      throttledError(
        'computed-in-effect',
        'kensington: computed() called inside an effect callback. ' +
        'A new computed is created on every effect re-run and the previous one is never stopped. ' +
        'Create computeds outside the effect or call .transform() on a signal that outlives the effect.',
      );
    }
  }
  const prevSuppress = suppressReactiveCheck;
  suppressReactiveCheck = true;
  const s = new Signal(undefined);
  suppressReactiveCheck = prevSuppress;
  notifySignalMarkComputed(s);
  // Tracks the last successfully computed value so notifySignalWake can restore it.
  // Without this, a wake where s.set(result) is a no-op (Object.is match) would leave
  // the devtools entry at value: undefined from notifySignalWake forever.
  let lastResult;
  function update() {
    track(update, () => {
      let result;
      const prevInComputedFn = inComputedFn;
      const prevComputed = currentComputed;
      inComputedFn = true;
      currentComputed = s;
      // Reset accessed-key tracking for this run. Any registry entry whose key isn't
      // accessed during this run is swept after the run completes.
      const registry = keyedRegistries.get(s);
      if (registry !== undefined) { registry.accessed.clear(); }
      const computedReg = keyedComputedRegistries.get(s);
      if (computedReg !== undefined) { computedReg.accessed.clear(); }
      try {
        result = fn();
      } catch (err) {
        rethrowAsync(err);
        return;
      } finally {
        inComputedFn = prevInComputedFn;
        currentComputed = prevComputed;
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
      derivedWriteDepth++;
      try {
        s.set(result);
      } catch (err) {
        rethrowAsync(err);
      } finally {
        derivedWriteDepth--;
      }
    });
  }
  update._cleanups = [];
  if (nextComputedInternal) {
    update._isInternal = true;
    nextComputedInternal = false;
  }
  update();
  // sleeping is false initially: the computed is active (subscribed to sources) even though
  // it has no subscribers yet. It becomes true only after losing its last subscriber, at
  // which point sources are unsubscribed and the value is frozen until a new subscriber wakes it.
  let sleeping = false;
  sleepFns.set(s, () => {
    sleeping = true;
    // Suppress during transient wakeForRead reads (.toJSON(), .value, .get() outside reactive
    // context) so serializing a value that contains sleeping computed signals does not emit
    // spurious computed:stop events and trigger unnecessary devtools re-renders.
    if (!suppressWakeNotify) { notifySignalStop(s); }
    const cleanups = update._cleanups;
    for (let i = 0; i < cleanups.length; i++) {
      cleanups[i]._unsubscribeFromRun(update);
    }
    update._cleanups = [];
  });
  wakeFns.set(s, () => {
    if (!sleeping) { return false; }
    sleeping = false;
    // Re-add to devtools before update() so notifySignalSet can find the entry.
    // suppressWakeNotify is true when called from wakeForRead (transient read for toJSON/.value),
    // so those reads stay silent and don't produce temporary devtools entries.
    if (!suppressWakeNotify) { notifySignalWake(s, lastResult); }
    update();
    return true;
  });
  stopFns.set(s, () => {
    pendingSleep.delete(s);
    sleepFns.delete(s);
    wakeFns.delete(s);
    const cleanups = update._cleanups;
    for (let i = 0; i < cleanups.length; i++) {
      cleanups[i]._unsubscribeFromRun(update);
    }
    update._cleanups = [];
    // Stop any keyed signals that this computed owned, so their subscribers are cleared
    // and devtools entries are removed.
    const registry = keyedRegistries.get(s);
    if (registry !== undefined) {
      for (const sig of registry.signals.values()) {
        sig.stop();
      }
      keyedRegistries.delete(s);
    }
    // Stop any keyed inner computeds that this computed owned.
    const computedReg = keyedComputedRegistries.get(s);
    if (computedReg !== undefined) {
      for (const { inner, versionSig } of computedReg.computeds.values()) {
        inner.stop();
        versionSig.stop();
      }
      keyedComputedRegistries.delete(s);
    }
  });
  derivedSignals.add(s);
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
  if (inMapWithKeyProbe && key !== undefined) {
    mapWithKeyProbeNeedsReactive = true;
  }
  const hydrationScope = getCurrentHydrationScope();
  if (key !== undefined && currentComputed === null && hydrationScope !== null) {
    const scope = hydrationScope;
    const existing = scope.signals.get(key);
    if (existing !== undefined) {
      warnKeyedInitialMismatch(key, scope.initials.get(key), initial);
      return existing;
    }
    const prevSuppress = suppressReactiveCheck;
    suppressReactiveCheck = true;
    const sig = new Signal(initial);
    suppressReactiveCheck = prevSuppress;
    scope.signals.set(key, sig);
    scope.initials.set(key, initial);
    return sig;
  }
  if (key !== undefined && currentComputed !== null) {
    const owner = currentComputed;
    let registry = keyedRegistries.get(owner);
    if (registry === undefined) {
      registry = { signals: new Map(), accessed: new Set(), initials: new Map() };
      keyedRegistries.set(owner, registry);
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
    const prevSuppress = suppressReactiveCheck;
    suppressReactiveCheck = true;
    const sig = new Signal(initial);
    suppressReactiveCheck = prevSuppress;
    notifySignalMarkKeyed(sig, key);
    keyedScopeOwners.set(sig, owner);
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
  const prev = computedCallSite;
  computedCallSite = 'transform';
  try {
    return computed(() => fn(this.get()), key);
  } finally {
    computedCallSite = prev;
  }
};

// Helpers used by map-with-key.js. The probe state lives here because signal() and
// computed() need to inspect it on entry (mapWithKey's probe detects keyed signal/computed
// creation by having them flip mapWithKeyProbeNeedsReactive). Centralizing the swap here
// keeps map-with-key.js free of direct references to the module's mutable context.
export function _runMapWithKeyProbe(fn) {
  function probe() {}
  probe._cleanups = [];
  probe._reads = new Set();

  const prevCurrentEffect = currentEffect;
  const prevCurrentComputed = currentComputed;
  const prevInComputedFn = inComputedFn;
  const prevInProbe = inMapWithKeyProbe;
  const prevProbeReactive = mapWithKeyProbeNeedsReactive;
  const prevSuppress = suppressReactiveCheck;
  currentEffect = probe;
  currentComputed = null;
  inComputedFn = false;
  inMapWithKeyProbe = true;
  mapWithKeyProbeNeedsReactive = false;
  // The probe is a fake tracking context. Any warning that fires from inside mapFn during
  // the probe will fire again from the real per-key inner if the upgrade happens. Silence
  // them here so the probe is a pure detection pass.
  suppressReactiveCheck = true;

  let result;
  mapWithKeyInnerDepth++;
  try {
    result = fn();
  } finally {
    mapWithKeyInnerDepth--;
    currentEffect = prevCurrentEffect;
    currentComputed = prevCurrentComputed;
    inComputedFn = prevInComputedFn;
    inMapWithKeyProbe = prevInProbe;
    suppressReactiveCheck = prevSuppress;
  }
  const needsReactive = probe._cleanups.length > 0 || mapWithKeyProbeNeedsReactive;
  mapWithKeyProbeNeedsReactive = prevProbeReactive;

  if (needsReactive) {
    // Tear down the probe's subscriptions so the signals don't hold a dangling subscriber.
    for (let j = 0; j < probe._cleanups.length; j++) {
      probe._cleanups[j]._unsubscribeFromRun(probe);
    }
  }
  return { result, needsReactive };
}

// Library-internal computed creator. Pairs with `_internalEffect`. Clears the outer reactive
// context around the `computed()` call so the "computed-in-computed without key" entry warning
// (meant for user mistakes) does not fire when the library itself is intentionally creating
// an inner computed (e.g. mapWithKey's per-key reactive path).
export function _internalComputed(fn) {
  const prevInComputedFn = inComputedFn;
  const prevCurrentEffect = currentEffect;
  inComputedFn = false;
  currentEffect = null;
  nextComputedInternal = true;
  try {
    return computed(fn);
  } finally {
    inComputedFn = prevInComputedFn;
    currentEffect = prevCurrentEffect;
    // computed(fn) consumed the flag; clear it on the throw path too.
    nextComputedInternal = false;
  }
}

export function _isInReactiveContext() {
  return inComputedFn || currentEffect !== null;
}

export function _enterMapWithKeyInner() { mapWithKeyInnerDepth++; }
export function _exitMapWithKeyInner() { mapWithKeyInnerDepth--; }
export function _isInMapWithKeyInner() { return mapWithKeyInnerDepth > 0; }

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

export function isKensingtonSignal(v) {
  return v !== null && typeof v === 'object' && v._isKensingtonSignal === true;
}
