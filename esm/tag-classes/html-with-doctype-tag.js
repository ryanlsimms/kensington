import ContentTag from './content-tag.js';

export default class HtmlWithDoctypeTag extends ContentTag {
  toString() {
    return this._toString();
  }

  _toString(parentContext) {
    return `<!DOCTYPE html>\n${super._toString(parentContext)}`;
  }
}
