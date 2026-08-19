import type * as csstype from 'csstype';

/**
 * Returned by content element methods (div, p, span, …).
 * Call `.toString()` to get the HTML string, or `.toElement()` to create a live DOM node.
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
  [key: `${"data" | "aria"}${string}`]: string | object
}

type ElementInterface<Tag extends string> =
  Tag extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[Tag] :
  Tag extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[Tag] :
  HTMLElement;
type ElementProps<ElementType> = {
  [K in keyof ElementType]?: ElementType[K]
} & { [key: string]: unknown };
type PropFor<Tag extends string> = ElementProps<ElementInterface<Tag>>;
type ContextualPropFor<Tag extends string> =
  | (Tag extends keyof HTMLElementTagNameMap ? ElementProps<HTMLElementTagNameMap[Tag]> : never)
  | (Tag extends keyof SVGElementTagNameMap ? ElementProps<SVGElementTagNameMap[Tag]> : never);

export type GlobalAttributes = {
  accesskey?: string;
  autocapitalize?: "on" | "off" | "none" | "sentences" | "words" | "characters";
  autocorrect?: "on" | "off";
  autofocus?: boolean;
  class?: string | string[];
  contenteditable?: "true" | "false" | "plaintext-only";
  dir?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  draggable?: "true" | "false";
  enterkeyhint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  headingoffset?: number | `${number}`;
  headingreset?: boolean;
  hidden?: "until-found" | "hidden";
  id?: string;
  inert?: boolean;
  inputmode?: "none" | "text" | "tel" | "email" | "url" | "numeric" | "decimal" | "search";
  is?: string;
  itemid?: string;
  itemprop?: string;
  itemref?: string;
  itemscope?: boolean;
  itemtype?: string;
  lang?: string;
  nonce?: string;
  popover?: "auto" | "manual" | "hint";
  role?: string;
  slot?: string;
  spellcheck?: "true" | "false";
  style?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  tabindex?: number | `${number}`;
  title?: string;
  translate?: "yes" | "no";
  writingsuggestions?: "true" | "false";
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
  on?: Record<string, (event: Event) => void>;
}
type SvgGlobalAttributes = {
  'autofocus'?: boolean;
  'class'?: string | string[];
  'id'?: string;
  'lang'?: string;
  'role'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
  'xml:base'?: string;
  'xml:lang'?: string;
  'xml:space'?: "default" | "preserve";
}

type SvgGlobalEvents = {
  'ondragexit'?: string | ((event: Event) => void);
  'onshow'?: string | ((event: Event) => void);
}

type SvgConditionalAttributes = {
  'requiredExtensions'?: string;
  'systemLanguage'?: string;
}

type SvgXLinkAttributes = {
  'xlink:href'?: string;
  'xlink:title'?: string;
}

type SvgPresentationAttributes = {
  'alignment-baseline'?: "baseline" | "text-bottom" | "alphabetic" | "ideographic" | "middle" | "central" | "mathematical" | "hanging" | "text-top";
  'alignmentBaseline'?: "baseline" | "text-bottom" | "alphabetic" | "ideographic" | "middle" | "central" | "mathematical" | "hanging" | "text-top";
  'baseline-shift'?: number | string;
  'baselineShift'?: number | string;
  'clip-path'?: string;
  'clipPath'?: string;
  'clip-rule'?: "nonzero" | "evenodd";
  'clipRule'?: "nonzero" | "evenodd";
  'color'?: string;
  'color-interpolation'?: "auto" | "sRGB" | "linearRGB";
  'colorInterpolation'?: "auto" | "sRGB" | "linearRGB";
  'color-interpolation-filters'?: "auto" | "sRGB" | "linearRGB";
  'colorInterpolationFilters'?: "auto" | "sRGB" | "linearRGB";
  'cursor'?: string;
  'direction'?: "ltr" | "rtl";
  'display'?: string;
  'dominant-baseline'?: "auto" | "text-bottom" | "alphabetic" | "ideographic" | "middle" | "central" | "mathematical" | "hanging" | "text-top";
  'dominantBaseline'?: "auto" | "text-bottom" | "alphabetic" | "ideographic" | "middle" | "central" | "mathematical" | "hanging" | "text-top";
  'fill'?: string;
  'fill-opacity'?: number | string;
  'fillOpacity'?: number | string;
  'fill-rule'?: "nonzero" | "evenodd";
  'fillRule'?: "nonzero" | "evenodd";
  'filter'?: string;
  'flood-color'?: string;
  'floodColor'?: string;
  'flood-opacity'?: number | string;
  'floodOpacity'?: number | string;
  'font-family'?: string;
  'fontFamily'?: string;
  'font-size'?: number | string;
  'fontSize'?: number | string;
  'font-size-adjust'?: number | string;
  'fontSizeAdjust'?: number | string;
  'font-stretch'?: number | string;
  'fontStretch'?: number | string;
  'font-style'?: string;
  'fontStyle'?: string;
  'font-variant'?: string;
  'fontVariant'?: string;
  'font-weight'?: number | string;
  'fontWeight'?: number | string;
  'glyph-orientation-vertical'?: string;
  'glyphOrientationVertical'?: string;
  'image-rendering'?: "auto" | "smooth" | "high-quality" | "pixelated" | "crisp-edges";
  'imageRendering'?: "auto" | "smooth" | "high-quality" | "pixelated" | "crisp-edges";
  'letter-spacing'?: number | string;
  'letterSpacing'?: number | string;
  'lighting-color'?: string;
  'lightingColor'?: string;
  'marker-end'?: string;
  'markerEnd'?: string;
  'marker-mid'?: string;
  'markerMid'?: string;
  'marker-start'?: string;
  'markerStart'?: string;
  'mask'?: string;
  'mask-type'?: "luminance" | "alpha";
  'maskType'?: "luminance" | "alpha";
  'opacity'?: number | string;
  'overflow'?: "visible" | "hidden" | "clip" | "scroll" | "auto";
  'paint-order'?: "normal" | "fill" | "stroke" | "markers";
  'paintOrder'?: "normal" | "fill" | "stroke" | "markers";
  'pointer-events'?: "auto" | "bounding-box" | "visiblePainted" | "visibleFill" | "visibleStroke" | "visible" | "painted" | "fill" | "stroke" | "all" | "none";
  'pointerEvents'?: "auto" | "bounding-box" | "visiblePainted" | "visibleFill" | "visibleStroke" | "visible" | "painted" | "fill" | "stroke" | "all" | "none";
  'shape-rendering'?: "auto" | "optimizeSpeed" | "crispEdges" | "geometricPrecision";
  'shapeRendering'?: "auto" | "optimizeSpeed" | "crispEdges" | "geometricPrecision";
  'stop-color'?: string;
  'stopColor'?: string;
  'stop-opacity'?: number | string;
  'stopOpacity'?: number | string;
  'stroke'?: string;
  'stroke-dasharray'?: number | string;
  'strokeDasharray'?: number | string;
  'stroke-dashoffset'?: number | string;
  'strokeDashoffset'?: number | string;
  'stroke-linecap'?: "butt" | "round" | "square";
  'strokeLinecap'?: "butt" | "round" | "square";
  'stroke-linejoin'?: "crop" | "arcs" | "miter" | "bevel" | "round" | "fallback";
  'strokeLinejoin'?: "crop" | "arcs" | "miter" | "bevel" | "round" | "fallback";
  'stroke-miterlimit'?: number | string;
  'strokeMiterlimit'?: number | string;
  'stroke-opacity'?: number | string;
  'strokeOpacity'?: number | string;
  'stroke-width'?: number | string;
  'strokeWidth'?: number | string;
  'text-anchor'?: "start" | "middle" | "end";
  'textAnchor'?: "start" | "middle" | "end";
  'text-decoration'?: string;
  'textDecoration'?: string;
  'text-overflow'?: string;
  'textOverflow'?: string;
  'text-rendering'?: "auto" | "optimizeSpeed" | "optimizeLegibility" | "geometricPrecision";
  'textRendering'?: "auto" | "optimizeSpeed" | "optimizeLegibility" | "geometricPrecision";
  'transform'?: string;
  'transform-origin'?: number | string;
  'transformOrigin'?: number | string;
  'unicode-bidi'?: "normal" | "embed" | "isolate" | "bidi-override" | "isolate-override" | "plaintext";
  'unicodeBidi'?: "normal" | "embed" | "isolate" | "bidi-override" | "isolate-override" | "plaintext";
  'vector-effect'?: "none" | "non-scaling-stroke" | "non-scaling-size" | "non-rotation" | "fixed-position";
  'vectorEffect'?: "none" | "non-scaling-stroke" | "non-scaling-size" | "non-rotation" | "fixed-position";
  'visibility'?: "visible" | "hidden" | "force-hidden" | "collapse";
  'white-space'?: "normal" | "pre" | "pre-wrap" | "pre-line" | "collapse" | "discard" | "preserve" | "preserve-breaks" | "preserve-spaces" | "break-spaces" | "wrap" | "nowrap" | "none" | "discard-before" | "discard-after" | "discard-inner";
  'whiteSpace'?: "normal" | "pre" | "pre-wrap" | "pre-line" | "collapse" | "discard" | "preserve" | "preserve-breaks" | "preserve-spaces" | "break-spaces" | "wrap" | "nowrap" | "none" | "discard-before" | "discard-after" | "discard-inner";
  'word-spacing'?: number | string;
  'wordSpacing'?: number | string;
  'writing-mode'?: "horizontal-tb" | "vertical-rl" | "vertical-lr" | "sideways-rl" | "sideways-lr";
  'writingMode'?: "horizontal-tb" | "vertical-rl" | "vertical-lr" | "sideways-rl" | "sideways-lr";
}

type AAttributes = {
  prop?: ContextualPropFor<'a'> | null;
  'download'?: string;
  'href'?: string;
  'hreflang'?: string;
  'ping'?: string;
  'referrerpolicy'?: string;
  'rel'?: string;
  'target'?: string;
  'type'?: string;
} & SvgPresentationAttributes & SvgConditionalAttributes & SvgXLinkAttributes & NameSpaceAttributes & GlobalAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type AbbrAttributes = { prop?: PropFor<'abbr'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AddressAttributes = { prop?: PropFor<'address'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AnimateAttributes = {
  prop?: PropFor<'animate'> | null;
  'accumulate'?: "none" | "sum";
  'additive'?: "replace" | "sum";
  'attributeName'?: string;
  'begin'?: string;
  'by'?: string;
  'calcMode'?: "discrete" | "linear" | "paced" | "spline";
  'dur'?: string;
  'end'?: string;
  'fill'?: "remove" | "freeze";
  'from'?: string;
  'href'?: string;
  'keySplines'?: string;
  'keyTimes'?: string;
  'max'?: string;
  'min'?: string;
  'onbegin'?: string | ((event: Event) => void);
  'onend'?: string | ((event: Event) => void);
  'onrepeat'?: string | ((event: Event) => void);
  'repeatCount'?: string;
  'repeatDur'?: string;
  'restart'?: "always" | "never" | "whenNotActive";
  'to'?: string;
  'values'?: string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type AnimateMotionAttributes = {
  prop?: PropFor<'animateMotion'> | null;
  'accumulate'?: "none" | "sum";
  'additive'?: "replace" | "sum";
  'begin'?: string;
  'by'?: string;
  'calcMode'?: "discrete" | "linear" | "paced" | "spline";
  'dur'?: string;
  'end'?: string;
  'fill'?: "remove" | "freeze";
  'from'?: string;
  'href'?: string;
  'keyPoints'?: string;
  'keySplines'?: string;
  'keyTimes'?: string;
  'max'?: string;
  'min'?: string;
  'onbegin'?: string | ((event: Event) => void);
  'onend'?: string | ((event: Event) => void);
  'onrepeat'?: string | ((event: Event) => void);
  'origin'?: string;
  'path'?: string;
  'repeatCount'?: string;
  'repeatDur'?: string;
  'restart'?: "always" | "never" | "whenNotActive";
  'rotate'?: string;
  'to'?: string;
  'values'?: string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type AnimateTransformAttributes = {
  prop?: PropFor<'animateTransform'> | null;
  'accumulate'?: "none" | "sum";
  'additive'?: "replace" | "sum";
  'attributeName'?: string;
  'begin'?: string;
  'by'?: string;
  'calcMode'?: "discrete" | "linear" | "paced" | "spline";
  'dur'?: string;
  'end'?: string;
  'fill'?: "remove" | "freeze";
  'from'?: string;
  'href'?: string;
  'keySplines'?: string;
  'keyTimes'?: string;
  'max'?: string;
  'min'?: string;
  'onbegin'?: string | ((event: Event) => void);
  'onend'?: string | ((event: Event) => void);
  'onrepeat'?: string | ((event: Event) => void);
  'repeatCount'?: string;
  'repeatDur'?: string;
  'restart'?: "always" | "never" | "whenNotActive";
  'to'?: string;
  'type'?: "translate" | "scale" | "rotate" | "skewX" | "skewY";
  'values'?: string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type AnnotationAttributes = {
  prop?: PropFor<'annotation'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type AnnotationXmlAttributes = {
  prop?: PropFor<'annotation-xml'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'encoding'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type AreaAttributes = {
  prop?: PropFor<'area'> | null;
  'alt'?: string;
  'coords'?: string;
  'download'?: string;
  'href'?: string;
  'ping'?: string;
  'referrerpolicy'?: string;
  'rel'?: string;
  'shape'?: "circle" | "CIRCLE" | "default" | "DEFAULT" | "poly" | "POLY" | "rect" | "RECT";
  'target'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ArticleAttributes = { prop?: PropFor<'article'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AsideAttributes = { prop?: PropFor<'aside'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AudioAttributes = {
  prop?: PropFor<'audio'> | null;
  'autoplay'?: boolean;
  'controls'?: boolean;
  'crossorigin'?: "anonymous" | "use-credentials";
  'loading'?: "lazy" | "eager";
  'loop'?: boolean;
  'muted'?: boolean;
  'preload'?: "none" | "metadata" | "auto";
  'src'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BAttributes = { prop?: PropFor<'b'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BaseAttributes = {
  prop?: PropFor<'base'> | null;
  'href'?: string;
  'target'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BdiAttributes = { prop?: PropFor<'bdi'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BdoAttributes = { prop?: PropFor<'bdo'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BlockquoteAttributes = {
  prop?: PropFor<'blockquote'> | null;
  'cite'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BodyAttributes = {
  prop?: PropFor<'body'> | null;
  'onafterprint'?: string | ((event: Event) => void);
  'onbeforeprint'?: string | ((event: Event) => void);
  'onbeforeunload'?: string | ((event: Event) => void);
  'onhashchange'?: string | ((event: Event) => void);
  'onlanguagechange'?: string | ((event: Event) => void);
  'onmessage'?: string | ((event: Event) => void);
  'onmessageerror'?: string | ((event: Event) => void);
  'onoffline'?: string | ((event: Event) => void);
  'ononline'?: string | ((event: Event) => void);
  'onpagehide'?: string | ((event: Event) => void);
  'onpagereveal'?: string | ((event: Event) => void);
  'onpageshow'?: string | ((event: Event) => void);
  'onpageswap'?: string | ((event: Event) => void);
  'onpopstate'?: string | ((event: Event) => void);
  'onrejectionhandled'?: string | ((event: Event) => void);
  'onstorage'?: string | ((event: Event) => void);
  'onunhandledrejection'?: string | ((event: Event) => void);
  'onunload'?: string | ((event: Event) => void);
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BrAttributes = { prop?: PropFor<'br'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ButtonAttributes = {
  prop?: PropFor<'button'> | null;
  'command'?: string;
  'commandfor'?: string;
  'disabled'?: boolean;
  'form'?: string;
  'formaction'?: string;
  'formenctype'?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
  'formmethod'?: "get" | "GET" | "post" | "POST" | "dialog" | "DIALOG";
  'formnovalidate'?: boolean;
  'formtarget'?: string;
  'name'?: string;
  'popovertarget'?: string;
  'popovertargetaction'?: "toggle" | "show" | "hide";
  'type'?: "submit" | "SUBMIT" | "reset" | "RESET" | "button" | "BUTTON";
  'value'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type CanvasAttributes = {
  prop?: PropFor<'canvas'> | null;
  'height'?: number | `${number}`;
  'width'?: number | `${number}`;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type CaptionAttributes = { prop?: PropFor<'caption'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type CircleAttributes = {
  prop?: PropFor<'circle'> | null;
  'cx'?: number | string;
  'cy'?: number | string;
  'pathLength'?: number | `${number}`;
  'r'?: number | string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type CiteAttributes = { prop?: PropFor<'cite'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ClipPathAttributes = {
  prop?: PropFor<'clipPath'> | null;
  'externalResourcesRequired'?: "true" | "false";
  'requiredFeatures'?: string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type CodeAttributes = { prop?: PropFor<'code'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ColAttributes = {
  prop?: PropFor<'col'> | null;
  'span'?: number | `${number}`;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ColgroupAttributes = {
  prop?: PropFor<'colgroup'> | null;
  'span'?: number | `${number}`;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DataAttributes = {
  prop?: PropFor<'data'> | null;
  'value'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DatalistAttributes = { prop?: PropFor<'datalist'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DdAttributes = { prop?: PropFor<'dd'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DefsAttributes = { prop?: PropFor<'defs'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type DelAttributes = {
  prop?: PropFor<'del'> | null;
  'cite'?: string;
  'datetime'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DescAttributes = { prop?: PropFor<'desc'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type DetailsAttributes = {
  prop?: PropFor<'details'> | null;
  'name'?: string;
  'open'?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DfnAttributes = { prop?: PropFor<'dfn'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DialogAttributes = {
  prop?: PropFor<'dialog'> | null;
  'open'?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DivAttributes = { prop?: PropFor<'div'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DlAttributes = { prop?: PropFor<'dl'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DtAttributes = { prop?: PropFor<'dt'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type EllipseAttributes = {
  prop?: PropFor<'ellipse'> | null;
  'cx'?: number | string;
  'cy'?: number | string;
  'pathLength'?: number | `${number}`;
  'rx'?: number | string;
  'ry'?: number | string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type EmAttributes = { prop?: PropFor<'em'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type EmbedAttributes = {
  prop?: PropFor<'embed'> | null;
  'height'?: number | `${number}`;
  'src'?: string;
  'type'?: string;
  'width'?: number | `${number}`;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FeBlendAttributes = { prop?: PropFor<'feBlend'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeColorMatrixAttributes = { prop?: PropFor<'feColorMatrix'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeComponentTransferAttributes = { prop?: PropFor<'feComponentTransfer'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeCompositeAttributes = { prop?: PropFor<'feComposite'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeConvolveMatrixAttributes = { prop?: PropFor<'feConvolveMatrix'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeDiffuseLightingAttributes = { prop?: PropFor<'feDiffuseLighting'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeDisplacementMapAttributes = { prop?: PropFor<'feDisplacementMap'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeDistantLightAttributes = { prop?: PropFor<'feDistantLight'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeDropShadowAttributes = { prop?: PropFor<'feDropShadow'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeFloodAttributes = { prop?: PropFor<'feFlood'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeFuncAAttributes = { prop?: PropFor<'feFuncA'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeFuncBAttributes = { prop?: PropFor<'feFuncB'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeFuncGAttributes = { prop?: PropFor<'feFuncG'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeFuncRAttributes = { prop?: PropFor<'feFuncR'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeGaussianBlurAttributes = { prop?: PropFor<'feGaussianBlur'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeImageAttributes = {
  prop?: PropFor<'feImage'> | null;
  'externalResourcesRequired'?: "true" | "false";
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeMergeAttributes = { prop?: PropFor<'feMerge'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeMergeNodeAttributes = { prop?: PropFor<'feMergeNode'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeMorphologyAttributes = { prop?: PropFor<'feMorphology'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeOffsetAttributes = { prop?: PropFor<'feOffset'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FePointLightAttributes = { prop?: PropFor<'fePointLight'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeSpecularLightingAttributes = { prop?: PropFor<'feSpecularLighting'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeSpotLightAttributes = { prop?: PropFor<'feSpotLight'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeTileAttributes = { prop?: PropFor<'feTile'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FeTurbulenceAttributes = { prop?: PropFor<'feTurbulence'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FieldsetAttributes = {
  prop?: PropFor<'fieldset'> | null;
  'disabled'?: boolean;
  'form'?: string;
  'name'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FigcaptionAttributes = { prop?: PropFor<'figcaption'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FigureAttributes = { prop?: PropFor<'figure'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FilterAttributes = {
  prop?: PropFor<'filter'> | null;
  'externalResourcesRequired'?: "true" | "false";
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FooterAttributes = { prop?: PropFor<'footer'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ForeignObjectAttributes = {
  prop?: PropFor<'foreignObject'> | null;
  'height'?: number | string;
  'width'?: number | string;
  'x'?: number | string;
  'y'?: number | string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type FormAttributes = {
  prop?: PropFor<'form'> | null;
  'accept-charset'?: string;
  'acceptCharset'?: string;
  'action'?: string;
  'autocomplete'?: "on" | "off";
  'enctype'?: "application/x-www-form-urlencoded" | "APPLICATION/X-WWW-FORM-URLENCODED" | "multipart/form-data" | "MULTIPART/FORM-DATA" | "text/plain" | "TEXT/PLAIN";
  'method'?: "get" | "GET" | "post" | "POST" | "dialog" | "DIALOG";
  'name'?: string;
  'novalidate'?: boolean;
  'rel'?: string;
  'target'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type GAttributes = { prop?: PropFor<'g'> | null; } & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type H1Attributes = { prop?: PropFor<'h1'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H2Attributes = { prop?: PropFor<'h2'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H3Attributes = { prop?: PropFor<'h3'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H4Attributes = { prop?: PropFor<'h4'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H5Attributes = { prop?: PropFor<'h5'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H6Attributes = { prop?: PropFor<'h6'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HeadAttributes = { prop?: PropFor<'head'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HeaderAttributes = { prop?: PropFor<'header'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HgroupAttributes = { prop?: PropFor<'hgroup'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HrAttributes = { prop?: PropFor<'hr'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HtmlAttributes = { prop?: PropFor<'html'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type IAttributes = { prop?: PropFor<'i'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type IframeAttributes = {
  prop?: PropFor<'iframe'> | null;
  'allow'?: string;
  'allowfullscreen'?: boolean;
  'height'?: number | `${number}`;
  'loading'?: "lazy" | "eager";
  'name'?: string;
  'referrerpolicy'?: string;
  'sandbox'?: string;
  'src'?: string;
  'srcdoc'?: string;
  'width'?: number | `${number}`;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ImageAttributes = {
  prop?: PropFor<'image'> | null;
  'crossorigin'?: "anonymous" | "use-credentials";
  'height'?: number | string;
  'href'?: string;
  'preserveAspectRatio'?: string;
  'width'?: number | string;
  'x'?: number | string;
  'y'?: number | string;
} & SvgPresentationAttributes & SvgConditionalAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type ImgAttributes = {
  prop?: PropFor<'img'> | null;
  'alt'?: string;
  'controls'?: boolean;
  'crossorigin'?: "anonymous" | "use-credentials";
  'decoding'?: "sync" | "async" | "auto";
  'fetchpriority'?: "auto" | "high" | "low";
  'height'?: number | `${number}`;
  'ismap'?: boolean;
  'loading'?: "lazy" | "eager";
  'referrerpolicy'?: string;
  'sizes'?: string;
  'src'?: string;
  'srcset'?: string;
  'usemap'?: string;
  'width'?: number | `${number}`;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type InputAttributes = {
  prop?: PropFor<'input'> | null;
  'accept'?: string;
  'alpha'?: boolean;
  'alt'?: string;
  'autocomplete'?: string;
  'checked'?: boolean;
  'colorspace'?: "limited-srgb" | "display-p3";
  'dirname'?: string;
  'disabled'?: boolean;
  'form'?: string;
  'formaction'?: string;
  'formenctype'?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
  'formmethod'?: "get" | "GET" | "post" | "POST" | "dialog" | "DIALOG";
  'formnovalidate'?: boolean;
  'formtarget'?: string;
  'height'?: number | `${number}`;
  'list'?: string;
  'max'?: string;
  'maxlength'?: number | `${number}`;
  'min'?: string;
  'minlength'?: number | `${number}`;
  'multiple'?: boolean;
  'name'?: string;
  'pattern'?: string;
  'placeholder'?: string;
  'popovertarget'?: string;
  'popovertargetaction'?: "toggle" | "show" | "hide";
  'readonly'?: boolean;
  'required'?: boolean;
  'size'?: number | `${number}`;
  'src'?: string;
  'step'?: number | string;
  'type'?: "hidden" | "text" | "search" | "tel" | "url" | "email" | "password" | "date" | "month" | "week" | "time" | "datetime-local" | "number" | "range" | "color" | "checkbox" | "radio" | "file" | "submit" | "image" | "reset" | "button";
  'value'?: number | string;
  'width'?: number | `${number}`;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type InsAttributes = {
  prop?: PropFor<'ins'> | null;
  'cite'?: string;
  'datetime'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type KbdAttributes = { prop?: PropFor<'kbd'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LabelAttributes = {
  prop?: PropFor<'label'> | null;
  'for'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LegendAttributes = { prop?: PropFor<'legend'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LiAttributes = {
  prop?: PropFor<'li'> | null;
  'value'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LineAttributes = {
  prop?: PropFor<'line'> | null;
  'pathLength'?: number | `${number}`;
  'x1'?: number | string;
  'x2'?: number | string;
  'y1'?: number | string;
  'y2'?: number | string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type LinearGradientAttributes = {
  prop?: PropFor<'linearGradient'> | null;
  'gradientTransform'?: string;
  'gradientUnits'?: "userSpaceOnUse" | "objectBoundingBox";
  'href'?: string;
  'spreadMethod'?: string;
  'x1'?: number | string;
  'x2'?: number | string;
  'y1'?: number | string;
  'y2'?: number | string;
} & SvgPresentationAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type LinkAttributes = {
  prop?: PropFor<'link'> | null;
  'as'?: string;
  'blocking'?: string;
  'color'?: string;
  'crossorigin'?: "anonymous" | "use-credentials";
  'disabled'?: boolean;
  'fetchpriority'?: "auto" | "high" | "low";
  'href'?: string;
  'hreflang'?: string;
  'imagesizes'?: string;
  'imagesrcset'?: string;
  'integrity'?: string;
  'media'?: string;
  'referrerpolicy'?: string;
  'rel'?: string;
  'sizes'?: string;
  'type'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MainAttributes = { prop?: PropFor<'main'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MapAttributes = {
  prop?: PropFor<'map'> | null;
  'name'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MarkAttributes = { prop?: PropFor<'mark'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MarkerAttributes = {
  prop?: PropFor<'marker'> | null;
  'markerHeight'?: string;
  'markerUnits'?: string;
  'markerWidth'?: string;
  'orient'?: string;
  'preserveAspectRatio'?: string;
  'refX'?: string;
  'refY'?: string;
  'viewBox'?: string;
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type MaskAttributes = {
  prop?: PropFor<'mask'> | null;
  'requiredFeatures'?: string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type MathAttributes = {
  prop?: PropFor<'math'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'display'?: string;
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
  'xmlns'?: string;
} & NameSpaceAttributes & GlobalEvents;

type MencloseAttributes = {
  prop?: PropFor<'menclose'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'notation'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MenuAttributes = { prop?: PropFor<'menu'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MerrorAttributes = {
  prop?: PropFor<'merror'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MetaAttributes = {
  prop?: PropFor<'meta'> | null;
  'charset'?: "utf-8" | "UTF-8";
  'content'?: string;
  'http-equiv'?: "content-type" | "CONTENT-TYPE" | "default-style" | "DEFAULT-STYLE" | "refresh" | "REFRESH" | "x-ua-compatible" | "X-UA-COMPATIBLE" | "content-security-policy" | "CONTENT-SECURITY-POLICY";
  'httpEquiv'?: "content-type" | "CONTENT-TYPE" | "default-style" | "DEFAULT-STYLE" | "refresh" | "REFRESH" | "x-ua-compatible" | "X-UA-COMPATIBLE" | "content-security-policy" | "CONTENT-SECURITY-POLICY";
  'media'?: string;
  'name'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MetadataAttributes = { prop?: PropFor<'metadata'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type MeterAttributes = {
  prop?: PropFor<'meter'> | null;
  'high'?: number | string;
  'low'?: number | string;
  'max'?: number | string;
  'min'?: number | string;
  'optimum'?: number | string;
  'value'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MfracAttributes = {
  prop?: PropFor<'mfrac'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'linethickness'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MiAttributes = {
  prop?: PropFor<'mi'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MmultiscriptsAttributes = {
  prop?: PropFor<'mmultiscripts'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MnAttributes = {
  prop?: PropFor<'mn'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MoAttributes = {
  prop?: PropFor<'mo'> | null;
  'accent'?: string;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'fence'?: string;
  'href'?: string;
  'id'?: string;
  'lspace'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'maxsize'?: string;
  'minsize'?: string;
  'movablelimits'?: string;
  'nonce'?: string;
  'rspace'?: string;
  'scriptlevel'?: string;
  'separator'?: string;
  'stretchy'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'symmetric'?: string;
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MoverAttributes = {
  prop?: PropFor<'mover'> | null;
  'accent'?: string;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MpaddedAttributes = {
  prop?: PropFor<'mpadded'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'depth'?: string;
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'height'?: number | string;
  'href'?: string;
  'id'?: string;
  'lspace'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
  'voffset'?: string;
  'width'?: number | string;
} & NameSpaceAttributes & GlobalEvents;

type MpathAttributes = {
  prop?: PropFor<'mpath'> | null;
  'href'?: string;
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type MphantomAttributes = {
  prop?: PropFor<'mphantom'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MprescriptsAttributes = {
  prop?: PropFor<'mprescripts'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MrootAttributes = {
  prop?: PropFor<'mroot'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MrowAttributes = {
  prop?: PropFor<'mrow'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MsAttributes = {
  prop?: PropFor<'ms'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MspaceAttributes = {
  prop?: PropFor<'mspace'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'height'?: number | string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
  'width'?: number | string;
} & NameSpaceAttributes & GlobalEvents;

type MsqrtAttributes = {
  prop?: PropFor<'msqrt'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MstyleAttributes = {
  prop?: PropFor<'mstyle'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MsubAttributes = {
  prop?: PropFor<'msub'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MsubsupAttributes = {
  prop?: PropFor<'msubsup'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MsupAttributes = {
  prop?: PropFor<'msup'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MtableAttributes = {
  prop?: PropFor<'mtable'> | null;
  'align'?: string;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'columnalign'?: string;
  'columnlines'?: string;
  'columnspacing'?: string;
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'frame'?: string;
  'framespacing'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'rowalign'?: string;
  'rowlines'?: string;
  'rowspacing'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
  'width'?: number | string;
} & NameSpaceAttributes & GlobalEvents;

type MtdAttributes = {
  prop?: PropFor<'mtd'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'columnalign'?: string;
  'columnspan'?: string;
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'rowalign'?: string;
  'rowspan'?: number | `${number}`;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MtextAttributes = {
  prop?: PropFor<'mtext'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MtrAttributes = {
  prop?: PropFor<'mtr'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'columnalign'?: string;
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'rowalign'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MunderAttributes = {
  prop?: PropFor<'munder'> | null;
  'accentunder'?: string;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type MunderoverAttributes = {
  prop?: PropFor<'munderover'> | null;
  'accent'?: string;
  'accentunder'?: string;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type NavAttributes = { prop?: PropFor<'nav'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type NoscriptAttributes = { prop?: PropFor<'noscript'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ObjectAttributes = {
  prop?: PropFor<'object'> | null;
  'data'?: string;
  'form'?: string;
  'height'?: number | `${number}`;
  'name'?: string;
  'type'?: string;
  'width'?: number | `${number}`;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type OlAttributes = {
  prop?: PropFor<'ol'> | null;
  'reversed'?: boolean;
  'start'?: number | `${number}`;
  'type'?: "1" | "a" | "A" | "i" | "I";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type OptgroupAttributes = {
  prop?: PropFor<'optgroup'> | null;
  'disabled'?: boolean;
  'label'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type OptionAttributes = {
  prop?: PropFor<'option'> | null;
  'disabled'?: boolean;
  'label'?: string;
  'selected'?: boolean;
  'value'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type OutputAttributes = {
  prop?: PropFor<'output'> | null;
  'for'?: string;
  'form'?: string;
  'name'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PAttributes = { prop?: PropFor<'p'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PathAttributes = {
  prop?: PropFor<'path'> | null;
  'd'?: string;
  'pathLength'?: number | `${number}`;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type PatternAttributes = {
  prop?: PropFor<'pattern'> | null;
  'height'?: number | string;
  'href'?: string;
  'patternContentUnits'?: string;
  'patternTransform'?: string;
  'patternUnits'?: string;
  'preserveAspectRatio'?: string;
  'viewBox'?: string;
  'width'?: number | string;
  'x'?: number | string;
  'y'?: number | string;
} & SvgPresentationAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type PictureAttributes = { prop?: PropFor<'picture'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PolygonAttributes = {
  prop?: PropFor<'polygon'> | null;
  'pathLength'?: number | `${number}`;
  'points'?: string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type PolylineAttributes = {
  prop?: PropFor<'polyline'> | null;
  'pathLength'?: number | `${number}`;
  'points'?: string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type PreAttributes = { prop?: PropFor<'pre'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ProgressAttributes = {
  prop?: PropFor<'progress'> | null;
  'max'?: number | string;
  'value'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type QAttributes = {
  prop?: PropFor<'q'> | null;
  'cite'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type RadialGradientAttributes = {
  prop?: PropFor<'radialGradient'> | null;
  'cx'?: number | string;
  'cy'?: number | string;
  'fr'?: string;
  'fx'?: string;
  'fy'?: string;
  'gradientTransform'?: string;
  'gradientUnits'?: "userSpaceOnUse" | "objectBoundingBox";
  'href'?: string;
  'r'?: number | string;
  'spreadMethod'?: string;
} & SvgPresentationAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type RectAttributes = {
  prop?: PropFor<'rect'> | null;
  'height'?: number | string;
  'pathLength'?: number | `${number}`;
  'rx'?: number | string;
  'ry'?: number | string;
  'width'?: number | string;
  'x'?: number | string;
  'y'?: number | string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type RpAttributes = { prop?: PropFor<'rp'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type RtAttributes = { prop?: PropFor<'rt'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type RubyAttributes = { prop?: PropFor<'ruby'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SAttributes = { prop?: PropFor<'s'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SampAttributes = { prop?: PropFor<'samp'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ScriptAttributes = {
  prop?: ContextualPropFor<'script'> | null;
  'async'?: boolean;
  'blocking'?: string;
  'crossorigin'?: "anonymous" | "use-credentials";
  'defer'?: boolean;
  'fetchpriority'?: "auto" | "high" | "low";
  'href'?: string;
  'integrity'?: string;
  'nomodule'?: boolean;
  'referrerpolicy'?: string;
  'src'?: string;
  'type'?: string;
  'xml:space'?: "preserve";
} & SvgPresentationAttributes & SvgXLinkAttributes & NameSpaceAttributes & GlobalAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type SearchAttributes = { prop?: PropFor<'search'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SectionAttributes = { prop?: PropFor<'section'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SelectAttributes = {
  prop?: PropFor<'select'> | null;
  'autocomplete'?: string;
  'disabled'?: boolean;
  'form'?: string;
  'multiple'?: boolean;
  'name'?: string;
  'required'?: boolean;
  'size'?: number | `${number}`;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SelectedcontentAttributes = { prop?: PropFor<'selectedcontent'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SemanticsAttributes = {
  prop?: PropFor<'semantics'> | null;
  'autofocus'?: boolean;
  'class'?: string | string[];
  'dir'?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  'displaystyle'?: string;
  'href'?: string;
  'id'?: string;
  'mathbackground'?: string;
  'mathcolor'?: string;
  'mathsize'?: string;
  'nonce'?: string;
  'scriptlevel'?: string;
  'style'?: string | (csstype.Properties<string | number> & csstype.PropertiesHyphen<string | number>);
  'tabindex'?: number | `${number}`;
} & NameSpaceAttributes & GlobalEvents;

type SetAttributes = {
  prop?: PropFor<'set'> | null;
  'attributeName'?: string;
  'begin'?: string;
  'dur'?: string;
  'end'?: string;
  'fill'?: "remove" | "freeze";
  'href'?: string;
  'max'?: string;
  'min'?: string;
  'onbegin'?: string | ((event: Event) => void);
  'onend'?: string | ((event: Event) => void);
  'onrepeat'?: string | ((event: Event) => void);
  'repeatCount'?: string;
  'repeatDur'?: string;
  'restart'?: "always" | "never" | "whenNotActive";
  'to'?: string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type SlotAttributes = {
  prop?: PropFor<'slot'> | null;
  'name'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SmallAttributes = { prop?: PropFor<'small'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SourceAttributes = {
  prop?: PropFor<'source'> | null;
  'height'?: number | `${number}`;
  'media'?: string;
  'sizes'?: string;
  'src'?: string;
  'srcset'?: string;
  'type'?: string;
  'width'?: number | `${number}`;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SpanAttributes = { prop?: PropFor<'span'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type StopAttributes = {
  prop?: PropFor<'stop'> | null;
  'offset'?: number | `${number}`;
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type StrongAttributes = { prop?: PropFor<'strong'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type StyleAttributes = {
  prop?: ContextualPropFor<'style'> | null;
  'blocking'?: string;
  'media'?: string;
  'type'?: string;
} & SvgPresentationAttributes & NameSpaceAttributes & GlobalAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type SubAttributes = { prop?: PropFor<'sub'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SummaryAttributes = { prop?: PropFor<'summary'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SupAttributes = { prop?: PropFor<'sup'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SvgAttributes = {
  prop?: PropFor<'svg'> | null;
  'height'?: number | string;
  'onabort'?: string | ((event: Event) => void);
  'onunload'?: string | ((event: Event) => void);
  'preserveAspectRatio'?: string;
  'viewBox'?: string;
  'width'?: number | string;
  'x'?: number | string;
  'xmlns'?: string;
  'y'?: number | string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type SwitchAttributes = { prop?: PropFor<'switch'> | null; } & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type SymbolAttributes = {
  prop?: PropFor<'symbol'> | null;
  'height'?: number | string;
  'preserveAspectRatio'?: string;
  'refX'?: string;
  'refY'?: string;
  'viewBox'?: string;
  'width'?: number | string;
  'x'?: number | string;
  'y'?: number | string;
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type TableAttributes = { prop?: PropFor<'table'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TbodyAttributes = { prop?: PropFor<'tbody'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TdAttributes = {
  prop?: PropFor<'td'> | null;
  'colspan'?: number | `${number}`;
  'headers'?: string;
  'rowspan'?: number | `${number}`;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TemplateAttributes = {
  prop?: PropFor<'template'> | null;
  'shadowrootclonable'?: boolean;
  'shadowrootcustomelementregistry'?: boolean;
  'shadowrootdelegatesfocus'?: boolean;
  'shadowrootmode'?: "open" | "closed";
  'shadowrootserializable'?: boolean;
  'shadowrootslotassignment'?: "named" | "manual";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TextAttributes = {
  prop?: PropFor<'text'> | null;
  'dx'?: string;
  'dy'?: string;
  'lengthAdjust'?: string;
  'rotate'?: string;
  'textLength'?: string;
  'x'?: string;
  'y'?: string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type TextareaAttributes = {
  prop?: PropFor<'textarea'> | null;
  'autocomplete'?: string;
  'cols'?: number | `${number}`;
  'dirname'?: string;
  'disabled'?: boolean;
  'form'?: string;
  'maxlength'?: number | `${number}`;
  'minlength'?: number | `${number}`;
  'name'?: string;
  'placeholder'?: string;
  'readonly'?: boolean;
  'required'?: boolean;
  'rows'?: number | `${number}`;
  'wrap'?: "soft" | "hard";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TextPathAttributes = {
  prop?: PropFor<'textPath'> | null;
  'href'?: string;
  'lengthAdjust'?: string;
  'method'?: "get" | "GET" | "post" | "POST" | "dialog" | "DIALOG";
  'path'?: string;
  'side'?: string;
  'spacing'?: string;
  'startOffset'?: string;
  'textLength'?: string;
} & SvgPresentationAttributes & SvgConditionalAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type TfootAttributes = { prop?: PropFor<'tfoot'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ThAttributes = {
  prop?: PropFor<'th'> | null;
  'abbr'?: string;
  'colspan'?: number | `${number}`;
  'headers'?: string;
  'rowspan'?: number | `${number}`;
  'scope'?: "row" | "ROW" | "col" | "COL" | "rowgroup" | "ROWGROUP" | "colgroup" | "COLGROUP";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TheadAttributes = { prop?: PropFor<'thead'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TimeAttributes = {
  prop?: PropFor<'time'> | null;
  'datetime'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TitleAttributes = { prop?: ContextualPropFor<'title'> | null; } & SvgPresentationAttributes & NameSpaceAttributes & GlobalAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type TrAttributes = { prop?: PropFor<'tr'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TrackAttributes = {
  prop?: PropFor<'track'> | null;
  'default'?: boolean;
  'kind'?: "subtitles" | "captions" | "descriptions" | "chapters" | "metadata";
  'label'?: string;
  'src'?: string;
  'srclang'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TspanAttributes = {
  prop?: PropFor<'tspan'> | null;
  'dx'?: string;
  'dy'?: string;
  'lengthAdjust'?: string;
  'rotate'?: number | string;
  'textLength'?: string;
  'x'?: number | string;
  'y'?: number | string;
} & SvgPresentationAttributes & SvgConditionalAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type UAttributes = { prop?: PropFor<'u'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type UlAttributes = { prop?: PropFor<'ul'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type UseAttributes = {
  prop?: PropFor<'use'> | null;
  'height'?: number | string;
  'href'?: string;
  'width'?: number | string;
  'x'?: number | string;
  'y'?: number | string;
} & SvgPresentationAttributes & SvgConditionalAttributes & SvgXLinkAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type VarAttributes = { prop?: PropFor<'var'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type VideoAttributes = {
  prop?: PropFor<'video'> | null;
  'autoplay'?: boolean;
  'controls'?: boolean;
  'crossorigin'?: "anonymous" | "use-credentials";
  'height'?: number | `${number}`;
  'loading'?: "lazy" | "eager";
  'loop'?: boolean;
  'muted'?: boolean;
  'playsinline'?: boolean;
  'poster'?: string;
  'preload'?: "none" | "metadata" | "auto";
  'src'?: string;
  'width'?: number | `${number}`;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ViewAttributes = {
  prop?: PropFor<'view'> | null;
  'preserveAspectRatio'?: string;
  'viewBox'?: string;
} & SvgPresentationAttributes & NameSpaceAttributes & SvgGlobalAttributes & GlobalEvents & SvgGlobalEvents;

type WbrAttributes = { prop?: PropFor<'wbr'> | null; } & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ColgroupContent = ColTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean | (ColTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type DlContent = DtTag | DdTag | DivTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean | (DtTag | DdTag | DivTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type HgroupContent = H1Tag | H2Tag | H3Tag | H4Tag | H5Tag | H6Tag | PTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean | (H1Tag | H2Tag | H3Tag | H4Tag | H5Tag | H6Tag | PTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type HtmlContent = HeadTag | BodyTag | LiteralTag | CommentTag | null | undefined | boolean | (HeadTag | BodyTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type MenuContent = LiTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean | (LiTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type OlContent = LiTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean | (LiTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type OptgroupContent = OptionTag | ScriptTag | TemplateTag | NoscriptTag | DivTag | LegendTag | LiteralTag | CommentTag | null | undefined | boolean | (OptionTag | ScriptTag | TemplateTag | NoscriptTag | DivTag | LegendTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type PictureContent = SourceTag | ImgTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean | (SourceTag | ImgTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type SelectContent = OptionTag | OptgroupTag | HrTag | ScriptTag | TemplateTag | NoscriptTag | DivTag | ButtonTag | LiteralTag | CommentTag | null | undefined | boolean | (OptionTag | OptgroupTag | HrTag | ScriptTag | TemplateTag | NoscriptTag | DivTag | ButtonTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type TableContent = CaptionTag | ColgroupTag | TheadTag | TbodyTag | TfootTag | TrTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean | (CaptionTag | ColgroupTag | TheadTag | TbodyTag | TfootTag | TrTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type TbodyContent = TrTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean | (TrTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type TfootContent = TrTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean | (TrTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type TheadContent = TrTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean | (TrTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type TrContent = ThTag | TdTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean | (ThTag | TdTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean)[];
type UlContent = LiTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean | (LiTag | ScriptTag | TemplateTag | LiteralTag | CommentTag | null | undefined | boolean)[];

/**
 * Valid content for any tag method: a string, number, tag instance, or an array of those.
 * `null`, `undefined`, `false`, `true`, and `''` are silently ignored, so conditional
 * patterns like `condition && t.span('text')` work without casting.
 *
 * @example
 * t.ul([t.li('one'), t.li(2), t.li(t.span('three'))]);
 */
