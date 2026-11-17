import { markNextEffectAsBinding, notifyEffectElement } from './devtools.js';
import { trackForConnect, trackForStop } from './dom-tracker.js';
import {
  _bindingEffect,
  _enterConnectedCallback,
  _exitConnectedCallback,
  _internalEffect,
  _reactiveRuntime,
} from './signal.js';

/**
 * Owns the lifecycle of signal effects and connect/disconnect callbacks for a single DOM
 * element, including the persist mechanism that pauses effects on removal and resumes them
 * on re-insertion. The caller wires signal effects via `signalEffect`, then calls `finalize`
 * once with the connect/disconnect callback arrays.
 */
export function createLifecycle({ element, persist }) {
  // Store binding handles directly. One disconnect callback manages all handles,
  // avoiding per-binding lifecycle registrations and teardown closure chains.
  const effects = [];
  const devIds = [];
  const elementRef = new WeakRef(element);

  return {
    /**
     * Create a signal-tracking effect bound to this element. The effect self-stops if the
     * element is garbage-collected. It pauses on removal and resumes on reconnect when
     * persist is true, otherwise it stops permanently on removal.
     */
    signalEffect(sig, apply, label) {
      markNextEffectAsBinding(label);
      // Binding effects subscribe to exactly one signal. The value is sent into `apply`.
      // _bindingEffect skips the track()/_reads/_cleanups machinery, so re-running on
      // signal change avoids an unsubscribe/resubscribe pair per fire.
      const eff = _bindingEffect(sig, val => {
        const el = elementRef.deref();
        if (!el) { eff.stop(); return; }
        apply(el, val);
      });
      notifyEffectElement(eff._devId, element);
      if (eff._devId !== 0) { devIds.push(eff._devId); }
      effects.push(eff);
      return eff;
    },

    finalize({ effectCallbacks = [], connectCallbacks = [], disconnectCallbacks = [], onCleared, onReconnect } = {}) {
      const validation = _reactiveRuntime.capture();
      let effectsStarted = false;
      let connected = false;
      let disconnected = false;

      // User failures are reported without skipping other owners' resource cleanup.
      function callSafely(fn) {
        try { fn(); } catch (err) { queueMicrotask(() => { throw err; }); }
      }

      function disconnect() {
        connected = false;
        disconnected = true;
        for (const eff of effects) {
          callSafely(() => { if (persist) { eff.pause(); } else { eff.stop(); } });
        }
        if (onCleared) { callSafely(onCleared); }
        for (const fn of disconnectCallbacks) { callSafely(() => fn.call(element, element)); }
        if (persist) { trackForStop(element, disconnect, devIds); }
      }

      // Owned effects and connected callbacks can own resources without bindings
      // or explicit disconnected callbacks, so they also need removal tracking.
      if (effects.length > 0 || effectCallbacks.length > 0
        || disconnectCallbacks.length > 0 || connectCallbacks.length > 0) {
        trackForStop(element, disconnect, devIds);
      }

      if (persist || effectCallbacks.length > 0 || connectCallbacks.length > 0) {
        trackForConnect(element, () => {
          // Mutation records can revisit an element moved within the live document.
          // Keep the current resources until an actual disconnect is observed.
          if (connected || !element.isConnected) { return; }
          connected = true;
          if (disconnected) {
            if (onReconnect) { callSafely(onReconnect); }
            for (const eff of effects) { callSafely(() => eff.resume()); }
          }
          if (!effectsStarted) {
            effectsStarted = true;
            for (const fn of effectCallbacks) {
              callSafely(() => {
                const handle = _reactiveRuntime.run(validation, () => _internalEffect(() => {
                  const el = elementRef.deref();
                  if (!el) { handle?.stop(); return; }
                  fn.call(el, el);
                }));
                effects.push(handle);
                notifyEffectElement(handle._devId, element);
              });
            }
          }
          for (const fn of connectCallbacks) {
            callSafely(() => {
              _enterConnectedCallback();
              try {
                fn.call(element, element);
              } finally {
                _exitConnectedCallback();
              }
            });
          }
        }, persist);
      }
    },
  };
}
