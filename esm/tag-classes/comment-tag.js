import { addOnStop, trackForStop } from '../lib/reactive/dom-tracker.js';
import Signal, { effect } from '../lib/reactive/signal.js';
import showInvalid from '../lib/util/show-invalid.js';

const TYPE_ERROR = 'inlineComment only accepts a string or number';
const DOUBLE_DASH_ERROR = 'inlineComment text must not contain "--"';

export default class CommentTag {
  #domElement = null;

  constructor(text, validationLevel = 'off', logger = undefined) {
    this.text = text;
    this.validationLevel = validationLevel;
    this.logger = logger;
  }

  #normalize(raw) {
    if (!['string', 'number'].includes(typeof raw)) {
      showInvalid(TYPE_ERROR, this.validationLevel, this.logger);
      return null;
    }
    let text = String(raw);
    if (text.includes('--')) {
      showInvalid(DOUBLE_DASH_ERROR, this.validationLevel, this.logger);
      text = text.replace(/--/g, '');
    }
    return text;
  }

  toString() {
    const raw = this.text instanceof Signal ? this.text.get() : this.text;
    const text = this.#normalize(raw);
    if (text === null) { return ''; }
    if (/[\r\n]/.test(text)) {
      const normalized = text.replace(/\r\n?/g, '\n');
      const indented = normalized.split('\n').map(line => `  ${line}`).join('\n');
      return `<!--\n${indented}\n-->`;
    }
    return `<!-- ${text} -->`;
  }

  toElement() {
    if (this.#domElement) {
      if (this.#domElement.parentNode !== null) {
        showInvalid(`toElement() called on a tag instance already in the DOM — the same node will be moved. Call the tag as a function to create a new independent node.`, this.validationLevel, this.logger);
      }
      return this.#domElement;
    }
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
    if (this.text instanceof Signal) {
      const sig = this.text;
      const comment = document.createComment('');
      const ref = new WeakRef(comment);
      const e = effect(() => {
        const c = ref.deref();
        if (!c) { e.stop(); return; }
        const text = this.#normalize(sig.get());
        if (text === null) { return; }
        c.nodeValue = text;
      });
      const clearCache = () => { if (this.#domElement === comment) { this.#domElement = null; } };
      trackForStop(comment, () => e.stop());
      addOnStop(comment, clearCache);
      this.#domElement = comment;
      return comment;
    }

    const comment = document.createComment(this.#normalize(this.text) ?? '');
    this.#domElement = comment;
    return comment;
  }

  getDomElement() {
    return this.#domElement?.isConnected ? this.#domElement : null;
  }
}
