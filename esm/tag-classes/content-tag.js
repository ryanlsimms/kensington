import { markContentTracked } from '../lib/reactive/dom-tracker.js';
import { createLifecycle } from '../lib/reactive/lifecycle.js';
import { reconcile } from '../lib/reactive/reconcile.js';
import { isKensingtonSignal } from '../lib/reactive/signal.js';
import { attributesArrayFromObject, SUBTREE_SIGNAL_KEY } from '../lib/render/attributes.js';
import {
  HTML_NAMESPACE,
  MATH_NAMESPACE,
  namespaceName,
  removeDomAttribute,
  setDomAttribute,
  SVG_NAMESPACE,
} from '../lib/render/namespaces.js';
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

const SVG_HTML_INTEGRATION_POINTS = new Set(['desc', 'foreignObject', 'title']);
const MATH_TEXT_INTEGRATION_POINTS = new Set(['mi', 'mo', 'mn', 'ms', 'mtext']);
const MATH_TEXT_EXCEPTIONS = Object.freeze({
  malignmark: MATH_NAMESPACE,
  mglyph: MATH_NAMESPACE,
});
const ANNOTATION_XML_EXCEPTIONS = Object.freeze({ svg: HTML_NAMESPACE });

function ownEnumerableValue(obj, key) {
  try {
    return Object.prototype.propertyIsEnumerable.call(obj, key) ? obj[key] : undefined;
  } catch {
    return undefined;
  }
}

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

function collectInto(items, out, seen) {
  for (let i = 0; i < items.length; i++) {
    const c = items[i];
    // false/true arise from conditional content patterns. someCondition && t.span(...)
    if (c === undefined || c === null || c === '' || c === false || c === true) { continue; }
    if (Array.isArray(c)) {
      // Cycle detection. A content array appearing twice is always circular, not a legitimate
      // reuse. Lazily allocate the Set since nested arrays in content are uncommon.
      if (seen === undefined) { seen = new Set(); }
      if (seen.has(c)) { continue; }
      seen.add(c);
      collectInto(c, out, seen);
      continue;
    }
    out.push(c);
  }
}

function collectContent(items, seen) {
  const out = [];
  if (Array.isArray(items)) {
    collectInto(items, out, seen);
  } else if (items !== undefined && items !== null && items !== '' && items !== false && items !== true) {
    out.push(items);
  }
  return out;
}

export default class ContentTag {
  #connectedCallbacks = [];
  #disconnectedCallbacks = [];
  #domElement = null;

  constructor(options) {
    this.tagName = options.tagName;
    const attrs = options.attributes;
    this.attributes = attrs;
    // Most tags pass attributes that don't include any of the meta keys, so derive them
    // all from a single property access rather than three independent `attrs?.x` reads.
    if (attrs === null || attrs === undefined) {
      this.prop = null;
      this.styleProps = null;
      this.persist = false;
    } else {
      this.prop = attrs.prop ?? null;
      this.persist = attrs.persist ?? false;
      const rawStyle = attrs.style ?? null;
      let hasSignalStyleProp = false;
      if (rawStyle !== null && typeof rawStyle === 'object'
        && !isKensingtonSignal(rawStyle) && !Array.isArray(rawStyle)) {
        for (const k of Object.keys(rawStyle)) {
          let v;
          try { v = rawStyle[k]; } catch { continue; }
          if (isKensingtonSignal(v)) { hasSignalStyleProp = true; break; }
        }
      }
      this.styleProps = hasSignalStyleProp ? rawStyle : null;
    }
    this.additionalGlobalAttributes = options.additionalGlobalAttributes ?? {};
    this.allowedAttributeMap = options.allowedAttributeMap ?? new Map();
    this.skipElementAttributeValidation = options.skipElementAttributeValidation ?? false;
    this.contentIsLiteral = options.contentIsLiteral;
    this.indentationLevel = options.indentationLevel ?? 2;
    this.namespaces = options.namespaces;
    this.validationLevel = options.validationLevel;
    this.logger = options.logger;
    this.content = collectContent(options.content);
    this.namespacePolicy = options.namespacePolicy ?? {
      defaultNamespace: HTML_NAMESPACE,
      supportedNamespaces: [HTML_NAMESPACE],
    };
    this.encodeContent = options.encodeContent;
  }

