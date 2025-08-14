import ContentTag from './content-tag.js';

export default class VoidTag extends ContentTag {
  validate() {
    super.validate();
    if (this.content.length) {
      throw new Error('self closing tags cannot have content');
    }
  }

  toString() {
    return `<${this.tagName}${this.attributeString()}>`;
  }
}
