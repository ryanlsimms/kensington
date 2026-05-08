export default function showInvalid(message, validationLevel, logger) {
  const error = new Error(message);
  // strip library frames so the stack points to the caller's code
  error.stack = error.stack.split('\n').filter(row => !row.includes('node_modules')).join('\n');
  if (validationLevel === 'error') {
    throw error;
  }
  if (validationLevel === 'warn') {
    logger(message);
    logger(error.stack);
  }
}
