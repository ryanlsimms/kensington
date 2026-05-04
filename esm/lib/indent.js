import { LINE_BREAK_REGEX } from './text-utils.js';

export default function indent(str, level = 2) {
  const pad = ' '.repeat(level);
  let result = '';
  let inPre = false;
  let inTextarea = false;

  for (const line of str.split(LINE_BREAK_REGEX)) {
    if (result) { result += '\n'; }
    result += inPre || inTextarea ? line : pad + line;

    const trimmed = line.trim();
    if (trimmed.startsWith('<pre')) {
      inPre = true;
    } else if (trimmed.startsWith('<textarea')) {
      inTextarea = true;
    }
    if (trimmed.endsWith('</pre>')) {
      inPre = false;
    } else if (trimmed.endsWith('</textarea>')) {
      inTextarea = false;
    }
  }

  return result;
}
