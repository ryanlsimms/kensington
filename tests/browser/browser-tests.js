import { expect,test } from '@playwright/test';

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

  test('literal creates element from raw HTML string', async ({ page }) => {
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

  test('signal as literal updates the DOM element live', async ({ page }) => {
    await page.evaluate(async src => {
      const { t, signal } = await import(src);
      const html = signal('<p id="lit-a">first</p>');
      document.body.append(t.literal(html).toElement());
      html.set('<p id="lit-b">second</p>');
    }, bundle);
    await expect(page.locator('#lit-b')).toHaveText('second');
    await expect(page.locator('#lit-a')).toHaveCount(0);
  });

  test('signal as inlineComment updates the comment node value live', async ({ page }) => {
    const value = await page.evaluate(async src => {
      const { t, signal } = await import(src);
      const text = signal('before');
      const div = t.div([t.p('x'), t.inlineComment(text), t.p('y')]).toElement();
      document.body.append(div);
      text.set('after');
      return Array.from(div.childNodes)[1].nodeValue;
    }, bundle);
    expect(value).toBe('after');
  });

  // ─── signal ────────────────────────────────────────────────────────────────

  test('signal as one item in a mixed content array updates live', async ({ page }) => {
    await page.evaluate(async src => {
      const { t, signal } = await import(src);
      const name = signal('world');
      document.body.append(t.p({ id: 'mixed-content' }, ['hello ', name, '!']).toElement());
      name.set('there');
    }, bundle);
    await expect(page.locator('#mixed-content')).toHaveText('hello there!');
  });

  test('signal as text content updates the DOM text node live', async ({ page }) => {
    await page.evaluate(async src => {
      const { t, signal } = await import(src);
      const count = signal(0);
      document.body.append(t.p({ id: 'sig-text' }, count).toElement());
      count.set(42);
    }, bundle);
    await expect(page.locator('#sig-text')).toHaveText('42');
  });

  test('signal as tag content replaces the DOM subtree live', async ({ page }) => {
    await page.evaluate(async src => {
      const { t, signal } = await import(src);
      const content = signal(t.em('first'));
      document.body.append(t.div({ id: 'sig-tag' }, content).toElement());
      content.set(t.strong('second'));
    }, bundle);
    await expect(page.locator('#sig-tag strong')).toHaveText('second');
    await expect(page.locator('#sig-tag em')).toHaveCount(0);
  });

  test('signal as attribute updates the attribute live', async ({ page }) => {
    await page.evaluate(async src => {
      const { t, signal } = await import(src);
      const cls = signal('foo');
      document.body.append(t.div({ id: 'sig-attr', class: cls }).toElement());
      cls.set('bar');
    }, bundle);
    await expect(page.locator('#sig-attr')).toHaveClass('bar');
  });

  test('signal as boolean attribute toggles presence live', async ({ page }) => {
    await page.evaluate(async src => {
      const { t, signal } = await import(src);
      const checked = signal(true);
      document.body.append(t.input({ id: 'sig-bool', type: 'checkbox', checked }).toElement());
      checked.set(false);
    }, bundle);
    await expect(page.locator('#sig-bool')).not.toHaveAttribute('checked');
  });

  test('computed signal derives value from other signals and updates live', async ({ page }) => {
    await page.evaluate(async src => {
      const { t, signal, computed } = await import(src);
      const active = signal(true);
      const cls = computed(() => active.get() ? 'btn-primary' : 'btn-outline');
      document.body.append(t.button({ id: 'comp-btn', class: cls }, 'click').toElement());
      active.set(false);
    }, bundle);
    await expect(page.locator('#comp-btn')).toHaveClass('btn-outline');
  });

  test('signal holding array renders all items', async ({ page }) => {
    await page.evaluate(async src => {
      const { t, signal } = await import(src);
      const items = signal([t.li('one'), t.li('two'), t.li('three')]);
      document.body.append(t.ul({ id: 'arr-list' }, items).toElement());
    }, bundle);
    await expect(page.locator('#arr-list li')).toHaveCount(3);
    await expect(page.locator('#arr-list li').nth(0)).toHaveText('one');
    await expect(page.locator('#arr-list li').nth(2)).toHaveText('three');
  });

  test('signal holding array updates when set to new array', async ({ page }) => {
    await page.evaluate(async src => {
      const { t, signal } = await import(src);
      const items = signal([t.li('a'), t.li('b')]);
      document.body.append(t.ul({ id: 'arr-update' }, items).toElement());
      items.set([t.li('x'), t.li('y'), t.li('z')]);
    }, bundle);
    await expect(page.locator('#arr-update li')).toHaveCount(3);
    await expect(page.locator('#arr-update li').nth(0)).toHaveText('x');
  });

  test('keyed list reuses DOM nodes when sorted', async ({ page }) => {
    const reused = await page.evaluate(async src => {
      const { t, signal, computed } = await import(src);
      const items = signal([
        { id: 1, name: 'Banana' },
        { id: 2, name: 'Apple' },
        { id: 3, name: 'Cherry' },
      ]);
      const rows = computed(() =>
        items.get().map(item => t.li({ dataKey: item.id }, item.name)),
      );
      document.body.append(t.ul({ id: 'keyed-list' }, rows).toElement());

      const bananaNode = document.querySelector('[data-key="1"]');
      bananaNode._sentinel = true;

      items.set(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));

      const bananaAfter = document.querySelector('[data-key="1"]');
      return bananaAfter._sentinel === true;
    }, bundle);
    expect(reused).toBe(true);
    await expect(page.locator('#keyed-list li').nth(0)).toHaveText('Apple');
    await expect(page.locator('#keyed-list li').nth(1)).toHaveText('Banana');
    await expect(page.locator('#keyed-list li').nth(2)).toHaveText('Cherry');
  });

  test('keyed list preserves unchanged DOM nodes when one item is replaced', async ({ page }) => {
    const result = await page.evaluate(async src => {
      const { t, signal, computed } = await import(src);
      const items = signal([
        { id: 1, label: 'one' },
        { id: 2, label: 'two' },
        { id: 3, label: 'three' },
      ]);
      const rows = computed(() =>
        items.get().map(item => t.li({ dataKey: item.id }, item.label)),
      );
      document.body.append(t.ul({ id: 'partial-update' }, rows).toElement());

      document.querySelectorAll('#partial-update li').forEach(el => {
        el._sentinel = true;
      });

      // Replace item 2 with a new item — new id means new key, so a fresh node is created
      items.set(list => [list[0], { id: 4, label: 'four' }, list[2]]);

      return Array.from(document.querySelectorAll('#partial-update li')).map(el => el._sentinel === true);
    }, bundle);

    expect(result[0]).toBe(true); // id:1 — unchanged, same DOM node
    expect(result[1]).toBe(false); // id:4 — new item, fresh DOM node
    expect(result[2]).toBe(true); // id:3 — unchanged, same DOM node
    await expect(page.locator('#partial-update li').nth(0)).toHaveText('one');
    await expect(page.locator('#partial-update li').nth(1)).toHaveText('four');
    await expect(page.locator('#partial-update li').nth(2)).toHaveText('three');
  });

  // ─── effect ────────────────────────────────────────────────────────────────

  test('effect runs immediately and reflects initial signal value', async ({ page }) => {
    await page.evaluate(async src => {
      const { signal, effect } = await import(src);
      const label = signal('hello');
      effect(() => { document.title = label.get(); });
    }, bundle);
    await expect(page).toHaveTitle('hello');
  });

  test('effect re-runs when signal changes', async ({ page }) => {
    await page.evaluate(async src => {
      const { signal, effect } = await import(src);
      const label = signal('hello');
      effect(() => { document.title = label.get(); });
      label.set('world');
    }, bundle);
    await expect(page).toHaveTitle('world');
  });

  test('effect tracks multiple signals', async ({ page }) => {
    await page.evaluate(async src => {
      const { signal, effect } = await import(src);
      const first = signal('John');
      const last = signal('Doe');
      effect(() => { document.title = `${first.get()} ${last.get()}`; });
      last.set('Smith');
    }, bundle);
    await expect(page).toHaveTitle('John Smith');
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
