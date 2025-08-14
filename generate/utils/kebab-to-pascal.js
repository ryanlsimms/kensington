import { kebabToCamel } from '../../esm/lib/text-utils.js';

export default function kebabToPascal(str) {
  const camel = kebabToCamel(str);
  return `${camel[0].toUpperCase()}${camel.slice(1)}`;
}
