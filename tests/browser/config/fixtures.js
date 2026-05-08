import { test as base } from '@playwright/test';

export const test = base.extend({
  bundle: ['/esm/index.js', { option: true }],
});

export { expect } from '@playwright/test';
