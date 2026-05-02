'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const he = require('./he.js');
const textUtils = require('./text-utils.js');

function attributesStringFromObject(obj, { encode, attrsSet = new Map(), prefix = '' } = {}) {
  let finalStr = '';

  for (const attr in obj) {
    const val = obj[attr];
    if ([false, null, undefined].includes(val)) {
      continue;
    }
    const attrName = textUtils.getAttrName(attr, prefix, attrsSet);

    if (val === true) {
      if (finalStr) { finalStr += ' '; }
      finalStr += attrName;
      continue;
    }
    if (val?.constructor === Object) {
      if (finalStr) { finalStr += ' '; }
      finalStr += attributesStringFromObject(val, { encode, attrsSet, prefix: attrName });
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
      finalStr += he.default.encode(val.toString());
    } else {
      finalStr += val.toString();
    }
    finalStr += '"';
  }
  return finalStr;
}

exports.default = attributesStringFromObject;
