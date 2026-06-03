import { t } from 'kensington';

import { code, headerGithubLink, ideMock } from '../../components/ui.js';

export function basicsHeader() {
  const npmHref = 'https://www.npmjs.com/package/kensington';
  const npmImg = 'https://img.shields.io/npm/v/kensington';
  const ciHref = 'https://github.com/ryanlsimms/kensington/actions/workflows/ci.yml';
  const ciImg = 'https://github.com/ryanlsimms/kensington/actions/workflows/ci.yml/badge.svg';
  const licHref = 'https://opensource.org/licenses/ISC';
  const licImg = 'https://img.shields.io/badge/License-ISC-blue.svg';
  return t.header([
    headerGithubLink(),
    t.h1('Kensington'),
    t.div({ class: 'badges' }, [
      t.a({ href: npmHref }, t.img({ src: npmImg, alt: 'npm' })),
      t.a({ href: ciHref }, t.img({ src: ciImg, alt: 'CI' })),
      t.a({ href: licHref }, t.img({ src: licImg, alt: 'License: ISC' })),
    ]),
    t.p([
      'HTML/SVG/MathML template library for JavaScript and TypeScript. ',
      'Tags, attribute names/values, inline style property names, and some nested tags are ',
      'comprehensively typed against the official specs. ',
      'Components are plain functions with no JSX, no compiler, and very little to learn.',
    ]),
    t.p('Reactive data via built-in signals.'),
    t.ul({ class: 'feature-list' }, [
      t.li('Outputs HTML strings or live DOM nodes from the same code'),
      t.li('Comprehensive TypeScript definitions'),
      t.li('No build step required. Works in Node, Deno, and the browser'),
      t.li('Easy for AI to implement with an extensive AGENTS.md file'),
    ]),
    code('bash', 'npm install kensington'),
    ideMock({
      filename: 'index.ts',
      lines: [
        `<span>t</span><span>.</span><span class="ide-t-fn">input</span><span>({</span> <span class="ide-t-prop">type</span><span>:</span> <span class="ide-squiggly"><span class="ide-t-str">'chekbox'</span></span> <span>})</span>`,
      ],
      popup: {
        type: 'error',
        code: 'TS2322',
        message: `Type <span class="ide-t-str">'chekbox'</span> is not assignable to type`,
        typeContent: `<span class="ide-ts-str">"button"</span> | <span class="ide-ts-str">"checkbox"</span> | <span class="ide-ts-str">"color"</span> | <span class="ide-ts-str">"date"</span> | <span class="ide-ts-str">"datetime-local"</span><br>| <span class="ide-ts-str">"email"</span> | <span class="ide-ts-str">"file"</span> | <span class="ide-ts-str">"hidden"</span> | <span class="ide-ts-str">"image"</span> | <span class="ide-ts-muted">12 more...</span>`,
      },
    }),
  ]);
}
