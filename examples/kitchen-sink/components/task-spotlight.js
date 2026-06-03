import t, { signal } from '#kensington';

// This component is shared between server and client. On the server, renderForHydration
// calls it in SSR mode: signals resolve to their initial values and no effects run.
// On the client, registerComponents calls it again with the same props and the returned
// element replaces the SSR placeholder, wiring up all signal reactivity.
export function taskSpotlight({ task }) {
  // Local signal — exists only for the duration of this component instance.
  // The star state is client-only and intentionally not persisted.
  const starred = signal(false);

  return t.div({ class: 'spotlight-card' }, [
    t.div({ class: 'spotlight-header' }, [
      t.span({
        class: task.done ? 'spotlight-text done' : 'spotlight-text',
        // Individual style properties accept signals. Only textDecoration is reactive
        // here — fontSize is static. When starred changes, only text-decoration is
        // updated in the DOM; fontSize is untouched.
        style: {
          textDecoration: starred.transform(v => v ? 'line-through' : 'none'),
          fontSize: '1rem',
        },
      }, [ task.text]),
      t.button({
        type: 'button',
        class: 'star-btn',
        aria: { label: 'Toggle star' },
        onclick: () => starred.set(v => !v),
        // Signal as content: the text node is replaced in place on each toggle.
      }, [ starred.transform(v => v ? '★' : '☆')]),
    ]),
    t.span({ class: task.done ? 'spotlight-badge done' : 'spotlight-badge' }, task.done ? 'Done' : 'Active'),
  ]);
}
