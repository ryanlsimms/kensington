'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const he = {
  encode: str => String(str)
    .replace(/&/g, '&#x26;')
    .replace(/</g, '&#x3C;')
    .replace(/>/g, '&#x3E;')
    .replace(/"/g, '&#x22;'),
};

exports.default = he;
