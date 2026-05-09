import Signal, { effect } from '../lib/signal.js';

export default class LiteralTag {
  constructor(str) {
    this.str = str;
  }

  toString() {
    return this.str instanceof Signal ? this.str.get() : this.str;
  }

  toElement() {
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
    if (this.str instanceof Signal) {
      const startAnchor = document.createComment('');
      const endAnchor = document.createComment('');
      const frag = document.createDocumentFragment();
      frag.append(startAnchor, endAnchor);
      const sig = this.str;
      const startRef = new WeakRef(startAnchor);
      const endRef = new WeakRef(endAnchor);
      const e = effect(() => {
        const start = startRef.deref();
        const end = endRef.deref();
        if (!start || !end) { e.stop(); return; }
        let node = start.nextSibling;
        while (node !== end) {
          const next = node.nextSibling;
          node.remove();
          node = next;
        }
        const template = document.createElement('template');
        template.innerHTML = sig.get();
        start.after(...[...template.content.childNodes]);
      });
      return frag;
    }

    const template = document.createElement('template');
    template.innerHTML = this.str;
    return template.content;
  }
}
