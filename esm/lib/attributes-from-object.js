import he from 'he';
import { camelToKebab } from './text-utils.js';

export default function attributesFromObject(obj, attributesList = []) {
  return Object.entries(obj)
    .map(([attr, val]) => {
      if ([false, null, undefined].includes(val)) {
        return '';
      }
      let attrName = attr;
      if (!attributesList.includes(attr)) {
        attrName = camelToKebab(attr)
      }

      if (val === true) {
        return attrName;
      }
      if (val?.constructor === Object) {
        const kebabKeys = Object.fromEntries(
          Object.entries(val).map(([k, v]) => {
            return [[attrName, k].join('-'), v]
          })
        )
        return attributesFromObject(kebabKeys);
      }
      if (attr === 'class' && Array.isArray(val)) {
        return `${attrName}="${val.join(' ')}"`
      }

      return `${attrName}="${he.encode(val.toString())}"`;
    })
    .filter(Boolean)
    .join(' ');
}
