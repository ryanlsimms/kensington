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
          'Tag validation and Runtime Guard diagnostics for this instance. ',
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
    t.p([
      'Runtime Guard checks apply while this instance\'s tags render and when their reactive bindings update. Each child tag uses its own instance\'s setting. ',
      t.code("'off'"),
      ' disables these checks, ',
      t.code("'warn'"),
      ' reports through the instance logger, and ',
      t.code("'error'"),
      ' throws through normal reactive error handling. Standalone ',
      t.code('signal()'),
      ', ',
      t.code('computed()'),
      ', ',
      t.code('effect()'),
      ', and ',
      t.code('batch()'),
      ' calls do not inherit an instance setting. Slim builds omit the guard diagnostics. Mixing separate reactive runtimes remains unsupported even when checks are off.',
    ]),
  ]);
}
