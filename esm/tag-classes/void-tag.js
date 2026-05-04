import showInvalid from '../lib/show-invalid.js';
import ContentTag from './content-tag.js';

export default class VoidTag extends ContentTag {
  validate() {
    super.validate();
    if (this.content.length) {
      showInvalid('self closing tags cannot have content', this.validationLevel, this.logger);
    }
  }

  toString() {
    return `<${this.tagName}${this.attributeString()}>`;
  }
}
