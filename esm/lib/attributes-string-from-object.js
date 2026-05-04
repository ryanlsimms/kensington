import he from './he.js';
import { styleObjectToCss } from './style-utils.js';
import { getAttrName } from './text-utils.js';

export default function attributesStringFromObject(obj, { attrsSet = new Map(), encode, prefix = '' } = {}) {
  let finalStr = '';

  for (const attr of Object.keys(obj)) {
    const val = obj[attr];
    if ([false, null, undefined].includes(val)) {
      continue;
    }
    const attrName = getAttrName(attr, prefix, attrsSet);

    if (val === true) {
      if (finalStr) { finalStr += ' '; }
      finalStr += attrName;
      continue;
    }
    if (attr === 'style' && val?.constructor === Object) {
      const css = styleObjectToCss(val);
      if (!css) { continue; }
      if (finalStr) { finalStr += ' '; }
      finalStr += `${attrName}="${css}"`;
      continue;
    }
    if (val?.constructor === Object) {
      if (finalStr) { finalStr += ' '; }
      finalStr += attributesStringFromObject(val, { attrsSet, encode, prefix: attrName });
      continue;
    }
    if (attr === 'class' && Array.isArray(val)) {
      if (finalStr) { finalStr += ' '; }
      finalStr += attrName;
      finalStr += '="';
      finalStr += val.join(' ');
      finalStr += '"';
      continue;
    }

    if (finalStr) { finalStr += ' '; }
    finalStr += attrName;
    finalStr += '="';
    if (encode) {
      finalStr += he.encode(val.toString());
    } else {
      finalStr += val.toString();
    }
    finalStr += '"';
  }
  return finalStr;
}
