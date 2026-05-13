import { expect, test } from './config/fixtures.js';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3847/');
});

// ─── element creation ──────────────────────────────────────────────────────

test('creates element with correct tag name', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.section().toElement());
  }, bundle);
  await expect(page.locator('section')).toBeAttached();
});

test('creates void element', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.input({ type: 'text' }).toElement());
  }, bundle);
  await expect(page.locator('input')).toHaveAttribute('type', 'text');
});

// ─── attributes ────────────────────────────────────────────────────────────

test('sets string attributes', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.div({ id: 'a', class: 'foo' }).toElement());
  }, bundle);
  await expect(page.locator('#a')).toHaveClass('foo');
});

test('sets number attributes as strings', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.input({ type: 'text', maxlength: 10 }).toElement());
  }, bundle);
  await expect(page.locator('input')).toHaveAttribute('maxlength', '10');
});

test('converts camelCase to kebab-case attributes', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.div({ dataBsToggle: 'collapse' }).toElement());
  }, bundle);
  await expect(page.locator('div')).toHaveAttribute('data-bs-toggle', 'collapse');
});

test('converts nested object to data attributes', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.div({ data: { bs: { toggle: 'collapse', target: '#x' } } }).toElement());
  }, bundle);
  await expect(page.locator('div')).toHaveAttribute('data-bs-toggle', 'collapse');
  await expect(page.locator('div')).toHaveAttribute('data-bs-target', '#x');
});

test('boolean true sets attribute, boolean false omits it', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.input({ type: 'checkbox', checked: true, required: false }).toElement());
  }, bundle);
  await expect(page.locator('input')).toBeChecked();
  await expect(page.locator('input')).not.toHaveAttribute('required');
});

test('class as array joins values with a space', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.div({ class: ['foo', 'bar'] }).toElement());
  }, bundle);
  await expect(page.locator('div')).toHaveClass('foo bar');
});

test('style as object sets inline styles via setAttribute', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.div({ id: 'styled', style: { backgroundColor: 'red', zIndex: 2 } }).toElement());
  }, bundle);
  await expect(page.locator('#styled')).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  await expect(page.locator('#styled')).toHaveCSS('z-index', '2');
});

// ─── content ───────────────────────────────────────────────────────────────

test('sets text content as a text node', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.p('hello world').toElement());
  }, bundle);
  await expect(page.locator('p')).toHaveText('hello world');
});

test('preserves multiple spaces as non-breaking spaces', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.p('a  b').toElement());
  }, bundle);
  const textContent = await page.locator('p').evaluate(el => el.textContent);
  expect(textContent).toBe('a  b');
});

test('sets number content as a text node', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.span(42).toElement());
  }, bundle);
  await expect(page.locator('span')).toHaveText('42');
});

test('creates nested elements', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.ul([t.li('one'), t.li('two')]).toElement());
  }, bundle);
  await expect(page.locator('ul li')).toHaveCount(2);
  await expect(page.locator('ul li').nth(0)).toHaveText('one');
  await expect(page.locator('ul li').nth(1)).toHaveText('two');
});

test('literal creates element from raw HTML string', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.literal('<p id="from-literal">hello</p>').toElement());
  }, bundle);
  await expect(page.locator('#from-literal')).toHaveText('hello');
});

test('literal with multiple root nodes appends all of them', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.literal('<p id="lit-a">a</p><p id="lit-b">b</p>').toElement());
  }, bundle);
  await expect(page.locator('#lit-a')).toHaveText('a');
  await expect(page.locator('#lit-b')).toHaveText('b');
});

test('inlineComment renders as a comment node between nested elements', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const div = t.div([t.p('before'), t.inlineComment('separator'), t.p('after')]).toElement();
    document.body.append(div);
    const children = Array.from(div.childNodes);
    return {
      count: children.length,
      middleType: children[1].nodeType,
      middleValue: children[1].nodeValue,
    };
  }, bundle);
  expect(result.count).toBe(3);
  expect(result.middleType).toBe(8); // Node.COMMENT_NODE
  expect(result.middleValue).toBe('separator');
});

