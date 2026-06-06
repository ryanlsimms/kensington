import { t } from 'kensington';

import { apiTable } from '../../components/table.js';
import { code } from '../../components/ui.js';

export function apiConstructor() {
  return t.section({ id: 'constructor' }, [
    t.h2('Constructor'),
    code('typescript', `new Kensington(options?: {
  validationLevel?: 'off' | 'warn' | 'error';
  additionalNamespaces?: string | string[];
  additionalGlobalAttributes?: Record<string, unknown>;
  indentationLevel?: number;
  logger?: (message: string) => void;
})`),
    apiTable(['Option', 'Default', 'Description'], [
      [
        t.code('validationLevel'),
        t.code("'off'"),
        [
          'Attribute validation behavior. ',
          t.code("'off'"),
          ' disables validation entirely (required for the slim build). ',
          t.code("'warn'"),
          ' logs via ',
          t.code('logger'),
          '. ',
          t.code("'error'"),
          ' throws.',
        ],
      ],
      [
        t.code('additionalNamespaces'),
        '.',
        [
          'Allow extra attribute prefixes on all elements, e.g. ',
          t.code("'hx'"),
          ' for htmx ',
          t.code('hx-*'),
          ' attributes or ',
          t.code("'x'"),
          ' for Alpine.js.',
        ],
      ],
      [
        t.code('additionalGlobalAttributes'),
        '.',
        ['Allow specific extra attributes on all elements. Same validator format as ', t.code('createCustomTag'), '.'],
      ],
      [
        t.code('indentationLevel'),
        t.code('2'),
        [
          'Spaces per indentation level in ',
          t.code('.toString()'),
          ' output. Set to ',
          t.code('0'),
          ' to disable indentation.',
        ],
      ],
      [
        t.code('logger'),
        t.code('console.log'),
        ['Called with warning messages when ', t.code('validationLevel'), ' is ', t.code("'warn'"), '.'],
      ],
    ]),
  ]);
}
