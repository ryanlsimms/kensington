import showInvalid from '../lib/show-invalid.js';

const TYPE_ERROR = 'literal() only accepts a string';
const SCRIPT_ERROR = '<script> tags are not allowed in literal html. Use unsafeLiteral if you can vouch for the string';

export default class LiteralTag {
  constructor(str, safe = false, validationLevel = 'off', logger = undefined) {
    this.str = str;
    this.safe = safe;
    this.validationLevel = validationLevel;
    this.logger = logger;
  }

  toString() {
    if (typeof this.str !== 'string') {
      showInvalid(TYPE_ERROR, this.validationLevel, this.logger);
      return '';
    }
    if (this.safe && /<script/i.test(this.str)) {
      showInvalid(SCRIPT_ERROR, this.validationLevel, this.logger);
      return '';
    }
    return this.str;
  }

  toElement() {
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
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
}
