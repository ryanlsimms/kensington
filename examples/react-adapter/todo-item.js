import { component, t } from './react-k.js';

function TodoItem(props) {
  return t.li({ class: ['todo', props.todo.done && 'done', `priority-${props.todo.priority}`] },
    t.label({ class: 'todo-label' },
      t.input({
        type: 'checkbox',
        checked: props.todo.done,
        onchange: () => props.onToggle(props.todo.id),
      }),
      t.span({ class: 'todo-text' }, props.todo.text),
      t.span({ class: 'badge', style: { 'margin-left': '8px' } }, props.todo.priority),
    ),
    t.button({
      type: 'button',
      class: 'remove-btn',
      onclick: () => props.onRemove(props.todo.id),
      aria: { label: `Remove ${props.todo.text}` },
    }, [ '×']),
  );
}

export default component(TodoItem);
