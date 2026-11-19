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
    ]).addDisconnectedCallback(() => {}));
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

test('prop notifications batch, bubble and suppress echoes', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, applyPendingReactiveUpdates } = await import(src);
    const amount = signal('1');
    const sibling = signal('2');
    const disabled = signal(false);
    const events = [];
    const form = t.form({ oninput: e => {
      events.push([e.target.value, e.currentTarget.elements.other.value, e.bubbles, e.composed, e.isTrusted]);
    } }, [
      t.input({
        name: 'amount',
        prop: { value: amount, disabled },
        dispatchOnPropChange: true,
        oninput: e => amount.set(e.target.value),
      }),
      t.input({ name: 'other', prop: { value: sibling } }),
    ]).toElement();
    document.body.append(form);
    const mounted = events.length;
    amount.set('3');
    sibling.set('4');
    applyPendingReactiveUpdates();
    const programmatic = events.splice(0);
    form.elements.amount.value = '5';
    form.elements.amount.dispatchEvent(new Event('input', { bubbles: true }));
    applyPendingReactiveUpdates();
    const userEvents = events.splice(0).length;
    disabled.set(true);
    amount.set('6');
    amount.set('5');
    applyPendingReactiveUpdates();
    return {
      mounted, programmatic, userEvents, extra: events.length, serialized: form.outerHTML.includes('dispatch'),
    };
  }, bundle);
  expect(result).toEqual({
    mounted: 0, programmatic: [['3', '4', true, true, false]], userEvents: 1, extra: 0, serialized: false,
  });
});

test('prop notifications infer control events and are opt in', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, applyPendingReactiveUpdates } = await import(src);
    const events = [];
    const values = [];
    const specs = [
      ['input', 'text', 'value', 'input'],
      ['input', 'number', 'value', 'input'],
      ['input', 'checkbox', 'checked', 'change'],
      ['input', 'radio', 'checked', 'change'],
      ['textarea', null, 'value', 'input'],
      ['select', null, 'value', 'change'],
    ];
    for (const [tag, type, property, event] of specs) {
      const value = signal(property === 'checked' ? false : '1');
      const options = tag === 'select' ? [t.option({ value: '1' }, 'One'), t.option({ value: '2' }, 'Two')] : undefined;
      const el = t[tag]({
        ...(type ? { type } : {}), prop: { [property]: value }, dispatchOnPropChange: true,
      }, options).toElement();
      el.addEventListener(event, () => events.push(`${tag}:${type}:${event}`));
      document.body.append(el);
      values.push([value, property === 'checked' ? true : '2']);
    }
    for (const flag of [undefined, false]) {
      const value = signal('1');
      const el = t.input({
        prop: { value }, dispatchOnPropChange: flag, oninput: () => events.push('unexpected'),
      }).toElement();
      document.body.append(el);
      values.push([value, '2']);
    }
    for (const [value, next] of values) { value.set(next); }
    await Promise.resolve(); // Verify the automatic flush too.
    applyPendingReactiveUpdates();
    return events;
  }, bundle);
  expect(result).toEqual([
    'input:text:input',
    'input:number:input',
    'input:checkbox:change',
    'input:radio:change',
    'textarea:null:input',
    'select:null:change',
  ]);
});

test('prop writes preserve equivalent numeric edits and text selection without opting in', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, applyPendingReactiveUpdates } = await import(src);
    const value = signal('abc');
    const number = signal(1);
    const text = t.input({ prop: { value } }).toElement();
    const numeric = t.input({ type: 'number', prop: { value: number } }).toElement();
    document.body.append(text, numeric);
    text.focus();
    text.value = 'abxc';
    text.setSelectionRange(3, 3);
    value.set('abxc');
    numeric.value = '2.0';
    number.set(2);
    applyPendingReactiveUpdates();
    return [text.selectionStart, numeric.value];
  }, bundle);
  expect(result).toEqual([3, '2.0']);
});

test('prop notifications skip normalized no-ops and detached elements', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, applyPendingReactiveUpdates } = await import(src);
    const value = signal('');
    let events = 0;
    const el = t.input({
      type: 'number', prop: { value }, dispatchOnPropChange: true, oninput: () => events++,
    }).toElement();
    document.body.append(el);
    value.set('invalid');
    applyPendingReactiveUpdates();
    const normalized = events;
    value.set('2');
    el.remove();
    applyPendingReactiveUpdates();
    return [normalized, events];
  }, bundle);
  expect(result).toEqual([0, 0]);
});

test('prop notification handlers can update signals without subscribing their binding', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, effect, applyPendingReactiveUpdates } = await import(src);
    const value = signal('a');
    const unrelated = signal(0);
    let events = 0;
    const el = t.input({ prop: { value },
      dispatchOnPropChange: true,
      oninput: () => {
        unrelated.get();
        events++;
        if (value.get() === 'b') { value.set('c'); }
      } }).toElement();
    document.body.append(el);
    value.set('b');
    applyPendingReactiveUpdates();
    unrelated.set(1);
    applyPendingReactiveUpdates();
    const consumer = effect(() => unrelated.get());
    consumer.stop();
    return [events, el.value];
  }, bundle);
  expect(result).toEqual([2, 'c']);
});

