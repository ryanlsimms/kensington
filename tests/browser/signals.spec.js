import { expect, test } from './config/fixtures.js';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
});

test('signal as literal updates the DOM element live', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const html = signal('<p id="lit-a">first</p>');
    document.body.append(t.literal(html).toElement());
    html.set('<p id="lit-b">second</p>');
  }, bundle);
  await expect(page.locator('#lit-b')).toHaveText('second');
  await expect(page.locator('#lit-a')).toHaveCount(0);
});

test('literal() blocks script tag injection when signal value changes', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const html = signal('<p id="lit-safe">safe</p>');
    document.body.append(t.literal(html).toElement());
    html.set('<script>window.__injected = true</script>');
    await Promise.resolve();
    return { safe: document.querySelector('#lit-safe') !== null, injected: window.__injected };
  }, bundle);
  expect(result.safe).toBe(true);
  expect(result.injected).toBeUndefined();
});

test('signal as inlineComment updates the comment node value live', async ({ page, bundle }) => {
  const value = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const text = signal('before');
    const div = t.div([t.p('x'), t.inlineComment(text), t.p('y')]).toElement();
    document.body.append(div);
    text.set('after');
    await Promise.resolve();
    return Array.from(div.childNodes)[1].nodeValue;
  }, bundle);
  expect(value).toBe('after');
});

// ─── signal ────────────────────────────────────────────────────────────────

test('signal as one item in a mixed content array updates live', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const name = signal('world');
    document.body.append(t.p({ id: 'mixed-content' }, ['hello ', name, '!']).toElement());
    name.set('there');
  }, bundle);
  await expect(page.locator('#mixed-content')).toHaveText('hello there!');
});

test('signal as text content updates the DOM text node live', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const count = signal(0);
    document.body.append(t.p({ id: 'sig-text' }, count).toElement());
    count.set(42);
  }, bundle);
  await expect(page.locator('#sig-text')).toHaveText('42');
});

test('signal as tag content replaces the DOM subtree live', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const content = signal(t.em('first'));
    document.body.append(t.div({ id: 'sig-tag' }, content).toElement());
    content.set(t.strong('second'));
  }, bundle);
  await expect(page.locator('#sig-tag strong')).toHaveText('second');
  await expect(page.locator('#sig-tag em')).toHaveCount(0);
});

test('signal as attribute updates the attribute live', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('foo');
    document.body.append(t.div({ id: 'sig-attr', class: cls }).toElement());
    cls.set('bar');
  }, bundle);
  await expect(page.locator('#sig-attr')).toHaveClass('bar');
});

test('signal as boolean attribute toggles presence live', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const checked = signal(true);
    document.body.append(t.input({ id: 'sig-bool', type: 'checkbox', checked }).toElement());
    checked.set(false);
  }, bundle);
  await expect(page.locator('#sig-bool')).not.toHaveAttribute('checked');
});

test('computed signal derives value from other signals and updates live', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);
    const active = signal(true);
    const cls = computed(() => active.get() ? 'btn-primary' : 'btn-outline');
    document.body.append(t.button({ id: 'comp-btn', class: cls }, 'click').toElement());
    active.set(false);
  }, bundle);
  await expect(page.locator('#comp-btn')).toHaveClass('btn-outline');
});

test('signal holding array renders all items', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const items = signal([t.li('one'), t.li('two'), t.li('three')]);
    document.body.append(t.ul({ id: 'arr-list' }, items).toElement());
  }, bundle);
  await expect(page.locator('#arr-list li')).toHaveCount(3);
  await expect(page.locator('#arr-list li').nth(0)).toHaveText('one');
  await expect(page.locator('#arr-list li').nth(2)).toHaveText('three');
});

test('signal holding array updates when set to new array', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const items = signal([t.li('a'), t.li('b')]);
    document.body.append(t.ul({ id: 'arr-update' }, items).toElement());
    items.set([t.li('x'), t.li('y'), t.li('z')]);
  }, bundle);
  await expect(page.locator('#arr-update li')).toHaveCount(3);
  await expect(page.locator('#arr-update li').nth(0)).toHaveText('x');
});

test('keyed list reuses DOM nodes when sorted', async ({ page, bundle }) => {
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
    await Promise.resolve();

    const bananaAfter = document.querySelector('[data-key="1"]');
    return bananaAfter._sentinel === true;
  }, bundle);
  expect(reused).toBe(true);
  await expect(page.locator('#keyed-list li').nth(0)).toHaveText('Apple');
  await expect(page.locator('#keyed-list li').nth(1)).toHaveText('Banana');
  await expect(page.locator('#keyed-list li').nth(2)).toHaveText('Cherry');
});

