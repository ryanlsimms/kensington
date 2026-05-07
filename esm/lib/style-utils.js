import { camelToKebab } from './text-utils.js';

function isSerializableStyleValue([, v]) {
  if (typeof v === 'number') { return isFinite(v); }
  return typeof v === 'string' && v !== '';
}

export function styleObjectToCss(obj, filter = isSerializableStyleValue) {
  return Object.entries(obj)
    .filter(filter)
    .map(([k, v]) => `${camelToKebab(k)}: ${String(v)}`)
    .join('; ');
}
