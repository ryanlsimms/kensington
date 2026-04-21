import { camelToKebab } from './text-utils.js';

export default function attributesArrayFromObject(obj, attributesList = [], encode) {
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
      finalArr.push(...attributesArrayFromObject(kebabKeys, attributesList, encode));
      continue;
    }
    if (attr === 'class' && Array.isArray(val)) {
      finalArr.push([attrName, val.join(' ')])
      continue;
    }

    if (encode) {
      finalArr.push([attrName, he.encode(val.toString())]);
    } else {
      finalArr.push([attrName, val.toString()]);
    }

  }
  return finalArr;
}
