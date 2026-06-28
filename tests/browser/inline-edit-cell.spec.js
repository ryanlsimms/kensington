// Repro for the live-spreadsheet-r1 bug: a transform body that swaps between
// an input (edit mode) and a div containing a nested keyed computed (display
// mode) doesn't always replace the DOM correctly on the second commit.
// Pattern is the one in agent-docs/reactive.md "Spreadsheet-style inline-edit
// cell".

import { expect, test } from './config/fixtures.js';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3847/');
});

test('inline-edit cell transform swaps input back to display tag after commit', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);

    const cellValue = signal('initial');
    const editing = signal(null);

    const body = editing.transform(isEd => {
      if (isEd === 'cell-1') {
        return t.input({ id: 'the-input', type: 'text', class: 'edit-mode' });
      }
      const display = cellValue.transform(v => String(v), 'display-text');
      return t.div({ class: 'display-mode' }, display);
    }, 'cell-body:cell-1');

    document.body.append(t.div({ id: 'host' }, body).toElement());

    // Initial render. Display mode with text 'initial'.
    // Enter edit mode.
    editing.set('cell-1');
    await new Promise(r => { queueMicrotask(r); });

    // Simulate a commit. Update the value, then exit edit mode.
    cellValue.set('committed');
    editing.set(null);

    await new Promise(r => { queueMicrotask(r); });
    await new Promise(r => { queueMicrotask(r); });
  }, bundle);

  // The input from edit mode should be gone.
  await expect(page.locator('#the-input')).toHaveCount(0);
  // A div with the new value should be present.
  await expect(page.locator('#host .display-mode')).toHaveText('committed');
});

// eslint-disable-next-line @stylistic/js/max-len
test('inline-edit cell display refreshes on cellValue change AFTER returning from edit mode', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);

    const cellValue = signal('v0');
    const editing = signal(null);

    const body = editing.transform(isEd => {
      if (isEd === 'cell-1') {
        return t.input({ id: 'the-input', type: 'text', class: 'edit-mode' });
      }
      const display = cellValue.transform(v => String(v), 'display-text');
      return t.div({ class: 'display-mode' }, display);
    }, 'cell-body:cell-1');

    document.body.append(t.div({ id: 'host' }, body).toElement());

    // Toggle into edit mode and back.
    editing.set('cell-1');
    await new Promise(r => { queueMicrotask(r); });
    editing.set(null);
    await new Promise(r => { queueMicrotask(r); });

    // NOW update cellValue. The display computed for the post-commit run
    // should be subscribed and re-render the text.
    cellValue.set('v1');
    await new Promise(r => { queueMicrotask(r); });
    await new Promise(r => { queueMicrotask(r); });
  }, bundle);

  await expect(page.locator('#host .display-mode')).toHaveText('v1');
});
