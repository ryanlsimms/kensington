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

    if (/<pre[\s>]/.test(line)) {
      inPre = true;
    } else if (/<textarea[\s>]/.test(line)) {
      inTextarea = true;
    }
    if (/<\/pre>/.test(line)) {
      inPre = false;
    } else if (/<\/textarea>/.test(line)) {
      inTextarea = false;
    }
  }

  return result;
}
