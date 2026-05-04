const MAP = { '"': '&#x22;', '&': '&#x26;', '<': '&#x3C;', '>': '&#x3E;' };

export default {
  encode(str) {
    return String(str).replace(/[&<>"]/g, c => MAP[c]);
  },
};
