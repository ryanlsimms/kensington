'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class LiteralTag {
  constructor(str) {
    this.str = str;
  }

  toString() {
    return this.str;
  }

  toElement() {
    const template = document.createElement('template');
    template.innerHTML = this.str;
    return template.content.firstChild;
  }
}

exports.default = LiteralTag;
