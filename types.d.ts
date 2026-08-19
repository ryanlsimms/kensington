import type * as csstype from 'csstype';

/**
 * Returned by content element methods (div, p, span, …).
 * Call `.toString()` to get the HTML string, or `.toElement()` to create a live DOM node.
 */
export class ContentTag {
  toString(): string;
  toElement(): Element;
  mount(target: string | Element): void;
  /**
   * Returns the live DOM element produced by the most recent `.toElement()` call when that
   * element is still connected to the document, or `null` otherwise. Useful for imperative
   * operations like focus or scroll after a keyboard event, or for reconciler-aware code
   * that needs to inspect the current node.
   */
  getDomElement(): Element | null;
  /**
   * Registers a callback invoked each time this element is inserted into the live DOM.
   * The callback receives the element as both `this` and its first argument. Fires on the
   * initial mount and on every reconnect for `persist: true` parents. Returns this
   * instance for chaining.
   */
  addConnectedCallback<E extends Element = HTMLElement>(fn: (this: E, el: E) => void): this;
  /**
   * Registers a callback invoked each time this element is removed from the live DOM.
   * The callback receives the element as both `this` and its first argument. Returns this
   * instance for chaining. The element type defaults to `HTMLElement`; narrow it via the
   * generic parameter when you need a more specific interface (e.g. `HTMLInputElement`).
   */
  addDisconnectedCallback<E extends Element = HTMLElement>(fn: (this: E, el: E) => void): this;
}

/**
 * Returned by void element methods (br, hr, input, img, …).
 * Void elements have no closing tag and accept no content argument.
 */
export class VoidTag extends ContentTag {
  toString(): string;
}

/**
 * Returned by `.literal()` and `.unsafeLiteral()`.
 * Embeds a raw markup string into the output without further processing.
 * Live DOM fragments are parsed in the surrounding HTML, SVG, or MathML context.
 */
export class LiteralTag {
  toString(): string;
  toElement(): DocumentFragment;
}

/**
 * Returned by `.inlineComment()`.
 */
export class CommentTag {
  toString(): string;
  toElement(): Comment;
  /**
   * Returns the live comment node from the most recent `.toElement()` call when it is still
   * connected to the document, or `null` otherwise.
   */
  getDomElement(): Comment | null;
}

export class BodyTag extends ContentTag { private readonly _k: 'body' }
export class ButtonTag extends ContentTag { private readonly _k: 'button' }
export class CaptionTag extends ContentTag { private readonly _k: 'caption' }
export class ColTag extends VoidTag { private readonly _k: 'col' }
export class ColgroupTag extends ContentTag { private readonly _k: 'colgroup' }
export class DdTag extends ContentTag { private readonly _k: 'dd' }
export class DivTag extends ContentTag { private readonly _k: 'div' }
export class DlTag extends ContentTag { private readonly _k: 'dl' }
export class DtTag extends ContentTag { private readonly _k: 'dt' }
export class H1Tag extends ContentTag { private readonly _k: 'h1' }
export class H2Tag extends ContentTag { private readonly _k: 'h2' }
export class H3Tag extends ContentTag { private readonly _k: 'h3' }
export class H4Tag extends ContentTag { private readonly _k: 'h4' }
export class H5Tag extends ContentTag { private readonly _k: 'h5' }
export class H6Tag extends ContentTag { private readonly _k: 'h6' }
export class HeadTag extends ContentTag { private readonly _k: 'head' }
export class HgroupTag extends ContentTag { private readonly _k: 'hgroup' }
export class HrTag extends VoidTag { private readonly _k: 'hr' }
export class HtmlTag extends ContentTag { private readonly _k: 'html' }
export class ImgTag extends VoidTag { private readonly _k: 'img' }
export class LegendTag extends ContentTag { private readonly _k: 'legend' }
export class LiTag extends ContentTag { private readonly _k: 'li' }
export class MenuTag extends ContentTag { private readonly _k: 'menu' }
export class NoscriptTag extends ContentTag { private readonly _k: 'noscript' }
export class OlTag extends ContentTag { private readonly _k: 'ol' }
export class OptgroupTag extends ContentTag { private readonly _k: 'optgroup' }
export class OptionTag extends ContentTag { private readonly _k: 'option' }
export class PTag extends ContentTag { private readonly _k: 'p' }
export class PictureTag extends ContentTag { private readonly _k: 'picture' }
export class ScriptTag extends ContentTag { private readonly _k: 'script' }
export class SelectTag extends ContentTag { private readonly _k: 'select' }
export class SourceTag extends VoidTag { private readonly _k: 'source' }
export class TableTag extends ContentTag { private readonly _k: 'table' }
export class TbodyTag extends ContentTag { private readonly _k: 'tbody' }
export class TdTag extends ContentTag { private readonly _k: 'td' }
export class TemplateTag extends ContentTag { private readonly _k: 'template' }
export class TfootTag extends ContentTag { private readonly _k: 'tfoot' }
export class ThTag extends ContentTag { private readonly _k: 'th' }
export class TheadTag extends ContentTag { private readonly _k: 'thead' }
export class TrTag extends ContentTag { private readonly _k: 'tr' }
export class UlTag extends ContentTag { private readonly _k: 'ul' }

/**
 * Key used to scope a `signal()`, `computed()`, or `.transform()` call to its surrounding
 * computed. Any value with SameValueZero identity works. Strings and numbers are the common
 * choice (e.g. `item.id`), but symbols and object references are accepted. Object keys require
 * the same reference across outer re-runs; immutable-update patterns that clone the item lose
 * the match and reset the keyed instance.
 */
export type SignalKey = string | number | object | symbol;

/**
 * Read-only view of a signal. Returned by `computed()` and `.transform()`.
 * Pass as content or an attribute value. The DOM updates automatically when the value changes.
 */
export interface ReadonlySignal<T> {
  get(): T;
  readonly value: T;
  stop(): void;
  transform<U>(fn: (value: T) => U, key?: SignalKey): ReadonlySignal<U>;
  /**
   * Keyed list mapper for signals that hold arrays. The first argument is either a function
   * that extracts the key from an item or a property-name string. `mapFn(item)` builds the
   * tag the first time that key appears. On every re-render the cached tag is reused, so the
   * mapper does not pay to rebuild thousands of unchanged subtrees only to discard them
   * after the reconciler matches them. The key is stored on the tag instance via a
   * Kensington-internal property and read by the reconciler. It does not appear in the
   * rendered DOM.
   */
  mapWithKey<Item, U>(this: ReadonlySignal<readonly Item[]>, keyFnOrProp: ((item: Item) => SignalKey) | keyof Item, mapFn: (item: Item) => U): ReadonlySignal<U[]>;
  /**
   * Renders the current value into a DOM node and reactively swaps it when the signal changes.
   * Returns a `DocumentFragment` containing two comment-node anchors with the rendered content
   * between them. Adoption into a real parent (via `append`/`insertBefore`) is supported.
   * The effect stops when the start anchor (or any ancestor) is removed from the DOM.
   * Browser only. Throws in non-browser environments.
   */
  toElement(): Node;
  /**
   * Appends `signal.toElement()` to the given target element. Equivalent to
   * `target.appendChild(signal.toElement())`.
   */
  mount(target: Element): void;
  /**
   * Returns the current value coerced to a string. Inside a reactive context this subscribes,
   * so template-literal coercion of a signal tracks dependencies. Useful for SSR.
   */
  toString(): string;
}

/**
 * Returned by `signal()`. Pass as content or an attribute value. The DOM updates automatically
 * when the signal changes. In `.toString()` the current value is used as a snapshot.
 * Use `signal()` to create instances; do not construct directly.
 */
export class Signal<T> implements ReadonlySignal<T> {
  private constructor();
  get(): T;
  readonly value: T;
  set(valueOrFn: T | ((current: T) => T)): void;
  stop(): void;
  transform<U>(fn: (value: T) => U, key?: SignalKey): ReadonlySignal<U>;
  mapWithKey<Item, U>(this: Signal<Item[]>, keyFnOrProp: ((item: Item) => SignalKey) | keyof Item, mapFn: (item: Item) => U): ReadonlySignal<U[]>;
  toElement(): Node;
  mount(target: Element): void;
  toString(): string;
}

export type Reactive<T> = T | ReadonlySignal<T>;

/**
 * Allowed element in a `class` attribute array. Strings and numbers stringify. `false`,
 * `null`, `undefined`, and `''` are silently dropped so conditional patterns like
 * `isActive && 'active'` work without casts. A signal element updates the class list live
 * as its value changes.
 */
export type ClassValue = string | number | false | null | undefined | ReadonlySignal<string | number | false | null | undefined | string[]>;

/** Index signature for CSS custom properties (`--name`) on style objects. */
type CustomCSSProperties = { [key: `--${string}`]: string | number };

/** A style object where each CSS property may be a static value or a reactive signal. */
type ReactiveStyleProperties = {
  [K in keyof (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>)]?: Reactive<string | number>
} & {
  [key: `--${string}`]: Reactive<string | number>;
};

type ElementInterface<Tag extends string> =
  Tag extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[Tag] :
  Tag extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[Tag] :
  HTMLElement;
type ElementProps<ElementType> = {
  [K in keyof ElementType]?: ElementType[K] | ReadonlySignal<ElementType[K]>
} & { [key: string]: unknown };
type PropFor<Tag extends string> = ElementProps<ElementInterface<Tag>>;
type ContextualPropFor<Tag extends string> =
  | (Tag extends keyof HTMLElementTagNameMap ? ElementProps<HTMLElementTagNameMap[Tag]> : never)
  | (Tag extends keyof SVGElementTagNameMap ? ElementProps<SVGElementTagNameMap[Tag]> : never);

/**
 * Extend this interface via module augmentation to allow additional attribute namespaces.
 * `data-*` and `aria-*` are always allowed without augmentation.
 *
 * @example
 * declare module 'kensington' {
 *   interface NameSpaceAttributes {
 *     [key: `hx${string}`]: string | object; // allow htmx hx-* attributes
 *   }
 * }
 * // t.div({ hxBoost: 'true' }) is now valid
 */
export interface NameSpaceAttributes {
  [key: `${"data" | "aria"}${string}`]: Reactive<string | object>
}

export type GlobalAttributes = {
  accesskey?: Reactive<string>;
  autocapitalize?: Reactive<"on" | "off" | "none" | "sentences" | "words" | "characters">;
  autocorrect?: Reactive<"on" | "off">;
  autofocus?: Reactive<boolean>;
  class?: Reactive<string | ClassValue[]>;
  contenteditable?: Reactive<"true" | "false" | "plaintext-only">;
  dir?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  draggable?: Reactive<"true" | "false">;
  enterkeyhint?: Reactive<"enter" | "done" | "go" | "next" | "previous" | "search" | "send">;
  headingoffset?: Reactive<number | `${number}`>;
  headingreset?: Reactive<boolean>;
  hidden?: Reactive<boolean | "until-found" | "hidden">;
  id?: Reactive<string>;
  inert?: Reactive<boolean>;
  inputmode?: Reactive<"none" | "text" | "tel" | "email" | "url" | "numeric" | "decimal" | "search">;
  is?: Reactive<string>;
  itemid?: Reactive<string>;
  itemprop?: Reactive<string>;
  itemref?: Reactive<string>;
  itemscope?: Reactive<boolean>;
  itemtype?: Reactive<string>;
  lang?: Reactive<string>;
  nonce?: Reactive<string>;
  popover?: Reactive<"auto" | "manual" | "hint">;
  role?: Reactive<string>;
  slot?: Reactive<string>;
  spellcheck?: Reactive<"true" | "false">;
  style?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  tabindex?: Reactive<number | `${number}`>;
  title?: Reactive<string>;
  translate?: Reactive<"yes" | "no">;
  writingsuggestions?: Reactive<"true" | "false">;
}

