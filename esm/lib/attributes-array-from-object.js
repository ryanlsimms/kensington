import he from './he.js';
import { styleObjectToCss } from './style-utils.js';
import { getAttrName } from './text-utils.js';

export default function attributesArrayFromObject(obj, { attrsSet = new Map(), encode, prefix = '' } = {}) {
  const result = [];

  for (const attr of Object.keys(obj)) {
    const val = obj[attr];
    if ([false, null, undefined].includes(val)) {
      continue;
    }
    const attrName = getAttrName(attr, prefix, attrsSet);

    if (val === true) {
      result.push([attrName, '']);
      continue;
    }
    if (attr === 'style' && val?.constructor === Object) {
      const css = styleObjectToCss(val);
      if (css) {
        result.push([attrName, css]);
      }
      continue;
    }
    if (val?.constructor === Object) {
      result.push(...attributesArrayFromObject(val, { attrsSet, encode, prefix: attrName }));
      continue;
    }
    if (attr === 'class' && Array.isArray(val)) {
      result.push([attrName, val.join(' ')]);
      continue;
    }

    if (typeof val === 'function') {
      result.push([attrName, val]);
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
