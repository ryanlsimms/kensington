// Hand-written Kensington class for the slim build. Uses a Proxy to dispatch tag method
// access (t.div, t.span, etc.) at runtime via a small tag-info lookup, instead of declaring
// hundreds of class fields up front. No attribute spec data is shipped, so runtime validation
// is unavailable. The slim build is intended for size-conscious browser deployments.

import * as allAttributes from './attributes.js';
import getPrototypeMethods from './lib/get-prototype-methods.js';
import { camelToKebab } from './lib/text-utils.js';
import CommentTag from './tag-classes/comment-tag.js';
import ContentTag from './tag-classes/content-tag.js';
import HtmlWithDoctypeTag from './tag-classes/html-with-doctype-tag.js';
import LiteralTag from './tag-classes/literal-tag.js';
import VoidTag from './tag-classes/void-tag.js';
import tagInfo from './tag-info.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MATH_NS = 'http://www.w3.org/1998/Math/MathML';

// Resolves a tag type code (single letter, matched against the codes emitted by
// generate/build-tag-info.js) to the class + factory options used to build the tag closure.
// Mirrors the create*Tag methods on the generated full Kensington.
const TAG_TYPE_OPTIONS = {
  C: { Klass: ContentTag, namespace: undefined, contentIsLiteral: false },
  V: { Klass: VoidTag, namespace: undefined, contentIsLiteral: false },
  S: { Klass: ContentTag, namespace: SVG_NS, contentIsLiteral: false },
  M: { Klass: ContentTag, namespace: MATH_NS, contentIsLiteral: false },
  L: { Klass: ContentTag, namespace: undefined, contentIsLiteral: true },
  D: { Klass: HtmlWithDoctypeTag, namespace: undefined, contentIsLiteral: false },
};

const LITERAL_RAW_TAGS = new Set(['script', 'style']);

export default class Kensington {
  constructor(options) {
    const {
      additionalGlobalAttributes = {},
      additionalNamespaces = [],
      indentationLevel = 2,
      logger = console.log,
      validationLevel = 'off',
    } = options ?? {};
    const aga = additionalGlobalAttributes;
    if (aga === null || typeof aga !== 'object' || Array.isArray(aga)) {
      throw new Error(`additionalGlobalAttributes must be a plain object; got: ${typeof aga}`);
    }
    if (validationLevel !== 'off') {
      throw new Error(
        `The slim build does not include attribute data. Set validationLevel: 'off' or use the full build.`,
      );
    }
    if (typeof indentationLevel !== 'number' || !Number.isInteger(indentationLevel) || indentationLevel < 0) {
      throw new Error(`indentationLevel must be a non-negative integer; got: ${String(indentationLevel)}`);
    }
    if (typeof logger !== 'function') {
      throw new Error(`logger must be a function; got: ${typeof logger}`);
    }

    this.validationLevel = 'off';
    this.additionalGlobalAttributes = {};
    for (const [k, v] of Object.entries(additionalGlobalAttributes)) {
      this.additionalGlobalAttributes[camelToKebab(k)] = v;
    }
    this.indentationLevel = indentationLevel;
    this.namespaces = ['data', 'aria'].concat(additionalNamespaces);
    this.logger = logger;

    // Bind real instance methods so destructuring (`const { div } = t`) works the same as
    // on the full build. The Proxy below preserves these via the `Reflect.has` check.
    getPrototypeMethods(this).forEach(key => { this[key] = this[key].bind(this); });

    // Memoize resolved tag closures so repeated `t.div` is a map lookup after first access.
    const tagCache = Object.create(null);

    // Returning an object from a constructor is the standard way to wrap an instance in a
    // Proxy. The class itself is what consumers `new` so this swap is invisible to TS types.
    // eslint-disable-next-line no-constructor-return
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (Reflect.has(target, prop)) {
          return Reflect.get(target, prop, receiver);
        }
        if (typeof prop !== 'string') {
          return undefined;
        }
        const cached = tagCache[prop];
        if (cached !== undefined) {
          return cached;
        }
        const info = tagInfo[prop];
        if (info === undefined) {
          return undefined;
        }
        // tag-info.js entries are either a bare type code (when method name == tag name) or
        // [code, tagName] (when they differ, e.g. annotationXml -> 'annotation-xml').
        const [tagType, tagName] = Array.isArray(info) ? info : [info, prop];
        const opts = TAG_TYPE_OPTIONS[tagType];
        if (opts === undefined) {
          return undefined;
        }
        const encodeContent = !(tagType === 'L' && LITERAL_RAW_TAGS.has(tagName));
        const fn = target.createTag(tagName, opts.Klass, {
          namespace: opts.namespace,
          contentIsLiteral: opts.contentIsLiteral,
          encodeContent,
        });
        Object.defineProperty(fn, 'name', { value: prop });
        tagCache[prop] = fn;
        return fn;
      },
    });
  }

  createCustomTag(tagName) {
    if (typeof tagName !== 'string' || !tagName) {
      throw new Error(`createCustomTag: tagName must be a non-empty string; got: ${JSON.stringify(tagName)}`);
    }
    return this.createTag(tagName, ContentTag, {});
  }

  createContentTag(tagName) {
    return this.createTag(tagName, ContentTag, {});
  }

  createMathTag(tagName) {
    return this.createTag(tagName, ContentTag, { namespace: MATH_NS });
  }

  createLiteralContentTag(tagName) {
    return this.createTag(tagName, ContentTag, {
      contentIsLiteral: true,
      encodeContent: !LITERAL_RAW_TAGS.has(tagName),
    });
  }

  createSvgContentTag(tagName) {
    return this.createTag(tagName, ContentTag, { namespace: SVG_NS });
  }

  createVoidTag(tagName) {
    return this.createTag(tagName, VoidTag, {});
  }

  createTag(tagName, Klass, options) {
    const { contentIsLiteral = false, encodeContent = true, namespace } = options;
    // Slim build ships no per-tag attribute spec, but it does ship the set of camelCase
    // attribute names so getAttrName preserves case for SVG attributes (viewBox, etc.)
    // rather than kebab-casing them.
    const allowedAttributeMap = new Map();
    for (const name of (allAttributes.camelCaseNames ?? [])) {
      allowedAttributeMap.set(name, null);
    }

    return (attributesOrContent = null, content, thirdArg) => {
      let attributes = attributesOrContent;
      if (thirdArg !== undefined) {
        throw new Error(`Too many arguments given for ${tagName}`);
      }
      const _proto = attributesOrContent !== null && typeof attributesOrContent === 'object'
        ? Object.getPrototypeOf(attributesOrContent)
        : -1;
      if (_proto !== Object.prototype && _proto !== null) {
        if (content !== undefined) {
          throw new Error(`Invalid arguments given for ${tagName}`);
        }
        attributes = {};
        content = attributesOrContent;
      }
      if (typeof content === 'undefined') {
        content = '';
      }
      return new Klass({
        additionalGlobalAttributes: this.additionalGlobalAttributes,
        allowedAttributeMap,
        attributes,
        content,
        contentIsLiteral,
        encodeContent,
        indentationLevel: this.indentationLevel,
        logger: this.logger,
        namespace,
        namespaces: this.namespaces,
        tagName,
        validationLevel: 'off',
      });
    };
  }

  literal(str) {
    return new LiteralTag(str, true, 'off', this.logger);
  }

  unsafeLiteral(str) {
    return new LiteralTag(str, false, 'off', this.logger);
  }

  inlineComment(str) {
    return new CommentTag(str, 'off', this.logger);
  }
}
