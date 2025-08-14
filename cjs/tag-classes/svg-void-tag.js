'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const voidTag = require('./void-tag.js');

class SvgVoidTag extends voidTag.default {
  toString() {
    return `<${this.tagName}${this.attributeString()} />`;
  }
}

exports.default = SvgVoidTag;
