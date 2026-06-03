import { t } from 'kensington';

import { ideMock } from '../../components/ui.js';

export function basicsTypescript() {
  return t.section({ id: 'typescript' }, [
    t.h2('TypeScript'),
    ideMock({
      filename: 'index.ts',
      lines: [
        `<span>t</span><span>.</span><span class="ide-t-fn">input</span><span>({</span> <span class="ide-t-prop">formenctype</span><span>:</span> <span class="ide-squiggly"><span class="ide-t-str">'text'</span></span> <span>})</span>`,
      ],
      popup: {
        type: 'error',
        code: 'TS2322',
        message: `Type <span class="ide-t-str">'text'</span> is not assignable to type`,
        typeContent: `<span class="ide-ts-str">"application/x-www-form-urlencoded"</span> | <span class="ide-ts-str">"multipart/form-data"</span><br>| <span class="ide-ts-str">"text/plain"</span>`,
      },
    }),

    t.h3({ id: 'ts-attribute-types' }, 'Attribute types'),
    t.p([
      'Types are generated directly from the HTML, SVG, and MathML living standards. Attribute names are checked, attribute values are typed as enums, booleans, or numbers as appropriate, and the ',
      t.code('style'),
      ' object is typed with ',
      t.a({ href: 'https://www.npmjs.com/package/csstype' }, 'csstype'),
      '. You get a compile-time error when a value is wrong.',
    ]),

    t.h3({ id: 'ts-content-model' }, 'Content model'),
    t.p([
      'Strict containers enforce which children are valid at compile time. Passing a ',
      t.code('div'),
      ' to ',
      t.code('t.tr()'),
      ' is a type error. Branded return types (',
      t.code('TdTag'),
      ', ',
      t.code('LiTag'),
      ', ',
      t.code('ImgTag'),
      ', etc.) extend ',
      t.code('ContentTag'),
      ', so existing code that types values as ',
      t.code('ContentTag'),
      ' still works.',
    ]),
    ideMock({
      filename: 'index.ts',
      lines: [
        `<span>t</span><span>.</span><span class="ide-t-fn">tr</span><span>(</span><span>t</span><span>.</span><span class="ide-t-fn">td</span><span>(</span><span class="ide-t-str">'Name'</span><span>))</span>`,
        `<span>t</span><span>.</span><span class="ide-t-fn">tr</span><span>(</span><span class="ide-squiggly"><span>t</span><span>.</span><span class="ide-t-fn">div</span><span>(</span><span class="ide-t-str">'Name'</span><span>)</span></span><span>)</span>`,
      ],
      popup: {
        type: 'error',
        code: 'TS2345',
        message: 'Argument of type <span class="ide-ts-type">DivTag</span> is not assignable to parameter of type',
        typeContent: '<span class="ide-ts-type">TdTag</span> | <span class="ide-ts-type">ThTag</span>',
      },
    }),
    t.p([
      'TypeScript types are also generated for custom elements and module augmentation. See ',
      t.a({ href: '#custom-elements' }, 'Custom elements'),
      ' in the Advanced section.',
    ]),
  ]);
}
