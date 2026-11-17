// Snapshot of the signals.30 shared state and basic scheduler contract. Install it
// before loading the current runtime to exercise compatibility with an older copy.
import { getSharedReactiveState } from '../../../esm/lib/reactive/shared-state.js';

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

export function legacySchedule(fn) {
  state.pending.add(fn);
  if (state.scheduled || state.inFlush) { return; }
  state.scheduled = true;
  queueMicrotask(() => {
    state.scheduled = false;
    state.inFlush = true;
    try {
      while (state.pending.size > 0) {
        for (const run of [...state.pending]) {
          if (state.pending.delete(run)) { run(); }
        }
      }
    } finally {
      state.inFlush = false;
    }
  });
}
