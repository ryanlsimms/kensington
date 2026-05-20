const NUMERIC_TYPES = new Set([
  'number',
  'integer',
  'length',
  'length-percentage',
  'percentage',
  'opacity-value',
  'alpha-value',
  'line-width',
  'angle-percentage',
  'font-weight-absolute',
]);

// CSS properties absent from @webref/css but used as SVG presentation attributes.
const SVG_ONLY_SUPPLEMENTS = new Map([
  ['color-rendering', {
    value: "['auto', 'optimizeSpeed', 'optimizeQuality']",
    type: '"auto" | "optimizeSpeed" | "optimizeQuality"',
  }],
]);

export const svgOnlySupplementNames = [...SVG_ONLY_SUPPLEMENTS.keys()];

function buildTypeMap(cssTypes) {
  const map = new Map();
  for (const t of (cssTypes ?? [])) {
    if (!t.syntax) {
      continue;
    }
    const name = t.name.replace(/^<|>$/g, '');
    map.set(name, t.syntax);
  }
  return map;
}

function buildHasNumericType(propMap) {
  return function hasNumericType(syntax) {
    for (const [, name] of syntax.matchAll(/<([a-z][a-z0-9-]*)[\s[\]>]/g)) {
      if (NUMERIC_TYPES.has(name)) {
        return true;
      }
    }
    if (syntax.includes('||') || syntax.includes('&&')) {
      return false;
    }
    for (const [, propName] of syntax.matchAll(/<'([^']+)'>/g)) {
      const ref = propMap.get(propName);
      if (!ref || ref.includes("<'")) {
        continue;
      }
      for (const [, name] of ref.matchAll(/<([a-z][a-z0-9-]*)[\s[\]>]/g)) {
        if (NUMERIC_TYPES.has(name)) {
          return true;
        }
      }
    }
    return false;
  };
}

function extractKeywords(syntax, typeMap, propMap) {
  // Resolve property references one level deep, but only if the target is a pure keyword list.
  let resolved = syntax.replace(/<'([^']+)'>/g, (match, name) => {
    const def = propMap?.get(name);
    if (!def || def.includes("<'") || /<[a-z]/.test(def)) {
      return match;
    }
    return `( ${def} )`;
  });
  // If unresolved property references remain, bail.
  if (/<'/.test(resolved)) {
    return null;
  }
  // Resolve named type references one level deep.
  resolved = resolved.replace(/<([a-z][a-z0-9-]*)>/g, (match, name) => {
    const def = typeMap.get(name);
    return def ? `( ${def} )` : match;
  });
  // If unresolved type refs remain after substitution, bail.
  if (/<[a-z]/.test(resolved)) {
    return null;
  }
  const keywords = [...new Set(
    resolved
      .replace(/[[\]|?+*#,{}/&]/g, ' ')
      .split(/\s+/)
      .filter(t => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(t)),
  )];
  return keywords.length >= 2 ? keywords : null;
}

export default function parseCssPropertyTypes(properties, cssTypes) {
  const propMap = new Map(properties.map(p => [p.name, p.syntax ?? '']));
  const typeMap = buildTypeMap(cssTypes);
  const hasNumericType = buildHasNumericType(propMap);
  const result = new Map();

  for (const [name, syntax] of propMap) {
    if (!syntax) {
      continue;
    }
    if (hasNumericType(syntax)) {
      result.set(name, { value: '[Number,String]', type: 'number | string' });
    } else {
      const keywords = extractKeywords(syntax, typeMap, propMap);
      if (keywords) {
        result.set(name, {
          value: `['${keywords.join("', '")}']`,
          type: keywords.map(k => `"${k}"`).join(' | '),
        });
      }
    }
  }

  for (const [name, entry] of SVG_ONLY_SUPPLEMENTS) {
    if (!result.has(name)) {
      result.set(name, entry);
    }
  }

  return result;
}
