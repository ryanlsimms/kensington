import { expect, test } from './config/fixtures.js';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3847/');
});

test('scalar bindings retain text nodes and skip equivalent DOM writes', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { signal, t, applyPendingReactiveUpdates, effect } = await import(src);
    const value = signal('a');
    const el = t.p({ title: value }, value).toElement();
    document.body.append(el);
    const text = [...el.childNodes].find(node => node.nodeType === 3);
    const observer = new MutationObserver(() => {});
    observer.observe(el, { subtree: true, attributes: true, characterData: true, childList: true });
    value.set('b');
    applyPendingReactiveUpdates();
    const changes = observer.takeRecords().map(record => record.type);
    let effects = 0;
    const consumer = effect(() => { value.get(); effects++; });
    effects = 0;
    value.set('c');
    value.set('b');
    applyPendingReactiveUpdates();
    const netZero = observer.takeRecords().length;
    el.title = 'external';
    text.nodeValue = 'external';
    observer.takeRecords();
    value.set('c');
    value.set('b');
    applyPendingReactiveUpdates();
    const repaired = [el.title, el.textContent];
    consumer.stop();
    observer.disconnect();
    return { same: text === [...el.childNodes].find(node => node.nodeType === 3), changes, netZero, effects, repaired };
  }, bundle);
  expect(result.same).toBe(true);
  expect(result.changes.sort()).toEqual(['attributes', 'characterData']);
  expect(result.netZero).toBe(0);
  expect(result.effects).toBe(2);
  expect(result.repaired).toEqual(['b', 'b']);
});

test('style bindings write changed properties and repair external edits', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { signal, t, applyPendingReactiveUpdates } = await import(src);
    const style = signal({ color: '#ff0000', width: '10px' });
    const el = t.div({ style }).toElement();
    document.body.append(el);
    const writes = [];
    const original = el.style.setProperty.bind(el.style);
    el.style.setProperty = (name, value, priority) => { writes.push(name); original(name, value, priority); };
    style.set({ color: '#ff0000', width: '20px' });
    applyPendingReactiveUpdates();
    const changed = writes.splice(0);
    el.style.color = 'blue';
    style.set({ color: '#ff0000', width: '20px' });
    applyPendingReactiveUpdates();
    const repaired = writes.splice(0);
    style.set({ color: '#ff0000' });
    applyPendingReactiveUpdates();
    return { changed, repaired, width: el.style.width, color: el.style.color };
  }, bundle);
  expect(result.changed).toEqual(['width']);
  expect(result.repaired).toEqual(['color']);
  expect(result.width).toBe('');
  expect(result.color).toBe('rgb(255, 0, 0)');
});

for (const standalone of [false, true]) {
  test(`keyed mounting retains focus and cleans up rows (standalone=${standalone})`, async ({ page, bundle }) => {
    const result = await page.evaluate(async ({ src, direct }) => {
      const { signal, t, applyPendingReactiveUpdates } = await import(src);
      const items = signal([{ id: 1 }, { id: 2 }]);
      const theme = signal('a');
      let builds = 0;
      const rows = items.mapWithKey('id', item => {
        builds++;
        return t.input({ value: `${item.id}:${theme.get()}` });
      });
      const host = t.section({ title: theme }).toElement();
      document.body.append(host);
      host.append(direct ? rows.toElement() : t.div(rows).toElement());
      const first = host.querySelector('input');
      first.value = 'typed';
      first.focus();
      first.setSelectionRange(1, 3);
      const observer = new MutationObserver(() => {});
      observer.observe(host, { childList: true, subtree: true });
      items.set(previous => [...previous, { id: 3 }]);
      applyPendingReactiveUpdates();
      const appended = {
        focused: document.activeElement === first,
        same: host.querySelector('input') === first,
        selection: [first.selectionStart, first.selectionEnd],
        value: first.value,
        mutations: observer.takeRecords().length,
      };
      observer.disconnect();
      host.remove();
      // Removal cleanup belongs to MutationObserver, not the reactive flush.
      await new Promise(resolve => { setTimeout(resolve, 0); });
      builds = 0;
      theme.set('b');
      applyPendingReactiveUpdates();
      const afterRemoval = builds;
      const secondHost = document.createElement('section');
      document.body.append(secondHost);
      secondHost.append(rows.toElement());
      const revived = [...secondHost.querySelectorAll('input')].map(input => input.value);
      rows.stop();
      builds = 0;
      theme.set('c');
      applyPendingReactiveUpdates();
      return { appended, afterRemoval, revived, afterStop: builds };
    }, { src: bundle, direct: standalone });
    expect(result.appended).toEqual({ focused: true, same: true, selection: [1, 3], value: 'typed', mutations: 1 });
    expect(result.afterRemoval).toBe(0);
    expect(result.revived).toEqual(['1:b', '2:b', '3:b']);
    expect(result.afterStop).toBe(0);
  });
}

