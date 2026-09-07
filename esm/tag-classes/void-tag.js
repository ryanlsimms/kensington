import { withRuntimeValidation } from '../lib/reactive/runtime-guard.js';
import showInvalid from '../lib/util/show-invalid.js';
import ContentTag from './content-tag.js';

export default class VoidTag extends ContentTag {
  validate() {
    super.validate();
    if (this.content.length) {
      showInvalid('self closing tags cannot have content', this.validationLevel, this.logger);
    }
  }

  toString() {
    return this._toString();
  }

  _toString(parentContext) {
    return withRuntimeValidation(this.validationLevel, this.logger, () => {
      this._resolveNamespace(parentContext);
      return `<${this.tagName}${this.attributeString()}>`;
    });
  }
}
