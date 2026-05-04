import attributesArrayFromObject from '../lib/attributes-array-from-object.js';
import attributesStringFromObject from '../lib/attributes-string-from-object.js';
import he from '../lib/he.js';
import indent from '../lib/indent.js';
import showInvalid from '../lib/show-invalid.js';
import stringifyContentArray from '../lib/stringify-content-array.js';
import { styleObjectToCss } from '../lib/style-utils.js';
import { camelToKebab, LINE_BREAK_TEST_REGEX, preserveSpaces } from '../lib/text-utils.js';
import LiteralTag from './literal-tag.js';

// TODO validate via "import elements from 'html-validate/dist/es/html5.js'";

function isValidStyleValue(v) {
  return [null, undefined, false].includes(v) || ['string', 'number'].includes(typeof v);
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
    this.content = [];
    this.namespace = options.namespace;
    this.encodeContent = options.encodeContent;

    const handleItem = c =>  {
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
        return `${attr}="${value}"`;
      }).join(', ');
      const message = `invalid attribute \`${attrString}\` given for element \`${this.tagName}\``;
      showInvalid(message, this.validationLevel, this.logger);
    }
  }

  isValidNamespaceAttribute(attr) {
    return this.namespaces.includes(attr.match(/[^A-Z|-]+/u)[0]); // characters before first uppercase or hyphen
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
    if (
      this.content.some(c => !['string', 'number'].includes(typeof c) &&
        (this.contentIsLiteral ||
        (!(c instanceof ContentTag) &&
        !(c instanceof LiteralTag))),
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

    return !LINE_BREAK_TEST_REGEX.test(content);
  }

  attributeString() {
    const attrString = attributesStringFromObject(
      this.attributes, { attrsSet: this.allowedAttributeMap, encode: true },
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
      str += this.content.map(c => {
        if (typeof c === 'string' && this.encodeContent) {
          return he.encode(c);
        }
        return c;
      }).join('\n');
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
      if (attrName.startsWith('on') && typeof attrValue === 'function') {
        const eventName = attrName.replace(/^on/, '');
        element.addEventListener(eventName, attrValue);
      } else {
        element.setAttribute(attrName, attrValue);
      }
    }

    this.content.forEach(node => {
      if (node instanceof ContentTag || node instanceof LiteralTag) {
        element.append(node.toElement());
      } else {
        if (!this.contentIsLiteral && typeof node === 'string') {
          node = preserveSpaces(node);
        }
        element.append(document.createTextNode(node));
      }
    });

    return element;
  }
}
