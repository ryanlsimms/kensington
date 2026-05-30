import { renderForHydration } from '../esm/index.js';
import { menuIcon, closeMenuIcon } from './components/ui.js';
import { searchDocs } from './components/search.js';
import { pageTabs } from './components/page-tabs.js';

export function layout(t, pages) {
  const defaultId = pages[0].id;
  const otherIds = pages.slice(1).map(p => p.id);
  const initScript = `(function(){` +
    `var v={${otherIds.map(id => `"${id}":1`).join(',')}};` +
    `var p=new URLSearchParams(location.search).get('page');` +
    `if(!p||!v[p])return;` +
    `var s=document.createElement('style');` +
    `s.id='page-init';` +
    `s.textContent=` +
      `'[data-page-content="${defaultId}"],[data-page-nav="${defaultId}"]{display:none!important}'` +
      `+'[data-page-content="'+p+'"].page-inactive{display:block!important}'` +
      `+'[data-page-nav="'+p+'"].page-inactive{display:contents!important}'` +
      `+'[data-page-tab="${defaultId}"].active{color:var(--color-muted)!important;background:var(--color-tab-inactive)!important;border-bottom-color:transparent!important}'` +
      `+'[data-page-tab="'+p+'"]{color:var(--color-heading)!important;background:var(--color-sidebar-tab-hover)!important;border-bottom-color:var(--color-accent)!important}';` +
    `document.head.appendChild(s)` +
    `})()`;
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

      t.div({ id: 'topbar' }, [
        t.label({ for: 'menu-toggle', class: 'menu-toggle-label', ariaLabel: 'Toggle navigation' }, [
          menuIcon(t),
          closeMenuIcon(t),
        ]),
        t.span({ class: 'topbar-title' }, 'Kensington'),
        renderForHydration(searchDocs, {}),
      ]),

      t.nav({ id: 'sidebar' }, [
        renderForHydration(pageTabs, { pages: pages.filter(p => !p.hideFromNav).map(p => ({ id: p.id, label: p.label })) }),
        ...pages.map((p, i) =>
          t.div({ dataPageNav: p.id, class: i > 0 ? 'page-inactive' : '' }, p.sidebar(t))
        ),
      ]),

      ...pages.map((p, i) =>
        t.main({ dataPageContent: p.id, class: i > 0 ? 'page-inactive' : '' }, p.content(t))
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
