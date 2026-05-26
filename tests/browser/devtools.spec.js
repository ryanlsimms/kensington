import { expect, test } from './config/fixtures.js';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3847/');
});

// ─── signal lifecycle ──────────────────────────────────────────────────────

test('devtools: signal appears in hook.signals on creation', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { signal, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    signal(42);
    const meta = [...hook.signals.values()].find(m => m.value === 42);
    return { found: meta !== undefined, value: meta?.value, isComputed: meta?.isComputed };
  }, bundle);
  expect(result.found).toBe(true);
  expect(result.value).toBe(42);
  expect(result.isComputed).toBe(false);
});

test('devtools: subscriberCount stays accurate as effects subscribe and unsubscribe',
  async ({ page, bundle }) => {
    test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
    const result = await page.evaluate(async src => {
      const { signal, effect, enableDevtools } = await import(src);
      enableDevtools();
      const hook = window.__KENSINGTON_DEVTOOLS__;
      const s = signal(0);
      const sigId = [...hook.signals.values()].find(m => m.value === 0)?.id;
      const countAfterCreate = hook.signals.get(sigId)?.subscriberCount;
      const h1 = effect(() => { s.get(); });
      const countAfterFirst = hook.signals.get(sigId)?.subscriberCount;
      effect(() => { s.get(); });
      const countAfterSecond = hook.signals.get(sigId)?.subscriberCount;
      h1.stop();
      const countAfterStop = hook.signals.get(sigId)?.subscriberCount;
      return { countAfterCreate, countAfterFirst, countAfterSecond, countAfterStop };
    }, bundle);
    expect(result.countAfterCreate).toBe(0);
    expect(result.countAfterFirst).toBe(1);
    expect(result.countAfterSecond).toBe(2);
    expect(result.countAfterStop).toBe(1);
  });

test('devtools: signal value and setCount update in devtools on .set()', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { signal, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    const s = signal('before');
    const id = [...hook.signals.values()].find(m => m.value === 'before')?.id;
    s.set('after');
    return { value: hook.signals.get(id)?.value, setCount: hook.signals.get(id)?.setCount };
  }, bundle);
  expect(result.value).toBe('after');
  expect(result.setCount).toBe(1);
});

test('devtools: signal is removed from hook.signals on .stop()', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { signal, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    const s = signal('val');
    const id = [...hook.signals.values()].find(m => m.value === 'val')?.id;
    s.stop();
    return { id, stillPresent: hook.signals.has(id) };
  }, bundle);
  expect(result.id).toBeDefined();
  expect(result.stillPresent).toBe(false);
});

// ─── effect lifecycle ──────────────────────────────────────────────────────

test('devtools: effect appears in hook.effects on creation', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { signal, effect, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    const s = signal(0);
    const handle = effect(() => { s.get(); });
    const meta = hook.effects.get(handle._devId);
    return { found: meta !== undefined, state: meta?.state, runCount: meta?.runCount };
  }, bundle);
  expect(result.found).toBe(true);
  expect(result.state).toBe('active');
  expect(result.runCount).toBe(1);
});

test('devtools: effect runCount increments when the effect re-runs', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { signal, effect, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    const s = signal(0);
    const handle = effect(() => { s.get(); });
    s.set(1);
    await Promise.resolve(); // flush queued effect re-run
    return { runCount: hook.effects.get(handle._devId)?.runCount };
  }, bundle);
  expect(result.runCount).toBe(2);
});

test('devtools: effect state is paused after pause()', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { signal, effect, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    const s = signal(0);
    const handle = effect(() => { s.get(); });
    handle.pause();
    return { state: hook.effects.get(handle._devId)?.state };
  }, bundle);
  expect(result.state).toBe('paused');
});

test('devtools: effect is removed from hook.effects on stop()', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { signal, effect, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    const s = signal(0);
    const handle = effect(() => { s.get(); });
    const id = handle._devId;
    handle.stop();
    return { stillPresent: hook.effects.has(id) };
  }, bundle);
  expect(result.stillPresent).toBe(false);
});

