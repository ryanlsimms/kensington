import { kebabToCamel } from './utils/text-utils.js';

function attributesType({ attributes = [], globalTypes }) {
  if (!attributes.length) {
    return globalTypes.join(' & ')
  }
  return [`{
  ${attributes.flatMap(a => {
    const lines = [`'${a.name}'?: ${a.name === 'class' ? 'string | string[]' : a.type};`];
    const camelName = kebabToCamel(a.name);
    if (a.name !== camelName) {
      lines.push(`'${camelName}'?: ${a.type};`);
    }
    return lines;
  }).join('\n  ')}
}`, ...globalTypes].join(' & ');
}

export default function buildDeclarations({ elements, globalAttributes, globalEvents }) {
  return `/**
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
  toElement(): ChildNode | null;
}

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

type GlobalAttributes = {
  ${globalAttributes.map(a => `${a.name}?: ${a.name === 'class' ? 'string | string[]' : a.type};`).join('\n  ')}
}

type GlobalEvents = {
  ${globalEvents.map(e => `${e}?: string | ((event: Event) => void);`).join('\n  ')}
}

${elements.map(e => `type ${e.attributesTypeName} = ${attributesType(e)};`).join('\n\n')}

export const globalAttributes: GlobalAttributes;
export const globalEvents: GlobalEvents;
${elements.map(e => `export const ${e.attributesName}: ${e.attributesTypeName}`).join('\n')}

/**
 * Valid content for any tag method: a string, number, tag instance, or an array of those.
 * Falsy values (\`null\`, \`undefined\`, \`''\`) are silently ignored.
 *
 * @example
 * t.ul([t.li('one'), t.li(2), t.li(t.span('three'))]);
 */
export type Content = ContentTag | VoidTag | LiteralTag | string | number | (ContentTag | VoidTag | LiteralTag | string | number)[];

type UniversalAttributes = NameSpaceAttributes | GlobalAttributes | GlobalEvents;
type CustomTagArguments<T = null> = [attributes?: T | UniversalAttributes, content?: Content] | [content: Content];

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
export type ContentMethod<T = null> = (...args: CustomTagArguments<T>) => ContentTag;

type PrimitiveConstructor = StringConstructor | NumberConstructor | BooleanConstructor;
type Primitive = string | number | boolean | Function;
type AttributeValue = PrimitiveConstructor | Primitive | (PrimitiveConstructor | Primitive)[];

/**
 * HTML/SVG/MathML template engine. Every tag is a method that accepts optional attributes
 * and/or content, returning a tag object that serialises to formatted HTML via \`.toString()\`
 * or to a live DOM node via \`.toElement()\`.
 *
 * Attribute rules:
 * - camelCase keys convert to kebab-case: \`{ dataBsToggle: 'x' }\` → \`data-bs-toggle="x"\`
 * - nested objects flatten to kebab-case: \`{ data: { id: '1' } }\` → \`data-id="1"\`
 * - boolean attributes: \`{ checked: true }\` → \`checked\`; \`{ checked: false }\` → omitted
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
    /** Allow additional attribute namespaces, e.g. \`'hx'\` for htmx \`hx-*\` attributes. */
    additionalNamespaces?: string | string[];
    /** Spaces per indentation level. Default: 2. Set to 0 to disable indentation. */
    indentationLevel?: number;
    /** Attribute validation behaviour. Default: \`'warn'\`. */
    validationLevel?: 'off' | 'warn' | 'error';
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
  createCustomTag(
    tagName: string,
    allowedAttributes?: Record<string, AttributeValue>
  ): (...args: CustomTagArguments) => ContentTag

  /**
   * Embeds a raw HTML string verbatim into the output (HTML-encoded when used as text content).
   * Use inside any tag's content array to mix typed and raw HTML.
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
   * Renders a full HTML document. Identical to \`.html()\` but prepends \`<!DOCTYPE html>\`.
   * Call \`.toString()\` on the result.
   *
   * @example
   * t.htmlWithDocType({ lang: 'en' }, t.body('hello')).toString();
   */
  htmlWithDocType(attributes: HtmlAttributes, content?: Content): ContentTag;
  htmlWithDocType(content?: Content): ContentTag;

  ${elements.flatMap(el => {
    if (el.returnTagType === 'Void') {
      return [`${el.methodName}(attributes?: ${el.attributesTypeName}): VoidTag;`]
    }
    return [
      `${el.methodName}(attributes: ${el.attributesTypeName}, content?: Content): ${el.returnTagType}Tag;`,
      `${el.methodName}(content?: Content): ${el.returnTagType}Tag;`
    ]
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
