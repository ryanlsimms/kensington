import filterStack from './filter-stack.js';

export default function showInvalid(message, validationLevel, logger) {
  const error = filterStack(new Error(message));
  if (validationLevel === 'error') {
    throw error;
  }
  if (validationLevel === 'warn') {
    const stack = error.stack ?? '';
    // Firefox's stack contains the frames without the diagnostic message.
    logger(stack.includes(message) ? stack : `${error}\n${stack}`.trimEnd());
  }
}
