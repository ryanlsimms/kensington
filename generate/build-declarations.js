import { kebabToCamel } from './utils/text-utils.js';

function attributesType({ attributes = [], globalTypes }) {
  if (!attributes.length) {
    return globalTypes.join(' & ');
  }
  const styleType = 'string | csstype.Properties<string | number>';
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
  const styleType = 'string | csstype.Properties<string | number>';
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

/**
 * Returned by \`.signal()\`. Pass as content or an attribute value — the DOM updates automatically
 * when the signal changes. In \`.toString()\` the current value is used as a snapshot.
 */
export class Signal<T> {
  get(): T;
  set(valueOrFn: T | ((current: T) => T)): void;
  transform<U>(fn: (value: T) => U): Signal<U>;
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
  ${globalAttributes.map(a => `${a.name}?: ${a.name === 'style' ? 'string | csstype.Properties<string | number>' : a.name === 'class' ? 'string | string[]' : a.type};`).join('\n  ')}
}

type GlobalEvents = {
  ${globalEvents.map(e => `${e}?: string | ((event: Event) => void);`).join('\n  ')}
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

/**
 * Valid content for any tag method: a string, number, tag instance, or an array of those.
 * \`null\`, \`undefined\`, \`false\`, \`true\`, and \`''\` are silently ignored, so conditional
 * patterns like \`condition && t.span('text')\` work without casting.
 *
 * @example
 * t.ul([t.li('one'), t.li(2), t.li(t.span('three'))]);
 */
export type Content = ContentTag | VoidTag | LiteralTag | CommentTag | Signal<any> | string | number | boolean | null | undefined | (ContentTag | VoidTag | LiteralTag | CommentTag | Signal<any> | string | number | boolean | null | undefined)[];

type UniversalAttributes = NameSpaceAttributes | GlobalAttributes | GlobalEvents;

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
export interface ContentMethod<T = Record<string, unknown>> {
  (attributes: T | UniversalAttributes, content?: Content): ContentTag;
  (content?: Content): ContentTag;
}

type PrimitiveConstructor = StringConstructor | NumberConstructor | BooleanConstructor | FunctionConstructor;
type Primitive = string | number | boolean | Function;
type AttributeValue = PrimitiveConstructor | Primitive | (PrimitiveConstructor | Primitive)[];
type CamelCase<S extends string> = S extends \`\${infer Head}-\${infer Rest}\` ? \`\${Head}\${Capitalize<CamelCase<Rest>>}\` : S;
type KebabCase<S extends string> = S extends \`\${infer H}\${infer T}\` ? H extends Uppercase<H> ? H extends Lowercase<H> ? \`\${H}\${KebabCase<T>}\` : \`-\${Lowercase<H>}\${KebabCase<T>}\` : \`\${H}\${KebabCase<T>}\` : S;

/**
 * HTML/SVG/MathML template engine. Every tag is a method that accepts optional attributes
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
   * Throws if the string contains a \`<script>\` tag — use \`.unsafeLiteral()\` for trusted HTML that includes scripts.
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
  htmlWithDocType<T extends HtmlAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;

  ${elements.flatMap(el => {
    if (el.returnTagType === 'Void') {
      return [`${el.methodName}(attributes?: ${el.attributesTypeName}): VoidTag;`];
    }
    return [`${el.methodName}<T extends ${el.attributesTypeName} | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ${el.returnTagType}Tag;`];
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

/**
 * Creates a reactive signal. Pass as content or an attribute value — the DOM updates live.
 * @example
 * const count = signal(0);
 * document.body.append(t.div(count).toElement());
 * count.set(n => n + 1);
 */
export function signal<T>(initial: T): Signal<T>;

/**
 * Creates a read-only signal derived from other signals. Re-runs automatically whenever
 * any signal read via \`.get()\` inside the function changes.
 * @example
 * const active = signal(true);
 * const cls = computed(() => active.get() ? 'btn-primary' : 'btn-outline');
 */
export function computed<T>(fn: () => T): Signal<T>;

/**
 * Runs \`fn\` immediately and re-runs it whenever any signal read via \`.get()\` inside changes.
 * Use for side effects: syncing to localStorage, updating the URL, fetching data, etc.
 * @example
 * effect(() => {
 *   localStorage.setItem('sort', sortKey.get());
 * });
 */
export function effect(fn: () => void): void;

`;
}
