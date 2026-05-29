import { githubLink } from '../../components/ui.js';
import { reactivityBestPractices } from './best-practices.js';
import { reactivityCleanup } from './cleanup.js';
import { reactivityDevtools } from './devtools.js';
import { reactivityInTemplates } from './in-templates.js';
import { reactivityIntro } from './intro.js';
import { reactivityLifecycle } from './lifecycle.js';
import { reactivityPrimitives } from './primitives.js';
import { reactivitySsr } from './ssr.js';
import { reactivityValueAndTransform } from './value-and-transform.js';
import { reactivityWhenUpdates } from './when-updates.js';

export function reactivitySidebar(t) {
  return [
    t.ul([
      t.li([
        t.a({ href: '#signals' }, 'Signals'),
        t.ul([
          t.li(t.a({ href: '#computed' }, 'computed()')),
          t.li(t.a({ href: '#effect' }, 'effect()')),
        ]),
      ]),
      t.li(t.a({ href: '#signals-content' }, 'Content')),
      t.li(t.a({ href: '#signals-attributes' }, 'Attributes')),
      t.li(t.a({ href: '#signals-dom-props' }, 'DOM properties')),
      t.li(t.a({ href: '#signals-keyed-lists' }, 'Keyed lists')),
      t.li(t.a({ href: '#signals-literal' }, '.literal() & comments')),
      t.li(t.a({ href: '#signals-existing-elements' }, 'Existing elements')),
    ]),
    t.div({ class: 'sidebar-title' }, 'Advanced'),
    t.ul([
      t.li([
        t.a({ href: '#when-updates-fire' }, 'When updates fire'),
        t.ul([
          t.li(t.a({ href: '#immutable-updates' }, 'Immutable updates')),
          t.li(t.a({ href: '#what-does-not-trigger' }, "What doesn't trigger")),
          t.li(t.a({ href: '#when-the-dom-updates' }, 'DOM update sites')),
          t.li(t.a({ href: '#per-row-signals' }, 'Per-row signals')),
        ]),
      ]),
      t.li(t.a({ href: '#signal-value' }, '.value')),
      t.li(t.a({ href: '#signal-transform' }, '.transform()')),
      t.li(t.a({ href: '#signals-cleanup' }, 'Cleanup')),
      t.li([
        t.a({ href: '#lifecycle' }, 'Lifecycle'),
        t.ul([
          t.li(t.a({ href: '#connected-callback' }, 'addConnectedCallback')),
          t.li(t.a({ href: '#disconnected-callback' }, 'addDisconnectedCallback')),
        ]),
      ]),
      t.li(t.a({ href: '#hydration' }, 'SSR reactive data')),
      t.li(t.a({ href: '#known-tradeoffs' }, 'Known tradeoffs')),
      t.li([
        t.a({ href: '#best-practices' }, 'Best practices'),
        t.ul([
          t.li(t.a({ href: '#bp-use-signal' }, 'Use signals for reactive values')),
          t.li(t.a({ href: '#bp-reactive-in-callback' }, 'Reactive values in callbacks')),
          t.li(t.a({ href: '#bp-named-handler' }, 'Named event handlers')),
          t.li(t.a({ href: '#bp-data-key' }, 'Keyed lists')),
        ]),
      ]),
      t.li([
        t.a({ href: '#devtools' }, 'Devtools'),
        t.ul([
          t.li(t.a({ href: '#devtools-setup' }, 'Setup')),
          t.li(t.a({ href: '#devtools-panel' }, 'Panel')),
        ]),
      ]),
    ]),
    githubLink(t),
  ];
}

export function reactivityContent(t) {
  return [
    reactivityIntro(t),
    reactivityPrimitives(t),
    ...reactivityInTemplates(t),
    ...reactivityWhenUpdates(t),
    ...reactivityValueAndTransform(t),
    reactivityCleanup(t),
    reactivityLifecycle(t),
    reactivitySsr(t),
    reactivityBestPractices(t),
    reactivityDevtools(t),
  ];
}
