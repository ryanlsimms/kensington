import type * as csstype from 'csstype';

/**
 * Returned by content element methods (div, p, span, …).
 * Call `.toString()` to get the HTML string, or `.toElement()` to create a live DOM node.
 */
export class ContentTag<ElementType extends Element = Element> {
  toString(): string;
  toElement(): ElementType;
  mount(target: string | Element): void;
  /**
   * Returns the live DOM element produced by the most recent `.toElement()` call when that
   * element is still connected to the document, or `null` otherwise. Useful for imperative
   * operations like focus or scroll after a keyboard event, or for reconciler-aware code
   * that needs to inspect the current node.
   */
  getDomElement(): ElementType | null;
  /**
   * Registers a signal-tracking effect owned by this tag. Starts on connection,
   * stops on normal removal, and pauses/resumes with own or inherited `persist: true`.
   * Receives the live element as its first argument and as `this` on each run.
   * Register before `.toElement()`. Returns this tag for chaining; never runs during SSR.
   * Effect-body return values are ignored. Use addDisconnectedCallback for timers,
   * listeners and other resources that need explicit teardown.
   */
  effect<E extends Element = HTMLElement>(fn: (this: E, el: E) => void): this;
  /**
   * Registers a callback invoked each time this element is inserted into the live DOM.
   * The callback receives the element as both `this` and its first argument. Fires on the
   * initial mount and on every reconnect for `persist: true` parents. Callback return
   * values are ignored. Use addDisconnectedCallback for teardown. Returns this for chaining.
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
export class VoidTag<E extends Element = Element> extends ContentTag<E> {
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

export class BodyTag extends ContentTag<HtmlElementFor<'body'>> { private readonly _k: 'body' }
export class ButtonTag extends ContentTag<HtmlElementFor<'button'>> { private readonly _k: 'button' }
export class CaptionTag extends ContentTag<HtmlElementFor<'caption'>> { private readonly _k: 'caption' }
export class ColTag extends VoidTag<HtmlElementFor<'col'>> { private readonly _k: 'col' }
export class ColgroupTag extends ContentTag<HtmlElementFor<'colgroup'>> { private readonly _k: 'colgroup' }
export class DdTag extends ContentTag<HtmlElementFor<'dd'>> { private readonly _k: 'dd' }
export class DivTag extends ContentTag<HtmlElementFor<'div'>> { private readonly _k: 'div' }
export class DlTag extends ContentTag<HtmlElementFor<'dl'>> { private readonly _k: 'dl' }
export class DtTag extends ContentTag<HtmlElementFor<'dt'>> { private readonly _k: 'dt' }
export class H1Tag extends ContentTag<HtmlElementFor<'h1'>> { private readonly _k: 'h1' }
export class H2Tag extends ContentTag<HtmlElementFor<'h2'>> { private readonly _k: 'h2' }
export class H3Tag extends ContentTag<HtmlElementFor<'h3'>> { private readonly _k: 'h3' }
export class H4Tag extends ContentTag<HtmlElementFor<'h4'>> { private readonly _k: 'h4' }
export class H5Tag extends ContentTag<HtmlElementFor<'h5'>> { private readonly _k: 'h5' }
export class H6Tag extends ContentTag<HtmlElementFor<'h6'>> { private readonly _k: 'h6' }
export class HeadTag extends ContentTag<HtmlElementFor<'head'>> { private readonly _k: 'head' }
export class HgroupTag extends ContentTag<HtmlElementFor<'hgroup'>> { private readonly _k: 'hgroup' }
export class HrTag extends VoidTag<HtmlElementFor<'hr'>> { private readonly _k: 'hr' }
export class HtmlTag extends ContentTag<HtmlElementFor<'html'>> { private readonly _k: 'html' }
export class ImgTag extends VoidTag<HtmlElementFor<'img'>> { private readonly _k: 'img' }
export class LegendTag extends ContentTag<HtmlElementFor<'legend'>> { private readonly _k: 'legend' }
export class LiTag extends ContentTag<HtmlElementFor<'li'>> { private readonly _k: 'li' }
export class MenuTag extends ContentTag<HtmlElementFor<'menu'>> { private readonly _k: 'menu' }
export class NoscriptTag extends ContentTag<HtmlElementFor<'noscript'>> { private readonly _k: 'noscript' }
export class OlTag extends ContentTag<HtmlElementFor<'ol'>> { private readonly _k: 'ol' }
export class OptgroupTag extends ContentTag<HtmlElementFor<'optgroup'>> { private readonly _k: 'optgroup' }
export class OptionTag extends ContentTag<HtmlElementFor<'option'>> { private readonly _k: 'option' }
export class PTag extends ContentTag<HtmlElementFor<'p'>> { private readonly _k: 'p' }
export class PictureTag extends ContentTag<HtmlElementFor<'picture'>> { private readonly _k: 'picture' }
export class ScriptTag extends ContentTag<HtmlElementFor<'script'> | SvgElementFor<'script'>> { private readonly _k: 'script' }
export class SelectTag extends ContentTag<HtmlElementFor<'select'>> { private readonly _k: 'select' }
export class SourceTag extends VoidTag<HtmlElementFor<'source'>> { private readonly _k: 'source' }
export class TableTag extends ContentTag<HtmlElementFor<'table'>> { private readonly _k: 'table' }
export class TbodyTag extends ContentTag<HtmlElementFor<'tbody'>> { private readonly _k: 'tbody' }
export class TdTag extends ContentTag<HtmlElementFor<'td'>> { private readonly _k: 'td' }
export class TemplateTag extends ContentTag<HtmlElementFor<'template'>> { private readonly _k: 'template' }
export class TfootTag extends ContentTag<HtmlElementFor<'tfoot'>> { private readonly _k: 'tfoot' }
export class ThTag extends ContentTag<HtmlElementFor<'th'>> { private readonly _k: 'th' }
export class TheadTag extends ContentTag<HtmlElementFor<'thead'>> { private readonly _k: 'thead' }
export class TrTag extends ContentTag<HtmlElementFor<'tr'>> { private readonly _k: 'tr' }
export class UlTag extends ContentTag<HtmlElementFor<'ul'>> { private readonly _k: 'ul' }

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
  subscribe(): T;
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
  subscribe(): T;
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

/** Spec-derived instance members for HTML tags missing from the build's DOM map. */
type HtmlElementFallbacks = {};
type HtmlElementFor<Tag extends string> =
  Tag extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[Tag] :
  Tag extends keyof HtmlElementFallbacks ? HtmlElementFallbacks[Tag] : HTMLElement;
type SvgElementFor<Tag extends string> =
  Tag extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[Tag] : SVGElement;

type ElementInterface<Tag extends string> =
  Tag extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[Tag] :
  Tag extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[Tag] :
  HtmlElementFor<Tag>;
type ElementProps<ElementType> = {
  [K in keyof ElementType]?: ElementType[K] | ReadonlySignal<ElementType[K]>
} & { [key: string]: unknown };
type PropFor<Tag extends string> = ElementProps<ElementInterface<Tag>>;
type ContextualPropFor<Tag extends string> =
  | (Tag extends keyof HTMLElementTagNameMap | keyof HtmlElementFallbacks ? ElementProps<HtmlElementFor<Tag>> : never)
  | (Tag extends keyof SVGElementTagNameMap ? ElementProps<SVGElementTagNameMap[Tag]> : never);

/**
 * Extend this interface via module augmentation to add open prefixes such as `hx`.
 * TypeScript accepts `data-*`, ARIA attributes, and the `aria` shorthand by default.
 * Runtime ARIA validation recognizes WAI-ARIA 1.2 names and names in `additionalGlobalAttributes`.
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
  [key: `data${string}`]: Reactive<string | object>;
  [key: `aria${string}`]: Reactive<string | object | boolean | null | undefined>;
}

export type GlobalAttributes = {
  accesskey?: Reactive<string>;
  autocapitalize?: Reactive<"on" | "off" | "none" | "sentences" | "words" | "characters">;
  autocorrect?: Reactive<"on" | "off">;
  autofocus?: Reactive<boolean>;
  class?: Reactive<string | ClassValue[]>;
  contenteditable?: Reactive<"true" | "false" | "plaintext-only" | boolean | null | undefined>;
  dir?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  draggable?: Reactive<"true" | "false" | boolean | null | undefined>;
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
  spellcheck?: Reactive<"true" | "false" | boolean | null | undefined>;
  style?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  tabindex?: Reactive<number | `${number}`>;
  title?: Reactive<string>;
  translate?: Reactive<"yes" | "no" | boolean | null | undefined>;
  writingsuggestions?: Reactive<"true" | "false" | boolean | null | undefined>;
}

/** The DOM supplies currentTarget during dispatch. Capture it before awaiting in a handler. */
type BoundEvent<T extends Event, E extends EventTarget | null> = T & { readonly currentTarget: E };
type EventMapFor<E extends EventTarget | null> =
  E extends SVGElement ? SVGElementEventMap :
  E extends MathMLElement ? MathMLElementEventMap :
  HTMLElementEventMap;
type LegacyEventHandlers = Record<string, (event: any) => void>;
// Form updates and resource or media notifications can dispatch plain DOM events.
type EventHandlers<E extends EventTarget | null> = {
  [K in keyof EventMapFor<E>]?: (event: BoundEvent<
    K extends 'abort' | 'error' | 'input' | 'progress' | 'resize' ? Event : EventMapFor<E>[K] & Event, E
  >) => void;
} & LegacyEventHandlers;

// A custom event can use a standard name. Try this overload after the inferred DOM handlers.
type WithLegacyOn<Attributes> = Omit<Attributes, 'on'> & { on?: LegacyEventHandlers };

export type GlobalEvents<E extends EventTarget | null = EventTarget | null> = {
  onauxclick?: string | ((event: BoundEvent<MouseEvent, E>) => void);
  onbeforeinput?: string | ((event: BoundEvent<InputEvent, E>) => void);
  onbeforematch?: string | ((event: BoundEvent<Event, E>) => void);
  onbeforetoggle?: string | ((event: BoundEvent<Event, E>) => void);
  onblur?: string | ((event: BoundEvent<FocusEvent, E>) => void);
  oncancel?: string | ((event: BoundEvent<Event, E>) => void);
  oncanplay?: string | ((event: BoundEvent<Event, E>) => void);
  oncanplaythrough?: string | ((event: BoundEvent<Event, E>) => void);
  onchange?: string | ((event: BoundEvent<Event, E>) => void);
  onclick?: string | ((event: BoundEvent<MouseEvent, E>) => void);
  onclose?: string | ((event: BoundEvent<Event, E>) => void);
  oncommand?: string | ((event: BoundEvent<Event, E>) => void);
  oncontextlost?: string | ((event: BoundEvent<Event, E>) => void);
  oncontextmenu?: string | ((event: BoundEvent<MouseEvent, E>) => void);
  oncontextrestored?: string | ((event: BoundEvent<Event, E>) => void);
  oncopy?: string | ((event: BoundEvent<ClipboardEvent, E>) => void);
  oncuechange?: string | ((event: BoundEvent<Event, E>) => void);
  oncut?: string | ((event: BoundEvent<ClipboardEvent, E>) => void);
  ondblclick?: string | ((event: BoundEvent<MouseEvent, E>) => void);
  ondrag?: string | ((event: BoundEvent<DragEvent, E>) => void);
  ondragend?: string | ((event: BoundEvent<DragEvent, E>) => void);
  ondragenter?: string | ((event: BoundEvent<DragEvent, E>) => void);
  ondragleave?: string | ((event: BoundEvent<DragEvent, E>) => void);
  ondragover?: string | ((event: BoundEvent<DragEvent, E>) => void);
  ondragstart?: string | ((event: BoundEvent<DragEvent, E>) => void);
  ondrop?: string | ((event: BoundEvent<DragEvent, E>) => void);
  ondurationchange?: string | ((event: BoundEvent<Event, E>) => void);
  onemptied?: string | ((event: BoundEvent<Event, E>) => void);
  onended?: string | ((event: BoundEvent<Event, E>) => void);
  onerror?: string | ((event: BoundEvent<Event, E>) => void);
  onfocus?: string | ((event: BoundEvent<FocusEvent, E>) => void);
  onformdata?: string | ((event: BoundEvent<FormDataEvent, E>) => void);
  oninput?: string | ((event: BoundEvent<Event, E>) => void);
  oninvalid?: string | ((event: BoundEvent<Event, E>) => void);
  onkeydown?: string | ((event: BoundEvent<KeyboardEvent, E>) => void);
  onkeypress?: string | ((event: BoundEvent<KeyboardEvent, E>) => void);
  onkeyup?: string | ((event: BoundEvent<KeyboardEvent, E>) => void);
  onload?: string | ((event: BoundEvent<Event, E>) => void);
  onloadeddata?: string | ((event: BoundEvent<Event, E>) => void);
  onloadedmetadata?: string | ((event: BoundEvent<Event, E>) => void);
  onloadstart?: string | ((event: BoundEvent<Event, E>) => void);
  onmousedown?: string | ((event: BoundEvent<MouseEvent, E>) => void);
  onmouseenter?: string | ((event: BoundEvent<MouseEvent, E>) => void);
  onmouseleave?: string | ((event: BoundEvent<MouseEvent, E>) => void);
  onmousemove?: string | ((event: BoundEvent<MouseEvent, E>) => void);
  onmouseout?: string | ((event: BoundEvent<MouseEvent, E>) => void);
  onmouseover?: string | ((event: BoundEvent<MouseEvent, E>) => void);
  onmouseup?: string | ((event: BoundEvent<MouseEvent, E>) => void);
  onpaste?: string | ((event: BoundEvent<ClipboardEvent, E>) => void);
  onpause?: string | ((event: BoundEvent<Event, E>) => void);
  onplay?: string | ((event: BoundEvent<Event, E>) => void);
  onplaying?: string | ((event: BoundEvent<Event, E>) => void);
  onprogress?: string | ((event: BoundEvent<Event, E>) => void);
  onratechange?: string | ((event: BoundEvent<Event, E>) => void);
  onreset?: string | ((event: BoundEvent<Event, E>) => void);
  onresize?: string | ((event: BoundEvent<Event, E>) => void);
  onscroll?: string | ((event: BoundEvent<Event, E>) => void);
  onscrollend?: string | ((event: BoundEvent<Event, E>) => void);
  onsecuritypolicyviolation?: string | ((event: BoundEvent<SecurityPolicyViolationEvent, E>) => void);
  onseeked?: string | ((event: BoundEvent<Event, E>) => void);
  onseeking?: string | ((event: BoundEvent<Event, E>) => void);
  onselect?: string | ((event: BoundEvent<Event, E>) => void);
  onslotchange?: string | ((event: BoundEvent<Event, E>) => void);
  onstalled?: string | ((event: BoundEvent<Event, E>) => void);
  onsubmit?: string | ((event: BoundEvent<SubmitEvent, E>) => void);
  onsuspend?: string | ((event: BoundEvent<Event, E>) => void);
  ontimeupdate?: string | ((event: BoundEvent<Event, E>) => void);
  ontoggle?: string | ((event: BoundEvent<Event, E>) => void);
  onvolumechange?: string | ((event: BoundEvent<Event, E>) => void);
  onwaiting?: string | ((event: BoundEvent<Event, E>) => void);
  onwheel?: string | ((event: BoundEvent<WheelEvent, E>) => void);
  on?: Element extends E ? LegacyEventHandlers : EventHandlers<E>;
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

type SvgGlobalEvents<E extends Element> = {
  'ondragexit'?: Reactive<string | ((event: BoundEvent<Event, E>) => void)>;
  'onshow'?: Reactive<string | ((event: BoundEvent<Event, E>) => void)>;
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
  'displaystyle'?: Reactive<string>;
  'download'?: Reactive<string>;
  'href'?: Reactive<string>;
  'hreflang'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'ping'?: Reactive<string>;
  'referrerpolicy'?: Reactive<string>;
  'rel'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'target'?: Reactive<string>;
  'type'?: Reactive<string>;
} & TagOptions<ContextualPropFor<'a'>> & SvgPresentationAttributes & SvgConditionalAttributes & SvgXLinkAttributes & NameSpaceAttributes & GlobalAttributes & SvgGlobalAttributes & GlobalEvents<HtmlElementFor<'a'> | SvgElementFor<'a'> | MathMLElement> & SvgGlobalEvents<HtmlElementFor<'a'> | SvgElementFor<'a'> | MathMLElement>;

type AbbrAttributes = TagOptions<PropFor<'abbr'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'abbr'>>;

type AddressAttributes = TagOptions<PropFor<'address'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'address'>>;

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
} & TagOptions<PropFor<'animate'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'animate'>> & SvgGlobalEvents<SvgElementFor<'animate'>>;

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
} & TagOptions<PropFor<'animateMotion'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'animateMotion'>> & SvgGlobalEvents<SvgElementFor<'animateMotion'>>;

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
} & TagOptions<PropFor<'animateTransform'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'animateTransform'>> & SvgGlobalEvents<SvgElementFor<'animateTransform'>>;

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
} & TagOptions<PropFor<'annotation'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'annotation-xml'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'area'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'area'>>;

