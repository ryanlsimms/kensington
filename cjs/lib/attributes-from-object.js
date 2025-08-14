'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const he = require('he');
const textUtils = require('./text-utils.js');

function attributesFromObject(obj, attributesList = []) {
  return Object.entries(obj)
    .map(([attr, val]) => {
      if ([false, null, undefined].includes(val)) {
        return '';
      }
      let attrName = attr;
      if (!attributesList.includes(attr)) {
        attrName = textUtils.camelToKebab(attr);
      }

      if (val === true) {
        return attrName;
      }
      if (val?.constructor === Object) {
        const kebabKeys = Object.fromEntries(
          Object.entries(val).map(([k, v]) => {
            return [[attrName, k].join('-'), v]
          })
        );
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

exports.default = attributesFromObject;
