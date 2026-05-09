import Signal, { effect } from '../lib/signal.js';
import showInvalid from '../lib/show-invalid.js';

const TYPE_ERROR = 'inlineComment only accepts a string or number';
const DOUBLE_DASH_ERROR = 'inlineComment text must not contain "--"';

export default class CommentTag {
  constructor(text, validationLevel = 'off', logger = undefined) {
    this.text = text;
    this.validationLevel = validationLevel;
    this.logger = logger;
  }

  _normalize(raw) {
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
    const text = this._normalize(raw);
    if (text === null) { return ''; }
    if (/[\r\n]/.test(text)) {
      const normalized = text.replace(/\r\n?/g, '\n');
      const indented = normalized.split('\n').map(line => `  ${line}`).join('\n');
      return `<!--\n${indented}\n-->`;
    }
    return `<!-- ${text} -->`;
  }

  toElement() {
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
    if (!(this.text instanceof Signal)) {
      const text = this._normalize(this.text);
      if (text === null) { return document.createComment(''); }
      return document.createComment(text);
    }
    const sig = this.text;
    const comment = document.createComment(this._normalize(sig.get()) ?? '');
    const ref = new WeakRef(comment);
    const e = effect(() => {
      const c = ref.deref();
      if (!c) { e.stop(); return; }
      c.nodeValue = this._normalize(sig.get()) ?? '';
    });
    return comment;
  }
}
