import { kebabToCamel } from './utils/text-utils.js';

const EVENT_TYPES = {
  onauxclick: 'MouseEvent',
  onclick: 'MouseEvent',
  ondblclick: 'MouseEvent',
  oncontextmenu: 'MouseEvent',
  onmousedown: 'MouseEvent',
  onmouseenter: 'MouseEvent',
  onmouseleave: 'MouseEvent',
  onmousemove: 'MouseEvent',
  onmouseout: 'MouseEvent',
  onmouseover: 'MouseEvent',
  onmouseup: 'MouseEvent',
  onkeydown: 'KeyboardEvent',
  onkeypress: 'KeyboardEvent',
  onkeyup: 'KeyboardEvent',
  onbeforeinput: 'InputEvent',
  oninput: 'InputEvent',
  onblur: 'FocusEvent',
  onfocus: 'FocusEvent',
  ondrag: 'DragEvent',
  ondragend: 'DragEvent',
  ondragenter: 'DragEvent',
  ondragleave: 'DragEvent',
  ondragover: 'DragEvent',
  ondragstart: 'DragEvent',
  ondrop: 'DragEvent',
  onwheel: 'WheelEvent',
  onerror: 'ErrorEvent',
  onsubmit: 'SubmitEvent',
  oncopy: 'ClipboardEvent',
  oncut: 'ClipboardEvent',
  onpaste: 'ClipboardEvent',
  onformdata: 'FormDataEvent',
  onsecuritypolicyviolation: 'SecurityPolicyViolationEvent',
  onprogress: 'ProgressEvent',
};

function attributesType({ attributes = [], globalTypes }) {
  if (!attributes.length) {
    return globalTypes.join(' & ');
  }
  const styleType = 'string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>)';
  const classType = 'string | string[]';

  return [`{
  ${attributes.flatMap(a => {
    const attrType = a.name === 'style' ? styleType : a.name === 'class' ? classType : a.type;
    const lines = [`'${a.name}'?: ${attrType};`];
    const camelName = kebabToCamel(a.name);
    if (a.name !== camelName) {
      lines.push(`'${camelName}'?: ${a.name === 'style' ? styleType : a.type};`);
    }
    return lines;
  }).join('\n  ')}
}`, ...globalTypes].join(' & ');
}

function svgAttributesType({ attributes = [], globalTypes }) {
  const styleType = 'string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>)';
  const classType = 'string | string[]';
  const ownTypes = attributes.length
    ? [`{\n  ${attributes.flatMap(a => {
      const attrType = a.name === 'style' ? styleType : a.name === 'class' ? classType : a.type;
      const lines = [`'${a.name}'?: ${attrType};`];
      const camelName = kebabToCamel(a.name);
      if (a.name !== camelName) {
        lines.push(`'${camelName}'?: ${a.name === 'style' ? styleType : a.type};`);
      }
      return lines;
    }).join('\n  ')}\n}`]
    : [];
  return [...ownTypes, 'SvgPresentationAttributes', ...globalTypes].join(' & ');
}

