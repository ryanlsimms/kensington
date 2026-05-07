export function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function attrName(name) {
  const camel = kebabToCamel(name);
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(camel) ? camel : JSON.stringify(name);
}

function splitDeclarations(css) {
  const result = [];
  let current = '';
  let inStr = null;
  for (const c of css) {
    if (inStr) {
      current += c;
      if (c === inStr) {
        inStr = null;
      }
    } else if (c === '"' || c === "'") {
      inStr = c;
      current += c;
    } else if (c === ';') {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  if (current.trim()) {
    result.push(current);
  }
  return result;
}

export function styleToCode(value) {
  const entries = [];
  for (const decl of splitDeclarations(value)) {
    const i = decl.indexOf(':');
    if (i === -1) {
      continue;
    }
    const prop = kebabToCamel(decl.slice(0, i).trim());
    const val = decl.slice(i + 1).trim();
    if (prop && val) {
      entries.push(`${prop}: ${JSON.stringify(val)}`);
    }
  }
  return entries.length ? `{ ${entries.join(', ')} }` : null;
}

export function isBlank(str) {
  return /^\s*$/.test(str);
}

// Adds `spaces` extra spaces to every line except the first.
// The first line is always placed by the caller.
export function reindent(code, spaces) {
  if (!code.includes('\n')) {
    return code;
  }
  const pad = ' '.repeat(spaces);
  return code.split('\n').map((line, i) => i === 0 ? line : (line ? pad + line : '')).join('\n');
}

export function sigChildren(node) {
  return (node.childNodes ?? []).filter(n => {
    if (n.nodeName === '#text' && isBlank(n.value)) {
      return false;
    }
    return n.nodeName !== '#documentType';
  });
}
