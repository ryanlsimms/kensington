import { LINE_BREAK_REGEX } from './text-utils.js';

export default function indent(str, level = 2) {
  const pad = ' '.repeat(level);
  let inPre = false;
  let inTextarea = false;
  return str.split(LINE_BREAK_REGEX).map(line => {
    let lineStr;
    if (inPre || inTextarea) {
      lineStr = line;
    } else {
      lineStr = pad + line;
    }
    if (line.trim().startsWith('<pre')) {
      inPre = true;
    } else if (line.trim().startsWith('<textarea')) {
      inTextarea = true;
    }
    if (line.trim().endsWith('</pre>')) {
      inPre = false;
    } else if (line.trim().endsWith('</textarea>')) {
      inTextarea = false;
    }
    return lineStr;
  })
    .join('\n');
}
