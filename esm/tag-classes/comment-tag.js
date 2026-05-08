export default class CommentTag {
  constructor(text) {
    this.text = text;
  }

  toString() {
    if (/[\r\n]/.test(this.text)) { // any line break → use multi-line format
      const normalized = this.text.replace(/\r\n?/g, '\n'); // normalize CRLF and lone CR to LF
      const indented = normalized.split('\n').map(line => `  ${line}`).join('\n');
      return `<!--\n${indented}\n-->`;
    }
    return `<!-- ${this.text} -->`;
  }

  toElement() {
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
    return document.createComment(this.text);
  }
}
