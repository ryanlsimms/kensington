import { markContentTracked } from '../lib/reactive/dom-tracker.js';
import { recordListeners } from '../lib/reactive/element-listeners.js';
import { createLifecycle } from '../lib/reactive/lifecycle.js';
import { reconcile, recordStaticProps } from '../lib/reactive/reconcile.js';
import { isKensingtonSignal } from '../lib/reactive/signal.js';
import {
  attributeArray,
  attributeString,
  contentIsShort,
  renderToString,
} from '../lib/render/serialize.js';
import {
  attributeIsValid,
  attributeValueIsValid,
  isValidNamespaceAttribute,
  validate,
  validateAttributeByType,
} from '../lib/render/validate.js';
import showInvalid from '../lib/util/show-invalid.js';
import { camelToKebab, preserveSpaces } from '../lib/util/text-utils.js';
function isKensingtonTag(c) {
  return c !== null && typeof c === 'object' && c._isKensingtonTag === true;
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
    && (isKensingtonTag(c) || isKensingtonSignal(c));
}

function isPropWritable(element, propName) {
  let obj = element;
  while (obj !== null) {
    const desc = Object.getOwnPropertyDescriptor(obj, propName);
    if (desc) {
      if (desc.set !== undefined) { return true; }
      if ('writable' in desc) { return desc.writable === true; }
      return false;
    }
    obj = Object.getPrototypeOf(obj);
  }
  return false;
}

function collectContent(items, seen = new Set()) {
  const out = [];
  for (const c of [].concat(items)) {
    if ([undefined, null, '', false, true].includes(c)) {
      continue; // false/true arise from conditional content patterns. someCondition && t.span(...)
    }
    if (Array.isArray(c)) {
      if (seen.has(c)) {
        continue;
      }
      seen.add(c);
      out.push(...collectContent(c, seen));
      // no seen.delete. A content array appearing twice is always circular, not a legitimate reuse
      continue;
    }
    out.push(c);
  }
  return out;
}

export default class ContentTag {
  #connectedCallbacks = [];
  #disconnectedCallbacks = [];
  #domElement = null;

  constructor(options) {
    this.tagName = options.tagName;
    this.attributes = options.attributes;
    this.prop = options.attributes?.prop ?? null;
    const rawStyle = options.attributes?.style ?? null;
    let hasSignalStyleProp = false;
    const isPlainStyleObj = rawStyle !== null && typeof rawStyle === 'object'
      && !isKensingtonSignal(rawStyle) && !Array.isArray(rawStyle);
    if (isPlainStyleObj) {
      for (const k of Object.keys(rawStyle)) {
        let v;
        try { v = rawStyle[k]; } catch { continue; }
        if (isKensingtonSignal(v)) { hasSignalStyleProp = true; break; }
      }
    }
    this.styleProps = hasSignalStyleProp ? rawStyle : null;
    this.persist = options.attributes?.persist ?? false;
    this.additionalGlobalAttributes = options.additionalGlobalAttributes ?? {};
    this.allowedAttributeMap = options.allowedAttributeMap ?? new Map(); // empty Map fallback. All non-namespace attrs fail has(), so custom tags with no spec reject everything except namespaces
    this.contentIsLiteral = options.contentIsLiteral;
    this.indentationLevel = options.indentationLevel ?? 2;
    this.namespaces = options.namespaces;
    this.validationLevel = options.validationLevel;
    this.logger = options.logger;
    this.content = collectContent(options.content);
    this.namespace = options.namespace;
    this.encodeContent = options.encodeContent;
  }

  addConnectedCallback(fn) {
    this.#connectedCallbacks.push(fn);
    return this;
  }

  addDisconnectedCallback(fn) {
    this.#disconnectedCallbacks.push(fn);
    return this;
  }

  validate() { return validate(this); }

  isValidNamespaceAttribute(attr) { return isValidNamespaceAttribute(this, attr); }

  attributeIsValid(attr) { return attributeIsValid(this, attr); }

  attributeValueIsValid(attr, value) { return attributeValueIsValid(this, attr, value); }

  validateAttributeByType(type, value) { return validateAttributeByType(type, value); }

  validateContent() {
    const valid = this.content.filter(c => isValidContentItem(c, this.contentIsLiteral));
    if (valid.length === this.content.length) { return; }
    showInvalid(`Invalid content passed to element \`${this.tagName}\``, this.validationLevel, this.logger);
    this.content = valid;
  }

  contentIsShort() { return contentIsShort(this); }

  attributeString() { return attributeString(this); }

  attributeArray() { return attributeArray(this); }

  toString() { return renderToString(this); }

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

