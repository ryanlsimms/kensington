import { expect, test } from './config/fixtures.js';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3847/');
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

// ─── reconcile snapshot fast path ──────────────────────────────────────────
// The reconciler caches a structural snapshot of each keyed tag and compares the next
// render's tag by value (recursing into nested ContentTag instances). When the snapshot
// matches, toElement() is skipped entirely. These tests verify the fast path fires for
// the naive-but-correct workflow, declines correctly when data changes, and degrades
// safely when an attribute value can't be compared structurally.

test('snapshot fast path: skips toElement when value-equal tag is re-rendered', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);
    const items = signal([
      { id: 1, label: 'one', done: false },
      { id: 2, label: 'two', done: true },
    ]);
    const rows = computed(() =>
      items.get().map(item =>
        t.li({ dataKey: item.id, class: item.done ? 'done' : 'open' }, item.label),
      ),
    );
    document.body.append(t.ul({ id: 'fastpath-equal' }, rows).toElement());
    document.querySelectorAll('#fastpath-equal li').forEach(el => { el._sentinel = true; });

    // Count createElement calls during the re-render. The naive workflow allocates fresh
    // attribute object literals every map() call. Reference equality would always miss.
    // Value equality should still detect the structural match and skip toElement.
    const orig = Document.prototype.createElement;
    let count = 0;
    Document.prototype.createElement = function createElement(...args) {
      count++;
      return orig.apply(this, args);
    };
    try {
      items.set(prev => [...prev]); // fresh array, same items
      await Promise.resolve();
    } finally {
      Document.prototype.createElement = orig;
    }

    const preserved = Array.from(document.querySelectorAll('#fastpath-equal li')).map(el => el._sentinel === true);
    return { count, preserved };
  }, bundle);
  expect(result.count).toBe(0);
  expect(result.preserved).toEqual([true, true]);
});

test('snapshot fast path: skips toElement through nested tag children', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);
    const items = signal([
      { id: 1, href: '/a', label: 'A' },
      { id: 2, href: '/b', label: 'B' },
    ]);
    const rows = computed(() =>
      items.get().map(item =>
        t.li({ dataKey: item.id }, t.a({ href: item.href }, item.label)),
      ),
    );
    document.body.append(t.ul({ id: 'fastpath-nested' }, rows).toElement());
    document.querySelectorAll('#fastpath-nested li').forEach(el => { el._sentinel = true; });
    document.querySelectorAll('#fastpath-nested a').forEach(el => { el._innerSentinel = true; });

    const orig = Document.prototype.createElement;
    let count = 0;
    Document.prototype.createElement = function createElement(...args) {
      count++;
      return orig.apply(this, args);
    };
    try {
      items.set(prev => [...prev]);
      await Promise.resolve();
    } finally {
      Document.prototype.createElement = orig;
    }

    return {
      count,
      liPreserved: Array.from(document.querySelectorAll('#fastpath-nested li')).map(el => el._sentinel === true),
      aPreserved: Array.from(document.querySelectorAll('#fastpath-nested a')).map(el => el._innerSentinel === true),
    };
  }, bundle);
  expect(result.count).toBe(0);
  expect(result.liPreserved).toEqual([true, true]);
  expect(result.aPreserved).toEqual([true, true]);
});

test('snapshot fast path: declines when a text content value changes', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);
    const items = signal([{ id: 1, label: 'before' }, { id: 2, label: 'static' }]);
    const rows = computed(() =>
      items.get().map(item => t.li({ dataKey: item.id }, item.label)),
    );
    document.body.append(t.ul({ id: 'fastpath-decline-text' }, rows).toElement());
    document.querySelectorAll('#fastpath-decline-text li').forEach(el => { el._sentinel = true; });

    items.set([{ id: 1, label: 'after' }, { id: 2, label: 'static' }]);
    await Promise.resolve();

    const lis = Array.from(document.querySelectorAll('#fastpath-decline-text li'));
    return {
      texts: lis.map(el => el.textContent),
      preserved: lis.map(el => el._sentinel === true),
    };
  }, bundle);
  expect(result.texts).toEqual(['after', 'static']);
  // Both DOM nodes are reused: syncNode patched the text node in place for #1, fast path
  // fired for #2. Neither was replaced by a fresh element.
  expect(result.preserved).toEqual([true, true]);
});