// ─── event listeners ───────────────────────────────────────────────────────

test('attaches event listener via function attribute', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(
      t.button({
        type: 'button',
        onclick: () => { document.body.dataset.clicked = 'yes'; },
      }, 'Click Me').toElement(),
    );
  }, bundle);
  await page.locator('button').click();
  await expect(page.locator('body')).toHaveAttribute('data-clicked', 'yes');
});

test('string on* value sets attribute via setAttribute, not addEventListener', async ({ page, bundle }) => {
  const attrValue = await page.evaluate(async src => {
    const { t } = await import(src);
    const btn = t.button({ type: 'button', onclick: 'return false' }, 'x').toElement();
    document.body.append(btn);
    return btn.getAttribute('onclick');
  }, bundle);
  expect(attrValue).toBe('return false');
});

test('attaches non-click event listener via function attribute', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(
      t.input({
        type: 'text',
        oninput: () => { document.body.dataset.typed = 'yes'; },
      }).toElement(),
    );
  }, bundle);
  await page.locator('input').fill('hi');
  await expect(page.locator('body')).toHaveAttribute('data-typed', 'yes');
});

test('attaches event listener on SVG element via function attribute', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');
    const rect = t.rect({
      width: 100,
      height: 100,
      onclick: () => { document.body.dataset.svgClicked = 'yes'; },
    }).toElement();
    svg.append(rect);
    document.body.append(svg);
  }, bundle);
  await page.locator('rect').click();
  await expect(page.locator('body')).toHaveAttribute('data-svg-clicked', 'yes');
});

test('on key wires camelCase custom event listener', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(
      t.div({
        on: { bricksSelectorChange: () => { document.body.dataset.customFired = 'yes'; } },
      }).toElement(),
    );
    document.querySelector('div').dispatchEvent(new CustomEvent('bricksSelectorChange'));
  }, bundle);
  await expect(page.locator('body')).toHaveAttribute('data-custom-fired', 'yes');
});

test('on key wires kebab custom event listener', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(
      t.div({
        on: { 'bricks-selector-change': () => { document.body.dataset.kebabFired = 'yes'; } },
      }).toElement(),
    );
    document.querySelector('div').dispatchEvent(new CustomEvent('bricks-selector-change'));
  }, bundle);
  await expect(page.locator('body')).toHaveAttribute('data-kebab-fired', 'yes');
});

test('sets aria attributes on element', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.button({ type: 'button', 'aria-label': 'close' }, 'x').toElement());
  }, bundle);
  await expect(page.locator('button')).toHaveAttribute('aria-label', 'close');
});

test('sets data attributes on element', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.div({ 'data-testid': 'my-div' }).toElement());
  }, bundle);
  await expect(page.locator('[data-testid="my-div"]')).toBeAttached();
});

// ─── encoding ──────────────────────────────────────────────────────────────

test('special chars in text content are not double-encoded', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.p({ id: 'enc-content' }, 'a & b < c > d "e"').toElement());
  }, bundle);
  await expect(page.locator('#enc-content')).toHaveText('a & b < c > d "e"');
});

test('special chars in attribute values are not double-encoded', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t } = await import(src);
    document.body.append(t.div({ id: 'enc-attr', title: 'a & b < c > d "e"' }).toElement());
  }, bundle);
  await expect(page.locator('#enc-attr')).toHaveAttribute('title', 'a & b < c > d "e"');
});

// ─── namespaces ────────────────────────────────────────────────────────────

test('creates SVG elements in the SVG namespace', async ({ page, bundle }) => {
  const ns = await page.evaluate(async src => {
    const { t } = await import(src);
    const circle = t.circle({ r: 5, cx: 5, cy: 5 }).toElement();
    document.body.append(circle);
    return circle.namespaceURI;
  }, bundle);
  expect(ns).toBe('http://www.w3.org/2000/svg');
});

