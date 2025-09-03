import he from 'he';

import attributesFromObject from '../lib/attributes-from-object.js';
import indent from '../lib/indent.js';
import { camelToKebab } from '../lib/text-utils.js';

// TODO validate via "import elements from 'html-validate/dist/es/html5.js'";

const INDENTATION_LEVEL = 2;

class KensingtonError extends Error {}

export default class ContentTag {
  constructor({ allowedAttributes = {}, attributes, content, literalContent, namespaces, tagName }) {
    this.tagName = tagName;
    this.attributes = attributes;
    this.allowedAttributes = allowedAttributes;
    this.literalContent = literalContent;
    if (literalContent && typeof content !== 'string') {
      throw new Error('Only string content can be passed to a <script> tag')
    }
    this.namespaces = namespaces;
    this.content = [].concat(content)
      .flat()
      .filter(Boolean)
      .map(c => (typeof c === 'string' && this.tagName !== 'script' ? he.encode(c) : c));

  }

  validate(validationLevel) {
    const unallowedAttributes = Object.keys(this.attributes).filter(attr => !this.attributeIsValid(attr));
    if (unallowedAttributes.length) {
      throw new KensingtonError(`attribute(s): ${unallowedAttributes.join(', ')} not allowed for ${this.tagName}`);
    }

    const invalidAttributeValues = Object.entries(this.attributes).filter(([attr, value]) => !this.attributeValueIsValid(attr, value));
    if (invalidAttributeValues.length) {
      const attrString = invalidAttributeValues.map(([attr, value]) => `${attr}="${value}"`).join(', ');
      const message = `invalid attribute \`${attrString}\` given for element \`${this.tagName}\``;
      const error = new Error(message);
      if (validationLevel === 'error') {
        throw error;
      } else if (validationLevel === 'warn') {
        console.error(message);
        console.error(error.stack);
      }
    }
  }

  isValidNamespaceAttribute(attr) {
    return this.namespaces.includes(attr.match(/[^A-Z]+/u)[0]); // characters before first uppercase
  }

  attributeIsValid(attr) {
    return this.allowedAttributes.hasOwnProperty(attr) ||
      this.allowedAttributes.hasOwnProperty(camelToKebab(attr)) ||
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
    const type = this.allowedAttributes[attr] ?? this.allowedAttributes[camelToKebab(attr)];
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

  attributeString() {
    let attrString = attributesFromObject(this.attributes, Object.keys(this.allowedAttributes));
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
      .map(node => (typeof node === 'string' ? node.replace(/\r?\n/g, '<br>\n') : node))
      .join('\n');

    if (!this.content.length || (this.content.length === 1 && typeof this.content[0] === 'string')) {
      return [startTag, content, endTag].join('');
    }

    return [startTag, indent(content, INDENTATION_LEVEL), endTag].join('\n');
  }
}
