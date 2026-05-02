const _camelToKebabCache = new Map();
export function camelToKebab(str) {
  let v = _camelToKebabCache.get(str);
  if (v === undefined) {
    v = str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase());
    _camelToKebabCache.set(str, v);
  }
  return v;
}

export function getAttrName(attr, prefix, attrsSet) {
  if (prefix) {
    return `${prefix}-${camelToKebab(attr)}`;
  }
  return attrsSet.has(attr) ? attr : camelToKebab(attr);
}

export const LINE_BREAK_REGEX = /[\r\n]+/g;
export const LINE_BREAK_TEST_REGEX = /[\r\n]/;
