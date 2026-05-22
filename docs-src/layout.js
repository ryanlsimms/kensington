import { renderForHydration } from '../esm/index.js';
import { menuIcon, closeMenuIcon } from './components/ui.js';
import { searchDocs } from './components/search.js';
import { pageTabs } from './components/page-tabs.js';

export function layout(t, pages) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.title('Kensington'),
      t.link({ rel: 'preconnect', href: 'https://fonts.googleapis.com' }),
      t.link({ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }),
      t.link({ href: 'https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@500;600;700&display=swap', rel: 'stylesheet' }),
      t.link({ href: 'https://db.onlinewebfonts.com/c/63a0282b9ba584ecf321c6e87443e863?family=Draft+B', rel: 'stylesheet' }),
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
        t.span({ class: 'topbar-title' }, 'Kensington'),
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
