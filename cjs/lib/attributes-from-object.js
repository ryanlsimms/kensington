'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const he = require('he');
const textUtils = require('./text-utils.js');

function attributesFromObject(obj) {
  return Object.entries(obj)
    .map(([attr, val]) => {
      if ([false, null, undefined].includes(val)) {
        return '';
      }
      const kebabAttr = textUtils.camelToKebab(attr);
      if (val === true) {
        return kebabAttr;
      }
      if (val?.constructor === Object) {
        const kebabKeys = Object.fromEntries(
          Object.entries(val).map(([k, v]) => {
            return [[kebabAttr, k].join('-'), v]
          })
        );
        return attributesFromObject(kebabKeys);
      }
      if (attr === 'class' && Array.isArray(val)) {
        return `${kebabAttr}="${val.join(' ')}"`
      }

      return `${kebabAttr}="${he.encode(val.toString())}"`;
    })
    .filter(Boolean)
    .join(' ');
}

exports.default = attributesFromObject;
