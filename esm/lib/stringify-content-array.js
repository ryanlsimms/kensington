import { LINE_BREAK_REGEX } from './text-utils.js';
import he from './he.js'


export default function stringifyContentArray(arr) {
  let content = '';

  function handleItem (node) {
    if (Array.isArray(node)) {
      node.forEach(handleItem);
      return;
    }
    if (content) {
      content += '\n';
    }
    if (typeof node !== 'string') {
      content += node;
      return;
    }
    const str = he.encode(node).replaceAll(LINE_BREAK_REGEX, '<br>\n');
    content += str.endsWith('\n') ? str.slice(0, -1) : str;
  }

  arr.forEach(handleItem);

  return content;
}