// ─── signal-effect subscriptions ──────────────────────────────────────────

test('devtools: effect ID is added to signal effectIds on subscribe', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { signal, effect, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    const s = signal('tracked');
    const sigId = [...hook.signals.values()].find(m => m.value === 'tracked')?.id;
    const handle = effect(() => { s.get(); });
    const sigMeta = hook.signals.get(sigId);
    const hasEffectId = sigMeta?.effectIds.has(handle._devId);
    const hasUndefined = sigMeta?.effectIds.has(undefined);
    const size = sigMeta?.effectIds.size;
    return { hasEffectId, hasUndefined, size };
  }, bundle);
  expect(result.hasEffectId).toBe(true);
  expect(result.hasUndefined).toBe(false);
  expect(result.size).toBe(1);
});

test('devtools: effect ID is removed from signal effectIds on stop()', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { signal, effect, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    const s = signal(0);
    const sigId = [...hook.signals.values()].find(m => m.value === 0)?.id;
    const handle = effect(() => { s.get(); });
    handle.stop();
    // Signal is still in hook.signals (microtask removal not yet fired).
    const sigMeta = hook.signals.get(sigId);
    return { effectIdsSize: sigMeta?.effectIds.size, hasEffectId: sigMeta?.effectIds.has(handle._devId) };
  }, bundle);
  expect(result.effectIdsSize).toBe(0);
  expect(result.hasEffectId).toBe(false);
});

// ─── computed signals ──────────────────────────────────────────────────────

test('devtools: computed subscription does not add undefined to source signal effectIds',
  async ({ page, bundle }) => {
    test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
    const result = await page.evaluate(async src => {
      const { signal, computed, enableDevtools } = await import(src);
      enableDevtools();
      const hook = window.__KENSINGTON_DEVTOOLS__;
      const base = signal('source-val');
      const baseId = [...hook.signals.values()].find(m => m.value === 'source-val')?.id;
      computed(() => `${base.get()}!`);
      const meta = hook.signals.get(baseId);
      return { effectIdsSize: meta?.effectIds.size, hasUndefined: meta?.effectIds.has(undefined) };
    }, bundle);
    expect(result.effectIdsSize).toBe(0);
    expect(result.hasUndefined).toBe(false);
  });

test('devtools: computed signal appears in hook.signals on creation', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { signal, computed, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    const base = signal(3);
    computed(() => base.get() * 10);
    const meta = [...hook.signals.values()].find(m => m.value === 30);
    return { found: meta !== undefined, value: meta?.value, isComputed: meta?.isComputed };
  }, bundle);
  expect(result.found).toBe(true);
  expect(result.value).toBe(30);
  expect(result.isComputed).toBe(true);
});

test('devtools: computed is removed from devtools when it loses all subscribers', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { signal, computed, effect, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    const base = signal(5);
    const c = computed(() => base.get() + 1);
    const computedId = [...hook.signals.values()].find(m => m.value === 6)?.id;
    const handle = effect(() => { c.get(); });
    const presentBefore = hook.signals.has(computedId);
    handle.stop(); // computed loses its only subscriber and sleeps synchronously
    return { computedId, presentBefore, presentAfter: hook.signals.has(computedId) };
  }, bundle);
  expect(result.computedId).toBeDefined();
  expect(result.presentBefore).toBe(true);
  expect(result.presentAfter).toBe(false);
});

test('devtools: computed re-appears in devtools when re-subscribed after sleeping', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { signal, computed, effect, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    const base = signal(4);
    const c = computed(() => base.get() + 1);
    const computedId = [...hook.signals.values()].find(m => m.value === 5)?.id;
    const handle = effect(() => { c.get(); });
    handle.stop(); // computed sleeps
    const afterSleep = hook.signals.has(computedId);
    effect(() => { c.get(); }); // wakes computed
    const metaAfterWake = hook.signals.get(computedId);
    return { computedId, afterSleep, afterWake: metaAfterWake !== undefined, isComputed: metaAfterWake?.isComputed };
  }, bundle);
  expect(result.computedId).toBeDefined();
  expect(result.afterSleep).toBe(false);
  expect(result.afterWake).toBe(true);
  expect(result.isComputed).toBe(true);
});

