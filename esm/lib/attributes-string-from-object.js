import he from './he.js';
import { styleObjectToCss } from './style-utils.js';
import { getAttrName } from './text-utils.js';

export default function attributesStringFromObject(obj, { attrsSet = new Map(), encode, prefix = '' } = {}) {
  let result = '';

  for (const attr of Object.keys(obj)) {
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
    if (attr === 'style' && val?.constructor === Object) {
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
    if (Array.isArray(val) || (attr === 'class' && val?.constructor === Object)) {
      continue;
    }
    if (val?.constructor === Object) {
      const nested = attributesStringFromObject(val, { attrsSet, encode, prefix: attrName });
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
