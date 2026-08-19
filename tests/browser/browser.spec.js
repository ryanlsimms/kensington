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

test('reactive style property updates only the changed property on signal change', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const color = signal('red');
    document.body.append(t.div({ id: 'rs', style: { color, opacity: '0.5' } }).toElement());
    await Promise.resolve();
    color.set('blue');
    await Promise.resolve();
  }, bundle);
  await expect(page.locator('#rs')).toHaveCSS('color', 'rgb(0, 0, 255)');
  await expect(page.locator('#rs')).toHaveCSS('opacity', '0.5');
});

test('reactive style property removes the property when signal is set to null', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const display = signal('none');
    document.body.append(t.div({ id: 'rd', style: { display } }).toElement());
    await Promise.resolve();
    display.set(null);
    await Promise.resolve();
  }, bundle);
  const display = await page.locator('#rd').evaluate(el => el.style.display);
  expect(display).toBe('');
});

test('toString with reactive style properties resolves signal values inline', async ({ page, bundle }) => {
  const html = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const color = signal('green');
    return t.div({ style: { color, fontSize: '14px' } }).toString();
  }, bundle);
  expect(html).toContain('color: green');
  expect(html).toContain('font-size: 14px');
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

test('shared names and integration-point children use their actual parent namespace', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const cachedTitle = t.title('cached');
    cachedTitle.toElement();
    const mglyph = t.createMathTag('mglyph');
    const svg = t.svg([
      cachedTitle,
      t.a('link'),
      t.script('void 0'),
      t.style('circle {}'),
      t.foreignObject(t.div('html')),
    ]).toElement();
    const math = t.math([
      t.mi([mglyph(), t.span('html')]),
      t.annotationXml({ encoding: 'text/html' }, t.div('html')),
      t.annotationXml(t.svg()),
    ]).toElement();
    return {
      svg: Array.from(svg.children, el => el.namespaceURI),
      foreignChild: svg.lastElementChild.firstElementChild.namespaceURI,
      mathTextChildren: Array.from(math.firstElementChild.children, el => el.namespaceURI),
      annotationHtml: math.children[1].firstElementChild.namespaceURI,
      annotationSvg: math.children[2].firstElementChild.namespaceURI,
    };
  }, bundle);
  expect(result.svg.slice(0, 4)).toEqual(Array(4).fill('http://www.w3.org/2000/svg'));
  expect(result.foreignChild).toBe('http://www.w3.org/1999/xhtml');
  expect(result.mathTextChildren).toEqual([
    'http://www.w3.org/1998/Math/MathML',
    'http://www.w3.org/1999/xhtml',
  ]);
  expect(result.annotationHtml).toBe('http://www.w3.org/1999/xhtml');
  expect(result.annotationSvg).toBe('http://www.w3.org/2000/svg');
});

test('literal fragments parse in HTML, SVG, and MathML parent contexts', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const table = t.table(t.tbody(t.literal('<tr><td>cell</td></tr>'))).toElement();
    const svg = t.svg(t.literal('<circle r="4"/>')).toElement();
    const math = t.math(t.literal('<mrow><mi>x</mi></mrow>')).toElement();
    const foreignObject = t.svg(t.foreignObject(t.literal('<div>html</div>'))).toElement();
    const mathText = t.math(t.mi(t.literal('<span>html</span>'))).toElement();
    const annotation = t.math(t.annotationXml(
      { encoding: 'text/html' },
      t.literal('<div>html</div>'),
    )).toElement();
    return {
      tableTag: table.querySelector('tbody').firstElementChild.localName,
      svgNamespace: svg.firstElementChild.namespaceURI,
      mathNamespace: math.firstElementChild.namespaceURI,
      foreignObjectNamespace: foreignObject.querySelector('foreignObject').firstElementChild.namespaceURI,
      mathTextNamespace: mathText.querySelector('mi').firstElementChild.namespaceURI,
      annotationNamespace: annotation.querySelector('annotation-xml').firstElementChild.namespaceURI,
    };
  }, bundle);
  expect(result.tableTag).toBe('tr');
  expect(result.svgNamespace).toBe('http://www.w3.org/2000/svg');
  expect(result.mathNamespace).toBe('http://www.w3.org/1998/Math/MathML');
  expect(result.foreignObjectNamespace).toBe('http://www.w3.org/1999/xhtml');
  expect(result.mathTextNamespace).toBe('http://www.w3.org/1999/xhtml');
  expect(result.annotationNamespace).toBe('http://www.w3.org/1999/xhtml');
});

test('namespaced attributes receive their standard namespace URIs', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const use = t.use({
      'xlink:href': '#shape',
      'xml:space': 'preserve',
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    }).toElement();
    return {
      href: use.getAttributeNS('http://www.w3.org/1999/xlink', 'href'),
      space: use.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'space'),
      xmlns: use.getAttributeNS('http://www.w3.org/2000/xmlns/', 'xlink'),
    };
  }, bundle);
  expect(result).toEqual({
    href: '#shape',
    space: 'preserve',
    xmlns: 'http://www.w3.org/1999/xlink',
  });
});

test('standalone and nested unsafe literal scripts execute on insertion', async ({ page, bundle }) => {
  const count = await page.evaluate(async src => {
    const { t } = await import(src);
    window.__literalRuns = 0;
    document.body.append(t.unsafeLiteral('<script>window.__literalRuns += 1</script>').toElement());
    document.body.append(t.div(
      t.unsafeLiteral('<script>window.__literalRuns += 1</script>'),
    ).toElement());
    return window.__literalRuns;
  }, bundle);
  expect(count).toBe(2);
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

// ─── prop key ────────────────────────────────────────────────────────────────

test('static prop assigns DOM property at render time', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const el = t.input({ id: 'prop-static', type: 'text', prop: { value: 'hello' } }).toElement();
    document.body.append(el);
    return el.value;
  }, bundle);
  expect(result).toBe('hello');
});

test('static prop does not set an HTML attribute', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const el = t.input({ id: 'prop-no-attr', type: 'text', prop: { value: 'hello' } }).toElement();
    document.body.append(el);
    return el.getAttribute('value');
  }, bundle);
  expect(result).toBeNull();
});

test('expando prop assigns arbitrary property', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const el = t.div({ prop: { _custom: 42 } }).toElement();
    document.body.append(el);
    return el._custom;
  }, bundle);
  expect(result).toBe(42);
});

test('non-existent prop key is silently skipped', async ({ page, bundle }) => {
  const threw = await page.evaluate(async src => {
    const { t } = await import(src);
    try {
      const el = t.div({ prop: { definitelyNotReal: 'x' } }).toElement();
      document.body.append(el);
      return false;
    } catch {
      return true;
    }
  }, bundle);
  expect(threw).toBe(false);
});
