import { githubLink, headerGithubLink } from '../../components/ui.js';
import { apiConstructor } from './constructor.js';
import { apiTagMethods } from './tag-methods.js';
import { apiSpecialMethods } from './special-methods.js';
import { apiSignals } from './signals.js';
import { apiExportsAndTypes } from './exports-and-types.js';

export function apiSidebar(t) {
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
        t.a({ href: '#signals' }, 'Signals'),
        t.ul([
          t.li(t.a({ href: '#signal' }, 'signal()')),
          t.li(t.a({ href: '#computed' }, 'computed()')),
          t.li(t.a({ href: '#effect' }, 'effect()')),
          t.li(t.a({ href: '#prop-key' }, 'prop key')),
          t.li(t.a({ href: '#render-for-hydration' }, 'renderForHydration()')),
          t.li(t.a({ href: '#register-components' }, 'registerComponents()')),
        ]),
      ]),
      t.li(t.a({ href: '#exports' }, 'Exports')),
      t.li(t.a({ href: '#types' }, 'TypeScript types')),
    ]),
    githubLink(t),
  ];
}

export function apiContent(t) {
  return [
    t.header([
      headerGithubLink(t),
      t.h1('Kensington API'),
      t.p([
        'Method signatures, types, and exports. See the ',
        t.a({ href: '?page=basics' }, 'guide'),
        ' for usage examples.',
      ]),
    ]),
    apiConstructor(t),
    apiTagMethods(t),
    apiSpecialMethods(t),
    apiSignals(t),
    ...apiExportsAndTypes(t),
    t.p({ style: 'margin-top: 3rem; font-size: 0.83rem; color: var(--color-muted)' }, [
      'Want to understand how everything works under the hood? See the ',
      t.a({ href: '?page=architecture' }, 'architecture guide'),
      '.',
    ]),
  ];
}
