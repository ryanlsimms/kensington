import { t } from 'kensington';

import { useId } from './use-id.js';

function labeledInput(label, type = 'text', hint = '') {
  const id = useId(); // unique stable ID — label and input are always paired correctly
  return t.div({ class: 'field' }, [
    t.label({ for: id }, label),
    t.input({ id, type, placeholder: hint }),
  ]);
}

const app = t.div([
  t.h1('useId'),
  t.p({ class: 'description' }, [
    'Each field gets a unique ID so its label and input are correctly paired.',
    ' IDs never collide even if you render the same component multiple times.',
  ]),
  t.form({ onsubmit: 'return false' }, [
    labeledInput('Full name', 'text', 'Jane Smith'),
    labeledInput('Email', 'email', 'jane@example.com'),
    labeledInput('Password', 'password', ''),
    t.button({ type: 'submit' }, 'Sign up'),
  ]),
  t.hr(),
  t.p({ class: 'description' }, 'A second instance of the same form — IDs are distinct from the first.'),
  t.form({ onsubmit: 'return false' }, [
    labeledInput('Full name', 'text', 'John Smith'),
    labeledInput('Email', 'email', 'john@example.com'),
    labeledInput('Password', 'password', ''),
    t.button({ type: 'submit' }, 'Sign up'),
  ]),
]);

document.body.append(app.toElement());
