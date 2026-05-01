import { test, expect } from '@playwright/test';

export function registerTests(bundle) {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

  // ─── element creation ──────────────────────────────────────────────────────

  test('creates element with correct tag name', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.section().toElement());
    }, bundle);
    await expect(page.locator('section')).toBeAttached();
  });

  test('creates void element', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.input({ type: 'text' }).toElement());
    }, bundle);
    await expect(page.locator('input')).toHaveAttribute('type', 'text');
  });

  // ─── attributes ────────────────────────────────────────────────────────────

  test('sets string attributes', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.div({ id: 'a', class: 'foo' }).toElement());
    }, bundle);
    await expect(page.locator('#a')).toHaveClass('foo');
  });

  test('sets number attributes as strings', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.input({ type: 'text', maxlength: 10 }).toElement());
    }, bundle);
    await expect(page.locator('input')).toHaveAttribute('maxlength', '10');
  });

  test('converts camelCase to kebab-case attributes', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.div({ dataBsToggle: 'collapse' }).toElement());
    }, bundle);
    await expect(page.locator('div')).toHaveAttribute('data-bs-toggle', 'collapse');
  });

  test('converts nested object to data attributes', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.div({ data: { bs: { toggle: 'collapse', target: '#x' } } }).toElement());
    }, bundle);
    await expect(page.locator('div')).toHaveAttribute('data-bs-toggle', 'collapse');
    await expect(page.locator('div')).toHaveAttribute('data-bs-target', '#x');
  });

  test('boolean true sets attribute, boolean false omits it', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.input({ type: 'checkbox', checked: true, required: false }).toElement());
    }, bundle);
    await expect(page.locator('input')).toBeChecked();
    await expect(page.locator('input')).not.toHaveAttribute('required');
  });

  test('class as array joins values with a space', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.div({ class: ['foo', 'bar'] }).toElement());
    }, bundle);
    await expect(page.locator('div')).toHaveClass('foo bar');
  });

  // ─── content ───────────────────────────────────────────────────────────────

  test('sets text content as a text node', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.p('hello world').toElement());
    }, bundle);
    await expect(page.locator('p')).toHaveText('hello world');
  });

  test('sets number content as a text node', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.span(42).toElement());
    }, bundle);
    await expect(page.locator('span')).toHaveText('42');
  });

  test('creates nested elements', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.ul([t.li('one'), t.li('two')]).toElement());
    }, bundle);
    await expect(page.locator('ul li')).toHaveCount(2);
    await expect(page.locator('ul li').nth(0)).toHaveText('one');
    await expect(page.locator('ul li').nth(1)).toHaveText('two');
  });

  test('literal creates element from raw HTML string', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.literal('<p id="from-literal">hello</p>').toElement());
    }, bundle);
    await expect(page.locator('#from-literal')).toHaveText('hello');
  });

  // ─── event listeners ───────────────────────────────────────────────────────

  test('attaches event listener via function attribute', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(
        t.button({
          type: 'button',
          onclick: () => { document.body.dataset.clicked = 'yes'; }
        }, 'Click Me').toElement()
      );
    }, bundle);
    await page.locator('button').click();
    await expect(page.locator('body')).toHaveAttribute('data-clicked', 'yes');
  });

  test('attaches non-click event listener via function attribute', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(
        t.input({
          type: 'text',
          oninput: () => { document.body.dataset.typed = 'yes'; }
        }).toElement()
      );
    }, bundle);
    await page.locator('input').fill('hi');
    await expect(page.locator('body')).toHaveAttribute('data-typed', 'yes');
  });

  test('sets aria attributes on element', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.button({ type: 'button', 'aria-label': 'close' }, 'x').toElement());
    }, bundle);
    await expect(page.locator('button')).toHaveAttribute('aria-label', 'close');
  });

  test('sets data attributes on element', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.div({ 'data-testid': 'my-div' }).toElement());
    }, bundle);
    await expect(page.locator('[data-testid="my-div"]')).toBeAttached();
  });

  // ─── encoding ──────────────────────────────────────────────────────────────

  test('special chars in text content are not double-encoded', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.p({ id: 'enc-content' }, 'a & b < c > d "e"').toElement());
    }, bundle);
    await expect(page.locator('#enc-content')).toHaveText('a & b < c > d "e"');
  });

  test('special chars in attribute values are not double-encoded', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.div({ id: 'enc-attr', title: 'a & b < c > d "e"' }).toElement());
    }, bundle);
    await expect(page.locator('#enc-attr')).toHaveAttribute('title', 'a & b < c > d "e"');
  });

  // ─── namespaces ────────────────────────────────────────────────────────────

  test('creates SVG elements in the SVG namespace', async ({ page }) => {
    const ns = await page.evaluate(async src => {
      const { t } = await import(src);
      const circle = t.circle({ r: 5, cx: 5, cy: 5 }).toElement();
      document.body.append(circle);
      return circle.namespaceURI;
    }, bundle);
    expect(ns).toBe('http://www.w3.org/2000/svg');
  });

  test('creates MathML elements in the MathML namespace', async ({ page }) => {
    const ns = await page.evaluate(async src => {
      const { t } = await import(src);
      const mn = t.mn(1).toElement();
      document.body.append(mn);
      return mn.namespaceURI;
    }, bundle);
    expect(ns).toBe('http://www.w3.org/1998/Math/MathML');
  });
}
