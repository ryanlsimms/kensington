// Proxy-specific edge-case tests for the slim build. The general tag dispatch is exercised
// by browser.spec.js and signals.spec.js running against the slim bundles. This file covers
// the host coercions and devtools-style accesses where a Proxy can silently misbehave.

import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3847/');
});

const SLIM_BUNDLES = ['/dist/kensington.slim.js', '/dist/kensington.slim.min.js'];

for (const bundle of SLIM_BUNDLES) {
  test.describe(bundle, () => {
    test('JSON.stringify(t) does not throw or loop', async ({ page }) => {
      const result = await page.evaluate(async src => {
        const { default: Kensington } = await import(src);
        const t = new Kensington();
        const json = JSON.stringify(t);
        return { ok: true, length: json.length };
      }, bundle);
      expect(result.ok).toBe(true);
    });

    test('symbol property access returns undefined cleanly', async ({ page }) => {
      const ok = await page.evaluate(async src => {
        const { default: Kensington } = await import(src);
        const t = new Kensington();
        return t[Symbol.iterator] === undefined
          && t[Symbol.toPrimitive] === undefined
          && t[Symbol.asyncIterator] === undefined;
      }, bundle);
      expect(ok).toBe(true);
    });

    test('Object.keys(t) returns only real instance keys, not tag names', async ({ page }) => {
      const keys = await page.evaluate(async src => {
        const { default: Kensington } = await import(src);
        const t = new Kensington();
        return Object.keys(t);
      }, bundle);
      // Real instance fields (validationLevel, namespaces, etc.) and bound methods. No tag names.
      expect(keys).not.toContain('div');
      expect(keys).not.toContain('svg');
      expect(keys).toContain('validationLevel');
    });

    test('Reflect.has and `in` reflect only real members, not the Proxy lookup', async ({ page }) => {
      const result = await page.evaluate(async src => {
        const { default: Kensington } = await import(src);
        const t = new Kensington();
        return {
          // 'div' is false because the Proxy does not trap `has`.
          divIn: 'div' in t,
          validationLevelIn: 'validationLevel' in t,
          createTagIn: 'createTag' in t,
          literalIn: 'literal' in t,
        };
      }, bundle);
      expect(result.divIn).toBe(false);
      expect(result.validationLevelIn).toBe(true);
      expect(result.createTagIn).toBe(true);
      expect(result.literalIn).toBe(true);
    });

    test('repeated tag access returns the same closure (memoization)', async ({ page }) => {
      const same = await page.evaluate(async src => {
        const { default: Kensington } = await import(src);
        const t = new Kensington();
        const div1 = t.div;
        const div2 = t.div;
        const svg1 = t.svg;
        const svg2 = t.svg;
        return div1 === div2 && svg1 === svg2 && div1 !== svg1;
      }, bundle);
      expect(same).toBe(true);
    });

    test('destructuring tag methods works and the closure carries the right name', async ({ page }) => {
      const result = await page.evaluate(async src => {
        const { default: Kensington } = await import(src);
        const t = new Kensington();
        const { div, span, animateMotion } = t;
        return {
          divName: div.name,
          spanName: span.name,
          animateName: animateMotion.name,
          divOutput: div('x').toString(),
          spanOutput: span('y').toString(),
        };
      }, bundle);
      expect(result.divName).toBe('div');
      expect(result.spanName).toBe('span');
      expect(result.animateName).toBe('animateMotion');
      expect(result.divOutput).toBe('<div>x</div>');
      expect(result.spanOutput).toBe('<span>y</span>');
    });

    test('instanceof works through the Proxy', async ({ page }) => {
      const isInstance = await page.evaluate(async src => {
        const { default: Kensington } = await import(src);
        const t = new Kensington();
        return t instanceof Kensington;
      }, bundle);
      expect(isInstance).toBe(true);
    });

    test('accessing an unknown tag returns undefined and does not pollute the cache', async ({ page }) => {
      const result = await page.evaluate(async src => {
        const { default: Kensington } = await import(src);
        const t = new Kensington();
        const before = t.totallyNotATag;
        const after = t.totallyNotATag;
        return {
          beforeIsUndefined: before === undefined,
          afterIsUndefined: after === undefined,
          divStillWorks: t.div().toString(),
        };
      }, bundle);
      expect(result.beforeIsUndefined).toBe(true);
      expect(result.afterIsUndefined).toBe(true);
      expect(result.divStillWorks).toBe('<div></div>');
    });

    test('toElement() builds a real DOM node via the Proxy', async ({ page }) => {
      const tag = await page.evaluate(async src => {
        const { default: Kensington } = await import(src);
        const t = new Kensington();
        const el = t.div({ class: 'hi' }, t.span('inner')).toElement();
        return { tagName: el.tagName, html: el.outerHTML };
      }, bundle);
      expect(tag.tagName).toBe('DIV');
      expect(tag.html).toBe('<div class="hi"><span>inner</span></div>');
    });
  });
}