test('snapshot fast path: declines when an attribute value changes', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);
    const items = signal([{ id: 1, done: false }, { id: 2, done: true }]);
    const rows = computed(() =>
      items.get().map(item =>
        t.li({ dataKey: item.id, class: item.done ? 'done' : 'open' }, 'item'),
      ),
    );
    document.body.append(t.ul({ id: 'fastpath-decline-attr' }, rows).toElement());

    items.set([{ id: 1, done: true }, { id: 2, done: true }]);
    await Promise.resolve();

    return Array.from(document.querySelectorAll('#fastpath-decline-attr li')).map(el => el.className);
  }, bundle);
  expect(result).toEqual(['done', 'done']);
});

test('snapshot fast path: declines when an inline event handler closure changes', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);
    const items = signal([{ id: 1 }]);
    const rows = computed(() =>
      items.get().map(item =>
        // Fresh arrow per render. Forces the fast path to decline.
        t.li({ dataKey: item.id, onclick: () => {} }, 'item'),
      ),
    );
    document.body.append(t.ul({ id: 'fastpath-decline-fn' }, rows).toElement());

    const orig = Document.prototype.createElement;
    let count = 0;
    Document.prototype.createElement = function createElement(...args) {
      count++;
      return orig.apply(this, args);
    };
    try {
      items.set(prev => [...prev]); // fresh array, same data, fresh closures
      await Promise.resolve();
    } finally {
      Document.prototype.createElement = orig;
    }
    return count;
  }, bundle);
  // At least one createElement call means the fast path declined and itemToNode ran.
  expect(result).toBeGreaterThan(0);
});

test('snapshot fast path: a stable Signal as an attribute hits the fast path', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);
    // Per-item signal stored on the item itself, so the attribute value reference is stable
    // across renders. This is the recommended pattern when per-row reactivity is needed.
    const items = signal([
      { id: 1, cls: signal('open') },
      { id: 2, cls: signal('done') },
    ]);
    const rows = computed(() =>
      items.get().map(item => t.li({ dataKey: item.id, class: item.cls }, 'item')),
    );
    document.body.append(t.ul({ id: 'fastpath-signal-attr' }, rows).toElement());
    document.querySelectorAll('#fastpath-signal-attr li').forEach(el => { el._sentinel = true; });

    const orig = Document.prototype.createElement;
    let count = 0;
    Document.prototype.createElement = function createElement(...args) {
      count++;
      return orig.apply(this, args);
    };
    try {
      items.set(prev => [...prev]);
      await Promise.resolve();
    } finally {
      Document.prototype.createElement = orig;
    }

    // The per-row signal should still drive its attribute. Mutating it updates the DOM
    // even though the row was reused via the fast path.
    items.get()[0].cls.set('done');
    await Promise.resolve();

    return {
      count,
      preserved: Array.from(document.querySelectorAll('#fastpath-signal-attr li')).map(el => el._sentinel === true),
      classes: Array.from(document.querySelectorAll('#fastpath-signal-attr li')).map(el => el.className),
    };
  }, bundle);
  expect(result.count).toBe(0);
  expect(result.preserved).toEqual([true, true]);
  expect(result.classes).toEqual(['done', 'done']);
});

test('snapshot fast path: LiteralTag in content forces fallback', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);
    const items = signal([{ id: 1, html: '<span>a</span>' }]);
    const rows = computed(() =>
      // Fresh LiteralTag instance each render. Not a ContentTag, falls back to
      // reference equality, which fails on fresh instances. The fast path declines.
      items.get().map(item => t.li({ dataKey: item.id }, t.literal(item.html))),
    );
    document.body.append(t.ul({ id: 'fastpath-literal' }, rows).toElement());

    const orig = Document.prototype.createElement;
    let count = 0;
    Document.prototype.createElement = function createElement(...args) {
      count++;
      return orig.apply(this, args);
    };
    try {
      items.set(prev => [...prev]);
      await Promise.resolve();
    } finally {
      Document.prototype.createElement = orig;
    }
    return count;
  }, bundle);
  expect(result).toBeGreaterThan(0);
});

