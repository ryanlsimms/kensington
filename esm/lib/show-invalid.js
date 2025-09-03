export default function showInvalid(message, validationLevel) {
  const error = new Error(message);
  error.stack  = error.stack.split('\n').filter(row => !row.includes('node_modules')).join('\n')
  if (validationLevel === 'error') {
    throw error;
  } else if (validationLevel === 'warn') {
    console.error(message);
    console.error(error.stack);
  }
}
