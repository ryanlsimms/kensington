import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compileFunction } from 'node:vm';

import { expect, test } from '@playwright/test';
import { renderForHydration, signal, t } from 'kensington';

function aiExample(heading) {
  const source = readFileSync(new URL('../../agent-docs/reactive.md', import.meta.url), 'utf8');
  const section = source.split(`#### ${heading}\n`)[1];
  return section.match(/```javascript\n([\s\S]*?)```/)[1].trim();
}

function exampleLines(source) {
  // The documentation renderer removes blank lines from code blocks.
  return source.trim().split('\n').filter(line => line.trim());
}

test('direct hash loads at its target without animated scrolling', async ({ page }) => {
  await page.route(/https:\/\/(?:cdn\.jsdelivr\.net|fonts\.googleapis\.com|db\.onlinewebfonts\.com)\//, route => route.abort());
  await page.addInitScript(() => {
    window.__docsScrollPositions = [];
    window.addEventListener('scroll', () => {
      window.__docsScrollPositions.push(window.scrollY);
    }, { passive: true });
  });

  await page.goto('http://127.0.0.1:4000/?page=reactivity#signals-batching');
  await expect(page.locator('#signals-batching')).toBeInViewport();

  const state = await page.evaluate(() => ({
    finalPosition: window.scrollY,
    initialHashMode: document.documentElement.hasAttribute('data-initial-hash'),
    positions: window.__docsScrollPositions,
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    targetTop: document.getElementById('signals-batching').getBoundingClientRect().top,
  }));

  const firstNonzeroPosition = state.positions.find(position => position > 1);
  expect(firstNonzeroPosition).toBeDefined();
  expect(firstNonzeroPosition).toBeGreaterThan(state.finalPosition * 0.9);
  expect(state.initialHashMode).toBe(false);
  expect(state.scrollBehavior).toBe('smooth');
  expect(state.targetTop).toBeGreaterThanOrEqual(0);
  expect(state.targetTop).toBeLessThan(180);
});

test('pending updates are linked from both sidebars and the documented example works', async ({ page }) => {
  await page.route(/https:\/\/(?:cdn\.jsdelivr\.net|fonts\.googleapis\.com|db\.onlinewebfonts\.com)\//, route => route.abort());
  await page.goto('http://127.0.0.1:4000/?page=api');
  await page.locator('a[href="#api-apply-pending-reactive-updates"]').click();
  await expect(page.locator('#api-apply-pending-reactive-updates')).toBeInViewport();
  await expect(page.locator('#api-batch')).toHaveCount(0);
  await page.getByRole('link', { name: 'Update timing', exact: true }).click();
  await expect(page.locator('#signals-batching')).toBeInViewport();
  await page.locator('a[href="#apply-pending-reactive-updates"]').click();
  await expect(page.locator('#apply-pending-reactive-updates')).toBeInViewport();
  const example = await page.locator('#signals-batching pre code').nth(1).textContent();

  await page.goto('http://localhost:3847/');
  const seen = [];
  page.on('console', message => {
    if (message.type() === 'log') { seen.push(message.text()); }
  });
  await page.addScriptTag({
    type: 'module',
    content: example.replace("from 'kensington'", "from '/esm/index.js'"),
  });
  await expect.poll(() => seen).toEqual(['Before', 'After']);
});

test('the timing comparison is linked from the API and demonstrates deferred callbacks', async ({ page }) => {
  await page.route(/https:\/\/(?:cdn\.jsdelivr\.net|fonts\.googleapis\.com|db\.onlinewebfonts\.com)\//, route => route.abort());
  await page.goto('http://127.0.0.1:4000/?page=api#api-apply-pending-reactive-updates');
  await page.getByRole('link', { name: 'Choose how to wait', exact: true }).click();
  await expect(page.locator('#choosing-update-timing')).toBeInViewport();
  // These are displayed API labels, not calls that schedule work in this test.
  await expect(page.locator('#choosing-update-timing tbody tr td:first-child')).toHaveText([
    'applyPendingReactiveUpdates()', 'queueMicrotask(callback)', 'await Promise.resolve()',
  ]);
  await expect(page.locator('a[href="#choosing-update-timing"]')).toHaveText('Choose how to wait');
  await page.locator('a[href="#defer-a-callback"]').click();
  await expect(page.locator('#defer-a-callback')).toBeInViewport();
  const example = await page.locator('#defer-a-callback pre code').textContent();

  await page.goto('http://localhost:3847/');
  const seen = [];
  page.on('console', message => {
    if (message.type() === 'log') { seen.push(message.text()); }
  });
  await page.addScriptTag({ type: 'module', content: example });
  await expect.poll(() => seen).toEqual(['current code', 'callback']);
});

test('the human and AI focus examples focus the new input before the handler returns', async ({ page }) => {
  await page.route(/https:\/\/(?:cdn\.jsdelivr\.net|fonts\.googleapis\.com|db\.onlinewebfonts\.com)\//, route => route.abort());
  await page.goto('http://127.0.0.1:4000/?page=reactivity#reactive-focus-example');
  await expect(page.locator('a[href="#reactive-focus-example"]')).toHaveText('Focus an input');
  const example = await page.locator('#reactive-focus-example pre code').textContent();
  expect(exampleLines(example)).toEqual(exampleLines(aiExample('Focus an input after showing it')));

  await page.goto('http://localhost:3847/');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addScriptTag({
    type: 'module',
    content: example.replace("from 'kensington'", "from '/esm/index.js'"),
  });
  const state = await page.getByRole('button', { name: 'Edit title', exact: true }).evaluate(button => {
    button.click();
    // Read in the same turn so automatic batching cannot hide a missing helper.
    const input = document.querySelector('input');
    return input && {
      focused: document.activeElement === input,
      value: input.value,
      selection: [input.selectionStart, input.selectionEnd],
    };
  });
  expect(state).toEqual({ focused: true, value: 'Draft title', selection: [0, 11] });
  expect(errors).toEqual([]);
});

test('the human and AI removal examples wait for cleanup before reusing the tag', async ({ page }) => {
  await page.route(/https:\/\/(?:cdn\.jsdelivr\.net|fonts\.googleapis\.com|db\.onlinewebfonts\.com)\//, route => route.abort());
  await page.goto('http://127.0.0.1:4000/?page=reactivity#wait-for-removal-cleanup');
  await expect(page.locator('a[href="#wait-for-removal-cleanup"]')).toHaveText('Wait for removal cleanup');
  const example = await page.locator('#wait-for-removal-cleanup pre code').textContent();
  expect(exampleLines(example)).toEqual(exampleLines(aiExample('Let a pending removal observer run')));

  await page.goto('http://localhost:3847/');
  const seen = [];
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'log') { seen.push(message.text()); }
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.addScriptTag({
    type: 'module',
    content: example.replace("from 'kensington'", "from '/esm/index.js'"),
  });
  await expect.poll(() => seen).toEqual(['false']);
  expect(errors).toEqual([]);
});

test('the documented nonce example hydrates under its CSP response header', async ({ page }) => {
  await page.route(/https:\/\/(?:cdn\.jsdelivr\.net|fonts\.googleapis\.com|db\.onlinewebfonts\.com)\//, route => route.abort());
  await page.goto('http://127.0.0.1:4000/?page=api#register-components-nonce');
  const snippets = page.locator('#register-components-nonce pre code');
  await expect(snippets).toHaveCount(3);
  const [sharedSource, serverSource, clientSource] = await snippets.allTextContents();

  // Execute the displayed server code with an Express adapter so the test needs no
  // additional dependency or listening port. The route and HTML generation run unchanged.
  let render;
  const app = {
    use() { return this; },
    get(path, handler) {
      expect(path).toBe('/');
      render = handler;
    },
    listen() { return this; },
  };
  const express = Object.assign(() => app, { static: () => null });
  const withoutImports = source => source.replace(/^import .+;$/gm, '');
  compileFunction([
    withoutImports(sharedSource).replace('export function', 'function'),
    withoutImports(serverSource),
  ].join('\n'), ['express', 'randomBytes', 'renderForHydration', 'signal', 't'])(
    express, randomBytes, renderForHydration, signal, t,
  );

  function renderResponse() {
    const result = { headers: {}, body: '' };
    render({}, {
      set(name, value) {
        result.headers[name.toLowerCase()] = value;
      },
      type() {
        result.headers['content-type'] = 'text/html';
        return this;
      },
      send(body) { result.body = body; },
    });
    return result;
  }
  const response = renderResponse();
  const policy = response.headers['content-security-policy'];
  const nonce = policy.match(/style-src 'self' 'nonce-([^']+)'/)[1];
  expect(Buffer.from(nonce, 'base64')).toHaveLength(16);
  expect(response.headers['cache-control']).toBe('no-store');
  expect(renderResponse().headers['content-security-policy']).not.toBe(policy);

  await page.addInitScript(() => {
    window.__nonceGuards = [];
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', event => {
      window.__cspViolations.push(event.violatedDirective);
    });
    const originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function appendChild(child) {
      const result = originalAppendChild.call(this, child);
      if (child.nodeType === 1 && child.matches('style[data-k-ssr]')) {
        window.__nonceGuards.push({ nonce: child.nonce, hasSheet: child.sheet !== null });
      }
      return result;
    };
  });

  // Resolve the package import as a browser bundler would, keeping the displayed
  // component and client entry intact apart from their module specifiers.
  const browserSource = source => source.replaceAll("from 'kensington'", "from '/esm/index.js'");
  await page.route('http://localhost:3847/shared/counter.js', route => route.fulfill({
    contentType: 'text/javascript', body: browserSource(sharedSource),
  }));
  await page.route('http://localhost:3847/client.js', route => route.fulfill({
    contentType: 'text/javascript', body: browserSource(clientSource),
  }));
  await page.route('http://localhost:3847/nonce-example', route => route.fulfill(response));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:3847/nonce-example');
  await expect(page.locator('script[data-k-component]')).toHaveCount(0);
  await page.getByRole('button', { name: '0 clicks' }).click();
  await expect(page.getByRole('button')).toHaveText('1 clicks');
  await expect(page.locator('style[data-k-ssr]')).toHaveCount(0);

  const state = await page.evaluate(() => ({
    nonce: document.getElementById('app-client').nonce,
    hiddenAttribute: document.getElementById('app-client').getAttribute('nonce'),
    guards: window.__nonceGuards,
    violations: window.__cspViolations,
  }));
  expect(state.nonce).toBe(nonce);
  expect(state.hiddenAttribute).toBe('');
  expect(state.guards).toEqual([{ nonce, hasSheet: true }]);
  expect(state.violations).toEqual([]);
  expect(errors).toEqual([]);
});
