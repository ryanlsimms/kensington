// Browser tests for kensington/live. The html-server (tests/browser/server/
// html-server.js) attaches a liveServer at /__kensington/live so these tests
// can exercise the full WebSocket round-trip in a real browser.
//
// Each test uses a fresh randomly-suffixed name to avoid cross-test
// interference with the shared in-memory liveServer state.

import { expect, test } from './config/fixtures.js';

const LIVE_BUNDLE = '/esm/live/index.js';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3847/');
});

test('connectLive opens a WebSocket and transitions status to connected', async ({ page, bundle }) => {
  const result = await page.evaluate(async ({ src, liveSrc }) => {
    const { effect } = await import(src);
    const { connectLive } = await import(liveSrc);
    const transport = connectLive({ url: 'ws://localhost:3847/__kensington/live' });
    return await new Promise(resolve => {
      effect(() => {
        if (transport.status.get() === 'connected') { resolve(transport.status.value); }
      });
    });
  }, { src: bundle, liveSrc: LIVE_BUNDLE });
  expect(result).toBe('connected');
});

test('liveSignal value broadcasts between two browser contexts', async ({ browser, bundle }) => {
  const name = `browser:broadcast:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  try {
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();
    await pageA.goto('http://localhost:3847/');
    await pageB.goto('http://localhost:3847/');

    // Both tabs subscribe to the same name. Tab A writes. Tab B should observe.
    await pageA.evaluate(async ({ src, liveSrc, name: liveName }) => {
      const { effect } = await import(src);
      const { connectLive, liveSignal } = await import(liveSrc);
      const transport = connectLive({ url: 'ws://localhost:3847/__kensington/live' });
      await new Promise(resolve => {
        effect(() => { if (transport.status.get() === 'connected') { resolve(); } });
      });
      window.__sig = liveSignal('', liveName);
    }, { src: bundle, liveSrc: LIVE_BUNDLE, name });

    await pageB.evaluate(async ({ src, liveSrc, name: liveName }) => {
      const { effect } = await import(src);
      const { connectLive, liveSignal } = await import(liveSrc);
      const transport = connectLive({ url: 'ws://localhost:3847/__kensington/live' });
      await new Promise(resolve => {
        effect(() => { if (transport.status.get() === 'connected') { resolve(); } });
      });
      window.__sig = liveSignal('', liveName);
      window.__received = [];
      effect(() => { window.__received.push(window.__sig.get()); });
    }, { src: bundle, liveSrc: LIVE_BUNDLE, name });

    // Tab A writes a value.
    await pageA.evaluate(() => { window.__sig.set('hello from A'); });

    // Tab B should observe the value within a reasonable window.
    await expect.poll(() => pageB.evaluate(() => window.__sig.get()), {
      timeout: 2000,
    }).toBe('hello from A');

    // The effect on B should have observed the new value (the initial '' read
    // is also recorded; we just need 'hello from A' present).
    const received = await pageB.evaluate(() => window.__received);
    expect(received).toContain('hello from A');
  } finally {
    await ctxA.close();
    await ctxB.close();
  }
});

test('onFrame internal hook fires for outbound subscribe and inbound snapshot', async ({ page, bundle }) => {
  const name = `browser:onframe:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await page.evaluate(async ({ src, liveSrc, name: liveName }) => {
    const { effect } = await import(src);
    const { connectLive, liveSignal } = await import(liveSrc);
    const frames = [];
    const transport = connectLive({
      url: 'ws://localhost:3847/__kensington/live',
      _internal: { onFrame: (dir, frame) => { frames.push({ dir, type: frame.type, name: frame.name }); } },
    });
    await new Promise(resolve => {
      effect(() => { if (transport.status.get() === 'connected') { resolve(); } });
    });
    liveSignal('', liveName);
    await new Promise(r => { setTimeout(r, 200); });
    return frames;
  }, { src: bundle, liveSrc: LIVE_BUNDLE, name });

  const outSubscribe = result.find(f => f.dir === 'out' && f.type === 'subscribe' && f.name === name);
  const inSnapshot = result.find(f => f.dir === 'in' && f.type === 'snapshot');
  expect(outSubscribe).toBeDefined();
  expect(inSnapshot).toBeDefined();
});

test('CAS .set(fn) converges under concurrent writes from two contexts', async ({ browser, bundle }) => {
  const name = `browser:cas:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  try {
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();
    await pageA.goto('http://localhost:3847/');
    await pageB.goto('http://localhost:3847/');

    async function setup(page) {
      await page.evaluate(async ({ src, liveSrc, name: liveName }) => {
        const { effect } = await import(src);
        const { connectLive, liveSignal } = await import(liveSrc);
        const transport = connectLive({ url: 'ws://localhost:3847/__kensington/live' });
        await new Promise(resolve => {
          effect(() => { if (transport.status.get() === 'connected') { resolve(); } });
        });
        window.__sig = liveSignal({ count: 0 }, liveName);
        // Wait briefly for the snapshot to land.
        await new Promise(r => { setTimeout(r, 100); });
      }, { src: bundle, liveSrc: '/esm/live/index.js', name });
    }
    await setup(pageA);
    await setup(pageB);

    // Both tabs CAS-increment ten times each, in parallel. Final count must be 20.
    const incrementAll = page => page.evaluate(async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(window.__sig.set(prev => ({ count: prev.count + 1 })));
      }
      await Promise.all(promises);
    });
    await Promise.all([incrementAll(pageA), incrementAll(pageB)]);

    // Allow time for the last broadcast to land on both sides.
    await expect.poll(
      () => pageA.evaluate(() => window.__sig.get().count),
      { timeout: 3000 },
    ).toBe(20);
    await expect.poll(
      () => pageB.evaluate(() => window.__sig.get().count),
      { timeout: 3000 },
    ).toBe(20);
  } finally {
    await ctxA.close();
    await ctxB.close();
  }
});
