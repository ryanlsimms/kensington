import { code } from '../../components/ui.js';
import { devtoolsMock } from '../../components/devtools-mock.js';

export function reactivityDevtools(t) {
  return t.section({ id: 'devtools' }, [
    t.h2('Devtools'),
    t.p([
      'Kensington ships a devtools overlay for inspecting signals, computed signals, effects, and DOM bindings at runtime. It is a floating panel that can be toggled with a button in the bottom-right corner of the page.',
    ]),

    t.h3({ id: 'devtools-setup' }, 'Setup'),
    t.p([
      'Call ',
      t.code('enableDevtools()'),
      ' before creating any signals. The panel mounts itself automatically the first time it is called.',
    ]),
    code(t, 'javascript', `import { enableDevtools, signal, t } from 'kensington';

enableDevtools();

const count = signal(0);`),
    t.p([
      'Or import ',
      t.code('kensington/devtools'),
      ', which calls ',
      t.code('enableDevtools()'),
      ' and mounts the panel in one step. Wrap it in your bundler\'s dev-only guard so it tree-shakes out of production builds.',
    ]),
    code(t, 'javascript', `// Vite
if (import.meta.env.DEV) {
  await import('kensington/devtools');
}

// webpack / esbuild / Parcel
if (process.env.NODE_ENV !== 'production') {
  await import('kensington/devtools');
}

// No-build (plain script tags, import maps)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  await import('kensington/devtools');
}`),
    t.p([
      t.code('enableDevtools()'),
      ' is a no-op in non-browser environments, so it is safe to call unconditionally in isomorphic code. A warning is logged if it is called inside a Node.js context.',
    ]),

    t.h3({ id: 'devtools-panel' }, 'Panel'),
    devtoolsMock(t),
    t.p([
      'The panel has five tabs.',
    ]),
    t.ul([
      t.li([
        t.strong('Signals.'),
        ' One row per ',
        t.code('signal()'),
        ' call. Shows the current value, set count, DOM visibility state, and subscriber count. Click a row to scroll the bound element into view. Click a value to edit it live. Hover a value to see the full JSON.',
      ]),
      t.li([
        t.strong('Computed.'),
        ' Same view for ',
        t.code('computed()'),
        ' signals. Values are read-only. Shows sleeping state when a computed has no active subscribers.',
      ]),
      t.li([
        t.strong('Effects.'),
        ' One row per ',
        t.code('effect()'),
        ' call. Shows state (active, paused), run count, dependency count, and the effect function source. Hover the function column to see the full source. Hover the dep count to see which signals the effect reads.',
      ]),
      t.li([
        t.strong('DOM.'),
        ' One row per signal-to-DOM binding (a signal used in an attribute, content, or ',
        t.code('prop'),
        ' key). Shows the bound element, binding label, and run count. Hover a row to highlight the element on the page.',
      ]),
      t.li([
        t.strong('Log.'),
        ' A timestamped feed of all signal, effect, and DOM binding events capped at 100 entries. Hover an event row to see the effect function source or the full signal value.',
      ]),
    ]),
    t.p([
      'The filter input in each tab narrows rows by ID, value, label, or state. Hovering a signal row highlights its bound elements on the page with a temporary outline.',
    ]),
  ]);
}