type ArticleAttributes = TagOptions<PropFor<'article'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'article'>>;

type AsideAttributes = TagOptions<PropFor<'aside'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'aside'>>;

type AudioAttributes = {
  'autoplay'?: Reactive<boolean>;
  'controls'?: Reactive<boolean>;
  'crossorigin'?: Reactive<"anonymous" | "use-credentials">;
  'loading'?: Reactive<"lazy" | "eager">;
  'loop'?: Reactive<boolean>;
  'muted'?: Reactive<boolean>;
  'preload'?: Reactive<"none" | "metadata" | "auto">;
  'src'?: Reactive<string>;
} & TagOptions<PropFor<'audio'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'audio'>>;

type BAttributes = TagOptions<PropFor<'b'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'b'>>;

type BaseAttributes = {
  'href'?: Reactive<string>;
  'target'?: Reactive<string>;
} & TagOptions<PropFor<'base'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'base'>>;

type BdiAttributes = TagOptions<PropFor<'bdi'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'bdi'>>;

type BdoAttributes = TagOptions<PropFor<'bdo'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'bdo'>>;

type BlockquoteAttributes = {
  'cite'?: Reactive<string>;
} & TagOptions<PropFor<'blockquote'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'blockquote'>>;

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
} & TagOptions<PropFor<'body'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'body'>>;

type BrAttributes = TagOptions<PropFor<'br'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'br'>>;

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
} & TagOptions<PropFor<'button'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'button'>>;

type CanvasAttributes = {
  'height'?: Reactive<number | `${number}`>;
  'width'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'canvas'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'canvas'>>;

type CaptionAttributes = TagOptions<PropFor<'caption'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'caption'>>;

type CircleAttributes = {
  'cx'?: Reactive<number | string>;
  'cy'?: Reactive<number | string>;
  'pathLength'?: Reactive<number | `${number}`>;
  'r'?: Reactive<number | string>;
} & TagOptions<PropFor<'circle'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'circle'>> & SvgGlobalEvents<SvgElementFor<'circle'>>;

type CiteAttributes = TagOptions<PropFor<'cite'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'cite'>>;

type ClipPathAttributes = {
  'externalResourcesRequired'?: Reactive<"true" | "false">;
  'requiredFeatures'?: Reactive<string>;
} & TagOptions<PropFor<'clipPath'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'clipPath'>> & SvgGlobalEvents<SvgElementFor<'clipPath'>>;

type CodeAttributes = TagOptions<PropFor<'code'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'code'>>;

type ColAttributes = {
  'span'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'col'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'col'>>;

type ColgroupAttributes = {
  'span'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'colgroup'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'colgroup'>>;

type DataAttributes = {
  'value'?: Reactive<number | string>;
} & TagOptions<PropFor<'data'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'data'>>;

type DatalistAttributes = TagOptions<PropFor<'datalist'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'datalist'>>;

type DdAttributes = TagOptions<PropFor<'dd'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'dd'>>;

type DefsAttributes = TagOptions<PropFor<'defs'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'defs'>> & SvgGlobalEvents<SvgElementFor<'defs'>>;

type DelAttributes = {
  'cite'?: Reactive<string>;
  'datetime'?: Reactive<string>;
} & TagOptions<PropFor<'del'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'del'>>;

type DescAttributes = TagOptions<PropFor<'desc'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'desc'>> & SvgGlobalEvents<SvgElementFor<'desc'>>;

type DetailsAttributes = {
  'name'?: Reactive<string>;
  'open'?: Reactive<boolean>;
} & TagOptions<PropFor<'details'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'details'>>;

type DfnAttributes = TagOptions<PropFor<'dfn'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'dfn'>>;

type DialogAttributes = {
  'open'?: Reactive<boolean>;
} & TagOptions<PropFor<'dialog'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'dialog'>>;

type DivAttributes = TagOptions<PropFor<'div'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'div'>>;

type DlAttributes = TagOptions<PropFor<'dl'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'dl'>>;

type DtAttributes = TagOptions<PropFor<'dt'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'dt'>>;

type EllipseAttributes = {
  'cx'?: Reactive<number | string>;
  'cy'?: Reactive<number | string>;
  'pathLength'?: Reactive<number | `${number}`>;
  'rx'?: Reactive<number | string>;
  'ry'?: Reactive<number | string>;
} & TagOptions<PropFor<'ellipse'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'ellipse'>> & SvgGlobalEvents<SvgElementFor<'ellipse'>>;

type EmAttributes = TagOptions<PropFor<'em'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'em'>>;

type EmbedAttributes = {
  'height'?: Reactive<number | `${number}`>;
  'src'?: Reactive<string>;
  'type'?: Reactive<string>;
  'width'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'embed'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'embed'>>;

type FeBlendAttributes = TagOptions<PropFor<'feBlend'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feBlend'>> & SvgGlobalEvents<SvgElementFor<'feBlend'>>;

type FeColorMatrixAttributes = TagOptions<PropFor<'feColorMatrix'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feColorMatrix'>> & SvgGlobalEvents<SvgElementFor<'feColorMatrix'>>;

type FeComponentTransferAttributes = TagOptions<PropFor<'feComponentTransfer'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feComponentTransfer'>> & SvgGlobalEvents<SvgElementFor<'feComponentTransfer'>>;

type FeCompositeAttributes = TagOptions<PropFor<'feComposite'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feComposite'>> & SvgGlobalEvents<SvgElementFor<'feComposite'>>;

type FeConvolveMatrixAttributes = TagOptions<PropFor<'feConvolveMatrix'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feConvolveMatrix'>> & SvgGlobalEvents<SvgElementFor<'feConvolveMatrix'>>;

type FeDiffuseLightingAttributes = TagOptions<PropFor<'feDiffuseLighting'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feDiffuseLighting'>> & SvgGlobalEvents<SvgElementFor<'feDiffuseLighting'>>;

type FeDisplacementMapAttributes = TagOptions<PropFor<'feDisplacementMap'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feDisplacementMap'>> & SvgGlobalEvents<SvgElementFor<'feDisplacementMap'>>;

type FeDistantLightAttributes = TagOptions<PropFor<'feDistantLight'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feDistantLight'>> & SvgGlobalEvents<SvgElementFor<'feDistantLight'>>;

type FeDropShadowAttributes = TagOptions<PropFor<'feDropShadow'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feDropShadow'>> & SvgGlobalEvents<SvgElementFor<'feDropShadow'>>;

type FeFloodAttributes = TagOptions<PropFor<'feFlood'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feFlood'>> & SvgGlobalEvents<SvgElementFor<'feFlood'>>;

type FeFuncAAttributes = TagOptions<PropFor<'feFuncA'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feFuncA'>> & SvgGlobalEvents<SvgElementFor<'feFuncA'>>;

type FeFuncBAttributes = TagOptions<PropFor<'feFuncB'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feFuncB'>> & SvgGlobalEvents<SvgElementFor<'feFuncB'>>;

type FeFuncGAttributes = TagOptions<PropFor<'feFuncG'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feFuncG'>> & SvgGlobalEvents<SvgElementFor<'feFuncG'>>;

type FeFuncRAttributes = TagOptions<PropFor<'feFuncR'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feFuncR'>> & SvgGlobalEvents<SvgElementFor<'feFuncR'>>;

type FeGaussianBlurAttributes = TagOptions<PropFor<'feGaussianBlur'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feGaussianBlur'>> & SvgGlobalEvents<SvgElementFor<'feGaussianBlur'>>;

type FeImageAttributes = {
  'externalResourcesRequired'?: Reactive<"true" | "false">;
} & TagOptions<PropFor<'feImage'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feImage'>> & SvgGlobalEvents<SvgElementFor<'feImage'>>;

type FeMergeAttributes = TagOptions<PropFor<'feMerge'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feMerge'>> & SvgGlobalEvents<SvgElementFor<'feMerge'>>;

type FeMergeNodeAttributes = TagOptions<PropFor<'feMergeNode'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feMergeNode'>> & SvgGlobalEvents<SvgElementFor<'feMergeNode'>>;

type FeMorphologyAttributes = TagOptions<PropFor<'feMorphology'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feMorphology'>> & SvgGlobalEvents<SvgElementFor<'feMorphology'>>;

type FeOffsetAttributes = TagOptions<PropFor<'feOffset'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feOffset'>> & SvgGlobalEvents<SvgElementFor<'feOffset'>>;

type FePointLightAttributes = TagOptions<PropFor<'fePointLight'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'fePointLight'>> & SvgGlobalEvents<SvgElementFor<'fePointLight'>>;

type FeSpecularLightingAttributes = TagOptions<PropFor<'feSpecularLighting'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feSpecularLighting'>> & SvgGlobalEvents<SvgElementFor<'feSpecularLighting'>>;

type FeSpotLightAttributes = TagOptions<PropFor<'feSpotLight'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feSpotLight'>> & SvgGlobalEvents<SvgElementFor<'feSpotLight'>>;

type FeTileAttributes = TagOptions<PropFor<'feTile'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feTile'>> & SvgGlobalEvents<SvgElementFor<'feTile'>>;

type FeTurbulenceAttributes = TagOptions<PropFor<'feTurbulence'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'feTurbulence'>> & SvgGlobalEvents<SvgElementFor<'feTurbulence'>>;

type FieldsetAttributes = {
  'disabled'?: Reactive<boolean>;
  'form'?: Reactive<string>;
  'name'?: Reactive<string>;
} & TagOptions<PropFor<'fieldset'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'fieldset'>>;

type FigcaptionAttributes = TagOptions<PropFor<'figcaption'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'figcaption'>>;

type FigureAttributes = TagOptions<PropFor<'figure'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'figure'>>;

type FilterAttributes = {
  'externalResourcesRequired'?: Reactive<"true" | "false">;
} & TagOptions<PropFor<'filter'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'filter'>> & SvgGlobalEvents<SvgElementFor<'filter'>>;

type FooterAttributes = TagOptions<PropFor<'footer'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'footer'>>;

type ForeignObjectAttributes = {
  'height'?: Reactive<number | string>;
  'width'?: Reactive<number | string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
} & TagOptions<PropFor<'foreignObject'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'foreignObject'>> & SvgGlobalEvents<SvgElementFor<'foreignObject'>>;

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
} & TagOptions<PropFor<'form'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'form'>>;

type GAttributes = TagOptions<PropFor<'g'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'g'>> & SvgGlobalEvents<SvgElementFor<'g'>>;

type H1Attributes = TagOptions<PropFor<'h1'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'h1'>>;

type H2Attributes = TagOptions<PropFor<'h2'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'h2'>>;

type H3Attributes = TagOptions<PropFor<'h3'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'h3'>>;

type H4Attributes = TagOptions<PropFor<'h4'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'h4'>>;

type H5Attributes = TagOptions<PropFor<'h5'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'h5'>>;

type H6Attributes = TagOptions<PropFor<'h6'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'h6'>>;

type HeadAttributes = TagOptions<PropFor<'head'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'head'>>;

type HeaderAttributes = TagOptions<PropFor<'header'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'header'>>;

type HgroupAttributes = TagOptions<PropFor<'hgroup'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'hgroup'>>;

type HrAttributes = TagOptions<PropFor<'hr'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'hr'>>;

type HtmlAttributes = TagOptions<PropFor<'html'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'html'>>;

type IAttributes = TagOptions<PropFor<'i'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'i'>>;

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
} & TagOptions<PropFor<'iframe'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'iframe'>>;

type ImageAttributes = {
  'crossorigin'?: Reactive<"anonymous" | "use-credentials">;
  'height'?: Reactive<number | string>;
  'href'?: Reactive<string>;
  'preserveAspectRatio'?: Reactive<string>;
  'width'?: Reactive<number | string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
} & TagOptions<PropFor<'image'>> & SvgPresentationAttributes & SvgConditionalAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'image'>> & SvgGlobalEvents<SvgElementFor<'image'>>;

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
} & TagOptions<PropFor<'img'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'img'>>;

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
} & TagOptions<PropFor<'input'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'input'>>;

