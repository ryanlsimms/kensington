import { expect,test } from '@playwright/test';

export function registerTests(bundle) {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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

  test('style as object sets inline styles via setAttribute', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.div({ id: 'styled', style: { backgroundColor: 'red', zIndex: 2 } }).toElement());
    }, bundle);
    await expect(page.locator('#styled')).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    await expect(page.locator('#styled')).toHaveCSS('z-index', '2');
  });

  // ─── content ───────────────────────────────────────────────────────────────

  test('sets text content as a text node', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.p('hello world').toElement());
    }, bundle);
    await expect(page.locator('p')).toHaveText('hello world');
  });

  test('preserves multiple spaces as non-breaking spaces', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.p('a  b').toElement());
    }, bundle);
    const textContent = await page.locator('p').evaluate(el => el.textContent);
    expect(textContent).toBe('a  b');
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

  test('literal creates element from a raw markup string', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.literal('<p id="from-literal">hello</p>').toElement());
    }, bundle);
    await expect(page.locator('#from-literal')).toHaveText('hello');
  });

  test('literal with multiple root nodes appends all of them', async ({ page }) => {
    await page.evaluate(async src => {
      const { t } = await import(src);
      document.body.append(t.literal('<p id="lit-a">a</p><p id="lit-b">b</p>').toElement());
    }, bundle);
    await expect(page.locator('#lit-a')).toHaveText('a');
    await expect(page.locator('#lit-b')).toHaveText('b');
  });

  test('standalone and nested unsafe literal scripts execute when inserted', async ({ page }) => {
    const result = await page.evaluate(async src => {
      const { t } = await import(src);
      globalThis.__kensingtonUnsafeLiteralRuns = 0;

      const direct = t.unsafeLiteral(
        '<script>globalThis.__kensingtonUnsafeLiteralRuns += 1;</script>',
      ).toElement();
      const beforeDirectInsertion = globalThis.__kensingtonUnsafeLiteralRuns;
      document.body.append(direct);
      const afterDirectInsertion = globalThis.__kensingtonUnsafeLiteralRuns;

      const nested = t.div(t.unsafeLiteral(
        '<script>globalThis.__kensingtonUnsafeLiteralRuns += 1;</script>',
      )).toElement();
      const beforeNestedInsertion = globalThis.__kensingtonUnsafeLiteralRuns;
      document.body.append(nested);
      const afterNestedInsertion = globalThis.__kensingtonUnsafeLiteralRuns;
      nested.remove();
      document.body.append(nested);
      const afterNestedReinsertion = globalThis.__kensingtonUnsafeLiteralRuns;

      document.body.append(t.literal(
        '<script>globalThis.__kensingtonUnsafeLiteralRuns += 1;</script>',
      ).toElement());
      const afterSafeLiteralInsertion = globalThis.__kensingtonUnsafeLiteralRuns;

      delete globalThis.__kensingtonUnsafeLiteralRuns;
      return {
        beforeDirectInsertion,
        afterDirectInsertion,
        beforeNestedInsertion,
        afterNestedInsertion,
        afterNestedReinsertion,
        afterSafeLiteralInsertion,
      };
    }, bundle);

    expect(result).toEqual({
      beforeDirectInsertion: 0,
      afterDirectInsertion: 1,
      beforeNestedInsertion: 1,
      afterNestedInsertion: 2,
      afterNestedReinsertion: 2,
      afterSafeLiteralInsertion: 2,
    });
  });

  test('standalone and nested unsafe literal external scripts load when inserted', async ({ page }) => {
    const result = await page.evaluate(async src => {
      const { t } = await import(src);
      globalThis.__kensingtonUnsafeLiteralExternalRuns = 0;
      const scriptSource = encodeURIComponent(
        'globalThis.__kensingtonUnsafeLiteralExternalRuns += 1;',
      );
      const markup = `<script src="data:text/javascript,${scriptSource}"></script>`;

      const direct = t.unsafeLiteral(markup).toElement();
      const directScript = direct.querySelector('script');
      const directLoaded = new Promise((resolve, reject) => {
        directScript.addEventListener('load', resolve, { once: true });
        directScript.addEventListener('error', reject, { once: true });
      });

      const nested = t.div(t.unsafeLiteral(markup)).toElement();
      const nestedScript = nested.querySelector('script');
      const nestedLoaded = new Promise((resolve, reject) => {
        nestedScript.addEventListener('load', resolve, { once: true });
        nestedScript.addEventListener('error', reject, { once: true });
      });

      document.body.append(direct, nested);
      await Promise.all([directLoaded, nestedLoaded]);
      const runs = globalThis.__kensingtonUnsafeLiteralExternalRuns;
      delete globalThis.__kensingtonUnsafeLiteralExternalRuns;
      return runs;
    }, bundle);

    expect(result).toBe(2);
  });

  test('SVG unsafe literal scripts retain native context and do not execute twice', async ({ page }) => {
    const result = await page.evaluate(async src => {
      const { t } = await import(src);
      globalThis.__kensingtonSvgUnsafeLiteralRuns = 0;

      const svg = t.svg(t.unsafeLiteral(
        '<script id="svg-unsafe-script">globalThis.__kensingtonSvgUnsafeLiteralRuns += 1;</script>',
      )).toElement();
      const script = svg.querySelector('#svg-unsafe-script');
      const beforeInsertion = globalThis.__kensingtonSvgUnsafeLiteralRuns;
      document.body.append(svg);
      const afterInsertion = globalThis.__kensingtonSvgUnsafeLiteralRuns;
      svg.remove();
      document.body.append(svg);
      const afterReinsertion = globalThis.__kensingtonSvgUnsafeLiteralRuns;

      delete globalThis.__kensingtonSvgUnsafeLiteralRuns;
      return {
        namespace: script.namespaceURI,
        beforeInsertion,
        afterInsertion,
        afterReinsertion,
      };
    }, bundle);

    expect(result.namespace).toBe('http://www.w3.org/2000/svg');
    expect(result.beforeInsertion).toBe(0);
    // Native SVG script execution differs by engine. Kensington preserves the
    // SVG context instead of coercing the element into executable HTML script.
    expect([0, 1]).toContain(result.afterInsertion);
    expect(result.afterReinsertion).toBe(result.afterInsertion);
  });

  test('inlineComment renders as a comment node between nested elements', async ({ page }) => {
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

  test('attaches event listener via function attribute', async ({ page }) => {
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

  test('string on* value sets attribute via setAttribute, not addEventListener', async ({ page }) => {
    const attrValue = await page.evaluate(async src => {
      const { t } = await import(src);
      const btn = t.button({ type: 'button', onclick: 'return false' }, 'x').toElement();
      document.body.append(btn);
      return btn.getAttribute('onclick');
    }, bundle);
    expect(attrValue).toBe('return false');
  });

  test('attaches non-click event listener via function attribute', async ({ page }) => {
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

  test('attaches event listener on SVG element via function attribute', async ({ page }) => {
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

  test('creates shared elements in the namespace of their parent context', async ({ page }) => {
    const namespaces = await page.evaluate(async src => {
      const { t } = await import(src);
      const htmlTitle = t.title('HTML title').toElement();
      const tree = t.div([
        t.svg([
          t.g(t.title({ id: 'svg-title' }, 'SVG title')),
          t.a({ id: 'svg-a', href: '#target' }, t.circle()),
          t.script({ id: 'svg-script', href: '/app.js' }),
          t.style({ id: 'svg-style', type: 'text/css' }, '.x {}'),
          t.foreignObject([
            t.title({ id: 'foreign-title' }, 'HTML title'),
            t.div({ id: 'foreign-div' }, 'HTML content'),
            t.svg(t.title({ id: 'nested-svg-title' }, 'Nested SVG title')),
          ]),
        ]),
      ]).toElement();
      const byId = id => tree.querySelector(`#${id}`).namespaceURI;
      return {
        html: htmlTitle.namespaceURI,
        svgTitle: byId('svg-title'),
        svgA: byId('svg-a'),
        svgScript: byId('svg-script'),
        svgStyle: byId('svg-style'),
        foreignTitle: byId('foreign-title'),
        foreignDiv: byId('foreign-div'),
        nestedSvgTitle: byId('nested-svg-title'),
      };
    }, bundle);
    expect(namespaces).toEqual({
      html: 'http://www.w3.org/1999/xhtml',
      svgTitle: 'http://www.w3.org/2000/svg',
      svgA: 'http://www.w3.org/2000/svg',
      svgScript: 'http://www.w3.org/2000/svg',
      svgStyle: 'http://www.w3.org/2000/svg',
      foreignTitle: 'http://www.w3.org/1999/xhtml',
      foreignDiv: 'http://www.w3.org/1999/xhtml',
      nestedSvgTitle: 'http://www.w3.org/2000/svg',
    });
  });

  test('unsupported crossings preserve each method\'s intrinsic namespace', async ({ page }) => {
    const namespaces = await page.evaluate(async src => {
      const { t } = await import(src);
      const tree = t.div([
        t.svg(t.div({ id: 'html-div' }, 'x')),
        t.svg(t.math({ id: 'math-in-svg' }, t.mi('x'))),
        t.math(t.svg({ id: 'svg-in-math' }, t.circle())),
      ]).toElement();
      const byId = id => tree.querySelector(`#${id}`).namespaceURI;
      return {
        htmlDiv: byId('html-div'),
        mathInSvg: byId('math-in-svg'),
        svgInMath: byId('svg-in-math'),
      };
    }, bundle);
    expect(namespaces).toEqual({
      htmlDiv: 'http://www.w3.org/1999/xhtml',
      mathInSvg: 'http://www.w3.org/1998/Math/MathML',
      svgInMath: 'http://www.w3.org/2000/svg',
    });
  });

  test('toString and toElement agree for valid namespace trees', async ({ page }) => {
    const result = await page.evaluate(async src => {
      const { t } = await import(src);
      const tag = t.div([
        t.svg([
          t.title({ id: 'svg-title-parity' }, 'SVG title'),
          t.foreignObject(t.div({ id: 'foreign-div-parity' }, 'HTML content')),
        ]),
        t.math([
          t.mtext(t.span({ id: 'math-text-parity' }, 'HTML phrasing content')),
          t.annotationXml(t.svg({ id: 'annotation-svg-parity' }, t.circle())),
        ]),
      ]);
      const live = tag.toElement();
      const template = document.createElement('template');
      template.innerHTML = tag.toString();
      return [
        'svg-title-parity',
        'foreign-div-parity',
        'math-text-parity',
        'annotation-svg-parity',
      ].map(id => ({
        id,
        live: live.querySelector(`#${id}`).namespaceURI,
        parsed: template.content.querySelector(`#${id}`).namespaceURI,
      }));
    }, bundle);
    expect(result).toEqual([
      {
        id: 'svg-title-parity',
        live: 'http://www.w3.org/2000/svg',
        parsed: 'http://www.w3.org/2000/svg',
      },
      {
        id: 'foreign-div-parity',
        live: 'http://www.w3.org/1999/xhtml',
        parsed: 'http://www.w3.org/1999/xhtml',
      },
      {
        id: 'math-text-parity',
        live: 'http://www.w3.org/1999/xhtml',
        parsed: 'http://www.w3.org/1999/xhtml',
      },
      {
        id: 'annotation-svg-parity',
        live: 'http://www.w3.org/2000/svg',
        parsed: 'http://www.w3.org/2000/svg',
      },
    ]);
  });

  test('literal fragments use their actual HTML, SVG, and MathML parent contexts', async ({ page }) => {
    const result = await page.evaluate(async src => {
      const { t } = await import(src);
      const tag = t.div([
        t.svg([
          t.literal('<circle id="literal-svg-circle"></circle><text id="literal-svg-text">x</text>'),
          t.foreignObject(t.literal('<section id="literal-svg-html">HTML</section>')),
        ]),
        t.math([
          t.unsafeLiteral('<mrow id="literal-math-row"><mi id="literal-math-mi">x</mi></mrow>'),
          t.mtext(t.literal('<span id="literal-math-html">HTML</span>')),
          t.annotationXml(
            { encoding: 'text/html' },
            t.literal('<section id="literal-annotation-html">HTML</section>'),
          ),
          t.annotationXml(t.literal(
            '<svg id="literal-annotation-svg"><circle id="literal-annotation-circle"></circle></svg>',
          )),
        ]),
      ]);
      const live = tag.toElement();
      const template = document.createElement('template');
      template.innerHTML = tag.toString();
      return [
        'literal-svg-circle',
        'literal-svg-text',
        'literal-svg-html',
        'literal-math-row',
        'literal-math-mi',
        'literal-math-html',
        'literal-annotation-html',
        'literal-annotation-svg',
        'literal-annotation-circle',
      ].map(id => ({
        id,
        live: live.querySelector(`#${id}`)?.namespaceURI,
        parsed: template.content.querySelector(`#${id}`)?.namespaceURI,
      }));
    }, bundle);
    expect(result).toEqual([
      { id: 'literal-svg-circle', live: 'http://www.w3.org/2000/svg', parsed: 'http://www.w3.org/2000/svg' },
      { id: 'literal-svg-text', live: 'http://www.w3.org/2000/svg', parsed: 'http://www.w3.org/2000/svg' },
      { id: 'literal-svg-html', live: 'http://www.w3.org/1999/xhtml', parsed: 'http://www.w3.org/1999/xhtml' },
      {
        id: 'literal-math-row',
        live: 'http://www.w3.org/1998/Math/MathML',
        parsed: 'http://www.w3.org/1998/Math/MathML',
      },
      {
        id: 'literal-math-mi',
        live: 'http://www.w3.org/1998/Math/MathML',
        parsed: 'http://www.w3.org/1998/Math/MathML',
      },
      { id: 'literal-math-html', live: 'http://www.w3.org/1999/xhtml', parsed: 'http://www.w3.org/1999/xhtml' },
      {
        id: 'literal-annotation-html',
        live: 'http://www.w3.org/1999/xhtml',
        parsed: 'http://www.w3.org/1999/xhtml',
      },
      {
        id: 'literal-annotation-svg',
        live: 'http://www.w3.org/2000/svg',
        parsed: 'http://www.w3.org/2000/svg',
      },
      {
        id: 'literal-annotation-circle',
        live: 'http://www.w3.org/2000/svg',
        parsed: 'http://www.w3.org/2000/svg',
      },
    ]);
  });

  test('literal fragments reuse a contextual range only within their actual parent', async ({ page }) => {
    const result = await page.evaluate(async src => {
      const { t } = await import(src);
      const originalCreateRange = Document.prototype.createRange;
      let rangeCalls = 0;
      Document.prototype.createRange = function createRange() {
        rangeCalls += 1;
        return originalCreateRange.call(this);
      };

      try {
        const live = t.div([
          t.literal('<span id="html-a"></span>'),
          t.em({ id: 'html-middle' }),
          t.literal('<span id="html-b"></span>'),
          t.svg([
            t.literal('<circle id="svg-a"></circle>'),
            t.g({ id: 'svg-middle' }),
            t.literal('<circle id="svg-b"></circle>'),
          ]),
          t.math([
            t.mtext([
              t.literal('<span id="mtext-a"></span>'),
              t.strong({ id: 'mtext-middle' }),
              t.literal('<span id="mtext-b"></span>'),
            ]),
            t.annotationXml({ encoding: 'text/html' }, [
              t.literal('<section id="annotation-a"></section>'),
              t.em({ id: 'annotation-middle' }),
              t.literal('<section id="annotation-b"></section>'),
            ]),
          ]),
          t.section([
            t.literal('<i id="section-a-1"></i>'),
            t.literal('<i id="section-a-2"></i>'),
          ]),
          t.section([
            t.literal('<i id="section-b-1"></i>'),
            t.literal('<i id="section-b-2"></i>'),
          ]),
        ]).toElement();

        const childIds = selector => Array.from(live.querySelector(selector).children, child => child.id);
        return {
          rangeCalls,
          rootOrder: Array.from(live.children, child => child.id || child.localName),
          svgOrder: childIds('svg'),
          mtextOrder: childIds('mtext'),
          annotationOrder: childIds('annotation-xml'),
          sectionOrders: Array.from(live.querySelectorAll(':scope > section'), section => (
            Array.from(section.children, child => child.id)
          )),
          namespaces: [
            'html-a',
            'html-b',
            'svg-a',
            'svg-b',
            'mtext-a',
            'mtext-b',
            'annotation-a',
            'annotation-b',
          ].map(id => [id, live.querySelector(`#${id}`).namespaceURI]),
        };
      } finally {
        Document.prototype.createRange = originalCreateRange;
      }
    }, bundle);

    expect(result).toEqual({
      rangeCalls: 6,
      rootOrder: ['html-a', 'html-middle', 'html-b', 'svg', 'math', 'section', 'section'],
      svgOrder: ['svg-a', 'svg-middle', 'svg-b'],
      mtextOrder: ['mtext-a', 'mtext-middle', 'mtext-b'],
      annotationOrder: ['annotation-a', 'annotation-middle', 'annotation-b'],
      sectionOrders: [
        ['section-a-1', 'section-a-2'],
        ['section-b-1', 'section-b-2'],
      ],
      namespaces: [
        ['html-a', 'http://www.w3.org/1999/xhtml'],
        ['html-b', 'http://www.w3.org/1999/xhtml'],
        ['svg-a', 'http://www.w3.org/2000/svg'],
        ['svg-b', 'http://www.w3.org/2000/svg'],
        ['mtext-a', 'http://www.w3.org/1999/xhtml'],
        ['mtext-b', 'http://www.w3.org/1999/xhtml'],
        ['annotation-a', 'http://www.w3.org/1999/xhtml'],
        ['annotation-b', 'http://www.w3.org/1999/xhtml'],
      ],
    });
  });

  test('assigns namespace URIs to namespaced attributes', async ({ page }) => {
    const result = await page.evaluate(async src => {
      const { t } = await import(src);
      const svg = t.svg({
        xmlns: 'http://www.w3.org/2000/svg',
        'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      }, t.use({
        'xlink:href': '#shape',
        'xml:space': 'preserve',
      })).toElement();
      const use = svg.firstElementChild;
      return {
        xmlns: svg.getAttributeNode('xmlns').namespaceURI,
        xmlnsXlink: svg.getAttributeNode('xmlns:xlink').namespaceURI,
        xlinkHref: use.getAttributeNode('xlink:href').namespaceURI,
        xmlSpace: use.getAttributeNode('xml:space').namespaceURI,
        href: use.getAttributeNS('http://www.w3.org/1999/xlink', 'href'),
      };
    }, bundle);
    expect(result).toEqual({
      xmlns: 'http://www.w3.org/2000/xmlns/',
      xmlnsXlink: 'http://www.w3.org/2000/xmlns/',
      xlinkHref: 'http://www.w3.org/1999/xlink',
      xmlSpace: 'http://www.w3.org/XML/1998/namespace',
      href: '#shape',
    });
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

  // ─── on key ────────────────────────────────────────────────────────────────

  test('on key wires camelCase custom event listener', async ({ page }) => {
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

  test('on key wires kebab custom event listener', async ({ page }) => {
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

  // ─── prop key ──────────────────────────────────────────────────────────────

  test('static prop assigns DOM property at render time', async ({ page }) => {
    const result = await page.evaluate(async src => {
      const { t } = await import(src);
      const el = t.input({ id: 'prop-static', type: 'text', prop: { value: 'hello' } }).toElement();
      document.body.append(el);
      return el.value;
    }, bundle);
    expect(result).toBe('hello');
  });

  test('static prop does not set an HTML attribute', async ({ page }) => {
    const result = await page.evaluate(async src => {
      const { t } = await import(src);
      const el = t.input({ id: 'prop-no-attr', type: 'text', prop: { value: 'hello' } }).toElement();
      document.body.append(el);
      return el.getAttribute('value');
    }, bundle);
    expect(result).toBeNull();
  });

  test('expando prop assigns arbitrary property', async ({ page }) => {
    const result = await page.evaluate(async src => {
      const { t } = await import(src);
      const el = t.div({ prop: { _custom: 42 } }).toElement();
      document.body.append(el);
      return el._custom;
    }, bundle);
    expect(result).toBe(42);
  });

  test('non-existent prop key is silently skipped', async ({ page }) => {
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
}
