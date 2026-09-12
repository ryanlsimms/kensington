export {
  applyPendingReactiveUpdates,
  computed,
  effect,
  isKensingtonSignal,
  signal,
  Signal,
  Signal as default,
} from '../types.js';

export type {
  Reactive,
  ReadonlySignal,
  SignalKey,
} from '../types.js';

import type { ReadonlySignal } from '../types.js';

type EffectHandle = {
  pause(): void;
  resume(): void;
  stop(): void;
};

/** @internal */
export function _internalComputed<T>(fn: () => T): ReadonlySignal<T>;

/** @internal */
export function _internalEffect(fn: () => void): EffectHandle;

/** @internal */
export function _bindingEffect<T>(signal: ReadonlySignal<T>, fn: (value: T) => void): EffectHandle;
