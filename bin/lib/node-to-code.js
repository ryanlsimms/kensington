import { attrsToCode } from './attrs-to-code.js';
import { isBlank, reindent } from './html-utils.js';
import { SVG_ELEMENT_CASE } from './svg-element-case.js';

export function nodeToCode(node, maxLen, tagOverride = null) {
  if (node.nodeName === '#text') {
    if (isBlank(node.value)) {
      return null;
    }
    return JSON.stringify(node.value.trim());
  }

  if (node.nodeName === '#comment') {
    return `t.inlineComment(${JSON.stringify(node.data.trim())})`;
  }

  if (!node.tagName) {
    return null;
  }

  const tag = tagOverride ?? SVG_ELEMENT_CASE.get(node.tagName) ?? node.tagName;
  const attrsCode = attrsToCode(node.attrs ?? [], maxLen);

  const children = (node.childNodes ?? [])
    .map(n => nodeToCode(n, maxLen))
    .filter(Boolean);

  const contentArray = children.length > 0
    ? `[\n  ${children.map(c => reindent(c, 2)).join(',\n  ')},\n]`
    : null;

  // Single child goes bare for the inline check; multiple children use the array (which has \n, so inline check fails anyway)
  const inlineContent = children.length === 1 ? children[0] : contentArray;

  const inlineArgs = [attrsCode, inlineContent].filter(Boolean);
  if (!inlineArgs.length) {
    return `t.${tag}()`;
  }

  const isComponentContent = children.length === 1 && children[0].startsWith('t.');
  const inline = `t.${tag}(${inlineArgs.join(', ')})`;
  if (!isComponentContent && inline.length <= maxLen && !inline.includes('\n')) {
    return inline;
  }

  // Multi-line: attrs stay on the same line as the method call, content wrapped in array
  if (!contentArray) {
    return `t.${tag}(${attrsCode})`;
  }
  if (attrsCode) {
    return `t.${tag}(${attrsCode}, ${contentArray})`;
  }
  return `t.${tag}(${contentArray})`;
}
