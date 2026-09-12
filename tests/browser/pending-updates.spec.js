import { expect, test } from './config/fixtures.js';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3847/');
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
