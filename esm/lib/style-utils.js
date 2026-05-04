import { camelToKebab } from './text-utils.js';

function isSerializableStyleValue([, v]) {
  return (v || v === 0) && v !== true;
}

export function styleObjectToCss(obj, filter = isSerializableStyleValue) {
  return Object.entries(obj)
    .filter(filter)
    .map(([k, v]) => `${camelToKebab(k)}: ${v}`)
    .join('; ');
}
