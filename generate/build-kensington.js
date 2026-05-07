export default function buildKensington({ elements }) {
  return `import * as allAttributes from './attributes.js';
import getPrototypeMethods from './lib/get-prototype-methods.js';
import showInvalid from './lib/show-invalid.js';
import { camelToKebab } from './lib/text-utils.js';
import CommentTag from './tag-classes/comment-tag.js';
import ContentTag from './tag-classes/content-tag.js';
import HtmlWithDoctypeTag from './tag-classes/html-with-doctype-tag.js';
import LiteralTag from './tag-classes/literal-tag.js';
import VoidTag from './tag-classes/void-tag.js';

/**
 * HTML/SVG/MathML template engine. Every tag is a method that accepts optional attributes
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
   * @param {string | string[]} [options.additionalNamespaces] - Extra attribute namespaces, e.g. \`'hx'\` for htmx.
   * @param {'off' | 'warn' | 'error'} [options.validationLevel] - Attribute validation behavior.
   * @param {number} [options.indentationLevel] - Spaces per indent level. Default: 2.
   * @param {function} [options.logger] - Function called with warning messages when \`validationLevel\` is \`'warn'\`. Default: \`console.log\`.
   */
  constructor(options) {
    const {
      additionalNamespaces = [],
      indentationLevel = 2,
      logger = console.log,
      validationLevel = 'off',
    } = options ?? {};
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
  createCustomTag(tagName, allowedAttributes = {}) {
    if (typeof tagName !== 'string' || !tagName) {
      throw new Error(\`createCustomTag: tagName must be a non-empty string; got: \${JSON.stringify(tagName)}\`);
    }
    if (allowedAttributes === null || typeof allowedAttributes !== 'object' || Array.isArray(allowedAttributes)) {
      throw new Error(\`createCustomTag: allowedAttributes must be a plain object; got: \${typeof allowedAttributes}\`);
    }
    const kebabAttributes = Object.fromEntries(Object.entries(allowedAttributes).map(([k,v]) => [camelToKebab(k), v]));
    return this.createTag(tagName, kebabAttributes, ContentTag, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
    });
  }

  createContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
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

  createSvgContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      includeGlobalAttributes: false,
      includeGlobalEvents: true,
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
      namespace,
    } = options;
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
        for (const [k, v] of Object.entries(allAttributes.globalAttributes ?? {})) {
          allowedAttributeMap.set(k, v);
        }
      }
      if (includeGlobalEvents) {
        for (const [k, v] of Object.entries(allAttributes.globalEvents ?? {})) {
          allowedAttributeMap.set(k, v);
        }
      }
    }

    return (attributesOrContent = null, content, thirdArg) => {
      let attributes = attributesOrContent;

      if (thirdArg !== undefined) {
        throw new Error(\`Too many arguments given for \${tagName}\`);
      }

      // Use getPrototypeOf so null-prototype objects and objects with an own
      // constructor property are still recognised as plain attribute objects.
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
        validationLevel: this.validationLevel,
      });

      if (this.validationLevel !== 'off') {
        instance.validate(this.validationLevel);
      }
      return instance;
    };
  }

  /**
   * Embeds a raw HTML string verbatim in the output. Throws if the string contains a script tag.
   * @param {string} str
   * @returns {LiteralTag}
   * @example
   * t.ul([t.li('typed'), t.literal('<li>raw html</li>')]);
   */
  literal(str) {
    if (typeof str !== 'string') {
      throw new Error('literal() only accepts a string');
    }
    if (/<script/i.test(str)) {
      throw new Error(\`<script> tags are not allowed to be passed in literal html.  Use the .unsafeLiteral if you can vouch for the string\`);
    }
    return new LiteralTag(str);
  }

  /**
   * Like \`.literal()\` but skips the script-tag check. Use only for trusted HTML.
   * @param {string} str
   * @returns {LiteralTag}
   */
  unsafeLiteral(str) {
    return new LiteralTag(str);
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
    if (!['string', 'number'].includes(typeof str)) {
      throw new Error('inlineComment only accepts a string or number');
    }
    let text = str.toString();
    if (text.includes('--')) {
      showInvalid('inlineComment text must not contain "--"', this.validationLevel, this.logger);
      text = text.replace(/--/g, '');
    }
    return new CommentTag(text);
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
    return `/** @returns {${returnType}} */\n  ${el.methodName} = this.create${el.tagType}Tag('${el.tag}', allAttributes.${el.attributesName});`;
  }).join('\n  ')}
}
`;
}
