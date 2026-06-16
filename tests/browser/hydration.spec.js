import { renderForHydration, t } from 'kensington';

import { expect, test } from './config/fixtures.js';

test.beforeEach(async ({ page: pg }) => {
  await pg.goto('http://localhost:3847/');
});

function inject(pg, html) {
  return pg.evaluate(h => { document.body.innerHTML = h; }, html);
}

// ─── basic hydration ───────────────────────────────────────────────────────

test('replaces SSR element with live reactive component', async ({ page: pg, bundle }) => {
  function counter({ count }) {
    return t.div({ id: 'target' }, String(count));
  }

  await inject(pg, renderForHydration(counter, { count: 5 }).toString());

  await pg.evaluate(async src => {
    const { registerComponents, signal, t: tg } = await import(src);
    function counterLive({ count }) {
      const n = signal(count);
      return tg.button({ id: 'target', onclick: () => n.set(v => v + 1) }, n);
    }
    registerComponents({ counter: counterLive });
  }, bundle);

  await expect(pg.locator('#target')).toHaveText('5');
  await pg.locator('#target').click();
  await expect(pg.locator('#target')).toHaveText('6');
});

test('SSR element is removed from DOM after hydration', async ({ page: pg, bundle }) => {
  function card({ title }) {
    return t.div({ id: 'card', 'data-k-mount-target': '' }, title);
  }

  await inject(pg, renderForHydration(card, { title: 'Hello' }).toString());

  const hadMountTarget = await pg.evaluate(async src => {
    const before = document.querySelector('[data-k-mount-target]') !== null;
    const { registerComponents, t: tg } = await import(src);
    function cardLive({ title }) {
      return tg.div({ id: 'card' }, title);
    }
    registerComponents({ card: cardLive });
    const after = document.querySelector('[data-k-mount-target]') !== null;
    return { before, after };
  }, bundle);

  expect(hadMountTarget.before).toBe(true);
  expect(hadMountTarget.after).toBe(false);
});

test('JSON script block is removed after hydration', async ({ page: pg, bundle }) => {
  function note({ text }) {
    return t.p({ id: 'note' }, text);
  }

  await inject(pg, renderForHydration(note, { text: 'hi' }).toString());

  const scriptCount = await pg.evaluate(async src => {
    const before = document.querySelectorAll('script[data-k-component]').length;
    const { registerComponents, t: tg } = await import(src);
    function noteLive({ text }) {
      return tg.p({ id: 'note' }, text);
    }
    registerComponents({ note: noteLive });
    const after = document.querySelectorAll('script[data-k-component]').length;
    return { before, after };
  }, bundle);

  expect(scriptCount.before).toBe(1);
  expect(scriptCount.after).toBe(0);
});

// ─── multiple components ───────────────────────────────────────────────────

test('hydrates multiple components on the same page', async ({ page: pg, bundle }) => {
  function header({ title }) {
    return t.h1({ id: 'hdr' }, title);
  }
  function footer({ label }) {
    return t.p({ id: 'ftr' }, label);
  }

  const html = renderForHydration(header, { title: 'My App' }).toString() +
    renderForHydration(footer, { label: 'Done' }).toString();

  await inject(pg, html);

  await pg.evaluate(async src => {
    const { registerComponents, signal, t: tg } = await import(src);
    function headerLive({ title }) {
      const s = signal(title);
      return tg.h1({ id: 'hdr' }, s);
    }
    function footerLive({ label }) {
      const s = signal(label);
      return tg.p({ id: 'ftr' }, s);
    }
    registerComponents({ header: headerLive, footer: footerLive });
  }, bundle);

  await expect(pg.locator('#hdr')).toHaveText('My App');
  await expect(pg.locator('#ftr')).toHaveText('Done');
});

test('hydrates multiple instances of the same component', async ({ page: pg, bundle }) => {
  function badge({ value }) {
    return t.span({ class: 'badge' }, String(value));
  }

  const html = renderForHydration(badge, { value: 1 }).toString() +
    renderForHydration(badge, { value: 2 }).toString();

  await inject(pg, html);

  await pg.evaluate(async src => {
    const { registerComponents, signal, t: tg } = await import(src);
    function badgeLive({ value }) {
      const n = signal(value);
      return tg.span({ class: 'badge' }, n);
    }
    registerComponents({ badge: badgeLive });
  }, bundle);

  const texts = await pg.locator('.badge').allTextContents();
  expect(texts).toEqual(['1', '2']);
});

