'use strict';

const _camelToKebabCache = new Map();
function camelToKebab(str) {
  let v = _camelToKebabCache.get(str);
  if (v === undefined) {
    v = str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase());
    _camelToKebabCache.set(str, v);
  }
  return v;
}

function getAttrName(attr, prefix, attrsSet) {
  if (prefix) {
    return `${prefix}-${camelToKebab(attr)}`;
  }
  return attrsSet.has(attr) ? attr : camelToKebab(attr);
}

const LINE_BREAK_REGEX = /[\r\n]+/g;
const LINE_BREAK_TEST_REGEX = /[\r\n]/;

exports.LINE_BREAK_REGEX = LINE_BREAK_REGEX;
exports.LINE_BREAK_TEST_REGEX = LINE_BREAK_TEST_REGEX;
exports.camelToKebab = camelToKebab;
exports.getAttrName = getAttrName;