test('row replacements capture all scroll state before DOM writes', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { signal, t, applyPendingReactiveUpdates } = await import(src);
    const items = signal(Array.from({ length: 20 }, (_, id) => ({ id, label: 'a' })));
    const rows = items.mapWithKey('id', item => t.div({ style: { height: '40px', overflow: 'auto' } }, [
      t.input({ value: item.label }),
      t.div({ style: { height: '300px' } }, item.label),
    ]));
    const host = t.section(rows).toElement();
    document.body.append(host);
    const input = host.querySelector('input');
    input.focus();
    input.value = 'typed';
    input.setSelectionRange(1, 3);
    for (const row of host.children) { row.scrollTop = 50; }
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
    const operations = [];
    const insert = host.insertBefore;
    Object.defineProperty(Element.prototype, 'scrollTop', {
      ...descriptor,
      get() { operations.push('read'); return descriptor.get.call(this); },
    });
    host.insertBefore = function insertBefore(...args) { operations.push('write'); return insert.apply(this, args); };
    try {
      items.set(previous => previous.map(item => ({ ...item, label: 'b' })));
      applyPendingReactiveUpdates();
    } finally {
      Object.defineProperty(Element.prototype, 'scrollTop', descriptor);
      host.insertBefore = insert;
    }
    const nextInput = host.querySelector('input');
    return {
      firstWrite: operations.indexOf('write'),
      lastRead: operations.lastIndexOf('read'),
      scrolls: [...host.children].map(row => row.scrollTop),
      focused: document.activeElement === nextInput,
      value: nextInput.value,
      selection: [nextInput.selectionStart, nextInput.selectionEnd],
      labels: [...host.children].map(row => row.lastElementChild.textContent),
    };
  }, bundle);
  expect(result.lastRead).toBeGreaterThanOrEqual(0);
  expect(result.firstWrite).toBeGreaterThan(result.lastRead);
  expect(result.scrolls).toEqual(Array(20).fill(50));
  expect(result.focused).toBe(true);
  expect(result.value).toBe('typed');
  expect(result.selection).toEqual([1, 3]);
  expect(result.labels).toEqual(Array(20).fill('b'));
});

test('pending updates synchronously apply text attributes properties and user effects', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { applyPendingReactiveUpdates, signal, effect, t } = await import(src);
    const value = signal('initial');
    const unrelated = signal(0);
    const el = t.input({ title: value, prop: { value } }).toElement();
    const label = t.p(value).toElement();
    document.body.append(el, label);
    const seen = [];
    const watcher = effect(() => { seen.push(unrelated.get()); });
    let writes = 0;
    const original = el.setAttribute.bind(el);
    el.setAttribute = (name, next) => { writes++; original(name, next); };
    unrelated.set(1);
    value.set('intermediate');
    value.set('final');
    const before = [el.title, el.value, label.textContent, seen.length];
    const returned = applyPendingReactiveUpdates();
    const after = [el.title, el.value, label.textContent, seen.length];
    // Let the automatic pass run to prove it does not repeat the explicit DOM updates.
    await Promise.resolve();
    const afterMicrotask = [el.title, el.value, label.textContent, seen.length];
    watcher.stop();
    return { before, after, afterMicrotask, writes, returnedNothing: returned === undefined };
  }, bundle);
  expect(result.before).toEqual(['initial', 'initial', 'initial', 1]);
  expect(result.after).toEqual(['final', 'final', 'final', 2]);
  expect(result.afterMicrotask).toEqual(result.after);
  expect(result.writes).toBe(1);
  expect(result.returnedNothing).toBe(true);
});

