'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const he = require('he');
const textUtils = require('./text-utils.js');

function attributesStringFromObject(obj, attributesList = [], encode) {
  let finalStr = '';

  for (const attr in obj) {
    const val = obj[attr];
    if ([false, null, undefined].includes(val)) {
      continue;
    }
    let attrName = attr;
    if (!attributesList.includes(attr)) {
      attrName = textUtils.camelToKebab(attr);
    }

    if (val === true) {
      if (finalStr) { finalStr+= ' '; }
      finalStr += attrName;
      continue;
    }
    if (val?.constructor === Object) {
      const kebabKeys = Object.fromEntries(
        Object.entries(val).map(([k, v]) => {
          return [[attrName, k].join('-'), v]
        })
      );
      if (finalStr) { finalStr+= ' '; }
      finalStr += attributesStringFromObject(kebabKeys, attributesList);
      continue;
    }
    if (attr === 'class' && Array.isArray(val)) {
      if (finalStr) { finalStr+= ' '; }
      finalStr+= attrName;
      finalStr+= '="';
      finalStr+= val.join(' ');
      finalStr+= '"';
      continue;
    }

    if (finalStr) { finalStr+= ' '; }
    finalStr += attrName;
    finalStr += '="';
    {
      finalStr += he.encode(val.toString());
    }
    finalStr += '"';
  }
  return finalStr;
}

exports.default = attributesStringFromObject;