test('in-place data mutation followed by signal.set with a fresh array updates the DOM', async ({ page, bundle }) => {
  // Re-rendering reads the source data via row(), so an in-place mutation followed by
  // signal.set with a fresh array reference produces value-unequal tags. The fast path
  // declines, syncNode patches the DOM in place. The genuine footgun is mutation without
  // a re-render trigger, but that's a signal.set short-circuit, not a snapshot-path issue.
  const result = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);
    const item = { id: 1, label: 'before' };
    const items = signal([item]);
    const rows = computed(() =>
      items.get().map(it => t.li({ dataKey: it.id }, it.label)),
    );
    document.body.append(t.ul({ id: 'mut-fresh-array' }, rows).toElement());

    item.label = 'after';
    items.set([item]); // fresh array reference, signal notifies, transform re-runs
    await Promise.resolve();

    return document.querySelector('#mut-fresh-array li').textContent;
  }, bundle);
  expect(result).toBe('after');
});

test('snapshot fast path: a stable Signal in content hits the fast path', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);
    // Per-item label signal stored on the item itself. The content reference is stable across
    // renders so the fast path's reference-equality fallback for Signal instances matches.
    const items = signal([
      { id: 1, label: signal('one') },
      { id: 2, label: signal('two') },
    ]);
    const rows = computed(() =>
      items.get().map(item => t.li({ dataKey: item.id }, item.label)),
    );
    document.body.append(t.ul({ id: 'fastpath-signal-content' }, rows).toElement());
    document.querySelectorAll('#fastpath-signal-content li').forEach(el => { el._sentinel = true; });

    const orig = Document.prototype.createElement;
    let count = 0;
    Document.prototype.createElement = function createElement(...args) {
      count++;
      return orig.apply(this, args);
    };
    try {
      items.set(prev => [...prev]);
      await Promise.resolve();
    } finally {
      Document.prototype.createElement = orig;
    }

    // The per-row signal still drives its content area even though the row was reused.
    items.get()[0].label.set('ONE');
    await Promise.resolve();

    return {
      count,
      preserved: Array.from(document.querySelectorAll('#fastpath-signal-content li')).map(el => el._sentinel === true),
      texts: Array.from(document.querySelectorAll('#fastpath-signal-content li')).map(el => el.textContent),
    };
  }, bundle);
  expect(result.count).toBe(0);
  expect(result.preserved).toEqual([true, true]);
  expect(result.texts).toEqual(['ONE', 'two']);
});

test('snapshot fast path: CommentTag in content forces fallback', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);
    const items = signal([{ id: 1, note: 'hi' }]);
    const rows = computed(() =>
      // Fresh CommentTag instance each render. Not a ContentTag, falls back to reference
      // equality, which fails on fresh instances. The fast path declines.
      items.get().map(item => t.li({ dataKey: item.id }, t.inlineComment(item.note))),
    );
    document.body.append(t.ul({ id: 'fastpath-comment' }, rows).toElement());

    const orig = Document.prototype.createElement;
    let count = 0;
    Document.prototype.createElement = function createElement(...args) {
      count++;
      return orig.apply(this, args);
    };
    try {
      items.set(prev => [...prev]);
      await Promise.resolve();
    } finally {
      Document.prototype.createElement = orig;
    }
    return count;
  }, bundle);
  expect(result).toBeGreaterThan(0);
});

test('snapshot fast path: reordering keyed nodes still hits the fast path', async ({ page, bundle }) => {
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
    document.body.append(t.ul({ id: 'fastpath-reorder' }, rows).toElement());
    const lis = Array.from(document.querySelectorAll('#fastpath-reorder li'));
    lis[0]._tag = 'a';
    lis[1]._tag = 'b';
    lis[2]._tag = 'c';

    const orig = Document.prototype.createElement;
    let count = 0;
    Document.prototype.createElement = function createElement(...args) {
      count++;
      return orig.apply(this, args);
    };
    try {
      items.set([items.get()[2], items.get()[0], items.get()[1]]); // reverse-ish
      await Promise.resolve();
    } finally {
      Document.prototype.createElement = orig;
    }

    const after = Array.from(document.querySelectorAll('#fastpath-reorder li'));
    return {
      count,
      texts: after.map(el => el.textContent),
      tags: after.map(el => el._tag),
    };
  }, bundle);
  expect(result.count).toBe(0);
  expect(result.texts).toEqual(['three', 'one', 'two']);
  expect(result.tags).toEqual(['c', 'a', 'b']);
});

