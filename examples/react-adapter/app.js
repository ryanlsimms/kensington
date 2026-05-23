import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import AddTodo from './add-todo.js';
import { component, t } from './react-k.js';
import TodoList from './todo-list.js';

let nextId = 3;

function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Read the docs', done: false, priority: 'low' },
    { id: 2, text: 'Write some code', done: true, priority: 'high' },
  ]);
  const [draft, setDraft] = useState('');
  const [priority, setPriority] = useState('low');

  function add() {
    const text = draft.trim();
    if (!text) { return; }
    setTodos(prev => [...prev, { id: nextId++, text, done: false, priority }]);
    setDraft('');
  }

  function toggle(id) {
    setTodos(prev => prev.map(todo => todo.id === id ? { ...todo, done: !todo.done } : todo));
  }

  function remove(id) {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }

  const remaining = todos.filter(todo => !todo.done).length;

  return t.div({ class: 'app' },
    t.header({ class: 'app-header' },
      t.h1('Todos'),
      t.p({ class: 'count' }, `${remaining} of ${todos.length} remaining`),
    ),
    TodoList({ todos, onToggle: toggle, onRemove: remove }),
    AddTodo({ draft, priority, onDraftChange: setDraft, onPriorityChange: setPriority, onAdd: add }),
  );
}

createRoot(document.getElementById('root')).render(component(App)());
