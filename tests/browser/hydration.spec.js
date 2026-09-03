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
  expect(hadMountTarget.after).toBe(true);
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

test('transition suppression is removed after the mount-time reactive flush', async ({ page: pg, bundle }) => {
  function panel({ opacity }) {
    return t.div({ id: 'panel', class: 'motion', style: `opacity:${opacity}` }, 'panel');
  }

  await inject(pg, renderForHydration(panel, { opacity: 0 }).toString());

  const result = await pg.evaluate(async src => {
    const css = document.createElement('style');
    css.textContent = '.motion{transition:opacity 2s linear;animation:k-pulse 2s linear infinite}' +
      '@keyframes k-pulse{from{transform:scale(1)}to{transform:scale(.99)}}';
    document.head.appendChild(css);

    let transitionStarts = 0;
    document.addEventListener('transitionstart', event => {
      if (event.target.id === 'panel' && event.propertyName === 'opacity') {
        transitionStarts++;
      }
    });

    const { registerComponents, signal, t: tg } = await import(src);
    let value;
    function panelLive({ opacity }) {
      value = signal(opacity);
      queueMicrotask(() => { value.set(1); });
      return tg.div({ id: 'panel', class: 'motion', style: { opacity: value } }, 'panel');
    }
    registerComponents({ panel: panelLive });

    const panelEl = document.getElementById('panel');
    const during = getComputedStyle(panelEl);
    const whileMounting = {
      guardCount: document.querySelectorAll('style[data-k-ssr]').length,
      transitionProperty: during.transitionProperty,
      animationName: during.animationName,
    };

    await new Promise(resolve => { requestAnimationFrame(resolve); });
    await new Promise(resolve => { requestAnimationFrame(resolve); });
    const after = getComputedStyle(panelEl);
    const afterMount = {
      guardCount: document.querySelectorAll('style[data-k-ssr]').length,
      transitionProperty: after.transitionProperty,
      animationName: after.animationName,
      opacity: after.opacity,
      transitionStarts,
    };

    value.set(0);
    await Promise.resolve();
    await new Promise(resolve => { requestAnimationFrame(resolve); });
    await new Promise(resolve => { requestAnimationFrame(resolve); });

    return {
      whileMounting,
      afterMount,
      transitionStartsAfterLaterUpdate: transitionStarts,
    };
  }, bundle);

  expect(result.whileMounting).toEqual({
    guardCount: 1,
    transitionProperty: 'none',
    animationName: 'none',
  });
  expect(result.afterMount).toEqual({
    guardCount: 0,
    transitionProperty: 'opacity',
    animationName: 'k-pulse',
    opacity: '1',
    transitionStarts: 0,
  });
  expect(result.transitionStartsAfterLaterUpdate).toBeGreaterThan(0);
});

test('transition suppression covers mount-time updates from connected callbacks', async ({ page: pg, bundle }) => {
  function panel({ opacity }) {
    return t.div({ id: 'connected-panel', class: 'motion', style: `opacity:${opacity}` }, 'panel');
  }

  await inject(pg, renderForHydration(panel, { opacity: 0 }).toString());

  const result = await pg.evaluate(async src => {
    const css = document.createElement('style');
    css.textContent = '.motion{transition:opacity 2s linear}';
    document.head.appendChild(css);

    let transitionStarts = 0;
    document.addEventListener('transitionstart', event => {
      if (event.target.id === 'connected-panel' && event.propertyName === 'opacity') {
        transitionStarts++;
      }
    });

    const { registerComponents, signal, t: tg } = await import(src);
    function panelLive({ opacity }) {
      const value = signal(opacity);
      const tag = tg.div({ id: 'connected-panel', class: 'motion', style: { opacity: value } }, 'panel');
      tag.addConnectedCallback(node => {
        node.getBoundingClientRect();
        value.set(1);
      });
      return tag;
    }
    registerComponents({ panel: panelLive });

    await new Promise(resolve => { requestAnimationFrame(resolve); });
    await new Promise(resolve => { requestAnimationFrame(resolve); });
    return {
      guardCount: document.querySelectorAll('style[data-k-ssr]').length,
      opacity: getComputedStyle(document.getElementById('connected-panel')).opacity,
      transitionStarts,
    };
  }, bundle);

  expect(result).toEqual({ guardCount: 0, opacity: '1', transitionStarts: 0 });
});

