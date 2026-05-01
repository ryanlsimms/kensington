'use strict';

function camelToKebab(str) {
  return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase())
}

const LINE_BREAK_REGEX = /[\r\n]+/g;
const LINE_BREAK_TEST_REGEX = /[\r\n]/;

exports.LINE_BREAK_REGEX = LINE_BREAK_REGEX;
exports.LINE_BREAK_TEST_REGEX = LINE_BREAK_TEST_REGEX;
exports.camelToKebab = camelToKebab;
