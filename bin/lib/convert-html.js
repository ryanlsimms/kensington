import { parse, parseFragment } from 'parse5';

import { reindent, sigChildren } from './html-utils.js';
import { nodeToCode } from './node-to-code.js';

export function convertHtml(html, maxLen = 80) {
  const isFullDoc = /^\s*<!doctype/i.test(html) || /^\s*<html[\s>]/i.test(html);
  let hasDoctype = false;
  let roots;

  if (isFullDoc) {
    const doc = parse(html);
    hasDoctype = doc.childNodes.some(n => n.nodeName === '#documentType');
    const htmlEl = doc.childNodes.find(n => n.nodeName === 'html');
    roots = htmlEl ? [htmlEl] : sigChildren(doc);
  } else {
    roots = sigChildren(parseFragment(html));
  }

  if (roots.length === 0) {
    return 'null';
  }
  if (roots.length === 1) {
    const tagOverride = hasDoctype && roots[0].tagName === 'html' ? 'htmlWithDocType' : null;
    return nodeToCode(roots[0], maxLen, tagOverride);
  }
  const parts = roots.map(n => nodeToCode(n, maxLen)).filter(Boolean);
  const indented = parts.map(p => reindent(p, 2));
  return `[\n  ${indented.join(',\n  ')},\n]`;
}
