const MAP = { '&': '&#x26;', '<': '&#x3C;', '>': '&#x3E;', '"': '&#x22;' };

export default {
  encode(str) {
    return String(str).replace(/[&<>"]/g, c => MAP[c]);
  }
};