// ─── array return ──────────────────────────────────────────────────────────

test('component returning an array replaces all SSR elements', async ({ page: pg, bundle }) => {
  function pair({ a, b }) {
    return [t.p({ id: 'pa' }, a), t.p({ id: 'pb' }, b)];
  }

  await inject(pg, renderForHydration(pair, { a: 'foo', b: 'bar' }).toString());

  await pg.evaluate(async src => {
    const { registerComponents, signal, t: tg } = await import(src);
    function pairLive({ a, b }) {
      const sa = signal(a);
      const sb = signal(b);
      return [tg.p({ id: 'pa' }, sa), tg.p({ id: 'pb' }, sb)];
    }
    registerComponents({ pair: pairLive });
  }, bundle);

  await expect(pg.locator('#pa')).toHaveText('foo');
  await expect(pg.locator('#pb')).toHaveText('bar');
  expect(await pg.locator('[data-k-mount-target]').count()).toBe(0);
});

// ─── warnings ─────────────────────────────────────────────────────────────

test('warns when component is not registered', async ({ page: pg, bundle }) => {
  function missing({ x }) {
    return t.div({ id: 'miss' }, String(x));
  }

  await inject(pg, renderForHydration(missing, { x: 1 }).toString());

  const warnings = await pg.evaluate(async src => {
    const w = [];
    const orig = console.warn;
    console.warn = msg => w.push(msg);
    const { registerComponents } = await import(src);
    registerComponents({});
    console.warn = orig;
    return w;
  }, bundle);

  expect(warnings.some(w => w.includes('"missing"'))).toBe(true);
});

test('warns when mount point is not found', async ({ page: pg, bundle }) => {
  function ghost({ x }) {
    return t.div({ id: 'gh' }, String(x));
  }

  await inject(pg, renderForHydration(ghost, { x: 1 }).toString());

  const warnings = await pg.evaluate(async src => {
    const { t: tg } = await import(src);
    // remove mount target before hydrating
    document.querySelector('[data-k-mount-target]')?.removeAttribute('data-k-mount-target');
    const w = [];
    const orig = console.warn;
    console.warn = msg => w.push(msg);
    const { registerComponents } = await import(src);
    function ghostLive({ x }) {
      return tg.div({ id: 'gh' }, String(x));
    }
    registerComponents({ ghost: ghostLive });
    console.warn = orig;
    return w;
  }, bundle);

  expect(warnings.some(w => w.includes('mount point'))).toBe(true);
});

// ─── state passed through ─────────────────────────────────────────────────

test('component receives correct state on hydration', async ({ page: pg, bundle }) => {
  function display({ name, score }) {
    return t.p({ id: 'display' }, `${name}:${score}`);
  }

  await inject(pg, renderForHydration(display, { name: 'Alice', score: 42 }).toString());

  await pg.evaluate(async src => {
    const { registerComponents, t: tg } = await import(src);
    function displayLive({ name, score }) {
      return tg.p({ id: 'display' }, `${name}:${score}`);
    }
    registerComponents({ display: displayLive });
  }, bundle);

  await expect(pg.locator('#display')).toHaveText('Alice:42');
});

// ─── client-only components ───────────────────────────────────────────────

test('mounts client-only component when server component returns null', async ({ page: pg, bundle }) => {
  function clientOnly() {
    return null;
  }

  await inject(pg, renderForHydration(clientOnly, { text: 'hello' }).toString());

  await pg.evaluate(async src => {
    const { registerComponents, t: tg } = await import(src);
    function clientOnlyLive({ text }) {
      return tg.p({ id: 'client-only' }, text);
    }
    registerComponents({ clientOnly: clientOnlyLive });
  }, bundle);

  await expect(pg.locator('#client-only')).toHaveText('hello');
});

// ─── dynamic hydration ────────────────────────────────────────────────────

