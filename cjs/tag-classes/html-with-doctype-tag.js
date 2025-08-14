'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const contentTag = require('./content-tag.js');

class HtmlWithDoctypeTag extends contentTag.default {
  toString() {
    return `<!DOCTYPE html>\n${super.toString()}`;
  }
}

exports.default = HtmlWithDoctypeTag;
