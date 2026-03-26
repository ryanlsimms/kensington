import he from 'he';
import { camelToKebab } from './text-utils.js';

export default function attributesFromObject(obj, attributesList = []) {
  let finalStr = '';

  for (const attr in obj) {
    const val = obj[attr];
    if ([false, null, undefined].includes(val)) {
      continue;
    }
    let attrName = attr;
    if (!attributesList.includes(attr)) {
      attrName = camelToKebab(attr)
    }

    if (val === true) {
      if (finalStr) { finalStr+= ' '; }
      finalStr += attrName
      continue;
    }
    if (val?.constructor === Object) {
      const kebabKeys = Object.fromEntries(
        Object.entries(val).map(([k, v]) => {
          return [[attrName, k].join('-'), v]
        })
      )
      if (finalStr) { finalStr+= ' '; }
      finalStr += attributesFromObject(kebabKeys);
      continue
    }
    if (attr === 'class' && Array.isArray(val)) {
      if (finalStr) { finalStr+= ' '; }
      finalStr+= attrName;
      finalStr+= '="';
      finalStr+= val.join(' ');
      finalStr+= '"';
      continue
    }

    if (finalStr) { finalStr+= ' '; }
    finalStr += `${attrName}="${he.encode(val.toString())}"`;
  }
  return finalStr;
}