test('prop events cross shadow roots and coalesce net-zero effects', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, effect, applyPendingReactiveUpdates } = await import(src);
    const value = signal('a');
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    let events = 0;
    host.addEventListener('input', () => events++);
    shadow.append(t.input({ prop: { value }, dispatchOnPropChange: true }).toElement());
    const undo = effect(() => {
      if (value.get() === 'b') { value.set('a'); }
    });
    value.set('b');
    applyPendingReactiveUpdates();
    const netZero = events;
    undo.stop();
    value.set('c');
    applyPendingReactiveUpdates();
    return [netZero, events];
  }, bundle);
  expect(result).toEqual([0, 1]);
});

test('prop event feedback remains bounded by reactive loop protection', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, applyPendingReactiveUpdates } = await import(src);
    const value = signal('a');
    let events = 0;
    const el = t.input({
      prop: { value },
      dispatchOnPropChange: true,
      oninput: () => { events++; value.set(value.get() === 'a' ? 'b' : 'a'); },
    }).toElement();
    document.body.append(el);
    value.set('b');
    applyPendingReactiveUpdates();
    el.remove();
    return events;
  }, bundle);
  expect(result).toBeGreaterThan(1);
  expect(result).toBeLessThanOrEqual(100);
});

test('prop dispatch preserves coercion and avoids unrelated getters', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, applyPendingReactiveUpdates } = await import(src);
    const value = signal('start');
    const select = t.select({ prop: { value }, dispatchOnPropChange: true }, [
      t.option({ value: '' }, 'Empty'),
      t.option({ value: 'null' }, 'Null'),
      t.option({ value: 'undefined' }, 'Undefined'),
      t.option({ value: 'start' }, 'Start'),
    ]).toElement();
    document.body.append(select);
    value.set(null);
    applyPendingReactiveUpdates();
    const nullValue = select.value;
    value.set(undefined);
    applyPendingReactiveUpdates();
    const undefinedValue = select.value;
    const custom = signal(1);
    const div = t.div({ prop: { custom } }).toElement();
    document.body.append(div);
    let assigned;
    Object.defineProperty(div, 'custom', {
      get() { throw new Error('property getter must not be read'); },
      set(v) { assigned = v; },
    });
    custom.set(2);
    applyPendingReactiveUpdates();
    return [nullValue, undefinedValue, assigned];
  }, bundle);
  expect(result).toEqual(['null', 'undefined', 2]);
});

test('prop notification handlers settle sibling changes before the next notification', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, applyPendingReactiveUpdates } = await import(src);
    const a = signal('a');
    const b = signal('b');
    const seen = [];
    const form = t.form([
      t.input({ prop: { value: a }, dispatchOnPropChange: true, oninput: () => b.set('handler') }),
      t.input({
        prop: { value: b },
        dispatchOnPropChange: true,
        oninput: e => seen.push([e.target.value, b.get()]),
      }),
    ]).toElement();
    document.body.append(form);
    a.set('A');
    b.set('B');
    applyPendingReactiveUpdates();
    return seen;
  }, bundle);
  expect(result).toEqual([['handler', 'handler']]);
});

test('initial prop writes protect live values from later default attributes', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, applyPendingReactiveUpdates } = await import(src);
    const results = [];
    for (const dispatchOnPropChange of [false, true]) {
      const defaultValue = signal('');
      const defaultChecked = signal(false);
      const value = signal('');
      const checked = signal(false);
      let events = 0;
      const form = t.form({ oninput: () => events++, onchange: () => events++ }, [
        t.input({ value: defaultValue, prop: { value }, dispatchOnPropChange }),
        t.input({ type: 'checkbox', checked: defaultChecked, prop: { checked }, dispatchOnPropChange }),
      ]).toElement();
      document.body.append(form);
      defaultValue.set('new default');
      defaultChecked.set(true);
      applyPendingReactiveUpdates();
      results.push([form.elements[0].value, form.elements[1].checked, events]);
      form.reset();
      results.push([form.elements[0].value, form.elements[1].checked]);
    }
    return results;
  }, bundle);
  expect(result).toEqual([['', false, 0], ['new default', true], ['', false, 0], ['new default', true]]);
});

const inputTypeTransitions = [
  { property: 'value', unsupportedType: 'checkbox', supportedType: 'text', initial: 'a', next: 'b', last: 'c' },
  { property: 'checked', unsupportedType: 'text', supportedType: 'checkbox', initial: false, next: true, last: false },
];

