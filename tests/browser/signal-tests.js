import { expect, test } from '@playwright/test';

export function registerSignalTests(bundle) {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
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

  test('effect stop function prevents further runs', async ({ page }) => {
    const log = await page.evaluate(async src => {
      const { signal, effect } = await import(src);
      const s = signal('a');
      const calls = [];
      const stop = effect(() => { calls.push(s.get()); });
      s.set('b');
      stop();
      s.set('c');
      s.set('d');
      return calls;
    }, bundle);
    expect(log).toEqual(['a', 'b']);
  });

  test('effect cleans up stale conditional dependencies', async ({ page }) => {
    const log = await page.evaluate(async src => {
      const { signal, effect } = await import(src);
      const flag = signal(true);
      const a = signal('a');
      const b = signal('b');
      const calls = [];
      effect(() => { calls.push(flag.get() ? a.get() : b.get()); });
      flag.set(false);
      a.set('a2'); // a is no longer tracked — should not trigger
      b.set('b2');
      return calls;
    }, bundle);
    expect(log).toEqual(['a', 'b', 'b2']);
  });
}
