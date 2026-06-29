import { t } from 'kensington';

import { callout, code } from '../../components/ui.js';
import { loc } from './helpers.js';

export function architectureHydration() {
  return t.section({ id: 'hydration' }, [
    t.h2('SSR and Hydration'),
    t.p({ class: 'file-crumb' }, [
      'esm',
      t.span({ class: 'slash' }, '/'),
      'lib',
      t.span({ class: 'slash' }, '/'),
      'render',
      t.span({ class: 'slash' }, '/'),
      loc('esm/lib/render/hydration.js'),
    ]),
    t.p([
      'On the server (or any environment without a real DOM), reactive subscriptions must not be created. They would have nothing to update and no cleanup path, so they would leak immediately. Both ',
      t.code('effect()'),
      ' and ',
      t.code('computed()'),
      ' consult ',
      t.code('isSSRMode()'),
      ' from ',
      loc('esm/lib/reactive/ssr.js'),
      '. The SSR mode counter, ',
      t.code('_enterSSRMode'),
      ', ',
      t.code('_exitSSRMode'),
      ', and ',
      t.code('isSSRMode'),
      ' all live in that module.',
    ]),

    t.section({ id: 'hydration-bypass' }, [
      t.h3('The SSR bypass'),
      code('javascript', `function createEffect(fn, isInternal = false) {
  if (isSSRMode()) {
    return { pause() {}, resume() {}, stop() {} };  // no-op stub
  }
  // ... normal path ...
}

export function computed(fn) {
  if (isSSRMode()) {
    const s = new Signal(fn());     // value snapshot, no subscriptions
    derivedSignals.add(s);
    return s;
  }
  // ... normal path ...
}`),
      t.p([
        'Inside an SSR call, ',
        t.code('effect()'),
        ' returns a no-op stub (the ',
        t.code('isSSRMode()'),
        ' check lives in ',
        t.code('createEffect'),
        ', which ',
        t.code('effect()'),
        ' calls) and ',
        t.code('computed()'),
        ' returns a frozen-value Signal. No subscriptions are created in either case. ',
        t.code('tag.toString()'),
        ' still reads signal values via ',
        t.code('.get()'),
        ' (which works fine without a current effect) and produces a static HTML snapshot.',
      ]),
      callout('warn', 'Why computed() needs the bypass too',
        t.p([
          'Without it, a per-request ',
          t.code('computed'),
          ' or ',
          t.code('transform'),
          ' reading a module-level signal would register an update closure in that signal\'s subscriber set. The signal lives across requests, so each render leaves one dead subscriber behind. Over time the subscriber set, and the time spent iterating it on every ',
          t.code('.set()'),
          ', grows without bound.',
        ]),
      ),
    ]),

    t.section({ id: 'hydration-rfw' }, [
      t.h3('renderForHydration'),
      t.p([
        t.code('renderForHydration(fn, state, name?, options?)'),
        ' in ',
        loc('esm/lib/render/hydration.js'),
        ' wraps a component for isomorphic rendering. On the server, it calls ',
        t.code('_enterSSRMode()'),
        ', invokes ',
        t.code('fn(state, context)'),
        ' (where ',
        t.code('context'),
        ' comes from ',
        t.code('options.context'),
        '), calls ',
        t.code('toString()'),
        ', embeds the resulting HTML alongside a JSON state block, and calls ',
        t.code('_exitSSRMode()'),
        ' in finally. The caller is responsible for inserting the resulting HTML into the page.',
      ]),
      t.p([
        'On the client, ',
        t.code('renderForHydration'),
        ' produces a placeholder element that ',
        t.code('registerComponents'),
        ' later replaces with the live DOM version.',
      ]),
      t.p([
        t.code('context'),
        ' is the non-serialized second argument every component receives. The server passes its own context to ',
        t.code('renderForHydration'),
        '; the client passes its own to ',
        t.code('registerComponents'),
        '. The framework stores them in a per-name ',
        t.code('contextRegistry'),
        ' Map alongside ',
        t.code('componentRegistry'),
        ' and forwards them on every invocation, including HMR hot-swaps. The ',
        t.code('state'),
        ' arg remains the only serialized payload.',
      ]),
    ]),

    t.section({ id: 'hydration-register' }, [
      t.h3('registerComponents + the JSON block'),
      t.p([
        'On the client, ',
        t.code('registerComponents({ name: fn }, { context })'),
        ' reads the JSON block embedded by the server render, looks up each registered component by name, and runs ',
        t.code('fn(state, context)'),
        ' to produce a fresh tag instance. That instance\'s ',
        t.code('toElement()'),
        ' creates the live DOM tree with signal effects, which then replaces the SSR-rendered HTML in the document. The optional ',
        t.code('context'),
        ' is stored per component name and reused for any later HMR re-render.',
      ]),
      t.p([
        'This is "remove and replace" hydration, not "reuse and attach." The SSR HTML serves time-to-first-paint. The live version takes over once JS is ready.',
      ]),
      callout('note', 'Why not reuse?',
        t.p([
          'Reuse hydration requires the SSR HTML and the client\'s tag tree to match exactly. The current strategy avoids that constraint at the cost of one extra DOM swap per component.',
        ]),
      ),
    ]),

    t.section({ id: 'hydration-scopes' }, [
      t.h3('Hydration scopes'),
      t.p([
        'When the client hydrates a component, it does so inside a hydration scope from ',
        loc('esm/lib/reactive/hydration-scope.js'),
        '. The scope is a ',
        t.code('Map'),
        ' keyed by a per-mount id, holding ',
        t.code('{ signals: Map, computeds: Map }'),
        ' keyed by the user-supplied keys. ',
        t.code('hydrateComponent'),
        ' enters a scope keyed by the SSR mount id, stamps the live nodes with ',
        t.code('data-k-mount-target'),
        ', and records the instance. The HMR path (',
        t.a({ href: '#hmr' }, 'covered below'),
        ') uses the same machinery so hot swaps preserve state.',
      ]),
      t.p([
        'Inside an active scope, ',
        t.code('signal(initial, key)'),
        ' (when ',
        t.code('currentComputed === null'),
        ') and ',
        t.code('computed(fn, key)'),
        ' look up the per-scope map by key and reuse the existing instance, so user-visible values persist across a re-render of the same mount. New signals are created with ',
        t.code('suppressReactiveCheck'),
        ' so the "signal inside computed" warning does not fire. The read accessor is ',
        t.code('getCurrentHydrationScope()'),
        '.',
      ]),
      callout('note', 'Scopes do not sweep',
        t.p([
          'Unlike the keyed registries inside a computed, hydration scopes do not sweep unaccessed keys per render. Stable identity comes from the mount id, not from access tracking. A scope is disposed only when its mount is removed, via ',
          t.code('_disposeHydrationScope'),
          ', which stops every signal and computed it holds.',
        ]),
      ),
    ]),
  ]);
}
