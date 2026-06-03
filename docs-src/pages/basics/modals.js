import { effect, signal, t } from 'kensington';

import { code, panels } from '../../components/ui.js';

export function comparisonsModal() {
  const open = signal(false);

  const dialog = t.dialog({
    class: 'modal',
    ariaLabel: 'Why Kensington comparisons',
    onclick: e => {
      if (e.target === e.currentTarget) {
        open.set(false);
      }
    },
    onclose: () => open.set(false),
  }, [
    t.div({ class: 'modal-box' }, [
      t.button({
        class: 'modal-close',
        ariaLabel: 'Close',
        onclick: () => open.set(false),
      }, '×'),
      t.h3('Why Kensington?'),
      t.h4('vs tagged template literals'),
      t.p([
        'Tagged template literal libraries like ',
        t.a({ href: 'https://github.com/developit/htm' }, 'htm'),
        ' are lightweight and familiar, but TypeScript can only see the outer string, so it cannot validate attribute names or values inside the template. Because markup is structured data, Kensington also handles camelCase-to-kebab conversion, boolean attributes, and ',
        t.code('class'),
        ' as an array — things template-based libraries need runtime string parsing to support.',
      ]),
      panels([
        {
          label: 'htm (tagged template)',
          content: code('javascript', `// TypeScript sees a plain string. No attribute checking inside.
const html = htm\`<input typ="checkbox">\`;
//                       ^^^ typo, no error raised`),
        },
        {
          label: 'Kensington',
          content: code('typescript', `// t.input knows the InputAttributes interface
t.input({ typ: 'checkbox' });
// TypeScript: 'typ' does not exist on InputAttributes`),
        },
      ]),
      t.h4('vs JSX'),
      t.p([
        'JSX offers similar structure but requires a compiler and a framework pragma. ',
        'Kensington works anywhere JavaScript runs, such as Node.js, Deno, Bun, and the browser, ',
        'with no configuration.',
      ]),
      t.h4('vs React / Vue / Angular / SolidJS'),
      t.p([
        'Full front-end frameworks are designed around a component lifecycle, ',
        'a virtual DOM or fine-grained reactivity graph, a router, and a build pipeline.',
      ]),
      t.p([
        'Kensington is useful when that scope is more than you need. ',
        'It generates HTML strings on the server with no runtime dependency, ',
        'produces live DOM nodes in the browser with no virtual DOM overhead, ',
        'and works inside Web Components or vanilla JS projects without committing to a framework. ',
        'The 2.0 signals build adds fine-grained reactivity for the cases where you do need live updates, ',
        'without pulling in the bathwater with the baby.',
      ]),
      t.h4('vs DOM methods'),
      t.p([
        t.code('document.createElement'),
        ' is verbose and browser-only. Kensington\'s ',
        t.code('.toElement()'),
        ' produces live DOM nodes, so the same component can render an HTML string on the server and a live DOM node in the browser from the same code.',
      ]),
      t.h4('vs hyperscript / h'),
      t.p([
        'Hyperscript-style APIs like ',
        t.code("h('div', attrs, children)"),
        ' (used in React, Vue render functions, and standalone hyperscript libraries) take the element name as a string, so TypeScript can only type the attribute argument as a generic object. Kensington exposes a dedicated method for each element, so TypeScript knows exactly which attributes are valid for ',
        t.code('t.input'),
        ' versus ',
        t.code('t.select'),
        ' versus ',
        t.code('t.a'),
        '.',
      ]),
      panels([
        {
          label: 'Hyperscript',
          content: code('javascript', `// attrs typed as Record<string, any>, no element-specific checking
h('input', { typ: 'checkbox' });
//            ^^^ typo, no error raised`),
        },
        {
          label: 'Kensington',
          content: code('typescript', `// t.input knows the InputAttributes interface
t.input({ typ: 'checkbox' });
// TypeScript: 'typ' does not exist on InputAttributes`),
        },
      ]),
      t.h4('vs Handlebars / EJS / Nunjucks'),
      t.p([
        'String-based server-side renderers use a separate syntax in ',
        t.code('.hbs'),
        ', ',
        t.code('.ejs'),
        ', or ',
        t.code('.njk'),
        ' files. That syntax lives outside TypeScript\'s type system, so attribute names, values, and variable references are all unchecked. Kensington is plain JavaScript, so you get the full language for loops and conditionals, your editor\'s autocomplete for attributes, and TypeScript errors when something is wrong.',
      ]),
    ]),
  ]);

  dialog.addConnectedCallback(el => {
    effect(() => {
      if (open.get()) {
        if (!el.open) {
          el.showModal();
        }
      } else if (el.open) {
        el.close();
      }
    });
  });

  return [
    t.button({
      class: 'compare-btn',
      onclick: () => open.set(true),
    }, [
      'How it compares to other libraries ',
      t.span({ ariaHidden: 'true' }, '→'),
    ]),
    dialog,
  ];
}
