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
    const text = this._normalize(this.text);
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
    const text = this._normalize(this.text);
    if (text === null) { return document.createComment(''); }
    return document.createComment(text);
  }
}