test('snapshot fast path: class-instance attribute falls back to reference equality', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, computed } = await import(src);
    // Date is a class instance with a non-plain prototype. valueEqual rejects it and falls
    // back to reference equality. A stable reference hits the fast path; a fresh reference
    // with the same date declines.
    const stable = new Date(2026, 0, 1);
    const items = signal([{ id: 1, when: stable }]);
    const rows = computed(() =>
      items.get().map(item => t.li({ dataKey: item.id, dataWhen: item.when }, 'x')),
    );
    document.body.append(t.ul({ id: 'fastpath-date' }, rows).toElement());

    const orig = Document.prototype.createElement;
    let stableCount = 0;
    Document.prototype.createElement = function createElement(...args) {
      stableCount++;
      return orig.apply(this, args);
    };
    try {
      items.set([{ id: 1, when: stable }]); // same Date reference
      await Promise.resolve();
    } finally {
      Document.prototype.createElement = orig;
    }

    let freshCount = 0;
    Document.prototype.createElement = function createElement(...args) {
      freshCount++;
      return orig.apply(this, args);
    };
    try {
      items.set([{ id: 1, when: new Date(2026, 0, 1) }]); // fresh Date, value-equal but different ref
      await Promise.resolve();
    } finally {
      Document.prototype.createElement = orig;
    }
    return { stableCount, freshCount };
  }, bundle);
  expect(result.stableCount).toBe(0);
  expect(result.freshCount).toBeGreaterThan(0);
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

test('effect pause() temporarily stops the effect', async ({ page, bundle }) => {
  const log = await page.evaluate(async src => {
    const { signal, effect } = await import(src);
    const s = signal('a');
    const calls = [];
    const e = effect(() => { calls.push(s.get()); });
    s.set('b');
    await Promise.resolve();
    e.pause();
    s.set('c'); // skipped — effect is paused
    s.set('d'); // skipped — effect is paused
    await Promise.resolve();
    e.resume(); // runs once immediately with current value 'd', then re-subscribes
    s.set('e');
    await Promise.resolve();
    return calls;
  }, bundle);
  expect(log).toEqual(['a', 'b', 'd', 'e']);
});

test('effect stop() permanently prevents further runs', async ({ page, bundle }) => {
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
    await Promise.resolve();
    e.resume(); // no-op after stop()
    s.set('e');
    await Promise.resolve();
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

// ─── getDomElement ─────────────────────────────────────────────────────────

test('toElement() returns the same DOM node on every call', async ({ page, bundle }) => {
  const same = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'idem' }, 'hello');
    const el1 = tag.toElement();
    const el2 = tag.toElement();
    return el1 === el2;
  }, bundle);
  expect(same).toBe(true);
});

test('toElement() stashed before parent mounts returns the mounted element', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const child = t.span({ id: 'stash-child' }, 'hi');
    const stashed = child.toElement();
    document.body.append(t.div({ id: 'stash-parent' }, child).toElement());
    return document.querySelector('#stash-child') === stashed;
  }, bundle);
  expect(result).toBe(true);
});

test('getDomElement() returns null before the element is mounted', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    return t.div({ id: 'gde-null' }).getDomElement();
  }, bundle);
  expect(result).toBeNull();
});

test('getDomElement() returns the element while it is in the DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'gde-live' });
    const el = tag.toElement();
    document.body.append(el);
    return tag.getDomElement() === el;
  }, bundle);
  expect(result).toBe(true);
});

test('getDomElement() returns null after a non-reactive element is removed from DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'gde-nr-rm' });
    document.body.append(tag.toElement());
    tag.getDomElement().remove();
    return tag.getDomElement();
  }, bundle);
  expect(result).toBeNull();
});

test('toElement() after removal of non-reactive element returns the same element', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'gde-nr-fresh' });
    const first = tag.toElement();
    document.body.append(first);
    first.remove();
    const second = tag.toElement();
    return first === second;
  }, bundle);
  expect(result).toBe(true);
});

test('getDomElement() returns null after a comment tag is removed from DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.inlineComment('note');
    document.body.append(tag.toElement());
    tag.getDomElement().remove();
    return tag.getDomElement();
  }, bundle);
  expect(result).toBeNull();
});

test('getDomElement() returns null after a signal comment is removed from DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const note = signal('note');
    const tag = t.inlineComment(note);
    document.body.append(tag.toElement());
    tag.getDomElement().remove();
    await Promise.resolve();
    return tag.getDomElement();
  }, bundle);
  expect(result).toBeNull();
});

