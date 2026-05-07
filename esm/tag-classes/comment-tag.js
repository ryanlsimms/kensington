import Signal from '../lib/signal.js';

export default class CommentTag {
  constructor(text) {
    this.text = text;
  }

  toString() {
    const text = this.text instanceof Signal ? this.text.get() : this.text;
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
      return document.createComment(this.text);
    }
    const comment = document.createComment(this.text.get());
    this.text.subscribe(val => {
      comment.nodeValue = val;
    });
    return comment;
  }
}
