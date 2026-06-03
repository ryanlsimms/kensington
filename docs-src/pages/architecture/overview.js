import { t } from 'kensington';

import { headerGithubLink } from '../../components/ui.js';
import { loc, term } from './helpers.js';

export function architectureOverview() {
  return [
    t.header([
      headerGithubLink(),
      t.h1('Architecture'),
      t.p([
        'A complete trace of what happens from ',
        t.code('t.div(...)'),
        ' through DOM teardown. Every signal subscription, every cleanup hook, every step of the pipeline.',
      ]),
    ]),

    t.section({ id: 'introduction' }, [
      t.h2('Introduction'),
      t.p([
        'This document is the deep-dive companion to the source code. It traces what happens during the life of a Kensington tag instance, from the moment ',
        t.code('t.div(...)'),
        ' is called until the resulting DOM node and its signal subscriptions are torn down.',
      ]),
      t.p("You don't need to read this to use Kensington. Read it if you're:"),
      t.ul({ class: 'feature-list' }, [
        t.li('Hunting a bug in the reactive system'),
        t.li('Adding a new tag-class variant or rendering mode'),
        t.li('Designing an integration that needs to understand cleanup semantics'),
        t.li([
          'Curious how a small library supports signals, SSR, hydration, ',
          'and reconciliation in roughly 1 200 lines of hand-written source',
        ]),
      ]),
      t.p([
        'Throughout this page, source references appear as ',
        loc('esm/lib/reactive/signal.js'),
        '. Click to open the file on GitHub. Line numbers are approximate and may drift as the code evolves.',
      ]),
    ]),

    t.section({ id: 'concepts' }, [
      t.h2('Concepts at a glance'),
      t.p(`If you've never read the source, these are the seven moving parts you'll see referenced throughout. Each links to the section that explains it in full.`),
      t.table([
        t.thead(t.tr([
          t.th({ style: { width: '12em' } }, 'Concept'),
          t.th('What it is'),
          t.th('Lives in'),
        ])),
        t.tbody([
          t.tr([
            t.td(term('Tag instance')),
            t.td([
              'The object returned by ',
              t.code('t.div(...)'),
              '. Holds attributes, content, namespace, and lifecycle callback arrays. Two output methods: ',
              t.code('toString()'),
              ' and ',
              t.code('toElement()'),
              '.',
            ]),
            t.td(loc('esm/tag-classes/content-tag.js')),
          ]),
          t.tr([
            t.td(term('Signal')),
            t.td([
              'A reactive value container. ',
              t.code('.get()'),
              ' subscribes the current effect; ',
              t.code('.set()'),
              ' schedules every subscriber. ',
              t.code('.value'),
              ' reads without subscribing.',
            ]),
            t.td(loc('esm/lib/reactive/signal.js')),
          ]),
          t.tr([
            t.td(term('effect')),
            t.td([
              'A closure that re-runs whenever any signal it reads changes. Exposes ',
              t.code('pause'),
              ', ',
              t.code('resume'),
              ', ',
              t.code('stop'),
              '.',
            ]),
            t.td(loc('esm/lib/reactive/signal.js')),
          ]),
          t.tr([
            t.td(term('Lifecycle')),
            t.td([
              'Per-element orchestrator that owns every signal effect, the persist mechanism, ',
              'and the connect/disconnect callback chain.',
            ]),
            t.td(loc('esm/lib/reactive/lifecycle.js')),
          ]),
          t.tr([
            t.td(term('DOM tracker')),
            t.td([
              'A shared ',
              t.code('MutationObserver'),
              ' that fires stop chains on removal and connect callbacks on insertion. One per document.',
            ]),
            t.td(loc('esm/lib/reactive/dom-tracker.js')),
          ]),
          t.tr([
            t.td(term('Reconciler')),
            t.td([
              'Patches DOM in place when a signal value is an array. Matches nodes by ',
              t.code('data-key'),
              ', diffs recursively, guards for signal-managed elements.',
            ]),
            t.td(loc('esm/lib/reactive/reconcile.js')),
          ]),
          t.tr([
            t.td(term('persist mode')),
            t.td([
              'Opt-in via the ',
              t.code('persist'),
              ' tag option. Effects pause on removal and resume on reconnect. Disconnect/connect callbacks fire every cycle.',
            ]),
            t.td(loc('esm/lib/reactive/lifecycle.js')),
          ]),
        ]),
      ]),
      t.div({ class: 'callout key' }, [
        t.div({ class: 'callout-title' }, 'The mental model in three sentences'),
        t.p([
          'Every tag is a plain object that becomes a string or an element on demand. When it becomes an element, a ',
          term('Lifecycle'),
          ' wires every signal-driven value into an effect bound to that element via ',
          t.code('WeakRef'),
          '. A document-wide ',
          term('MutationObserver'),
          ' watches for that element\'s removal and tears the effects down, or pauses them if persist is on.',
        ]),
      ]),
    ]),
  ];
}
