import { githubLink } from '../../components/ui.js';
import { stageDot } from './helpers.js';
import { architectureOverview } from './overview.js';
import { architecturePipeline } from './pipeline.js';
import { architectureConstruction } from './construction.js';
import { architectureStringOutput } from './string-output.js';
import { architectureDomOutput } from './dom-output.js';
import { architectureSignals } from './signals.js';
import { architectureLifecycle } from './lifecycle.js';
import { architectureRemoval } from './removal.js';
import { architectureReconcile } from './reconcile.js';
import { architectureHydration } from './hydration.js';
import { architectureReference } from './reference.js';

const MERMAID_INIT = `
(async function () {
  const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'neutral', fontFamily: 'ui-monospace, "Cascadia Mono", "Segoe UI Mono", monospace', flowchart: { curve: 'linear' } });
  const nodes = document.querySelectorAll('[data-page-content="architecture"] .mermaid');
  if (nodes.length) { mermaid.run({ nodes }).catch(() => {}); }
})();
`.trim();

export function architectureSidebar(t) {
  return [
    t.ul([
      t.li(t.a({ href: '#introduction' }, 'Introduction')),
      t.li(t.a({ href: '#concepts' }, 'Concepts')),
      t.li(t.a({ href: '#pipeline' }, 'The Pipeline')),
      t.li([
        t.a({ href: '#construction' }, [stageDot(t, 1), 'Construction']),
        t.ul([
          t.li(t.a({ href: '#construction-createtag' }, 'createTag closure')),
          t.li(t.a({ href: '#construction-contenttag' }, 'ContentTag constructor')),
          t.li(t.a({ href: '#construction-validation' }, 'Validation')),
        ]),
      ]),
      t.li([
        t.a({ href: '#serialize' }, [stageDot(t, 2), 'String Output']),
        t.ul([
          t.li(t.a({ href: '#serialize-paths' }, 'Three content paths')),
        ]),
      ]),
      t.li([
        t.a({ href: '#render' }, [stageDot(t, 3), 'DOM Output']),
        t.ul([
          t.li(t.a({ href: '#render-cache' }, 'Cache check')),
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
        ]),
      ]),
      t.li([
        t.a({ href: '#lifecycle' }, [stageDot(t, 4), 'Lifecycle Module']),
      ]),
      t.li(t.a({ href: '#dom-tracker' }, 'DOM Tracker')),
      t.li([
        t.a({ href: '#removal' }, [stageDot(t, 5), 'Removal Flow']),
      ]),
      t.li([
        t.a({ href: '#persist' }, [stageDot(t, 4), 'Persist Mode']),
      ]),
      t.li([
        t.a({ href: '#reconcile' }, 'Reconciliation'),
        t.ul([
          t.li(t.a({ href: '#reconcile-snapshot' }, 'Snapshot fast path')),
          t.li(t.a({ href: '#reconcile-sync' }, 'syncNode')),
          t.li(t.a({ href: '#reconcile-signal-mismatch' }, 'Signal-ref mismatch')),
        ]),
      ]),
      t.li(t.a({ href: '#hydration' }, 'SSR and Hydration')),
      t.li(t.a({ href: '#invariants' }, 'Invariants')),
      t.li(t.a({ href: '#cheatsheet' }, 'Where to look')),
    ]),
    githubLink(t),
  ];
}

export function architectureContent(t) {
  const legendBar = t.div({ class: 'legend-bar' }, [
    t.span({ class: 'legend' }, [
      t.span({ class: 'pill', ariaHidden: 'true', style: 'background:var(--color-stage1)' }),
      'Construction',
    ]),
    t.span({ class: 'legend' }, [
      t.span({ class: 'pill', ariaHidden: 'true', style: 'background:var(--color-stage2)' }),
      'String output',
    ]),
    t.span({ class: 'legend' }, [
      t.span({ class: 'pill', ariaHidden: 'true', style: 'background:var(--color-stage3)' }),
      'DOM output',
    ]),
    t.span({ class: 'legend' }, [
      t.span({ class: 'pill', ariaHidden: 'true', style: 'background:var(--color-stage4)' }),
      'Lifecycle',
    ]),
    t.span({ class: 'legend' }, [
      t.span({ class: 'pill', ariaHidden: 'true', style: 'background:var(--color-stage5)' }),
      'Removal',
    ]),
  ]);

  return [
    ...architectureOverview(t),
    t.div({ class: 'legend-sentinel', ariaHidden: 'true' }),
    legendBar,
    architecturePipeline(t),
    architectureConstruction(t),
    architectureStringOutput(t),
    architectureDomOutput(t),
    architectureSignals(t),
    ...architectureLifecycle(t),
    ...architectureRemoval(t),
    architectureReconcile(t),
    architectureHydration(t),
    ...architectureReference(t),
    t.unsafeLiteral(`<script type="module">${MERMAID_INIT}</script>`),
  ];
}
