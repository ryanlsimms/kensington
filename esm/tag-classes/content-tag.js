import attributesArrayFromObject from '../lib/attributes-array-from-object.js';
import attributesStringFromObject from '../lib/attributes-string-from-object.js';
import { trackForStop } from '../lib/dom-tracker.js';
import he from '../lib/he.js';
import indent from '../lib/indent.js';
import { reconcile } from '../lib/reconcile.js';
import showInvalid from '../lib/show-invalid.js';
import Signal, { effect, isSSRMode } from '../lib/signal.js';
import stringifyContentArray from '../lib/stringify-content-array.js';
import { styleObjectToCss } from '../lib/style-utils.js';
import { camelToKebab, LINE_BREAK_TEST_REGEX, preserveSpaces } from '../lib/text-utils.js';
import CommentTag from './comment-tag.js';
import LiteralTag from './literal-tag.js';

function isValidStyleValue(v) {
  return [null, undefined, false].includes(v) || ['string', 'number'].includes(typeof v); // null/undefined/false are valid. They're silently omitted at render time, not errors
}

function isValidContentItem(c, contentIsLiteral) {
  if (typeof c === 'string') {
    return true;
  }
  if (typeof c === 'number') {
    return isFinite(c); // NaN/Infinity cannot be rendered as text
  }
  // literal tags (script/style) accept only raw strings, not child tag objects
  return !contentIsLiteral
    && (c instanceof ContentTag || c instanceof LiteralTag || c instanceof CommentTag || c instanceof Signal);
}

function applySignalAttribute(element, attrName, sig) {
  const ref = new WeakRef(element);
  const e = effect(() => {
    const el = ref.deref();
    if (!el) { e.stop(); return; }
    const val = sig.get();
    if (val === false || val === null || val === undefined) {
      el.removeAttribute(attrName);
    } else if (val === true) {
      el.setAttribute(attrName, '');
    } else {
      el.setAttribute(attrName, String(val));
    }
  });
  return () => e.stop();
}