test('toElement() after removal of signal comment creates a fresh live comment', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const note = signal('before');
    const tag = t.inlineComment(note);
    const first = tag.toElement();
    document.body.append(first);
    first.remove();
    await Promise.resolve();
    const second = tag.toElement();
    document.body.append(second);
    note.set('after');
    await Promise.resolve();
    return { different: first !== second, liveValue: second.nodeValue };
  }, bundle);
  expect(result.different).toBe(true);
  expect(result.liveValue).toBe('after');
});

test('getDomElement() returns null after a reactive element is removed from DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('a');
    const tag = t.div({ id: 'gde-rx-rm', class: cls });
    document.body.append(tag.toElement());
    tag.getDomElement().remove();
    await Promise.resolve();
    return tag.getDomElement();
  }, bundle);
  expect(result).toBeNull();
});

test('signal attributes update live on a toElement() node', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('before');
    document.body.append(t.div({ id: 'gde-sig', class: cls }).toElement());
    cls.set('after');
  }, bundle);
  await expect(page.locator('#gde-sig')).toHaveClass('after');
});

test('toElement() after removal of reactive element creates a fresh live element', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('a');
    const tag = t.div({ id: 'gde-rm', class: cls });
    const first = tag.toElement();
    document.body.append(first);
    first.remove();
    await Promise.resolve();
    const second = tag.toElement();
    document.body.append(second);
    cls.set('b');
    await Promise.resolve();
    return { different: first !== second, liveClass: second.getAttribute('class') };
  }, bundle);
  expect(result.different).toBe(true);
  expect(result.liveClass).toBe('b');
});

test('non-reactive child: getDomElement() null while filtered, live after unfilter', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const tagA = t.li({ id: 'nr-a' }, 'Alpha');
    const tagB = t.li({ id: 'nr-b' }, 'Beta');
    const items = signal([tagA, tagB]);
    document.body.append(t.ul(items).toElement());
    items.set([tagA]);
    await Promise.resolve();
    const nullResult = tagB.getDomElement();
    items.set([tagA, tagB]);
    await Promise.resolve();
    const liveEl = tagB.getDomElement();
    return {
      nullWhileOut: nullResult === null,
      liveAfterIn: liveEl !== null && liveEl.isConnected,
      sameAsQueried: liveEl === document.querySelector('#nr-b'),
    };
  }, bundle);
  expect(result.nullWhileOut).toBe(true);
  expect(result.liveAfterIn).toBe(true);
  expect(result.sameAsQueried).toBe(true);
});

test('reactive child: getDomElement() null while filtered, live after unfilter', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('on');
    const tagA = t.li({ id: 're-a' }, 'Alpha');
    const tagB = t.li({ id: 're-b', class: cls }, 'Beta');
    const items = signal([tagA, tagB]);
    document.body.append(t.ul(items).toElement());
    items.set([tagA]);
    await Promise.resolve();
    await Promise.resolve(); // ensure MutationObserver has fired
    const nullWhileFiltered = tagB.getDomElement();
    items.set([tagA, tagB]);
    await Promise.resolve();
    const freshB = tagB.getDomElement();
    cls.set('off');
    await Promise.resolve();
    return {
      nullWhileFiltered: nullWhileFiltered === null,
      freshClass: freshB.getAttribute('class'),
    };
  }, bundle);
  expect(result.nullWhileFiltered).toBe(true);
  expect(result.freshClass).toBe('off');
});

test('keyed element that stays in DOM through a reconcile cycle remains reactive', async ({ page, bundle }) => {
  await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('on');
    const tagA = t.li({ id: 'keyed-rx-a', dataKey: 'a', class: cls }, 'Alpha');
    const tagB = t.li({ id: 'keyed-rx-b', dataKey: 'b' }, 'Beta');
    const items = signal([tagA, tagB]);
    document.body.append(t.ul(items).toElement());
    items.set([tagA]); // reconcile: tagA stays (existing === fresh path), tagB removed
    await Promise.resolve();
    cls.set('off');
    await Promise.resolve();
  }, bundle);
  await expect(page.locator('#keyed-rx-a')).toHaveClass('off');
});

// ─── prop key ────────────────────────────────────────────────────────────────