test('hydrates component inserted into DOM after registerComponents', async ({ page: pg, bundle }) => {
  function counter({ count }) {
    return t.div({ id: 'target' }, String(count));
  }

  const ssrHtml = renderForHydration(counter, { count: 7 }).toString();

  const text = await pg.evaluate(async ({ src, html }) => {
    const { registerComponents, signal, t: tg } = await import(src);
    function counterLive({ count }) {
      const n = signal(count);
      return tg.div({ id: 'target' }, n);
    }
    registerComponents({ counter: counterLive });
    document.body.innerHTML = html;
    await new Promise(resolve => { setTimeout(resolve, 0); });
    return document.getElementById('target')?.textContent;
  }, { src: bundle, html: ssrHtml });

  expect(text).toBe('7');
});

test('stop() prevents hydration of dynamically inserted components', async ({ page: pg, bundle }) => {
  function widget({ value }) {
    return t.div({ id: 'widget' }, String(value));
  }

  const ssrHtml = renderForHydration(widget, { value: 42 }).toString();

  const mountTargetStillPresent = await pg.evaluate(async ({ src, html }) => {
    const { registerComponents, t: tg } = await import(src);
    function widgetLive({ value }) {
      return tg.div({ id: 'widget' }, String(value));
    }
    const handle = registerComponents({ widget: widgetLive });
    handle.stop();
    document.body.innerHTML = html;
    await new Promise(resolve => { setTimeout(resolve, 0); });
    return document.querySelector('[data-k-mount-target]') !== null;
  }, { src: bundle, html: ssrHtml });

  expect(mountTargetStillPresent).toBe(true);
});

// ─── error and deferred paths ──────────────────────────────────────────────

test('client component returning null warns and preserves SSR element', async ({ page: pg, bundle }) => {
  function nullish({ x }) {
    return t.div({ id: 'nullish' }, String(x));
  }

  await inject(pg, renderForHydration(nullish, { x: 1 }).toString());

  const result = await pg.evaluate(async src => {
    const { registerComponents } = await import(src);
    const w = [];
    const orig = console.warn;
    console.warn = msg => w.push(msg);
    registerComponents({ nullish: () => null });
    console.warn = orig;
    return {
      warnings: w,
      ssrPreserved: document.getElementById('nullish') !== null,
    };
  }, bundle);

  expect(result.warnings.some(w => w.includes('returned null'))).toBe(true);
  expect(result.ssrPreserved).toBe(true);
});

test('logs error and preserves SSR element when component throws during hydration', async ({ page: pg, bundle }) => {
  function exploder({ x }) {
    return t.div({ id: 'exploder' }, String(x));
  }

  await inject(pg, renderForHydration(exploder, { x: 1 }).toString());

  const result = await pg.evaluate(async src => {
    const { registerComponents } = await import(src);
    const errors = [];
    const orig = console.error;
    console.error = msg => errors.push(msg);
    registerComponents({ exploder: () => { throw new Error('boom'); } });
    console.error = orig;
    return {
      errors,
      ssrPreserved: document.getElementById('exploder') !== null,
    };
  }, bundle);

  expect(result.errors.some(e => e.includes('"exploder"'))).toBe(true);
  expect(result.ssrPreserved).toBe(true);
});

test('defers hydration until DOMContentLoaded when document is loading', async ({ page: pg, bundle }) => {
  function deferred({ text }) {
    return t.p({ id: 'deferred' }, text);
  }

  await inject(pg, renderForHydration(deferred, { text: 'hi' }).toString());

  const result = await pg.evaluate(async src => {
    const { registerComponents, t: tg } = await import(src);
    Object.defineProperty(document, 'readyState', { configurable: true, get: () => 'loading' });
    function deferredLive({ text }) {
      return tg.p({ id: 'deferred' }, text);
    }
    registerComponents({ deferred: deferredLive });
    const duringLoad = document.querySelector('[data-k-mount-target]') !== null;
    Object.defineProperty(document, 'readyState', { configurable: true, get: () => 'complete' });
    document.dispatchEvent(new Event('DOMContentLoaded'));
    const afterLoad = document.querySelector('[data-k-mount-target]') === null;
    return { duringLoad, afterLoad };
  }, bundle);

  expect(result.duringLoad).toBe(true);
  expect(result.afterLoad).toBe(true);
});

