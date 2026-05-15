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

function attrType(name, type) {
  if (name === 'style') {
    return 'Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>)>';
  }
  if (name === 'class') { return 'Reactive<string | string[]>'; }
  if (name === 'hidden') { return 'Reactive<boolean | "until-found" | "hidden">'; }
  return `Reactive<${type}>`;
}

function attributesType({ attributes = [], globalTypes, tag }) {
  const propField = `prop?: PropFor<'${tag}'> | null;`;
  if (!attributes.length) {
    return [`{ ${propField} }`, ...globalTypes].join(' & ');
  }

  return [`{
  ${attributes.flatMap(a => {
    const lines = [`'${a.name}'?: ${attrType(a.name, a.type)};`];
    const camelName = kebabToCamel(a.name);
    if (a.name !== camelName) {
      lines.push(`'${camelName}'?: ${attrType(a.name, a.type)};`);
    }
    return lines;
  }).join('\n  ')}
  ${propField}
}`, ...globalTypes].join(' & ');
}

function svgAttributesType({ attributes = [], globalTypes, tag }) {
  const propField = `prop?: PropFor<'${tag}'> | null;`;
  const ownTypes = attributes.length
    ? [`{\n  ${attributes.flatMap(a => {
      const lines = [`'${a.name}'?: ${attrType(a.name, a.type)};`];
      const camelName = kebabToCamel(a.name);
      if (a.name !== camelName) {
        lines.push(`'${camelName}'?: ${attrType(a.name, a.type)};`);
      }
      return lines;
    }).join('\n  ')}\n  ${propField}\n}`]
    : [`{ ${propField} }`];
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
  mount(target: string | Element): void;
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
 * Read-only view of a signal. Returned by \`computed()\` and \`.transform()\`.
 * Pass as content or an attribute value — the DOM updates automatically when the value changes.
 */
export interface ReadonlySignal<T> {
  get(): T;
  readonly value: T;
  stop(): void;
  transform<U>(fn: (value: T) => U): ReadonlySignal<U>;
}

/**
 * Returned by \`signal()\`. Pass as content or an attribute value — the DOM updates automatically
 * when the signal changes. In \`.toString()\` the current value is used as a snapshot.
 * Use \`signal()\` to create instances; do not construct directly.
 */
export class Signal<T> implements ReadonlySignal<T> {
  private constructor();
  get(): T;
  readonly value: T;
  set(valueOrFn: T | ((current: T) => T)): void;
  stop(): void;
  transform<U>(fn: (value: T) => U): ReadonlySignal<U>;
}

export type Reactive<T> = T | ReadonlySignal<T>;

type ElementInterface<Tag extends string> =
  Tag extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[Tag] :
  Tag extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[Tag] :
  HTMLElement;
type PropFor<Tag extends string> = {
  [K in keyof ElementInterface<Tag>]?: ElementInterface<Tag>[K] | ReadonlySignal<ElementInterface<Tag>[K]>
} & { [key: string]: unknown };

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
  [key: \`\${"data" | "aria"}\${string}\`]: Reactive<string | object>
}

export type GlobalAttributes = {
  ${globalAttributes.map(a => `${a.name}?: ${attrType(a.name, a.type)};`).join('\n  ')}
}

export type GlobalEvents = {
  ${globalEvents.map(e => `${e}?: string | ((event: ${EVENT_TYPES[e] ?? 'Event'}) => void);`).join('\n  ')}
  on?: Record<string, (event: Event) => void>;
}
${svgPresentationAttrTypes?.length ? `
type SvgPresentationAttributes = {
  ${svgPresentationAttrTypes.flatMap(a => {
    const lines = [`'${a.name}'?: Reactive<${a.type}>;`];
    const camelName = kebabToCamel(a.name);
    if (a.name !== camelName) {
      lines.push(`'${camelName}'?: Reactive<${a.type}>;`);
    }
    return lines;
  }).join('\n  ')}
}
` : ''}
${elements.map(e => `type ${e.attributesTypeName} = ${e.tagType === 'SvgContent' ? svgAttributesType(e) : attributesType(e)};`).join('\n\n')}

${strictContainers.map(el => {
  const extras = ['LiteralTag', 'CommentTag', 'ReadonlySignal<any>', 'null', 'undefined', 'boolean'];
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
export type Content = ContentTag | VoidTag | LiteralTag | CommentTag | ReadonlySignal<any> | string | number | boolean | null | undefined | (ContentTag | VoidTag | LiteralTag | CommentTag | ReadonlySignal<any> | string | number | boolean | null | undefined)[];

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
    /** Attribute validation behavior. Default: \`'off'\`. */
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
  createCustomTag<A extends Record<string, AttributeValue> = Record<never, AttributeValue>>(
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
  literal(str: string | ReadonlySignal<string>): LiteralTag

  /**
   * Like \`.literal()\` but skips HTML encoding — use only for trusted HTML.
   */
  unsafeLiteral(str: string | ReadonlySignal<string>): LiteralTag

  /**
   * Creates an HTML comment. Multi-line strings are formatted across multiple lines.
   * @example
   * t.inlineComment('hello world')  // <!-- hello world -->
   */
  inlineComment(str: string | number | ReadonlySignal<string> | ReadonlySignal<number>): CommentTag

  /**
   * Renders a full HTML document. Identical to \`.html()\` but prepends \`<!DOCTYPE html>\`.
   * Call \`.toString()\` on the result.
   *
   * @example
   * t.htmlWithDocType({ lang: 'en' }, t.body('hello')).toString();
   */
  htmlWithDocType(attributes: HtmlAttributes, content?: ${htmlContentType}): ContentTag;
  htmlWithDocType(content?: ${htmlContentType}): ContentTag;

  ${elements.flatMap(el => {
    if (el.returnTagType === 'Void') {
      const retType = el.branded ? `${el.pascalTag}Tag` : 'VoidTag';
      return [`${el.methodName}(attributes?: ${el.attributesTypeName}): ${retType};`];
    }
    const retType = el.branded ? `${el.pascalTag}Tag` : 'ContentTag';
    const contentType = el.strictChildren ? `${el.pascalTag}Content` : 'Content';
    return [
      `${el.methodName}(attributes: ${el.attributesTypeName}, content?: ${contentType}): ${retType};`,
      `${el.methodName}(content?: ${contentType}): ${retType};`,
    ];
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
export function computed<T>(fn: () => T): ReadonlySignal<T>;

/**
 * Runs \`fn\` immediately and re-runs it whenever any signal read via \`.get()\` inside changes.
 * Use for side effects: syncing to localStorage, updating the URL, fetching data, etc.
 * Returns a handle with a \`stop()\` method — call it to unsubscribe and prevent further runs.
 * @example
 * const e = effect(() => {
 *   localStorage.setItem('sort', sortKey.get());
 * });
 * e.stop(); // unsubscribe
 */
export function effect(fn: () => void): { stop(): void };

/** True in a browser environment, false in Node.js. Use to guard browser-only code that cannot be placed inside effect(). */
export const isBrowser: boolean;

/**
 * Registers component functions and hydrates all server-rendered instances in the page.
 * Call once on the client; Kensington finds every component rendered by \`renderForHydration\`
 * and mounts it reactively.
 *
 * @example
 * import { registerComponents } from 'kensington';
 * registerComponents({ counter, userCard });
 */
export function registerComponents(components: Record<string, (state: Record<string, unknown>) => ContentTag | ContentTag[] | null>): void;

/**
 * Renders a component to an HTML string and embeds the state as a JSON script block for
 * browser-side hydration.
 *
 * @example
 * // server
 * renderForHydration(counter, { count: 42 })
 */
export function renderForHydration<S extends Record<string, unknown>>(
  fn: (state: S) => ContentTag | ContentTag[] | null,
  state: S,
  name?: string
): LiteralTag;


`;
}
