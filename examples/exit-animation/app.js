import { signal, t } from 'kensington';

let nextId = 4;
const items = signal([
  { id: 1, name: 'Buy groceries' },
  { id: 2, name: 'Call the dentist' },
  { id: 3, name: 'Read a book' },
]);

function item({ id, name }) {
  const tag = t.li({ dataKey: id, class: 'item' }, [
    t.span({ class: 'item-name' }, name),
    t.button({
      type: 'button',
      class: 'remove-btn',
      onclick: () => {
        const el = tag.toElement();
        el.classList.add('leaving');
        // delay the signal update until the CSS animation completes
        el.addEventListener('animationend', () => {
          items.set(list => list.filter(i => i.id !== id));
        }, { once: true });
      },
    }, [ 'Remove']),
  ]);
  return tag;
}

const newItemInput = t.input({ type: 'text', placeholder: 'Add an item...', class: 'add-input' });

const app = t.div([
  t.h1('Exit animations'),
  t.p({ class: 'description' }, [
    'Kensington has no pre-removal hook. Exit animations work by delaying the signal update until the CSS animation completes.',
  ]),
  t.ul({ class: 'list' }, items.transform(list => list.map(item))),
  t.div({ class: 'add-row' }, [
    newItemInput,
    t.button({
      type: 'button',
      class: 'add-btn',
      onclick: () => {
        const el = newItemInput.toElement();
        const name = el.value.trim();
        if (!name) { return; }
        items.set(list => [...list, { id: nextId++, name }]);
        el.value = '';
        el.focus();
      },
    }, [ 'Add']),
  ]),
]);

document.body.append(app.toElement());
