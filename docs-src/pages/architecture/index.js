import { t } from 'kensington';

import { githubLink } from '../../components/ui.js';
import { architectureConstruction } from './construction.js';
import { architectureDomOutput } from './dom-output.js';
import { stageDot } from './helpers.js';
import { architectureHmr } from './hmr.js';
import { architectureHydration } from './hydration.js';
import { architectureLifecycle } from './lifecycle.js';
import { architectureLiveSignals } from './live-signals.js';
import { architectureOverview } from './overview.js';
import { architecturePipeline } from './pipeline.js';
import { architectureReconcile } from './reconcile.js';
import { architectureReference } from './reference.js';
import { architectureRemoval } from './removal.js';
import { architectureSignals } from './signals.js';
import { architectureStringOutput } from './string-output.js';

const MERMAID_INIT = `
(async function () {
  const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'neutral', fontFamily: 'ui-monospace, "Cascadia Mono", "Segoe UI Mono", monospace', flowchart: { curve: 'linear' } });
  const nodes = document.querySelectorAll('[data-page-content="architecture"] .mermaid');
  if (nodes.length) { mermaid.run({ nodes }).catch(() => {}); }
})();
`.trim();

export function architectureSidebar() {
  return [
    t.ul([
      t.li(t.a({ href: '#introduction' }, 'Introduction')),
      t.li(t.a({ href: '#concepts' }, 'Concepts')),
      t.li(t.a({ href: '#pipeline' }, 'The Pipeline')),
      t.li([
        t.a({ href: '#construction' }, [stageDot(1), 'Construction']),
        t.ul([
          t.li(t.a({ href: '#construction-createtag' }, 'createTag closure')),
          t.li(t.a({ href: '#construction-contenttag' }, 'ContentTag constructor')),
          t.li(t.a({ href: '#construction-validation' }, 'Validation')),
        ]),
      ]),
      t.li([
        t.a({ href: '#serialize' }, [stageDot(2), 'String Output']),
        t.ul([
          t.li(t.a({ href: '#serialize-paths' }, 'Three content paths')),
        ]),
      ]),
      t.li([
        t.a({ href: '#render' }, [stageDot(3), 'DOM Output']),
        t.ul([
          t.li(t.a({ href: '#render-cache' }, 'Cache check')),
          t.li(t.a({ href: '#render-element' }, 'Element creation')),
          t.li(t.a({ href: '#render-attributes' }, 'Attribute wiring')),
          t.li(t.a({ href: '#render-events' }, 'Event handlers')),
          t.li(t.a({ href: '#render-props' }, 'Prop wiring')),
          t.li(t.a({ href: '#render-content' }, 'Content wiring')),
          t.li(t.a({ href: '#render-finalize' }, 'Lifecycle finalize')),
        ]),
      ]),
      t.li([
        t.a({ href: '#signal-anatomy' }, 'Signal Anatomy'),
        t.ul([
          t.li(t.a({ href: '#signal-subscribe' }, 'Subscription')),
          t.li(t.a({ href: '#signal-write' }, 'Writes and flush')),
          t.li(t.a({ href: '#signal-effect' }, 'effect()')),
          t.li(t.a({ href: '#signal-computed' }, 'computed()')),
          t.li(t.a({ href: '#signal-keyed' }, 'Keyed signals')),
          t.li(t.a({ href: '#computed-keyed' }, 'Keyed computeds')),
        ]),
      ]),
      t.li([
        t.a({ href: '#lifecycle' }, [stageDot(4), 'Lifecycle Module']),
      ]),
      t.li(t.a({ href: '#dom-tracker' }, 'DOM Tracker')),
      t.li([
        t.a({ href: '#removal' }, [stageDot(5), 'Removal Flow']),
      ]),
      t.li([
        t.a({ href: '#persist' }, [stageDot(4), 'Persist Mode']),
      ]),
      t.li([
        t.a({ href: '#reconcile' }, 'Reconciliation'),
        t.ul([
          t.li(t.a({ href: '#reconcile-keyed' }, 'Keys and node lookup')),
          t.li(t.a({ href: '#reconcile-clear' }, 'Clear fast path')),
          t.li(t.a({ href: '#reconcile-bidirectional' }, 'Bidirectional matching')),
          t.li(t.a({ href: '#reconcile-rebuild' }, 'Rebuild path')),
          t.li(t.a({ href: '#reconcile-loop' }, 'Main loop and slow path')),
        ]),
      ]),
      t.li([
        t.a({ href: '#hydration' }, 'SSR and Hydration'),
        t.ul([
          t.li(t.a({ href: '#hydration-bypass' }, 'SSR bypass')),
          t.li(t.a({ href: '#hydration-rfw' }, 'renderForHydration()')),
          t.li(t.a({ href: '#hydration-register' }, 'registerComponents()')),
        ]),
      ]),
      t.li([
        t.a({ href: '#hmr' }, 'HMR'),
        t.ul([
          t.li(t.a({ href: '#hmr-plugin' }, 'The Vite plugin')),
          t.li(t.a({ href: '#hmr-instrument' }, '__kInstrument')),
          t.li(t.a({ href: '#hmr-replace' }, 'hmrReplaceComponent')),
          t.li(t.a({ href: '#hmr-scopes' }, 'Hydration scopes')),
          t.li(t.a({ href: '#hmr-ssr' }, 'SSR + HMR parity')),
        ]),
      ]),
      t.li([
        t.a({ href: '#live-signals' }, 'Live signals'),
        t.ul([
          t.li(t.a({ href: '#live-state-module' }, 'Transport registry')),
          t.li(t.a({ href: '#live-protocol' }, 'Wire protocol')),
          t.li(t.a({ href: '#live-client' }, 'Client transport')),
          t.li(t.a({ href: '#live-server' }, 'Server runtime')),
          t.li(t.a({ href: '#live-persistence' }, 'Persistence adapters')),
          t.li(t.a({ href: '#live-cheatsheet' }, 'Where to look')),
        ]),
      ]),
      t.li(t.a({ href: '#invariants' }, 'Invariants')),
      t.li(t.a({ href: '#cheatsheet' }, 'Where to look')),
    ]),
    githubLink(),
  ];
}

