import { t } from 'kensington';

import { githubLink, headerGithubLink } from '../../components/ui.js';
import { apiConstructor } from './constructor.js';
import { apiExportsAndTypes } from './exports-and-types.js';
import { apiSignals } from './signals.js';
import { apiSpecialMethods } from './special-methods.js';
import { apiTagMethods } from './tag-methods.js';

export function apiSidebar() {
  return [
    t.ul([
      t.li(t.a({ href: '#constructor' }, 'Constructor')),
      t.li([
        t.a({ href: '#tag-methods' }, 'Tag methods'),
        t.ul([
          t.li(t.a({ href: '#content-elements' }, 'Content elements')),
          t.li(t.a({ href: '#void-elements' }, 'Void elements')),
          t.li(t.a({ href: '#instance-methods' }, 'Instance methods')),
        ]),
      ]),
      t.li([
        t.a({ href: '#special-methods' }, 'Special methods'),
        t.ul([
          t.li(t.a({ href: '#htmlwithdoctype' }, 'htmlWithDocType')),
          t.li(t.a({ href: '#literal' }, 'literal / unsafeLiteral')),
          t.li(t.a({ href: '#inline-comment' }, 'inlineComment')),
          t.li(t.a({ href: '#create-custom-tag' }, 'createCustomTag')),
        ]),
      ]),
      t.li([
        t.a({ href: '#api-signals' }, 'Signals'),
        t.ul([
          t.li(t.a({ href: '#api-signal' }, 'signal()')),
          t.li(t.a({ href: '#api-computed' }, 'computed()')),
          t.li(t.a({ href: '#api-keyed-forms' }, 'Keyed forms')),
          t.li(t.a({ href: '#api-effect' }, 'effect()')),
          t.li(t.a({ href: '#prop-key' }, 'prop key')),
          t.li(t.a({ href: '#render-for-hydration' }, 'renderForHydration()')),
          t.li(t.a({ href: '#register-components' }, 'registerComponents()')),
        ]),
      ]),
      t.li(t.a({ href: '#exports' }, 'Exports')),
      t.li(t.a({ href: '#types' }, 'TypeScript types')),
    ]),
    githubLink(),
  ];
}

export function apiContent() {
  return [
    t.header([
      headerGithubLink(),
      t.h1('Kensington API'),
      t.p([
        'Method signatures, types, and exports. See the ',
        t.a({ href: '?page=basics' }, 'guide'),
        ' for usage examples.',
      ]),
    ]),
    apiConstructor(),
    apiTagMethods(),
    apiSpecialMethods(),
    apiSignals(),
    ...apiExportsAndTypes(),
    t.section([
      t.p({ style: { marginTop: '3rem', fontSize: '0.83rem', color: 'var(--color-muted)' } }, [
        'Want to understand how everything works under the hood? See the ',
        t.a({ href: '?page=architecture' }, 'architecture guide'),
        '.',
      ]),
    ]),
  ];
}