  toElement({ _inheritPersist = false } = {}) {
    const persist = this.persist || _inheritPersist;
    if (this.#domElement) {
      if (this.#domElement.isConnected) {
        showInvalid(`toElement() called on a tag instance already in the DOM — the same node will be moved. Call the tag as a function to create a new independent node.`, this.validationLevel, this.logger);
        return this.#domElement;
      }
      if (persist) {
        return this.#domElement;
      }
      if (this.#hasStaleDescendantBindings()) {
        this.#domElement = null;
      } else {
        if (this.#domElement.parentNode !== null) {
          showInvalid(`toElement() called on a tag instance already in the DOM — the same node will be moved. Call the tag as a function to create a new independent node.`, this.validationLevel, this.logger);
        }
        return this.#domElement;
      }
    }
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
    this.validateContent();
    const element = this.namespace
      ? document.createElementNS(this.namespace, this.tagName)
      : document.createElement(this.tagName);

    const lifecycle = createLifecycle({ element, persist });
    let hasSignalContent = false;
    let listeners = null;

    for (const [attrName, attrValue] of this.attributeArray()) {
      if (/^on[a-z]/.test(attrName) && typeof attrValue === 'function') {
        element.addEventListener(attrName.slice(2), attrValue);
        if (listeners === null) { listeners = new Map(); }
        listeners.set(attrName.slice(2), attrValue);
      } else if (isKensingtonSignal(attrValue)) {
        lifecycle.signalEffect(attrValue, (el, val) => {
          if (val === false || val === null || val === undefined) {
            el.removeAttribute(attrName);
          } else if (val === true) {
            el.setAttribute(attrName, '');
          } else {
            el.setAttribute(attrName, String(val));
          }
        }, attrName);
      } else {
        element.setAttribute(attrName, attrValue);
      }
    }

    const events = this.attributes?.on;
    if (events !== null && typeof events === 'object' && !Array.isArray(events)) {
      for (const [eventName, handler] of Object.entries(events)) {
        if (typeof handler === 'function') {
          element.addEventListener(eventName, handler);
          if (listeners === null) { listeners = new Map(); }
          listeners.set(eventName, handler);
        }
      }
    }

    if (this.prop) {
      const statics = {};
      let hasStatics = false;
      for (const [propName, propValue] of Object.entries(this.prop)) {
        if (propName in element && !isPropWritable(element, propName)) {
          showInvalid(`prop key \`${propName}\` is read-only on <${this.tagName}>`, this.validationLevel, this.logger);
          continue;
        }
        if (isKensingtonSignal(propValue)) {
          lifecycle.signalEffect(propValue, (el, val) => { el[propName] = val; }, `prop:${propName}`);
        } else {
          element[propName] = propValue;
          statics[propName] = propValue;
          hasStatics = true;
        }
      }
      if (hasStatics) {
        recordStaticProps(element, statics);
      }
    }

    if (this.styleProps) {
      for (const [propName, propValue] of Object.entries(this.styleProps)) {
        if (!isKensingtonSignal(propValue)) {
          continue; // static values are already set via the initial style attribute
        }
        const cssProp = camelToKebab(propName);
        lifecycle.signalEffect(propValue, (el, val) => {
          if (val === null || val === undefined || val === false || val === '') {
            el.style.removeProperty(cssProp);
          } else {
            el.style.setProperty(cssProp, String(val));
          }
        }, `style:${propName}`);
      }
    }

    for (let node of this.content) { // let, not const. node is reassigned to preserveSpaces(node) below
      if (isKensingtonTag(node)) {
        element.append(node.toElement(node._isKensingtonContentTag ? { _inheritPersist: persist } : undefined));
        continue;
      }
      if (isKensingtonSignal(node)) {
        hasSignalContent = true;
        const startAnchor = document.createComment('');
        const endAnchor = document.createComment('');
        element.append(startAnchor, endAnchor);
        lifecycle.signalEffect(node, (el, val) => {
          reconcile(el, startAnchor, endAnchor, Array.isArray(val) ? val : [val]);
        }, '(content)');
        continue;
      }
      if (!this.contentIsLiteral && typeof node === 'string') { // literal tags (script/style) need exact spacing preserved. Only convert for regular tags
        node = preserveSpaces(node);
      }
      element.append(document.createTextNode(String(node))); // String() handles Symbols. + or template literals would throw
    }

    lifecycle.finalize({
      connectCallbacks: this.#connectedCallbacks,
      disconnectCallbacks: this.#disconnectedCallbacks,
      onCleared: () => { if (this.#domElement === element) { this.#domElement = null; } },
      onReconnect: () => { this.#domElement = element; },
    });

    if (listeners !== null) { recordListeners(element, listeners); }

    if (hasSignalContent) {
      markContentTracked(element);
    }

    this.#domElement = element;
    return element;
  }

  getDomElement() {
    return this.#domElement?.isConnected ? this.#domElement : null;
  }

  // Walks the static content tree asking each descendant tag whether its bindings
  // were stopped by dom-tracker on removal. A null #domElement on a tag we already
  // rendered (or a tracked anchor whose effect was stopped, in LiteralTag's case)
  // is a reliable signal that the subtree's effects are dead and the cached parent
  // element must be rebuilt.
  #hasStaleDescendantBindings() {
    for (const node of this.content) {
      if (node === null || typeof node !== 'object') { continue; }
      if (typeof node._isStaleAfterRemoval === 'function' && node._isStaleAfterRemoval()) {
        return true;
      }
    }
    return false;
  }

  _isStaleAfterRemoval() {
    if (this.#domElement === null) { return true; }
    return this.#hasStaleDescendantBindings();
  }
}
ContentTag.prototype._isKensingtonTag = true;
ContentTag.prototype._isKensingtonContentTag = true;
