const _selfUrl = (typeof import.meta !== 'undefined' && import.meta.url) || '';
// Node.js source: the URL points at the real esm/ file path on disk. Filter by
// the esm/ directory (two levels up from esm/lib/util/) so internal frames are
// stripped but user frames (which live elsewhere) survive.
// Browser bundle: kensington and user code share the bundle URL. Filtering by
// that URL would strip user frames too, leaving only native-code frames. There
// is no reliable way to tell internal from external frames in that case, so we
// preserve the full stack and let the user see their call site.
// IIFE bundles erase import.meta entirely. Same answer: keep the full stack.
const KENSINGTON_SRC = _selfUrl.startsWith('file:')
  ? new URL('../../', _selfUrl).pathname
  : '';

export default function filterStack(error) {
  if (!KENSINGTON_SRC || !error.stack) {
    return error;
  }
  const lines = error.stack.split('\n');
  // Chrome/Safari include "Error: msg" as the first line; Firefox does not.
  const frames = lines[0].startsWith('Error:') ? lines.slice(1) : lines;
  const userFrames = frames.filter(f => !f.includes(KENSINGTON_SRC));
  // Normalise to "Error: msg\n  <user frames>" so the message is always present.
  error.stack = [`Error: ${error.message}`, ...userFrames].join('\n');
  return error;
}