test('transition guard fallback remains through mount-time microtasks without requestAnimationFrame', async ({
  page: pg,
  bundle,
}) => {
  function panel({ opacity }) {
    return t.div({ id: 'fallback-panel', class: 'motion', style: `opacity:${opacity}` }, 'panel');
  }

  await inject(pg, renderForHydration(panel, { opacity: 0 }).toString());

  const result = await pg.evaluate(async src => {
    const css = document.createElement('style');
    css.textContent = '.motion{transition:opacity 2s linear}';
    document.head.appendChild(css);

    const originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = undefined;
    try {
      const { registerComponents, signal, t: tg } = await import(src);
      function panelLive({ opacity }) {
        const value = signal(opacity);
        queueMicrotask(() => { value.set(1); });
        return tg.div({ id: 'fallback-panel', class: 'motion', style: { opacity: value } }, 'panel');
      }
      registerComponents({ panel: panelLive });

      await Promise.resolve();
      await Promise.resolve();
      const afterMicrotasks = {
        guardCount: document.querySelectorAll('style[data-k-ssr]').length,
        opacity: getComputedStyle(document.getElementById('fallback-panel')).opacity,
      };

      await new Promise(resolve => { setTimeout(resolve, 0); });
      return {
        afterMicrotasks,
        afterTask: {
          guardCount: document.querySelectorAll('style[data-k-ssr]').length,
          transitionProperty: getComputedStyle(document.getElementById('fallback-panel')).transitionProperty,
        },
      };
    } finally {
      window.requestAnimationFrame = originalRaf;
    }
  }, bundle);

  expect(result).toEqual({
    afterMicrotasks: { guardCount: 1, opacity: '1' },
    afterTask: { guardCount: 0, transitionProperty: 'opacity' },
  });
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

test('coalesces transition guard cleanup for hydration batches in the same frame', async ({ page: pg, bundle }) => {
  function box({ id }) {
    return t.div({ id }, id);
  }

  const html = renderForHydration(box, { id: 'first' }, 'first').toString() +
    renderForHydration(box, { id: 'second' }, 'second').toString();
  await inject(pg, html);

  const result = await pg.evaluate(async src => {
    const { registerComponents, t: tg } = await import(src);
    const documentElement = document.documentElement;
    const originalRect = documentElement.getBoundingClientRect;
    let layoutFlushes = 0;
    documentElement.getBoundingClientRect = function getBoundingClientRect(...args) {
      layoutFlushes++;
      return originalRect.apply(this, args);
    };

    try {
      function first({ id }) {
        return tg.div({ id }, id);
      }
      function second({ id }) {
        return tg.div({ id }, id);
      }
      registerComponents({ first });
      registerComponents({ second });
      const guardsBeforeFrame = document.querySelectorAll('style[data-k-ssr]').length;
      await new Promise(resolve => { requestAnimationFrame(resolve); });
      return {
        guardsBeforeFrame,
        guardsAfterFrame: document.querySelectorAll('style[data-k-ssr]').length,
        layoutFlushes,
      };
    } finally {
      documentElement.getBoundingClientRect = originalRect;
    }
  }, bundle);

  expect(result).toEqual({ guardsBeforeFrame: 2, guardsAfterFrame: 0, layoutFlushes: 1 });
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
  expect(await pg.locator('[data-k-mount-target]').count()).toBe(2);
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

test('dynamic hydration suppresses only the newly mounted component', async ({ page: pg, bundle }) => {
  function panel({ id }) {
    return t.div({ id, class: 'motion' }, id);
  }

  const initialHtml = renderForHydration(panel, { id: 'existing' }).toString();
  const dynamicHtml = renderForHydration(panel, { id: 'dynamic' }).toString();
  await inject(pg, initialHtml);

  const result = await pg.evaluate(async ({ src, html }) => {
    const css = document.createElement('style');
    css.textContent = '.motion{transition:opacity 2s linear}';
    document.head.appendChild(css);

    const { registerComponents, t: tg } = await import(src);
    function panelLive({ id }) {
      return tg.div({ id, class: 'motion' }, id);
    }
    registerComponents({ panel: panelLive });
    await new Promise(resolve => { requestAnimationFrame(resolve); });

    const existing = document.getElementById('existing');
    const existingMountId = existing.dataset.kMountTarget;
    document.body.insertAdjacentHTML('beforeend', html);
    await Promise.resolve();

    const dynamic = document.getElementById('dynamic');
    const guard = document.querySelector('style[data-k-ssr]');
    const whileMounting = {
      guardCount: document.querySelectorAll('style[data-k-ssr]').length,
      guardIncludesExistingMount: guard.textContent.includes(existingMountId),
      existingTransition: getComputedStyle(existing).transitionProperty,
      dynamicTransition: getComputedStyle(dynamic).transitionProperty,
    };

    await new Promise(resolve => { requestAnimationFrame(resolve); });
    return {
      whileMounting,
      afterMount: {
        guardCount: document.querySelectorAll('style[data-k-ssr]').length,
        dynamicTransition: getComputedStyle(dynamic).transitionProperty,
      },
    };
  }, { src: bundle, html: dynamicHtml });

  expect(result.whileMounting).toEqual({
    guardCount: 1,
    guardIncludesExistingMount: false,
    existingTransition: 'opacity',
    dynamicTransition: 'none',
  });
  expect(result.afterMount).toEqual({
    guardCount: 0,
    dynamicTransition: 'opacity',
  });
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

test('does not add transition guards for hydration paths that preserve SSR', async ({ page: pg, bundle }) => {
  function serverPanel({ id }) {
    return t.div({ id, class: 'motion' }, id);
  }

  const html = [
    ['missing', 'missing'],
    ['ghost', 'ghost'],
    ['nullish', 'nullish'],
    ['exploder', 'exploder'],
    ['invalid', 'invalid'],
  ].map(([name, id]) => renderForHydration(serverPanel, { id }, name).toString()).join('');
  await inject(pg, html);

  const result = await pg.evaluate(async src => {
    document.getElementById('ghost').removeAttribute('data-k-mount-target');

    let guardInsertions = 0;
    const styleObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && node.matches('style[data-k-ssr]')) {
            guardInsertions++;
          }
        }
      }
    });
    styleObserver.observe(document.head, { childList: true });

    const warnings = [];
    const errors = [];
    const originalWarn = console.warn;
    const originalError = console.error;
    console.warn = (...args) => warnings.push(args.map(String).join(' '));
    console.error = (...args) => errors.push(args.map(String).join(' '));
    try {
      const { registerComponents, t: tg } = await import(src);
      registerComponents({
        ghost: ({ id }) => tg.div({ id }, id),
        nullish: () => null,
        exploder: () => { throw new Error('boom'); },
        invalid: () => tg.literal('<div id="invalid">client</div>'),
      });
      await Promise.resolve();
    } finally {
      console.warn = originalWarn;
      console.error = originalError;
      styleObserver.disconnect();
    }

    return {
      guardInsertions,
      guardCount: document.querySelectorAll('style[data-k-ssr]').length,
      preservedIds: ['missing', 'ghost', 'nullish', 'exploder', 'invalid']
        .filter(id => document.getElementById(id) !== null),
      stateCount: document.querySelectorAll('script[data-k-component]').length,
      sawMissingWarning: warnings.some(message => message.includes('no component registered for "missing"')),
      sawMountWarning: warnings.some(message => message.includes('mount point for "ghost"')),
      sawNullWarning: warnings.some(message => message.includes('"nullish" returned null')),
      sawExploderError: errors.some(message => message.includes('failed to hydrate "exploder"')),
      sawInvalidError: errors.some(message => message.includes('failed to hydrate "invalid"')),
    };
  }, bundle);

  expect(result).toEqual({
    guardInsertions: 0,
    guardCount: 0,
    preservedIds: ['missing', 'ghost', 'nullish', 'exploder', 'invalid'],
    stateCount: 5,
    sawMissingWarning: true,
    sawMountWarning: true,
    sawNullWarning: true,
    sawExploderError: true,
    sawInvalidError: true,
  });
});

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

test('client component returning a non-element root logs an error and preserves SSR', async ({ page: pg, bundle }) => {
  function literalRoot() {
    return t.div({ id: 'literal-root' }, 'server');
  }

  await inject(pg, renderForHydration(literalRoot, {}).toString());

  const result = await pg.evaluate(async src => {
    const { registerComponents, t: tg } = await import(src);
    const errors = [];
    const orig = console.error;
    console.error = (...args) => errors.push(args.map(String).join(' '));
    registerComponents({ literalRoot: () => tg.literal('<div id="literal-root">client</div>') });
    console.error = orig;
    return {
      errors,
      text: document.getElementById('literal-root')?.textContent,
      statePreserved: document.querySelector('script[data-k-component="literalRoot"]') !== null,
    };
  }, bundle);

  expect(result.errors.some(e => e.includes('must return ContentTag or VoidTag roots'))).toBe(true);
  expect(result.text).toBe('server');
  expect(result.statePreserved).toBe(true);
});

test('hydrates a template root with content stored in template.content', async ({ page: pg, bundle }) => {
  function templateRoot({ text }) {
    return t.template(t.span(text));
  }

  await inject(pg, renderForHydration(templateRoot, { text: 'hello' }).toString());

  const result = await pg.evaluate(async src => {
    const { registerComponents, t: tg } = await import(src);
    function templateRootLive({ text }) {
      return tg.template(tg.span(text));
    }
    registerComponents({ templateRoot: templateRootLive });
    const template = document.querySelector('template[data-k-mount-target]');
    return {
      content: template?.content.querySelector('span')?.textContent,
      lightChildren: template?.childNodes.length,
      stateRemoved: document.querySelector('script[data-k-component="templateRoot"]') === null,
    };
  }, bundle);

  expect(result).toEqual({ content: 'hello', lightChildren: 0, stateRemoved: true });
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
    const afterLoad = document.querySelector('script[data-k-component]') === null;
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
