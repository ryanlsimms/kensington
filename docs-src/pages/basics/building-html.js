import { t } from 'kensington';

import { code, exLink, panels } from '../../components/ui.js';

export function basicsBuildingHtml() {
  return t.section({ id: 'building-html' }, [
    t.h2('Building HTML'),

    t.h3({ id: 'elements-and-content' }, 'Elements & content'),
    t.p([
      'Every HTML, SVG, and MathML element is available as a method on ',
      t.code('t'),
      '. All call forms work:',
    ]),
    code('javascript', `t.div({ id: 'app' }, 'text');      // options + content
t.div({ id: 'app' });              // options only
t.div('text');                     // content only
t.div([t.p('a'), t.p('b')]);       // content array
t.div();                           // empty`),
    t.p('Void elements take only options (no content):'),
    code('javascript', `t.input({ type: 'checkbox', checked: true });
t.br();
t.meta({ charset: 'utf-8' });`),
    t.p('Content can be strings, numbers, tags, arrays, or any mix. Arrays are flattened:'),
    code('javascript', `t.p(['Count: ', 42, t.strong(' items')]).toString();
// <p>Count: 42<strong> items</strong></p>`),
    t.p([
      'Attributes accept camelCase keys (converted to kebab-case), class as an array, and style as a plain object. Boolean attributes are included when ',
      t.code('true'),
      ', omitted when ',
      t.code('false'),
      '.',
    ]),
    code('javascript', `t.div({ id: 'app', class: ['card', 'shadow'] });         // class as array
t.input({ type: 'checkbox', checked: true });            // boolean attribute
t.p({ style: { color: 'red' } }, 'Warning');             // style object
t.div({ dataBsToggle: 'collapse' });                     // camelCase → data-bs-toggle`),
    t.p([
      'For the full reference including nested objects, ',
      t.code('data-*'),
      ', ',
      t.code('aria-*'),
      ', event handlers, and DOM properties, see ',
      t.a({ href: '#options' }, 'Attributes & options'),
      ' in the Advanced section.',
    ]),

    t.h3({ id: 'lists' }, 'Rendering lists'),
    t.p([
      'Pass an array anywhere content is expected. Each element is rendered in sequence, so ',
      t.code('.map()'),
      ' is the natural way to render a list of items.',
    ]),
    panels([
      {
        label: 'JavaScript',
        content: code('javascript', `const items = ['Apples', 'Oranges', 'Pears'];

t.ul(items.map(item => t.li(item)));

// Nested: combine with objects
t.tbody(rows.map(row =>
  t.tr([t.td(row.name), t.td(row.role)])
));`),
      },
      {
        label: 'HTML output',
        content: code('html', `<ul>
  <li>Apples</li>
  <li>Oranges</li>
  <li>Pears</li>
</ul>`),
      },
    ]),
    t.p([
      exLink('?page=examples#todo-list', 'Todo list example'),
      ' ',
      exLink('?page=examples#form-from-schema', 'Form from schema example'),
    ]),

    t.h3({ id: 'conditionals' }, 'Conditionals'),
    t.p([
      'Falsy values (',
      t.code('null'),
      ', ',
      t.code('undefined'),
      ', ',
      t.code('false'),
      ', ',
      t.code("''"),
      ') are silently dropped from content. No conditional wrappers needed.',
    ]),
    code('javascript', `t.ul([
  t.li('always shown'),
  isLoggedIn && t.li(t.a({ href: '/logout' }, 'Log out')),
  show ? t.li('yes') : null,
]);`),
    t.p([
      'If ',
      t.code('isLoggedIn'),
      ' is false, the second ',
      t.code('li'),
      ' is simply absent from the output. The ',
      t.code('null'),
      ' in the third slot is dropped the same way.',
    ]),
    t.p(exLink('?page=examples#live-filter', 'Live filter example')),

    t.h3({ id: 'components' }, 'Components & reuse'),
    t.p([
      'Plain functions work as components. No framework, no lifecycle, no magic. ',
      'A component is just a function that takes arguments and returns a tag.',
    ]),
    panels([
      {
        label: 'JavaScript',
        content: code('javascript', `function card(heading, body) {
  return t.div({ class: 'card' }, [
    t.div({ class: 'card-header' }, heading),
    t.div({ class: 'card-body' }, body),
  ]);
}

t.div({ class: 'card-grid' }, [
  card('Alice', t.p('Role: Admin')),
  card('Bob',   t.p('Role: Editor')),
]);`),
      },
      {
        label: 'HTML output',
        content: code('html', `<div class="card-grid">
  <div class="card">
    <div class="card-header">Alice</div>
    <div class="card-body">
      <p>Role: Admin</p>
    </div>
  </div>
  <div class="card">
    <div class="card-header">Bob</div>
    <div class="card-body">
      <p>Role: Editor</p>
    </div>
  </div>
</div>`),
      },
    ]),
    t.p([
      'Because ',
      t.code('.toString()'),
      ' and ',
      t.code('.toElement()'),
      ' are just methods, the same component works in Node and in the browser with no changes.',
    ]),
    t.p([
      exLink('?page=examples#ssr', 'Server rendering example'),
      ' ',
      exLink('?page=examples#express-render-helper', 'Express render helper example'),
      ' ',
      exLink('?page=examples#framework-integration', 'Framework integration example'),
      ' ',
      exLink('?page=examples#elysia', 'Elysia example'),
    ]),
    t.p('Tag methods are bound to the instance, so you can destructure them and call them directly:'),
    code('javascript', `const { div, p, ul, li, span } = t;

div({ class: 'card' }, [
  p('Methods are bound, so destructuring works anywhere.'),
  ul([li('item one'), li('item two')]),
]);`),
  ]);
}
