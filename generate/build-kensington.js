export default function buildKensington({ elements }) {
  return `import * as allAttributes from './attributes.js';
import getPrototypeMethods from './lib/util/get-prototype-methods.js';
import showInvalid from './lib/util/show-invalid.js';
import { camelToKebab } from './lib/util/text-utils.js';
import CommentTag from './tag-classes/comment-tag.js';
import ContentTag from './tag-classes/content-tag.js';
import HtmlWithDoctypeTag from './tag-classes/html-with-doctype-tag.js';
import LiteralTag from './tag-classes/literal-tag.js';
import VoidTag from './tag-classes/void-tag.js';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function addAttributeDefaults(target, defaults) {
  for (const [name, validator] of Object.entries(defaults ?? {})) {
    if (!target.has(name)) {
      target.set(name, validator);
    }
  }
}

/**
 * HTML/SVG/MathML template library. Every tag is a method that accepts optional attributes
 * and/or content, returning a tag object with \`.toString()\` (HTML string) and \`.toElement()\` (DOM node).
 *
 * Attribute rules: camelCase keys convert to kebab-case, nested objects flatten,
 * boolean attributes are included/omitted, class accepts a string or string array.
 *
 * @example
 * import { t } from 'kensington';
 * const html = t.div({ class: 'container' }, t.p('hello')).toString();
 */
export default class Kensington {
  /**
   * @param {object} [options]
   * @param {Record<string, *>} [options.additionalGlobalAttributes] - Extra attributes allowed on all elements, e.g. \`{ enterkeyhint: ['enter', 'done', 'go', 'next', 'previous', 'search', 'send'] }\`.
   * @param {string | string[]} [options.additionalNamespaces] - Extra attribute namespaces, e.g. \`'hx'\` for htmx.
   * @param {'off' | 'warn' | 'error'} [options.validationLevel] - Attribute validation behavior.
   * @param {number} [options.indentationLevel] - Spaces per indent level. Default: 2.
   * @param {function} [options.logger] - Function called with warning messages when \`validationLevel\` is \`'warn'\`. Default: \`console.log\`.
   */
  constructor(options) {
    const {
      additionalGlobalAttributes = {},
      additionalNamespaces = [],
      indentationLevel = 2,
      logger = console.log,
      validationLevel = 'off',
    } = options ?? {};
    if (
      additionalGlobalAttributes === null ||
      typeof additionalGlobalAttributes !== 'object' ||
      Array.isArray(additionalGlobalAttributes)
    ) {
      throw new Error(\`additionalGlobalAttributes must be a plain object; got: \${typeof additionalGlobalAttributes}\`);
    }
    if (!['off', 'warn', 'error'].includes(validationLevel)) {
      throw new Error(\`validationLevel must be 'off', 'warn', or 'error'; got: \${JSON.stringify(validationLevel)}\`);
    }
    if (typeof indentationLevel !== 'number' || !Number.isInteger(indentationLevel) || indentationLevel < 0) {
      throw new Error(\`indentationLevel must be a non-negative integer; got: \${String(indentationLevel)}\`);
    }
    if (typeof logger !== 'function') {
      throw new Error(\`logger must be a function; got: \${typeof logger}\`);
    }
    if (allAttributes.__slim__ && validationLevel !== 'off') {
      throw new Error(\`The slim build does not include attribute data. Set validationLevel: 'off' or use the full build.\`);
    }
    getPrototypeMethods(this).forEach(key => {
      this[key] = this[key].bind(this);
    });
    this.additionalGlobalAttributes = {};
    for (const [k, v] of Object.entries(additionalGlobalAttributes)) {
      this.additionalGlobalAttributes[camelToKebab(k)] = v;
    }
    this.indentationLevel = indentationLevel;
    this.namespaces = ['data', 'aria'].concat(additionalNamespaces);
    this.validationLevel = validationLevel;
    this.logger = logger;
  }

  /**
   * Creates a method for a custom HTML element. Assign to a class property for typed autocompletion.
   * @param {string} tagName - The HTML tag name, e.g. \`'my-card'\`.
   * @param {Record<string, *>} [allowedAttributes] - Map of attribute names to allowed value types/literals.
   * @returns {function(...*): ContentTag}
   * @example
   * class MyEngine extends Kensington {
   *   myCard = this.createCustomTag('my-card', { 'card-type': ['primary', 'secondary'] });
   * }
   */
  createCustomTag(tagName, allowedAttributes) {
    if (typeof tagName !== 'string' || !tagName) {
      throw new Error(\`createCustomTag: tagName must be a non-empty string; got: \${JSON.stringify(tagName)}\`);
    }
    if (allowedAttributes !== undefined &&
        (allowedAttributes === null || typeof allowedAttributes !== 'object' || Array.isArray(allowedAttributes))) {
      throw new Error(\`createCustomTag: allowedAttributes must be a plain object; got: \${typeof allowedAttributes}\`);
    }
    const hasAllowList = allowedAttributes !== undefined && Object.keys(allowedAttributes).length > 0;
    const kebabAttributes = hasAllowList
      ? Object.fromEntries(Object.entries(allowedAttributes).map(([k, v]) => [camelToKebab(k), v]))
      : {};
    return this.createTag(tagName, kebabAttributes, ContentTag, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
      skipElementAttributeValidation: !hasAllowList,
    });
  }

  createContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
    });
  }

  createContextualContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
      includeSvgGlobalAttributes: true,
      supportedNamespaces: [HTML_NAMESPACE, SVG_NAMESPACE],
    });
  }

  createMathTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      includeGlobalAttributes: false,
      includeGlobalEvents: true,
      namespace: 'http://www.w3.org/1998/Math/MathML',
    });
  }

  createLiteralContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      contentIsLiteral: true,
      encodeContent: !['script', 'style'].includes(tagName),
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
    });
  }

  createContextualLiteralContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      contentIsLiteral: true,
      encodeContent: !['script', 'style'].includes(tagName),
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
      includeSvgGlobalAttributes: true,
      supportedNamespaces: [HTML_NAMESPACE, SVG_NAMESPACE],
    });
  }

  createSvgContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      includeGlobalAttributes: false,
      includeGlobalEvents: true,
      includeSvgGlobalAttributes: true,
      namespace: 'http://www.w3.org/2000/svg',
    });
  }

  createVoidTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, VoidTag, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
    });
  }

  createTag(tagName, allowedAttributes = {}, Klass, options) {
    const {
      contentIsLiteral = false,
      encodeContent = true,
      includeGlobalAttributes,
      includeGlobalEvents,
      includeSvgGlobalAttributes = false,
      namespace,
      skipElementAttributeValidation = false,
      supportedNamespaces,
    } = options;
    const defaultNamespace = namespace ?? HTML_NAMESPACE;
    const namespacePolicy = {
      defaultNamespace,
      supportedNamespaces: supportedNamespaces ?? [defaultNamespace],
    };
    const allowedAttributeMap = new Map(Object.entries(allowedAttributes));
    const invalidTypes = [...allowedAttributeMap.entries()].filter(([, type]) => {
      if ([String, Number, Boolean].includes(type) || Array.isArray(type)) {
        return false;
      }
      return typeof type !== 'function' && typeof type !== 'string' && typeof type !== 'number';
    }).map(([attr]) => attr);
    if (invalidTypes.length) {
      showInvalid(\`invalid types for attribute(s): \${invalidTypes.join(', ')} given for \${tagName}\`, this.validationLevel, this.logger);
    }

    if (this.validationLevel !== 'off') {
      if (includeGlobalAttributes) {
        addAttributeDefaults(allowedAttributeMap, allAttributes.globalAttributes);
      }
      if (includeGlobalEvents) {
        addAttributeDefaults(allowedAttributeMap, allAttributes.globalEvents);
      }
      if (includeSvgGlobalAttributes) {
        addAttributeDefaults(allowedAttributeMap, allAttributes.svgGlobalAttributes);
        addAttributeDefaults(allowedAttributeMap, allAttributes.svgGlobalEvents);
      }
    }
    for (const name of (allAttributes.camelCaseNames ?? [])) {
      if (!allowedAttributeMap.has(name)) {
        allowedAttributeMap.set(name, null);
      }
    }

    return (attributesOrContent = null, content, thirdArg) => {
      let attributes = attributesOrContent;

      if (thirdArg !== undefined) {
        throw new Error(\`Too many arguments given for \${tagName}\`);
      }

      // Use getPrototypeOf so null-prototype objects and objects with an own
      // constructor property are still recognized as plain attribute objects.
      const _proto = attributesOrContent !== null && typeof attributesOrContent === 'object'
        ? Object.getPrototypeOf(attributesOrContent)
        : -1;
      if (_proto !== Object.prototype && _proto !== null) {
        if (content !== undefined) {
          throw new Error(\`Invalid arguments given for \${tagName}\`);
        }
        attributes = {};
        content = attributesOrContent;
      }
      if (typeof content === 'undefined') {
        content = '';
      }
      const instance = new Klass({
        additionalGlobalAttributes: this.additionalGlobalAttributes,
        allowedAttributeMap,
        attributes,
        content,
        contentIsLiteral,
        encodeContent,
        indentationLevel: this.indentationLevel,
        logger: this.logger,
        namespacePolicy,
        namespaces: this.namespaces,
        skipElementAttributeValidation,
        tagName,
        validationLevel: this.validationLevel,
      });

      if (this.validationLevel !== 'off') {
        instance.validate(this.validationLevel);
      }
      return instance;
    };
  }

  /**
   * Embeds a raw markup string verbatim in the output. Live DOM fragments are parsed in the surrounding context.
   * This only blocks script tags; it is not an HTML sanitizer. Use trusted markup.
   * Use \`.unsafeLiteral()\` for trusted markup that includes script tags.
   * @param {string} str
   * @returns {LiteralTag}
   * @example
   * t.ul([t.li('typed'), t.literal('<li>raw markup</li>')]);
   */
  literal(str) {
    return new LiteralTag(str, true, this.validationLevel, this.logger);
  }

  /**
   * Like \`.literal()\` but skips the script-tag check. Use only for trusted markup.
   * HTML-context scripts execute on document insertion. Foreign-content script execution is browser-dependent.
   * @param {string} str
   * @returns {LiteralTag}
   */
  unsafeLiteral(str) {
    return new LiteralTag(str, false, this.validationLevel, this.logger);
  }

  /**
   * Creates an HTML comment. Multi-line strings are formatted across multiple lines.
   * @param {string | number} str
   * @returns {CommentTag}
   * @example
   * t.inlineComment('hello world')  // <!-- hello world -->
   * t.inlineComment('line 1\\nline 2')
   * // <!--
   * //   line 1
   * //   line 2
   * // -->
   */
  inlineComment(str) {
    return new CommentTag(str, this.validationLevel, this.logger);
  }

  /** @returns {ContentTag} */
  htmlWithDocType = this.createTag(
    'html',
    allAttributes.htmlAttributes,
    HtmlWithDoctypeTag,
    { includeGlobalAttributes: true, includeGlobalEvents: true },
  );

  ${elements.map(el => {
    const returnType = el.returnTagType === 'Void' ? 'VoidTag' : 'ContentTag';
    const factoryType = el.svgContextual
      ? (el.tagType === 'LiteralContent' ? 'ContextualLiteralContent' : 'ContextualContent')
      : el.tagType;
    return `/** @returns {${returnType}} */\n  ${el.methodName} = this.create${factoryType}Tag('${el.tag}', allAttributes.${el.attributesName});`;
  }).join('\n  ')}
}
`;
}
