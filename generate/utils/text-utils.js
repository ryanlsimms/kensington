export function kebabToCamel(str) {
  return str.replace(/-./g, x => x[1].toUpperCase())
}

export function kebabToPascal(str) {
  const camel = kebabToCamel(str);
  return `${camel[0].toUpperCase()}${camel.slice(1)}`;
}
