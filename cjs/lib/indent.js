'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const textUtils = require('./text-utils.js');

function spaces(level) {
  return Array(level).fill(' ').join('');
}

function indent(str, level = 2) {
  let inPre = false;
  let inTextarea = false;
  return str.split(textUtils.LINE_BREAK_REGEX).map(line => {
    let lineStr;
    if (inPre || inTextarea) {
      lineStr = line;
    } else {
      lineStr = `${spaces(level)}${line}`;
    }
    if (line.trim().startsWith('<pre')) {
      inPre = true;
    } else if (line.trim().startsWith('<textarea')) {
      inTextarea = true;
    }
    if (line.trim().endsWith('</pre>')) {
      inPre = false;
    } else if (line.trim().endsWith('</textarea>')) {
      inTextarea = false;
    }
    return lineStr;
  })
    .join('\n');
}

exports.default = indent;
