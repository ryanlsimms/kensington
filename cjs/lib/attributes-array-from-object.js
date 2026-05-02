'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const he = require('./he.js');
const textUtils = require('./text-utils.js');

function attributesArrayFromObject(obj, { encode, attrsSet = new Map(), prefix = '' } = {}) {
  let finalArr = [];

  for (const attr in obj) {
    const val = obj[attr];
    if ([false, null, undefined].includes(val)) {
      continue;
    }
    const attrName = textUtils.getAttrName(attr, prefix, attrsSet);

    if (val === true) {
      finalArr.push([attrName, '']);
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
      finalArr.push([attrName, he.default.encode(val.toString())]);
    } else if (typeof val === 'function') {
      finalArr.push([attrName, val]);
    } else {
      finalArr.push([attrName, val.toString()]);
    }
  }
  return finalArr;
}

exports.default = attributesArrayFromObject;
