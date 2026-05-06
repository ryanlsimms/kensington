export function readHtml() {
  if (process.stdin.isTTY) {
    process.stderr.write('Paste HTML:\n');
    // Bracketed paste mode: terminal wraps paste with ESC[200~ / ESC[201~
    // so we know exactly when paste ends without requiring Ctrl+D.
    process.stderr.write('\x1b[?2004h');
    process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');
    return new Promise(resolve => {
      let buf = '';
      const PASTE_START = '\x1b[200~';
      const PASTE_END = '\x1b[201~';
      function finish(content) {
        process.stdin.setRawMode(false);
        process.stdin.destroy();
        process.stderr.write('\x1b[?2004l');
        resolve(content);
      }
      process.stdin.on('data', data => {
        if (data === '\x03') { // Ctrl+C
          process.stdin.setRawMode(false);
          process.stderr.write('\x1b[?2004l');
          process.exit(0);
        }
        if (data === '\x04') { // Ctrl+D fallback for terminals without bracketed paste
          finish(buf.replace(PASTE_START, ''));
          return;
        }
        buf += data;
        const start = buf.indexOf(PASTE_START);
        const end = buf.indexOf(PASTE_END);
        if (start !== -1 && end !== -1) {
          finish(buf.slice(start + PASTE_START.length, end));
        }
      });
    });
  }

  return new Promise(resolve => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
  });
}
