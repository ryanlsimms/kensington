import { component, t } from './react-k.js';
import TodoItem from './todo-item.js';

function TodoList(props) {
  return t.main(
    t.ul({ class: 'todo-list' },
      props.todos.map(todo =>
        TodoItem({ key: todo.id, todo, onToggle: props.onToggle, onRemove: props.onRemove }),
      ),
    ),
  );
}

export default component(TodoList);
