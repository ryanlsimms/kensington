import { camelToKebab } from './text-utils.js';

export function styleObjectToCss(obj, filter = ([, v]) => (v || v === 0) && v !== true) {
  return Object.entries(obj)
    .filter(filter)
    .map(([k, v]) => `${camelToKebab(k)}: ${v}`)
    .join('; ');
}
