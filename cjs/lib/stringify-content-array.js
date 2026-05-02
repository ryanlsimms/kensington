'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const textUtils = require('./text-utils.js');
const he = require('./he.js');

function stringifyContentArray(arr) {
  let content = '';

  function handleItem (node) {
    if (Array.isArray(node)) {
      node.forEach(handleItem);
      return;
    }
    if (content) {
      content += '\n';
    }
    if (typeof node !== 'string') {
      content += node;
      return;
    }
    const str = he.default.encode(node).replaceAll(textUtils.LINE_BREAK_REGEX, '<br>\n');
    content += str.endsWith('\n') ? str.slice(0, -1) : str;
  }

  arr.forEach(handleItem);

  return content;
}

exports.default = stringifyContentArray;
