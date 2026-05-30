const GITHUB = 'https://github.com/ryanlsimms/kensington/blob/signals/';

export function loc(t, path, lineNum) {
  const href = GITHUB + path + (lineNum ? `#L${lineNum}` : '');
  const label = path.split('/').pop();
  return t.a({ href, class: 'loc', target: '_blank', rel: 'noopener' }, [
    label,
    lineNum ? t.span({ class: 'ln' }, `:${lineNum}`) : null,
  ]);
}

export function fileCrumb(t, ...parts) {
  const nodes = [];
  parts.forEach((part, i) => {
    if (i > 0) { nodes.push(t.span({ class: 'slash' }, '/')); }
    nodes.push(part);
  });
  return t.p({ class: 'file-crumb' }, nodes);
}

export function term(t, text) {
  return t.span({ class: 'term' }, text);
}

export function stageDot(t, n) {
  return t.span({ class: `stage-dot stage-dot-${n}`, ariaHidden: 'true' });
}

export function mermaid(t, src) {
  return t.unsafeLiteral(`<div class="mermaid-wrap"><pre class="mermaid">${src}</pre></div>`);
}