type InsAttributes = {
  'cite'?: Reactive<string>;
  'datetime'?: Reactive<string>;
} & TagOptions<PropFor<'ins'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'ins'>>;

type KbdAttributes = TagOptions<PropFor<'kbd'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'kbd'>>;

type LabelAttributes = {
  'for'?: Reactive<string>;
} & TagOptions<PropFor<'label'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'label'>>;

type LegendAttributes = TagOptions<PropFor<'legend'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'legend'>>;

type LiAttributes = {
  'value'?: Reactive<number | string>;
} & TagOptions<PropFor<'li'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'li'>>;

type LineAttributes = {
  'pathLength'?: Reactive<number | `${number}`>;
  'x1'?: Reactive<number | string>;
  'x2'?: Reactive<number | string>;
  'y1'?: Reactive<number | string>;
  'y2'?: Reactive<number | string>;
} & TagOptions<PropFor<'line'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'line'>> & SvgGlobalEvents<SvgElementFor<'line'>>;

type LinearGradientAttributes = {
  'gradientTransform'?: Reactive<string>;
  'gradientUnits'?: Reactive<"userSpaceOnUse" | "objectBoundingBox">;
  'href'?: Reactive<string>;
  'spreadMethod'?: Reactive<string>;
  'x1'?: Reactive<number | string>;
  'x2'?: Reactive<number | string>;
  'y1'?: Reactive<number | string>;
  'y2'?: Reactive<number | string>;
} & TagOptions<PropFor<'linearGradient'>> & SvgPresentationAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'linearGradient'>> & SvgGlobalEvents<SvgElementFor<'linearGradient'>>;

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
} & TagOptions<PropFor<'link'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'link'>>;

type MactionAttributes = {
  'actiontype'?: Reactive<string>;
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
  'selection'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'maction'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

type MainAttributes = TagOptions<PropFor<'main'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'main'>>;

type MapAttributes = {
  'name'?: Reactive<string>;
} & TagOptions<PropFor<'map'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'map'>>;

type MarkAttributes = TagOptions<PropFor<'mark'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'mark'>>;

type MarkerAttributes = {
  'markerHeight'?: Reactive<string>;
  'markerUnits'?: Reactive<string>;
  'markerWidth'?: Reactive<string>;
  'orient'?: Reactive<string>;
  'preserveAspectRatio'?: Reactive<string>;
  'refX'?: Reactive<string>;
  'refY'?: Reactive<string>;
  'viewBox'?: Reactive<string>;
} & TagOptions<PropFor<'marker'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'marker'>> & SvgGlobalEvents<SvgElementFor<'marker'>>;

type MaskAttributes = {
  'requiredFeatures'?: Reactive<string>;
} & TagOptions<PropFor<'mask'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'mask'>> & SvgGlobalEvents<SvgElementFor<'mask'>>;

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
} & TagOptions<PropFor<'math'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'menclose'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

type MenuAttributes = TagOptions<PropFor<'menu'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'menu'>>;

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
} & TagOptions<PropFor<'merror'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

type MetaAttributes = {
  'charset'?: Reactive<"utf-8" | "UTF-8">;
  'content'?: Reactive<string>;
  'http-equiv'?: Reactive<"content-type" | "CONTENT-TYPE" | "default-style" | "DEFAULT-STYLE" | "refresh" | "REFRESH" | "x-ua-compatible" | "X-UA-COMPATIBLE" | "content-security-policy" | "CONTENT-SECURITY-POLICY">;
  'httpEquiv'?: Reactive<"content-type" | "CONTENT-TYPE" | "default-style" | "DEFAULT-STYLE" | "refresh" | "REFRESH" | "x-ua-compatible" | "X-UA-COMPATIBLE" | "content-security-policy" | "CONTENT-SECURITY-POLICY">;
  'media'?: Reactive<string>;
  'name'?: Reactive<string>;
} & TagOptions<PropFor<'meta'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'meta'>>;

type MetadataAttributes = TagOptions<PropFor<'metadata'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'metadata'>> & SvgGlobalEvents<SvgElementFor<'metadata'>>;

type MeterAttributes = {
  'high'?: Reactive<number | string>;
  'low'?: Reactive<number | string>;
  'max'?: Reactive<number | string>;
  'min'?: Reactive<number | string>;
  'optimum'?: Reactive<number | string>;
  'value'?: Reactive<number | string>;
} & TagOptions<PropFor<'meter'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'meter'>>;

type MfencedAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'close'?: Reactive<string>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'open'?: Reactive<boolean>;
  'scriptlevel'?: Reactive<string>;
  'separators'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'mfenced'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

type MfracAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'denomalign'?: Reactive<string>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'linethickness'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'numalign'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'mfrac'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mi'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
  'subscriptshift'?: Reactive<string>;
  'superscriptshift'?: Reactive<string>;
  'tabindex'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'mmultiscripts'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mn'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mo'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mover'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mpadded'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

type MpathAttributes = {
  'href'?: Reactive<string>;
} & TagOptions<PropFor<'mpath'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'mpath'>> & SvgGlobalEvents<SvgElementFor<'mpath'>>;

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
} & TagOptions<PropFor<'mphantom'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mprescripts'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mroot'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mrow'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

type MsAttributes = {
  'autofocus'?: Reactive<boolean>;
  'class'?: Reactive<string | ClassValue[]>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'lquote'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'rquote'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'ms'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mspace'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'msqrt'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

type MstyleAttributes = {
  'autofocus'?: Reactive<boolean>;
  'background'?: Reactive<string>;
  'class'?: Reactive<string | ClassValue[]>;
  'color'?: Reactive<string>;
  'dir'?: Reactive<"ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO">;
  'displaystyle'?: Reactive<string>;
  'fontfamily'?: Reactive<string>;
  'fontsize'?: Reactive<string>;
  'fontstyle'?: Reactive<string>;
  'fontweight'?: Reactive<string>;
  'href'?: Reactive<string>;
  'id'?: Reactive<string>;
  'mathbackground'?: Reactive<string>;
  'mathcolor'?: Reactive<string>;
  'mathsize'?: Reactive<string>;
  'nonce'?: Reactive<string>;
  'scriptlevel'?: Reactive<string>;
  'scriptminsize'?: Reactive<string>;
  'scriptsizemultiplier'?: Reactive<string>;
  'style'?: Reactive<string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number> & CustomCSSProperties)> | ReactiveStyleProperties;
  'tabindex'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'mstyle'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
  'subscriptshift'?: Reactive<string>;
  'tabindex'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'msub'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
  'subscriptshift'?: Reactive<string>;
  'superscriptshift'?: Reactive<string>;
  'tabindex'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'msubsup'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
  'superscriptshift'?: Reactive<string>;
  'tabindex'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'msup'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mtable'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mtd'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mtext'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'mtr'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'munder'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'munderover'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

type NavAttributes = TagOptions<PropFor<'nav'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'nav'>>;

type NoscriptAttributes = TagOptions<PropFor<'noscript'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'noscript'>>;

type ObjectAttributes = {
  'data'?: Reactive<string>;
  'form'?: Reactive<string>;
  'height'?: Reactive<number | `${number}`>;
  'name'?: Reactive<string>;
  'type'?: Reactive<string>;
  'width'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'object'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'object'>>;

type OlAttributes = {
  'reversed'?: Reactive<boolean>;
  'start'?: Reactive<number | `${number}`>;
  'type'?: Reactive<"1" | "a" | "A" | "i" | "I">;
} & TagOptions<PropFor<'ol'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'ol'>>;

type OptgroupAttributes = {
  'disabled'?: Reactive<boolean>;
  'label'?: Reactive<string>;
} & TagOptions<PropFor<'optgroup'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'optgroup'>>;

type OptionAttributes = {
  'disabled'?: Reactive<boolean>;
  'label'?: Reactive<string>;
  'selected'?: Reactive<boolean>;
  'value'?: Reactive<number | string>;
} & TagOptions<PropFor<'option'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'option'>>;

type OutputAttributes = {
  'for'?: Reactive<string>;
  'form'?: Reactive<string>;
  'name'?: Reactive<string>;
} & TagOptions<PropFor<'output'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'output'>>;

type PAttributes = TagOptions<PropFor<'p'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'p'>>;

type PathAttributes = {
  'd'?: Reactive<string>;
  'pathLength'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'path'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'path'>> & SvgGlobalEvents<SvgElementFor<'path'>>;

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
} & TagOptions<PropFor<'pattern'>> & SvgPresentationAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'pattern'>> & SvgGlobalEvents<SvgElementFor<'pattern'>>;

type PictureAttributes = TagOptions<PropFor<'picture'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'picture'>>;

type PolygonAttributes = {
  'pathLength'?: Reactive<number | `${number}`>;
  'points'?: Reactive<string>;
} & TagOptions<PropFor<'polygon'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'polygon'>> & SvgGlobalEvents<SvgElementFor<'polygon'>>;

type PolylineAttributes = {
  'pathLength'?: Reactive<number | `${number}`>;
  'points'?: Reactive<string>;
} & TagOptions<PropFor<'polyline'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'polyline'>> & SvgGlobalEvents<SvgElementFor<'polyline'>>;

type PreAttributes = TagOptions<PropFor<'pre'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'pre'>>;

type ProgressAttributes = {
  'max'?: Reactive<number | string>;
  'value'?: Reactive<number | string>;
} & TagOptions<PropFor<'progress'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'progress'>>;

type QAttributes = {
  'cite'?: Reactive<string>;
} & TagOptions<PropFor<'q'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'q'>>;

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
} & TagOptions<PropFor<'radialGradient'>> & SvgPresentationAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'radialGradient'>> & SvgGlobalEvents<SvgElementFor<'radialGradient'>>;

type RectAttributes = {
  'height'?: Reactive<number | string>;
  'pathLength'?: Reactive<number | `${number}`>;
  'rx'?: Reactive<number | string>;
  'ry'?: Reactive<number | string>;
  'width'?: Reactive<number | string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
} & TagOptions<PropFor<'rect'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'rect'>> & SvgGlobalEvents<SvgElementFor<'rect'>>;

type RpAttributes = TagOptions<PropFor<'rp'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'rp'>>;

type RtAttributes = TagOptions<PropFor<'rt'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'rt'>>;

type RubyAttributes = TagOptions<PropFor<'ruby'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'ruby'>>;

type SAttributes = TagOptions<PropFor<'s'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'s'>>;

type SampAttributes = TagOptions<PropFor<'samp'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'samp'>>;

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
} & TagOptions<ContextualPropFor<'script'>> & SvgPresentationAttributes & SvgXLinkAttributes & NameSpaceAttributes & GlobalAttributes & SvgGlobalAttributes & GlobalEvents<HtmlElementFor<'script'> | SvgElementFor<'script'>> & SvgGlobalEvents<HtmlElementFor<'script'> | SvgElementFor<'script'>>;

type SearchAttributes = TagOptions<PropFor<'search'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'search'>>;

type SectionAttributes = TagOptions<PropFor<'section'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'section'>>;

type SelectAttributes = {
  'autocomplete'?: Reactive<string>;
  'disabled'?: Reactive<boolean>;
  'form'?: Reactive<string>;
  'multiple'?: Reactive<boolean>;
  'name'?: Reactive<string>;
  'required'?: Reactive<boolean>;
  'size'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'select'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'select'>>;

type SelectedcontentAttributes = TagOptions<PropFor<'selectedcontent'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'selectedcontent'>>;

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
} & TagOptions<PropFor<'semantics'>> & NameSpaceAttributes & GlobalEvents<MathMLElement>;

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
} & TagOptions<PropFor<'set'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'set'>> & SvgGlobalEvents<SvgElementFor<'set'>>;

type SlotAttributes = {
  'name'?: Reactive<string>;
} & TagOptions<PropFor<'slot'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'slot'>>;

type SmallAttributes = TagOptions<PropFor<'small'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'small'>>;