test('signal prop updates DOM property live', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const val = signal('first');
    const el = t.input({ id: 'prop-sig', type: 'text', prop: { value: val } }).toElement();
    document.body.append(el);
    val.set('second');
    await Promise.resolve();
    return el.value;
  }, bundle);
  expect(result).toBe('second');
});

test('signal prop effect stops when element is removed from DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const val = signal('before');
    const el = t.input({ type: 'text', prop: { value: val } }).toElement();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    val.set('after');
    await Promise.resolve();
    return el.value;
  }, bundle);
  expect(result).toBe('before');
});

// ─── addConnectedCallback / addDisconnectedCallback ──────────────────────────

test('addConnectedCallback fires when element is appended to the DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'cc-basic' });
    let fired = false;
    tag.addConnectedCallback(() => { fired = true; });
    document.body.append(tag.toElement());
    await Promise.resolve();
    return fired;
  }, bundle);
  expect(result).toBe(true);
});

test('addConnectedCallback receives the DOM element as its argument and as this', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'cc-this' });
    let argId = null;
    let thisId = null;
    tag.addConnectedCallback(function connectedCallback(el) { argId = el.id; thisId = this.id; });
    document.body.append(tag.toElement());
    await Promise.resolve();
    return { argId, thisId };
  }, bundle);
  expect(result.argId).toBe('cc-this');
  expect(result.thisId).toBe('cc-this');
});

test('addConnectedCallback fires when an ancestor is appended to the DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const child = t.span({ id: 'cc-child' });
    let fired = false;
    child.addConnectedCallback(() => { fired = true; });
    const parent = document.createElement('div');
    parent.append(child.toElement());
    document.body.append(parent);
    await Promise.resolve();
    return fired;
  }, bundle);
  expect(result).toBe(true);
});

test('addConnectedCallback does not fire if element is never added to the DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'cc-noop' });
    let fired = false;
    tag.addConnectedCallback(() => { fired = true; });
    tag.toElement();
    await Promise.resolve();
    return fired;
  }, bundle);
  expect(result).toBe(false);
});

test('multiple addConnectedCallback handlers all fire on connect', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'cc-multi' });
    const calls = [];
    tag.addConnectedCallback(() => { calls.push('a'); });
    tag.addConnectedCallback(() => { calls.push('b'); });
    document.body.append(tag.toElement());
    await Promise.resolve();
    return calls;
  }, bundle);
  expect(result).toEqual(['a', 'b']);
});

test('addConnectedCallback re-fires on every re-attachment with persist', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'cc-persist', persist: true });
    const calls = [];
    tag.addConnectedCallback(() => { calls.push('connected'); });
    const el = tag.toElement();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    document.body.append(el);
    await Promise.resolve();
    return calls;
  }, bundle);
  expect(result).toEqual(['connected', 'connected']);
});

test('addDisconnectedCallback re-fires on every removal with persist', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'dc-persist', persist: true });
    const calls = [];
    tag.addConnectedCallback(() => { calls.push('connected'); });
    tag.addDisconnectedCallback(() => { calls.push('disconnected'); });
    const el = tag.toElement();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    return calls;
  }, bundle);
  expect(result).toEqual(['connected', 'disconnected', 'connected', 'disconnected']);
});

test('addConnectedCallback does not re-fire after removal without persist', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'cc-no-persist' });
    const calls = [];
    tag.addConnectedCallback(() => { calls.push('connected'); });
    tag.addDisconnectedCallback(() => { calls.push('disconnected'); });
    const el = tag.toElement();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    document.body.append(el);
    await Promise.resolve();
    return calls;
  }, bundle);
  expect(result).toEqual(['connected', 'disconnected']);
});

test('addDisconnectedCallback fires when element is removed from the DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'dc-basic' });
    let fired = false;
    tag.addDisconnectedCallback(() => { fired = true; });
    const el = tag.toElement();
    document.body.append(el);
    el.remove();
    await Promise.resolve();
    return fired;
  }, bundle);
  expect(result).toBe(true);
});

test('addDisconnectedCallback receives the DOM element as its argument and as this', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'dc-this' });
    let argId = null;
    let thisId = null;
    tag.addDisconnectedCallback(function disconnectedCallback(el) { argId = el.id; thisId = this.id; });
    const el = tag.toElement();
    document.body.append(el);
    el.remove();
    await Promise.resolve();
    return { argId, thisId };
  }, bundle);
  expect(result.argId).toBe('dc-this');
  expect(result.thisId).toBe('dc-this');
});

