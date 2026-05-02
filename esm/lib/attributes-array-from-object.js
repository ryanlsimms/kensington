import he from './he.js';
import { getAttrName } from './text-utils.js';
import { styleObjectToCss } from './style-utils.js';

export default function attributesArrayFromObject(obj, { encode, attrsSet = new Map(), prefix = '' } = {}) {
  let finalArr = [];

  for (const attr in obj) {
    const val = obj[attr];
    if ([false, null, undefined].includes(val)) {
      continue;
    }
    const attrName = getAttrName(attr, prefix, attrsSet);

    if (val === true) {
      finalArr.push([attrName, '']);
      continue;
    }
    if (attr === 'style' && val?.constructor === Object) {
      const css = styleObjectToCss(val);
      if (css) {
        finalArr.push([attrName, css]);
      }
      continue;
    }
    if (val?.constructor === Object) {
      finalArr.push(...attributesArrayFromObject(val, { encode, attrsSet, prefix: attrName }));
      continue;
    }
    if (attr === 'class' && Array.isArray(val)) {
      finalArr.push([attrName, val.join(' ')]);
      continue;
    }

    if (encode) {
      finalArr.push([attrName, he.encode(val.toString())]);
    } else if (typeof val === 'function') {
      finalArr.push([attrName, val]);
    } else {
      finalArr.push([attrName, val.toString()]);
    }
  }
  return finalArr;
}