test('devtools: source signal is removed when its only subscriber (a computed) sleeps',
  async ({ page, bundle }) => {
    test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
    const result = await page.evaluate(async src => {
      const { signal, computed, effect, enableDevtools } = await import(src);
      enableDevtools();
      const hook = window.__KENSINGTON_DEVTOOLS__;
      const base = signal('only-computed-sub');
      const baseId = [...hook.signals.values()].find(m => m.value === 'only-computed-sub')?.id;
      const c = computed(() => base.get().toUpperCase());
      const handle = effect(() => { c.get(); });
      const presentBefore = hook.signals.has(baseId);
      handle.stop(); // computed sleeps, unsubscribes from base, schedules base removal
      await Promise.resolve(); // notifySignalZeroSubscribers microtask fires
      return { baseId, presentBefore, presentAfter: hook.signals.has(baseId) };
    }, bundle);
    expect(result.baseId).toBeDefined();
    expect(result.presentBefore).toBe(true);
    expect(result.presentAfter).toBe(false);
  });

// ─── zero-subscriber cleanup ───────────────────────────────────────────────

test('devtools: signal entry is removed after all subscribing effects are paused', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
  const result = await page.evaluate(async src => {
    const { t, signal, enableDevtools } = await import(src);
    enableDevtools();
    const hook = window.__KENSINGTON_DEVTOOLS__;
    const sig = signal('x');
    const tag = t.span({ class: sig, persist: true });
    const el = tag.toElement();
    document.body.append(el);
    await Promise.resolve();
    const idBefore = [...hook.signals.values()].find(m => m.value === 'x')?.id;
    el.remove();
    await Promise.resolve();
    await Promise.resolve();
    return { idBefore, stillPresent: hook.signals.has(idBefore) };
  }, bundle);
  expect(result.idBefore).toBeDefined();
  expect(result.stillPresent).toBe(false);
});

test('devtools: signal entry is not removed when effects re-subscribe before microtask fires',
  async ({ page, bundle }) => {
    test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
    const result = await page.evaluate(async src => {
      const { t, signal, enableDevtools } = await import(src);
      enableDevtools();
      const hook = window.__KENSINGTON_DEVTOOLS__;
      const cls = signal('a');
      const tag = t.li({ persist: true }, [t.span({ class: cls })]);
      const elA = tag.toElement();
      const ul = document.createElement('ul');
      const elB = document.createElement('li');
      ul.append(elA, elB);
      document.body.append(ul);
      await Promise.resolve();
      const idBefore = [...hook.signals.values()].find(m => m.value === 'a')?.id;
      ul.insertBefore(elB, elA);
      await Promise.resolve();
      await Promise.resolve();
      return { idBefore, stillPresent: hook.signals.has(idBefore) };
    }, bundle);
    expect(result.idBefore).toBeDefined();
    expect(result.stillPresent).toBe(true);
  });

test('devtools: signal entry is not removed when a computed re-subscribes before microtask fires',
  async ({ page, bundle }) => {
    test.skip(bundle.includes('slim'), 'devtools are no-ops in the slim build');
    const result = await page.evaluate(async src => {
      const { signal, computed, effect, enableDevtools } = await import(src);
      enableDevtools();
      const hook = window.__KENSINGTON_DEVTOOLS__;
      const base = signal(10);
      const baseId = [...hook.signals.values()].find(m => m.value === 10)?.id;
      const c = computed(() => base.get() * 2);
      const handle = effect(() => { c.get(); });
      handle.stop(); // computed sleeps, unsubscribes from base, schedules base removal
      // Before microtask fires, wake computed via a new effect — this must cancel the removal.
      effect(() => { c.get(); });
      await Promise.resolve(); // microtask fires but removal should be cancelled
      return { baseId, stillPresent: hook.signals.has(baseId) };
    }, bundle);
    expect(result.baseId).toBeDefined();
    expect(result.stillPresent).toBe(true);
  });