test('addDisconnectedCallback fires when an ancestor is removed from the DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const child = t.span({ id: 'dc-child' });
    let fired = false;
    child.addDisconnectedCallback(() => { fired = true; });
    const parent = document.createElement('div');
    parent.append(child.toElement());
    document.body.append(parent);
    parent.remove();
    await Promise.resolve();
    return fired;
  }, bundle);
  expect(result).toBe(true);
});

test('addDisconnectedCallback does not fire if element is never removed from the DOM', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'dc-noop' });
    let fired = false;
    tag.addDisconnectedCallback(() => { fired = true; });
    document.body.append(tag.toElement());
    await Promise.resolve();
    return fired;
  }, bundle);
  expect(result).toBe(false);
});

test('addDisconnectedCallback fires alongside signal effect cleanup on removal', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('on');
    const tag = t.div({ id: 'dc-signal', class: cls });
    let dcFired = false;
    tag.addDisconnectedCallback(() => { dcFired = true; });
    const el = tag.toElement();
    document.body.append(el);
    el.remove();
    await Promise.resolve();
    cls.set('off');
    await Promise.resolve();
    return { dcFired, classAfterRemove: el.className };
  }, bundle);
  expect(result.dcFired).toBe(true);
  expect(result.classAfterRemove).toBe('on');
});

test('multiple addDisconnectedCallback handlers all fire on removal', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'dc-multi' });
    const calls = [];
    tag.addDisconnectedCallback(() => { calls.push('a'); });
    tag.addDisconnectedCallback(() => { calls.push('b'); });
    const el = tag.toElement();
    document.body.append(el);
    el.remove();
    await Promise.resolve();
    return calls;
  }, bundle);
  expect(result).toEqual(['a', 'b']);
});

test('addConnectedCallback and addDisconnectedCallback fire in lifecycle order', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'cc-dc-order' });
    const events = [];
    tag.addConnectedCallback(() => { events.push('connected'); });
    tag.addDisconnectedCallback(() => { events.push('disconnected'); });
    const el = tag.toElement();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    return events;
  }, bundle);
  expect(result).toEqual(['connected', 'disconnected']);
});

test('addDisconnectedCallback re-fires on every removal with persist, no connect cb', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'dc-persist-solo', persist: true });
    const calls = [];
    tag.addDisconnectedCallback(() => { calls.push('disconnected'); });
    const el = tag.toElement();
    document.body.append(el);
    el.remove();
    await Promise.resolve();
    document.body.append(el);
    el.remove();
    await Promise.resolve();
    return calls;
  }, bundle);
  expect(result).toEqual(['disconnected', 'disconnected']);
});

test('all callbacks re-fire on every cycle with persist', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'dc-mixed-persist', persist: true });
    const calls = [];
    tag.addConnectedCallback(() => { calls.push('connected'); });
    tag.addDisconnectedCallback(() => { calls.push('a'); });
    tag.addDisconnectedCallback(() => { calls.push('b'); });
    const el = tag.toElement();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    return calls;
  }, bundle);
  expect(result.filter(e => e === 'connected')).toEqual(['connected', 'connected']);
  expect(result.filter(e => e === 'a')).toEqual(['a', 'a']);
  expect(result.filter(e => e === 'b')).toEqual(['b', 'b']);
});

test('addDisconnectedCallback receives element on every removal with persist', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'dc-persist-arg', persist: true });
    const ids = [];
    tag.addDisconnectedCallback(el => { ids.push(el.id); });
    const el = tag.toElement();
    document.body.append(el);
    el.remove();
    await Promise.resolve();
    document.body.append(el);
    el.remove();
    await Promise.resolve();
    return ids;
  }, bundle);
  expect(result).toEqual(['dc-persist-arg', 'dc-persist-arg']);
});

test('signal attribute stays reactive across remove and re-insert with persist', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('a');
    const tag = t.div({ id: 'sig-resume', class: cls, persist: true });
    const el = tag.toElement();
    document.body.append(el);
    el.remove();
    await Promise.resolve();
    document.body.append(el);
    await Promise.resolve();
    cls.set('b');
    await Promise.resolve();
    return el.className;
  }, bundle);
  expect(result).toBe('b');
});