test('creates MathML elements in the MathML namespace', async ({ page, bundle }) => {
  const ns = await page.evaluate(async src => {
    const { t } = await import(src);
    const mn = t.mn(1).toElement();
    document.body.append(mn);
    return mn.namespaceURI;
  }, bundle);
  expect(ns).toBe('http://www.w3.org/1998/Math/MathML');
});

// ─── toElement() reuse guard ───────────────────────────────────────────────

test('toElement() warns when tag is already in the DOM', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'slim build requires validationLevel: "off"');
  const warned = await page.evaluate(async src => {
    const { default: Kensington } = await import(src);
    let logged = false;
    const tt = new Kensington({ validationLevel: 'warn', logger: () => { logged = true; } });
    const tag = tt.div('icon');
    document.body.append(tag.toElement());
    tag.toElement();
    return logged;
  }, bundle);
  expect(warned).toBe(true);
});

test('toElement() throws when tag is already in the DOM', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'slim build requires validationLevel: "off"');
  const result = await page.evaluate(async src => {
    const { default: Kensington } = await import(src);
    const tt = new Kensington({ validationLevel: 'error' });
    const tag = tt.div('icon');
    document.body.append(tag.toElement());
    try {
      tag.toElement();
      return { threw: false };
    } catch (e) {
      return { threw: true, message: e.message };
    }
  }, bundle);
  expect(result.threw).toBe(true);
  expect(result.message).toContain('toElement()');
});

test('toElement() throws when tag is parented in an in-memory tree', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'slim build requires validationLevel: "off"');
  const result = await page.evaluate(async src => {
    const { default: Kensington } = await import(src);
    const tt = new Kensington({ validationLevel: 'error' });
    const icon = tt.div('icon');
    tt.header(icon).toElement(); // icon parented to header in memory
    try {
      tt.footer(icon).toElement(); // icon.toElement() called again, parentNode !== null
      return { threw: false };
    } catch (e) {
      return { threw: true, message: e.message };
    }
  }, bundle);
  expect(result.threw).toBe(true);
  expect(result.message).toContain('toElement()');
});

test('toElement() does not warn before the tag has a parent', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'slim build requires validationLevel: "off"');
  const result = await page.evaluate(async src => {
    const { default: Kensington } = await import(src);
    const tt = new Kensington({ validationLevel: 'error' });
    const tag = tt.div('icon');
    tag.toElement(); // first call — no parent yet
    document.body.append(tag.toElement()); // second call — still no parent at call time
    return { ok: true };
  }, bundle);
  expect(result.ok).toBe(true);
});

test('toElement() is silent when validationLevel is off', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { default: Kensington } = await import(src);
    const tt = new Kensington({ validationLevel: 'off' });
    const tag = tt.div('icon');
    document.body.append(tag.toElement());
    try {
      tag.toElement();
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }, bundle);
  expect(result.ok).toBe(true);
});

test('inlineComment toElement() throws when already in the DOM', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'slim build requires validationLevel: "off"');
  const result = await page.evaluate(async src => {
    const { default: Kensington } = await import(src);
    const tt = new Kensington({ validationLevel: 'error' });
    const comment = tt.inlineComment('note');
    document.body.append(comment.toElement());
    try {
      comment.toElement();
      return { threw: false };
    } catch (e) {
      return { threw: true, message: e.message };
    }
  }, bundle);
  expect(result.threw).toBe(true);
  expect(result.message).toContain('toElement()');
});

test('inlineComment toElement() throws when parented in an in-memory tree', async ({ page, bundle }) => {
  test.skip(bundle.includes('slim'), 'slim build requires validationLevel: "off"');
  const result = await page.evaluate(async src => {
    const { default: Kensington } = await import(src);
    const tt = new Kensington({ validationLevel: 'error' });
    const comment = tt.inlineComment('note');
    tt.div(comment).toElement(); // comment parented in memory
    try {
      tt.div(comment).toElement();
      return { threw: false };
    } catch (e) {
      return { threw: true, message: e.message };
    }
  }, bundle);
  expect(result.threw).toBe(true);
  expect(result.message).toContain('toElement()');
});
