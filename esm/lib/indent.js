import { LINE_BREAK_REGEX } from './text-utils.js';

export default function indent(str, level = 2) {
  const pad = ' '.repeat(level);
  let result = '';
  // whitespace is significant inside <pre> and <textarea>. Skip indentation for those lines
  let inPre = false;
  let inTextarea = false;

  for (const line of str.split(LINE_BREAK_REGEX)) {
    if (result) { result += '\n'; }
    result += inPre || inTextarea ? line : pad + line; // append before tag-detection: <pre> opening line gets indented. Content inside it doesn't

    const trimmed = line.trim(); // trim for tag detection only. line (untrimmed) is appended above to preserve leading whitespace inside pre/textarea
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
