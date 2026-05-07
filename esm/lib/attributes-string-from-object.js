import he from './he.js';
import { styleObjectToCss } from './style-utils.js';
import { getAttrName } from './text-utils.js';

export default function attributesStringFromObject(obj, options = {}) {
  const { attrsSet = new Map(), encode, prefix = '', seen = new WeakSet() } = options;
  let result = '';

  for (const attr of Object.keys(obj)) {
    if (!attr.trim()) {
      continue;
    }
    const val = obj[attr];
    if ([false, null, undefined].includes(val) || (typeof val === 'number' && !isFinite(val))) {
      continue;
    }
    const attrName = getAttrName(attr, prefix, attrsSet);

    if (val === true) {
      if (result) { result += ' '; }
      result += attrName;
      continue;
    }
    if (attr === 'style' && val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const css = styleObjectToCss(val);
      if (css) {
        if (result) { result += ' '; }
        result += `${attrName}="${css}"`;
      }
      continue;
    }
    if (attr === 'class' && Array.isArray(val)) {
      const classes = val
        .filter(v => (typeof v === 'string' && v !== '') || (typeof v === 'number' && isFinite(v)))
        .join(' ');
      if (classes) {
        if (result) { result += ' '; }
        result += `${attrName}="${classes}"`;
      }
      continue;
    }
    if (Array.isArray(val) || (attr === 'class' && val !== null && typeof val === 'object')) {
      continue;
    }
    if (val !== null && typeof val === 'object') {
      if (seen.has(val)) {
        continue;
      }
      seen.add(val);
      const nested = attributesStringFromObject(val, { attrsSet, encode, prefix: attrName, seen });
      if (nested) {
        if (result) { result += ' '; }
        result += nested;
      }
      continue;
    }
    if (typeof val === 'function') {
      continue;
    }

    if (result) { result += ' '; }
    result += attrName;
    result += '="';
    if (encode) {
      result += he.encode(val.toString());
    } else {
      result += val.toString();
    }
    result += '"';
  }
  return result;
}