  _resolveNamespace(parentContext) {
    const { defaultNamespace, supportedNamespaces } = this.namespacePolicy;
    if (parentContext === undefined) {
      return defaultNamespace;
    }

    const parentNamespace = parentContext.namespaceExceptions?.[this.tagName]
      ?? parentContext.namespace;

    if (supportedNamespaces.length > 1 && supportedNamespaces.includes(parentNamespace)) {
      return parentNamespace;
    }

    const startsForeignNamespaceFromHtml = parentNamespace === HTML_NAMESPACE && (
      (this.tagName === 'svg' && defaultNamespace === SVG_NAMESPACE)
      || (this.tagName === 'math' && defaultNamespace === MATH_NAMESPACE)
    );
    if (parentNamespace === defaultNamespace || startsForeignNamespaceFromHtml) {
      return defaultNamespace;
    }

    showInvalid(
      `namespace mismatch: <${this.tagName}> does not support the ${namespaceName(parentNamespace)} namespace in this tree`,
      this.validationLevel,
      this.logger,
    );
    return defaultNamespace;
  }

  _childRenderContext(namespace) {
    if (namespace === SVG_NAMESPACE && SVG_HTML_INTEGRATION_POINTS.has(this.tagName)) {
      return { namespace: HTML_NAMESPACE };
    }
    if (namespace === MATH_NAMESPACE && MATH_TEXT_INTEGRATION_POINTS.has(this.tagName)) {
      return { namespace: HTML_NAMESPACE, namespaceExceptions: MATH_TEXT_EXCEPTIONS };
    }
    if (namespace === MATH_NAMESPACE && this.tagName === 'annotation-xml') {
      const encoding = ownEnumerableValue(this.attributes, 'encoding');
      if (
        typeof encoding === 'string'
        && ['application/xhtml+xml', 'text/html'].includes(encoding.toLowerCase())
      ) {
        return { namespace: HTML_NAMESPACE };
      }
      return { namespace: MATH_NAMESPACE, namespaceExceptions: ANNOTATION_XML_EXCEPTIONS };
    }
    return { namespace };
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
    // The common case is "everything valid"; scan once and only allocate a filtered array
    // when there's actually something to drop. For lists of thousands of tags this avoids
    // a per-render .filter() allocation that the simpler implementation would do.
    const items = this.content;
    for (let i = 0; i < items.length; i++) {
      if (!isValidContentItem(items[i], this.contentIsLiteral)) {
        showInvalid(`Invalid content passed to element \`${this.tagName}\``, this.validationLevel, this.logger);
        this.content = items.filter(c => isValidContentItem(c, this.contentIsLiteral));
        return;
      }
    }
  }

  contentIsShort() { return contentIsShort(this); }

  attributeString() { return attributeString(this); }

  attributeArray() { return attributeArray(this); }

  toString() { return this._toString(); }

  _toString(parentContext) { return renderToString(this, parentContext); }

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