function collectContent(items, seen = new Set()) {
  const out = [];
  for (const c of [].concat(items)) {
    if ([undefined, null, '', false, true].includes(c)) {
      continue; // false/true arise from conditional content patterns: someCondition && t.span(...)
    }
    if (Array.isArray(c)) {
      if (seen.has(c)) {
        continue;
      }
      seen.add(c);
      out.push(...collectContent(c, seen));
      // no seen.delete: a content array appearing twice is always circular, not a legitimate reuse
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
    this.additionalGlobalAttributes = options.additionalGlobalAttributes ?? {};
    this.allowedAttributeMap = options.allowedAttributeMap ?? new Map(); // empty Map fallback: all non-namespace attrs fail has(), so custom tags with no spec reject everything except namespaces
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
      return !unallowedAttributes.includes(attr) && !this.attributeValueIsValid(attr, value); // skip value check for already-flagged attrs to avoid double-reporting
    });
    if (invalidAttributeValues.length) {
      const attrString = invalidAttributeValues.map(([attr, value]) => {
        if (attr === 'style' && value !== null && typeof value === 'object' && !Array.isArray(value)) { // !Array.isArray: typeof [] === 'object'
          return `style="${styleObjectToCss(value, (_, v) => !isValidStyleValue(v))}"`;
        }
        if (Array.isArray(value)) {
          // JSON.stringify(Symbol) returns undefined, which JSON array serialization renders as null. String() gives 'Symbol(x)'
          const parts = value.map(v => (typeof v === 'symbol' ? String(v) : JSON.stringify(v)));
          return `${attr}=[${parts.join(',')}]`;
        }
        try {
          return `${attr}="${String(value)}"`;
        } catch {
          // null-proto objects and others with no toString throw when coerced to string
          return `${attr}=[non-serializable]`;
        }
      }).join(', ');
      const message = `invalid attribute \`${attrString}\` given for element \`${this.tagName}\``;
      showInvalid(message, this.validationLevel, this.logger);
    }
  }

  isValidNamespaceAttribute(attr) {
    const match = attr.match(/[^A-Z|-]+/u); // characters before first uppercase or hyphen
    return match !== null && this.namespaces.includes(match[0]); // null when attr starts with a hyphen or is all-uppercase
  }

  attributeIsValid(attr) {
    return this.allowedAttributeMap.has(attr) ||
      this.allowedAttributeMap.has(camelToKebab(attr)) ||
      this.isValidNamespaceAttribute(attr) ||
      camelToKebab(attr) in this.additionalGlobalAttributes;
  }

  attributeValueIsValid(attr, value) {
    if (value instanceof Signal) { return true; }
    if ([undefined, null].includes(value)) {
      return true;
    }
    if (typeof value === 'symbol') {
      return false;
    }
    if (typeof value === 'number' && !isFinite(value)) { // NaN/Infinity are not valid attribute values
      return false;
    }
    if (this.isValidNamespaceAttribute(attr)) {
      return true; // namespace attrs (data-*, aria-*) have no type spec in the map. Any value is accepted
    }
    if (attr === 'id' && typeof value === 'string' && /^\d/.test(value)) {
      return false;
    }
    if (attr === 'class' && Array.isArray(value)) {
      return true; // must return early: the type spec for class is String, so validateAttributeByType would reject arrays
    }
    if (attr === 'style' && value !== null && typeof value === 'object' && !Array.isArray(value)) { // !Array.isArray: typeof [] === 'object'
      for (const k of Object.keys(value)) {
        let v;
        try {
          v = value[k];
        } catch {
          continue;
        }
        if (!isValidStyleValue(v)) {
          return false;
        }
      }
      return true;
    }
    const kebab = camelToKebab(attr);
    const type = this.allowedAttributeMap.get(attr)
      ?? this.allowedAttributeMap.get(kebab)
      ?? this.additionalGlobalAttributes[kebab];
    return this.validateAttributeByType(type, value);
  }

  validateAttributeByType(type, value) {
    if (['number', 'string'].includes(typeof type)) {
      return value === type; // literal enum spec: type: 'submit', type: 'ltr', etc.
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
      if (typeof value === 'number') { return isFinite(value); }
      if (typeof value !== 'string') { return false; } // Number(Symbol) throws. Only attempt coercion on strings
      const n = Number(value);
      return isFinite(n) && n.toString() === value; // round-trip rejects non-canonical ('042', ' 1') and NaN/Infinity strings
    }
    if (typeof type === 'function') {
      return type(value); // custom validator: type spec can be an arbitrary predicate function
    }

    if (Array.isArray(type)) {
      return type.some(typeItem => this.validateAttributeByType(typeItem, value));
    }
    return false; // type is undefined (attr not in the spec map). Treat as invalid
  }

  validateContent() {
    const invalid = this.content.filter(c => !isValidContentItem(c, this.contentIsLiteral));
    if (!invalid.length) { return; }
    showInvalid(`Invalid content passed to element \`${this.tagName}\``, this.validationLevel, this.logger);
    this.content = this.content.filter(c => isValidContentItem(c, this.contentIsLiteral));
  }

  contentIsShort() { // fast path: avoids the heavier stringifyContentArray+indent pipeline for simple single-string content
    if (!this.content.length) {
      return true;
    }

    if (this.content.length > 1) {
      return false;
    }

    let [content] = this.content;
    if (content instanceof Signal) { content = content.get(); }

    if (!['string', 'number'].includes(typeof content)) {
      return false;
    }

    if (content.length > 100) { // numbers have no .length (undefined). undefined > 100 is false, so a single number always passes
      return false;
    }

    return !LINE_BREAK_TEST_REGEX.test(content);
  }

  attributeString() {
    const onFunction = (this.validationLevel === 'off' || isSSRMode())
      ? undefined
      : attrName => showInvalid(`function value for attribute \`${attrName}\` is not supported in toString()`, this.validationLevel, this.logger);
    const attrString = attributesStringFromObject(
      this.attributes,
      { attrsSet: this.allowedAttributeMap, encode: true, onFunction },
    );
    return attrString ? ` ${attrString}` : '';
  }

  attributeArray() {
    return attributesArrayFromObject(this.attributes, { attrsSet: this.allowedAttributeMap, encode: false }); // encode: false — setAttribute handles its own encoding. encode: true is only needed for toString()
  }

  toString() {
    this.validateContent();

    let str = '<'; // chained += instead of a template literal: V8 rope optimization makes many short += faster than one large interpolation
    str += this.tagName;
    str += this.attributeString();
    str += '>';

    if (this.contentIsLiteral) {
      let literalStr = '';
      for (const c of this.content) {
        if (literalStr) { literalStr += '\n'; }
        literalStr += (typeof c === 'string' && this.encodeContent) ? he.encode(c) : String(c); // String(): he.encode requires a string. Literal content can include numbers
      }
      str += literalStr;
    } else if (this.contentIsShort()) {
      for (const c of this.content) {
        const val = c instanceof Signal ? c.get() : c;
        if (typeof val === 'string' && this.encodeContent) {
          str += he.encode(preserveSpaces(val));
        } else {
          str += val;
        }
      }
    } else {
      const resolved = this.content.flatMap(c => {
        const val = c instanceof Signal ? c.get() : c;
        return Array.isArray(val) ? val : [val];
      });
      let content = stringifyContentArray(resolved);

      if (this.indentationLevel) { // falsy (0) means no indentation. Skip the pass entirely rather than calling indent with level 0
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

  mount(target) {
    if (typeof document === 'undefined') {
      throw new Error('mount() only supported in browser');
    }
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) {
      throw new Error(`mount(): no element found for "${target}"`);
    }
    el.replaceWith(this.toElement());
  }

  toElement() {
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
    this.validateContent();
    let element;
    if (this.namespace) {
      element = document.createElementNS(this.namespace, this.tagName);
    } else {
      element = document.createElement(this.tagName);
    }

    const stops = [];

    for (const [attrName, attrValue] of this.attributeArray()) {
      if (attrName.startsWith('on') && typeof attrValue === 'function') {
        element.addEventListener(attrName.replace(/^on/, ''), attrValue);
      } else if (attrValue instanceof Signal) {
        stops.push(applySignalAttribute(element, attrName, attrValue));
      } else {
        element.setAttribute(attrName, attrValue);
      }
    }

    for (let node of this.content) { // let, not const: node is reassigned to preserveSpaces(node) below
      if (node instanceof ContentTag || node instanceof LiteralTag || node instanceof CommentTag) {
        element.append(node.toElement());
        continue;
      }
      if (node instanceof Signal) {
        const elementRef = new WeakRef(element);
        const startAnchor = document.createComment('');
        const endAnchor = document.createComment('');
        element.append(startAnchor, endAnchor);
        const e = effect(() => {
          const el = elementRef.deref();
          if (!el) { e.stop(); return; }
          const val = node.get();
          reconcile(el, startAnchor, endAnchor, Array.isArray(val) ? val : [val]);
        });
        stops.push(() => e.stop());
        continue;
      }
      if (!this.contentIsLiteral && typeof node === 'string') { // literal tags (script/style) need exact spacing preserved. Only convert for regular tags
        node = preserveSpaces(node);
      }
      element.append(document.createTextNode(String(node))); // String() handles Symbols. + or template literals would throw
    }

    if (stops.length > 0) {
      trackForStop(element, () => { for (const stop of stops) { stop(); } });
    }

    return element;
  }
}
