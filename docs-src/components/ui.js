import { renderForHydration } from '../../esm/index.js';
import { copyButton } from './copy-button.js';

export function menuIcon(t) {
  return t.svg({ width: '18', height: '18', viewBox: '0 0 18 18', fill: 'none', ariaHidden: 'true' }, [
    t.rect({ y: '2', width: '18', height: '2', rx: '1', fill: 'currentColor' }),
    t.rect({ y: '8', width: '18', height: '2', rx: '1', fill: 'currentColor' }),
    t.rect({ y: '14', width: '18', height: '2', rx: '1', fill: 'currentColor' }),
  ]);
}

export function closeMenuIcon(t) {
  return t.svg({ width: '18', height: '18', viewBox: '0 0 18 18', fill: 'none', ariaHidden: 'true' }, [
    t.path({ d: 'M2 2L16 16M16 2L2 16', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round' }),
  ]);
}

export function githubLink(t) {
  return t.div({ class: 'sidebar-footer' }, [
    t.a({ href: 'https://github.com/ryanlsimms/kensington', target: '_blank', rel: 'noopener' }, [
      t.svg({ width: '16', height: '16', viewBox: '0 0 16 16', fill: 'currentColor', ariaHidden: 'true' }, [
        t.path({ d: 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z' }),
      ]),
      'GitHub',
    ]),
  ]);
}

export function headerGithubLink(t) {
  return t.a({ href: 'https://github.com/ryanlsimms/kensington', class: 'header-github', target: '_blank', rel: 'noopener' }, [
    t.svg({ width: '16', height: '16', viewBox: '0 0 16 16', fill: 'currentColor', ariaHidden: 'true' }, [
      t.path({ d: 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z' }),
    ]),
    'GitHub',
  ]);
}

export function code(t, lang, src) {
  const escaped = src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const btn = renderForHydration(copyButton, {}).toString();
  return t.unsafeLiteral(
    `<div class="code-wrap"><pre class="language-${lang}"><code class="language-${lang}">${escaped}</code></pre>${btn}</div>`
  );
}

export function panels(t, items) {
  return t.div({ class: 'panels' },
    items.map(item => {
      const parts = [];
      if (item.label) {
        parts.push(t.div({ class: 'panel-label' }, item.label));
      }
      parts.push(item.content);
      return t.div(parts);
    })
  );
}

export function callout(t, type, title, ...content) {
  return t.div({ class: `callout ${type}` }, [
    title ? t.div({ class: 'callout-title' }, title) : null,
    ...content,
  ]);
}

export function exLink(t, href, text) {
  return t.a({ href, class: 'example-link' }, text + ' →');
}

export function ideMock(t, opts) {
  const { filename, lines, popup, completion } = opts;
  const editorLines = Array.isArray(lines) ? lines : [lines];
  return t.div({ class: 'ide-mock', 'aria-hidden': 'true' }, [
    t.div({ class: 'ide-titlebar' }, [
      t.span({ class: 'ide-dot ide-dot-red' }),
      t.span({ class: 'ide-dot ide-dot-yellow' }),
      t.span({ class: 'ide-dot ide-dot-green' }),
      t.span({ class: 'ide-filename' }, filename),
    ]),
    t.div({ class: 'ide-editor' },
      editorLines.map((line, i) => t.div({ class: 'ide-line' }, [
        t.span({ class: 'ide-ln' }, String(i + 1)),
        t.literal(line),
      ]))
    ),
    popup ? t.div({ class: 'ide-popup' }, [
      t.div({ class: 'ide-popup-msg' }, [
        popup.type === 'error'
          ? t.span({ class: 'ide-error-icon' }, t.svg({ viewBox: '0 0 16 16', width: '13', height: '13', fill: 'none', ariaHidden: 'true' }, [
              t.circle({ cx: '8', cy: '8', r: '6.5', stroke: '#f14c4c', strokeWidth: '1.5' }),
              t.path({ d: 'M8 4.5v3.5M8 10.5v.5', stroke: '#f14c4c', strokeWidth: '1.5', strokeLinecap: 'round' }),
            ]))
          : t.span({ class: 'ide-warn-icon' }, t.svg({ viewBox: '0 0 16 16', width: '13', height: '13', fill: 'none', ariaHidden: 'true' }, [
              t.path({ d: 'M8 1.5L1 14.5h14L8 1.5z', stroke: '#e2c08d', strokeWidth: '1.5', strokeLinejoin: 'round' }),
              t.path({ d: 'M8 6v3.5M8 11.5v.5', stroke: '#e2c08d', strokeWidth: '1.5', strokeLinecap: 'round' }),
            ])),
        t.span({ class: 'ide-ts-code' }, popup.code),
        t.span(t.literal(popup.message)),
      ]),
      popup.type ? t.div({ class: 'ide-popup-type' }, t.literal(popup.typeContent)) : null,
    ]) : null,
    completion ? t.div({ class: 'ide-completion' },
      completion.map((item, i) => t.div({
        class: i === 0 ? 'ide-completion-item ide-completion-selected' : 'ide-completion-item',
      }, [
        t.span(item.name),
        t.span({ class: 'ide-completion-source' }, item.source),
      ]))
    ) : null,
  ]);
}
