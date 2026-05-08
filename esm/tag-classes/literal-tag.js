export default class LiteralTag {
  constructor(str) {
    this.str = str;
  }

  toString() {
    return this.str;
  }

  toElement() {
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
    const template = document.createElement('template');
    template.innerHTML = this.str;
    return template.content; // DocumentFragment preserves multi-root HTML
  }
}
