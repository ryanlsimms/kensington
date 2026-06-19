import { t } from 'kensington';

import { callout } from '../../components/ui.js';
import { loc, mermaid } from './helpers.js';

export function architectureRemoval() {
  return [
    t.section({ id: 'removal', class: 'stage stage-5' }, [
      t.h2('Removal Flow'),
      t.p([
        'An element is removed when something calls ',
        t.code('element.remove()'),
        ', ',
        t.code('parent.removeChild(element)'),
        ', ',
        t.code('parent.replaceChildren(...)'),
        ', etc. The browser fires a mutation record. The shared MutationObserver picks it up.',
      ]),
      mermaid(`sequenceDiagram
  participant U as User code
  participant B as Browser
  participant Mo as MutationObserver
  participant T as DOM tracker
  participant L as Lifecycle stops
  participant S as Signals

  U->>B: element.remove()
  B->>Mo: MutationRecord (removedNodes)
  Mo->>T: stopRemoved(node)
  T->>T: visit(node, fn)
  Note over T: For node itself AND any tracked descendants
  T->>T: clearStop(entry, el)
  T->>L: stop()
  Note over L: pauseOrStop for each effect, then onCleared, then disconnectCallbacks
  L->>S: eff.stop() or eff.pause()
  Note over S: Drains _cleanups, removes from subscribers`),
      t.ol({ class: 'numbered' }, [
        t.li([
          t.strong('Browser fires the MutationRecord.'),
          ' removedNodes contains the directly-removed node. ',
          'The tracked element may be that node or a descendant.',
        ]),
        t.li([
          t.strong('stopRemoved(node).'),
          ' Calls visit(node, fn) which finds the tracked entry for the node or any tracked descendant.',
        ]),
        t.li([
          t.strong('clearStop(entry, el).'),
          ' Deletes entry.stop. If not persisted, also deletes connect and persist. ',
          'If both halves are gone, removes the entry entirely.',
        ]),
        t.li([
          t.strong('The captured stop function runs.'),
          ' This is the chained closure built via trackForStop and every addOnStop.',
        ]),
        t.li([
          t.strong('For each signal effect: eff.pause() or eff.stop().'),
          ' Driven by the persist flag. ',
          'pause() drains _cleanups (unsubscribing from each Signal); stop() does the same and sets destroyed.',
        ]),
        t.li([t.strong('onCleared runs.'), ' Resets the tag\'s #domElement cache to null.']),
        t.li([t.strong('Each user disconnect callback runs.'), ' In registration order.']),
      ]),
      callout('warn', 'Removal vs stopTracked()',
        t.p([
          'The removal path above is triggered automatically by the MutationObserver. ',
          t.code('stopTracked(el)'),
          ' at ',
          loc('esm/lib/reactive/dom-tracker.js'),
          ' does the same teardown synchronously without waiting for a mutation record. The reconciler calls this on discarded fresh nodes before returning to the caller.',
        ]),
      ),
    ]),

    t.section({ id: 'persist', class: 'stage stage-4' }, [
      t.h2('Persist Mode'),
      t.p([
        'By default, removal is permanent. Effects stop, the tag\'s ',
        t.code('#domElement'),
        ' cache clears, and disconnect callbacks fire. If the element is re-inserted later, the effects are gone and the signal subscriptions must be rebuilt by calling ',
        t.code('toElement()'),
        ' again.',
      ]),
      callout('note', 'Stale-subtree detection',
        t.p([
          'A tag with no signal effects of its own does not register a stop chain, so its ',
          t.code('#domElement'),
          ' cache survives removal even though descendant effects were stopped. The next ',
          t.code('toElement()'),
          ' call walks the static content tree via ',
          t.code('#hasStaleDescendantBindings()'),
          ' (see ',
          loc('esm/tag-classes/content-tag.js'),
          '). If any descendant tag reports a stopped binding, the cache is dropped and the subtree is rebuilt with fresh effects. ',
          t.code('ContentTag'),
          ' and ',
          t.code('CommentTag'),
          ' detect this via their nulled ',
          t.code('#domElement'),
          '. ',
          t.code('LiteralTag'),
          ' tracks a flag flipped by its anchor\'s stop callback.',
        ]),
      ),
      t.p([
        'The ',
        t.code('persist'),
        ' tag option changes this. Effects pause instead of stop. The tag\'s ',
        t.code('#domElement'),
        ' restores when the element returns. The disconnect-callback chain rebuilds so it fires on every cycle, not just the first.',
      ]),
      t.p([
        'This is the pattern for elements that move between containers without losing identity: ',
        'tabs that swap, modals that hide and reshow, custom elements whose connectedCallback fires multiple times.',
      ]),
      mermaid(`sequenceDiagram
  participant U as User code
  participant E as Element
  participant Mo as MutationObserver
  participant L as Lifecycle
  participant Sg as Signals

  Note over E,L: Initial render with persist:true
  U->>E: parent.append(element)
  Mo->>L: fireConnected, first connect cb run

  Note over E: Signal updates, effects re-run normally
  U->>Sg: signal.set(v)
  Sg->>L: scheduled effect runs

  Note over E,L: First removal
  U->>E: parent.removeChild(element)
  Mo->>L: stopRemoved, each eff.pause()
  L->>L: onCleared, disconnectCallbacks
  L->>L: reFireAndRegister installs new stop chain

  Note over E,L: Re-insertion
  U->>E: parent.append(element)
  Mo->>L: fireConnected
  L->>L: onReconnect, eff.resume() for each effect
  L->>L: addOnStop(eff.pause) re-arm for next removal
  L->>L: connect callbacks fire again`),

      t.h3('The persist invariants'),
      t.ol({ class: 'numbered' }, [
        t.li([
          t.strong("Pause, don't stop."),
          ' Every signal effect is captured in resumables. On removal, pauseOrStop picks pause(). ',
          'The effect closure still exists, just unsubscribed.',
        ]),
        t.li([
          t.strong('Disconnect callbacks re-arm.'),
          ' reFireAndRegister installs a fresh stop chain after each removal so the next removal fires them again.',
        ]),
        t.li([
          t.strong('Reconnect resumes.'),
          ' eff.resume() calls run(), which re-tracks subscriptions and applies the current signal value. ',
          'Any updates that happened during the gap are visible immediately.',
        ]),
        t.li([
          t.strong('Resume wires its own pause.'),
          ' Right after eff.resume(), the lifecycle adds () => eff.pause() to the new stop chain. ',
          'The cycle continues.',
        ]),
        t.li([t.strong('Connect callbacks fire every cycle.'), ' On first insertion and on every reconnect.']),
      ]),

      t.h3('persist: false vs. persist: true'),
      t.table([
        t.thead(t.tr([
          t.th(''),
          t.th('persist: false'),
          t.th('persist: true'),
        ])),
        t.tbody([
          t.tr([t.td('On removal: effects'), t.td('eff.stop(). Permanent'), t.td('eff.pause(). Temporary')]),
          t.tr([t.td('On removal: connect entry'), t.td('Deleted from entries map'), t.td('Survives in entries map')]),
          t.tr([
            t.td('On removal: disconnect callbacks'),
            t.td('Fire once total'),
            t.td('Fire on every removal cycle'),
          ]),
          t.tr([t.td('On reinsert: connect callbacks'), t.td('Do not fire (entry gone)'), t.td('Fire every cycle')]),
          t.tr([
            t.td('On reinsert: signal state'),
            t.td('Subscriptions gone; tag must be rebuilt'),
            t.td('eff.resume() reconnects with current value'),
          ]),
          t.tr([
            t.td('Memory footprint'),
            t.td('Lower. resumables is null'),
            t.td('Higher. Effects and chain survive'),
          ]),
        ]),
      ]),
      callout('key', 'When NOT to use persist',
        t.p([
          'If connectedCallback creates a fresh element each time (the common Web Components pattern), persist is wrong. The old paused effects become orphaned when the new element replaces them. Use ',
          t.code('persist: true'),
          ' only when you hold the same DOM node across reconnections.',
        ]),
      ),
    ]),
  ];
}
