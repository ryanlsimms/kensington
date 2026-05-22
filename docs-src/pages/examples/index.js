import { githubLink, headerGithubLink } from '../../components/ui.js';
import { examplesBuildSystems } from './build-systems.js';
import { examplesIntegrations } from './integrations.js';
import { examplesMissingFeatures } from './missing-features.js';
import { examplesReactiveData } from './reactive-data.js';
import { examplesStringRendering } from './string-rendering.js';

export function examplesSidebar(t) {
  return [
    t.ul([
      t.li([
        t.a({ href: '#string-rendering' }, 'String rendering'),
        t.ul([
          t.li(t.a({ href: '#ssr' }, 'Server-side rendering')),
          t.li(t.a({ href: '#framework-integration' }, 'Framework integration')),
          t.li(t.a({ href: '#express-render-helper' }, 'Express render helper')),
          t.li(t.a({ href: '#kensington-express' }, 'kensington-express')),
          t.li(t.a({ href: '#kensington-fastify' }, 'kensington-fastify')),
          t.li(t.a({ href: '#form-from-schema' }, 'Form from schema')),
          t.li(t.a({ href: '#preformatted' }, 'Preformatted blocks')),
        ]),
      ]),
      t.li([
        t.a({ href: '#reactive-data' }, 'Reactive data'),
        t.ul([
          t.li(t.a({ href: '#counter' }, 'Counter')),
          t.li(t.a({ href: '#live-filter' }, 'Live filter')),
          t.li(t.a({ href: '#todo-list' }, 'Todo list')),
          t.li(t.a({ href: '#dark-mode' }, 'Dark mode')),
          t.li(t.a({ href: '#character-counter' }, 'Character counter')),
          t.li(t.a({ href: '#incremental-search' }, 'Incremental search')),
          t.li(t.a({ href: '#sortable-table' }, 'Sortable table')),
          t.li(t.a({ href: '#hydrated-like-button' }, 'Hydrated component')),
          t.li(t.a({ href: '#hydrated-form-validation' }, 'Form validation')),
          t.li(t.a({ href: '#lifecycle-widget' }, 'Lifecycle widget')),
          t.li(t.a({ href: '#effect-resume' }, 'Effect pause and resume')),
          t.li(t.a({ href: '#spa-router' }, 'Single-page app router')),
        ]),
      ]),
      t.li([
        t.a({ href: '#missing-features' }, '"Missing" features'),
        t.ul([
          t.li(t.a({ href: '#create-context' }, 'createContext')),
          t.li(t.a({ href: '#use-reducer' }, 'useReducer')),
          t.li(t.a({ href: '#use-local-storage' }, 'useLocalStorage')),
          t.li(t.a({ href: '#use-debounce' }, 'useDebounce')),
          t.li(t.a({ href: '#use-fetch' }, 'useFetch')),
          t.li(t.a({ href: '#use-id' }, 'useId')),
        ]),
      ]),
      t.li([
        t.a({ href: '#integrations' }, 'Integrations'),
        t.ul([
          t.li(t.a({ href: '#htmx' }, 'htmx')),
          t.li(t.a({ href: '#tailwind' }, 'Tailwind CSS')),
          t.li(t.a({ href: '#alpine' }, 'Alpine.js')),
          t.li(t.a({ href: '#elysia' }, 'Elysia')),
          t.li(t.a({ href: '#hono' }, 'Hono')),
          t.li(t.a({ href: '#navigo' }, 'Navigo')),
          t.li(t.a({ href: '#web-components' }, 'Web Components')),
          t.li(t.a({ href: '#d3' }, 'D3')),
        ]),
      ]),
      t.li([
        t.a({ href: '#build-systems' }, 'Build systems'),
        t.ul([
          t.li(t.a({ href: '#rollup' }, 'Rollup')),
          t.li(t.a({ href: '#esbuild' }, 'esbuild')),
          t.li(t.a({ href: '#webpack' }, 'Webpack')),
        ]),
      ]),
    ]),
    githubLink(t),
  ];
}

export function examplesContent(t) {
  return [
    t.header([headerGithubLink(t), t.h1('Examples')]),
    examplesStringRendering(t),
    examplesReactiveData(t),
    examplesMissingFeatures(t),
    examplesIntegrations(t),
    examplesBuildSystems(t),
  ];
}