type SourceAttributes = {
  'height'?: Reactive<number | `${number}`>;
  'media'?: Reactive<string>;
  'sizes'?: Reactive<string>;
  'src'?: Reactive<string>;
  'srcset'?: Reactive<string>;
  'type'?: Reactive<string>;
  'width'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'source'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'source'>>;

type SpanAttributes = TagOptions<PropFor<'span'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'span'>>;

type StopAttributes = {
  'offset'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'stop'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'stop'>> & SvgGlobalEvents<SvgElementFor<'stop'>>;

type StrongAttributes = TagOptions<PropFor<'strong'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'strong'>>;

type StyleAttributes = {
  'blocking'?: Reactive<string>;
  'media'?: Reactive<string>;
  'type'?: Reactive<string>;
} & TagOptions<ContextualPropFor<'style'>> & SvgPresentationAttributes & NameSpaceAttributes & GlobalAttributes & SvgGlobalAttributes & GlobalEvents<HtmlElementFor<'style'> | SvgElementFor<'style'>> & SvgGlobalEvents<HtmlElementFor<'style'> | SvgElementFor<'style'>>;

type SubAttributes = TagOptions<PropFor<'sub'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'sub'>>;

type SummaryAttributes = TagOptions<PropFor<'summary'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'summary'>>;

type SupAttributes = TagOptions<PropFor<'sup'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'sup'>>;

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
} & TagOptions<PropFor<'svg'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'svg'>> & SvgGlobalEvents<SvgElementFor<'svg'>>;

type SwitchAttributes = TagOptions<PropFor<'switch'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'switch'>> & SvgGlobalEvents<SvgElementFor<'switch'>>;

type SymbolAttributes = {
  'height'?: Reactive<number | string>;
  'preserveAspectRatio'?: Reactive<string>;
  'refX'?: Reactive<string>;
  'refY'?: Reactive<string>;
  'viewBox'?: Reactive<string>;
  'width'?: Reactive<number | string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
} & TagOptions<PropFor<'symbol'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'symbol'>> & SvgGlobalEvents<SvgElementFor<'symbol'>>;

type TableAttributes = TagOptions<PropFor<'table'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'table'>>;

type TbodyAttributes = TagOptions<PropFor<'tbody'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'tbody'>>;

type TdAttributes = {
  'colspan'?: Reactive<number | `${number}`>;
  'headers'?: Reactive<string>;
  'rowspan'?: Reactive<number | `${number}`>;
} & TagOptions<PropFor<'td'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'td'>>;

type TemplateAttributes = {
  'for'?: Reactive<string>;
  'shadowrootclonable'?: Reactive<boolean>;
  'shadowrootcustomelementregistry'?: Reactive<boolean>;
  'shadowrootdelegatesfocus'?: Reactive<boolean>;
  'shadowrootmode'?: Reactive<"open" | "closed">;
  'shadowrootserializable'?: Reactive<boolean>;
  'shadowrootslotassignment'?: Reactive<"named" | "manual">;
} & TagOptions<PropFor<'template'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'template'>>;

type TextAttributes = {
  'dx'?: Reactive<string>;
  'dy'?: Reactive<string>;
  'lengthAdjust'?: Reactive<string>;
  'rotate'?: Reactive<number | string>;
  'textLength'?: Reactive<string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
} & TagOptions<PropFor<'text'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'text'>> & SvgGlobalEvents<SvgElementFor<'text'>>;

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
} & TagOptions<PropFor<'textarea'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'textarea'>>;

type TextPathAttributes = {
  'href'?: Reactive<string>;
  'lengthAdjust'?: Reactive<string>;
  'method'?: Reactive<"get" | "GET" | "post" | "POST" | "dialog" | "DIALOG">;
  'path'?: Reactive<string>;
  'side'?: Reactive<string>;
  'spacing'?: Reactive<string>;
  'startOffset'?: Reactive<string>;
  'textLength'?: Reactive<string>;
} & TagOptions<PropFor<'textPath'>> & SvgPresentationAttributes & SvgConditionalAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'textPath'>> & SvgGlobalEvents<SvgElementFor<'textPath'>>;

type TfootAttributes = TagOptions<PropFor<'tfoot'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'tfoot'>>;

type ThAttributes = {
  'abbr'?: Reactive<string>;
  'colspan'?: Reactive<number | `${number}`>;
  'headers'?: Reactive<string>;
  'rowspan'?: Reactive<number | `${number}`>;
  'scope'?: Reactive<"row" | "ROW" | "col" | "COL" | "rowgroup" | "ROWGROUP" | "colgroup" | "COLGROUP">;
} & TagOptions<PropFor<'th'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'th'>>;

type TheadAttributes = TagOptions<PropFor<'thead'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'thead'>>;

type TimeAttributes = {
  'datetime'?: Reactive<string>;
} & TagOptions<PropFor<'time'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'time'>>;

type TitleAttributes = TagOptions<ContextualPropFor<'title'>> & SvgPresentationAttributes & NameSpaceAttributes & GlobalAttributes & SvgGlobalAttributes & GlobalEvents<HtmlElementFor<'title'> | SvgElementFor<'title'>> & SvgGlobalEvents<HtmlElementFor<'title'> | SvgElementFor<'title'>>;

type TrAttributes = TagOptions<PropFor<'tr'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'tr'>>;

type TrackAttributes = {
  'default'?: Reactive<boolean>;
  'kind'?: Reactive<"subtitles" | "captions" | "descriptions" | "chapters" | "metadata">;
  'label'?: Reactive<string>;
  'src'?: Reactive<string>;
  'srclang'?: Reactive<string>;
} & TagOptions<PropFor<'track'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'track'>>;

type TspanAttributes = {
  'dx'?: Reactive<string>;
  'dy'?: Reactive<string>;
  'lengthAdjust'?: Reactive<string>;
  'rotate'?: Reactive<number | string>;
  'textLength'?: Reactive<string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
} & TagOptions<PropFor<'tspan'>> & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'tspan'>> & SvgGlobalEvents<SvgElementFor<'tspan'>>;

type UAttributes = TagOptions<PropFor<'u'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'u'>>;

type UlAttributes = TagOptions<PropFor<'ul'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'ul'>>;

type UseAttributes = {
  'height'?: Reactive<number | string>;
  'href'?: Reactive<string>;
  'width'?: Reactive<number | string>;
  'x'?: Reactive<number | string>;
  'y'?: Reactive<number | string>;
} & TagOptions<PropFor<'use'>> & SvgPresentationAttributes & SvgConditionalAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'use'>> & SvgGlobalEvents<SvgElementFor<'use'>>;

type VarAttributes = TagOptions<PropFor<'var'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'var'>>;

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
} & TagOptions<PropFor<'video'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'video'>>;

type ViewAttributes = {
  'preserveAspectRatio'?: Reactive<string>;
  'viewBox'?: Reactive<string>;
} & TagOptions<PropFor<'view'>> & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents<SvgElementFor<'view'>> & SvgGlobalEvents<SvgElementFor<'view'>>;

type WbrAttributes = TagOptions<PropFor<'wbr'>> & NameSpaceAttributes & GlobalAttributes & GlobalEvents<HtmlElementFor<'wbr'>>;

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

export type UniversalAttributes<E extends EventTarget | null = EventTarget | null> =
  NameSpaceAttributes & GlobalAttributes & GlobalEvents<E>;

/** Kensington options shared by built-in and custom element methods. */
type TagOptions<P> = {
  /** Assign DOM properties directly, using the element's property types. */
  prop?: P | null;
  /** Dispatch inferred DOM events after signal-driven form property changes. Default false. */
  dispatchOnPropChange?: boolean;
  /** Pause reactive bindings on removal and resume them on reconnection. Default false. */
  persist?: boolean;
};