test('keyed list preserves unchanged DOM nodes when one item is replaced', async ({ page, bundle }) => {
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
    await Promise.resolve();

    return Array.from(document.querySelectorAll('#partial-update li')).map(el => el._sentinel === true);
  }, bundle);

  expect(result[0]).toBe(true); // id:1 — unchanged, same DOM node
  expect(result[1]).toBe(false); // id:4 — new item, fresh DOM node
  expect(result[2]).toBe(true); // id:3 — unchanged, same DOM node
  await expect(page.locator('#partial-update li').nth(0)).toHaveText('one');
  await expect(page.locator('#partial-update li').nth(1)).toHaveText('four');
  await expect(page.locator('#partial-update li').nth(2)).toHaveText('three');
});

test('signal attribute effect on discarded fresh node is stopped after reconciliation', async ({ page, bundle }) => {
  const count = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);

    const sharedClass = signal('a');
    const items = signal([{ id: 1, label: 'first' }]);
    const rows = computed(() =>
      items.get().map(item => t.li({ dataKey: item.id, class: sharedClass }, item.label)),
    );
    document.body.append(t.ul({ id: 'attr-effect-cleanup' }, rows).toElement());
    await Promise.resolve();

    items.set([{ id: 1, label: 'second' }]);
    await Promise.resolve();

    // Count setAttribute('class') calls on the next signal update.
    // Without stopTracked: 2 (live + orphaned fresh node). With stopTracked: 1.
    let writes = 0;
    const orig = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function setAttribute(name, val) {
      if (name === 'class') { writes++; }
      return orig.call(this, name, val);
    };
    sharedClass.set('b');
    await Promise.resolve();
    Element.prototype.setAttribute = orig;
    return writes;
  }, bundle);

  expect(count).toBe(1);
});

test('signal-managed attribute is preserved on keyed element after reconciliation', async ({ page, bundle }) => {
  const cls = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);

    const sharedClass = signal('active');
    const items = signal([{ id: 1, label: 'first' }]);
    const rows = computed(() =>
      items.get().map(item => t.li({ dataKey: item.id, class: sharedClass }, item.label)),
    );
    document.body.append(t.ul({ id: 'attr-preserve' }, rows).toElement());
    await Promise.resolve();

    items.set([{ id: 1, label: 'second' }]);
    await Promise.resolve();

    return document.querySelector('#attr-preserve li').getAttribute('class');
  }, bundle);

  expect(cls).toBe('active');
});

test('signal content effect on discarded fresh node is stopped after reconciliation', async ({ page, bundle }) => {
  const count = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);

    const sharedContent = signal('hello');
    const items = signal([{ id: 1 }]);
    const rows = computed(() =>
      items.get().map(item => t.li({ dataKey: item.id }, [sharedContent])),
    );
    document.body.append(t.ul({ id: 'content-effect-cleanup' }, rows).toElement());
    await Promise.resolve();

    items.set([{ id: 1 }]);
    await Promise.resolve();

    // Count createTextNode calls on the next signal update.
    // reconcile() calls createTextNode for each text value it renders.
    // Without stopTracked: 2 (live + orphaned). With stopTracked: 1.
    let creates = 0;
    const orig = Document.prototype.createTextNode;
    Document.prototype.createTextNode = function createTextNode(...args) {
      creates++;
      return orig.apply(this, args);
    };
    sharedContent.set('world');
    await Promise.resolve();
    Document.prototype.createTextNode = orig;
    return creates;
  }, bundle);

  expect(count).toBe(1);
});

test('signal content in keyed element updates correctly after reconciliation', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);

    const sharedContent = signal('hello');
    const items = signal([{ id: 1 }]);
    const rows = computed(() =>
      items.get().map(item => t.li({ dataKey: item.id }, [sharedContent])),
    );
    document.body.append(t.ul({ id: 'content-after-reconcile' }, rows).toElement());
    await Promise.resolve();

    items.set([{ id: 1 }]);
    await Promise.resolve();

    sharedContent.set('world');
    await Promise.resolve();
  }, bundle);

  await expect(page.locator('#content-after-reconcile li')).toHaveText('world');
});

test('signal content switches from scalar to array and renders all items', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const content = signal('loading');
    document.body.append(t.ul({ id: 'switch-scalar-to-arr' }, content).toElement());
    content.set([t.li('a'), t.li('b'), t.li('c')]);
  }, bundle);
  await expect(page.locator('#switch-scalar-to-arr li')).toHaveCount(3);
  await expect(page.locator('#switch-scalar-to-arr li').nth(0)).toHaveText('a');
});

test('signal content switches from array to scalar and renders the value', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const content = signal([t.li('a'), t.li('b')]);
    document.body.append(t.p({ id: 'switch-arr-to-scalar' }, content).toElement());
    content.set('done');
  }, bundle);
  await expect(page.locator('#switch-arr-to-scalar')).toHaveText('done');
  await expect(page.locator('#switch-arr-to-scalar li')).toHaveCount(0);
});