// ─── hmrReplaceComponent ───────────────────────────────────────────────────

test('hmrReplaceComponent preserves keyed signal state across swap', async ({ page: pg, bundle }) => {
  function counter({ start }) {
    return t.div({ id: 'target' }, String(start));
  }

  await inject(pg, renderForHydration(counter, { start: 0 }).toString());

  await pg.evaluate(async src => {
    const { registerComponents, signal, t: tg } = await import(src);
    function counterLive({ start }) {
      const n = signal(start, 'count');
      return tg.button({ id: 'target', onclick: () => n.set(v => v + 1) }, n);
    }
    registerComponents({ counter: counterLive });
  }, bundle);

  await expect(pg.locator('#target')).toHaveText('0');
  await pg.locator('#target').click();
  await pg.locator('#target').click();
  await pg.locator('#target').click();
  await expect(pg.locator('#target')).toHaveText('3');

  await pg.evaluate(async src => {
    const { hmrReplaceComponent, signal, t: tg } = await import(src);
    function counterV2({ start }) {
      const n = signal(start, 'count');
      return tg.button({ id: 'target', 'data-v': '2', onclick: () => n.set(v => v + 10) }, n);
    }
    hmrReplaceComponent('counter', counterV2);
  }, bundle);

  // State preserved through the swap.
  await expect(pg.locator('#target')).toHaveText('3');
  // New DOM in place.
  await expect(pg.locator('#target')).toHaveAttribute('data-v', '2');
  // New behavior wired up — click now adds 10.
  await pg.locator('#target').click();
  await expect(pg.locator('#target')).toHaveText('13');
});

test('hmrReplaceComponent preserves form input value across swap', async ({ page: pg, bundle }) => {
  function form() {
    return t.div({ id: 'wrap' }, [
      t.input({ id: 'field', type: 'text', value: '' }),
    ]);
  }

  await inject(pg, renderForHydration(form, {}).toString());

  await pg.evaluate(async src => {
    const { registerComponents, t: tg } = await import(src);
    function formLive() {
      return tg.div({ id: 'wrap' }, [
        tg.input({ id: 'field', type: 'text' }),
      ]);
    }
    registerComponents({ form: formLive });
  }, bundle);

  await pg.locator('#field').fill('hello world');
  await expect(pg.locator('#field')).toHaveValue('hello world');

  await pg.evaluate(async src => {
    const { hmrReplaceComponent, t: tg } = await import(src);
    function formV2() {
      return tg.div({ id: 'wrap', 'data-v': '2' }, [
        tg.input({ id: 'field', type: 'text' }),
      ]);
    }
    hmrReplaceComponent('form', formV2);
  }, bundle);

  await expect(pg.locator('#field')).toHaveValue('hello world');
  await expect(pg.locator('#wrap')).toHaveAttribute('data-v', '2');
});

test('hmrReplaceComponent stops effects on the discarded subtree', async ({ page: pg, bundle }) => {
  function widget() {
    return t.div({ id: 'w' }, '0');
  }

  await inject(pg, renderForHydration(widget, {}).toString());

  const runs = await pg.evaluate(async src => {
    const { registerComponents, hmrReplaceComponent, signal, t: tg } = await import(src);
    const counts = { v1: 0, v2: 0 };
    const tick = signal(0);
    function v1() {
      return tg.div({ id: 'w' }, tick.transform(n => { counts.v1++; return `v1:${n}`; }));
    }
    registerComponents({ widget: v1 });
    tick.set(1);
    function v2() {
      return tg.div({ id: 'w' }, tick.transform(n => { counts.v2++; return `v2:${n}`; }));
    }
    hmrReplaceComponent('widget', v2);
    await new Promise(r => { requestAnimationFrame(r); });
    await new Promise(r => { requestAnimationFrame(r); });
    const before = { ...counts };
    tick.set(2);
    await new Promise(r => { requestAnimationFrame(r); });
    await new Promise(r => { requestAnimationFrame(r); });
    return { before, after: { ...counts } };
  }, bundle);

  expect(runs.after.v1).toBe(runs.before.v1);
  expect(runs.after.v2).toBeGreaterThan(runs.before.v2);
});