export type GlobalEvents = {
  onauxclick?: string | ((event: MouseEvent) => void);
  onbeforeinput?: string | ((event: InputEvent) => void);
  onbeforematch?: string | ((event: Event) => void);
  onbeforetoggle?: string | ((event: Event) => void);
  onblur?: string | ((event: FocusEvent) => void);
  oncancel?: string | ((event: Event) => void);
  oncanplay?: string | ((event: Event) => void);
  oncanplaythrough?: string | ((event: Event) => void);
  onchange?: string | ((event: Event) => void);
  onclick?: string | ((event: MouseEvent) => void);
  onclose?: string | ((event: Event) => void);
  oncommand?: string | ((event: Event) => void);
  oncontextlost?: string | ((event: Event) => void);
  oncontextmenu?: string | ((event: MouseEvent) => void);
  oncontextrestored?: string | ((event: Event) => void);
  oncopy?: string | ((event: ClipboardEvent) => void);
  oncuechange?: string | ((event: Event) => void);
  oncut?: string | ((event: ClipboardEvent) => void);
  ondblclick?: string | ((event: MouseEvent) => void);
  ondrag?: string | ((event: DragEvent) => void);
  ondragend?: string | ((event: DragEvent) => void);
  ondragenter?: string | ((event: DragEvent) => void);
  ondragleave?: string | ((event: DragEvent) => void);
  ondragover?: string | ((event: DragEvent) => void);
  ondragstart?: string | ((event: DragEvent) => void);
  ondrop?: string | ((event: DragEvent) => void);
  ondurationchange?: string | ((event: Event) => void);
  onemptied?: string | ((event: Event) => void);
  onended?: string | ((event: Event) => void);
  onerror?: string | ((event: ErrorEvent) => void);
  onfocus?: string | ((event: FocusEvent) => void);
  onformdata?: string | ((event: FormDataEvent) => void);
  oninput?: string | ((event: InputEvent) => void);
  oninvalid?: string | ((event: Event) => void);
  onkeydown?: string | ((event: KeyboardEvent) => void);
  onkeypress?: string | ((event: KeyboardEvent) => void);
  onkeyup?: string | ((event: KeyboardEvent) => void);
  onload?: string | ((event: Event) => void);
  onloadeddata?: string | ((event: Event) => void);
  onloadedmetadata?: string | ((event: Event) => void);
  onloadstart?: string | ((event: Event) => void);
  onmousedown?: string | ((event: MouseEvent) => void);
  onmouseenter?: string | ((event: MouseEvent) => void);
  onmouseleave?: string | ((event: MouseEvent) => void);
  onmousemove?: string | ((event: MouseEvent) => void);
  onmouseout?: string | ((event: MouseEvent) => void);
  onmouseover?: string | ((event: MouseEvent) => void);
  onmouseup?: string | ((event: MouseEvent) => void);
  onpaste?: string | ((event: ClipboardEvent) => void);
  onpause?: string | ((event: Event) => void);
  onplay?: string | ((event: Event) => void);
  onplaying?: string | ((event: Event) => void);
  onprogress?: string | ((event: ProgressEvent) => void);
  onratechange?: string | ((event: Event) => void);
  onreset?: string | ((event: Event) => void);
  onresize?: string | ((event: Event) => void);
  onscroll?: string | ((event: Event) => void);
  onscrollend?: string | ((event: Event) => void);
  onsecuritypolicyviolation?: string | ((event: SecurityPolicyViolationEvent) => void);
  onseeked?: string | ((event: Event) => void);
  onseeking?: string | ((event: Event) => void);
  onselect?: string | ((event: Event) => void);
  onslotchange?: string | ((event: Event) => void);
  onstalled?: string | ((event: Event) => void);
  onsubmit?: string | ((event: SubmitEvent) => void);
  onsuspend?: string | ((event: Event) => void);
  ontimeupdate?: string | ((event: Event) => void);
  ontoggle?: string | ((event: Event) => void);
  onvolumechange?: string | ((event: Event) => void);
  onwaiting?: string | ((event: Event) => void);
  onwheel?: string | ((event: WheelEvent) => void);
  on?: Record<string, (event: any) => void>;
}
type SvgGlobalAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'id'?: Reactive<string>;
  'lang'?: Reactive<string>;
  'role'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  'xml:base'?: Reactive<string>;
  'xml:lang'?: Reactive<string>;
  'xml:space'?: Reactive<"default" | "preserve">;
}

type SvgGlobalEvents = {
  'ondragexit'?: Reactive<string | ((event: Event) => void)>;
  'onshow'?: Reactive<string | ((event: Event) => void)>;
}

type SvgConditionalAttributes = {
  'requiredExtensions'?: Reactive<string>;
  'systemLanguage'?: Reactive<string>;
}

type SvgXLinkAttributes = {
  'xlink:href'?: Reactive<string>;
  'xlink:title'?: Reactive<string>;
}

type SvgPresentationAttributes = {
  'alignment-baseline'?: Reactive<"baseline" | "text-bottom" | "alphabetic" | "ideographic" | "middle" | "central" | "mathematical" | "hanging" | "text-top">;
  'alignmentBaseline'?: Reactive<"baseline" | "text-bottom" | "alphabetic" | "ideographic" | "middle" | "central" | "mathematical" | "hanging" | "text-top">;
  'baseline-shift'?: Reactive<number | string>;
  'baselineShift'?: Reactive<number | string>;
  'clip-path'?: Reactive<string>;
  'clipPath'?: Reactive<string>;
  'clip-rule'?: Reactive<"nonzero" | "evenodd">;
  'clipRule'?: Reactive<"nonzero" | "evenodd">;
  'color'?: Reactive<string>;
  'color-interpolation'?: Reactive<"auto" | "sRGB" | "linearRGB">;
  'colorInterpolation'?: Reactive<"auto" | "sRGB" | "linearRGB">;
  'color-interpolation-filters'?: Reactive<"auto" | "sRGB" | "linearRGB">;
  'colorInterpolationFilters'?: Reactive<"auto" | "sRGB" | "linearRGB">;
  'cursor'?: Reactive<string>;
  'direction'?: Reactive<"ltr" | "rtl">;
  'display'?: Reactive<string>;
  'dominant-baseline'?: Reactive<"auto" | "text-bottom" | "alphabetic" | "ideographic" | "middle" | "central" | "mathematical" | "hanging" | "text-top">;
  'dominantBaseline'?: Reactive<"auto" | "text-bottom" | "alphabetic" | "ideographic" | "middle" | "central" | "mathematical" | "hanging" | "text-top">;
  'fill'?: Reactive<string>;
  'fill-opacity'?: Reactive<number | string>;
  'fillOpacity'?: Reactive<number | string>;
  'fill-rule'?: Reactive<"nonzero" | "evenodd">;
  'fillRule'?: Reactive<"nonzero" | "evenodd">;
  'filter'?: Reactive<string>;
  'flood-color'?: Reactive<string>;
  'floodColor'?: Reactive<string>;
  'flood-opacity'?: Reactive<number | string>;
  'floodOpacity'?: Reactive<number | string>;
  'font-family'?: Reactive<string>;
  'fontFamily'?: Reactive<string>;
  'font-size'?: Reactive<number | string>;
  'fontSize'?: Reactive<number | string>;
  'font-size-adjust'?: Reactive<number | string>;
  'fontSizeAdjust'?: Reactive<number | string>;
  'font-stretch'?: Reactive<number | string>;
  'fontStretch'?: Reactive<number | string>;
  'font-style'?: Reactive<string>;
  'fontStyle'?: Reactive<string>;
  'font-variant'?: Reactive<string>;
  'fontVariant'?: Reactive<string>;
  'font-weight'?: Reactive<number | string>;
  'fontWeight'?: Reactive<number | string>;
  'glyph-orientation-vertical'?: Reactive<string>;
  'glyphOrientationVertical'?: Reactive<string>;
  'image-rendering'?: Reactive<"auto" | "smooth" | "high-quality" | "pixelated" | "crisp-edges">;
  'imageRendering'?: Reactive<"auto" | "smooth" | "high-quality" | "pixelated" | "crisp-edges">;
  'letter-spacing'?: Reactive<number | string>;
  'letterSpacing'?: Reactive<number | string>;
  'lighting-color'?: Reactive<string>;
  'lightingColor'?: Reactive<string>;
  'marker-end'?: Reactive<string>;
  'markerEnd'?: Reactive<string>;
  'marker-mid'?: Reactive<string>;
  'markerMid'?: Reactive<string>;
  'marker-start'?: Reactive<string>;
  'markerStart'?: Reactive<string>;
  'mask'?: Reactive<string>;
  'mask-type'?: Reactive<"luminance" | "alpha">;
  'maskType'?: Reactive<"luminance" | "alpha">;
  'opacity'?: Reactive<number | string>;
  'overflow'?: Reactive<"visible" | "hidden" | "clip" | "scroll" | "auto">;
  'paint-order'?: Reactive<"normal" | "fill" | "stroke" | "markers">;
  'paintOrder'?: Reactive<"normal" | "fill" | "stroke" | "markers">;
  'pointer-events'?: Reactive<"auto" | "bounding-box" | "visiblePainted" | "visibleFill" | "visibleStroke" | "visible" | "painted" | "fill" | "stroke" | "all" | "none">;
  'pointerEvents'?: Reactive<"auto" | "bounding-box" | "visiblePainted" | "visibleFill" | "visibleStroke" | "visible" | "painted" | "fill" | "stroke" | "all" | "none">;
  'shape-rendering'?: Reactive<"auto" | "optimizeSpeed" | "crispEdges" | "geometricPrecision">;
  'shapeRendering'?: Reactive<"auto" | "optimizeSpeed" | "crispEdges" | "geometricPrecision">;
  'stop-color'?: Reactive<string>;
  'stopColor'?: Reactive<string>;
  'stop-opacity'?: Reactive<number | string>;
  'stopOpacity'?: Reactive<number | string>;
  'stroke'?: Reactive<string>;
  'stroke-dasharray'?: Reactive<number | string>;
  'strokeDasharray'?: Reactive<number | string>;
  'stroke-dashoffset'?: Reactive<number | string>;
  'strokeDashoffset'?: Reactive<number | string>;
  'stroke-linecap'?: Reactive<"butt" | "round" | "square">;
  'strokeLinecap'?: Reactive<"butt" | "round" | "square">;
  'stroke-linejoin'?: Reactive<"crop" | "arcs" | "miter" | "bevel" | "round" | "fallback">;
  'strokeLinejoin'?: Reactive<"crop" | "arcs" | "miter" | "bevel" | "round" | "fallback">;
  'stroke-miterlimit'?: Reactive<number | string>;
  'strokeMiterlimit'?: Reactive<number | string>;
  'stroke-opacity'?: Reactive<number | string>;
  'strokeOpacity'?: Reactive<number | string>;
  'stroke-width'?: Reactive<number | string>;
  'strokeWidth'?: Reactive<number | string>;
  'text-anchor'?: Reactive<"start" | "middle" | "end">;
  'textAnchor'?: Reactive<"start" | "middle" | "end">;
  'text-decoration'?: Reactive<string>;
  'textDecoration'?: Reactive<string>;
  'text-overflow'?: Reactive<string>;
  'textOverflow'?: Reactive<string>;
  'text-rendering'?: Reactive<"auto" | "optimizeSpeed" | "optimizeLegibility" | "geometricPrecision">;
  'textRendering'?: Reactive<"auto" | "optimizeSpeed" | "optimizeLegibility" | "geometricPrecision">;
  'transform'?: Reactive<string>;
  'transform-origin'?: Reactive<number | string>;
  'transformOrigin'?: Reactive<number | string>;
  'unicode-bidi'?: Reactive<"normal" | "embed" | "isolate" | "bidi-override" | "isolate-override" | "plaintext">;
  'unicodeBidi'?: Reactive<"normal" | "embed" | "isolate" | "bidi-override" | "isolate-override" | "plaintext">;
  'vector-effect'?: Reactive<"none" | "non-scaling-stroke" | "non-scaling-size" | "non-rotation" | "fixed-position">;
  'vectorEffect'?: Reactive<"none" | "non-scaling-stroke" | "non-scaling-size" | "non-rotation" | "fixed-position">;
  'visibility'?: Reactive<"visible" | "hidden" | "force-hidden" | "collapse">;
  'white-space'?: Reactive<"normal" | "pre" | "pre-wrap" | "pre-line" | "collapse" | "discard" | "preserve" | "preserve-breaks" | "preserve-spaces" | "break-spaces" | "wrap" | "nowrap" | "none" | "discard-before" | "discard-after" | "discard-inner">;
  'whiteSpace'?: Reactive<"normal" | "pre" | "pre-wrap" | "pre-line" | "collapse" | "discard" | "preserve" | "preserve-breaks" | "preserve-spaces" | "break-spaces" | "wrap" | "nowrap" | "none" | "discard-before" | "discard-after" | "discard-inner">;
  'word-spacing'?: Reactive<number | string>;
  'wordSpacing'?: Reactive<number | string>;
  'writing-mode'?: Reactive<"horizontal-tb" | "vertical-rl" | "vertical-lr" | "sideways-rl" | "sideways-lr">;
  'writingMode'?: Reactive<"horizontal-tb" | "vertical-rl" | "vertical-lr" | "sideways-rl" | "sideways-lr">;
}

