import Signal from '../lib/signal.js';

function parse(str) {
  const template = document.createElement('template');
  template.innerHTML = str;
  return template.content.firstChild;
}

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
    if (!(this.str instanceof Signal)) {
      return parse(this.str);
    }
    let node = parse(this.str.get());
    this.str.subscribe(val => {
      const newNode = parse(val);
      node.replaceWith(newNode);
      node = newNode;
    });
    return node;
  }
}
