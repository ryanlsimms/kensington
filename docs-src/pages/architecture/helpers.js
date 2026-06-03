import { t } from 'kensington';
const GITHUB = 'https://github.com/ryanlsimms/kensington/blob/signals/';

export function loc(path, lineNum) {
  const href = GITHUB + path + (lineNum ? `#L${lineNum}` : '');
  const label = path.split('/').pop();
  return t.a({ href, class: 'loc', target: '_blank', rel: 'noopener' }, [
    label,
    lineNum ? t.span({ class: 'ln' }, `:${lineNum}`) : null,
  ]);
}

export function fileCrumb(...parts) {
  const nodes = [];
  parts.forEach((part, i) => {
    if (i > 0) { nodes.push(t.span({ class: 'slash' }, '/')); }
    nodes.push(part);
  });
  return t.p({ class: 'file-crumb' }, nodes);
}

export function term(text) {
  return t.span({ class: 'term' }, text);
}

export function stageDot(n) {
  return t.span({ class: `stage-dot stage-dot-${n}`, ariaHidden: 'true' });
}

export function mermaid(src) {
  // eslint-disable-next-line kensington/no-unsafe-literal -- mermaid diagram source is trusted
  return t.unsafeLiteral(`<div class="mermaid-wrap"><pre class="mermaid">${src}</pre></div>`);
}
