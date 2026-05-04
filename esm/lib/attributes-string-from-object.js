import he from './he.js';
import { styleObjectToCss } from './style-utils.js';
import { getAttrName } from './text-utils.js';

export default function attributesStringFromObject(obj, { attrsSet = new Map(), encode, prefix = '' } = {}) {
  let result = '';

  for (const attr of Object.keys(obj)) {
    const val = obj[attr];
    if ([false, null, undefined].includes(val)) {
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
    if (val?.constructor === Object) {
      if (result) { result += ' '; }
      result += attributesStringFromObject(val, { attrsSet, encode, prefix: attrName });
      continue;
    }
    if (attr === 'class' && Array.isArray(val)) {
      if (result) { result += ' '; }
      result += attrName;
      result += '="';
      result += val.join(' ');
      result += '"';
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
