import Signal, { effect } from '../lib/signal.js';
import showInvalid from '../lib/show-invalid.js';

const TYPE_ERROR = 'literal() only accepts a string';
const SCRIPT_ERROR = '<script> tags are not allowed in literal html. Use unsafeLiteral if you can vouch for the string';

function parse(str) {
  const template = document.createElement('template');
  template.innerHTML = str;
  return template.content.firstChild;
}

export default class LiteralTag {
  constructor(str, safe = false, validationLevel = 'off', logger = undefined) {
    this.str = str;
    this.safe = safe;
    this.validationLevel = validationLevel;
    this.logger = logger;
  }

  toString() {
    const str = this.str instanceof Signal ? this.str.get() : this.str;
    if (typeof str !== 'string') {
      showInvalid(TYPE_ERROR, this.validationLevel, this.logger);
      return '';
    }
    if (this.safe && /<script/i.test(str)) {
      showInvalid(SCRIPT_ERROR, this.validationLevel, this.logger);
      return '';
    }
    return str;
  }

  toElement() {
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
    if (!(this.str instanceof Signal)) {
      if (typeof this.str !== 'string') {
        showInvalid(TYPE_ERROR, this.validationLevel, this.logger);
        return document.createDocumentFragment();
      }
      if (this.safe && /<script/i.test(this.str)) {
        showInvalid(SCRIPT_ERROR, this.validationLevel, this.logger);
        return document.createDocumentFragment();
      }
      const template = document.createElement('template');
      template.innerHTML = this.str;
      return template.content;
    }
    let node = null;
    const sig = this.str;
    effect(() => {
      const newNode = parse(sig.get());
      if (node !== null) {
        node.replaceWith(newNode);
      }
      node = newNode;
    });
    return node;
  }
}
