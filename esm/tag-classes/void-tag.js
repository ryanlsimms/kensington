import ContentTag from './content-tag.js';
import showInvalid from '../lib/show-invalid.js';

export default class VoidTag extends ContentTag {
  validate() {
    super.validate();
    if (this.content.length) {
      showInvalid('self closing tags cannot have content', this.validationLevel);
    }
  }

  toString() {
    return `<${this.tagName}${this.attributeString()}>`;
  }
}
