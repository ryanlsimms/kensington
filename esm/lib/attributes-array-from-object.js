import he from 'he';
import { camelToKebab } from './text-utils.js';

export default function attributesArrayFromObject(obj, attributesList = []) {
  let finalArr = [];

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
      finalArr.push([attrName, ''])
      continue;
    }
    if (val?.constructor === Object) {
      const kebabKeys = Object.fromEntries(
        Object.entries(val).map(([k, v]) => {
          return [[attrName, k].join('-'), v]
        })
      )
      finalArr.push(...attributesArrayFromObject(kebabKeys));
      continue;
    }
    if (attr === 'class' && Array.isArray(val)) {
      finalArr.push([attrName, val.join(' ')])
      continue;
    }

    finalArr.push([attrName, he.encode(val.toString())]);
  }
  return finalArr;
}