test('signal content switches from array to null and clears the DOM region', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const content = signal([t.li('a'), t.li('b')]);
    document.body.append(t.ul({ id: 'switch-arr-to-null' }, content).toElement());
    content.set(null);
  }, bundle);
  await expect(page.locator('#switch-arr-to-null li')).toHaveCount(0);
});

// ─── dom update batching ───────────────────────────────────────────────────

test('multiple set() calls on one signal produce one attribute write', async ({ page, bundle }) => {
  const writes = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('initial');
    const el = t.div({ class: cls }).toElement();
    document.body.append(el);
    const log = [];
    const orig = el.setAttribute.bind(el);
    el.setAttribute = (name, val) => {
      if (name === 'class') {
        log.push(val);
      }
      orig(name, val);
    };
    cls.set('intermediate');
    cls.set('final');
    await Promise.resolve();
    return log;
  }, bundle);
  expect(writes).toEqual(['final']);
});

test('intermediate content value is never written to the DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const text = signal('initial');
    const el = t.p(text).toElement();
    document.body.append(el);
    text.set('intermediate');
    text.set('final');
    const before = el.textContent;
    await Promise.resolve();
    return { before, after: el.textContent };
  }, bundle);
  expect(result.before).toBe('initial');
  expect(result.after).toBe('final');
});

test('two signals on one element are both deferred and update together', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('foo');
    const title = signal('hello');
    const el = t.div({ class: cls, title }).toElement();
    document.body.append(el);
    cls.set('bar');
    title.set('world');
    const before = { cls: el.className, title: el.title };
    await Promise.resolve();
    return { before, after: { cls: el.className, title: el.title } };
  }, bundle);
  expect(result.before).toEqual({ cls: 'foo', title: 'hello' });
  expect(result.after).toEqual({ cls: 'bar', title: 'world' });
});

// ─── effect ────────────────────────────────────────────────────────────────

test('effect runs immediately and reflects initial signal value', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { signal, effect } = await import(src);
    const label = signal('hello');
    effect(() => { document.title = label.get(); });
  }, bundle);
  await expect(page).toHaveTitle('hello');
});

test('effect re-runs when signal changes', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { signal, effect } = await import(src);
    const label = signal('hello');
    effect(() => { document.title = label.get(); });
    label.set('world');
  }, bundle);
  await expect(page).toHaveTitle('world');
});

test('effect tracks multiple signals', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { signal, effect } = await import(src);
    const first = signal('John');
    const last = signal('Doe');
    effect(() => { document.title = `${first.get()} ${last.get()}`; });
    last.set('Smith');
  }, bundle);
  await expect(page).toHaveTitle('John Smith');
});

test('effect stop() prevents further runs', async ({ page, bundle }) => {
  const log = await page.evaluate(async src => {
    const { signal, effect } = await import(src);
    const s = signal('a');
    const calls = [];
    const e = effect(() => { calls.push(s.get()); });
    s.set('b');
    await Promise.resolve();
    e.stop();
    s.set('c');
    s.set('d');
    return calls;
  }, bundle);
  expect(log).toEqual(['a', 'b']);
});

test('effect cleans up stale conditional dependencies', async ({ page, bundle }) => {
  const log = await page.evaluate(async src => {
    const { signal, effect } = await import(src);
    const flag = signal(true);
    const a = signal('a');
    const b = signal('b');
    const calls = [];
    effect(() => { calls.push(flag.get() ? a.get() : b.get()); });
    flag.set(false);
    await Promise.resolve();
    a.set('a2'); // a is no longer tracked — should not trigger
    await Promise.resolve();
    b.set('b2');
    await Promise.resolve();
    return calls;
  }, bundle);
  expect(log).toEqual(['a', 'b', 'b2']);
});

// ─── DOM removal cleanup ────────────────────────────────────────────────────

test('signal attribute effect stops when element is removed from DOM', async ({ page, bundle }) => {
  const writes = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('a');
    const el = t.div({ id: 'rm-attr', class: cls }).toElement();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    cls.set('b');
    await Promise.resolve();
    return document.getElementById('rm-attr') === null && el.className;
  }, bundle);
  expect(writes).toBe('a');
});

test('signal content effect stops when element is removed from DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const text = signal('hello');
    const el = t.p({ id: 'rm-content' }, text).toElement();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    text.set('world');
    await Promise.resolve();
    return el.textContent;
  }, bundle);
  expect(result).toBe('hello');
});

test('signal effects stop when a parent element is removed from DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('x');
    const child = t.span({ class: cls }).toElement();
    const parent = document.createElement('div');
    parent.append(child);
    document.body.append(parent);
    await Promise.resolve();
    parent.remove();
    await Promise.resolve();
    cls.set('y');
    await Promise.resolve();
    return child.className;
  }, bundle);
  expect(result).toBe('x');
});
