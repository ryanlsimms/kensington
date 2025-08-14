import ContentTag from './content-tag.js';

export default class HtmlWithDoctypeTag extends ContentTag {
  toString() {
    return `<!DOCTYPE html>\n${super.toString()}`;
  }
}
