function attributesObject(attributes) {
  return `{
  ${attributes.map(a => `'${a.name}': ${a.value}`).join(',\n  ')}
}`;
}

export function buildMain({ elements }) {
  return `import ContentTag from './tag-classes/content-tag.js';
import HtmlWithDoctypeTag from './tag-classes/html-with-doctype-tag.js';
import LiteralTag from './tag-classes/literal-tag.js';
import VoidTag from './tag-classes/void-tag.js';
import SvgVoidTag from './tag-classes/svg-void-tag.js';
import getPrototypeMethods from './lib/get-prototype-methods.js';
import * as allAttributes from './attributes.js';
import { camelToKebab } from './lib/text-utils.js';

export default class Kensington {
  constructor({ additionalNamespaces = [], runValidation = false } = {}) {
    getPrototypeMethods(this).forEach(key => {
      this[key] = this[key].bind(this);
    });
    this.namespaces = ['data', 'aria'].concat(additionalNamespaces);
    this.runValidation = runValidation;
  }
  
  createCustomTag(tagName, allowedAttributes = {}) {
    const kebabAttributes = Object.fromEntries(Object.entries(allowedAttributes).map(([k,v]) => [camelToKebab(k), v]))
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
    });
  }

  createLiteralContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, { 
      includeGlobalAttributes: true, 
      includeGlobalEvents: true,
      literalContent: true,
    });
  }

  createSvgContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, { 
      includeGlobalAttributes: false, 
      includeGlobalEvents: true,
    });
  }

  createSvgVoidTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, SvgVoidTag, { 
      includeGlobalAttributes: false, 
      includeGlobalEvents: true,
    });
  }

  createVoidTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, VoidTag, { 
      includeGlobalAttributes: true, 
      includeGlobalEvents: true,
    });
  }

  createTag(tagName, allowedAttributes, Klass, { includeGlobalAttributes, includeGlobalEvents, literalContent = false }) {
    const invalidTypes = Object.values(allowedAttributes).filter(type => {
      return ![String, Number, Boolean, Function].includes(type) && !Array.isArray(type)
    });
    if (invalidTypes.length) {
      throw new Error(\`invalid types for attribute(s): \${invalidTypes.join(', ')} given for \${tagName}\`);
    }
    
    return (attributesOrContent = null, content = '') => {
      let attributes = attributesOrContent;

      if (attributesOrContent?.constructor !== Object) {
        attributes = {};
        content = attributesOrContent;
      }
      const instance = new Klass({
        allowedAttributes: {
          ...(includeGlobalAttributes && { ...allAttributes.globalAttributes }),
          ...(includeGlobalEvents && { ...allAttributes.globalEvents }),
          ...allowedAttributes,
        },
        attributes,
        content,
        namespaces: this.namespaces,
        literalContent,
        tagName,
      });
      
      if (this.runValidation) {
        instance.validate();
      }
      return instance;
    }
  }

  literal(str) {
    if (str.includes('<script')) {
      throw new Error('<script> tags are not allowed to be passed in literal html.  Use the .unsafeLiteral if you can vouch for the string')
    }
    return new LiteralTag(str);
  }

  unsafeLiteral(str) {
    return new LiteralTag(str);
  }
  
  htmlWithDocType = this.createTag('html', allAttributes.htmlAttributes, HtmlWithDoctypeTag, { includeGlobalAttributes: true, includeGlobalEvents: true });

  ${elements.map(el => 
    `${el.methodName} = this.create${el.tagType}Tag('${el.tag}', allAttributes.${el.attributesName});`
  ).join('\n  ')}
}

export const t = new Kensington();
`
}

export function buildAttributes({ elements, globalEvents, globalAttributes }) {
  return `
export const globalAttributes = {
  ${globalAttributes.map(a => `'${a.name}': ${a.value},`).join('\n  ')}
};
  
export const globalEvents = {
  ${globalEvents.map(a => `'${a}': String,`).join('\n  ')}
};

${elements.map(el =>
  `export const ${el.attributesName} = ${el.attributes.length ? attributesObject(el.attributes) : '{}'};`
  ).join('\n')}
`
}
