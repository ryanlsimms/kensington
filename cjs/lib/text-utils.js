'use strict';

function camelToKebab(str) {
  return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase())
}

const LINE_BREAK_REGEX = /[\r\n]+/g;

exports.LINE_BREAK_REGEX = LINE_BREAK_REGEX;
exports.camelToKebab = camelToKebab;
