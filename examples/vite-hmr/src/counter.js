import { signal, t } from 'kensington';

// Try editing while the page is running:
//   1. Change the label below ("clicked") to something else and save.
//      The click count stays. It lives in a keyed signal (`'n'`).
//   2. Type into the text box, then change `placeholder` or add a sibling
//      element. Your text, focus, and cursor position all survive.
//   3. Add a new element (e.g. `t.p('hello')`) into the array. The new
//      element appears without a page reload.

export default function counter({ start }) {
  const n = signal(start, 'n');
  return t.div({ style: {
    display: 'grid',
    gap: '0.5rem',
    maxWidth: '20rem',
    border: '4px solid red',
    borderRadius: '10px',
    padding: '1em',
  } }, [
    t.button({
      type: 'button',
      style: { padding: '0.5em' },
      onclick: () => n.set(v => v + 1),
    }, [
      n.transform(v => `clicked ${v} times`),
    ]),
    t.input({
      type: 'text',
      placeholder: 'type here, then edit this file',
      style: { padding: '0.5em' },
    }),
  ]);
}
