export function camelToKebab(str) {
  return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase())
}

export const LINE_BREAK_REGEX = /[\r\n]+/g;
export const LINE_BREAK_TEST_REGEX = /[\r\n]/;
