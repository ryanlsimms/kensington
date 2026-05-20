let _id = 0;

function useId(prefix = 'k') {
  return `${prefix}-${++_id}`;
}

export { useId };
