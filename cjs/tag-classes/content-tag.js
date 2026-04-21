'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const attributesStringFromObject = require('../lib/attributes-string-from-object.js');
const indent = require('../lib/indent.js');
const he = require('he');
const showInvalid = require('../lib/show-invalid.js');
const textUtils = require('../lib/text-utils.js');
const literalTag = require('./literal-tag.js');
const stringifyContentArray = require('../lib/stringify-content-array.js');
const attributesArrayFromObject = require('../lib/attributes-array-from-object.js');

// TODO validate via "import elements from 'html-validate/dist/es/html5.js'";

class ContentTag {
  constructor(options) {
    this.tagName = options.tagName;
    this.attributes = options.attributes;
    this.allowedAttributes = options.allowedAttributes ?? {};
    this.contentIsLiteral = options.contentIsLiteral;
    this.indentationLevel = options.indentationLevel ?? 2;
    this.namespaces = options.namespaces;
    this.validationLevel = options.validationLevel;
    this.content = [];
    this.namespace = options.namespace;

    const handleItem = (c) =>  {
      if ([undefined, null, ''].includes(c)) {
        return;
      }
      if (Array.isArray(c)) {
        c.forEach(handleItem);
        return;
      }
      this.content.push(c);
    };

    [].concat(options.content).forEach(handleItem);
  }

  validate() {
    const unallowedAttributes = Object.keys(this.attributes).filter(attr => !this.attributeIsValid(attr));
    if (unallowedAttributes.length) {
      showInvalid.default(`attribute(s): ${unallowedAttributes.join(', ')} not allowed for ${this.tagName}`, this.validationLevel);
    }

    const invalidAttributeValues = Object.entries(this.attributes).filter(([attr, value]) => {
      return !unallowedAttributes.includes(attr) && !this.attributeValueIsValid(attr, value)
    });
    if (invalidAttributeValues.length) {
      const attrString = invalidAttributeValues.map(([attr, value]) => `${attr}="${value}"`).join(', ');
      const message = `invalid attribute \`${attrString}\` given for element \`${this.tagName}\``;
      showInvalid.default(message, this.validationLevel);
    }
  }

  isValidNamespaceAttribute(attr) {
    return this.namespaces.includes(attr.match(/[^A-Z|-]+/u)[0]); // characters before first uppercase or hyphen
  }

  attributeIsValid(attr) {
    return this.allowedAttributes.hasOwnProperty(attr) ||
      this.allowedAttributes.hasOwnProperty(textUtils.camelToKebab(attr)) ||
      this.isValidNamespaceAttribute(attr);
  }

  attributeValueIsValid(attr, value) {
    if ([undefined, null].includes(value)) {
      return true;
    }
    if (this.isValidNamespaceAttribute(attr)) {
      return true;
    }
    if (attr === 'id' && /^\d/.test(value)) {
      return false
    }
    const type = this.allowedAttributes[attr] ?? this.allowedAttributes[textUtils.camelToKebab(attr)];
    return this.validateAttributeByType(type, value);
  }

  validateAttributeByType(type, value) {
    if (['number', 'string'].includes(typeof type)) {
      return value === type;
    }
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
      return type.some(typeItem => this.validateAttributeByType(typeItem, value));
    }
  }

  validateContent() {
    if (
      this.content.flat(99).some(c => !['string', 'number'].includes(typeof c) &&
        (this.contentIsLiteral ||
        (!(c instanceof ContentTag) &&
        !(c instanceof literalTag.default)))
      )
    ) {
      throw new Error(`Invalid content passed to element \`${this.tagName}\``);
    }
  }

  contentIsShort() {
    if (!this.content.length) {
      return true;
    }

    if (this.content.length > 1) {
      return false;
    }

    const [content] = this.content;

    if (!['string', 'number'].includes(typeof content)) {
      return false;
    }

    if (content.length > 100) {
      return false;
    }

    return !textUtils.LINE_BREAK_REGEX.test(content);
  }

  attributeString() {
    let attrString = attributesStringFromObject.default(this.attributes, Object.keys(this.allowedAttributes));
    return attrString ? ` ${attrString}` : '';
  }

  attributeArray() {
    return attributesArrayFromObject.default(this.attributes, Object.keys(this.allowedAttributes));
  }

  toString() {
    if (this.validationLevel !== 'off') {
      this.validateContent();
    }

    let str = '<';
    str += this.tagName;
    str += this.attributeString();
    str += '>';


    if (this.contentIsLiteral) {
      str += this.content.map(c => {
        if (typeof c === 'string' && this.tagName !== 'script') {
          return he.encode(c)
        }
        return c
      });
    } else if (this.contentIsShort()) {
      for (const c of this.content) {
        if (typeof c === 'string' && this.tagName !== 'script') {
          str += he.encode(c);
        } else {
          str += c;
        }
      }
    } else {
      let content = stringifyContentArray.default(this.content);

      if (this.indentationLevel) {
        content = indent.default(content, this.indentationLevel);
      }
      str += '\n';
      str += content;
      str += '\n';
    }

    str += '</';
    str += this.tagName;
    str += '>';

    return str;
  }

  toElement() {
    if (!document) {
      throw new Error('toElement only supported in browser');
    }
    let element;
    if (this.namespace) {
      element = document.createElementNS(this.namespace, this.tagName);
    } else {
      element = document.createElement(this.tagName);
    }


    for (const [attrName, attrValue] of this.attributeArray()) {
      element.setAttribute(attrName, attrValue);
    }

    this.content.forEach(node => {
      if (node instanceof ContentTag || node instanceof literalTag.default) {
        element.append(node.toElement());
      } else {
        element.append(document.createTextNode(node));
      }
    });

    return element;
  }
}

exports.default = ContentTag;
