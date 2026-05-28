import { githubLink } from '../../components/ui.js';
import { basicsAdvanced } from './advanced.js';
import { basicsBuildingHtml } from './building-html.js';
import { basicsDom } from './dom.js';
import { basicsHeader } from './header.js';
import { basicsQuickStart } from './quick-start.js';
import { basicsSignals } from './signals.js';
import { basicsTooling } from './tooling.js';
import { basicsTypescript } from './typescript.js';
import { basicsWhy } from './why.js';

export function basicsSidebar(t) {
  return [
    t.ul([
      t.li(t.a({ href: '#quick-start' }, 'Quick start')),
      t.li(t.a({ href: '#why' }, 'Why Kensington?')),
      t.li([
        t.a({ href: '#building-html' }, 'Building HTML'),
        t.ul([
          t.li(t.a({ href: '#elements-and-content' }, 'Elements & content')),
          t.li(t.a({ href: '#lists' }, 'Rendering lists')),
          t.li(t.a({ href: '#conditionals' }, 'Conditionals')),
          t.li(t.a({ href: '#components' }, 'Components & reuse')),
        ]),
      ]),
      t.li(t.a({ href: '#dom' }, 'Browser DOM')),
      t.li(t.a({ href: '#signals' }, 'Reactive Data')),
      t.li(t.a({ href: '#typescript' }, 'TypeScript')),
    ]),
    t.div({ class: 'sidebar-title' }, 'Tooling'),
    t.ul([
      t.li(t.a({ href: '#cli' }, 'HTML → Kensington')),
      t.li(t.a({ href: '#ide-plugins' }, 'IDE plugins')),
      t.li(t.a({ href: '#eslint-plugin' }, 'ESLint plugin')),
      t.li(t.a({ href: '#devtools-panel' }, 'DevTools panel')),
      t.li(t.a({ href: '#server-packages' }, 'Server packages')),
      t.li(t.a({ href: '#ai-assistants' }, 'AI assistants')),
    ]),
    t.div({ class: 'sidebar-title' }, 'Advanced'),
    t.ul([
      t.li(t.a({ href: '#options' }, 'Attributes & options')),
      t.li([
        t.a({ href: '#dev-vs-prod' }, 'Dev vs production'),
        t.ul([
          t.li(t.a({ href: '#dev-validation' }, 'Validation in dev')),
          t.li(t.a({ href: '#prod-slim' }, 'Slim build for prod')),
          t.li(t.a({ href: '#vite' }, 'Wiring it up with Vite')),
        ]),
      ]),
      t.li(t.a({ href: '#constructor' }, 'Constructor options')),
      t.li(t.a({ href: '#validation' }, 'Validation')),
      t.li(t.a({ href: '#custom-elements' }, 'Custom elements')),
      t.li(t.a({ href: '#persist' }, 'Persist effects')),
      t.li(t.a({ href: '#raw-html' }, 'Raw HTML & comments')),
    ]),
    githubLink(t),
  ];
}

export function basicsContent(t) {
  return [
    basicsHeader(t),
    basicsQuickStart(t),
    basicsWhy(t),
    basicsBuildingHtml(t),
    basicsDom(t),
    basicsSignals(t),
    basicsTypescript(t),
    basicsTooling(t),
    ...basicsAdvanced(t),
  ];
}
