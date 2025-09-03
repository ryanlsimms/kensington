'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const contentTag = require('./content-tag.js');
const showInvalid = require('../lib/show-invalid.js');

class VoidTag extends contentTag.default {
  validate() {
    super.validate();
    if (this.content.length) {
      showInvalid.default('self closing tags cannot have content', this.validationLevel);
    }
  }

  toString() {
    return `<${this.tagName}${this.attributeString()}>`;
  }
}

exports.default = VoidTag;
