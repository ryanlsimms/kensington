import { t } from 'kensington';

import { apiTable } from '../../components/table.js';
import { code, exLink, ideMock } from '../../components/ui.js';

export function basicsAdvanced() {
  return [
    t.header([
      t.h1('Advanced Usage'),
      t.p([
        'The above usage may be enough for many projects, ',
        'but if you are building a more complex app, you may need these tools.',
      ]),
    ]),

    t.section({ id: 'options' }, [
      t.h2('Attributes & options'),
      t.table({ class: 'option-table' }, [
        t.tbody([
          t.tr([
            t.td('camelCase keys'),
            t.td([
              t.code("{ dataBsToggle: 'collapse' }"),
              ' → ',
              t.code('data-bs-toggle="collapse"'),
              '. SVG attributes like ',
              t.code('viewBox'),
              ' and ',
              t.code('gradientUnits'),
              ' pass through unchanged.',
            ]),
          ]),
          t.tr([
            t.td('Nested objects'),
            t.td([
              t.code("{ data: { bs: { toggle: 'collapse' } } }"),
              ' → ',
              t.code('data-bs-toggle="collapse"'),
            ]),
          ]),
          t.tr([
            t.td('Boolean attributes'),
            t.td([
              t.code('{ checked: true }'),
              ' → ',
              t.code('checked'),
              '. ',
              t.code('{ checked: false }'),
              ' → attribute omitted.',
            ]),
          ]),
          t.tr([
            t.td('class as array'),
            t.td([t.code("{ class: ['foo', 'bar'] }"), ' → ', t.code('class="foo bar"')]),
          ]),
          t.tr([
            t.td('data-* and aria-*'),
            t.td([
              'Always allowed on every element, along with all ',
              t.a({ href: 'https://html.spec.whatwg.org/multipage/dom.html#global-attributes' }, [
                'global HTML attributes',
              ]),
              '.',
            ]),
          ]),
          t.tr([t.td('style as object'), t.td([
            t.p([
              t.code("{ style: { backgroundColor: 'red', zIndex: 2 } }"),
              ' → ',
              t.code('style="background-color: red; z-index: 2"'),
            ]),
            t.p([
              'camelCase keys always convert to kebab-case. ',
              'CSS property names are always kebab-case (including for SVG); ',
              'camelCase is only the JavaScript DOM convention for ',
              t.code('element.style'),
              '. ',
              t.code('null'),
              ', ',
              t.code('undefined'),
              ', and ',
              t.code('false'),
              ' values are silently omitted. In TypeScript, the style object is typed with ',
              t.a({ href: 'https://www.npmjs.com/package/csstype' }, 'csstype'),
              ' for autocomplete on property names and values.',
            ]),
          ])]),
          t.tr([
            t.td('on key'),
            t.td([
              t.code('{ on: { myCustomEvent: handler } }'),
              ' wires listeners via ',
              t.code('addEventListener'),
              '. Event names are passed verbatim. ',
              'Use this for custom or camelCase event names that ',
              t.code('on*'),
              ' attributes cannot express. Silently ignored in ',
              t.code('.toString()'),
              '.',
            ]),
          ]),
          t.tr([
            t.td('prop key'),
            t.td([
              t.code("{ prop: { value: 'hello' } }"),
              ' assigns directly to DOM properties (',
              t.code('el.value = ...'),
              ') instead of ',
              t.code('setAttribute'),
              '. Silently ignored in ',
              t.code('.toString()'),
              '.',
            ]),
          ]),
        ]),
      ]),

    ]),

    t.section({ id: 'dev-vs-prod' }, [
      t.h2('Dev vs production'),
      t.p([
        'Two settings are worth flipping between local development and production. ',
        'Use them together to catch attribute typos and bad values during development ',
        'while shipping a small bundle to users.',
      ]),

      t.h3({ id: 'dev-validation' }, 'Validation in development'),
      t.p([
        'By default, ',
        t.code('validationLevel'),
        ' is ',
        t.code("'off'"),
        '. In development, set it to ',
        t.code("'warn'"),
        ' or ',
        t.code("'error'"),
        ' so invalid attribute names and values are reported at runtime instead of silently rendering. TypeScript catches most issues at compile time. This catches the rest (dynamic attribute names, JS callers, and any code path TypeScript can\'t reach).',
      ]),
      code('javascript', `import Kensington from 'kensington';

const t = new Kensington({ validationLevel: 'error' });

t.input({ type: 'checkbox' });   // fine
t.input({ type: 'notatype' });   // throws. Not an allowed value
t.div({ unknownAttr: 'x' });     // throws. Not a known attribute`),
      t.p([
        'See ',
        t.a({ href: '#validation' }, 'Validation'),
        ' below for the full options and behavior.',
      ]),

      t.h3({ id: 'prod-slim' }, 'Slim build for production'),
      t.p([
        'The slim build is a separate bundle that ships without per-element attribute spec data. The minified output drops from ~148 KB to ~27 KB, about 5× smaller. The public API is identical. Tags, attributes, signals, and hydration all work the same.',
      ]),
      t.p([
        'Since the slim build has no spec data, runtime validation is unavailable. The constructor throws if you set ',
        t.code('validationLevel'),
        ' to anything other than ',
        t.code("'off'"),
        '.',
      ]),
      code('javascript', `import Kensington from 'kensington/dist/slim';

const t = new Kensington();   // validationLevel defaults to 'off'
t.div({ class: 'card' }, t.p('Hello'));`),

      t.h3({ id: 'vite' }, 'Wiring it up with Vite'),
      t.p([
        'Use a Vite alias to swap the import target by build mode. Your application code stays as ',
        t.code("import Kensington from 'kensington'"),
        ' everywhere. Vite resolves to the full build in dev and the slim build in production.',
      ]),
      code('javascript', `// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const alias = mode === 'production' ? { kensington: 'kensington/dist/slim' } : {};
  return { resolve: { alias } };
});`),
      t.p(`Pick the validation level from Vite's build environment so dev gets runtime checks and prod gets the no-op fast path.`),
      code('javascript', `// src/t.js
import Kensington from 'kensington';

export const t = new Kensington({
  validationLevel: import.meta.env.DEV ? 'error' : 'off',
});`),
      t.p([
        'Use ',
        t.code('t'),
        ' everywhere in your app. ',
        t.code('npm run dev'),
        ' loads the full build with errors on bad attributes. ',
        t.code('npm run build'),
        ' produces a bundle backed by the slim runtime.',
      ]),
      t.p([
        'The same pattern works with other bundlers. See ',
        t.a({ href: '?page=examples#rollup' }, 'Rollup'),
        ', ',
        t.a({ href: '?page=examples#esbuild' }, 'esbuild'),
        ', and ',
        t.a({ href: '?page=examples#webpack' }, 'Webpack'),
        ' in the examples page for equivalent setups.',
      ]),

    ]),

    t.section({ id: 'constructor' }, [
      t.h2('Constructor options'),
      code('javascript', `import Kensington from 'kensington';

const t = new Kensington({
  validationLevel: 'warn',        // 'off' | 'warn' | 'error', default 'off'
  additionalNamespaces: ['hx'],   // allow hx-* (htmx), x-* (alpine), etc.
  additionalGlobalAttributes: {   // allow specific attributes on every element
    popover: ['auto', 'manual'],  // string enum
    nonce: String,                // any string value
    inert: Boolean,               // boolean attribute
  },
  indentationLevel: 2,            // spaces per indent, default 2, 0 to disable
  logger: msg => myLogger(msg),   // receives validation warnings, default console.log
});`),
      t.aside([
        t.p([
          'For standalone ',
          t.code('.svg'),
          ' files or XML contexts that need ',
          t.code('xmlns:xlink'),
          ' or other XML namespace declarations, pass ',
          t.code("'xmlns'"),
          ' as an additional namespace. The root ',
          t.code('svg'),
          ' element already accepts ',
          t.code('xmlns'),
          ' itself without any extra configuration.',
        ]),
        code('javascript', `const t = new Kensington({ additionalNamespaces: 'xmlns' });
t.svg({ xmlns: 'http://www.w3.org/2000/svg', 'xmlns:xlink': 'http://www.w3.org/1999/xlink' });`),
      ]),

    ]),

    t.section({ id: 'validation' }, [
      t.h2('Validation'),
      apiTable(['Level', 'Behavior'], [
        [t.code("'off'"), ['No validation. Best for production. ', t.strong('Default.')]],
        [t.code("'warn'"), ['Logs via ', t.code('logger'), ' (default ', t.code('console.log'), '). Does not throw.']],
        [t.code("'error'"), ['Throws an ', t.code('Error'), '. Useful for CI or strict development environments.']],
      ]),
      t.ul([
        t.li([
          t.strong('Attribute names:'),
          ' checked against the HTML/SVG/MathML spec. ',
          t.code('data-*'),
          ', ',
          t.code('aria-*'),
          ', ',
          t.code('additionalNamespaces'),
          ', and ',
          t.code('additionalGlobalAttributes'),
          ' are always allowed.',
        ]),
        t.li([
          t.strong('Attribute values:'),
          ' checked against allowed types/literals (e.g. ',
          t.code('type'),
          ' on ',
          t.code('input'),
          ' only accepts known values; ',
          t.code('id'),
          ' must not start with a digit).',
        ]),
        t.li([
          t.strong('Style object values:'),
          ' non-string/number values (other than ',
          t.code('undefined'),
          ') are flagged.',
        ]),
      ]),
      code('javascript', `const t = new Kensington({ validationLevel: 'error' });

t.div({ class: 'ok' });         // fine
t.div({ unknownAttr: 'x' });    // throws: not a known attribute
t.input({ type: 'checkbox' });  // fine
t.input({ type: 'notatype' });  // throws: not an allowed value`),

    ]),

    t.section({ id: 'custom-elements' }, [
      t.h2('Custom elements'),
      code('javascript', `import Kensington from 'kensington';

class MyEngine extends Kensington {
  myCard = this.createCustomTag('my-card', {
    cardType: ['primary', 'secondary'],            // allowed string literals
    loading: Boolean,                              // boolean attribute
    maxItems: Number,                              // numeric attribute
    score: v => typeof v === 'number' && v <= 100, // custom validator function
  });
}

const t = new MyEngine();
t.myCard({ cardType: 'primary' }, t.p('content')).toString();
// → <my-card card-type="primary">
//     <p>content</p>
//   </my-card>`),
      t.p([
        'To extend a built-in element with extra attributes, import its attribute object from ',
        t.code('kensington/attributes'),
        ' and spread it into ',
        t.code('createCustomTag'),
        ':',
      ]),
      code('javascript', `import Kensington from 'kensington';
import { buttonAttributes } from 'kensington/attributes';

class MyEngine extends Kensington {
  button = this.createCustomTag('button', {
    ...buttonAttributes,
    popovertarget: String,  // add an attribute not yet in the spec data
  });
}

const t = new MyEngine({ validationLevel: 'error' });
t.button({ type: 'button', popovertarget: 'my-popover' }, 'Open').toString();`),
      t.p([
        'Every element in the spec has a corresponding named export (',
        t.code('divAttributes'),
        ', ',
        t.code('inputAttributes'),
        ', …) available from ',
        t.code('kensington/attributes'),
        '.',
      ]),
      t.p([
        'Use ',
        t.code('ContentMethod<T>'),
        ' to type a custom element method, and module augmentation to allow custom attribute namespaces without a subclass:',
      ]),
      code('typescript', `import Kensington, { type ContentMethod } from 'kensington';

class MyEngine extends Kensington {
  myCard: ContentMethod<{ cardType?: 'primary' | 'secondary'; loading?: boolean }> =
    this.createCustomTag('my-card', { cardType: ['primary', 'secondary'], loading: Boolean });
}

declare module 'kensington' {
  interface NameSpaceAttributes {
    [key: \`hx\${string}\`]: string | object;
  }
}

t.div({ hxBoost: 'true' });  // now valid`),
      ideMock({
        filename: 'index.ts',
        lines: [
          `<span>t</span><span>.</span><span class="ide-t-fn">myCard</span><span>({ </span><span class="ide-t-prop">cardType</span><span>: </span><span class="ide-t-str">'primary'</span><span>, </span><span class="ide-t-prop">loading</span><span>: </span><span class="ide-t-str">false</span><span> }, </span><span class="ide-t-str">'content'</span><span>)</span>`,
          `<span>t</span><span>.</span><span class="ide-t-fn">myCard</span><span>({ </span><span class="ide-t-prop">cardType</span><span>: </span><span class="ide-squiggly"><span class="ide-t-str">'featured'</span></span><span> }, </span><span class="ide-t-str">'content'</span><span>)</span>`,
        ],
        popup: {
          type: 'error',
          code: 'TS2322',
          message: `Type <span class="ide-t-str">'featured'</span> is not assignable to type`,
          typeContent: '<span class="ide-ts-str">"primary"</span> | <span class="ide-ts-str">"secondary"</span>',
        },
      }),
      t.p([
        exLink('?page=examples#htmx', 'htmx integration example'),
        ' ',
        exLink('?page=examples#tailwind', 'Tailwind example'),
        ' ',
        exLink('?page=examples#alpine', 'Alpine.js example'),
      ]),

    ]),

    t.section({ id: 'persist' }, [
      t.h2('Persist effects'),
      t.p([
        'By default, ',
        t.code('.toElement()'),
        ' stops signal effects permanently when an element is removed from the DOM. For elements that will be moved or temporarily removed and re-inserted, add ',
        t.code('persist: true'),
        ' to the tag options. Effects are paused on removal and resume automatically on re-insertion, across any number of cycles.',
      ]),
      code('javascript', `// Without persist: true, removing the item during a drag-reorder permanently stops
// its signal effects (class, checked, etc.).
// With persist: true, effects pause on removal and resume when the node is re-inserted.
const item = t.li({ class: statusClass, persist: true }, [
  t.input({ type: 'checkbox', checked: task.done }),
  t.span(task.text),
]);`),
      t.p([
        t.code('persist: true'),
        ' is silently ignored in ',
        t.code('.toString()'),
        ' and has no effect on server-side rendering. It only changes behavior when an element created by ',
        t.code('.toElement()'),
        ' is removed and re-inserted into the DOM.',
      ]),

    ]),

    t.section({ id: 'raw-html' }, [
      t.h2('Raw HTML & comments'),
      code('javascript', `t.literal('<li>verbatim, HTML-encoded</li>');    // <script> tags flagged via validationLevel
t.unsafeLiteral('<li>trusted HTML, no encoding</li>');

t.inlineComment('hello world');          // <!-- hello world -->
t.inlineComment('line 1\\nline 2');       // <!--\\n  line 1\\n  line 2\\n-->`),
      t.p(exLink('?page=examples#preformatted', 'Preformatted text example')),
    ]),

    t.section({ id: 'more-examples' }, [
      t.p([
        'Complete examples covering SSR, htmx, forms, icon reuse, and reactive patterns are on the ',
        t.a({ href: '?page=examples' }, 'Examples page'),
        '.',
      ]),
    ]),
  ];
}
