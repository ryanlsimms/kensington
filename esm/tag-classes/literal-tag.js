export default class LiteralTag {
  constructor(str) {
    this.str = str;
  }

  toString() {
    return this.str;
  }

  toElement() {
    const template = document.createElement('template');
    template.innerHTML = this.str;
    return template.content.firstChild;
  }
}
