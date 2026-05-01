import { test } from '@playwright/test';
import { registerTests } from './browser-tests.js';

for (const bundle of ['/dist/kensington.js', '/dist/kensington.min.js']) {
  test.describe(bundle, () => {
    registerTests(bundle);
  });
}
