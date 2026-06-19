import { trackForStop } from '../lib/reactive/dom-tracker.js';
import { _internalEffect, isKensingtonSignal } from '../lib/reactive/signal.js';
import showInvalid from '../lib/util/show-invalid.js';

const TYPE_ERROR = 'literal() only accepts a string';
const SCRIPT_ERROR = '<script> tags are not allowed in literal html. Use unsafeLiteral if you can vouch for the string';

export default class LiteralTag {
  #reactiveStopped = false;

  constructor(str, safe = false, validationLevel = 'off', logger = undefined) {
    this.str = str;
    this.safe = safe;
    this.validationLevel = validationLevel;
    this.logger = logger;
  }

  toString() {
    const value = isKensingtonSignal(this.str) ? this.str.get() : this.str;
    if (typeof value !== 'string') {
      showInvalid(TYPE_ERROR, this.validationLevel, this.logger);
      return '';
    }
    if (this.safe && /<script/i.test(value)) {
      showInvalid(SCRIPT_ERROR, this.validationLevel, this.logger);
      return '';
    }
    return value;
  }

  toElement() {
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
    if (isKensingtonSignal(this.str)) {
      this.#reactiveStopped = false;
      const startAnchor = document.createComment('');
      const endAnchor = document.createComment('');
      const frag = document.createDocumentFragment();
      frag.append(startAnchor, endAnchor);
      const sig = this.str;
      const startRef = new WeakRef(startAnchor);
      const endRef = new WeakRef(endAnchor);
      const e = _internalEffect(() => {
        const start = startRef.deref();
        const end = endRef.deref();
        if (!start || !end) { e.stop(); return; }
        const val = sig.get();
        if (typeof val !== 'string') {
          showInvalid(TYPE_ERROR, this.validationLevel, this.logger);
          return;
        }
        if (this.safe && /<script/i.test(val)) {
          showInvalid(SCRIPT_ERROR, this.validationLevel, this.logger);
          return;
        }
        let node = start.nextSibling;
        while (node !== end) {
          const next = node.nextSibling;
          node.remove();
          node = next;
        }
        const template = document.createElement('template');
        template.innerHTML = val;
        start.after(...[...template.content.childNodes]);
      });
      // Register against the start anchor so dom-tracker stops the effect when the anchor
      // (or any ancestor of it) is removed from the DOM. Without this the effect would
      // re-run forever on every signal change, leaking the run closure and its subscription.
      trackForStop(startAnchor, () => {
        this.#reactiveStopped = true;
        e.stop();
      });
      return frag;
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

  // Reports whether the most recent toElement() created a signal-driven effect that
  // dom-tracker has since stopped. Stays false for static-string LiteralTags, which
  // have nothing to lose on removal. A parent ContentTag's reuse check uses this to
  // decide whether to rebuild.
  _isStaleAfterRemoval() {
    return this.#reactiveStopped;
  }
}
LiteralTag.prototype._isKensingtonTag = true;
