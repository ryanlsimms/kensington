import { t } from 'kensington';

import { useReducer } from './use-reducer.js';

function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const existing = state.items.find(i => i.id === action.item.id);
      if (existing) {
        return {
          items: state.items.map(i => i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i),
          total: state.total + action.item.price,
        };
      }
      return { items: [...state.items, { ...action.item, qty: 1 }], total: state.total + action.item.price };
    }
    case 'remove': {
      const item = state.items.find(i => i.id === action.id);
      if (item.qty > 1) {
        return {
          items: state.items.map(i => i.id === action.id ? { ...i, qty: i.qty - 1 } : i),
          total: state.total - item.price,
        };
      }
      return { items: state.items.filter(i => i.id !== action.id), total: state.total - item.price };
    }
    case 'clear':
      return { items: [], total: 0 };
    default:
      return state;
  }
}

const { state, dispatch } = useReducer(cartReducer, { items: [], total: 0 });

const products = [
  { id: 1, name: 'Widget', price: 9.99 },
  { id: 2, name: 'Gadget', price: 24.99 },
  { id: 3, name: 'Doohickey', price: 4.99 },
];

const app = t.div([
  t.h1('useReducer'),
  t.p({ class: 'description' }, 'State transitions go through dispatch — call sites only send action objects.'),
  t.div({ class: 'layout' }, [
    t.div({ class: 'shop' }, [
      t.h2('Products'),
      t.ul(products.map(p =>
        t.li({ class: 'product' }, [
          t.span({ class: 'product-name' }, p.name),
          t.span({ class: 'product-price' }, `$${p.price.toFixed(2)}`),
          t.button({ type: 'button', onclick: () => dispatch({ type: 'add', item: p }) }, 'Add'),
        ]),
      )),
    ]),
    t.div({ class: 'cart' }, [
      t.h2('Cart'),
      t.ul(state.transform(s =>
        s.items.length === 0
          ? [t.li({ class: 'empty' }, 'Empty.')]
          : s.items.map(item =>
            t.li({ dataKey: item.id, class: 'cart-item' }, [
              t.span({ class: 'cart-item-name' }, item.name),
              t.span({ class: 'cart-item-qty' }, `×${item.qty}`),
              t.button({ type: 'button', onclick: () => dispatch({ type: 'remove', id: item.id }) }, '−'),
              t.button({ type: 'button', onclick: () => dispatch({ type: 'add', item }) }, '+'),
            ]),
          ),
      )),
      t.div({ class: 'cart-footer' }, [
        t.strong(state.transform(s => `Total: $${s.total.toFixed(2)}`)),
        t.button({ type: 'button', onclick: () => dispatch({ type: 'clear' }) }, 'Clear'),
      ]),
    ]),
  ]),
]);

document.body.append(app.toElement());
