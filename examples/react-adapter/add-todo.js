import { component, t } from './react-k.js';

function AddTodo(props) {
  return t.footer({ class: 'app-footer' },
    t.input({
      type: 'text',
      class: 'new-todo-input',
      placeholder: 'What needs doing?',
      value: props.draft,
      onchange: e => props.onDraftChange(e.target.value),
      onkeydown: e => { if (e.key === 'Enter') { props.onAdd(); } },
    }),
    t.select({
      class: 'priority-select',
      value: props.priority,
      onchange: e => props.onPriorityChange(e.target.value),
    },
    t.option({ value: 'low' }, 'Low'),
    t.option({ value: 'medium' }, 'Medium'),
    t.option({ value: 'high' }, 'High'),
    ),
    t.button({
      type: 'button',
      class: 'add-btn',
      onclick: props.onAdd,
      disabled: !props.draft.trim(),
    }, 'Add'),
  );
}

export default component(AddTodo);