for (const typeBinding of ['attribute', 'property']) {
  for (const propertyFirst of [true, false]) {
    for (const transition of inputTypeTransitions) {
      const order = propertyFirst ? 'before' : 'after';
      test(`prop event: ${transition.property} changes ${order} type ${typeBinding}`, async ({ page, bundle }) => {
        const result = await page.evaluate(async ({ src, caseData }) => {
          const { t, signal, applyPendingReactiveUpdates } = await import(src);
          const { property, unsupportedType, supportedType, initial, next, last } = caseData.transition;
          const type = signal(unsupportedType);
          const value = signal(initial);
          let events = 0;
          const el = t.input({
            ...(caseData.typeBinding === 'attribute' ? { type } : {}),
            prop: { [property]: value, ...(caseData.typeBinding === 'property' ? { type } : {}) },
            dispatchOnPropChange: true,
            oninput: () => events++,
            onchange: () => events++,
          }).toElement();
          document.body.append(el);

          function update(nextValue, nextType) {
            const writes = [() => value.set(nextValue), () => type.set(nextType)];
            if (!caseData.propertyFirst) { writes.reverse(); }
            for (const write of writes) { write(); }
            applyPendingReactiveUpdates();
          }

          update(next, supportedType);
          const supportedEvents = events;
          update(last, unsupportedType);
          return { supportedEvents, unsupportedEvents: events - supportedEvents };
        }, { src: bundle, caseData: { typeBinding, propertyFirst, transition } });
        expect(result).toEqual({ supportedEvents: 1, unsupportedEvents: 0 });
      });
    }
  }
}

for (const dispatchOnPropChange of [false, true]) {
  test(`multiple select value writes reconcile all selected options (dispatch=${dispatchOnPropChange})`,
    async ({ page, bundle }) => {
      const result = await page.evaluate(async ({ src, dispatchEvents }) => {
        const { t, signal, applyPendingReactiveUpdates } = await import(src);
        const value = signal('b');
        let events = 0;
        const form = t.form({ onchange: () => events++ }, t.select({
          name: 'choice', multiple: true, prop: { value }, dispatchOnPropChange: dispatchEvents,
        }, [
          t.option({ value: 'a' }, 'A'), t.option({ value: 'b' }, 'B'), t.option({ value: 'c' }, 'C'),
        ])).toElement();
        document.body.append(form);
        const select = form.elements.choice;
        select.options[0].selected = true;
        select.options[1].selected = false;
        select.options[2].selected = true;
        value.set('a');
        applyPendingReactiveUpdates();
        const afterChange = { selected: new FormData(form).getAll('choice'), events };
        value.set('b');
        value.set('a');
        applyPendingReactiveUpdates();
        return { afterChange, afterNoOp: events };
      }, { src: bundle, dispatchEvents: dispatchOnPropChange });
      const expectedEvents = dispatchOnPropChange ? 1 : 0;
      expect(result).toEqual({
        afterChange: { selected: ['a'], events: expectedEvents }, afterNoOp: expectedEvents,
      });
    });

  test(`select value writes choose the first duplicate option (dispatch=${dispatchOnPropChange})`,
    async ({ page, bundle }) => {
      const result = await page.evaluate(async ({ src, dispatchEvents }) => {
        const { t, signal, applyPendingReactiveUpdates } = await import(src);
        const value = signal('b');
        let events = 0;
        const select = t.select({
          prop: { value }, dispatchOnPropChange: dispatchEvents, onchange: () => events++,
        }, [
          t.option({ value: 'a' }, 'First A'),
          t.option({ value: 'a' }, 'Second A'),
          t.option({ value: 'b' }, 'B'),
        ]).toElement();
        document.body.append(select);
        select.selectedIndex = 1;
        value.set('a');
        applyPendingReactiveUpdates();
        return { value: select.value, selectedIndex: select.selectedIndex, events };
      }, { src: bundle, dispatchEvents: dispatchOnPropChange });
      expect(result).toEqual({ value: 'a', selectedIndex: 0, events: dispatchOnPropChange ? 1 : 0 });
    });
}

test('select notifications coalesce using the complete final selection', async ({ page, bundle }) => {
  const result = await page.evaluate(async src => {
    const { t, signal, effect, applyPendingReactiveUpdates } = await import(src);
    const value = signal('b');
    let events = 0;
    const select = t.select({
      multiple: true, prop: { value }, dispatchOnPropChange: true, onchange: () => events++,
    }, [
      t.option({ value: 'a' }, 'A'), t.option({ value: 'b' }, 'B'), t.option({ value: 'c' }, 'C'),
    ]).toElement();
    document.body.append(select);
    select.options[0].selected = true;
    select.options[1].selected = false;
    select.options[2].selected = true;
    const restoreSelection = effect(() => {
      if (value.get() === 'a') { select.options[2].selected = true; }
    });
    value.set('a');
    applyPendingReactiveUpdates();
    restoreSelection.stop();
    return { events, selected: Array.from(select.selectedOptions, option => option.value) };
  }, bundle);
  expect(result).toEqual({ events: 0, selected: ['a', 'c'] });
});
