import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import {
  applyPendingReactiveUpdates,
  computed,
  effect,
  renderForHydration,
  signal,
  t,
} from 'kensington';
import * as reactive from 'kensington/reactive';

const handles = [];
function watch(fn) {
  const handle = effect(fn);
  handles.push(handle);
  return handle;
}
afterEach(() => {
  for (const handle of handles.splice(0)) { handle.stop(); }
  applyPendingReactiveUpdates();
});

describe('applyPendingReactiveUpdates', () => {
  it('shares the root and reactive entry point and replaces batch', async () => {
    const root = await import('kensington');
    assert.strictEqual(reactive.applyPendingReactiveUpdates, applyPendingReactiveUpdates);
    assert.strictEqual('batch' in root, false);
    assert.strictEqual('batch' in reactive, false);
    assert.strictEqual(applyPendingReactiveUpdates.length, 0);
    assert.strictEqual(applyPendingReactiveUpdates(), undefined);
  });

  it('automatically coalesces writes while signal and computed reads stay current', async () => {
    const first = signal(1);
    const second = signal(2);
    let computations = 0;
    const total = computed(() => { computations++; return first.get() + second.get(); });
    const seen = [];
    watch(() => seen.push(total.get()));
    first.set(3);
    second.set(4);
    assert.strictEqual(first.get(), 3);
    assert.strictEqual(total.get(), 7);
    assert.strictEqual(computations, 3);
    assert.deepStrictEqual(seen, [3]);
    // Exercise automatic batching itself rather than forcing the effects to run.
    await Promise.resolve();
    assert.deepStrictEqual(seen, [3, 7]);
  });

  it('applies all queued effects once without yielding and does not repeat them later', async () => {
    const a = signal(0);
    const b = signal(0);
    const seen = [];
    watch(() => seen.push(['a', a.get()]));
    watch(() => seen.push(['b', b.get()]));
    a.set(1);
    b.set(1);
    b.set(2);
    assert.strictEqual(applyPendingReactiveUpdates(), undefined);
    assert.deepStrictEqual(seen, [['a', 0], ['b', 0], ['a', 1], ['b', 2]]);
    applyPendingReactiveUpdates();
    // Verify the already queued automatic pass does not repeat the explicit updates.
    await Promise.resolve();
    assert.strictEqual(seen.length, 4);
  });

  it('keeps later writes automatically batched after an explicit update', async () => {
    const s = signal(0);
    const seen = [];
    watch(() => seen.push(s.get()));
    s.set(1);
    applyPendingReactiveUpdates();
    s.set(2);
    s.set(3);
    assert.deepStrictEqual(seen, [0, 1]);
    // Verify later writes still run automatically after the explicit update.
    await Promise.resolve();
    assert.deepStrictEqual(seen, [0, 1, 3]);
    s.set(4);
    // Verify a fresh microtask is scheduled after the previous automatic pass finishes.
    await Promise.resolve();
    assert.deepStrictEqual(seen, [0, 1, 3, 4]);
  });

  it('drains synchronously queued followup work without recursive execution', async () => {
    const a = signal(0);
    const b = signal(0);
    const seen = [];
    watch(() => {
      const value = a.get();
      if (value > 0) {
        seen.push('start');
        b.set(value);
        applyPendingReactiveUpdates();
        seen.push('end');
      }
    });
    watch(() => { seen.push(b.get()); });
    seen.length = 0;
    a.set(1);
    applyPendingReactiveUpdates();
    assert.deepStrictEqual(seen, ['start', 'end', 1]);
    // Verify the automatic pass does not repeat work drained by the explicit update.
    await Promise.resolve();
    assert.deepStrictEqual(seen, ['start', 'end', 1]);
  });

  it('does not flush unrelated work during effect creation or leak its dependencies', () => {
    const a = signal(0);
    const b = signal(0);
    let runs = 0;
    const seen = [];
    watch(() => seen.push(b.get()));
    b.set(1);
    watch(() => {
      a.get();
      runs++;
      applyPendingReactiveUpdates();
      assert.deepStrictEqual(seen, [0]);
    });
    applyPendingReactiveUpdates();
    assert.deepStrictEqual(seen, [0, 1]);
    b.set(2);
    applyPendingReactiveUpdates();
    assert.strictEqual(runs, 1);
  });

  it('does not flush while a computed is deriving or leave a diamond partially updated', () => {
    const source = signal(1);
    const left = computed(() => source.get() + 1);
    const right = computed(() => {
      applyPendingReactiveUpdates();
      return source.get() * 2;
    });
    const seen = [];
    watch(() => seen.push(left.get() + right.get()));
    source.set(2);
    assert.deepStrictEqual(seen, [4]);
    applyPendingReactiveUpdates();
    assert.deepStrictEqual(seen, [4, 7]);
  });

  it('does not await asynchronous work started by an effect', async () => {
    const source = signal(0);
    const destination = signal(0);
    const seen = [];
    watch(() => {
      const value = source.get();
      // Schedule actual Promise work to prove the helper cannot run it synchronously.
      if (value) { Promise.resolve().then(() => destination.set(value)); }
    });
    watch(() => seen.push(destination.get()));
    source.set(1);
    applyPendingReactiveUpdates();
    assert.strictEqual(destination.get(), 0);
    assert.deepStrictEqual(seen, [0]);
    // Run the Promise callback while leaving its newly queued effect for the next assertion.
    await Promise.resolve();
    assert.strictEqual(destination.get(), 1);
    assert.deepStrictEqual(seen, [0]);
    applyPendingReactiveUpdates();
    assert.deepStrictEqual(seen, [0, 1]);
  });

  it('preserves the queued microtask position when writes follow an explicit update', async () => {
    const source = signal(0);
    const seen = [];
    watch(() => seen.push(source.get()));
    source.set(1);
    // Use an unrelated microtask as a marker for the scheduler's original queue position.
    queueMicrotask(() => seen.push('later microtask'));
    applyPendingReactiveUpdates();
    source.set(2);
    // Observe real microtask ordering after a write follows the explicit update.
    await Promise.resolve();
    assert.deepStrictEqual(seen, [0, 1, 2, 'later microtask']);
  });

  it('does not force clean effects to rerun but retains net zero pending writes', () => {
    const source = signal(0);
    const seen = [];
    watch(() => seen.push(source.get()));
    source.set(0);
    applyPendingReactiveUpdates();
    assert.deepStrictEqual(seen, [0]);
    source.set(1);
    source.set(0);
    applyPendingReactiveUpdates();
    assert.deepStrictEqual(seen, [0, 0]);
  });

  it('skips effects stopped or paused before pending updates are applied', () => {
    const source = signal(0);
    const stopped = [];
    const paused = [];
    const a = watch(() => stopped.push(source.get()));
    const b = watch(() => paused.push(source.get()));
    source.set(1);
    a.stop();
    b.pause();
    applyPendingReactiveUpdates();
    assert.deepStrictEqual(stopped, [0]);
    assert.deepStrictEqual(paused, [0]);
    b.resume();
    assert.deepStrictEqual(paused, [0, 1]);
  });

  it('cleans up dependencies when the initial effect callback throws', () => {
    const source = signal(0);
    let runs = 0;
    assert.throws(() => effect(() => {
      source.get();
      runs++;
      throw new Error('initial failure');
    }), /initial failure/);
    source.set(1);
    applyPendingReactiveUpdates();
    assert.strictEqual(runs, 1);
  });

  it('isolates effect errors during explicit updates and reports them asynchronously', async () => {
    const source = signal(0);
    const seen = [];
    const errors = [];
    // Capture asynchronously reported errors without changing when the microtasks execute.
    const original = globalThis.queueMicrotask;
    globalThis.queueMicrotask = fn => original(() => {
      try { fn(); } catch (err) { errors.push(err); }
    });
    try {
      watch(() => { if (source.get()) { throw new Error('update failure'); } });
      watch(() => seen.push(source.get()));
      source.set(1);
      assert.doesNotThrow(() => applyPendingReactiveUpdates());
      assert.deepStrictEqual(seen, [0, 1]);
      assert.deepStrictEqual(errors, []);
      // Let the queued error report run after proving the helper did not throw synchronously.
      await Promise.resolve();
      assert.strictEqual(errors.length, 1);
      assert.match(errors[0].message, /update failure/);
    } finally {
      globalThis.queueMicrotask = original;
    }
  });

  for (const shouldThrow of [false, true]) {
    it(`keeps external pending effects out of SSR when the render ${shouldThrow ? 'throws' : 'succeeds'}`, () => {
      assert.strictEqual(typeof document, 'undefined');
      const source = signal(1);
      const seen = [];
      let renderEffects = 0;
      let derivations = 0;
      watch(() => seen.push(source.get()));
      source.set(2);
      function component() {
        const doubled = computed(() => { derivations++; return source.get() * 2; });
        effect(() => { source.get(); renderEffects++; });
        applyPendingReactiveUpdates();
        assert.deepStrictEqual(seen, [1]);
        if (shouldThrow) { throw new Error('render failure'); }
        return t.div(doubled);
      }
      if (shouldThrow) {
        assert.throws(() => renderForHydration(component, {}), /render failure/);
      } else {
        assert.match(renderForHydration(component, {}).toString(), />4<\/div>/);
      }
      assert.strictEqual(renderEffects, 0);
      applyPendingReactiveUpdates();
      assert.deepStrictEqual(seen, [1, 2]);
      source.set(3);
      applyPendingReactiveUpdates();
      assert.deepStrictEqual(seen, [1, 2, 3]);
      assert.strictEqual(renderEffects, 0);
      assert.strictEqual(derivations, 1);
    });
  }
});
