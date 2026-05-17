import { addOnStop, trackForConnect, trackForStop } from './dom-tracker.js';
import { effect } from './signal.js';

/**
 * Owns the lifecycle of signal effects and connect/disconnect callbacks for a single DOM
 * element, including the persist mechanism that pauses effects on removal and resumes them
 * on re-insertion. The caller wires signal effects via `signalEffect`, then calls `finalize`
 * once with the connect/disconnect callback arrays.
 */
export function createLifecycle({ element, persist }) {
  const stops = [];
  const resumables = persist ? [] : null;
  const elementRef = new WeakRef(element);

  function pauseOrStop(eff) {
    return () => persist ? eff.pause() : eff.stop();
  }

  function wireEffect(eff) {
    stops.push(pauseOrStop(eff));
    if (resumables !== null) { resumables.push(eff); }
  }

  return {
    /**
     * Create a signal-tracking effect bound to this element. The effect self-stops if the
     * element is garbage-collected. It pauses on removal and resumes on reconnect when
     * persist is true, otherwise it stops permanently on removal.
     */
    signalEffect(sig, apply) {
      const eff = effect(() => {
        const el = elementRef.deref();
        if (!el) { eff.stop(); return; }
        apply(el, sig.get());
      });
      wireEffect(eff);
      return eff;
    },

    finalize({ connectCallbacks = [], disconnectCallbacks = [], onCleared, onReconnect } = {}) {
      function registerDisconnectChain() {
        trackForStop(element, () => { for (const stop of stops) { stop(); } });
        if (onCleared) { addOnStop(element, onCleared); }
        for (const fn of disconnectCallbacks) {
          addOnStop(element, () => fn.call(element, element));
        }
      }

      if (stops.length > 0 || disconnectCallbacks.length > 0) {
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
        let firstConnection = true;
        trackForConnect(element, () => {
          if (!firstConnection) {
            // On reconnection, restore caller state and resume paused effects, wiring them
            // into the new stop chain so they pause again on the next removal. Only reached
            // when persist is true (trackForConnect only re-fires in that case).
            if (onReconnect) { onReconnect(); }
            if (resumables !== null && resumables.length > 0) {
              for (const eff of resumables) {
                eff.resume();
                addOnStop(element, () => eff.pause());
              }
            }
          }
          firstConnection = false;
          for (const fn of connectCallbacks) { fn.call(element, element); }
        }, persist);
      }
    },
  };
}
