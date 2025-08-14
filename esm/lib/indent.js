function spaces(level) {
  return Array(level).fill(' ').join('');
}

export default function indent(str, level = 2) {
  let inPre = false;
  return str.split('\n').map(line => {
    if (line.trim().startsWith('<pre')) {
      inPre = true;
    }
    let lineStr;
    if (inPre) {
      lineStr = line;
    } else {
      lineStr = `${spaces(level)}${line}`;
    }
    if (line.trim().endsWith('</pre>')) {
      inPre = false;
    }
    return lineStr;
  })
    .join('\n');
}
