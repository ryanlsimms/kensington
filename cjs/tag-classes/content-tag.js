'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const he = require('he');
const attributesFromObject = require('../lib/attributes-from-object.js');
const indent = require('../lib/indent.js');
const textUtils = require('../lib/text-utils.js');
const attributes = require('../attributes.js');

// TODO validate via "import elements from 'html-validate/dist/es/html5.js'";

const INDENTATION_LEVEL = 2;

function isValidNamespaceAttribute(attr) {
  return attributes.VALID_NAMESPACES.includes(attr.match(/[^A-Z]+/u)[0]); // characters before first uppercase
}

class KensingtonError extends Error {}

class ContentTag {
  constructor({ allowedAttributes = {}, attributes, content, literalContent, tagName }) {
    this.tagName = tagName;
    this.attributes = attributes;
    this.allowedAttributes = allowedAttributes;
    this.literalContent = literalContent;
    if (literalContent) {
      this.content = content;
    } else {
      this.content = [].concat(content)
        .flat()
        .filter(Boolean)
        .map(c => (typeof c === 'string' ? he.encode(c) : c));
    }
  }

  validate() {
    const unallowedAttributes = Object.keys(this.attributes).filter(attr => !this.attributeIsValid(attr));
    if (unallowedAttributes.length) {
      throw new KensingtonError(`attribute(s): ${unallowedAttributes.join(', ')} not allowed for ${this.tagName}`);
    }

    const invalidAttributeValues = Object.entries(this.attributes).filter(([attr, value]) => !this.attributeValueIsValid(attr, value));
    if (invalidAttributeValues.length) {
      const attrString = invalidAttributeValues.map(([attr, value]) => `${attr}="${value}"`).join(', ');
      throw new Error(`invalid attribute \`${attrString}\` given for element \`${this.tagName}\``);
    }
  }

  attributeIsValid(attr) {
    return this.allowedAttributes.hasOwnProperty(textUtils.camelToKebab(attr)) || isValidNamespaceAttribute(attr);
  }

  attributeValueIsValid(attr, value) {
    if ([undefined, null].includes(value)) {
      return true;
    }
    if (isValidNamespaceAttribute(attr)) {
      return true;
    }
    if (attr === 'id' && /^\d/.test(value)) {
      return false
    }
    const type = this.allowedAttributes[textUtils.camelToKebab(attr)];
    if (type === Boolean) {
      return [true, false, undefined, null].includes(value);
    }
    if (type === String) {
      return ['number', 'string'].includes(typeof value);
    }
    if (type === Number) {
      return typeof value === 'number' || Number(value).toString() === value;
    }
    if (typeof type === 'function') {
      return type(value);
    }
    if (Array.isArray(type)) {
      return type.includes(value);
    }
  }

  attributeString() {
    let attrString = attributesFromObject.default(this.attributes);
    return attrString ? ` ${attrString}` : '';
  }

  toString() {
    const startTag = `<${this.tagName}${this.attributeString()}>`;
    const endTag = `</${this.tagName}>`;

    if (this.literalContent) {
      return [startTag, this.content, endTag].join('')
    }

    const content = this.content
      .flat(8)
      .map(node => (typeof node === 'string' ? node.replace(/\r?\n/g, '<br />\n') : node))
      .join('\n');

    if (!this.content.length || (this.content.length === 1 && typeof this.content[0] === 'string')) {
      return [startTag, content, endTag].join('');
    }

    return [startTag, indent.default(content, INDENTATION_LEVEL), endTag].join('\n');
  }
}

exports.default = ContentTag;
