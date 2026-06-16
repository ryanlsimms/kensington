import { t } from 'kensington';

import { callout, code } from '../../components/ui.js';
import { loc } from './helpers.js';

export function architectureHmr() {
  return t.section({ id: 'hmr' }, [
    t.h2('HMR'),
    t.p({ class: 'file-crumb' }, [
      'esm',
      t.span({ class: 'slash' }, '/'),
      'vite',
      t.span({ class: 'slash' }, '/'),
      loc('esm/vite/index.js'),
      t.span({ class: 'slash' }, ' + '),
      loc('esm/lib/render/hydration.js'),
    ]),
    t.p([
      'The ',
      t.code('kensington/vite'),
      ' subpath ships a small Vite plugin that wires component HMR without asking the user to add any code in the component itself. The plugin parses each matched source file to an AST (',
      t.code('acorn'),
      ' + ',
      t.code('magic-string'),
      ', both declared as optional peer dependencies and loaded lazily), wraps each component export with ',
      t.code('__kInstrument(name, fn)'),
      ', and appends an ',
      t.code('import.meta.hot.accept'),
      ' block that calls ',
      t.code('hmrReplaceComponent'),
      ' on save. Production builds skip the transform entirely (',
      t.code('apply: \'serve\''),
      ').',
    ]),

    t.section({ id: 'hmr-plugin' }, [
      t.h3('The Vite plugin'),
      code('javascript', `// vite.config.js
import { kensingtonHmr } from 'kensington/vite';

export default {
  plugins: [
    kensingtonHmr({ include: 'src/components/**/*.{js,ts}' }),
  ],
};`),
      t.p([
        t.code('include'),
        ' accepts a glob, an array of globs, or a callback ',
        t.code('(server) => glob | globs | null'),
        '. The callback form lets adapters like ',
        t.code('kensington-dev-server'),
        ' source the glob from runtime state that is not known at config time. Internally both forms are normalised to a callback.',
      ]),
      t.p([
        'Supported export shapes (others silently keep no-HMR behaviour):',
      ]),
      t.ul([
        t.li([t.code('export function NAME(...) {}')]),
        t.li([t.code('export const NAME = function|()=>...')]),
        t.li([t.code('export default function NAME(...) {}')]),
        t.li([t.code('export default function(...) {}'), ' (anonymous; name is the file basename)']),
        t.li([t.code('export default () => ...'), ' (name is the file basename)']),
        t.li([t.code('export default NAME'), ' (re-export of a local declaration)']),
        t.li([t.code('export { NAME, NAME2, ... }'), ' (specifier list)']),
      ]),
    ]),

    t.section({ id: 'hmr-instrument' }, [
      t.h3('__kInstrument'),
      t.p([
        'The runtime counterpart to the AST rewrite. ',
        loc('esm/lib/render/hydration.js'),
        ' exports ',
        t.code('__kInstrument(name, fn)'),
        ' as a thin wrapper that:',
      ]),
      t.ol([
        t.li([
          'Allocates a fresh mount id and enters a hydration scope (',
          t.code('_enterHydrationScope(mountId)'),
          ' in ',
          loc('esm/lib/reactive/signal.js'),
          '). Keyed calls like ',
          t.code('signal(initial, key)'),
          ' and ',
          t.code('computed(fn, key)'),
          ' inside the component body look up the per-scope registry and reuse the existing instance if one exists.',
        ]),
        t.li([
          'Calls the original ',
          t.code('fn(state)'),
          ' and intercepts the returned tag\'s ',
          t.code('toElement'),
          ' method so the live element is stamped with ',
          t.code('data-k-mount-target=<mountId>'),
          ' and recorded in the per-name ',
          t.code('liveInstances'),
          ' map.',
        ]),
        t.li([
          'Exposes the original function via the ',
          t.code('__kFn'),
          ' property on the wrapper so the Vite plugin\'s accept handler can read it back unwrapped.',
        ]),
      ]),
      t.p([
        'SSR (',
        t.code('isSSRMode()'),
        ') and re-entrant calls (',
        t.code('_inHydrationScope()'),
        ') skip instrumentation entirely. The wrapper steps aside and just calls the original ',
        t.code('fn'),
        '. This keeps server-side renders untouched and avoids double-bookkeeping when ',
        t.code('hydrateComponent'),
        ' itself owns the scope.',
      ]),
    ]),

    t.section({ id: 'hmr-replace' }, [
      t.h3('hmrReplaceComponent'),
      t.p([
        'On every save, the appended HMR accept block calls ',
        t.code('hmrReplaceComponent(name, mod.<access>.__kFn)'),
        '. The function walks the per-name ',
        t.code('liveInstances'),
        ' set and, for each live instance, performs the swap in place:',
      ]),
      code('javascript', `for (const inst of [...set]) {
  // 1. Detached? Drop and dispose its hydration scope.
  if (!inst.mountNodes[0]?.isConnected) {
    _disposeHydrationScope(inst.mountId);
    dropInstance(name, inst);
    continue;
  }

  // 2. Capture user-visible DOM state (focus, selection, scroll,
  //    input value, checked, indeterminate, <select> value, ...)
  const captured = captureState(inst.mountNodes[0]);

  // 3. Re-render inside the SAME hydration scope.
  //    Keyed signal/computed instances persist; their values survive.
  _enterHydrationScope(inst.mountId);
  const result = newFn(inst.state);
  _exitHydrationScope();

  // 4. Replace nodes in place. dom-tracker stops effects on the
  //    discarded DOM via the MutationObserver, automatically.
  inst.mountNodes[0].replaceWith(...result.map(el => el.toElement()));

  // 5. Restore the captured state onto the fresh subtree.
  restoreState(newNodes[0], captured);
}`),
      callout('note', 'Three preservation mechanisms, one swap',
        t.p([
          'Keyed reactive state (via hydration scopes), native DOM state (via ',
          loc('esm/lib/reactive/preserve-state.js'),
          '), and effect cleanup (via ',
          loc('esm/lib/reactive/dom-tracker.js'),
          '\'s MutationObserver) all line up so the swap is invisible to the user. A counter\'s click count, a half-typed input, the page scroll position, and the focus ring all carry over from the old DOM to the new.',
        ]),
      ),
    ]),

    t.section({ id: 'hmr-scopes' }, [
      t.h3('Hydration scopes vs. computed-keyed registries'),
      t.p([
        'Both mechanisms make ',
        t.code('signal(initial, key)'),
        ' and ',
        t.code('computed(fn, key)'),
        ' return the same instance across re-runs of an enclosing scope. They differ in lifetime:',
      ]),
      t.ul([
        t.li([
          t.strong('Keyed registries inside a computed.'),
          ' Sweep unaccessed keys at the end of every run. An item removed from a list takes its keyed signals with it, automatically.',
        ]),
        t.li([
          t.strong('Hydration scopes.'),
          ' Do NOT sweep. Stability comes from the mount id, not from access tracking. A scope is disposed only when the mount is removed via ',
          t.code('_disposeHydrationScope'),
          ', at which point every signal and computed in it is stopped. Re-rendering a component during a hot-swap intentionally keeps every keyed signal alive even if the new module doesn\'t read it.',
        ]),
      ]),
    ]),

    t.section({ id: 'hmr-ssr' }, [
      t.h3('SSR + HMR parity'),
      t.p([
        'SSR-hydrated components participate in HMR alongside client-only ones. After ',
        t.code('registerComponents'),
        ' runs ',
        t.code('hydrateComponent'),
        ' on an SSR mount marker, the live nodes are stamped with ',
        t.code('data-k-mount-target=<mountId>'),
        ' and recorded in ',
        t.code('liveInstances'),
        ' with the same shape as client-only mounts. ',
        t.code('hmrReplaceComponent'),
        ' walks both kinds uniformly, so an edit to a component file hot-swaps every instance regardless of how it was mounted.',
      ]),
      callout('warn', 'Why HMR lives in the kensington package',
        t.p([
          'The ',
          t.code('__kFn'),
          ' marker, the hydration scope stack, the ',
          t.code('liveInstances'),
          ' registry, and the ',
          t.code('data-k-mount-target'),
          ' attribute are all cross-package contracts. They have to be authoritative in one place. Adapters like ',
          t.code('kensington-dev-server'),
          ' build on top of them. They don\'t reimplement them.',
        ]),
      ),
    ]),
  ]);
}
