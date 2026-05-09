import Signal, { effect } from '../lib/signal.js';

export default class CommentTag {
  constructor(text) {
    this.text = text;
  }

  toString() {
    let text = this.text instanceof Signal ? String(this.text.get()) : this.text;
    if (text.includes('--')) {
      text = text.replace(/--/g, '');
    }
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
    if (this.text instanceof Signal) {
      const sig = this.text;
      const comment = document.createComment(String(sig.get()));
      const ref = new WeakRef(comment);
      const e = effect(() => {
        const c = ref.deref();
        if (!c) { e.stop(); return; }
        c.nodeValue = String(sig.get());
      });
      return comment;
    }

    return document.createComment(this.text);
  }
}