test('pending updates prepare a new input for immediate focus and selection', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { applyPendingReactiveUpdates, signal, t } = await import(src);
    const view = signal(null);
    const draft = signal('initial');
    const parent = t.div(view).toElement();
    document.body.append(parent);
    view.set(t.input({ id: 'new-input', prop: { value: draft } }));
    draft.set('ready to edit');
    const before = parent.querySelector('input') !== null;
    applyPendingReactiveUpdates();
    const input = parent.querySelector('input');
    input.focus();
    input.select();
    return {
      before,
      focused: document.activeElement === input,
      value: input.value,
      selection: [input.selectionStart, input.selectionEnd],
    };
  }, bundle);
  expect(result).toEqual({ before: false, focused: true, value: 'ready to edit', selection: [0, 13] });
});

test('pending updates render a new keyed row before a DOM lookup and focus', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { applyPendingReactiveUpdates, signal, t } = await import(src);
    const cards = signal([{ id: 'first', title: 'First' }]);
    const rows = cards.mapWithKey('id', card => t.li({ dataCardId: card.id, tabindex: 0 }, card.title));
    const list = t.ul(rows).toElement();
    document.body.append(list);
    const original = list.firstElementChild;

    cards.set(previous => [...previous, { id: 'new', title: 'New card' }]);
    const before = document.querySelector('[data-card-id="new"]') !== null;
    applyPendingReactiveUpdates();
    const added = document.querySelector('[data-card-id="new"]');
    added.focus();
    return {
      before,
      focused: document.activeElement === added,
      title: added.textContent,
      preserved: list.firstElementChild === original,
    };
  }, bundle);
  expect(result).toEqual({ before: false, focused: true, title: 'New card', preserved: true });
});

test('animation reset commits before transitions return and later updates animate', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { applyPendingReactiveUpdates, signal, t } = await import(src);
    const width = signal('100px');
    const el = t.div({ style: { width, height: '10px', transition: 'width 2s linear' } }).toElement();
    document.body.append(el);
    el.getBoundingClientRect();
    const previous = el.style.transition;
    el.style.transition = 'none';
    width.set('0px');
    const before = el.getBoundingClientRect().width;
    applyPendingReactiveUpdates();
    const resetWidth = el.getBoundingClientRect().width;
    el.style.transition = previous;
    await new Promise(resolve => { requestAnimationFrame(resolve); });
    const resetAnimations = el.getAnimations().length;
    width.set('50px');
    applyPendingReactiveUpdates();
    el.getBoundingClientRect();
    const laterAnimations = el.getAnimations().length;
    el.getAnimations().forEach(animation => animation.cancel());
    return { before, resetWidth, resetAnimations, laterAnimations };
  }, bundle);
  expect(result).toEqual({ before: 100, resetWidth: 0, resetAnimations: 0, laterAnimations: 1 });
});

test('automatic batching continues after manually applying DOM updates', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { applyPendingReactiveUpdates, signal, t } = await import(src);
    const value = signal('a');
    const el = t.p(value).toElement();
    document.body.append(el);
    value.set('b');
    applyPendingReactiveUpdates();
    value.set('c');
    value.set('d');
    const before = el.textContent;
    // Verify later writes still update automatically without another helper call.
    await Promise.resolve();
    return { before, after: el.textContent };
  }, bundle);
  expect(result).toEqual({ before: 'b', after: 'd' });
});