export default function buildDeclarations({ elements, globalAttributes, globalEvents, svgPresentationAttrTypes }) {
  const tagLookup = new Map(elements.map(el => [el.tag, el]));

  function childTypeRef(tag) {
    const el = tagLookup.get(tag);
    return el ? `${el.pascalTag}Tag` : 'ContentTag';
  }

  const brandedElements = elements.filter(el => el.branded);

  const strictContainers = elements.filter(el => el.strictChildren);

  const htmlEl = elements.find(el => el.tag === 'html');
  const htmlContentType = htmlEl?.strictChildren ? `${htmlEl.pascalTag}Content` : 'Content';

  return `import type * as csstype from 'csstype';

/**
 * Returned by content element methods (div, p, span, …).
 * Call \`.toString()\` to get the HTML string, or \`.toElement()\` to create a live DOM node.
 */
export class ContentTag {
  toString(): string;
  toElement(): Element;
}

/**
 * Returned by void element methods (br, hr, input, img, …).
 * Void elements have no closing tag and accept no content argument.
 */
export class VoidTag extends ContentTag {
  toString(): string;
}

/**
 * Returned by \`.literal()\` and \`.unsafeLiteral()\`.
 * Embeds a raw HTML string into the output without further processing.
 */
export class LiteralTag {
  toString(): string;
  toElement(): DocumentFragment;
}

/**
 * Returned by \`.inlineComment()\`.
 */
export class CommentTag {
  toString(): string;
  toElement(): Comment;
}

${brandedElements.map(el => `export class ${el.pascalTag}Tag extends ${el.returnTagType === 'Void' ? 'Void' : 'Content'}Tag { private readonly _k: '${el.tag}' }`).join('\n')}

/**
 * Extend this interface via module augmentation to allow additional attribute namespaces.
 * \`data-*\` and \`aria-*\` are always allowed without augmentation.
 *
 * @example
 * declare module 'kensington' {
 *   interface NameSpaceAttributes {
 *     [key: \`hx\${string}\`]: string | object; // allow htmx hx-* attributes
 *   }
 * }
 * // t.div({ hxBoost: 'true' }) is now valid
 */
export interface NameSpaceAttributes {
  [key: \`\${"data" | "aria"}\${string}\`]: string | object
}

export type GlobalAttributes = {
  ${globalAttributes.map(a => `${a.name}?: ${a.name === 'style' ? 'string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>)' : a.name === 'class' ? 'string | string[]' : a.type};`).join('\n  ')}
}

export type GlobalEvents = {
  ${globalEvents.map(e => `${e}?: string | ((event: ${EVENT_TYPES[e] ?? 'Event'}) => void);`).join('\n  ')}
}
${svgPresentationAttrTypes?.length ? `
type SvgPresentationAttributes = {
  ${svgPresentationAttrTypes.flatMap(a => {
    const lines = [`'${a.name}'?: ${a.type};`];
    const camelName = kebabToCamel(a.name);
    if (a.name !== camelName) {
      lines.push(`'${camelName}'?: ${a.type};`);
    }
    return lines;
  }).join('\n  ')}
}
` : ''}
${elements.map(e => `type ${e.attributesTypeName} = ${e.tagType === 'SvgContent' ? svgAttributesType(e) : attributesType(e)};`).join('\n\n')}

${strictContainers.map(el => {
  const extras = ['LiteralTag', 'CommentTag', 'null', 'undefined', 'boolean'];
  const union = [...el.strictChildren.map(tag => childTypeRef(tag)), ...extras].join(' | ');
  return `type ${el.pascalTag}Content = ${union} | (${union})[];`;
}).join('\n')}

/**
 * Valid content for any tag method: a string, number, tag instance, or an array of those.
 * \`null\`, \`undefined\`, \`false\`, \`true\`, and \`''\` are silently ignored, so conditional
 * patterns like \`condition && t.span('text')\` work without casting.
 *
 * @example
 * t.ul([t.li('one'), t.li(2), t.li(t.span('three'))]);
 */
export type Content = ContentTag | VoidTag | LiteralTag | CommentTag | string | number | boolean | null | undefined | (ContentTag | VoidTag | LiteralTag | CommentTag | string | number | boolean | null | undefined)[];

export type UniversalAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

/**
 * The type of a custom element method created with \`createCustomTag\`.
 * \`T\` is the element's specific attribute object type; global and namespace attributes
 * are always accepted in addition to \`T\`.
 *
 * @example
 * class MyEngine extends Kensington {
 *   myCard: ContentMethod<{ 'card-type'?: 'primary' | 'secondary' }> =
 *     this.createCustomTag('my-card', { 'card-type': ['primary', 'secondary'] });
 * }
 */
export interface ContentMethod<T = {}> {
  (attributes: T & UniversalAttributes, content?: Content): ContentTag;
  (content?: Content): ContentTag;
}

type PrimitiveConstructor = StringConstructor | NumberConstructor | BooleanConstructor | FunctionConstructor;
type Primitive = string | number | boolean | Function;
type AttributeValue = PrimitiveConstructor | Primitive | (PrimitiveConstructor | Primitive)[];
type CamelCase<S extends string> = S extends \`\${infer Head}-\${infer Rest}\` ? \`\${Head}\${Capitalize<CamelCase<Rest>>}\` : S;
type KebabCase<S extends string> = S extends \`\${infer H}\${infer T}\` ? H extends Uppercase<H> ? H extends Lowercase<H> ? \`\${H}\${KebabCase<T>}\` : \`-\${Lowercase<H>}\${KebabCase<T>}\` : \`\${H}\${KebabCase<T>}\` : S;

/**
 * HTML/SVG/MathML template library. Every tag is a method that accepts optional attributes
 * and/or content, returning a tag object that serializes to formatted HTML via \`.toString()\`
 * or to a live DOM node via \`.toElement()\`.
 *
 * Attribute rules:
 * - camelCase keys convert to kebab-case: \`{ dataBsToggle: 'x' }\` → \`data-bs-toggle="x"\`
 * - nested objects flatten to kebab-case: \`{ data: { id: '1' } }\` → \`data-id="1"\`
 * - boolean attributes: \`{ checked: true }\` → \`checked\`. \`{ checked: false }\` → omitted
 * - \`class\` accepts a string or string array: \`{ class: ['a', 'b'] }\` → \`class="a b"\`
 *
 * @example
 * import { t } from 'kensington';
 *
 * const html = t.htmlWithDocType({ lang: 'en' }, [
 *   t.head(t.title('My Page')),
 *   t.body(
 *     t.main({ class: 'container' }, [
 *       t.h1('Hello'),
 *       t.input({ type: 'checkbox', checked: true }),
 *       t.literal('<p>raw html</p>'),
 *     ])
 *   ),
 * ]).toString();
 */
export default class Kensington {
  constructor(options?: {
    /** Allow extra attributes on all elements, e.g. \`{ enterkeyhint: ['enter', 'done', 'go', 'next', 'previous', 'search', 'send'] }\`. */
    additionalGlobalAttributes?: Record<string, unknown>;
    /** Allow additional attribute namespaces, e.g. \`'hx'\` for htmx \`hx-*\` attributes. */
    additionalNamespaces?: string | string[];
    /** Spaces per indentation level. Default: 2. Set to 0 to disable indentation. */
    indentationLevel?: number;
    /** Attribute validation behavior. Default: \`'warn'\`. */
    validationLevel?: 'off' | 'warn' | 'error';
    /** Called with warning messages when \`validationLevel\` is \`'warn'\`. Default: \`console.log\`. */
    logger?: (message: string) => void;
  });

  /**
   * Creates a method for a custom HTML element. Assign to a class property and annotate
   * with \`ContentMethod<T>\` for typed attribute checking.
   *
   * @param tagName - The HTML tag name, e.g. \`'my-card'\`
   * @param allowedAttributes - Map of attribute names to allowed value types/literals
   *
   * @example
   * class MyEngine extends Kensington {
   *   myCard: ContentMethod<{ 'card-type'?: 'primary' | 'secondary' }> =
   *     this.createCustomTag('my-card', { 'card-type': ['primary', 'secondary'] });
   * }
   * const t = new MyEngine();
   * t.myCard({ 'card-type': 'primary' }, 'Content here').toString();
   */
  createCustomTag<A extends Record<string, AttributeValue> = Record<string, AttributeValue>>(
    tagName: string,
    allowedAttributes?: A
  ): ContentMethod<{ [K in keyof A as K | CamelCase<K & string> | KebabCase<K & string>]?: unknown }>

  /**
   * Embeds a raw HTML string verbatim into the output.
   * Use \`.unsafeLiteral()\` for trusted HTML that includes \`<script>\` tags.
   *
   * @example
   * t.ul([t.li('typed'), t.literal('<li>raw html</li>')]).toString();
   */
  literal(str: string): LiteralTag

  /**
   * Like \`.literal()\` but skips HTML encoding — use only for trusted HTML.
   */
  unsafeLiteral(str: string): LiteralTag

  /**
   * Creates an HTML comment. Multi-line strings are formatted across multiple lines.
   * @example
   * t.inlineComment('hello world')  // <!-- hello world -->
   */
  inlineComment(str: string | number): CommentTag

  /**
   * Renders a full HTML document. Identical to \`.html()\` but prepends \`<!DOCTYPE html>\`.
   * Call \`.toString()\` on the result.
   *
   * @example
   * t.htmlWithDocType({ lang: 'en' }, t.body('hello')).toString();
   */
  htmlWithDocType<T extends HtmlAttributes | ${htmlContentType}>(attributesOrContent?: T, ...rest: T extends ${htmlContentType} ? [] : [content?: ${htmlContentType}]): ContentTag;

  ${elements.flatMap(el => {
    if (el.returnTagType === 'Void') {
      const retType = el.branded ? `${el.pascalTag}Tag` : 'VoidTag';
      return [`${el.methodName}(attributes?: ${el.attributesTypeName}): ${retType};`];
    }
    const retType = el.branded ? `${el.pascalTag}Tag` : 'ContentTag';
    const contentType = el.strictChildren ? `${el.pascalTag}Content` : 'Content';
    return [`${el.methodName}<T extends ${el.attributesTypeName} | ${contentType}>(attributesOrContent?: T, ...rest: T extends ${contentType} ? [] : [content?: ${contentType}]): ${retType};`];
  }).join('\n  ')}
}

/**
 * Shared \`Kensington\` instance for use when no subclassing or custom configuration is needed.
 *
 * @example
 * import { t } from 'kensington';
 * const html = t.p({ class: 'intro' }, 'Hello world').toString();
 */
export const t: InstanceType<typeof Kensington>;

`;
}
