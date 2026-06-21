// Absolute path to kensington's own source, used to strip internal frames from
// stacks so errors and warnings point to the caller's code, not library internals.
// IIFE bundles erase `import.meta` entirely, so guard the access and fall back to an
// empty marker that simply matches nothing rather than crashing at module load.
const _selfUrl = (typeof import.meta !== 'undefined' && import.meta.url) || '';
const KENSINGTON_SRC = _selfUrl.startsWith('file:')
  ? new URL('../../', _selfUrl).pathname
  : _selfUrl;

export default function showInvalid(message, validationLevel, logger) {
  const error = new Error(message);
  if (error.stack) {
    const [head, ...frames] = error.stack.split('\n');
    error.stack = [head, ...frames.filter(f => !f.includes(KENSINGTON_SRC))].join('\n');
  }
  if (validationLevel === 'error') {
    throw error;
  }
  if (validationLevel === 'warn') {
    logger(error.stack);
  }
}
