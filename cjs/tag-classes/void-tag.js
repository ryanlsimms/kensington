'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const contentTag = require('./content-tag.js');

class VoidTag extends contentTag.default {
  validate() {
    super.validate();
    if (this.content.length) {
      throw new Error('self closing tags cannot have content');
    }
  }

  toString() {
    return `<${this.tagName}${this.attributeString()}>`;
  }
}

exports.default = VoidTag;
