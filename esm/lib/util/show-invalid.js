import filterStack from './filter-stack.js';

export default function showInvalid(message, validationLevel, logger) {
  const error = filterStack(new Error(message));
  if (validationLevel === 'error') {
    throw error;
  }
  if (validationLevel === 'warn') {
    logger(error.stack);
  }
}
