import { attrsToCode } from './attrs-to-code.js';
import { isBlank, reindent } from './html-utils.js';

const { default: { svgAttributes } } = await import('../../generate/fetched-data/svg.json', { with: { type: 'json' } });

// HTML5 tokenization lowercases tag names, including inside SVG foreign content.
// Map the lowercased form back to the spec-correct camelCase name.
const SVG_ELEMENT_CASE = new Map(
  [...new Set(svgAttributes.flatMap(a => a.elements ?? []))]
    .filter(name => name !== name.toLowerCase())
    .map(name => [name.toLowerCase(), name]),
);

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
  let contentCode;
  if (children.length === 0) {
    contentCode = null;
  } else if (children.length === 1) {
    contentCode = children[0];
  } else {
    const items = children.map(c => reindent(c, 2));
    contentCode = `[\n  ${items.join(',\n  ')},\n]`;
  }

  const args = [attrsCode, contentCode].filter(Boolean);
  if (!args.length) {
    return `t.${tag}()`;
  }

  const inline = `t.${tag}(${args.join(', ')})`;
  if (inline.length <= maxLen && !inline.includes('\n')) {
    return inline;
  }

  const indentedArgs = args.map(a => reindent(a, 2));
  return `t.${tag}(\n  ${indentedArgs.join(',\n  ')},\n)`;
}
