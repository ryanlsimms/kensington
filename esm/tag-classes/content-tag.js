import attributesArrayFromObject from '../lib/attributes-array-from-object.js';
import attributesStringFromObject from '../lib/attributes-string-from-object.js';
import he from '../lib/he.js';
import indent from '../lib/indent.js';
import showInvalid from '../lib/show-invalid.js';
import stringifyContentArray from '../lib/stringify-content-array.js';
import { styleObjectToCss } from '../lib/style-utils.js';
import { camelToKebab, LINE_BREAK_TEST_REGEX, preserveSpaces } from '../lib/text-utils.js';
import CommentTag from './comment-tag.js';
import LiteralTag from './literal-tag.js';

function isValidStyleValue(v) {
  return [null, undefined, false].includes(v) || ['string', 'number'].includes(typeof v);
}

function isValidContentItem(c, contentIsLiteral) {
  if (['string', 'number'].includes(typeof c)) {
    return true;
  }
  return !contentIsLiteral && (c instanceof ContentTag || c instanceof LiteralTag || c instanceof CommentTag);
}

function collectContent(items) {
  const out = [];
  for (const c of [].concat(items)) {
    if ([undefined, null, '', false, true].includes(c)) {
      continue;
    }
    if (Array.isArray(c)) {
      out.push(...collectContent(c));
      continue;
    }
    out.push(c);
  }
  return out;
}

export default class ContentTag {
  constructor(options) {
    this.tagName = options.tagName;
    this.attributes = options.attributes;
    this.allowedAttributeMap = options.allowedAttributeMap ?? new Map();
    this.contentIsLiteral = options.contentIsLiteral;
    this.indentationLevel = options.indentationLevel ?? 2;
    this.namespaces = options.namespaces;
    this.validationLevel = options.validationLevel;
    this.logger = options.logger;
    this.content = collectContent(options.content);
    this.namespace = options.namespace;
    this.encodeContent = options.encodeContent;
  }

  validate() {
    const unallowedAttributes = Object.keys(this.attributes).filter(attr => !this.attributeIsValid(attr));
    if (unallowedAttributes.length) {
      showInvalid(`attribute(s): ${unallowedAttributes.join(', ')} not allowed for ${this.tagName}`, this.validationLevel, this.logger);
    }

    const invalidAttributeValues = Object.entries(this.attributes).filter(([attr, value]) => {
      return !unallowedAttributes.includes(attr) && !this.attributeValueIsValid(attr, value);
    });
    if (invalidAttributeValues.length) {
      const attrString = invalidAttributeValues.map(([attr, value]) => {
        if (attr === 'style' && value?.constructor === Object) {
          return `style="${styleObjectToCss(value, ([, v]) => !isValidStyleValue(v))}"`;
        }
        if (Array.isArray(value)) {
          return `${attr}=${JSON.stringify(value)}`;
        }
        return `${attr}="${value}"`;
      }).join(', ');
      const message = `invalid attribute \`${attrString}\` given for element \`${this.tagName}\``;
      showInvalid(message, this.validationLevel, this.logger);
    }
  }

  isValidNamespaceAttribute(attr) {
    const match = attr.match(/[^A-Z|-]+/u); // characters before first uppercase or hyphen
    return match !== null && this.namespaces.includes(match[0]);
  }

  attributeIsValid(attr) {
    return this.allowedAttributeMap.has(attr) ||
      this.allowedAttributeMap.has(camelToKebab(attr)) ||
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
      return false;
    }
    if (attr === 'style' && value?.constructor === Object) {
      return Object.values(value).every(isValidStyleValue);
    }
    const type = this.allowedAttributeMap.get(attr) ?? this.allowedAttributeMap.get(camelToKebab(attr));
    return this.validateAttributeByType(type, value);
  }

  validateAttributeByType(type, value) {
    if (['number', 'string'].includes(typeof type)) {
      return value === type;
    }
    if (type === Function) {
      return typeof value === 'function';
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
    return false;
  }

  validateContent() {
    if (!this.content.every(c => isValidContentItem(c, this.contentIsLiteral))) {
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

    return !LINE_BREAK_TEST_REGEX.test(content);
  }

  attributeString() {
    if (this.validationLevel !== 'off') {
      for (const [attrName, v] of Object.entries(this.attributes)) {
        if (typeof v === 'function') {
          showInvalid(
            `function value for attribute \`${attrName}\` is not supported in toString()`,
            this.validationLevel,
            this.logger,
          );
        }
      }
    }
    const attrString = attributesStringFromObject(
      this.attributes,
      { attrsSet: this.allowedAttributeMap, encode: true },
    );
    return attrString ? ` ${attrString}` : '';
  }

  attributeArray() {
    return attributesArrayFromObject(this.attributes, { attrsSet: this.allowedAttributeMap, encode: false });
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
      let literalStr = '';
      for (const c of this.content) {
        if (literalStr) { literalStr += '\n'; }
        literalStr += typeof c === 'string' && this.encodeContent ? he.encode(c) : c;
      }
      str += literalStr;
    } else if (this.contentIsShort()) {
      for (const c of this.content) {
        if (typeof c === 'string' && this.encodeContent) {
          str += he.encode(preserveSpaces(c));
        } else {
          str += c;
        }
      }
    } else {
      let content = stringifyContentArray(this.content);

      if (this.indentationLevel) {
        content = indent(content, this.indentationLevel);
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
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
    let element;
    if (this.namespace) {
      element = document.createElementNS(this.namespace, this.tagName);
    } else {
      element = document.createElement(this.tagName);
    }

    for (const [attrName, attrValue] of this.attributeArray()) {
      if (attrName.startsWith('on') && typeof attrValue === 'function') {
        const eventName = attrName.replace(/^on/, '');
        element.addEventListener(eventName, attrValue);
      } else {
        element.setAttribute(attrName, attrValue);
      }
    }

    for (let node of this.content) {
      if (node instanceof ContentTag || node instanceof LiteralTag || node instanceof CommentTag) {
        element.append(node.toElement());
        continue;
      }
      if (!this.contentIsLiteral && typeof node === 'string') {
        node = preserveSpaces(node);
      }
      element.append(document.createTextNode(node));
    }

    return element;
  }
}
