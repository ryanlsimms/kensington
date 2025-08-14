import VoidTag from './void-tag.js';

export default class SvgVoidTag extends VoidTag {
  toString() {
    return `<${this.tagName}${this.attributeString()} />`;
  }
}
