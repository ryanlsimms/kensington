const MAP = { '"': '&#x22;', '&': '&#x26;', '<': '&#x3C;', '>': '&#x3E;' };

// clone of he https://www.npmjs.com/package/he, but with only the entities that actually need to be encoded
export default {
  encode(str) {
    return String(str).replace(/[&<>"]/g, c => MAP[c]);
  },
};
