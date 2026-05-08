import { camelToKebab } from './text-utils.js';

function isSerializableStyleValue(k, v) {
  if (!k.trim()) { return false; }
  if (typeof v === 'number') { return isFinite(v); }
  return typeof v === 'string' && v !== '';
}

export function styleObjectToCss(obj, filter = isSerializableStyleValue) {
  const parts = [];
  for (const k of Object.keys(obj)) {
    let v;
    try {
      v = obj[k];
    } catch {
      continue;
    }
    if (filter(k, v)) {
      parts.push(`${camelToKebab(k)}: ${String(v)}`);
    }
  }
  return parts.join('; ');
}
