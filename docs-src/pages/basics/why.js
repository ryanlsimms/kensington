import { renderForHydration, t } from 'kensington';

import { comparisonsModal } from './modals.js';

export function basicsWhy() {
  return t.section({ id: 'why' }, [
    t.h2('Why Kensington?'),
    t.p([
      t.a({
        class: 'subtle-link',
        target: '_blank',
        href: 'https://www.businessinsider.com/founders-fund-the-future-2011-7',
      }, 'We wanted flying cars'),
      ', instead we got 140 thousand hours of React tutorials. ',
      'We find ourselves spending more time trying to parse framework docs, ',
      'and less time actually writing code. ',
      'Kensington hopes to alleviate some of these ails by presenting a simpler alternative to the frameworks. ',
      'The basics can be learned in a few minutes, and the entire API can be learned in half an hour. ',
      'Kensington handles the structural work automatically, leaving a simple api for a dev to parse.',
    ]),
    t.p([
      'There are no magic attributes to memorize, and no new HTML templating language to learn. ',
      'It is plain JavaScript function and method calls. ',
      'If you can read the code, you can guess what it does, even before reading the docs.',
    ]),
    t.p([
      'Comprehensive typing, lint rules, IDE plugins, and server integrations help keep your code clean. ',
      'In case you let robots write your code, Kensington is very AI-friendly, ',
      'and produces code that is simple enough to be reviewable by a human.',
    ]),
    renderForHydration(comparisonsModal, {}),
  ]);
}
