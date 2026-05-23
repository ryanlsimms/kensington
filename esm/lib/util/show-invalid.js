// Absolute path to kensington's own source, used to strip internal frames from
// stacks so errors and warnings point to the caller's code, not library internals.
const KENSINGTON_SRC = new URL('../../', import.meta.url).pathname;

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
