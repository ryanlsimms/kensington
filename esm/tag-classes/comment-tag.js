export default class CommentTag {
  constructor(text) {
    this.text = text;
  }

  toString() {
    if (this.text.includes('\n')) {
      const indented = this.text.split('\n').map(line => `  ${line}`).join('\n');
      return `<!--\n${indented}\n-->`;
    }
    return `<!-- ${this.text} -->`;
  }

  toElement() {
    return document.createComment(this.text);
  }
}
