import he from './he.js';
import { styleObjectToCss } from './style-utils.js';
import { getAttrName } from './text-utils.js';

export default function attributesArrayFromObject(obj, { attrsSet = new Map(), encode, prefix = '' } = {}) {
  const result = [];

  for (const attr of Object.keys(obj)) {
    const val = obj[attr];
    if ([false, null, undefined].includes(val) || (typeof val === 'number' && !isFinite(val))) {
      continue;
    }
    const attrName = getAttrName(attr, prefix, attrsSet);

    if (val === true) {
      result.push([attrName, '']);
      continue;
    }
    if (attr === 'style' && val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const css = styleObjectToCss(val);
      if (css) {
        result.push([attrName, css]);
      }
      continue;
    }
    if (attr === 'class' && Array.isArray(val)) {
      const classes = val
        .filter(v => (typeof v === 'string' && v !== '') || (typeof v === 'number' && isFinite(v)))
        .join(' ');
      if (classes) {
        result.push([attrName, classes]);
      }
      continue;
    }
    if (Array.isArray(val) || (attr === 'class' && val !== null && typeof val === 'object')) {
      continue;
    }
    if (val !== null && typeof val === 'object') {
      result.push(...attributesArrayFromObject(val, { attrsSet, encode, prefix: attrName }));
      continue;
    }
    if (typeof val === 'function') {
      if (attrName.startsWith('on')) {
        result.push([attrName, val]);
      }
      continue;
    }
    if (encode) {
      result.push([attrName, he.encode(val.toString())]);
    } else {
      result.push([attrName, val.toString()]);
    }
  }
  return result;
}