type CustomTagAttributes<E extends Element> = UniversalAttributes<E> & TagOptions<PropFor<string>>;

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
export interface ContentMethod<T = {}, E extends Element = Element> {
  (attributes: T & CustomTagAttributes<E>, content?: Content): ContentTag<E>;
  (attributes: T & WithLegacyOn<CustomTagAttributes<E>>, content?: Content): ContentTag<E>;
  (content?: Content): ContentTag<E>;
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
 * - boolean ARIA states and supported HTML enumerated attributes use explicit tokens
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
    /** Add open attribute prefixes, e.g. `'hx'` for htmx. Register individual ARIA names via `additionalGlobalAttributes`. */
    additionalNamespaces?: string | string[];
    /** Spaces per indentation level. Default: 2. Set to 0 to disable indentation. */
    indentationLevel?: number;
    /** Tag validation and rendered reactive runtime diagnostics. Defaults to `'off'`.
     * Does not configure standalone signal, computed, effect, or applyPendingReactiveUpdates calls.
     */
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
  ): ContentMethod<{
    [K in keyof A as K | CamelCase<K & string> | KebabCase<K & string>]?: Reactive<ResolveAttrValue<A[K]>>
  }, HTMLElement>

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
  htmlWithDocType(attributes: HtmlAttributes, content?: HtmlContent): ContentTag<HTMLHtmlElement>;
  htmlWithDocType(attributes: WithLegacyOn<HtmlAttributes>, content?: HtmlContent): ContentTag<HTMLHtmlElement>;
  htmlWithDocType(content?: HtmlContent): ContentTag<HTMLHtmlElement>;

  a(attributes: AAttributes, content?: Content): ContentTag<HtmlElementFor<'a'> | SvgElementFor<'a'> | MathMLElement>;
  a(attributes: WithLegacyOn<AAttributes>, content?: Content): ContentTag<HtmlElementFor<'a'> | SvgElementFor<'a'> | MathMLElement>;
  a(content?: Content): ContentTag<HtmlElementFor<'a'> | SvgElementFor<'a'> | MathMLElement>;
  abbr(attributes: AbbrAttributes, content?: Content): ContentTag<HtmlElementFor<'abbr'>>;
  abbr(attributes: WithLegacyOn<AbbrAttributes>, content?: Content): ContentTag<HtmlElementFor<'abbr'>>;
  abbr(content?: Content): ContentTag<HtmlElementFor<'abbr'>>;
  address(attributes: AddressAttributes, content?: Content): ContentTag<HtmlElementFor<'address'>>;
  address(attributes: WithLegacyOn<AddressAttributes>, content?: Content): ContentTag<HtmlElementFor<'address'>>;
  address(content?: Content): ContentTag<HtmlElementFor<'address'>>;
  animate(attributes: AnimateAttributes, content?: Content): ContentTag<SvgElementFor<'animate'>>;
  animate(attributes: WithLegacyOn<AnimateAttributes>, content?: Content): ContentTag<SvgElementFor<'animate'>>;
  animate(content?: Content): ContentTag<SvgElementFor<'animate'>>;
  animateMotion(attributes: AnimateMotionAttributes, content?: Content): ContentTag<SvgElementFor<'animateMotion'>>;
  animateMotion(attributes: WithLegacyOn<AnimateMotionAttributes>, content?: Content): ContentTag<SvgElementFor<'animateMotion'>>;
  animateMotion(content?: Content): ContentTag<SvgElementFor<'animateMotion'>>;
  animateTransform(attributes: AnimateTransformAttributes, content?: Content): ContentTag<SvgElementFor<'animateTransform'>>;
  animateTransform(attributes: WithLegacyOn<AnimateTransformAttributes>, content?: Content): ContentTag<SvgElementFor<'animateTransform'>>;
  animateTransform(content?: Content): ContentTag<SvgElementFor<'animateTransform'>>;
  annotation(attributes: AnnotationAttributes, content?: Content): ContentTag<MathMLElement>;
  annotation(attributes: WithLegacyOn<AnnotationAttributes>, content?: Content): ContentTag<MathMLElement>;
  annotation(content?: Content): ContentTag<MathMLElement>;
  annotationXml(attributes: AnnotationXmlAttributes, content?: Content): ContentTag<MathMLElement>;
  annotationXml(attributes: WithLegacyOn<AnnotationXmlAttributes>, content?: Content): ContentTag<MathMLElement>;
  annotationXml(content?: Content): ContentTag<MathMLElement>;
  area(attributes?: AreaAttributes): VoidTag<HtmlElementFor<'area'>>;
  area(attributes?: WithLegacyOn<AreaAttributes>): VoidTag<HtmlElementFor<'area'>>;
  article(attributes: ArticleAttributes, content?: Content): ContentTag<HtmlElementFor<'article'>>;
  article(attributes: WithLegacyOn<ArticleAttributes>, content?: Content): ContentTag<HtmlElementFor<'article'>>;
  article(content?: Content): ContentTag<HtmlElementFor<'article'>>;
  aside(attributes: AsideAttributes, content?: Content): ContentTag<HtmlElementFor<'aside'>>;
  aside(attributes: WithLegacyOn<AsideAttributes>, content?: Content): ContentTag<HtmlElementFor<'aside'>>;
  aside(content?: Content): ContentTag<HtmlElementFor<'aside'>>;
  audio(attributes: AudioAttributes, content?: Content): ContentTag<HtmlElementFor<'audio'>>;
  audio(attributes: WithLegacyOn<AudioAttributes>, content?: Content): ContentTag<HtmlElementFor<'audio'>>;
  audio(content?: Content): ContentTag<HtmlElementFor<'audio'>>;
  b(attributes: BAttributes, content?: Content): ContentTag<HtmlElementFor<'b'>>;
  b(attributes: WithLegacyOn<BAttributes>, content?: Content): ContentTag<HtmlElementFor<'b'>>;
  b(content?: Content): ContentTag<HtmlElementFor<'b'>>;
  base(attributes?: BaseAttributes): VoidTag<HtmlElementFor<'base'>>;
  base(attributes?: WithLegacyOn<BaseAttributes>): VoidTag<HtmlElementFor<'base'>>;
  bdi(attributes: BdiAttributes, content?: Content): ContentTag<HtmlElementFor<'bdi'>>;
  bdi(attributes: WithLegacyOn<BdiAttributes>, content?: Content): ContentTag<HtmlElementFor<'bdi'>>;
  bdi(content?: Content): ContentTag<HtmlElementFor<'bdi'>>;
  bdo(attributes: BdoAttributes, content?: Content): ContentTag<HtmlElementFor<'bdo'>>;
  bdo(attributes: WithLegacyOn<BdoAttributes>, content?: Content): ContentTag<HtmlElementFor<'bdo'>>;
  bdo(content?: Content): ContentTag<HtmlElementFor<'bdo'>>;
  blockquote(attributes: BlockquoteAttributes, content?: Content): ContentTag<HtmlElementFor<'blockquote'>>;
  blockquote(attributes: WithLegacyOn<BlockquoteAttributes>, content?: Content): ContentTag<HtmlElementFor<'blockquote'>>;
  blockquote(content?: Content): ContentTag<HtmlElementFor<'blockquote'>>;
  body(attributes: BodyAttributes, content?: Content): BodyTag;
  body(attributes: WithLegacyOn<BodyAttributes>, content?: Content): BodyTag;
  body(content?: Content): BodyTag;
  br(attributes?: BrAttributes): VoidTag<HtmlElementFor<'br'>>;
  br(attributes?: WithLegacyOn<BrAttributes>): VoidTag<HtmlElementFor<'br'>>;
  button(attributes: ButtonAttributes, content?: Content): ButtonTag;
  button(attributes: WithLegacyOn<ButtonAttributes>, content?: Content): ButtonTag;
  button(content?: Content): ButtonTag;
  canvas(attributes: CanvasAttributes, content?: Content): ContentTag<HtmlElementFor<'canvas'>>;
  canvas(attributes: WithLegacyOn<CanvasAttributes>, content?: Content): ContentTag<HtmlElementFor<'canvas'>>;
  canvas(content?: Content): ContentTag<HtmlElementFor<'canvas'>>;
  caption(attributes: CaptionAttributes, content?: Content): CaptionTag;
  caption(attributes: WithLegacyOn<CaptionAttributes>, content?: Content): CaptionTag;
  caption(content?: Content): CaptionTag;
  circle(attributes: CircleAttributes, content?: Content): ContentTag<SvgElementFor<'circle'>>;
  circle(attributes: WithLegacyOn<CircleAttributes>, content?: Content): ContentTag<SvgElementFor<'circle'>>;
  circle(content?: Content): ContentTag<SvgElementFor<'circle'>>;
  cite(attributes: CiteAttributes, content?: Content): ContentTag<HtmlElementFor<'cite'>>;
  cite(attributes: WithLegacyOn<CiteAttributes>, content?: Content): ContentTag<HtmlElementFor<'cite'>>;
  cite(content?: Content): ContentTag<HtmlElementFor<'cite'>>;
  clipPath(attributes: ClipPathAttributes, content?: Content): ContentTag<SvgElementFor<'clipPath'>>;
  clipPath(attributes: WithLegacyOn<ClipPathAttributes>, content?: Content): ContentTag<SvgElementFor<'clipPath'>>;
  clipPath(content?: Content): ContentTag<SvgElementFor<'clipPath'>>;
  code(attributes: CodeAttributes, content?: Content): ContentTag<HtmlElementFor<'code'>>;
  code(attributes: WithLegacyOn<CodeAttributes>, content?: Content): ContentTag<HtmlElementFor<'code'>>;
  code(content?: Content): ContentTag<HtmlElementFor<'code'>>;
  col(attributes?: ColAttributes): ColTag;
  col(attributes?: WithLegacyOn<ColAttributes>): ColTag;
  colgroup(attributes: ColgroupAttributes, content?: ColgroupContent): ColgroupTag;
  colgroup(attributes: WithLegacyOn<ColgroupAttributes>, content?: ColgroupContent): ColgroupTag;
  colgroup(content?: ColgroupContent): ColgroupTag;
  data(attributes: DataAttributes, content?: Content): ContentTag<HtmlElementFor<'data'>>;
  data(attributes: WithLegacyOn<DataAttributes>, content?: Content): ContentTag<HtmlElementFor<'data'>>;
  data(content?: Content): ContentTag<HtmlElementFor<'data'>>;
  datalist(attributes: DatalistAttributes, content?: Content): ContentTag<HtmlElementFor<'datalist'>>;
  datalist(attributes: WithLegacyOn<DatalistAttributes>, content?: Content): ContentTag<HtmlElementFor<'datalist'>>;
  datalist(content?: Content): ContentTag<HtmlElementFor<'datalist'>>;
  dd(attributes: DdAttributes, content?: Content): DdTag;
  dd(attributes: WithLegacyOn<DdAttributes>, content?: Content): DdTag;
  dd(content?: Content): DdTag;
  defs(attributes: DefsAttributes, content?: Content): ContentTag<SvgElementFor<'defs'>>;
  defs(attributes: WithLegacyOn<DefsAttributes>, content?: Content): ContentTag<SvgElementFor<'defs'>>;
  defs(content?: Content): ContentTag<SvgElementFor<'defs'>>;
  del(attributes: DelAttributes, content?: Content): ContentTag<HtmlElementFor<'del'>>;
  del(attributes: WithLegacyOn<DelAttributes>, content?: Content): ContentTag<HtmlElementFor<'del'>>;
  del(content?: Content): ContentTag<HtmlElementFor<'del'>>;
  desc(attributes: DescAttributes, content?: Content): ContentTag<SvgElementFor<'desc'>>;
  desc(attributes: WithLegacyOn<DescAttributes>, content?: Content): ContentTag<SvgElementFor<'desc'>>;
  desc(content?: Content): ContentTag<SvgElementFor<'desc'>>;
  details(attributes: DetailsAttributes, content?: Content): ContentTag<HtmlElementFor<'details'>>;
  details(attributes: WithLegacyOn<DetailsAttributes>, content?: Content): ContentTag<HtmlElementFor<'details'>>;
  details(content?: Content): ContentTag<HtmlElementFor<'details'>>;
  dfn(attributes: DfnAttributes, content?: Content): ContentTag<HtmlElementFor<'dfn'>>;
  dfn(attributes: WithLegacyOn<DfnAttributes>, content?: Content): ContentTag<HtmlElementFor<'dfn'>>;
  dfn(content?: Content): ContentTag<HtmlElementFor<'dfn'>>;
  dialog(attributes: DialogAttributes, content?: Content): ContentTag<HtmlElementFor<'dialog'>>;
  dialog(attributes: WithLegacyOn<DialogAttributes>, content?: Content): ContentTag<HtmlElementFor<'dialog'>>;
  dialog(content?: Content): ContentTag<HtmlElementFor<'dialog'>>;
  div(attributes: DivAttributes, content?: Content): DivTag;
  div(attributes: WithLegacyOn<DivAttributes>, content?: Content): DivTag;
  div(content?: Content): DivTag;
  dl(attributes: DlAttributes, content?: DlContent): DlTag;
  dl(attributes: WithLegacyOn<DlAttributes>, content?: DlContent): DlTag;
  dl(content?: DlContent): DlTag;
  dt(attributes: DtAttributes, content?: Content): DtTag;
  dt(attributes: WithLegacyOn<DtAttributes>, content?: Content): DtTag;
  dt(content?: Content): DtTag;
  ellipse(attributes: EllipseAttributes, content?: Content): ContentTag<SvgElementFor<'ellipse'>>;
  ellipse(attributes: WithLegacyOn<EllipseAttributes>, content?: Content): ContentTag<SvgElementFor<'ellipse'>>;
  ellipse(content?: Content): ContentTag<SvgElementFor<'ellipse'>>;
  em(attributes: EmAttributes, content?: Content): ContentTag<HtmlElementFor<'em'>>;
  em(attributes: WithLegacyOn<EmAttributes>, content?: Content): ContentTag<HtmlElementFor<'em'>>;
  em(content?: Content): ContentTag<HtmlElementFor<'em'>>;
  embed(attributes?: EmbedAttributes): VoidTag<HtmlElementFor<'embed'>>;
  embed(attributes?: WithLegacyOn<EmbedAttributes>): VoidTag<HtmlElementFor<'embed'>>;
  feBlend(attributes: FeBlendAttributes, content?: Content): ContentTag<SvgElementFor<'feBlend'>>;
  feBlend(attributes: WithLegacyOn<FeBlendAttributes>, content?: Content): ContentTag<SvgElementFor<'feBlend'>>;
  feBlend(content?: Content): ContentTag<SvgElementFor<'feBlend'>>;
  feColorMatrix(attributes: FeColorMatrixAttributes, content?: Content): ContentTag<SvgElementFor<'feColorMatrix'>>;
  feColorMatrix(attributes: WithLegacyOn<FeColorMatrixAttributes>, content?: Content): ContentTag<SvgElementFor<'feColorMatrix'>>;
  feColorMatrix(content?: Content): ContentTag<SvgElementFor<'feColorMatrix'>>;
  feComponentTransfer(attributes: FeComponentTransferAttributes, content?: Content): ContentTag<SvgElementFor<'feComponentTransfer'>>;
  feComponentTransfer(attributes: WithLegacyOn<FeComponentTransferAttributes>, content?: Content): ContentTag<SvgElementFor<'feComponentTransfer'>>;
  feComponentTransfer(content?: Content): ContentTag<SvgElementFor<'feComponentTransfer'>>;
  feComposite(attributes: FeCompositeAttributes, content?: Content): ContentTag<SvgElementFor<'feComposite'>>;
  feComposite(attributes: WithLegacyOn<FeCompositeAttributes>, content?: Content): ContentTag<SvgElementFor<'feComposite'>>;
  feComposite(content?: Content): ContentTag<SvgElementFor<'feComposite'>>;
  feConvolveMatrix(attributes: FeConvolveMatrixAttributes, content?: Content): ContentTag<SvgElementFor<'feConvolveMatrix'>>;
  feConvolveMatrix(attributes: WithLegacyOn<FeConvolveMatrixAttributes>, content?: Content): ContentTag<SvgElementFor<'feConvolveMatrix'>>;
  feConvolveMatrix(content?: Content): ContentTag<SvgElementFor<'feConvolveMatrix'>>;
  feDiffuseLighting(attributes: FeDiffuseLightingAttributes, content?: Content): ContentTag<SvgElementFor<'feDiffuseLighting'>>;
  feDiffuseLighting(attributes: WithLegacyOn<FeDiffuseLightingAttributes>, content?: Content): ContentTag<SvgElementFor<'feDiffuseLighting'>>;
  feDiffuseLighting(content?: Content): ContentTag<SvgElementFor<'feDiffuseLighting'>>;
  feDisplacementMap(attributes: FeDisplacementMapAttributes, content?: Content): ContentTag<SvgElementFor<'feDisplacementMap'>>;
  feDisplacementMap(attributes: WithLegacyOn<FeDisplacementMapAttributes>, content?: Content): ContentTag<SvgElementFor<'feDisplacementMap'>>;
  feDisplacementMap(content?: Content): ContentTag<SvgElementFor<'feDisplacementMap'>>;
  feDistantLight(attributes: FeDistantLightAttributes, content?: Content): ContentTag<SvgElementFor<'feDistantLight'>>;
  feDistantLight(attributes: WithLegacyOn<FeDistantLightAttributes>, content?: Content): ContentTag<SvgElementFor<'feDistantLight'>>;
  feDistantLight(content?: Content): ContentTag<SvgElementFor<'feDistantLight'>>;
  feDropShadow(attributes: FeDropShadowAttributes, content?: Content): ContentTag<SvgElementFor<'feDropShadow'>>;
  feDropShadow(attributes: WithLegacyOn<FeDropShadowAttributes>, content?: Content): ContentTag<SvgElementFor<'feDropShadow'>>;
  feDropShadow(content?: Content): ContentTag<SvgElementFor<'feDropShadow'>>;
  feFlood(attributes: FeFloodAttributes, content?: Content): ContentTag<SvgElementFor<'feFlood'>>;
  feFlood(attributes: WithLegacyOn<FeFloodAttributes>, content?: Content): ContentTag<SvgElementFor<'feFlood'>>;
  feFlood(content?: Content): ContentTag<SvgElementFor<'feFlood'>>;
  feFuncA(attributes: FeFuncAAttributes, content?: Content): ContentTag<SvgElementFor<'feFuncA'>>;
  feFuncA(attributes: WithLegacyOn<FeFuncAAttributes>, content?: Content): ContentTag<SvgElementFor<'feFuncA'>>;
  feFuncA(content?: Content): ContentTag<SvgElementFor<'feFuncA'>>;
  feFuncB(attributes: FeFuncBAttributes, content?: Content): ContentTag<SvgElementFor<'feFuncB'>>;
  feFuncB(attributes: WithLegacyOn<FeFuncBAttributes>, content?: Content): ContentTag<SvgElementFor<'feFuncB'>>;
  feFuncB(content?: Content): ContentTag<SvgElementFor<'feFuncB'>>;
  feFuncG(attributes: FeFuncGAttributes, content?: Content): ContentTag<SvgElementFor<'feFuncG'>>;
  feFuncG(attributes: WithLegacyOn<FeFuncGAttributes>, content?: Content): ContentTag<SvgElementFor<'feFuncG'>>;
  feFuncG(content?: Content): ContentTag<SvgElementFor<'feFuncG'>>;
  feFuncR(attributes: FeFuncRAttributes, content?: Content): ContentTag<SvgElementFor<'feFuncR'>>;
  feFuncR(attributes: WithLegacyOn<FeFuncRAttributes>, content?: Content): ContentTag<SvgElementFor<'feFuncR'>>;
  feFuncR(content?: Content): ContentTag<SvgElementFor<'feFuncR'>>;
  feGaussianBlur(attributes: FeGaussianBlurAttributes, content?: Content): ContentTag<SvgElementFor<'feGaussianBlur'>>;
  feGaussianBlur(attributes: WithLegacyOn<FeGaussianBlurAttributes>, content?: Content): ContentTag<SvgElementFor<'feGaussianBlur'>>;
  feGaussianBlur(content?: Content): ContentTag<SvgElementFor<'feGaussianBlur'>>;
  feImage(attributes: FeImageAttributes, content?: Content): ContentTag<SvgElementFor<'feImage'>>;
  feImage(attributes: WithLegacyOn<FeImageAttributes>, content?: Content): ContentTag<SvgElementFor<'feImage'>>;
  feImage(content?: Content): ContentTag<SvgElementFor<'feImage'>>;
  feMerge(attributes: FeMergeAttributes, content?: Content): ContentTag<SvgElementFor<'feMerge'>>;
  feMerge(attributes: WithLegacyOn<FeMergeAttributes>, content?: Content): ContentTag<SvgElementFor<'feMerge'>>;
  feMerge(content?: Content): ContentTag<SvgElementFor<'feMerge'>>;
  feMergeNode(attributes: FeMergeNodeAttributes, content?: Content): ContentTag<SvgElementFor<'feMergeNode'>>;
  feMergeNode(attributes: WithLegacyOn<FeMergeNodeAttributes>, content?: Content): ContentTag<SvgElementFor<'feMergeNode'>>;
  feMergeNode(content?: Content): ContentTag<SvgElementFor<'feMergeNode'>>;
  feMorphology(attributes: FeMorphologyAttributes, content?: Content): ContentTag<SvgElementFor<'feMorphology'>>;
  feMorphology(attributes: WithLegacyOn<FeMorphologyAttributes>, content?: Content): ContentTag<SvgElementFor<'feMorphology'>>;
  feMorphology(content?: Content): ContentTag<SvgElementFor<'feMorphology'>>;
  feOffset(attributes: FeOffsetAttributes, content?: Content): ContentTag<SvgElementFor<'feOffset'>>;
  feOffset(attributes: WithLegacyOn<FeOffsetAttributes>, content?: Content): ContentTag<SvgElementFor<'feOffset'>>;
  feOffset(content?: Content): ContentTag<SvgElementFor<'feOffset'>>;
  fePointLight(attributes: FePointLightAttributes, content?: Content): ContentTag<SvgElementFor<'fePointLight'>>;
  fePointLight(attributes: WithLegacyOn<FePointLightAttributes>, content?: Content): ContentTag<SvgElementFor<'fePointLight'>>;
  fePointLight(content?: Content): ContentTag<SvgElementFor<'fePointLight'>>;
  feSpecularLighting(attributes: FeSpecularLightingAttributes, content?: Content): ContentTag<SvgElementFor<'feSpecularLighting'>>;
  feSpecularLighting(attributes: WithLegacyOn<FeSpecularLightingAttributes>, content?: Content): ContentTag<SvgElementFor<'feSpecularLighting'>>;
  feSpecularLighting(content?: Content): ContentTag<SvgElementFor<'feSpecularLighting'>>;
  feSpotLight(attributes: FeSpotLightAttributes, content?: Content): ContentTag<SvgElementFor<'feSpotLight'>>;
  feSpotLight(attributes: WithLegacyOn<FeSpotLightAttributes>, content?: Content): ContentTag<SvgElementFor<'feSpotLight'>>;
  feSpotLight(content?: Content): ContentTag<SvgElementFor<'feSpotLight'>>;
  feTile(attributes: FeTileAttributes, content?: Content): ContentTag<SvgElementFor<'feTile'>>;
  feTile(attributes: WithLegacyOn<FeTileAttributes>, content?: Content): ContentTag<SvgElementFor<'feTile'>>;
  feTile(content?: Content): ContentTag<SvgElementFor<'feTile'>>;
  feTurbulence(attributes: FeTurbulenceAttributes, content?: Content): ContentTag<SvgElementFor<'feTurbulence'>>;
  feTurbulence(attributes: WithLegacyOn<FeTurbulenceAttributes>, content?: Content): ContentTag<SvgElementFor<'feTurbulence'>>;
  feTurbulence(content?: Content): ContentTag<SvgElementFor<'feTurbulence'>>;
  fieldset(attributes: FieldsetAttributes, content?: Content): ContentTag<HtmlElementFor<'fieldset'>>;
  fieldset(attributes: WithLegacyOn<FieldsetAttributes>, content?: Content): ContentTag<HtmlElementFor<'fieldset'>>;
  fieldset(content?: Content): ContentTag<HtmlElementFor<'fieldset'>>;
  figcaption(attributes: FigcaptionAttributes, content?: Content): ContentTag<HtmlElementFor<'figcaption'>>;
  figcaption(attributes: WithLegacyOn<FigcaptionAttributes>, content?: Content): ContentTag<HtmlElementFor<'figcaption'>>;
  figcaption(content?: Content): ContentTag<HtmlElementFor<'figcaption'>>;
  figure(attributes: FigureAttributes, content?: Content): ContentTag<HtmlElementFor<'figure'>>;
  figure(attributes: WithLegacyOn<FigureAttributes>, content?: Content): ContentTag<HtmlElementFor<'figure'>>;
  figure(content?: Content): ContentTag<HtmlElementFor<'figure'>>;
  filter(attributes: FilterAttributes, content?: Content): ContentTag<SvgElementFor<'filter'>>;
  filter(attributes: WithLegacyOn<FilterAttributes>, content?: Content): ContentTag<SvgElementFor<'filter'>>;
  filter(content?: Content): ContentTag<SvgElementFor<'filter'>>;
  footer(attributes: FooterAttributes, content?: Content): ContentTag<HtmlElementFor<'footer'>>;
  footer(attributes: WithLegacyOn<FooterAttributes>, content?: Content): ContentTag<HtmlElementFor<'footer'>>;
  footer(content?: Content): ContentTag<HtmlElementFor<'footer'>>;
  foreignObject(attributes: ForeignObjectAttributes, content?: Content): ContentTag<SvgElementFor<'foreignObject'>>;
  foreignObject(attributes: WithLegacyOn<ForeignObjectAttributes>, content?: Content): ContentTag<SvgElementFor<'foreignObject'>>;
  foreignObject(content?: Content): ContentTag<SvgElementFor<'foreignObject'>>;
  form(attributes: FormAttributes, content?: Content): ContentTag<HtmlElementFor<'form'>>;
  form(attributes: WithLegacyOn<FormAttributes>, content?: Content): ContentTag<HtmlElementFor<'form'>>;
  form(content?: Content): ContentTag<HtmlElementFor<'form'>>;
  g(attributes: GAttributes, content?: Content): ContentTag<SvgElementFor<'g'>>;
  g(attributes: WithLegacyOn<GAttributes>, content?: Content): ContentTag<SvgElementFor<'g'>>;
  g(content?: Content): ContentTag<SvgElementFor<'g'>>;
  h1(attributes: H1Attributes, content?: Content): H1Tag;
  h1(attributes: WithLegacyOn<H1Attributes>, content?: Content): H1Tag;
  h1(content?: Content): H1Tag;
  h2(attributes: H2Attributes, content?: Content): H2Tag;
  h2(attributes: WithLegacyOn<H2Attributes>, content?: Content): H2Tag;
  h2(content?: Content): H2Tag;
  h3(attributes: H3Attributes, content?: Content): H3Tag;
  h3(attributes: WithLegacyOn<H3Attributes>, content?: Content): H3Tag;
  h3(content?: Content): H3Tag;
  h4(attributes: H4Attributes, content?: Content): H4Tag;
  h4(attributes: WithLegacyOn<H4Attributes>, content?: Content): H4Tag;
  h4(content?: Content): H4Tag;
  h5(attributes: H5Attributes, content?: Content): H5Tag;
  h5(attributes: WithLegacyOn<H5Attributes>, content?: Content): H5Tag;
  h5(content?: Content): H5Tag;
  h6(attributes: H6Attributes, content?: Content): H6Tag;
  h6(attributes: WithLegacyOn<H6Attributes>, content?: Content): H6Tag;
  h6(content?: Content): H6Tag;
  head(attributes: HeadAttributes, content?: Content): HeadTag;
  head(attributes: WithLegacyOn<HeadAttributes>, content?: Content): HeadTag;
  head(content?: Content): HeadTag;
  header(attributes: HeaderAttributes, content?: Content): ContentTag<HtmlElementFor<'header'>>;
  header(attributes: WithLegacyOn<HeaderAttributes>, content?: Content): ContentTag<HtmlElementFor<'header'>>;
  header(content?: Content): ContentTag<HtmlElementFor<'header'>>;
  hgroup(attributes: HgroupAttributes, content?: HgroupContent): HgroupTag;
  hgroup(attributes: WithLegacyOn<HgroupAttributes>, content?: HgroupContent): HgroupTag;
  hgroup(content?: HgroupContent): HgroupTag;
  hr(attributes?: HrAttributes): HrTag;
  hr(attributes?: WithLegacyOn<HrAttributes>): HrTag;
  html(attributes: HtmlAttributes, content?: HtmlContent): HtmlTag;
  html(attributes: WithLegacyOn<HtmlAttributes>, content?: HtmlContent): HtmlTag;
  html(content?: HtmlContent): HtmlTag;
  i(attributes: IAttributes, content?: Content): ContentTag<HtmlElementFor<'i'>>;
  i(attributes: WithLegacyOn<IAttributes>, content?: Content): ContentTag<HtmlElementFor<'i'>>;
  i(content?: Content): ContentTag<HtmlElementFor<'i'>>;
  iframe(attributes: IframeAttributes, content?: Content): ContentTag<HtmlElementFor<'iframe'>>;
  iframe(attributes: WithLegacyOn<IframeAttributes>, content?: Content): ContentTag<HtmlElementFor<'iframe'>>;
  iframe(content?: Content): ContentTag<HtmlElementFor<'iframe'>>;
  image(attributes: ImageAttributes, content?: Content): ContentTag<SvgElementFor<'image'>>;
  image(attributes: WithLegacyOn<ImageAttributes>, content?: Content): ContentTag<SvgElementFor<'image'>>;
  image(content?: Content): ContentTag<SvgElementFor<'image'>>;
  img(attributes?: ImgAttributes): ImgTag;
  img(attributes?: WithLegacyOn<ImgAttributes>): ImgTag;
  input(attributes?: InputAttributes): VoidTag<HtmlElementFor<'input'>>;
  input(attributes?: WithLegacyOn<InputAttributes>): VoidTag<HtmlElementFor<'input'>>;
  ins(attributes: InsAttributes, content?: Content): ContentTag<HtmlElementFor<'ins'>>;
  ins(attributes: WithLegacyOn<InsAttributes>, content?: Content): ContentTag<HtmlElementFor<'ins'>>;
  ins(content?: Content): ContentTag<HtmlElementFor<'ins'>>;
  kbd(attributes: KbdAttributes, content?: Content): ContentTag<HtmlElementFor<'kbd'>>;
  kbd(attributes: WithLegacyOn<KbdAttributes>, content?: Content): ContentTag<HtmlElementFor<'kbd'>>;
  kbd(content?: Content): ContentTag<HtmlElementFor<'kbd'>>;
  label(attributes: LabelAttributes, content?: Content): ContentTag<HtmlElementFor<'label'>>;
  label(attributes: WithLegacyOn<LabelAttributes>, content?: Content): ContentTag<HtmlElementFor<'label'>>;
  label(content?: Content): ContentTag<HtmlElementFor<'label'>>;
  legend(attributes: LegendAttributes, content?: Content): LegendTag;
  legend(attributes: WithLegacyOn<LegendAttributes>, content?: Content): LegendTag;
  legend(content?: Content): LegendTag;
  li(attributes: LiAttributes, content?: Content): LiTag;
  li(attributes: WithLegacyOn<LiAttributes>, content?: Content): LiTag;
  li(content?: Content): LiTag;
  line(attributes: LineAttributes, content?: Content): ContentTag<SvgElementFor<'line'>>;
  line(attributes: WithLegacyOn<LineAttributes>, content?: Content): ContentTag<SvgElementFor<'line'>>;
  line(content?: Content): ContentTag<SvgElementFor<'line'>>;
  linearGradient(attributes: LinearGradientAttributes, content?: Content): ContentTag<SvgElementFor<'linearGradient'>>;
  linearGradient(attributes: WithLegacyOn<LinearGradientAttributes>, content?: Content): ContentTag<SvgElementFor<'linearGradient'>>;
  linearGradient(content?: Content): ContentTag<SvgElementFor<'linearGradient'>>;
  link(attributes?: LinkAttributes): VoidTag<HtmlElementFor<'link'>>;
  link(attributes?: WithLegacyOn<LinkAttributes>): VoidTag<HtmlElementFor<'link'>>;
  maction(attributes: MactionAttributes, content?: Content): ContentTag<MathMLElement>;
  maction(attributes: WithLegacyOn<MactionAttributes>, content?: Content): ContentTag<MathMLElement>;
  maction(content?: Content): ContentTag<MathMLElement>;
  main(attributes: MainAttributes, content?: Content): ContentTag<HtmlElementFor<'main'>>;
  main(attributes: WithLegacyOn<MainAttributes>, content?: Content): ContentTag<HtmlElementFor<'main'>>;
  main(content?: Content): ContentTag<HtmlElementFor<'main'>>;
  map(attributes: MapAttributes, content?: Content): ContentTag<HtmlElementFor<'map'>>;
  map(attributes: WithLegacyOn<MapAttributes>, content?: Content): ContentTag<HtmlElementFor<'map'>>;
  map(content?: Content): ContentTag<HtmlElementFor<'map'>>;
  mark(attributes: MarkAttributes, content?: Content): ContentTag<HtmlElementFor<'mark'>>;
  mark(attributes: WithLegacyOn<MarkAttributes>, content?: Content): ContentTag<HtmlElementFor<'mark'>>;
  mark(content?: Content): ContentTag<HtmlElementFor<'mark'>>;
  marker(attributes: MarkerAttributes, content?: Content): ContentTag<SvgElementFor<'marker'>>;
  marker(attributes: WithLegacyOn<MarkerAttributes>, content?: Content): ContentTag<SvgElementFor<'marker'>>;
  marker(content?: Content): ContentTag<SvgElementFor<'marker'>>;
  mask(attributes: MaskAttributes, content?: Content): ContentTag<SvgElementFor<'mask'>>;
  mask(attributes: WithLegacyOn<MaskAttributes>, content?: Content): ContentTag<SvgElementFor<'mask'>>;
  mask(content?: Content): ContentTag<SvgElementFor<'mask'>>;
  math(attributes: MathAttributes, content?: Content): ContentTag<MathMLElement>;
  math(attributes: WithLegacyOn<MathAttributes>, content?: Content): ContentTag<MathMLElement>;
  math(content?: Content): ContentTag<MathMLElement>;
  menclose(attributes: MencloseAttributes, content?: Content): ContentTag<MathMLElement>;
  menclose(attributes: WithLegacyOn<MencloseAttributes>, content?: Content): ContentTag<MathMLElement>;
  menclose(content?: Content): ContentTag<MathMLElement>;
  menu(attributes: MenuAttributes, content?: MenuContent): MenuTag;
  menu(attributes: WithLegacyOn<MenuAttributes>, content?: MenuContent): MenuTag;
  menu(content?: MenuContent): MenuTag;
  merror(attributes: MerrorAttributes, content?: Content): ContentTag<MathMLElement>;
  merror(attributes: WithLegacyOn<MerrorAttributes>, content?: Content): ContentTag<MathMLElement>;
  merror(content?: Content): ContentTag<MathMLElement>;
  meta(attributes?: MetaAttributes): VoidTag<HtmlElementFor<'meta'>>;
  meta(attributes?: WithLegacyOn<MetaAttributes>): VoidTag<HtmlElementFor<'meta'>>;
  metadata(attributes: MetadataAttributes, content?: Content): ContentTag<SvgElementFor<'metadata'>>;
  metadata(attributes: WithLegacyOn<MetadataAttributes>, content?: Content): ContentTag<SvgElementFor<'metadata'>>;
  metadata(content?: Content): ContentTag<SvgElementFor<'metadata'>>;
  meter(attributes: MeterAttributes, content?: Content): ContentTag<HtmlElementFor<'meter'>>;
  meter(attributes: WithLegacyOn<MeterAttributes>, content?: Content): ContentTag<HtmlElementFor<'meter'>>;
  meter(content?: Content): ContentTag<HtmlElementFor<'meter'>>;
  mfenced(attributes: MfencedAttributes, content?: Content): ContentTag<MathMLElement>;
  mfenced(attributes: WithLegacyOn<MfencedAttributes>, content?: Content): ContentTag<MathMLElement>;
  mfenced(content?: Content): ContentTag<MathMLElement>;
  mfrac(attributes: MfracAttributes, content?: Content): ContentTag<MathMLElement>;
  mfrac(attributes: WithLegacyOn<MfracAttributes>, content?: Content): ContentTag<MathMLElement>;
  mfrac(content?: Content): ContentTag<MathMLElement>;
  mi(attributes: MiAttributes, content?: Content): ContentTag<MathMLElement>;
  mi(attributes: WithLegacyOn<MiAttributes>, content?: Content): ContentTag<MathMLElement>;
  mi(content?: Content): ContentTag<MathMLElement>;
  mmultiscripts(attributes: MmultiscriptsAttributes, content?: Content): ContentTag<MathMLElement>;
  mmultiscripts(attributes: WithLegacyOn<MmultiscriptsAttributes>, content?: Content): ContentTag<MathMLElement>;
  mmultiscripts(content?: Content): ContentTag<MathMLElement>;
  mn(attributes: MnAttributes, content?: Content): ContentTag<MathMLElement>;
  mn(attributes: WithLegacyOn<MnAttributes>, content?: Content): ContentTag<MathMLElement>;
  mn(content?: Content): ContentTag<MathMLElement>;
  mo(attributes: MoAttributes, content?: Content): ContentTag<MathMLElement>;
  mo(attributes: WithLegacyOn<MoAttributes>, content?: Content): ContentTag<MathMLElement>;
  mo(content?: Content): ContentTag<MathMLElement>;
  mover(attributes: MoverAttributes, content?: Content): ContentTag<MathMLElement>;
  mover(attributes: WithLegacyOn<MoverAttributes>, content?: Content): ContentTag<MathMLElement>;
  mover(content?: Content): ContentTag<MathMLElement>;
  mpadded(attributes: MpaddedAttributes, content?: Content): ContentTag<MathMLElement>;
  mpadded(attributes: WithLegacyOn<MpaddedAttributes>, content?: Content): ContentTag<MathMLElement>;
  mpadded(content?: Content): ContentTag<MathMLElement>;
  mpath(attributes: MpathAttributes, content?: Content): ContentTag<SvgElementFor<'mpath'>>;
  mpath(attributes: WithLegacyOn<MpathAttributes>, content?: Content): ContentTag<SvgElementFor<'mpath'>>;
  mpath(content?: Content): ContentTag<SvgElementFor<'mpath'>>;
  mphantom(attributes: MphantomAttributes, content?: Content): ContentTag<MathMLElement>;
  mphantom(attributes: WithLegacyOn<MphantomAttributes>, content?: Content): ContentTag<MathMLElement>;
  mphantom(content?: Content): ContentTag<MathMLElement>;
  mprescripts(attributes: MprescriptsAttributes, content?: Content): ContentTag<MathMLElement>;
  mprescripts(attributes: WithLegacyOn<MprescriptsAttributes>, content?: Content): ContentTag<MathMLElement>;
  mprescripts(content?: Content): ContentTag<MathMLElement>;
  mroot(attributes: MrootAttributes, content?: Content): ContentTag<MathMLElement>;
  mroot(attributes: WithLegacyOn<MrootAttributes>, content?: Content): ContentTag<MathMLElement>;
  mroot(content?: Content): ContentTag<MathMLElement>;
  mrow(attributes: MrowAttributes, content?: Content): ContentTag<MathMLElement>;
  mrow(attributes: WithLegacyOn<MrowAttributes>, content?: Content): ContentTag<MathMLElement>;
  mrow(content?: Content): ContentTag<MathMLElement>;
  ms(attributes: MsAttributes, content?: Content): ContentTag<MathMLElement>;
  ms(attributes: WithLegacyOn<MsAttributes>, content?: Content): ContentTag<MathMLElement>;
  ms(content?: Content): ContentTag<MathMLElement>;
  mspace(attributes: MspaceAttributes, content?: Content): ContentTag<MathMLElement>;
  mspace(attributes: WithLegacyOn<MspaceAttributes>, content?: Content): ContentTag<MathMLElement>;
  mspace(content?: Content): ContentTag<MathMLElement>;
  msqrt(attributes: MsqrtAttributes, content?: Content): ContentTag<MathMLElement>;
  msqrt(attributes: WithLegacyOn<MsqrtAttributes>, content?: Content): ContentTag<MathMLElement>;
  msqrt(content?: Content): ContentTag<MathMLElement>;
  mstyle(attributes: MstyleAttributes, content?: Content): ContentTag<MathMLElement>;
  mstyle(attributes: WithLegacyOn<MstyleAttributes>, content?: Content): ContentTag<MathMLElement>;
  mstyle(content?: Content): ContentTag<MathMLElement>;
  msub(attributes: MsubAttributes, content?: Content): ContentTag<MathMLElement>;
  msub(attributes: WithLegacyOn<MsubAttributes>, content?: Content): ContentTag<MathMLElement>;
  msub(content?: Content): ContentTag<MathMLElement>;
  msubsup(attributes: MsubsupAttributes, content?: Content): ContentTag<MathMLElement>;
  msubsup(attributes: WithLegacyOn<MsubsupAttributes>, content?: Content): ContentTag<MathMLElement>;
  msubsup(content?: Content): ContentTag<MathMLElement>;
  msup(attributes: MsupAttributes, content?: Content): ContentTag<MathMLElement>;
  msup(attributes: WithLegacyOn<MsupAttributes>, content?: Content): ContentTag<MathMLElement>;
  msup(content?: Content): ContentTag<MathMLElement>;
  mtable(attributes: MtableAttributes, content?: Content): ContentTag<MathMLElement>;
  mtable(attributes: WithLegacyOn<MtableAttributes>, content?: Content): ContentTag<MathMLElement>;
  mtable(content?: Content): ContentTag<MathMLElement>;
  mtd(attributes: MtdAttributes, content?: Content): ContentTag<MathMLElement>;
  mtd(attributes: WithLegacyOn<MtdAttributes>, content?: Content): ContentTag<MathMLElement>;
  mtd(content?: Content): ContentTag<MathMLElement>;
  mtext(attributes: MtextAttributes, content?: Content): ContentTag<MathMLElement>;
  mtext(attributes: WithLegacyOn<MtextAttributes>, content?: Content): ContentTag<MathMLElement>;
  mtext(content?: Content): ContentTag<MathMLElement>;
  mtr(attributes: MtrAttributes, content?: Content): ContentTag<MathMLElement>;
  mtr(attributes: WithLegacyOn<MtrAttributes>, content?: Content): ContentTag<MathMLElement>;
  mtr(content?: Content): ContentTag<MathMLElement>;
  munder(attributes: MunderAttributes, content?: Content): ContentTag<MathMLElement>;
  munder(attributes: WithLegacyOn<MunderAttributes>, content?: Content): ContentTag<MathMLElement>;
  munder(content?: Content): ContentTag<MathMLElement>;
  munderover(attributes: MunderoverAttributes, content?: Content): ContentTag<MathMLElement>;
  munderover(attributes: WithLegacyOn<MunderoverAttributes>, content?: Content): ContentTag<MathMLElement>;
  munderover(content?: Content): ContentTag<MathMLElement>;
  nav(attributes: NavAttributes, content?: Content): ContentTag<HtmlElementFor<'nav'>>;
  nav(attributes: WithLegacyOn<NavAttributes>, content?: Content): ContentTag<HtmlElementFor<'nav'>>;
  nav(content?: Content): ContentTag<HtmlElementFor<'nav'>>;
  noscript(attributes: NoscriptAttributes, content?: Content): NoscriptTag;
  noscript(attributes: WithLegacyOn<NoscriptAttributes>, content?: Content): NoscriptTag;
  noscript(content?: Content): NoscriptTag;
  object(attributes: ObjectAttributes, content?: Content): ContentTag<HtmlElementFor<'object'>>;
  object(attributes: WithLegacyOn<ObjectAttributes>, content?: Content): ContentTag<HtmlElementFor<'object'>>;
  object(content?: Content): ContentTag<HtmlElementFor<'object'>>;
  ol(attributes: OlAttributes, content?: OlContent): OlTag;
  ol(attributes: WithLegacyOn<OlAttributes>, content?: OlContent): OlTag;
  ol(content?: OlContent): OlTag;
  optgroup(attributes: OptgroupAttributes, content?: OptgroupContent): OptgroupTag;
  optgroup(attributes: WithLegacyOn<OptgroupAttributes>, content?: OptgroupContent): OptgroupTag;
  optgroup(content?: OptgroupContent): OptgroupTag;
  option(attributes: OptionAttributes, content?: Content): OptionTag;
  option(attributes: WithLegacyOn<OptionAttributes>, content?: Content): OptionTag;
  option(content?: Content): OptionTag;
  output(attributes: OutputAttributes, content?: Content): ContentTag<HtmlElementFor<'output'>>;
  output(attributes: WithLegacyOn<OutputAttributes>, content?: Content): ContentTag<HtmlElementFor<'output'>>;
  output(content?: Content): ContentTag<HtmlElementFor<'output'>>;
  p(attributes: PAttributes, content?: Content): PTag;
  p(attributes: WithLegacyOn<PAttributes>, content?: Content): PTag;
  p(content?: Content): PTag;
  path(attributes: PathAttributes, content?: Content): ContentTag<SvgElementFor<'path'>>;
  path(attributes: WithLegacyOn<PathAttributes>, content?: Content): ContentTag<SvgElementFor<'path'>>;
  path(content?: Content): ContentTag<SvgElementFor<'path'>>;
  pattern(attributes: PatternAttributes, content?: Content): ContentTag<SvgElementFor<'pattern'>>;
  pattern(attributes: WithLegacyOn<PatternAttributes>, content?: Content): ContentTag<SvgElementFor<'pattern'>>;
  pattern(content?: Content): ContentTag<SvgElementFor<'pattern'>>;
  picture(attributes: PictureAttributes, content?: PictureContent): PictureTag;
  picture(attributes: WithLegacyOn<PictureAttributes>, content?: PictureContent): PictureTag;
  picture(content?: PictureContent): PictureTag;
  polygon(attributes: PolygonAttributes, content?: Content): ContentTag<SvgElementFor<'polygon'>>;
  polygon(attributes: WithLegacyOn<PolygonAttributes>, content?: Content): ContentTag<SvgElementFor<'polygon'>>;
  polygon(content?: Content): ContentTag<SvgElementFor<'polygon'>>;
  polyline(attributes: PolylineAttributes, content?: Content): ContentTag<SvgElementFor<'polyline'>>;
  polyline(attributes: WithLegacyOn<PolylineAttributes>, content?: Content): ContentTag<SvgElementFor<'polyline'>>;
  polyline(content?: Content): ContentTag<SvgElementFor<'polyline'>>;
  pre(attributes: PreAttributes, content?: Content): ContentTag<HtmlElementFor<'pre'>>;
  pre(attributes: WithLegacyOn<PreAttributes>, content?: Content): ContentTag<HtmlElementFor<'pre'>>;
  pre(content?: Content): ContentTag<HtmlElementFor<'pre'>>;
  progress(attributes: ProgressAttributes, content?: Content): ContentTag<HtmlElementFor<'progress'>>;
  progress(attributes: WithLegacyOn<ProgressAttributes>, content?: Content): ContentTag<HtmlElementFor<'progress'>>;
  progress(content?: Content): ContentTag<HtmlElementFor<'progress'>>;
  q(attributes: QAttributes, content?: Content): ContentTag<HtmlElementFor<'q'>>;
  q(attributes: WithLegacyOn<QAttributes>, content?: Content): ContentTag<HtmlElementFor<'q'>>;
  q(content?: Content): ContentTag<HtmlElementFor<'q'>>;
  radialGradient(attributes: RadialGradientAttributes, content?: Content): ContentTag<SvgElementFor<'radialGradient'>>;
  radialGradient(attributes: WithLegacyOn<RadialGradientAttributes>, content?: Content): ContentTag<SvgElementFor<'radialGradient'>>;
  radialGradient(content?: Content): ContentTag<SvgElementFor<'radialGradient'>>;
  rect(attributes: RectAttributes, content?: Content): ContentTag<SvgElementFor<'rect'>>;
  rect(attributes: WithLegacyOn<RectAttributes>, content?: Content): ContentTag<SvgElementFor<'rect'>>;
  rect(content?: Content): ContentTag<SvgElementFor<'rect'>>;
  rp(attributes: RpAttributes, content?: Content): ContentTag<HtmlElementFor<'rp'>>;
  rp(attributes: WithLegacyOn<RpAttributes>, content?: Content): ContentTag<HtmlElementFor<'rp'>>;
  rp(content?: Content): ContentTag<HtmlElementFor<'rp'>>;
  rt(attributes: RtAttributes, content?: Content): ContentTag<HtmlElementFor<'rt'>>;
  rt(attributes: WithLegacyOn<RtAttributes>, content?: Content): ContentTag<HtmlElementFor<'rt'>>;
  rt(content?: Content): ContentTag<HtmlElementFor<'rt'>>;
  ruby(attributes: RubyAttributes, content?: Content): ContentTag<HtmlElementFor<'ruby'>>;
  ruby(attributes: WithLegacyOn<RubyAttributes>, content?: Content): ContentTag<HtmlElementFor<'ruby'>>;
  ruby(content?: Content): ContentTag<HtmlElementFor<'ruby'>>;
  s(attributes: SAttributes, content?: Content): ContentTag<HtmlElementFor<'s'>>;
  s(attributes: WithLegacyOn<SAttributes>, content?: Content): ContentTag<HtmlElementFor<'s'>>;
  s(content?: Content): ContentTag<HtmlElementFor<'s'>>;
  samp(attributes: SampAttributes, content?: Content): ContentTag<HtmlElementFor<'samp'>>;
  samp(attributes: WithLegacyOn<SampAttributes>, content?: Content): ContentTag<HtmlElementFor<'samp'>>;
  samp(content?: Content): ContentTag<HtmlElementFor<'samp'>>;
  script(attributes: ScriptAttributes, content?: Content): ScriptTag;
  script(attributes: WithLegacyOn<ScriptAttributes>, content?: Content): ScriptTag;
  script(content?: Content): ScriptTag;
  search(attributes: SearchAttributes, content?: Content): ContentTag<HtmlElementFor<'search'>>;
  search(attributes: WithLegacyOn<SearchAttributes>, content?: Content): ContentTag<HtmlElementFor<'search'>>;
  search(content?: Content): ContentTag<HtmlElementFor<'search'>>;
  section(attributes: SectionAttributes, content?: Content): ContentTag<HtmlElementFor<'section'>>;
  section(attributes: WithLegacyOn<SectionAttributes>, content?: Content): ContentTag<HtmlElementFor<'section'>>;
  section(content?: Content): ContentTag<HtmlElementFor<'section'>>;
  select(attributes: SelectAttributes, content?: SelectContent): SelectTag;
  select(attributes: WithLegacyOn<SelectAttributes>, content?: SelectContent): SelectTag;
  select(content?: SelectContent): SelectTag;
  selectedcontent(attributes?: SelectedcontentAttributes): VoidTag<HtmlElementFor<'selectedcontent'>>;
  selectedcontent(attributes?: WithLegacyOn<SelectedcontentAttributes>): VoidTag<HtmlElementFor<'selectedcontent'>>;
  semantics(attributes: SemanticsAttributes, content?: Content): ContentTag<MathMLElement>;
  semantics(attributes: WithLegacyOn<SemanticsAttributes>, content?: Content): ContentTag<MathMLElement>;
  semantics(content?: Content): ContentTag<MathMLElement>;
  set(attributes: SetAttributes, content?: Content): ContentTag<SvgElementFor<'set'>>;
  set(attributes: WithLegacyOn<SetAttributes>, content?: Content): ContentTag<SvgElementFor<'set'>>;
  set(content?: Content): ContentTag<SvgElementFor<'set'>>;
  slot(attributes: SlotAttributes, content?: Content): ContentTag<HtmlElementFor<'slot'>>;
  slot(attributes: WithLegacyOn<SlotAttributes>, content?: Content): ContentTag<HtmlElementFor<'slot'>>;
  slot(content?: Content): ContentTag<HtmlElementFor<'slot'>>;
  small(attributes: SmallAttributes, content?: Content): ContentTag<HtmlElementFor<'small'>>;
  small(attributes: WithLegacyOn<SmallAttributes>, content?: Content): ContentTag<HtmlElementFor<'small'>>;
  small(content?: Content): ContentTag<HtmlElementFor<'small'>>;
  source(attributes?: SourceAttributes): SourceTag;
  source(attributes?: WithLegacyOn<SourceAttributes>): SourceTag;
  span(attributes: SpanAttributes, content?: Content): ContentTag<HtmlElementFor<'span'>>;
  span(attributes: WithLegacyOn<SpanAttributes>, content?: Content): ContentTag<HtmlElementFor<'span'>>;
  span(content?: Content): ContentTag<HtmlElementFor<'span'>>;
  stop(attributes: StopAttributes, content?: Content): ContentTag<SvgElementFor<'stop'>>;
  stop(attributes: WithLegacyOn<StopAttributes>, content?: Content): ContentTag<SvgElementFor<'stop'>>;
  stop(content?: Content): ContentTag<SvgElementFor<'stop'>>;
  strong(attributes: StrongAttributes, content?: Content): ContentTag<HtmlElementFor<'strong'>>;
  strong(attributes: WithLegacyOn<StrongAttributes>, content?: Content): ContentTag<HtmlElementFor<'strong'>>;
  strong(content?: Content): ContentTag<HtmlElementFor<'strong'>>;
  style(attributes: StyleAttributes, content?: Content): ContentTag<HtmlElementFor<'style'> | SvgElementFor<'style'>>;
  style(attributes: WithLegacyOn<StyleAttributes>, content?: Content): ContentTag<HtmlElementFor<'style'> | SvgElementFor<'style'>>;
  style(content?: Content): ContentTag<HtmlElementFor<'style'> | SvgElementFor<'style'>>;
  sub(attributes: SubAttributes, content?: Content): ContentTag<HtmlElementFor<'sub'>>;
  sub(attributes: WithLegacyOn<SubAttributes>, content?: Content): ContentTag<HtmlElementFor<'sub'>>;
  sub(content?: Content): ContentTag<HtmlElementFor<'sub'>>;
  summary(attributes: SummaryAttributes, content?: Content): ContentTag<HtmlElementFor<'summary'>>;
  summary(attributes: WithLegacyOn<SummaryAttributes>, content?: Content): ContentTag<HtmlElementFor<'summary'>>;
  summary(content?: Content): ContentTag<HtmlElementFor<'summary'>>;
  sup(attributes: SupAttributes, content?: Content): ContentTag<HtmlElementFor<'sup'>>;
  sup(attributes: WithLegacyOn<SupAttributes>, content?: Content): ContentTag<HtmlElementFor<'sup'>>;
  sup(content?: Content): ContentTag<HtmlElementFor<'sup'>>;
  svg(attributes: SvgAttributes, content?: Content): ContentTag<SvgElementFor<'svg'>>;
  svg(attributes: WithLegacyOn<SvgAttributes>, content?: Content): ContentTag<SvgElementFor<'svg'>>;
  svg(content?: Content): ContentTag<SvgElementFor<'svg'>>;
  switch(attributes: SwitchAttributes, content?: Content): ContentTag<SvgElementFor<'switch'>>;
  switch(attributes: WithLegacyOn<SwitchAttributes>, content?: Content): ContentTag<SvgElementFor<'switch'>>;
  switch(content?: Content): ContentTag<SvgElementFor<'switch'>>;
  symbol(attributes: SymbolAttributes, content?: Content): ContentTag<SvgElementFor<'symbol'>>;
  symbol(attributes: WithLegacyOn<SymbolAttributes>, content?: Content): ContentTag<SvgElementFor<'symbol'>>;
  symbol(content?: Content): ContentTag<SvgElementFor<'symbol'>>;
  table(attributes: TableAttributes, content?: TableContent): TableTag;
  table(attributes: WithLegacyOn<TableAttributes>, content?: TableContent): TableTag;
  table(content?: TableContent): TableTag;
  tbody(attributes: TbodyAttributes, content?: TbodyContent): TbodyTag;
  tbody(attributes: WithLegacyOn<TbodyAttributes>, content?: TbodyContent): TbodyTag;
  tbody(content?: TbodyContent): TbodyTag;
  td(attributes: TdAttributes, content?: Content): TdTag;
  td(attributes: WithLegacyOn<TdAttributes>, content?: Content): TdTag;
  td(content?: Content): TdTag;
  template(attributes: TemplateAttributes, content?: Content): TemplateTag;
  template(attributes: WithLegacyOn<TemplateAttributes>, content?: Content): TemplateTag;
  template(content?: Content): TemplateTag;
  text(attributes: TextAttributes, content?: Content): ContentTag<SvgElementFor<'text'>>;
  text(attributes: WithLegacyOn<TextAttributes>, content?: Content): ContentTag<SvgElementFor<'text'>>;
  text(content?: Content): ContentTag<SvgElementFor<'text'>>;
  textarea(attributes: TextareaAttributes, content?: Content): ContentTag<HtmlElementFor<'textarea'>>;
  textarea(attributes: WithLegacyOn<TextareaAttributes>, content?: Content): ContentTag<HtmlElementFor<'textarea'>>;
  textarea(content?: Content): ContentTag<HtmlElementFor<'textarea'>>;
  textPath(attributes: TextPathAttributes, content?: Content): ContentTag<SvgElementFor<'textPath'>>;
  textPath(attributes: WithLegacyOn<TextPathAttributes>, content?: Content): ContentTag<SvgElementFor<'textPath'>>;
  textPath(content?: Content): ContentTag<SvgElementFor<'textPath'>>;
  tfoot(attributes: TfootAttributes, content?: TfootContent): TfootTag;
  tfoot(attributes: WithLegacyOn<TfootAttributes>, content?: TfootContent): TfootTag;
  tfoot(content?: TfootContent): TfootTag;
  th(attributes: ThAttributes, content?: Content): ThTag;
  th(attributes: WithLegacyOn<ThAttributes>, content?: Content): ThTag;
  th(content?: Content): ThTag;
  thead(attributes: TheadAttributes, content?: TheadContent): TheadTag;
  thead(attributes: WithLegacyOn<TheadAttributes>, content?: TheadContent): TheadTag;
  thead(content?: TheadContent): TheadTag;
  time(attributes: TimeAttributes, content?: Content): ContentTag<HtmlElementFor<'time'>>;
  time(attributes: WithLegacyOn<TimeAttributes>, content?: Content): ContentTag<HtmlElementFor<'time'>>;
  time(content?: Content): ContentTag<HtmlElementFor<'time'>>;
  title(attributes: TitleAttributes, content?: Content): ContentTag<HtmlElementFor<'title'> | SvgElementFor<'title'>>;
  title(attributes: WithLegacyOn<TitleAttributes>, content?: Content): ContentTag<HtmlElementFor<'title'> | SvgElementFor<'title'>>;
  title(content?: Content): ContentTag<HtmlElementFor<'title'> | SvgElementFor<'title'>>;
  tr(attributes: TrAttributes, content?: TrContent): TrTag;
  tr(attributes: WithLegacyOn<TrAttributes>, content?: TrContent): TrTag;
  tr(content?: TrContent): TrTag;
  track(attributes?: TrackAttributes): VoidTag<HtmlElementFor<'track'>>;
  track(attributes?: WithLegacyOn<TrackAttributes>): VoidTag<HtmlElementFor<'track'>>;
  tspan(attributes: TspanAttributes, content?: Content): ContentTag<SvgElementFor<'tspan'>>;
  tspan(attributes: WithLegacyOn<TspanAttributes>, content?: Content): ContentTag<SvgElementFor<'tspan'>>;
  tspan(content?: Content): ContentTag<SvgElementFor<'tspan'>>;
  u(attributes: UAttributes, content?: Content): ContentTag<HtmlElementFor<'u'>>;
  u(attributes: WithLegacyOn<UAttributes>, content?: Content): ContentTag<HtmlElementFor<'u'>>;
  u(content?: Content): ContentTag<HtmlElementFor<'u'>>;
  ul(attributes: UlAttributes, content?: UlContent): UlTag;
  ul(attributes: WithLegacyOn<UlAttributes>, content?: UlContent): UlTag;
  ul(content?: UlContent): UlTag;
  use(attributes: UseAttributes, content?: Content): ContentTag<SvgElementFor<'use'>>;
  use(attributes: WithLegacyOn<UseAttributes>, content?: Content): ContentTag<SvgElementFor<'use'>>;
  use(content?: Content): ContentTag<SvgElementFor<'use'>>;
  var(attributes: VarAttributes, content?: Content): ContentTag<HtmlElementFor<'var'>>;
  var(attributes: WithLegacyOn<VarAttributes>, content?: Content): ContentTag<HtmlElementFor<'var'>>;
  var(content?: Content): ContentTag<HtmlElementFor<'var'>>;
  video(attributes: VideoAttributes, content?: Content): ContentTag<HtmlElementFor<'video'>>;
  video(attributes: WithLegacyOn<VideoAttributes>, content?: Content): ContentTag<HtmlElementFor<'video'>>;
  video(content?: Content): ContentTag<HtmlElementFor<'video'>>;
  view(attributes: ViewAttributes, content?: Content): ContentTag<SvgElementFor<'view'>>;
  view(attributes: WithLegacyOn<ViewAttributes>, content?: Content): ContentTag<SvgElementFor<'view'>>;
  view(content?: Content): ContentTag<SvgElementFor<'view'>>;
  wbr(attributes?: WbrAttributes): VoidTag<HtmlElementFor<'wbr'>>;
  wbr(attributes?: WithLegacyOn<WbrAttributes>): VoidTag<HtmlElementFor<'wbr'>>;
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
 * Immediately applies pending reactive updates, including DOM bindings and user effects.
 * Processes the shared queue, including further updates queued synchronously by effects.
 * Does not wait for promises, lifecycle observers, browser painting, or animations.
 * During a reactive callback or renderForHydration it does nothing.
 * Errors from effect reruns are reported on a microtask, as with automatic updates.
 * @example
 * rotation.set(0);
 * applyPendingReactiveUpdates();
 * element.getBoundingClientRect();
 */
