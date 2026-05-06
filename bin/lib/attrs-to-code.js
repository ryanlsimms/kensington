import { attrName, kebabToCamel, styleToCode } from './html-utils.js';

const allAttributes = await import('../../esm/attributes.js');

const BOOLEAN_ATTRS = new Set(
  Object.values(allAttributes)
    .flatMap(obj => (obj && typeof obj === 'object' ? Object.entries(obj) : []))
    .filter(([, type]) => type === Boolean)
    .map(([name]) => name),
);

export function attrsToCode(attrs, maxLen) {
  if (!attrs.length) {
    return null;
  }

  // Group attrs by their first hyphen segment to enable nested notation.
  // Map preserves insertion order so attrs appear in their original sequence.
  const slots = new Map();
  for (const attr of attrs) {
    const hyphen = attr.name.indexOf('-');
    if (hyphen === -1) {
      slots.set(`solo:${attr.name}`, { type: 'solo', attr });
    } else {
      const prefix = attr.name.slice(0, hyphen);
      const key = `group:${prefix}`;
      if (!slots.has(key)) {
        slots.set(key, { type: 'group', prefix, members: [] });
      }
      slots.get(key).members.push(attr);
    }
  }

  const pairs = [];
  for (const slot of slots.values()) {
    if (slot.type === 'solo') {
      const { name, value } = slot.attr;
      if (name === 'style') {
        const styleCode = styleToCode(value);
        if (styleCode) {
          pairs.push(`style: ${styleCode}`);
        }
      } else if (BOOLEAN_ATTRS.has(name) && value === '') {
        pairs.push(`${attrName(name)}: true`);
      } else {
        pairs.push(`${attrName(name)}: ${JSON.stringify(value)}`);
      }
    } else {
      const { prefix, members } = slot;
      if (members.length >= 2) {
        const innerPairs = members.map(({ name, value }) => {
          const key = kebabToCamel(name.slice(prefix.length + 1));
          if (BOOLEAN_ATTRS.has(name) && value === '') {
            return `${key}: true`;
          }
          return `${key}: ${JSON.stringify(value)}`;
        });
        pairs.push(`${prefix}: { ${innerPairs.join(', ')} }`);
      } else {
        const { name, value } = members[0];
        if (BOOLEAN_ATTRS.has(name) && value === '') {
          pairs.push(`${attrName(name)}: true`);
        } else {
          pairs.push(`${attrName(name)}: ${JSON.stringify(value)}`);
        }
      }
    }
  }

  if (!pairs.length) {
    return null;
  }
  const inline = `{ ${pairs.join(', ')} }`;
  return inline.length <= maxLen ? inline : `{\n  ${pairs.join(',\n  ')},\n}`;
}
