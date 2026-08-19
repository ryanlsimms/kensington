import showInvalid from '../lib/show-invalid.js';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const TYPE_ERROR = 'literal() only accepts a string';
const SCRIPT_ERROR = '<script> tags are not allowed in literal markup. '
  + 'Use unsafeLiteral if you can vouch for the string';

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
    return this._toElement();
  }

  _toElement(parentContext, parentElement) {
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
    const contextElement = parentElement ?? parentContext?.parentElement;
    const ownerDocument = contextElement?.ownerDocument ?? document;
    if (typeof this.str !== 'string') {
      showInvalid(TYPE_ERROR, this.validationLevel, this.logger);
      return ownerDocument.createDocumentFragment();
    }
    if (this.safe && /<script/i.test(this.str)) {
      showInvalid(SCRIPT_ERROR, this.validationLevel, this.logger);
      return ownerDocument.createDocumentFragment();
    }
    if (contextElement) {
      // A child render context belongs to exactly one parent element and is shared
      // by all of that parent's children. Reuse its Range so a list of literal
      // fragments does not allocate and initialize one Range per fragment.
      if (parentContext?.literalRange !== undefined) {
        return parentContext.literalRange.createContextualFragment(this.str);
      }
      // Browsers do not consistently apply annotation-xml's encoding attribute
      // when Range parses a fragment. The parent's resolved child context already
      // accounts for that attribute, so use an HTML surrogate for its HTML mode.
      const rangeContext = contextElement.localName === 'annotation-xml'
        && parentContext?.namespace === HTML_NAMESPACE
        ? ownerDocument.createElement('div')
        : contextElement;
      const range = ownerDocument.createRange();
      range.selectNodeContents(rangeContext);
      if (parentContext !== undefined) {
        parentContext.literalRange = range;
      }
      return range.createContextualFragment(this.str);
    }
    // A standalone literal has no real parent to supply a parsing context. Use
    // a detached HTML element so it follows the same contextual-fragment path
    // as nested literals without depending on the document's current contents.
    const range = ownerDocument.createRange();
    range.selectNodeContents(ownerDocument.createElement('div'));
    return range.createContextualFragment(this.str);
  }
}
LiteralTag.prototype._isKensingtonTag = true;
