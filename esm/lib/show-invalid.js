export default function showInvalid(message, validationLevel) {
  const error = new Error(message);
  if (validationLevel === 'error') {
    throw error;
  } else if (validationLevel === 'warn') {
    console.error(message);
    console.error(error.stack);
  }
}