export function applyPendingReactiveUpdates(): void;

/**
 * Signal changes automatically batch effect reruns in a microtask.
 * Call applyPendingReactiveUpdates() when pending reruns must finish before the next line.
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
 * Registers component functions and hydrates their server-rendered instances in the page.
 * Kensington finds every matching component rendered by `renderForHydration` and mounts it
 * reactively. Registrations last for the document's lifetime and share one observer.
 * Duplicate names warn and are ignored, preserving their original function, context, and nonce.
 * New names in the same call still register. Returns nothing.
 *
 * Pass `options.context` to supply a non-serialized runtime bag to every component.
 * The bag is forwarded as the second argument to each component function. Use it for
 * transport handles, identity, signals, and anything else that cannot round-trip through
 * JSON. Construct a matching bag on the server side and pass it to `renderForHydration`.
 * Under a strict Content Security Policy, pass `options.nonce` so Kensington can authorize
 * the transient style element that suppresses transitions during hydration.
 *
 * @example
 * import { registerComponents } from 'kensington';
 * registerComponents({ counter, userCard }, { context: clientEnv });
 */
export function registerComponents(
  components: Record<string, (state: any, context?: any) => ContentTag | ContentTag[] | null>,
  options?: { context?: unknown; nonce?: string }
): void;

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


