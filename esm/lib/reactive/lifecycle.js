import { markNextEffectAsBinding, notifyEffectElement } from './devtools.js';
import { addOnStop, trackForConnect, trackForStop } from './dom-tracker.js';
import { _bindingEffect } from './signal.js';

/**
 * Owns the lifecycle of signal effects and connect/disconnect callbacks for a single DOM
 * element, including the persist mechanism that pauses effects on removal and resumes them
 * on re-insertion. The caller wires signal effects via `signalEffect`, then calls `finalize`
 * once with the connect/disconnect callback arrays.
 */
export function createLifecycle({ element, persist }) {
  // `effects` holds the bound effects directly rather than per-effect pauseOrStop closures.
  // Dispatch is one branch in the stop chain (resolved from `persist` once), not one closure
  // allocated per signalEffect call. On a list with thousands of reactive elements this
  // removes thousands of closures and the GC pressure that came with them.
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

    finalize({ connectCallbacks = [], disconnectCallbacks = [], onCleared, onReconnect } = {}) {
      function registerDisconnectChain() {
        trackForStop(element, () => {
          if (persist) {
            for (let i = 0; i < effects.length; i++) { effects[i].pause(); }
          } else {
            for (let i = 0; i < effects.length; i++) { effects[i].stop(); }
          }
        }, devIds);
        if (onCleared) { addOnStop(element, onCleared); }
        for (const fn of disconnectCallbacks) {
          addOnStop(element, () => fn.call(element, element));
        }
      }

      if (effects.length > 0 || disconnectCallbacks.length > 0) {
        registerDisconnectChain();
        if (persist) {
          // Rebuild the stop chain on each removal so disconnect callbacks fire again
          // on every subsequent removal cycle.
          const reFireAndRegister = () => {
            trackForStop(element, () => {});
            if (onCleared) { addOnStop(element, onCleared); }
            for (const fn of disconnectCallbacks) {
              addOnStop(element, () => fn.call(element, element));
            }
            addOnStop(element, reFireAndRegister);
          };
          addOnStop(element, reFireAndRegister);
        }
      }

      const needsConnect = persist || connectCallbacks.length > 0;
      if (needsConnect) {
        let initialConnect = true;
        trackForConnect(element, () => {
          if (initialConnect) {
            initialConnect = false;
          } else {
            // On reconnection, restore caller state and resume paused effects, wiring them
            // into the new stop chain so they pause again on the next removal. Only reached
            // when persist is true (trackForConnect only re-fires in that case).
            if (onReconnect) { onReconnect(); }
            if (persist) {
              for (const eff of effects) {
                eff.resume();
                addOnStop(element, () => eff.pause());
              }
            }
          }
          for (const fn of connectCallbacks) { fn.call(element, element); }
        }, persist);
      }
    },
  };
}
