const _selfUrl = import.meta.url;
// Node.js source: filter by the esm/ directory (two levels up from esm/lib/util/).
// Browser bundle: all internal frames share the bundle URL, so filter by that directly.
const KENSINGTON_SRC = _selfUrl.startsWith('file:')
  ? new URL('../../', _selfUrl).pathname
  : _selfUrl;

export default function filterStack(error) {
  if (error.stack) {
    const lines = error.stack.split('\n');
    // Chrome/Safari include "Error: msg" as the first line; Firefox does not.
    const frames = lines[0].startsWith('Error:') ? lines.slice(1) : lines;
    const userFrames = frames.filter(f => !f.includes(KENSINGTON_SRC));
    // Normalise to "Error: msg\n  <user frames>" so the message is always present.
    error.stack = [`Error: ${error.message}`, ...userFrames].join('\n');
  }
  return error;
}
