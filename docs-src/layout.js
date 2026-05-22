import { renderForHydration } from '../esm/index.js';
import { menuIcon, closeMenuIcon } from './components/ui.js';
import { searchDocs } from './components/search.js';
import { pageTabs } from './components/page-tabs.js';
import { topbarTitle } from './components/topbar-title.js';

export function layout(t, pages) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.title('Kensington'),
      t.link({ href: 'https://api.fontshare.com/v2/css?f[]=supreme@1,900,700,500,400,300&display=swap', rel: 'stylesheet' }),
      t.link({ href: 'https://api.fontshare.com/v2/css?f[]=tanker@400&display=swap', rel: 'stylesheet' }),
      t.link({ rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-tomorrow.min.css' }),
      t.link({ rel: 'stylesheet', href: '/assets/styles.css' }),
    ]),
    t.body([
      t.input({ type: 'checkbox', id: 'menu-toggle', hidden: true }),
      t.label({ id: 'menu-backdrop', for: 'menu-toggle', ariaHidden: 'true' }),

      t.div({ id: 'topbar' }, [
        t.label({ for: 'menu-toggle', class: 'menu-toggle-label', ariaLabel: 'Toggle navigation' }, [
          menuIcon(t),
          closeMenuIcon(t),
        ]),
        renderForHydration(topbarTitle, {}),
        renderForHydration(searchDocs, {}),
      ]),

      t.nav({ id: 'sidebar' }, [
        renderForHydration(pageTabs, { pages: pages.map(p => ({ id: p.id, label: p.label })) }),
        ...pages.map(p =>
          t.div({ dataPageNav: p.id }, p.sidebar(t))
        ),
      ]),

      ...pages.map(p =>
        t.main({ dataPageContent: p.id }, p.content(t))
      ),

      t.script({ src: 'https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-core.min.js' }),
      t.script({
        src: 'https://cdn.jsdelivr.net/npm/prismjs@1/plugins/autoloader/prism-autoloader.min.js',
        dataAutoloaderPath: 'https://cdn.jsdelivr.net/npm/prismjs@1/components/',
      }),
      t.script({ type: 'module', src: '/assets/runtime.js' }),
    ]),
  ]).toString();
}
