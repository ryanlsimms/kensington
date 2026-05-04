import he from './he.js';
import { LINE_BREAK_REGEX, preserveSpaces } from './text-utils.js';

export default function stringifyContentArray(arr) {
  let result = '';
  for (const node of arr) {
    if (result) { result += '\n'; }
    if (typeof node !== 'string') {
      result += String(node);
      continue;
    }

    const str = he.encode(preserveSpaces(node)).replaceAll(LINE_BREAK_REGEX, '<br>\n');
    result += str.endsWith('\n') ? str.slice(0, -1) : str;
  }
  return result;
}
