'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const MAP = { '&': '&#x26;', '<': '&#x3C;', '>': '&#x3E;', '"': '&#x22;' };

const he = {
  encode(str) {
    return String(str).replace(/[&<>"]/g, c => MAP[c]);
  }
};

exports.default = he;
