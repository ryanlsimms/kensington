import { t } from 'kensington';

import { callout } from '../../components/ui.js';
import { loc } from './helpers.js';

export function architectureReference() {
  return [
    t.section({ id: 'invariants' }, [
      t.h2('Invariants'),
      t.p('The rules that hold across every code path. Violations are bugs.'),
      t.ol({ class: 'numbered' }, [
        t.li([
          t.strong("validationLevel: 'off' never throws on runtime input."),
          ' All validation routes through ',
          loc('esm/lib/util/show-invalid.js'),
          ", which is a no-op at 'off'. Only hard invariants (createTag called with a non-string tagName, etc.) throw unconditionally.",
        ]),
        t.li([
          t.strong('Signal values are accepted everywhere a plain value is accepted.'),
          ' ',
          t.code('attributeValueIsValid'),
          ' returns true for Signals without inspecting them. Resolution happens at render time.',
        ]),
        t.li([
          t.strong('.value and .toJSON() do not subscribe; .get() and .toString() do.'),
          ' The asymmetry is intentional. Use ',
          t.code('.value'),
          ' inside an effect when you need the current value but do not want to create a dependency.',
        ]),
        t.li([
          t.strong('The persist mechanism lives entirely in '),
          loc('esm/lib/reactive/lifecycle.js'),
          '. No other file decides between pause() and stop(). dom-tracker knows about persist only to decide whether to preserve the connect/persist entry fields after stop-cleanup.',
        ]),
        t.li([
          t.strong('The reconciler never patches existing nodes in place.'),
          ' A matched key resolves to either the same cached tag (DOM reused as-is) or a fresh tag (a full rebuild via ',
          t.code('rebuildNode'),
          ' plus ',
          loc('esm/lib/reactive/preserve-state.js'),
          '). Reactive updates flow through ',
          t.code('_bindingEffect'),
          ' subscriptions on the cached tag, not through per-render attribute diffs.',
        ]),
        t.li([
          t.strong('Effects batch via microtasks; computed updates are synchronous.'),
          ' Multiple .set() calls in the same turn coalesce into one effect re-run. Computed signals see consistent inputs because their updates happen inline with the write.',
        ]),
        t.li([
          t.strong('The DOM tracker has exactly one observer for the whole document.'),
          ' Built lazily on the first trackForStop or trackForConnect call.',
        ]),
        t.li([
          t.strong('WeakRef is the GC safety net for signal effects on detached elements.'),
          ' If an element is never inserted and is garbage-collected, the next signal write triggers an effect that finds ref.deref() returning undefined and self-stops.',
        ]),
        t.li([
          t.strong('visit() does not return early when it finds the node itself.'),
          ' It continues to check trackedRefs for descendants. This ensures child effects are paused or stopped with the parent.',
        ]),
        t.li([
          t.strong('_internalEffect is for library-internal use only.'),
          ' It skips the effect-in-effect and effect-in-computed guard checks and flags the run as a DOM binding. Callers are ',
          loc('esm/lib/reactive/lifecycle.js'),
          ' (via ',
          t.code('_bindingEffect'),
          '), ',
          loc('esm/tag-classes/literal-tag.js'),
          ', ',
          loc('esm/tag-classes/comment-tag.js'),
          ', and ',
          loc('esm/lib/reactive/map-with-key.js'),
          '.',
        ]),
      ]),
    ]),

    t.section({ id: 'cheatsheet' }, [
      t.h2('Where to look'),
      t.p("If you're fixing a bug or adding a feature, here's where the change probably belongs."),
      t.table([
        t.thead(t.tr([
          t.th({ style: { width: '16em' } }, "If you're working on..."),
          t.th('Look at...'),
        ])),
        t.tbody([
          t.tr([
            t.td('A new attribute type or validation rule'),
            t.td([loc('esm/lib/render/validate.js'), '. Either attributeValueIsValid or validateAttributeByType']),
          ]),
          t.tr([
            t.td('HTML output formatting (indentation, encoding)'),
            t.td([loc('esm/lib/render/serialize.js'), ' + ', loc('esm/lib/render/stringify-content-array.js')]),
          ]),
          t.tr([
            t.td('DOM property vs attribute, event handler wiring'),
            t.td([loc('esm/tag-classes/content-tag.js'), '. The toElement dispatch']),
          ]),
          t.tr([
            t.td('Signal subscription semantics (.get, .set, .value)'),
            t.td([loc('esm/lib/reactive/signal.js'), '. The Signal class']),
          ]),
          t.tr([
            t.td('Effect lifecycle (pause, resume, stop, batching)'),
            t.td([loc('esm/lib/reactive/signal.js'), '. effect(), _internalEffect(), createEffect(), flush()']),
          ]),
          t.tr([
            t.td('Persist mode (pause on removal, resume on reconnect)'),
            t.td([loc('esm/lib/reactive/lifecycle.js'), '. The entire file']),
          ]),
          t.tr([
            t.td('When effects stop or connect callbacks fire'),
            t.td([loc('esm/lib/reactive/dom-tracker.js'), '. stopRemoved and fireConnected']),
          ]),
          t.tr([
            t.td('Signal-array DOM patching'),
            t.td([loc('esm/lib/reactive/reconcile.js'), '. The bidirectional pass and tagNeedsRebuild']),
          ]),
          t.tr([
            t.td('SSR or hydration behavior'),
            t.td([
              loc('esm/lib/render/hydration.js'),
              ' + the SSR mode counter in ',
              loc('esm/lib/reactive/ssr.js'),
            ]),
          ]),
          t.tr([
            t.td('A new tag-class flavor (e.g. for custom output)'),
            t.td([loc('esm/tag-classes/'), '. Extend ContentTag']),
          ]),
          t.tr([
            t.td('Generated Kensington class behavior'),
            t.td([loc('generate/build-javascript.js'), '. The template that emits esm/kensington.js']),
          ]),
        ]),
      ]),
      callout('tip', 'Before you change a tracked path',
        t.p([
          'Almost every browser test in ',
          loc('tests/browser/signals.spec.js'),
          ' exercises one of the paths above. Running ',
          t.code('npm run test-browser'),
          ' after any change to signal.js, lifecycle.js, dom-tracker.js, or reconcile.js is the fastest way to catch regressions.',
        ]),
      ),
    ]),
  ];
}
