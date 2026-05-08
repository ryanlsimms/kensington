const _camelToKebabCache = new Map(); // called on every attribute in every render. Cache avoids repeated regex execution
export function camelToKebab(str) {
  let v = _camelToKebabCache.get(str);
  if (v === undefined) {
    // first alt: acronym runs (XMLParser → xml-parser). Second: camelCase (bgColor → bg-color). ofs skips leading hyphen
    v = str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase());
    _camelToKebabCache.set(str, v);
  }
  return v;
}

export function getAttrName(attr, prefix, attrsSet) {
  if (prefix) {
    return `${prefix}-${camelToKebab(attr)}`;
  }
  return attrsSet.has(attr) ? attr : camelToKebab(attr); // skip the regex when attr is already in its canonical form (e.g. 'id', 'class')
}

export const LINE_BREAK_REGEX = /[\r\n]+/g;
export const LINE_BREAK_TEST_REGEX = /[\r\n]/; // separate no-g regex: a g-flag regex tracks lastIndex and gives false negatives when reused in .test()

export function preserveSpaces(str) {
  // HTML collapses multiple spaces. Replace runs with non-breaking spaces to preserve them
  return str.replace(/ {2,}/g, match => '\u00A0'.repeat(match.length)); // {2,} = two or more consecutive spaces
}
