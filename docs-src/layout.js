import { renderForHydration, t } from 'kensington';

import { pageTabs } from './components/page-tabs.js';
import { searchDocs } from './components/search.js';
import { closeMenuIcon, menuIcon } from './components/ui.js';

const initScript = `(function(){var p=new URLSearchParams(location.search).get('page');if(p)document.documentElement.setAttribute('data-page',p);})()`;

export function layout(pages) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.title('Kensington'),
      t.link({ rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-tomorrow.min.css' }),
      t.link({ rel: 'stylesheet', href: '/assets/styles.css' }),
    ]),
    t.body([
      t.input({ type: 'checkbox', id: 'menu-toggle', hidden: true }),
      t.label({ id: 'menu-backdrop', for: 'menu-toggle', ariaHidden: 'true' }),

      t.header({ id: 'topbar' }, [
        t.label({ for: 'menu-toggle', class: 'menu-toggle-label', ariaLabel: 'Toggle navigation' }, [
          menuIcon(),
          closeMenuIcon(),
        ]),
        t.span({ class: 'topbar-title' }, 'Kensington'),
        renderForHydration(searchDocs, {}),
      ]),

      t.nav({ id: 'sidebar' }, [
        renderForHydration(pageTabs, {
          pages: pages.filter(p => !p.hideFromNav).map(p => ({ id: p.id, label: p.label })),
        }),
        ...pages.map((p, i) =>
          t.div({ dataPageNav: p.id, class: i > 0 ? 'page-inactive' : '' }, p.sidebar()),
        ),
      ]),

      ...pages.map((p, i) =>
        t.main({ dataPageContent: p.id, class: i > 0 ? 'page-inactive' : '' }, p.content()),
      ),

      t.script({ src: 'https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-core.min.js' }),
      t.script({
        src: 'https://cdn.jsdelivr.net/npm/prismjs@1/plugins/autoloader/prism-autoloader.min.js',
        dataAutoloaderPath: 'https://cdn.jsdelivr.net/npm/prismjs@1/components/',
      }),
      t.script({ type: 'module', src: '/assets/runtime.js' }),
    ]),
  ]).toString().replace('</head>', `<script>${initScript}</script></head>`);
}
