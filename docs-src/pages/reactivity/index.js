import { t } from 'kensington';

import { githubLink } from '../../components/ui.js';
import { reactivityBestPractices } from './best-practices.js';
import { reactivityCleanup } from './cleanup.js';
import { reactivityDevtools } from './devtools.js';
import { reactivityInTemplates } from './in-templates.js';
import { reactivityIntro } from './intro.js';
import { reactivityKeyedLists } from './keyed-lists.js';
import { reactivityLifecycle } from './lifecycle.js';
import { reactivityLiveSignals } from './live-signals.js';
import { reactivityPrimitives } from './primitives.js';
import { reactivitySsr } from './ssr.js';
import { reactivityKnownTradeoffs } from './tradeoffs.js';
import { reactivityValueAndTransform } from './value-and-transform.js';
import { reactivityAdvancedHeader, reactivityWhenUpdates } from './when-updates.js';

export function reactivitySidebar() {
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
      t.li(t.a({ href: '#signals-style-props' }, 'Style properties')),
      t.li(t.a({ href: '#signals-dom-props' }, 'DOM properties')),
      t.li(t.a({ href: '#signals-literal' }, '.literal() & comments')),
      t.li(t.a({ href: '#signals-existing-elements' }, 'Existing elements')),
    ]),
    t.h2({ class: 'sidebar-title' }, 'Advanced'),
    t.ul([
      t.li(t.a({ href: '#signal-value' }, '.value')),
      t.li(t.a({ href: '#signal-transform' }, '.transform()')),
      t.li([
        t.a({ href: '#signals-keyed-lists' }, 'Keyed lists'),
        t.ul([
          t.li(t.a({ href: '#signals-keyed-local-state' }, 'Per-item local state')),
        ]),
      ]),
      t.li([
        t.a({ href: '#when-updates-fire' }, 'When updates fire'),
        t.ul([
          t.li(t.a({ href: '#immutable-updates' }, 'Immutable updates')),
          t.li(t.a({ href: '#what-does-not-trigger' }, "What doesn't trigger")),
          t.li(t.a({ href: '#when-the-dom-updates' }, 'DOM update sites')),
          t.li(t.a({ href: '#per-row-signals' }, 'Per-row signals')),
        ]),
      ]),
      t.li(t.a({ href: '#signals-cleanup' }, 'Cleanup')),
      t.li([
        t.a({ href: '#lifecycle' }, 'Lifecycle'),
        t.ul([
          t.li(t.a({ href: '#connected-callback' }, 'addConnectedCallback')),
          t.li(t.a({ href: '#disconnected-callback' }, 'addDisconnectedCallback')),
        ]),
      ]),
      t.li(t.a({ href: '#hydration' }, 'SSR reactive data')),
      t.li([
        t.a({ href: '#live-signals' }, 'Live signals'),
        t.ul([
          t.li(t.a({ href: '#live-signals-setup' }, 'Setup. Three calls')),
          t.li(t.a({ href: '#live-signals-naming' }, 'Naming')),
          t.li(t.a({ href: '#live-signals-persistence' }, 'Persistence')),
          t.li(t.a({ href: '#live-signals-canwrite' }, 'canRead / canWrite')),
          t.li(t.a({ href: '#live-signals-atomic' }, 'Atomic updates with .set(fn)')),
          t.li(t.a({ href: '#live-signals-status' }, 'Connection status pill')),
          t.li(t.a({ href: '#live-signals-server-subscribe' }, 'Server-side liveSignal')),
          t.li(t.a({ href: '#live-signals-auto-unsubscribe' }, 'Auto-unsubscribe trap')),
          t.li(t.a({ href: '#live-signals-where-created' }, 'Where liveSignals are created')),
        ]),
      ]),
      t.li([
        t.a({ href: '#best-practices' }, 'Best practices'),
        t.ul([
          t.li(t.a({ href: '#bp-use-signal' }, 'Use signals for reactive values')),
          t.li(t.a({ href: '#bp-reactive-in-callback' }, 'Reactive values in callbacks')),
          t.li(t.a({ href: '#bp-signal-scope' }, 'Signal read scope')),
          t.li(t.a({ href: '#bp-named-handler' }, 'Named event handlers')),
          t.li(t.a({ href: '#bp-keyed-lists' }, 'Keyed lists')),
        ]),
      ]),
      t.li([
        t.a({ href: '#devtools' }, 'Devtools'),
        t.ul([
          t.li(t.a({ href: '#devtools-setup' }, 'Setup')),
          t.li(t.a({ href: '#devtools-panel' }, 'Panel')),
        ]),
      ]),
      t.li(t.a({ href: '#known-tradeoffs' }, 'Known tradeoffs')),
    ]),
    githubLink(),
  ];
}

export function reactivityContent() {
  return [
    reactivityIntro(),
    reactivityPrimitives(),
    ...reactivityInTemplates(),
    reactivityAdvancedHeader(),
    ...reactivityValueAndTransform(),
    reactivityKeyedLists(),
    ...reactivityWhenUpdates(),
    reactivityCleanup(),
    reactivityLifecycle(),
    reactivitySsr(),
    reactivityLiveSignals(),
    reactivityBestPractices(),
    reactivityDevtools(),
    reactivityKnownTradeoffs(),
  ];
}