test('signal content stays reactive across remove and re-insert with persist', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const text = signal('before');
    const tag = t.p({ id: 'sig-content-resume', persist: true }, text);
    const el = tag.toElement();
    document.body.append(el);
    el.remove();
    await Promise.resolve();
    document.body.append(el);
    await Promise.resolve();
    text.set('after');
    await Promise.resolve();
    return el.textContent;
  }, bundle);
  expect(result).toBe('after');
});

test('signal effects stop again when a resumed element is removed a second time', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('a');
    const tag = t.div({ id: 'sig-restop', class: cls, persist: true });
    const el = tag.toElement();
    document.body.append(el);
    el.remove();
    await Promise.resolve();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    cls.set('b');
    await Promise.resolve();
    return el.className;
  }, bundle);
  expect(result).toBe('a');
});

test('signal effects resume and stop correctly across three removal cycles', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const cls = signal('a');
    const tag = t.div({ id: 'sig-three-cycles', class: cls, persist: true });
    const el = tag.toElement();
    const snapshot = [];

    for (let i = 0; i < 3; i++) {
      document.body.append(el);
      await Promise.resolve();
      cls.set(String(i + 1));
      await Promise.resolve();
      snapshot.push(el.className);
      el.remove();
      await Promise.resolve();
      cls.set('dead');
      await Promise.resolve();
      snapshot.push(el.className);
    }
    return snapshot;
  }, bundle);
  // Each cycle: class updates while connected, stays frozen while disconnected
  expect(result).toEqual(['1', '1', '2', '2', '3', '3']);
});

test('signal effects survive insertBefore reorder within same parent with persist', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const clsA = signal('a');
    const clsB = signal('b');
    const tagA = t.li({ id: 'li-a', class: clsA, persist: true });
    const tagB = t.li({ id: 'li-b', class: clsB, persist: true });
    const elA = tagA.toElement();
    const elB = tagB.toElement();
    const ul = document.createElement('ul');
    ul.append(elA, elB);
    document.body.append(ul);
    await Promise.resolve();

    // insertBefore moves elB before elA: fires removedNodes then addedNodes in same record
    ul.insertBefore(elB, elA);
    await Promise.resolve();

    // Both signal effects must still be live after the reorder
    clsA.set('a2');
    clsB.set('b2');
    await Promise.resolve();

    return [document.getElementById('li-a').className, document.getElementById('li-b').className];
  }, bundle);
  expect(result).toEqual(['a2', 'b2']);
});

test('getDomElement() returns the live element after reconnection in persist scenario', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'gde-reconnect', persist: true });
    const el = tag.toElement();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    document.body.append(el);
    await Promise.resolve();
    return tag.getDomElement()?.id ?? null;
  }, bundle);
  expect(result).toBe('gde-reconnect');
});

test('disconnect callbacks fire in order on every removal with toElement persist', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t } = await import(src);
    const tag = t.div({ id: 'dc-order', persist: true });
    const calls = [];
    tag.addDisconnectedCallback(() => { calls.push('first'); });
    tag.addDisconnectedCallback(() => { calls.push('second'); });
    const el = tag.toElement();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    document.body.append(el);
    await Promise.resolve();
    el.remove();
    await Promise.resolve();
    return calls;
  }, bundle);
  expect(result).toEqual(['first', 'second', 'first', 'second']);
});

test('literal(signal) stops its effect when the host element is removed', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal } = await import(src);
    const html = signal('<p>a</p>');
    const host = t.div({ id: 'lit-leak' }, t.literal(html)).toElement();
    document.body.append(host);

    html.set('<p>b</p>');
    await Promise.resolve();
    const before = document.querySelector('#lit-leak').textContent;

    // Count template element constructions during signal updates after removal.
    // The literal effect creates one <template> per run, so any post-removal count > 0
    // means the effect leaked.
    host.remove();
    await new Promise(resolve => { requestAnimationFrame(() => resolve()); });

    const orig = Document.prototype.createElement;
    let templates = 0;
    Document.prototype.createElement = function createElement(tag, ...rest) {
      if (tag === 'template') { templates++; }
      return orig.call(this, tag, ...rest);
    };
    try {
      html.set('<p>c</p>');
      html.set('<p>d</p>');
      await Promise.resolve();
    } finally {
      Document.prototype.createElement = orig;
    }
    return { before, templates };
  }, bundle);
  expect(result.before).toBe('b');
  expect(result.templates).toBe(0);
});