export type Content = ContentTag | VoidTag | LiteralTag | CommentTag | string | number | boolean | null | undefined | (ContentTag | VoidTag | LiteralTag | CommentTag | string | number | boolean | null | undefined)[];

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
  (attributes: T & UniversalAttributes, content?: Content): ContentTag;
  (content?: Content): ContentTag;
}

type PrimitiveConstructor = StringConstructor | NumberConstructor | BooleanConstructor | FunctionConstructor;
type Primitive = string | number | boolean | Function;
type AttributeValue = PrimitiveConstructor | Primitive | (PrimitiveConstructor | Primitive)[];
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
export default class Kensington {
  constructor(options?: {
    /** Allow extra attributes on all elements, e.g. `{ enterkeyhint: ['enter', 'done', 'go', 'next', 'previous', 'search', 'send'] }`. */
    additionalGlobalAttributes?: Record<string, unknown>;
    /** Allow additional attribute namespaces, e.g. `'hx'` for htmx `hx-*` attributes. */
    additionalNamespaces?: string | string[];
    /** Spaces per indentation level. Default: 2. Set to 0 to disable indentation. */
    indentationLevel?: number;
    /** Attribute validation behavior. Default: `'warn'`. */
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
  createCustomTag<A extends Record<string, AttributeValue> = Record<string, AttributeValue>>(
    tagName: string,
    allowedAttributes?: A
  ): ContentMethod<{ [K in keyof A as K | CamelCase<K & string> | KebabCase<K & string>]?: unknown }>

  /**
   * Embeds a raw markup string verbatim into the output. Live DOM fragments are
   * parsed in the surrounding HTML, SVG, or MathML context.
   * Use `.unsafeLiteral()` for trusted markup that includes `<script>` tags.
   *
   * @example
   * t.ul([t.li('typed'), t.literal('<li>raw markup</li>')]).toString();
   */
  literal(str: string): LiteralTag

  /**
   * Like `.literal()` but skips the script-tag check — use only for trusted markup.
   */
  unsafeLiteral(str: string): LiteralTag

  /**
   * Creates an HTML comment. Multi-line strings are formatted across multiple lines.
   * @example
   * t.inlineComment('hello world')  // <!-- hello world -->
   */
  inlineComment(str: string | number): CommentTag

  /**
   * Renders a full HTML document. Identical to `.html()` but prepends `<!DOCTYPE html>`.
   * Call `.toString()` on the result.
   *
   * @example
   * t.htmlWithDocType({ lang: 'en' }, t.body('hello')).toString();
   */
  htmlWithDocType<T extends HtmlAttributes | HtmlContent>(attributesOrContent?: T, ...rest: T extends HtmlContent ? [] : [content?: HtmlContent]): ContentTag;

  a<T extends AAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  abbr<T extends AbbrAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  address<T extends AddressAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  animate<T extends AnimateAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  animateMotion<T extends AnimateMotionAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  animateTransform<T extends AnimateTransformAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  annotation<T extends AnnotationAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  annotationXml<T extends AnnotationXmlAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  area(attributes?: AreaAttributes): VoidTag;
  article<T extends ArticleAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  aside<T extends AsideAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  audio<T extends AudioAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  b<T extends BAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  base(attributes?: BaseAttributes): VoidTag;
  bdi<T extends BdiAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  bdo<T extends BdoAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  blockquote<T extends BlockquoteAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  body<T extends BodyAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): BodyTag;
  br(attributes?: BrAttributes): VoidTag;
  button<T extends ButtonAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ButtonTag;
  canvas<T extends CanvasAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  caption<T extends CaptionAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): CaptionTag;
  circle<T extends CircleAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  cite<T extends CiteAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  clipPath<T extends ClipPathAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  code<T extends CodeAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  col(attributes?: ColAttributes): ColTag;
  colgroup<T extends ColgroupAttributes | ColgroupContent>(attributesOrContent?: T, ...rest: T extends ColgroupContent ? [] : [content?: ColgroupContent]): ColgroupTag;
  data<T extends DataAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  datalist<T extends DatalistAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  dd<T extends DdAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): DdTag;
  defs<T extends DefsAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  del<T extends DelAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  desc<T extends DescAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  details<T extends DetailsAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  dfn<T extends DfnAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  dialog<T extends DialogAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  div<T extends DivAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): DivTag;
  dl<T extends DlAttributes | DlContent>(attributesOrContent?: T, ...rest: T extends DlContent ? [] : [content?: DlContent]): DlTag;
  dt<T extends DtAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): DtTag;
  ellipse<T extends EllipseAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  em<T extends EmAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  embed(attributes?: EmbedAttributes): VoidTag;
  feBlend<T extends FeBlendAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feColorMatrix<T extends FeColorMatrixAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feComponentTransfer<T extends FeComponentTransferAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feComposite<T extends FeCompositeAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feConvolveMatrix<T extends FeConvolveMatrixAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feDiffuseLighting<T extends FeDiffuseLightingAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feDisplacementMap<T extends FeDisplacementMapAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feDistantLight<T extends FeDistantLightAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feDropShadow<T extends FeDropShadowAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feFlood<T extends FeFloodAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feFuncA<T extends FeFuncAAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feFuncB<T extends FeFuncBAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feFuncG<T extends FeFuncGAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feFuncR<T extends FeFuncRAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feGaussianBlur<T extends FeGaussianBlurAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feImage<T extends FeImageAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feMerge<T extends FeMergeAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feMergeNode<T extends FeMergeNodeAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feMorphology<T extends FeMorphologyAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feOffset<T extends FeOffsetAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  fePointLight<T extends FePointLightAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feSpecularLighting<T extends FeSpecularLightingAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feSpotLight<T extends FeSpotLightAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feTile<T extends FeTileAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  feTurbulence<T extends FeTurbulenceAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  fieldset<T extends FieldsetAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  figcaption<T extends FigcaptionAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  figure<T extends FigureAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  filter<T extends FilterAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  footer<T extends FooterAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  foreignObject<T extends ForeignObjectAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  form<T extends FormAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  g<T extends GAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  h1<T extends H1Attributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): H1Tag;
  h2<T extends H2Attributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): H2Tag;
  h3<T extends H3Attributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): H3Tag;
  h4<T extends H4Attributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): H4Tag;
  h5<T extends H5Attributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): H5Tag;
  h6<T extends H6Attributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): H6Tag;
  head<T extends HeadAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): HeadTag;
  header<T extends HeaderAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  hgroup<T extends HgroupAttributes | HgroupContent>(attributesOrContent?: T, ...rest: T extends HgroupContent ? [] : [content?: HgroupContent]): HgroupTag;
  hr(attributes?: HrAttributes): HrTag;
  html<T extends HtmlAttributes | HtmlContent>(attributesOrContent?: T, ...rest: T extends HtmlContent ? [] : [content?: HtmlContent]): HtmlTag;
  i<T extends IAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  iframe<T extends IframeAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  image<T extends ImageAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  img(attributes?: ImgAttributes): ImgTag;
  input(attributes?: InputAttributes): VoidTag;
  ins<T extends InsAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  kbd<T extends KbdAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  label<T extends LabelAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  legend<T extends LegendAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): LegendTag;
  li<T extends LiAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): LiTag;
  line<T extends LineAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  linearGradient<T extends LinearGradientAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  link(attributes?: LinkAttributes): VoidTag;
  main<T extends MainAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  map<T extends MapAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mark<T extends MarkAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  marker<T extends MarkerAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mask<T extends MaskAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  math<T extends MathAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  menclose<T extends MencloseAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  menu<T extends MenuAttributes | MenuContent>(attributesOrContent?: T, ...rest: T extends MenuContent ? [] : [content?: MenuContent]): MenuTag;
  merror<T extends MerrorAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  meta(attributes?: MetaAttributes): VoidTag;
  metadata<T extends MetadataAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  meter<T extends MeterAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mfrac<T extends MfracAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mi<T extends MiAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mmultiscripts<T extends MmultiscriptsAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mn<T extends MnAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mo<T extends MoAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mover<T extends MoverAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mpadded<T extends MpaddedAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mpath<T extends MpathAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mphantom<T extends MphantomAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mprescripts<T extends MprescriptsAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mroot<T extends MrootAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mrow<T extends MrowAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  ms<T extends MsAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mspace<T extends MspaceAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  msqrt<T extends MsqrtAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mstyle<T extends MstyleAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  msub<T extends MsubAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  msubsup<T extends MsubsupAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  msup<T extends MsupAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mtable<T extends MtableAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mtd<T extends MtdAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mtext<T extends MtextAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  mtr<T extends MtrAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  munder<T extends MunderAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  munderover<T extends MunderoverAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  nav<T extends NavAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  noscript<T extends NoscriptAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): NoscriptTag;
  object<T extends ObjectAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  ol<T extends OlAttributes | OlContent>(attributesOrContent?: T, ...rest: T extends OlContent ? [] : [content?: OlContent]): OlTag;
  optgroup<T extends OptgroupAttributes | OptgroupContent>(attributesOrContent?: T, ...rest: T extends OptgroupContent ? [] : [content?: OptgroupContent]): OptgroupTag;
  option<T extends OptionAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): OptionTag;
  output<T extends OutputAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  p<T extends PAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): PTag;
  path<T extends PathAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  pattern<T extends PatternAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  picture<T extends PictureAttributes | PictureContent>(attributesOrContent?: T, ...rest: T extends PictureContent ? [] : [content?: PictureContent]): PictureTag;
  polygon<T extends PolygonAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  polyline<T extends PolylineAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  pre<T extends PreAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  progress<T extends ProgressAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  q<T extends QAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  radialGradient<T extends RadialGradientAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  rect<T extends RectAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  rp<T extends RpAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  rt<T extends RtAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  ruby<T extends RubyAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  s<T extends SAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  samp<T extends SampAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  script<T extends ScriptAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ScriptTag;
  search<T extends SearchAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  section<T extends SectionAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  select<T extends SelectAttributes | SelectContent>(attributesOrContent?: T, ...rest: T extends SelectContent ? [] : [content?: SelectContent]): SelectTag;
  selectedcontent(attributes?: SelectedcontentAttributes): VoidTag;
  semantics<T extends SemanticsAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  set<T extends SetAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  slot<T extends SlotAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  small<T extends SmallAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  source(attributes?: SourceAttributes): SourceTag;
  span<T extends SpanAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  stop<T extends StopAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  strong<T extends StrongAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  style<T extends StyleAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  sub<T extends SubAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  summary<T extends SummaryAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  sup<T extends SupAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  svg<T extends SvgAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  switch<T extends SwitchAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  symbol<T extends SymbolAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  table<T extends TableAttributes | TableContent>(attributesOrContent?: T, ...rest: T extends TableContent ? [] : [content?: TableContent]): TableTag;
  tbody<T extends TbodyAttributes | TbodyContent>(attributesOrContent?: T, ...rest: T extends TbodyContent ? [] : [content?: TbodyContent]): TbodyTag;
  td<T extends TdAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): TdTag;
  template<T extends TemplateAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): TemplateTag;
  text<T extends TextAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  textarea<T extends TextareaAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  textPath<T extends TextPathAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  tfoot<T extends TfootAttributes | TfootContent>(attributesOrContent?: T, ...rest: T extends TfootContent ? [] : [content?: TfootContent]): TfootTag;
  th<T extends ThAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ThTag;
  thead<T extends TheadAttributes | TheadContent>(attributesOrContent?: T, ...rest: T extends TheadContent ? [] : [content?: TheadContent]): TheadTag;
  time<T extends TimeAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  title<T extends TitleAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  tr<T extends TrAttributes | TrContent>(attributesOrContent?: T, ...rest: T extends TrContent ? [] : [content?: TrContent]): TrTag;
  track(attributes?: TrackAttributes): VoidTag;
  tspan<T extends TspanAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  u<T extends UAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  ul<T extends UlAttributes | UlContent>(attributesOrContent?: T, ...rest: T extends UlContent ? [] : [content?: UlContent]): UlTag;
  use<T extends UseAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  var<T extends VarAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  video<T extends VideoAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  view<T extends ViewAttributes | Content>(attributesOrContent?: T, ...rest: T extends Content ? [] : [content?: Content]): ContentTag;
  wbr(attributes?: WbrAttributes): VoidTag;
}

/**
 * Shared `Kensington` instance for use when no subclassing or custom configuration is needed.
 *
 * @example
 * import { t } from 'kensington';
 * const html = t.p({ class: 'intro' }, 'Hello world').toString();
 */
export const t: InstanceType<typeof Kensington>;

