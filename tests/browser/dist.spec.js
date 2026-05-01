import { test, expect } from '@playwright/test';
import { registerTests } from './browser-tests.js';

for (const bundle of ['/dist/kensington.js', '/dist/kensington.min.js']) {
  test.describe(bundle, () => {
    registerTests(bundle);

    test('validationLevel error throws on invalid attribute', async ({ page }) => {
      const threw = await page.evaluate(async src => {
        const { default: Kensington } = await import(src);
        const tt = new Kensington({ validationLevel: 'error' });
        try {
          tt.div({ invalidAttr: 'value' }).toString();
          return false;
        } catch {
          return true;
        }
      }, bundle);
      expect(threw).toBe(true);
    });

    test('validationLevel warn calls logger without throwing', async ({ page }) => {
      const result = await page.evaluate(async src => {
        const { default: Kensington } = await import(src);
        let warned = false;
        const tt = new Kensington({
          validationLevel: 'warn',
          logger() { warned = true; }
        });
        try {
          tt.div({ invalidAttr: 'value' }).toString();
          return warned;
        } catch {
          return false;
        }
      }, bundle);
      expect(result).toBe(true);
    });
  });
}

for (const bundle of ['/dist/kensington.slim.js', '/dist/kensington.slim.min.js']) {
  test.describe(bundle, () => {
    registerTests(bundle);

    for (const level of ['error', 'warn']) {
      test(`throws when validationLevel is '${level}'`, async ({ page }) => {
        const threw = await page.evaluate(async ({ src, level }) => {
          const { default: Kensington } = await import(src);
          try {
            new Kensington({ validationLevel: level });
            return false;
          } catch {
            return true;
          }
        }, { src: bundle, level });
        expect(threw).toBe(true);
      });
    }
  });
}