export function architectureContent() {
  const legendBar = t.div({ class: 'legend-bar' }, [
    t.span({ class: 'legend' }, [
      t.span({ class: 'pill', ariaHidden: 'true', style: { background: 'var(--color-stage1)' } }),
      'Construction',
    ]),
    t.span({ class: 'legend' }, [
      t.span({ class: 'pill', ariaHidden: 'true', style: { background: 'var(--color-stage2)' } }),
      'String output',
    ]),
    t.span({ class: 'legend' }, [
      t.span({ class: 'pill', ariaHidden: 'true', style: { background: 'var(--color-stage3)' } }),
      'DOM output',
    ]),
    t.span({ class: 'legend' }, [
      t.span({ class: 'pill', ariaHidden: 'true', style: { background: 'var(--color-stage4)' } }),
      'Lifecycle',
    ]),
    t.span({ class: 'legend' }, [
      t.span({ class: 'pill', ariaHidden: 'true', style: { background: 'var(--color-stage5)' } }),
      'Removal',
    ]),
  ]);

  return [
    ...architectureOverview(),
    t.div({ class: 'legend-sentinel', ariaHidden: 'true' }),
    legendBar,
    architecturePipeline(),
    architectureConstruction(),
    architectureStringOutput(),
    architectureDomOutput(),
    architectureSignals(),
    ...architectureLifecycle(),
    ...architectureRemoval(),
    architectureReconcile(),
    architectureHydration(),
    architectureHmr(),
    architectureLiveSignals(),
    ...architectureReference(),
    // eslint-disable-next-line kensington/no-unsafe-literal -- inline script tag, content controlled by us
    t.unsafeLiteral(`<script type="module">${MERMAID_INIT}</script>`),
  ];
}