type AAttributes = {
  'download'?: Reactive<string>;
  'href'?: Reactive<string>;
  'hreflang'?: Reactive<string>;
  'ping'?: Reactive<string>;
  'referrerpolicy'?: Reactive<string>;
  'rel'?: Reactive<string>;
  'target'?: Reactive<string>;
  'type'?: Reactive<string>;
  prop?: ContextualPropFor<'a'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & SvgXLinkAttributes & NameSpaceAttributes & GlobalAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type AbbrAttributes = { prop?: PropFor<'abbr'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AddressAttributes = { prop?: PropFor<'address'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AnimateAttributes = {
  'accumulate'?: Reactive<"none" | "sum">;
  'additive'?: Reactive<"replace" | "sum">;
  'attributeName'?: Reactive<string>;
  'begin'?: Reactive<string>;
  'by'?: Reactive<string>;
  'calcMode'?: Reactive<"discrete" | "linear" | "paced" | "spline">;
  'dur'?: Reactive<string>;
  'end'?: Reactive<string>;
  'fill'?: Reactive<"remove" | "freeze">;
  'from'?: Reactive<string>;
  'href'?: Reactive<string>;
  'keySplines'?: Reactive<string>;
  'keyTimes'?: Reactive<string>;
  'max'?: Reactive<string>;
  'min'?: Reactive<string>;
  'onbegin'?: Reactive<string | ((event: Event) => void)>;
  'onend'?: Reactive<string | ((event: Event) => void)>;
  'onrepeat'?: Reactive<string | ((event: Event) => void)>;
  'repeatCount'?: Reactive<string>;
  'repeatDur'?: Reactive<string>;
  'restart'?: Reactive<"always" | "never" | "whenNotActive">;
  'to'?: Reactive<string>;
  'values'?: Reactive<string>;
  prop?: PropFor<'animate'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type AnimateMotionAttributes = {
  'accumulate'?: Reactive<"none" | "sum">;
  'additive'?: Reactive<"replace" | "sum">;
  'begin'?: Reactive<string>;
  'by'?: Reactive<string>;
  'calcMode'?: Reactive<"discrete" | "linear" | "paced" | "spline">;
  'dur'?: Reactive<string>;
  'end'?: Reactive<string>;
  'fill'?: Reactive<"remove" | "freeze">;
  'from'?: Reactive<string>;
  'href'?: Reactive<string>;
  'keyPoints'?: Reactive<string>;
  'keySplines'?: Reactive<string>;
  'keyTimes'?: Reactive<string>;
  'max'?: Reactive<string>;
  'min'?: Reactive<string>;
  'onbegin'?: Reactive<string | ((event: Event) => void)>;
  'onend'?: Reactive<string | ((event: Event) => void)>;
  'onrepeat'?: Reactive<string | ((event: Event) => void)>;
  'origin'?: Reactive<string>;
  'path'?: Reactive<string>;
  'repeatCount'?: Reactive<string>;
  'repeatDur'?: Reactive<string>;
  'restart'?: Reactive<"always" | "never" | "whenNotActive">;
  'rotate'?: Reactive<string>;
  'to'?: Reactive<string>;
  'values'?: Reactive<string>;
  prop?: PropFor<'animateMotion'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type AnimateTransformAttributes = {
  'accumulate'?: Reactive<"none" | "sum">;
  'additive'?: Reactive<"replace" | "sum">;
  'attributeName'?: Reactive<string>;
  'begin'?: Reactive<string>;
  'by'?: Reactive<string>;
  'calcMode'?: Reactive<"discrete" | "linear" | "paced" | "spline">;
  'dur'?: Reactive<string>;
  'end'?: Reactive<string>;
  'fill'?: Reactive<"remove" | "freeze">;
  'from'?: Reactive<string>;
  'href'?: Reactive<string>;
  'keySplines'?: Reactive<string>;
  'keyTimes'?: Reactive<string>;
  'max'?: Reactive<string>;
  'min'?: Reactive<string>;
  'onbegin'?: Reactive<string | ((event: Event) => void)>;
  'onend'?: Reactive<string | ((event: Event) => void)>;
  'onrepeat'?: Reactive<string | ((event: Event) => void)>;
  'repeatCount'?: Reactive<string>;
  'repeatDur'?: Reactive<string>;
  'restart'?: Reactive<"always" | "never" | "whenNotActive">;
  'to'?: Reactive<string>;
  'type'?: Reactive<"translate" | "scale" | "rotate" | "skewX" | "skewY">;
  'values'?: Reactive<string>;
  prop?: PropFor<'animateTransform'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type AnnotationAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'annotation'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type AnnotationXmlAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'encoding'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'annotation-xml'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type AreaAttributes = {
  'alt'?: Reactive<string>;
  'coords'?: Reactive<string>;
  'download'?: Reactive<string>;
  'href'?: Reactive<string>;
  'ping'?: Reactive<string>;
  'referrerpolicy'?: Reactive<string>;
  'rel'?: Reactive<string>;
  'shape'?: Reactive<"circle" | "CIRCLE" | "default" | "DEFAULT" | "poly" | "POLY" | "rect" | "RECT">;
  'target'?: Reactive<string>;
  prop?: PropFor<'area'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ArticleAttributes = { prop?: PropFor<'article'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AsideAttributes = { prop?: PropFor<'aside'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AudioAttributes = {
  'autoplay'?: Reactive<boolean>;
  'controls'?: Reactive<boolean>;
  'crossorigin'?: Reactive<"anonymous" | "use-credentials">;
  'loading'?: Reactive<"lazy" | "eager">;
  'loop'?: Reactive<boolean>;
  'muted'?: Reactive<boolean>;
  'preload'?: Reactive<"none" | "metadata" | "auto">;
  'src'?: Reactive<string>;
  prop?: PropFor<'audio'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BAttributes = { prop?: PropFor<'b'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BaseAttributes = {
  'href'?: Reactive<string>;
  'target'?: Reactive<string>;
  prop?: PropFor<'base'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BdiAttributes = { prop?: PropFor<'bdi'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BdoAttributes = { prop?: PropFor<'bdo'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BlockquoteAttributes = {
  'cite'?: Reactive<string>;
  prop?: PropFor<'blockquote'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BodyAttributes = {
  'onafterprint'?: Reactive<string | ((event: Event) => void)>;
  'onbeforeprint'?: Reactive<string | ((event: Event) => void)>;
  'onbeforeunload'?: Reactive<string | ((event: Event) => void)>;
  'onhashchange'?: Reactive<string | ((event: Event) => void)>;
  'onlanguagechange'?: Reactive<string | ((event: Event) => void)>;
  'onmessage'?: Reactive<string | ((event: Event) => void)>;
  'onmessageerror'?: Reactive<string | ((event: Event) => void)>;
  'onoffline'?: Reactive<string | ((event: Event) => void)>;
  'ononline'?: Reactive<string | ((event: Event) => void)>;
  'onpagehide'?: Reactive<string | ((event: Event) => void)>;
  'onpagereveal'?: Reactive<string | ((event: Event) => void)>;
  'onpageshow'?: Reactive<string | ((event: Event) => void)>;
  'onpageswap'?: Reactive<string | ((event: Event) => void)>;
  'onpopstate'?: Reactive<string | ((event: Event) => void)>;
  'onrejectionhandled'?: Reactive<string | ((event: Event) => void)>;
  'onstorage'?: Reactive<string | ((event: Event) => void)>;
  'onunhandledrejection'?: Reactive<string | ((event: Event) => void)>;
  'onunload'?: Reactive<string | ((event: Event) => void)>;
  prop?: PropFor<'body'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BrAttributes = { prop?: PropFor<'br'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ButtonAttributes = {
  'command'?: Reactive<string>;
  'commandfor'?: Reactive<string>;
  'disabled'?: Reactive<boolean>;
  'form'?: Reactive<string>;
  'formaction'?: Reactive<string>;
  'formenctype'?: Reactive<"application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain">;
  'formmethod'?: Reactive<"get" | "GET" | "post" | "POST" | "dialog" | "DIALOG">;
  'formnovalidate'?: Reactive<boolean>;
  'formtarget'?: Reactive<string>;
  'name'?: Reactive<string>;
  'popovertarget'?: Reactive<string>;
  'popovertargetaction'?: Reactive<"toggle" | "show" | "hide">;
  'type'?: Reactive<"submit" | "SUBMIT" | "reset" | "RESET" | "button" | "BUTTON">;
  'value'?: Reactive<number | string>;
  prop?: PropFor<'button'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type CanvasAttributes = {
  'height'?: Reactive<number | `${number}`>;
  'width'?: Reactive<number | `${number}`>;
  prop?: PropFor<'canvas'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type CaptionAttributes = { prop?: PropFor<'caption'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type CircleAttributes = {
  'cx'?: Reactive<number | string>;
  'cy'?: Reactive<number | string>;
  'pathLength'?: Reactive<number | `${number}`>;
  'r'?: Reactive<number | string>;
  prop?: PropFor<'circle'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type CiteAttributes = { prop?: PropFor<'cite'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ClipPathAttributes = {
  'externalResourcesRequired'?: Reactive<"true" | "false">;
  'requiredFeatures'?: Reactive<string>;
  prop?: PropFor<'clipPath'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type CodeAttributes = { prop?: PropFor<'code'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ColAttributes = {
  'span'?: Reactive<number | `${number}`>;
  prop?: PropFor<'col'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ColgroupAttributes = {
  'span'?: Reactive<number | `${number}`>;
  prop?: PropFor<'colgroup'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DataAttributes = {
  'value'?: Reactive<number | string>;
  prop?: PropFor<'data'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DatalistAttributes = { prop?: PropFor<'datalist'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DdAttributes = { prop?: PropFor<'dd'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DefsAttributes = { prop?: PropFor<'defs'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type DelAttributes = {
  'cite'?: Reactive<string>;
  'datetime'?: Reactive<string>;
  prop?: PropFor<'del'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DescAttributes = { prop?: PropFor<'desc'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type DetailsAttributes = {
  'name'?: Reactive<string>;
  'open'?: Reactive<boolean>;
  prop?: PropFor<'details'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DfnAttributes = { prop?: PropFor<'dfn'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DialogAttributes = {
  'open'?: Reactive<boolean>;
  prop?: PropFor<'dialog'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DivAttributes = { prop?: PropFor<'div'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DlAttributes = { prop?: PropFor<'dl'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DtAttributes = { prop?: PropFor<'dt'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type EllipseAttributes = {
  'cx'?: Reactive<number | string>;
  'cy'?: Reactive<number | string>;
  'pathLength'?: Reactive<number | `${number}`>;
  'rx'?: Reactive<number | string>;
  'ry'?: Reactive<number | string>;
  prop?: PropFor<'ellipse'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type EmAttributes = { prop?: PropFor<'em'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type EmbedAttributes = {
  'height'?: Reactive<number | `${number}`>;
  'src'?: Reactive<string>;
  'type'?: Reactive<string>;
  'width'?: Reactive<number | `${number}`>;
  prop?: PropFor<'embed'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FeBlendAttributes = { prop?: PropFor<'feBlend'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeColorMatrixAttributes = { prop?: PropFor<'feColorMatrix'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeComponentTransferAttributes = { prop?: PropFor<'feComponentTransfer'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeCompositeAttributes = { prop?: PropFor<'feComposite'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeConvolveMatrixAttributes = { prop?: PropFor<'feConvolveMatrix'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeDiffuseLightingAttributes = { prop?: PropFor<'feDiffuseLighting'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeDisplacementMapAttributes = { prop?: PropFor<'feDisplacementMap'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeDistantLightAttributes = { prop?: PropFor<'feDistantLight'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeDropShadowAttributes = { prop?: PropFor<'feDropShadow'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeFloodAttributes = { prop?: PropFor<'feFlood'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeFuncAAttributes = { prop?: PropFor<'feFuncA'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeFuncBAttributes = { prop?: PropFor<'feFuncB'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeFuncGAttributes = { prop?: PropFor<'feFuncG'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeFuncRAttributes = { prop?: PropFor<'feFuncR'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeGaussianBlurAttributes = { prop?: PropFor<'feGaussianBlur'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeImageAttributes = {
  'externalResourcesRequired'?: Reactive<"true" | "false">;
  prop?: PropFor<'feImage'> | null; persist?: boolean;
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeMergeAttributes = { prop?: PropFor<'feMerge'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeMergeNodeAttributes = { prop?: PropFor<'feMergeNode'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeMorphologyAttributes = { prop?: PropFor<'feMorphology'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeOffsetAttributes = { prop?: PropFor<'feOffset'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FePointLightAttributes = { prop?: PropFor<'fePointLight'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeSpecularLightingAttributes = { prop?: PropFor<'feSpecularLighting'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeSpotLightAttributes = { prop?: PropFor<'feSpotLight'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeTileAttributes = { prop?: PropFor<'feTile'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeTurbulenceAttributes = { prop?: PropFor<'feTurbulence'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FieldsetAttributes = {
  'disabled'?: Reactive<boolean>;
  'form'?: Reactive<string>;
  'name'?: Reactive<string>;
  prop?: PropFor<'fieldset'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FigcaptionAttributes = { prop?: PropFor<'figcaption'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FigureAttributes = { prop?: PropFor<'figure'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FilterAttributes = {
  'externalResourcesRequired'?: Reactive<"true" | "false">;
  prop?: PropFor<'filter'> | null; persist?: boolean;
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FooterAttributes = { prop?: PropFor<'footer'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ForeignObjectAttributes = {
  'height'?: Reactive<number | string>;
  'width'?: Reactive<number | string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
  prop?: PropFor<'foreignObject'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FormAttributes = {
  'accept-charset'?: Reactive<string>;
  'acceptCharset'?: Reactive<string>;
  'action'?: Reactive<string>;
  'autocomplete'?: Reactive<"on" | "off">;
  'enctype'?: Reactive<"application/x-www-form-urlencoded" | "APPLICATION/X-WWW-FORM-URLENCODED" | "multipart/form-data" | "MULTIPART/FORM-DATA" | "text/plain" | "TEXT/PLAIN">;
  'method'?: Reactive<"get" | "GET" | "post" | "POST" | "dialog" | "DIALOG">;
  'name'?: Reactive<string>;
  'novalidate'?: Reactive<boolean>;
  'rel'?: Reactive<string>;
  'target'?: Reactive<string>;
  prop?: PropFor<'form'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type GAttributes = { prop?: PropFor<'g'> | null; persist?: boolean; } & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type H1Attributes = { prop?: PropFor<'h1'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H2Attributes = { prop?: PropFor<'h2'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H3Attributes = { prop?: PropFor<'h3'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H4Attributes = { prop?: PropFor<'h4'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H5Attributes = { prop?: PropFor<'h5'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H6Attributes = { prop?: PropFor<'h6'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HeadAttributes = { prop?: PropFor<'head'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HeaderAttributes = { prop?: PropFor<'header'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HgroupAttributes = { prop?: PropFor<'hgroup'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HrAttributes = { prop?: PropFor<'hr'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HtmlAttributes = { prop?: PropFor<'html'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type IAttributes = { prop?: PropFor<'i'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type IframeAttributes = {
  'allow'?: Reactive<string>;
  'allowfullscreen'?: Reactive<boolean>;
  'height'?: Reactive<number | `${number}`>;
  'loading'?: Reactive<"lazy" | "eager">;
  'name'?: Reactive<string>;
  'referrerpolicy'?: Reactive<string>;
  'sandbox'?: Reactive<string>;
  'src'?: Reactive<string>;
  'srcdoc'?: Reactive<string>;
  'width'?: Reactive<number | `${number}`>;
  prop?: PropFor<'iframe'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ImageAttributes = {
  'crossorigin'?: Reactive<"anonymous" | "use-credentials">;
  'height'?: Reactive<number | string>;
  'href'?: Reactive<string>;
  'preserveAspectRatio'?: Reactive<string>;
  'width'?: Reactive<number | string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
  prop?: PropFor<'image'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type ImgAttributes = {
  'alt'?: Reactive<string>;
  'controls'?: Reactive<boolean>;
  'crossorigin'?: Reactive<"anonymous" | "use-credentials">;
  'decoding'?: Reactive<"sync" | "async" | "auto">;
  'fetchpriority'?: Reactive<"auto" | "high" | "low">;
  'height'?: Reactive<number | `${number}`>;
  'ismap'?: Reactive<boolean>;
  'loading'?: Reactive<"lazy" | "eager">;
  'referrerpolicy'?: Reactive<string>;
  'sizes'?: Reactive<string>;
  'src'?: Reactive<string>;
  'srcset'?: Reactive<string>;
  'usemap'?: Reactive<string>;
  'width'?: Reactive<number | `${number}`>;
  prop?: PropFor<'img'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type InputAttributes = {
  'accept'?: Reactive<string>;
  'alpha'?: Reactive<boolean>;
  'alt'?: Reactive<string>;
  'autocomplete'?: Reactive<string>;
  'checked'?: Reactive<boolean>;
  'colorspace'?: Reactive<"limited-srgb" | "display-p3">;
  'dirname'?: Reactive<string>;
  'disabled'?: Reactive<boolean>;
  'form'?: Reactive<string>;
  'formaction'?: Reactive<string>;
  'formenctype'?: Reactive<"application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain">;
  'formmethod'?: Reactive<"get" | "GET" | "post" | "POST" | "dialog" | "DIALOG">;
  'formnovalidate'?: Reactive<boolean>;
  'formtarget'?: Reactive<string>;
  'height'?: Reactive<number | `${number}`>;
  'list'?: Reactive<string>;
  'max'?: Reactive<string>;
  'maxlength'?: Reactive<number | `${number}`>;
  'min'?: Reactive<string>;
  'minlength'?: Reactive<number | `${number}`>;
  'multiple'?: Reactive<boolean>;
  'name'?: Reactive<string>;
  'pattern'?: Reactive<string>;
  'placeholder'?: Reactive<string>;
  'popovertarget'?: Reactive<string>;
  'popovertargetaction'?: Reactive<"toggle" | "show" | "hide">;
  'readonly'?: Reactive<boolean>;
  'required'?: Reactive<boolean>;
  'size'?: Reactive<number | `${number}`>;
  'src'?: Reactive<string>;
  'step'?: Reactive<number | string>;
  'type'?: Reactive<"hidden" | "text" | "search" | "tel" | "url" | "email" | "password" | "date" | "month" | "week" | "time" | "datetime-local" | "number" | "range" | "color" | "checkbox" | "radio" | "file" | "submit" | "image" | "reset" | "button">;
  'value'?: Reactive<number | string>;
  'width'?: Reactive<number | `${number}`>;
  prop?: PropFor<'input'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type InsAttributes = {
  'cite'?: Reactive<string>;
  'datetime'?: Reactive<string>;
  prop?: PropFor<'ins'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type KbdAttributes = { prop?: PropFor<'kbd'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LabelAttributes = {
  'for'?: Reactive<string>;
  prop?: PropFor<'label'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LegendAttributes = { prop?: PropFor<'legend'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LiAttributes = {
  'value'?: Reactive<number | string>;
  prop?: PropFor<'li'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LineAttributes = {
  'pathLength'?: Reactive<number | `${number}`>;
  'x1'?: Reactive<number | string>;
  'x2'?: Reactive<number | string>;
  'y1'?: Reactive<number | string>;
  'y2'?: Reactive<number | string>;
  prop?: PropFor<'line'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type LinearGradientAttributes = {
  'gradientTransform'?: Reactive<string>;
  'gradientUnits'?: Reactive<"userSpaceOnUse" | "objectBoundingBox">;
  'href'?: Reactive<string>;
  'spreadMethod'?: Reactive<string>;
  'x1'?: Reactive<number | string>;
  'x2'?: Reactive<number | string>;
  'y1'?: Reactive<number | string>;
  'y2'?: Reactive<number | string>;
  prop?: PropFor<'linearGradient'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type LinkAttributes = {
  'as'?: Reactive<string>;
  'blocking'?: Reactive<string>;
  'color'?: Reactive<string>;
  'crossorigin'?: Reactive<"anonymous" | "use-credentials">;
  'disabled'?: Reactive<boolean>;
  'fetchpriority'?: Reactive<"auto" | "high" | "low">;
  'href'?: Reactive<string>;
  'hreflang'?: Reactive<string>;
  'imagesizes'?: Reactive<string>;
  'imagesrcset'?: Reactive<string>;
  'integrity'?: Reactive<string>;
  'media'?: Reactive<string>;
  'referrerpolicy'?: Reactive<string>;
  'rel'?: Reactive<string>;
  'sizes'?: Reactive<string>;
  'type'?: Reactive<string>;
  prop?: PropFor<'link'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MainAttributes = { prop?: PropFor<'main'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MapAttributes = {
  'name'?: Reactive<string>;
  prop?: PropFor<'map'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MarkAttributes = { prop?: PropFor<'mark'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MarkerAttributes = {
  'markerHeight'?: Reactive<string>;
  'markerUnits'?: Reactive<string>;
  'markerWidth'?: Reactive<string>;
  'orient'?: Reactive<string>;
  'preserveAspectRatio'?: Reactive<string>;
  'refX'?: Reactive<string>;
  'refY'?: Reactive<string>;
  'viewBox'?: Reactive<string>;
  prop?: PropFor<'marker'> | null; persist?: boolean;
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type MaskAttributes = {
  'requiredFeatures'?: Reactive<string>;
  prop?: PropFor<'mask'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type MathAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'display'?: Reactive<string>;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  'xmlns'?: Reactive<string>;
  prop?: PropFor<'math'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MencloseAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'notation'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'menclose'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MenuAttributes = { prop?: PropFor<'menu'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MerrorAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'merror'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MetaAttributes = {
  'charset'?: Reactive<"utf-8" | "UTF-8">;
  'content'?: Reactive<string>;
  'http-equiv'?: Reactive<"content-type" | "CONTENT-TYPE" | "default-style" | "DEFAULT-STYLE" | "refresh" | "REFRESH" | "x-ua-compatible" | "X-UA-COMPATIBLE" | "content-security-policy" | "CONTENT-SECURITY-POLICY">;
  'httpEquiv'?: Reactive<"content-type" | "CONTENT-TYPE" | "default-style" | "DEFAULT-STYLE" | "refresh" | "REFRESH" | "x-ua-compatible" | "X-UA-COMPATIBLE" | "content-security-policy" | "CONTENT-SECURITY-POLICY">;
  'media'?: Reactive<string>;
  'name'?: Reactive<string>;
  prop?: PropFor<'meta'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MetadataAttributes = { prop?: PropFor<'metadata'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type MeterAttributes = {
  'high'?: Reactive<number | string>;
  'low'?: Reactive<number | string>;
  'max'?: Reactive<number | string>;
  'min'?: Reactive<number | string>;
  'optimum'?: Reactive<number | string>;
  'value'?: Reactive<number | string>;
  prop?: PropFor<'meter'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MfracAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'linethickness'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mfrac'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MiAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mi'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MmultiscriptsAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mmultiscripts'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MnAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mn'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MoAttributes = {
  'accent'?: Reactive<string>;
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'fence'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'lspace'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'maxsize'?: Reactive<string>;
  'minsize'?: Reactive<string>;
  'movablelimits'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'rspace'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'separator'?: Reactive<string>;
  'stretchy'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'symmetric'?: Reactive<string>;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mo'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MoverAttributes = {
  'accent'?: Reactive<string>;
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mover'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MpaddedAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'depth'?: Reactive<string>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'height'?: Reactive<number | string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'lspace'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  'voffset'?: Reactive<string>;
  'width'?: Reactive<number | string>;
  prop?: PropFor<'mpadded'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MpathAttributes = {
  'href'?: Reactive<string>;
  prop?: PropFor<'mpath'> | null; persist?: boolean;
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type MphantomAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mphantom'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MprescriptsAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mprescripts'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MrootAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mroot'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MrowAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mrow'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MsAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'ms'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MspaceAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'height'?: Reactive<number | string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  'width'?: Reactive<number | string>;
  prop?: PropFor<'mspace'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MsqrtAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'msqrt'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MstyleAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mstyle'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MsubAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'msub'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MsubsupAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'msubsup'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MsupAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'msup'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MtableAttributes = {
  'align'?: Reactive<string>;
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'columnalign'?: Reactive<string>;
  'columnlines'?: Reactive<string>;
  'columnspacing'?: Reactive<string>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'frame'?: Reactive<string>;
  'framespacing'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'rowalign'?: Reactive<string>;
  'rowlines'?: Reactive<string>;
  'rowspacing'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  'width'?: Reactive<number | string>;
  prop?: PropFor<'mtable'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MtdAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'columnalign'?: Reactive<string>;
  'columnspan'?: Reactive<string>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'rowalign'?: Reactive<string>;
  'rowspan'?: Reactive<number | `${number}`>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mtd'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MtextAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mtext'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MtrAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'columnalign'?: Reactive<string>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'rowalign'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'mtr'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MunderAttributes = {
  'accentunder'?: Reactive<string>;
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'munder'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type MunderoverAttributes = {
  'accent'?: Reactive<string>;
  'accentunder'?: Reactive<string>;
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'munderover'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type NavAttributes = { prop?: PropFor<'nav'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type NoscriptAttributes = { prop?: PropFor<'noscript'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ObjectAttributes = {
  'data'?: Reactive<string>;
  'form'?: Reactive<string>;
  'height'?: Reactive<number | `${number}`>;
  'name'?: Reactive<string>;
  'type'?: Reactive<string>;
  'width'?: Reactive<number | `${number}`>;
  prop?: PropFor<'object'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type OlAttributes = {
  'reversed'?: Reactive<boolean>;
  'start'?: Reactive<number | `${number}`>;
  'type'?: Reactive<"1" | "a" | "A" | "i" | "I">;
  prop?: PropFor<'ol'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type OptgroupAttributes = {
  'disabled'?: Reactive<boolean>;
  'label'?: Reactive<string>;
  prop?: PropFor<'optgroup'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type OptionAttributes = {
  'disabled'?: Reactive<boolean>;
  'label'?: Reactive<string>;
  'selected'?: Reactive<boolean>;
  'value'?: Reactive<number | string>;
  prop?: PropFor<'option'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type OutputAttributes = {
  'for'?: Reactive<string>;
  'form'?: Reactive<string>;
  'name'?: Reactive<string>;
  prop?: PropFor<'output'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PAttributes = { prop?: PropFor<'p'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PathAttributes = {
  'd'?: Reactive<string>;
  'pathLength'?: Reactive<number | `${number}`>;
  prop?: PropFor<'path'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type PatternAttributes = {
  'height'?: Reactive<number | string>;
  'href'?: Reactive<string>;
  'patternContentUnits'?: Reactive<string>;
  'patternTransform'?: Reactive<string>;
  'patternUnits'?: Reactive<string>;
  'preserveAspectRatio'?: Reactive<string>;
  'viewBox'?: Reactive<string>;
  'width'?: Reactive<number | string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
  prop?: PropFor<'pattern'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type PictureAttributes = { prop?: PropFor<'picture'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PolygonAttributes = {
  'pathLength'?: Reactive<number | `${number}`>;
  'points'?: Reactive<string>;
  prop?: PropFor<'polygon'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type PolylineAttributes = {
  'pathLength'?: Reactive<number | `${number}`>;
  'points'?: Reactive<string>;
  prop?: PropFor<'polyline'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type PreAttributes = { prop?: PropFor<'pre'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ProgressAttributes = {
  'max'?: Reactive<number | string>;
  'value'?: Reactive<number | string>;
  prop?: PropFor<'progress'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type QAttributes = {
  'cite'?: Reactive<string>;
  prop?: PropFor<'q'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type RadialGradientAttributes = {
  'cx'?: Reactive<number | string>;
  'cy'?: Reactive<number | string>;
  'fr'?: Reactive<string>;
  'fx'?: Reactive<string>;
  'fy'?: Reactive<string>;
  'gradientTransform'?: Reactive<string>;
  'gradientUnits'?: Reactive<"userSpaceOnUse" | "objectBoundingBox">;
  'href'?: Reactive<string>;
  'r'?: Reactive<number | string>;
  'spreadMethod'?: Reactive<string>;
  prop?: PropFor<'radialGradient'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type RectAttributes = {
  'height'?: Reactive<number | string>;
  'pathLength'?: Reactive<number | `${number}`>;
  'rx'?: Reactive<number | string>;
  'ry'?: Reactive<number | string>;
  'width'?: Reactive<number | string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
  prop?: PropFor<'rect'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type RpAttributes = { prop?: PropFor<'rp'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type RtAttributes = { prop?: PropFor<'rt'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type RubyAttributes = { prop?: PropFor<'ruby'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SAttributes = { prop?: PropFor<'s'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SampAttributes = { prop?: PropFor<'samp'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ScriptAttributes = {
  'async'?: Reactive<boolean>;
  'blocking'?: Reactive<string>;
  'crossorigin'?: Reactive<"anonymous" | "use-credentials">;
  'defer'?: Reactive<boolean>;
  'fetchpriority'?: Reactive<"auto" | "high" | "low">;
  'href'?: Reactive<string>;
  'integrity'?: Reactive<string>;
  'nomodule'?: Reactive<boolean>;
  'referrerpolicy'?: Reactive<string>;
  'src'?: Reactive<string>;
  'type'?: Reactive<string>;
  'xml:space'?: Reactive<"preserve">;
  prop?: ContextualPropFor<'script'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgXLinkAttributes & NameSpaceAttributes & GlobalAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type SearchAttributes = { prop?: PropFor<'search'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SectionAttributes = { prop?: PropFor<'section'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SelectAttributes = {
  'autocomplete'?: Reactive<string>;
  'disabled'?: Reactive<boolean>;
  'form'?: Reactive<string>;
  'multiple'?: Reactive<boolean>;
  'name'?: Reactive<string>;
  'required'?: Reactive<boolean>;
  'size'?: Reactive<number | `${number}`>;
  prop?: PropFor<'select'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SelectedcontentAttributes = { prop?: PropFor<'selectedcontent'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SemanticsAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
  prop?: PropFor<'semantics'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalEvents;

type SetAttributes = {
  'attributeName'?: Reactive<string>;
  'begin'?: Reactive<string>;
  'dur'?: Reactive<string>;
  'end'?: Reactive<string>;
  'fill'?: Reactive<"remove" | "freeze">;
  'href'?: Reactive<string>;
  'max'?: Reactive<string>;
  'min'?: Reactive<string>;
  'onbegin'?: Reactive<string | ((event: Event) => void)>;
  'onend'?: Reactive<string | ((event: Event) => void)>;
  'onrepeat'?: Reactive<string | ((event: Event) => void)>;
  'repeatCount'?: Reactive<string>;
  'repeatDur'?: Reactive<string>;
  'restart'?: Reactive<"always" | "never" | "whenNotActive">;
  'to'?: Reactive<string>;
  prop?: PropFor<'set'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type SlotAttributes = {
  'name'?: Reactive<string>;
  prop?: PropFor<'slot'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SmallAttributes = { prop?: PropFor<'small'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SourceAttributes = {
  'height'?: Reactive<number | `${number}`>;
  'media'?: Reactive<string>;
  'sizes'?: Reactive<string>;
  'src'?: Reactive<string>;
  'srcset'?: Reactive<string>;
  'type'?: Reactive<string>;
  'width'?: Reactive<number | `${number}`>;
  prop?: PropFor<'source'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SpanAttributes = { prop?: PropFor<'span'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type StopAttributes = {
  'offset'?: Reactive<number | `${number}`>;
  prop?: PropFor<'stop'> | null; persist?: boolean;
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type StrongAttributes = { prop?: PropFor<'strong'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type StyleAttributes = {
  'blocking'?: Reactive<string>;
  'media'?: Reactive<string>;
  'type'?: Reactive<string>;
  prop?: ContextualPropFor<'style'> | null; persist?: boolean;
} & SvgPresentationAttributes & NameSpaceAttributes & GlobalAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type SubAttributes = { prop?: PropFor<'sub'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SummaryAttributes = { prop?: PropFor<'summary'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SupAttributes = { prop?: PropFor<'sup'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SvgAttributes = {
  'height'?: Reactive<number | string>;
  'onabort'?: Reactive<string | ((event: Event) => void)>;
  'onunload'?: Reactive<string | ((event: Event) => void)>;
  'preserveAspectRatio'?: Reactive<string>;
  'viewBox'?: Reactive<string>;
  'width'?: Reactive<number | string>;
  'x'?: Reactive<number | string>;
  'xmlns'?: Reactive<string>;
  'y'?: Reactive<number | string>;
  prop?: PropFor<'svg'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type SwitchAttributes = { prop?: PropFor<'switch'> | null; persist?: boolean; } & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type SymbolAttributes = {
  'height'?: Reactive<number | string>;
  'preserveAspectRatio'?: Reactive<string>;
  'refX'?: Reactive<string>;
  'refY'?: Reactive<string>;
  'viewBox'?: Reactive<string>;
  'width'?: Reactive<number | string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
  prop?: PropFor<'symbol'> | null; persist?: boolean;
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type TableAttributes = { prop?: PropFor<'table'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TbodyAttributes = { prop?: PropFor<'tbody'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TdAttributes = {
  'colspan'?: Reactive<number | `${number}`>;
  'headers'?: Reactive<string>;
  'rowspan'?: Reactive<number | `${number}`>;
  prop?: PropFor<'td'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TemplateAttributes = {
  'shadowrootclonable'?: Reactive<boolean>;
  'shadowrootcustomelementregistry'?: Reactive<boolean>;
  'shadowrootdelegatesfocus'?: Reactive<boolean>;
  'shadowrootmode'?: Reactive<"open" | "closed">;
  'shadowrootserializable'?: Reactive<boolean>;
  'shadowrootslotassignment'?: Reactive<"named" | "manual">;
  prop?: PropFor<'template'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TextAttributes = {
  'dx'?: Reactive<string>;
  'dy'?: Reactive<string>;
  'lengthAdjust'?: Reactive<string>;
  'rotate'?: Reactive<number | string>;
  'textLength'?: Reactive<string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
  prop?: PropFor<'text'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type TextareaAttributes = {
  'autocomplete'?: Reactive<string>;
  'cols'?: Reactive<number | `${number}`>;
  'dirname'?: Reactive<string>;
  'disabled'?: Reactive<boolean>;
  'form'?: Reactive<string>;
  'maxlength'?: Reactive<number | `${number}`>;
  'minlength'?: Reactive<number | `${number}`>;
  'name'?: Reactive<string>;
  'placeholder'?: Reactive<string>;
  'readonly'?: Reactive<boolean>;
  'required'?: Reactive<boolean>;
  'rows'?: Reactive<number | `${number}`>;
  'wrap'?: Reactive<"soft" | "hard">;
  prop?: PropFor<'textarea'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TextPathAttributes = {
  'href'?: Reactive<string>;
  'lengthAdjust'?: Reactive<string>;
  'method'?: Reactive<"get" | "GET" | "post" | "POST" | "dialog" | "DIALOG">;
  'path'?: Reactive<string>;
  'side'?: Reactive<string>;
  'spacing'?: Reactive<string>;
  'startOffset'?: Reactive<string>;
  'textLength'?: Reactive<string>;
  prop?: PropFor<'textPath'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type TfootAttributes = { prop?: PropFor<'tfoot'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ThAttributes = {
  'abbr'?: Reactive<string>;
  'colspan'?: Reactive<number | `${number}`>;
  'headers'?: Reactive<string>;
  'rowspan'?: Reactive<number | `${number}`>;
  'scope'?: Reactive<"row" | "ROW" | "col" | "COL" | "rowgroup" | "ROWGROUP" | "colgroup" | "COLGROUP">;
  prop?: PropFor<'th'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TheadAttributes = { prop?: PropFor<'thead'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TimeAttributes = {
  'datetime'?: Reactive<string>;
  prop?: PropFor<'time'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TitleAttributes = { prop?: ContextualPropFor<'title'> | null; persist?: boolean; } & SvgPresentationAttributes & NameSpaceAttributes & GlobalAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type TrAttributes = { prop?: PropFor<'tr'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TrackAttributes = {
  'default'?: Reactive<boolean>;
  'kind'?: Reactive<"subtitles" | "captions" | "descriptions" | "chapters" | "metadata">;
  'label'?: Reactive<string>;
  'src'?: Reactive<string>;
  'srclang'?: Reactive<string>;
  prop?: PropFor<'track'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TspanAttributes = {
  'dx'?: Reactive<string>;
  'dy'?: Reactive<string>;
  'lengthAdjust'?: Reactive<string>;
  'rotate'?: Reactive<number | string>;
  'textLength'?: Reactive<string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
  prop?: PropFor<'tspan'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type UAttributes = { prop?: PropFor<'u'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type UlAttributes = { prop?: PropFor<'ul'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type UseAttributes = {
  'height'?: Reactive<number | string>;
  'href'?: Reactive<string>;
  'width'?: Reactive<number | string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
  prop?: PropFor<'use'> | null; persist?: boolean;
} & SvgPresentationAttributes & SvgConditionalAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type VarAttributes = { prop?: PropFor<'var'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type VideoAttributes = {
  'autoplay'?: Reactive<boolean>;
  'controls'?: Reactive<boolean>;
  'crossorigin'?: Reactive<"anonymous" | "use-credentials">;
  'height'?: Reactive<number | `${number}`>;
  'loading'?: Reactive<"lazy" | "eager">;
  'loop'?: Reactive<boolean>;
  'muted'?: Reactive<boolean>;
  'playsinline'?: Reactive<boolean>;
  'poster'?: Reactive<string>;
  'preload'?: Reactive<"none" | "metadata" | "auto">;
  'src'?: Reactive<string>;
  'width'?: Reactive<number | `${number}`>;
  prop?: PropFor<'video'> | null; persist?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ViewAttributes = {
  'preserveAspectRatio'?: Reactive<string>;
  'viewBox'?: Reactive<string>;
  prop?: PropFor<'view'> | null; persist?: boolean;
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type WbrAttributes = { prop?: PropFor<'wbr'> | null; persist?: boolean; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ColgroupContentItem = ColTag | TemplateTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type ColgroupContent = ColgroupContentItem | readonly ColgroupContent[];
type DlContentItem = DtTag | DdTag | DivTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type DlContent = DlContentItem | readonly DlContent[];
type HgroupContentItem = H1Tag | H2Tag | H3Tag | H4Tag | H5Tag | H6Tag | PTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type HgroupContent = HgroupContentItem | readonly HgroupContent[];
type HtmlContentItem = HeadTag | BodyTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type HtmlContent = HtmlContentItem | readonly HtmlContent[];
type MenuContentItem = LiTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type MenuContent = MenuContentItem | readonly MenuContent[];
type OlContentItem = LiTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type OlContent = OlContentItem | readonly OlContent[];
type OptgroupContentItem = OptionTag | ScriptTag | TemplateTag | NoscriptTag | DivTag | LegendTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type OptgroupContent = OptgroupContentItem | readonly OptgroupContent[];
type PictureContentItem = SourceTag | ImgTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type PictureContent = PictureContentItem | readonly PictureContent[];
type SelectContentItem = OptionTag | OptgroupTag | HrTag | ScriptTag | TemplateTag | NoscriptTag | DivTag | ButtonTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type SelectContent = SelectContentItem | readonly SelectContent[];
type TableContentItem = CaptionTag | ColgroupTag | TheadTag | TbodyTag | TfootTag | TrTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type TableContent = TableContentItem | readonly TableContent[];
type TbodyContentItem = TrTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type TbodyContent = TbodyContentItem | readonly TbodyContent[];
type TfootContentItem = TrTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type TfootContent = TfootContentItem | readonly TfootContent[];
type TheadContentItem = TrTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type TheadContent = TheadContentItem | readonly TheadContent[];
type TrContentItem = ThTag | TdTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type TrContent = TrContentItem | readonly TrContent[];
type UlContentItem = LiTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | ReadonlySignal<any> | null | undefined | boolean;
type UlContent = UlContentItem | readonly UlContent[];

/**
 * Valid content for any tag method: a string, number, tag instance, or an array of those.
 * `null`, `undefined`, `false`, `true`, and `''` are silently ignored, so conditional
 * patterns like `condition && t.span('text')` work without casting.
 *
 * @example
 * t.ul([t.li('one'), t.li(2), t.li(t.span('three'))]);
 */
export type ContentItem = ContentTag | VoidTag | LiteralTag | CommentTag | ReadonlySignal<any> | string | number | boolean | null | undefined;
export type Content = ContentItem | readonly Content[];

export type UniversalAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

/**
 * The type of a custom element method created with `createCustomTag`.
 * `T` is the element's specific attribute object type; global and namespace attributes
 * are always accepted in addition to `T`.
 *
 * @example
 * class MyEngine extends Kensington {
 *   myCard: ContentMethod<{ 'card-type'?: 'primary' | 'secondary' }> =
 *     this.createCustomTag('my-card', { 'card-type': ['primary', 'secondary'] });
 * }
 */
export interface ContentMethod<T = {}> {
  (attributes: T & UniversalAttributes & { prop?: PropFor<string> | null; persist?: boolean }, content?: Content): ContentTag;
  (content?: Content): ContentTag;
}

type PrimitiveConstructor = StringConstructor | NumberConstructor | BooleanConstructor | FunctionConstructor;
type Primitive = string | number | boolean | Function;
type AttributeValue = PrimitiveConstructor | Primitive | readonly (PrimitiveConstructor | Primitive)[];
type ResolveAttrValue<V> =
  V extends StringConstructor ? string :
  V extends NumberConstructor ? number :
  V extends BooleanConstructor ? boolean :
  V extends FunctionConstructor ? Function :
  V extends readonly (infer U)[] ? ResolveAttrValue<U> :
  V extends string | number | boolean ? V :
  V extends Function ? V :
  unknown;
type CamelCase<S extends string> = S extends `${infer Head}-${infer Rest}` ? `${Head}${Capitalize<CamelCase<Rest>>}` : S;
type KebabCase<S extends string> = S extends `${infer H}${infer T}` ? H extends Uppercase<H> ? H extends Lowercase<H> ? `${H}${KebabCase<T>}` : `-${Lowercase<H>}${KebabCase<T>}` : `${H}${KebabCase<T>}` : S;

/**
 * HTML/SVG/MathML template library. Every tag is a method that accepts optional attributes
 * and/or content, returning a tag object that serializes to formatted HTML via `.toString()`
 * or to a live DOM node via `.toElement()`.
 *
 * Attribute rules:
 * - camelCase keys convert to kebab-case: `{ dataBsToggle: 'x' }` → `data-bs-toggle="x"`
 * - nested objects flatten to kebab-case: `{ data: { id: '1' } }` → `data-id="1"`
 * - boolean attributes: `{ checked: true }` → `checked`. `{ checked: false }` → omitted
 * - `class` accepts a string or string array: `{ class: ['a', 'b'] }` → `class="a b"`
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
 *       t.literal('<p>raw markup</p>'),
 *     ])
 *   ),
 * ]).toString();
 */
export class Kensington {
  constructor(options?: {
    /** Allow extra attributes on all elements, e.g. `{ enterkeyhint: ['enter', 'done', 'go', 'next', 'previous', 'search', 'send'] }`. */
    additionalGlobalAttributes?: Record<string, unknown>;
    /** Allow additional attribute namespaces, e.g. `'hx'` for htmx `hx-*` attributes. */
    additionalNamespaces?: string | string[];
    /** Spaces per indentation level. Default: 2. Set to 0 to disable indentation. */
    indentationLevel?: number;
    /** Attribute validation behavior. Default: `'off'`. */
    validationLevel?: 'off' | 'warn' | 'error';
    /** Called with warning messages when `validationLevel` is `'warn'`. Default: `console.log`. */
    logger?: (message: string) => void;
  });

  /**
   * Creates a method for a custom HTML element. Assign to a class property and annotate
   * with `ContentMethod<T>` for typed attribute checking.
   *
   * @param tagName - The HTML tag name, e.g. `'my-card'`
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
  createCustomTag<const A extends Record<string, AttributeValue> = Record<never, AttributeValue>>(
    tagName: string,
    allowedAttributes?: A
  ): ContentMethod<{ [K in keyof A as K | CamelCase<K & string> | KebabCase<K & string>]?: Reactive<ResolveAttrValue<A[K]>> }>

  /**
   * Embeds a raw markup string verbatim into the output. Live DOM fragments are
   * parsed in the surrounding HTML, SVG, or MathML context.
   * Use `.unsafeLiteral()` for trusted markup that includes `<script>` tags.
   *
   * @example
   * t.ul([t.li('typed'), t.literal('<li>raw markup</li>')]).toString();
   */
  literal(str: string | ReadonlySignal<string>): LiteralTag

  /**
   * Like `.literal()` but skips the script-tag check. Use only for trusted markup.
   */
  unsafeLiteral(str: string | ReadonlySignal<string>): LiteralTag

  /**
   * Creates an HTML comment. Multi-line strings are formatted across multiple lines.
   * @example
   * t.inlineComment('hello world')  // <!-- hello world -->
   */
  inlineComment(str: string | number | ReadonlySignal<string> | ReadonlySignal<number>): CommentTag

  /**
   * Renders a full HTML document. Identical to `.html()` but prepends `<!DOCTYPE html>`.
   * Call `.toString()` on the result.
   *
   * @example
   * t.htmlWithDocType({ lang: 'en' }, t.body('hello')).toString();
   */
  htmlWithDocType(attributes: HtmlAttributes, content?: HtmlContent): ContentTag;
  htmlWithDocType(content?: HtmlContent): ContentTag;

  a(attributes: AAttributes, content?: Content): ContentTag;
  a(content?: Content): ContentTag;
  abbr(attributes: AbbrAttributes, content?: Content): ContentTag;
  abbr(content?: Content): ContentTag;
  address(attributes: AddressAttributes, content?: Content): ContentTag;
  address(content?: Content): ContentTag;
  animate(attributes: AnimateAttributes, content?: Content): ContentTag;
  animate(content?: Content): ContentTag;
  animateMotion(attributes: AnimateMotionAttributes, content?: Content): ContentTag;
  animateMotion(content?: Content): ContentTag;
  animateTransform(attributes: AnimateTransformAttributes, content?: Content): ContentTag;
  animateTransform(content?: Content): ContentTag;
  annotation(attributes: AnnotationAttributes, content?: Content): ContentTag;
  annotation(content?: Content): ContentTag;
  annotationXml(attributes: AnnotationXmlAttributes, content?: Content): ContentTag;
  annotationXml(content?: Content): ContentTag;
  area(attributes?: AreaAttributes): VoidTag;
  article(attributes: ArticleAttributes, content?: Content): ContentTag;
  article(content?: Content): ContentTag;
  aside(attributes: AsideAttributes, content?: Content): ContentTag;
  aside(content?: Content): ContentTag;
  audio(attributes: AudioAttributes, content?: Content): ContentTag;
  audio(content?: Content): ContentTag;
  b(attributes: BAttributes, content?: Content): ContentTag;
  b(content?: Content): ContentTag;
  base(attributes?: BaseAttributes): VoidTag;
  bdi(attributes: BdiAttributes, content?: Content): ContentTag;
  bdi(content?: Content): ContentTag;
  bdo(attributes: BdoAttributes, content?: Content): ContentTag;
  bdo(content?: Content): ContentTag;
  blockquote(attributes: BlockquoteAttributes, content?: Content): ContentTag;
  blockquote(content?: Content): ContentTag;
  body(attributes: BodyAttributes, content?: Content): BodyTag;
  body(content?: Content): BodyTag;
  br(attributes?: BrAttributes): VoidTag;
  button(attributes: ButtonAttributes, content?: Content): ButtonTag;
  button(content?: Content): ButtonTag;
  canvas(attributes: CanvasAttributes, content?: Content): ContentTag;
  canvas(content?: Content): ContentTag;
  caption(attributes: CaptionAttributes, content?: Content): CaptionTag;
  caption(content?: Content): CaptionTag;
  circle(attributes: CircleAttributes, content?: Content): ContentTag;
  circle(content?: Content): ContentTag;
  cite(attributes: CiteAttributes, content?: Content): ContentTag;
  cite(content?: Content): ContentTag;
  clipPath(attributes: ClipPathAttributes, content?: Content): ContentTag;
  clipPath(content?: Content): ContentTag;
  code(attributes: CodeAttributes, content?: Content): ContentTag;
  code(content?: Content): ContentTag;
  col(attributes?: ColAttributes): ColTag;
  colgroup(attributes: ColgroupAttributes, content?: ColgroupContent): ColgroupTag;
  colgroup(content?: ColgroupContent): ColgroupTag;
  data(attributes: DataAttributes, content?: Content): ContentTag;
  data(content?: Content): ContentTag;
  datalist(attributes: DatalistAttributes, content?: Content): ContentTag;
  datalist(content?: Content): ContentTag;
  dd(attributes: DdAttributes, content?: Content): DdTag;
  dd(content?: Content): DdTag;
  defs(attributes: DefsAttributes, content?: Content): ContentTag;
  defs(content?: Content): ContentTag;
  del(attributes: DelAttributes, content?: Content): ContentTag;
  del(content?: Content): ContentTag;
  desc(attributes: DescAttributes, content?: Content): ContentTag;
  desc(content?: Content): ContentTag;
  details(attributes: DetailsAttributes, content?: Content): ContentTag;
  details(content?: Content): ContentTag;
  dfn(attributes: DfnAttributes, content?: Content): ContentTag;
  dfn(content?: Content): ContentTag;
  dialog(attributes: DialogAttributes, content?: Content): ContentTag;
  dialog(content?: Content): ContentTag;
  div(attributes: DivAttributes, content?: Content): DivTag;
  div(content?: Content): DivTag;
  dl(attributes: DlAttributes, content?: DlContent): DlTag;
  dl(content?: DlContent): DlTag;
  dt(attributes: DtAttributes, content?: Content): DtTag;
  dt(content?: Content): DtTag;
  ellipse(attributes: EllipseAttributes, content?: Content): ContentTag;
  ellipse(content?: Content): ContentTag;
  em(attributes: EmAttributes, content?: Content): ContentTag;
  em(content?: Content): ContentTag;
  embed(attributes?: EmbedAttributes): VoidTag;
  feBlend(attributes: FeBlendAttributes, content?: Content): ContentTag;
  feBlend(content?: Content): ContentTag;
  feColorMatrix(attributes: FeColorMatrixAttributes, content?: Content): ContentTag;
  feColorMatrix(content?: Content): ContentTag;
  feComponentTransfer(attributes: FeComponentTransferAttributes, content?: Content): ContentTag;
  feComponentTransfer(content?: Content): ContentTag;
  feComposite(attributes: FeCompositeAttributes, content?: Content): ContentTag;
  feComposite(content?: Content): ContentTag;
  feConvolveMatrix(attributes: FeConvolveMatrixAttributes, content?: Content): ContentTag;
  feConvolveMatrix(content?: Content): ContentTag;
  feDiffuseLighting(attributes: FeDiffuseLightingAttributes, content?: Content): ContentTag;
  feDiffuseLighting(content?: Content): ContentTag;
  feDisplacementMap(attributes: FeDisplacementMapAttributes, content?: Content): ContentTag;
  feDisplacementMap(content?: Content): ContentTag;
  feDistantLight(attributes: FeDistantLightAttributes, content?: Content): ContentTag;
  feDistantLight(content?: Content): ContentTag;
  feDropShadow(attributes: FeDropShadowAttributes, content?: Content): ContentTag;
  feDropShadow(content?: Content): ContentTag;
  feFlood(attributes: FeFloodAttributes, content?: Content): ContentTag;
  feFlood(content?: Content): ContentTag;
  feFuncA(attributes: FeFuncAAttributes, content?: Content): ContentTag;
  feFuncA(content?: Content): ContentTag;
  feFuncB(attributes: FeFuncBAttributes, content?: Content): ContentTag;
  feFuncB(content?: Content): ContentTag;
  feFuncG(attributes: FeFuncGAttributes, content?: Content): ContentTag;
  feFuncG(content?: Content): ContentTag;
  feFuncR(attributes: FeFuncRAttributes, content?: Content): ContentTag;
  feFuncR(content?: Content): ContentTag;
  feGaussianBlur(attributes: FeGaussianBlurAttributes, content?: Content): ContentTag;
  feGaussianBlur(content?: Content): ContentTag;
  feImage(attributes: FeImageAttributes, content?: Content): ContentTag;
  feImage(content?: Content): ContentTag;
  feMerge(attributes: FeMergeAttributes, content?: Content): ContentTag;
  feMerge(content?: Content): ContentTag;
  feMergeNode(attributes: FeMergeNodeAttributes, content?: Content): ContentTag;
  feMergeNode(content?: Content): ContentTag;
  feMorphology(attributes: FeMorphologyAttributes, content?: Content): ContentTag;
  feMorphology(content?: Content): ContentTag;
  feOffset(attributes: FeOffsetAttributes, content?: Content): ContentTag;
  feOffset(content?: Content): ContentTag;
  fePointLight(attributes: FePointLightAttributes, content?: Content): ContentTag;
  fePointLight(content?: Content): ContentTag;
  feSpecularLighting(attributes: FeSpecularLightingAttributes, content?: Content): ContentTag;
  feSpecularLighting(content?: Content): ContentTag;
  feSpotLight(attributes: FeSpotLightAttributes, content?: Content): ContentTag;
  feSpotLight(content?: Content): ContentTag;
  feTile(attributes: FeTileAttributes, content?: Content): ContentTag;
  feTile(content?: Content): ContentTag;
  feTurbulence(attributes: FeTurbulenceAttributes, content?: Content): ContentTag;
  feTurbulence(content?: Content): ContentTag;
  fieldset(attributes: FieldsetAttributes, content?: Content): ContentTag;
  fieldset(content?: Content): ContentTag;
  figcaption(attributes: FigcaptionAttributes, content?: Content): ContentTag;
  figcaption(content?: Content): ContentTag;
  figure(attributes: FigureAttributes, content?: Content): ContentTag;
  figure(content?: Content): ContentTag;
  filter(attributes: FilterAttributes, content?: Content): ContentTag;
  filter(content?: Content): ContentTag;
  footer(attributes: FooterAttributes, content?: Content): ContentTag;
  footer(content?: Content): ContentTag;
  foreignObject(attributes: ForeignObjectAttributes, content?: Content): ContentTag;
  foreignObject(content?: Content): ContentTag;
  form(attributes: FormAttributes, content?: Content): ContentTag;
  form(content?: Content): ContentTag;
  g(attributes: GAttributes, content?: Content): ContentTag;
  g(content?: Content): ContentTag;
  h1(attributes: H1Attributes, content?: Content): H1Tag;
  h1(content?: Content): H1Tag;
  h2(attributes: H2Attributes, content?: Content): H2Tag;
  h2(content?: Content): H2Tag;
  h3(attributes: H3Attributes, content?: Content): H3Tag;
  h3(content?: Content): H3Tag;
  h4(attributes: H4Attributes, content?: Content): H4Tag;
  h4(content?: Content): H4Tag;
  h5(attributes: H5Attributes, content?: Content): H5Tag;
  h5(content?: Content): H5Tag;
  h6(attributes: H6Attributes, content?: Content): H6Tag;
  h6(content?: Content): H6Tag;
  head(attributes: HeadAttributes, content?: Content): HeadTag;
  head(content?: Content): HeadTag;
  header(attributes: HeaderAttributes, content?: Content): ContentTag;
  header(content?: Content): ContentTag;
  hgroup(attributes: HgroupAttributes, content?: HgroupContent): HgroupTag;
  hgroup(content?: HgroupContent): HgroupTag;
  hr(attributes?: HrAttributes): HrTag;
  html(attributes: HtmlAttributes, content?: HtmlContent): HtmlTag;
  html(content?: HtmlContent): HtmlTag;
  i(attributes: IAttributes, content?: Content): ContentTag;
  i(content?: Content): ContentTag;
  iframe(attributes: IframeAttributes, content?: Content): ContentTag;
  iframe(content?: Content): ContentTag;
  image(attributes: ImageAttributes, content?: Content): ContentTag;
  image(content?: Content): ContentTag;
  img(attributes?: ImgAttributes): ImgTag;
  input(attributes?: InputAttributes): VoidTag;
  ins(attributes: InsAttributes, content?: Content): ContentTag;
  ins(content?: Content): ContentTag;
  kbd(attributes: KbdAttributes, content?: Content): ContentTag;
  kbd(content?: Content): ContentTag;
  label(attributes: LabelAttributes, content?: Content): ContentTag;
  label(content?: Content): ContentTag;
  legend(attributes: LegendAttributes, content?: Content): LegendTag;
  legend(content?: Content): LegendTag;
  li(attributes: LiAttributes, content?: Content): LiTag;
  li(content?: Content): LiTag;
  line(attributes: LineAttributes, content?: Content): ContentTag;
  line(content?: Content): ContentTag;
  linearGradient(attributes: LinearGradientAttributes, content?: Content): ContentTag;
  linearGradient(content?: Content): ContentTag;
  link(attributes?: LinkAttributes): VoidTag;
  main(attributes: MainAttributes, content?: Content): ContentTag;
  main(content?: Content): ContentTag;
  map(attributes: MapAttributes, content?: Content): ContentTag;
  map(content?: Content): ContentTag;
  mark(attributes: MarkAttributes, content?: Content): ContentTag;
  mark(content?: Content): ContentTag;
  marker(attributes: MarkerAttributes, content?: Content): ContentTag;
  marker(content?: Content): ContentTag;
  mask(attributes: MaskAttributes, content?: Content): ContentTag;
  mask(content?: Content): ContentTag;
  math(attributes: MathAttributes, content?: Content): ContentTag;
  math(content?: Content): ContentTag;
  menclose(attributes: MencloseAttributes, content?: Content): ContentTag;
  menclose(content?: Content): ContentTag;
  menu(attributes: MenuAttributes, content?: MenuContent): MenuTag;
  menu(content?: MenuContent): MenuTag;
  merror(attributes: MerrorAttributes, content?: Content): ContentTag;
  merror(content?: Content): ContentTag;
  meta(attributes?: MetaAttributes): VoidTag;
  metadata(attributes: MetadataAttributes, content?: Content): ContentTag;
  metadata(content?: Content): ContentTag;
  meter(attributes: MeterAttributes, content?: Content): ContentTag;
  meter(content?: Content): ContentTag;
  mfrac(attributes: MfracAttributes, content?: Content): ContentTag;
  mfrac(content?: Content): ContentTag;
  mi(attributes: MiAttributes, content?: Content): ContentTag;
  mi(content?: Content): ContentTag;
  mmultiscripts(attributes: MmultiscriptsAttributes, content?: Content): ContentTag;
  mmultiscripts(content?: Content): ContentTag;
  mn(attributes: MnAttributes, content?: Content): ContentTag;
  mn(content?: Content): ContentTag;
  mo(attributes: MoAttributes, content?: Content): ContentTag;
  mo(content?: Content): ContentTag;
  mover(attributes: MoverAttributes, content?: Content): ContentTag;
  mover(content?: Content): ContentTag;
  mpadded(attributes: MpaddedAttributes, content?: Content): ContentTag;
  mpadded(content?: Content): ContentTag;
  mpath(attributes: MpathAttributes, content?: Content): ContentTag;
  mpath(content?: Content): ContentTag;
  mphantom(attributes: MphantomAttributes, content?: Content): ContentTag;
  mphantom(content?: Content): ContentTag;
  mprescripts(attributes: MprescriptsAttributes, content?: Content): ContentTag;
  mprescripts(content?: Content): ContentTag;
  mroot(attributes: MrootAttributes, content?: Content): ContentTag;
  mroot(content?: Content): ContentTag;
  mrow(attributes: MrowAttributes, content?: Content): ContentTag;
  mrow(content?: Content): ContentTag;
  ms(attributes: MsAttributes, content?: Content): ContentTag;
  ms(content?: Content): ContentTag;
  mspace(attributes: MspaceAttributes, content?: Content): ContentTag;
  mspace(content?: Content): ContentTag;
  msqrt(attributes: MsqrtAttributes, content?: Content): ContentTag;
  msqrt(content?: Content): ContentTag;
  mstyle(attributes: MstyleAttributes, content?: Content): ContentTag;
  mstyle(content?: Content): ContentTag;
  msub(attributes: MsubAttributes, content?: Content): ContentTag;
  msub(content?: Content): ContentTag;
  msubsup(attributes: MsubsupAttributes, content?: Content): ContentTag;
  msubsup(content?: Content): ContentTag;
  msup(attributes: MsupAttributes, content?: Content): ContentTag;
  msup(content?: Content): ContentTag;
  mtable(attributes: MtableAttributes, content?: Content): ContentTag;
  mtable(content?: Content): ContentTag;
  mtd(attributes: MtdAttributes, content?: Content): ContentTag;
  mtd(content?: Content): ContentTag;
  mtext(attributes: MtextAttributes, content?: Content): ContentTag;
  mtext(content?: Content): ContentTag;
  mtr(attributes: MtrAttributes, content?: Content): ContentTag;
  mtr(content?: Content): ContentTag;
  munder(attributes: MunderAttributes, content?: Content): ContentTag;
  munder(content?: Content): ContentTag;
  munderover(attributes: MunderoverAttributes, content?: Content): ContentTag;
  munderover(content?: Content): ContentTag;
  nav(attributes: NavAttributes, content?: Content): ContentTag;
  nav(content?: Content): ContentTag;
  noscript(attributes: NoscriptAttributes, content?: Content): NoscriptTag;
  noscript(content?: Content): NoscriptTag;
  object(attributes: ObjectAttributes, content?: Content): ContentTag;
  object(content?: Content): ContentTag;
  ol(attributes: OlAttributes, content?: OlContent): OlTag;
  ol(content?: OlContent): OlTag;
  optgroup(attributes: OptgroupAttributes, content?: OptgroupContent): OptgroupTag;
  optgroup(content?: OptgroupContent): OptgroupTag;
  option(attributes: OptionAttributes, content?: Content): OptionTag;
  option(content?: Content): OptionTag;
  output(attributes: OutputAttributes, content?: Content): ContentTag;
  output(content?: Content): ContentTag;
  p(attributes: PAttributes, content?: Content): PTag;
  p(content?: Content): PTag;
  path(attributes: PathAttributes, content?: Content): ContentTag;
  path(content?: Content): ContentTag;
  pattern(attributes: PatternAttributes, content?: Content): ContentTag;
  pattern(content?: Content): ContentTag;
  picture(attributes: PictureAttributes, content?: PictureContent): PictureTag;
  picture(content?: PictureContent): PictureTag;
  polygon(attributes: PolygonAttributes, content?: Content): ContentTag;
  polygon(content?: Content): ContentTag;
  polyline(attributes: PolylineAttributes, content?: Content): ContentTag;
  polyline(content?: Content): ContentTag;
  pre(attributes: PreAttributes, content?: Content): ContentTag;
  pre(content?: Content): ContentTag;
  progress(attributes: ProgressAttributes, content?: Content): ContentTag;
  progress(content?: Content): ContentTag;
  q(attributes: QAttributes, content?: Content): ContentTag;
  q(content?: Content): ContentTag;
  radialGradient(attributes: RadialGradientAttributes, content?: Content): ContentTag;
  radialGradient(content?: Content): ContentTag;
  rect(attributes: RectAttributes, content?: Content): ContentTag;
  rect(content?: Content): ContentTag;
  rp(attributes: RpAttributes, content?: Content): ContentTag;
  rp(content?: Content): ContentTag;
  rt(attributes: RtAttributes, content?: Content): ContentTag;
  rt(content?: Content): ContentTag;
  ruby(attributes: RubyAttributes, content?: Content): ContentTag;
  ruby(content?: Content): ContentTag;
  s(attributes: SAttributes, content?: Content): ContentTag;
  s(content?: Content): ContentTag;
  samp(attributes: SampAttributes, content?: Content): ContentTag;
  samp(content?: Content): ContentTag;
  script(attributes: ScriptAttributes, content?: Content): ScriptTag;
  script(content?: Content): ScriptTag;
  search(attributes: SearchAttributes, content?: Content): ContentTag;
  search(content?: Content): ContentTag;
  section(attributes: SectionAttributes, content?: Content): ContentTag;
  section(content?: Content): ContentTag;
  select(attributes: SelectAttributes, content?: SelectContent): SelectTag;
  select(content?: SelectContent): SelectTag;
  selectedcontent(attributes?: SelectedcontentAttributes): VoidTag;
  semantics(attributes: SemanticsAttributes, content?: Content): ContentTag;
  semantics(content?: Content): ContentTag;
  set(attributes: SetAttributes, content?: Content): ContentTag;
  set(content?: Content): ContentTag;
  slot(attributes: SlotAttributes, content?: Content): ContentTag;
  slot(content?: Content): ContentTag;
  small(attributes: SmallAttributes, content?: Content): ContentTag;
  small(content?: Content): ContentTag;
  source(attributes?: SourceAttributes): SourceTag;
  span(attributes: SpanAttributes, content?: Content): ContentTag;
  span(content?: Content): ContentTag;
  stop(attributes: StopAttributes, content?: Content): ContentTag;
  stop(content?: Content): ContentTag;
  strong(attributes: StrongAttributes, content?: Content): ContentTag;
  strong(content?: Content): ContentTag;
  style(attributes: StyleAttributes, content?: Content): ContentTag;
  style(content?: Content): ContentTag;
  sub(attributes: SubAttributes, content?: Content): ContentTag;
  sub(content?: Content): ContentTag;
  summary(attributes: SummaryAttributes, content?: Content): ContentTag;
  summary(content?: Content): ContentTag;
  sup(attributes: SupAttributes, content?: Content): ContentTag;
  sup(content?: Content): ContentTag;
  svg(attributes: SvgAttributes, content?: Content): ContentTag;
  svg(content?: Content): ContentTag;
  switch(attributes: SwitchAttributes, content?: Content): ContentTag;
  switch(content?: Content): ContentTag;
  symbol(attributes: SymbolAttributes, content?: Content): ContentTag;
  symbol(content?: Content): ContentTag;
  table(attributes: TableAttributes, content?: TableContent): TableTag;
  table(content?: TableContent): TableTag;
  tbody(attributes: TbodyAttributes, content?: TbodyContent): TbodyTag;
  tbody(content?: TbodyContent): TbodyTag;
  td(attributes: TdAttributes, content?: Content): TdTag;
  td(content?: Content): TdTag;
  template(attributes: TemplateAttributes, content?: Content): TemplateTag;
  template(content?: Content): TemplateTag;
  text(attributes: TextAttributes, content?: Content): ContentTag;
  text(content?: Content): ContentTag;
  textarea(attributes: TextareaAttributes, content?: Content): ContentTag;
  textarea(content?: Content): ContentTag;
  textPath(attributes: TextPathAttributes, content?: Content): ContentTag;
  textPath(content?: Content): ContentTag;
  tfoot(attributes: TfootAttributes, content?: TfootContent): TfootTag;
  tfoot(content?: TfootContent): TfootTag;
  th(attributes: ThAttributes, content?: Content): ThTag;
  th(content?: Content): ThTag;
  thead(attributes: TheadAttributes, content?: TheadContent): TheadTag;
  thead(content?: TheadContent): TheadTag;
  time(attributes: TimeAttributes, content?: Content): ContentTag;
  time(content?: Content): ContentTag;
  title(attributes: TitleAttributes, content?: Content): ContentTag;
  title(content?: Content): ContentTag;
  tr(attributes: TrAttributes, content?: TrContent): TrTag;
  tr(content?: TrContent): TrTag;
  track(attributes?: TrackAttributes): VoidTag;
  tspan(attributes: TspanAttributes, content?: Content): ContentTag;
  tspan(content?: Content): ContentTag;
  u(attributes: UAttributes, content?: Content): ContentTag;
  u(content?: Content): ContentTag;
  ul(attributes: UlAttributes, content?: UlContent): UlTag;
  ul(content?: UlContent): UlTag;
  use(attributes: UseAttributes, content?: Content): ContentTag;
  use(content?: Content): ContentTag;
  var(attributes: VarAttributes, content?: Content): ContentTag;
  var(content?: Content): ContentTag;
  video(attributes: VideoAttributes, content?: Content): ContentTag;
  video(content?: Content): ContentTag;
  view(attributes: ViewAttributes, content?: Content): ContentTag;
  view(content?: Content): ContentTag;
  wbr(attributes?: WbrAttributes): VoidTag;
}

export default Kensington;

/**
 * Shared `Kensington` instance for use when no subclassing or custom configuration is needed.
 *
 * @example
 * import { t } from 'kensington';
 * const html = t.p({ class: 'intro' }, 'Hello world').toString();
 */
export const t: InstanceType<typeof Kensington>;

/**
 * Creates a reactive signal. Pass as content or an attribute value. The DOM updates live.
 * When called inside a `computed` callback with a stable `key`, returns the same signal
 * instance across re-runs (scoped to that computed). Use this for local state inside
 * list mappings. Pass the item's id as the key.
 * @example
 * const count = signal(0);
 * document.body.append(t.div(count).toElement());
 * count.set(n => n + 1);
 * @example
 * // Keyed signal inside mapWithKey. Same instance per key across re-runs.
 * const list = items.mapWithKey('id', item => {
 *   const highlight = signal(false, item.id);
 *   return t.li({ class: highlight }, item.label);
 * });
 */
export function signal<T>(initial: T, key?: SignalKey): Signal<T>;

/**
 * Creates a read-only signal derived from other signals. Re-runs automatically whenever
 * any signal read via `.get()` inside the function changes.
 * @example
 * const active = signal(true);
 * const cls = computed(() => active.get() ? 'btn-primary' : 'btn-outline');
 */
export function computed<T>(fn: () => T, key?: SignalKey): ReadonlySignal<T>;

/**
 * Runs `fn` immediately and re-runs it whenever any signal read via `.get()` inside changes.
 * Use for side effects: syncing to localStorage, updating the URL, fetching data, etc.
 *
 * Returns a handle with three methods. `pause()` temporarily unsubscribes (no runs while paused);
 * `resume()` re-runs the callback and re-establishes signal subscriptions; `stop()` permanently
 * destroys the effect (resume() becomes a no-op afterwards). `persist: true` on a tag uses
 * pause/resume internally to keep effects alive across DOM removal and re-insertion.
 * @example
 * const e = effect(() => {
 *   localStorage.setItem('sort', sortKey.get());
 * });
 * e.stop(); // unsubscribe permanently
 */
export function effect(fn: () => void): { pause(): void; resume(): void; stop(): void };

/** True if `v` is a kensington Signal (or ReadonlySignal). Duck-types via `_isKensingtonSignal === true` so it returns true for signals from any kensington module copy. Useful when writing helpers that accept `Reactive<T>` and need to differentiate a signal from a static value at runtime. */
export function isKensingtonSignal(v: unknown): v is Signal<unknown>;

/** True in a browser environment, false in Node.js. Use to guard browser-only code that cannot be placed inside effect(). */
export const isBrowser: boolean;

/**
 * Registers component functions and hydrates all server-rendered instances in the page.
 * Call once on the client; Kensington finds every component rendered by `renderForHydration`
 * and mounts it reactively.
 *
 * Pass `options.context` to supply a non-serialized runtime bag to every component.
 * The bag is forwarded as the second argument to each component function. Use it for
 * transport handles, identity, signals, and anything else that cannot round-trip through
 * JSON. Construct a matching bag on the server side and pass it to `renderForHydration`.
 *
 * @example
 * import { registerComponents } from 'kensington';
 * registerComponents({ counter, userCard }, { context: clientEnv });
 */
export function registerComponents(
  components: Record<string, (state: any, context?: any) => ContentTag | ContentTag[] | null>,
  options?: { context?: unknown }
): { stop(): void };

/**
 * Renders a component to an HTML string and embeds the state as a JSON script block for
 * browser-side hydration.
 *
 * Pass `options.context` to supply a non-serialized runtime bag to the component function.
 * The bag is forwarded as the second argument. Construct a matching bag on the client side
 * and pass it to `registerComponents`. The context is never serialized into the page.
 *
 * @example
 * // server
 * renderForHydration(counter, { count: 42 }, 'counter', { context: serverEnv })
 * // client
 * registerComponents({ counter }, { context: clientEnv })
 */
export function renderForHydration<S>(
  fn: (state: S, context?: any) => ContentTag | ContentTag[] | null | undefined,
  state: S,
  name?: string,
  options?: { context?: unknown }
): LiteralTag;

/**
 * Hot-swaps every live instance of a hydrated component with a new function. State held
 * in keyed signals (`signal(initial, key)` called inside the component body) persists
 * across the swap. Form state is preserved via the reconciler's preserve-state path.
 *
 * Call from a bundler HMR accept handler.
 *
 * @example
 * import { hmrReplaceComponent } from 'kensington';
 * import.meta.hot?.accept(mod => hmrReplaceComponent('counter', mod.counter));
 */
export function hmrReplaceComponent(
  name: string,
  newFn: (state: any) => ContentTag | ContentTag[] | null
): void;