  toElement({ _inheritPersist = false, _parentContext, _parentElement } = {}) {
    const persist = this.persist || _inheritPersist;
    const namespace = this._resolveNamespace(_parentContext);
    if (this.#domElement && this.#domElement.namespaceURI !== namespace) {
      this.#domElement = null;
    }
    if (this.#domElement) {
      if (this.#domElement.isConnected) {
        showInvalid(`toElement() called on a tag instance already in the DOM. The same node will be moved. Call the tag as a function to create a new independent node.`, this.validationLevel, this.logger);
        return this.#domElement;
      }
      if (persist) {
        return this.#domElement;
      }
      if (this.#hasStaleDescendantBindings()) {
        this.#domElement = null;
      } else {
        if (this.#domElement.parentNode !== null) {
          showInvalid(`toElement() called on a tag instance already in the DOM. The same node will be moved. Call the tag as a function to create a new independent node.`, this.validationLevel, this.logger);
        }
        return this.#domElement;
      }
    }
    if (typeof document === 'undefined') {
      throw new Error('toElement only supported in browser');
    }
    this.validateContent();
    const ownerDocument = _parentElement?.ownerDocument ?? document;
    const element = namespace === HTML_NAMESPACE
      ? ownerDocument.createElement(this.tagName)
      : ownerDocument.createElementNS(namespace, this.tagName);

    // Lifecycle is built lazily on first signal binding (or finalize, if persist or a
    // connect/disconnect callback forces it). Most tags in a typical tree are static and
    // never need one, so this avoids the WeakRef + helper closures + return object that
    // createLifecycle allocates.
    let lifecycle = null;
    const ensureLifecycle = () => (lifecycle ??= createLifecycle({ element, persist }));
    let hasSignalContent = false;

    for (const [attrName, attrValue] of this.attributeArray()) {
      if (attrName === SUBTREE_SIGNAL_KEY) {
        const { signal, prefix, attrsSet, isStyle } = attrValue;
        if (isStyle) {
          // style: signal-yielding-object. On each emission, diff per-property
          // against the previous emission. New/changed: setProperty. Missing: removeProperty.
          const prevProps = new Set();
          ensureLifecycle().signalEffect(signal, (el, val) => {
            const next = new Set();
            if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
              for (const propKey of Object.keys(val)) {
                let v;
                try { v = val[propKey]; } catch { continue; }
                if (isKensingtonSignal(v)) {
                  try { v = v.value; } catch { v = null; }
                }
                const cssProp = camelToKebab(propKey);
                next.add(cssProp);
                if (v === null || v === undefined || v === false || v === '') {
                  el.style.removeProperty(cssProp);
                } else {
                  el.style.setProperty(cssProp, String(v));
                }
              }
            }
            for (const old of prevProps) {
              if (!next.has(old)) {
                el.style.removeProperty(old);
              }
            }
            prevProps.clear();
            for (const p of next) { prevProps.add(p); }
          }, `${prefix}(signal)`);
        } else {
          // Namespace subtree (data/aria/hx/...). On each emission, recursively
          // expand the snapshot into kebab-name attribute pairs with the established
          // prefix, then diff against the previous set.
          const prevAttrs = new Map();
          ensureLifecycle().signalEffect(signal, (el, val) => {
            const next = new Map();
            if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
              const pairs = attributesArrayFromObject(val, { attrsSet, encode: false, prefix });
              for (const [n, v] of pairs) {
                if (n === SUBTREE_SIGNAL_KEY) { continue; } // nested subtree-signal sampled at outer emission, not re-subscribed
                let resolved = v;
                if (isKensingtonSignal(resolved)) {
                  try { resolved = resolved.value; } catch { resolved = null; }
                }
                if (resolved === false || resolved === null || resolved === undefined) { continue; }
                next.set(n, resolved === true ? '' : String(resolved));
              }
            }
            for (const [n, v] of next) {
              if (prevAttrs.get(n) !== v) {
                setDomAttribute(el, n, v);
              }
            }
            for (const old of prevAttrs.keys()) {
              if (!next.has(old)) {
                removeDomAttribute(el, old);
              }
            }
            prevAttrs.clear();
            for (const [n, v] of next) { prevAttrs.set(n, v); }
          }, `${prefix}(signal)`);
        }
      } else if (/^on[a-z]/.test(attrName) && typeof attrValue === 'function') {
        element.addEventListener(attrName.slice(2), attrValue);
      } else if (isKensingtonSignal(attrValue)) {
        ensureLifecycle().signalEffect(attrValue, (el, val) => {
          if (val === false || val === null || val === undefined) {
            removeDomAttribute(el, attrName);
          } else if (val === true) {
            setDomAttribute(el, attrName, '');
          } else {
            setDomAttribute(el, attrName, String(val));
          }
        }, attrName);
      } else {
        setDomAttribute(element, attrName, attrValue);
      }
    }

    const events = this.attributes?.on;
    if (events !== null && typeof events === 'object' && !Array.isArray(events)) {
      for (const [eventName, handler] of Object.entries(events)) {
        if (typeof handler === 'function') {
          element.addEventListener(eventName, handler);
        }
      }
    }

    if (this.styleProps) {
      for (const [propName, propValue] of Object.entries(this.styleProps)) {
        if (!isKensingtonSignal(propValue)) {
          continue; // static values are already set via the initial style attribute
        }
        const cssProp = camelToKebab(propName);
        ensureLifecycle().signalEffect(propValue, (el, val) => {
          if (val === null || val === undefined || val === false || val === '') {
            el.style.removeProperty(cssProp);
          } else {
            el.style.setProperty(cssProp, String(val));
          }
        }, `style:${propName}`);
      }
    }

    const childContext = this._childRenderContext(namespace);
    const childOpts = {
      _inheritPersist: persist,
      _parentContext: childContext,
      _parentElement: element,
    };
    for (let node of this.content) { // let, not const. node is reassigned to preserveSpaces(node) below
      if (isKensingtonTag(node)) {
        element.append(node.toElement(childOpts));
        continue;
      }
      if (isKensingtonSignal(node)) {
        hasSignalContent = true;
        const startAnchor = document.createComment('');
        const endAnchor = document.createComment('');
        element.append(startAnchor, endAnchor);
        ensureLifecycle().signalEffect(node, (el, val) => {
          reconcile(el, startAnchor, endAnchor, Array.isArray(val) ? val : [val], childOpts);
        }, '(content)');
        continue;
      }
      if (!this.contentIsLiteral && typeof node === 'string') { // literal tags (script/style) need exact spacing preserved. Only convert for regular tags
        node = preserveSpaces(node);
      }
      element.append(document.createTextNode(String(node))); // String() handles Symbols. + or template literals would throw
    }

    // `prop` is applied AFTER children. Several DOM properties depend on the live child set
    // (e.g. <select>.value needs its <option> children present, <textarea>.value can be
    // overridden by the text node child if applied first). Setting prop after content avoids
    // these race-on-mount issues without changing the API.
    if (this.prop) {
      for (const [propName, propValue] of Object.entries(this.prop)) {
        if (propName in element && !isPropWritable(element, propName)) {
          showInvalid(`prop key \`${propName}\` is read-only on <${this.tagName}>`, this.validationLevel, this.logger);
          continue;
        }
        if (isKensingtonSignal(propValue)) {
          ensureLifecycle().signalEffect(propValue, (el, val) => { el[propName] = val; }, `prop:${propName}`);
        } else {
          element[propName] = propValue;
        }
      }
    }

    // Finalize only when there's something to register. A null lifecycle here means no
    // signal binding fired, so unless the user added connect/disconnect callbacks (or this
    // is a persist branch that needs the resume hooks) we can skip the call entirely.
    const needsFinalize = lifecycle !== null
      || persist
      || this.#connectedCallbacks.length > 0
      || this.#disconnectedCallbacks.length > 0;
    if (needsFinalize) {
      ensureLifecycle().finalize({
        connectCallbacks: this.#connectedCallbacks,
        disconnectCallbacks: this.#disconnectedCallbacks,
        onCleared: () => { if (this.#domElement === element) { this.#domElement = null; } },
        onReconnect: () => { this.#domElement = element; },
      });
    }

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
