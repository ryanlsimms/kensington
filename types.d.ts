import ContentTag from './esm/tag-classes/content-tag.js';
import LiteralTag from './esm/tag-classes/literal-tag.js';
import VoidTag from './esm/tag-classes/void-tag.js';
import SvgVoidTag from './esm/tag-classes/svg-void-tag.js';

export interface NameSpaceAttributes {
  [key: `${"data" | "aria"}${string}`]: string | object
}

type GlobalAttributes = {
  accesskey?: string;
  autocapitalize?: "on" | "off" | "none" | "sentences" | "words" | "characters";
  autocorrect?: "on" | "off";
  autofocus?: boolean;
  class?: string;
  contenteditable?: "true" | "plaintext-only" | "false";
  dir?: "ltr" | "LTR" | "rtl" | "RTL" | "auto" | "AUTO";
  draggable?: "true" | "false";
  enterkeyhint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  hidden?: string;
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
  spellcheck?: string;
  style?: string;
  tabindex?: string;
  title?: string;
  translate?: "yes" | "no";
  writingsuggestions?: string;
}

type GlobalEvents = {
  onauxclick?: string;
  onbeforeinput?: string;
  onbeforematch?: string;
  onbeforetoggle?: string;
  onblur?: string;
  oncancel?: string;
  oncanplay?: string;
  oncanplaythrough?: string;
  onchange?: string;
  onclick?: string;
  onclose?: string;
  oncommand?: string;
  oncontextlost?: string;
  oncontextmenu?: string;
  oncontextrestored?: string;
  oncopy?: string;
  oncuechange?: string;
  oncut?: string;
  ondblclick?: string;
  ondrag?: string;
  ondragend?: string;
  ondragenter?: string;
  ondragleave?: string;
  ondragover?: string;
  ondragstart?: string;
  ondrop?: string;
  ondurationchange?: string;
  onemptied?: string;
  onended?: string;
  onerror?: string;
  onfocus?: string;
  onformdata?: string;
  oninput?: string;
  oninvalid?: string;
  onkeydown?: string;
  onkeypress?: string;
  onkeyup?: string;
  onload?: string;
  onloadeddata?: string;
  onloadedmetadata?: string;
  onloadstart?: string;
  onmousedown?: string;
  onmouseenter?: string;
  onmouseleave?: string;
  onmousemove?: string;
  onmouseout?: string;
  onmouseover?: string;
  onmouseup?: string;
  onpaste?: string;
  onpause?: string;
  onplay?: string;
  onplaying?: string;
  onprogress?: string;
  onratechange?: string;
  onreset?: string;
  onresize?: string;
  onscroll?: string;
  onscrollend?: string;
  onsecuritypolicyviolation?: string;
  onseeked?: string;
  onseeking?: string;
  onselect?: string;
  onslotchange?: string;
  onstalled?: string;
  onsubmit?: string;
  onsuspend?: string;
  ontimeupdate?: string;
  ontoggle?: string;
  onvolumechange?: string;
  onwaiting?: string;
  onwheel?: string;
}

type AAttributes = {
  'download'?: string;
  'href'?: string;
  'hreflang'?: string;
  'ping'?: string;
  'referrerpolicy'?: string;
  'rel'?: string;
  'target'?: string;
  'type'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AbbrAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AddressAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AnimateAttributes = {
  'accumulate'?: "none" | "sum";
  'additive'?: "replace" | "sum";
  'attributeName'?: string;
  'autofocus'?: boolean;
  'begin'?: string;
  'by'?: string;
  'calcMode'?: "discrete" | "linear" | "paced" | "spline";
  'class'?: string;
  'dur'?: string;
  'end'?: string;
  'fill'?: "remove" | "freeze";
  'from'?: string;
  'href'?: string;
  'id'?: string;
  'keySplines'?: string;
  'keyTimes'?: string;
  'lang'?: string;
  'max'?: string;
  'min'?: string;
  'onbegin'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onend'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onrepeat'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'repeatCount'?: string;
  'repeatDur'?: string;
  'requiredExtensions'?: string;
  'restart'?: "always" | "never" | "whenNotActive";
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'to'?: string;
  'values'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AnimateMotionAttributes = {
  'accumulate'?: "none" | "sum";
  'additive'?: "replace" | "sum";
  'autofocus'?: boolean;
  'begin'?: string;
  'by'?: string;
  'calcMode'?: "discrete" | "linear" | "paced" | "spline";
  'class'?: string;
  'dur'?: string;
  'end'?: string;
  'fill'?: "remove" | "freeze";
  'from'?: string;
  'href'?: string;
  'id'?: string;
  'keyPoints'?: string;
  'keySplines'?: string;
  'keyTimes'?: string;
  'lang'?: string;
  'max'?: string;
  'min'?: string;
  'onbegin'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onend'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onrepeat'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'origin'?: string;
  'path'?: string;
  'repeatCount'?: string;
  'repeatDur'?: string;
  'requiredExtensions'?: string;
  'restart'?: "always" | "never" | "whenNotActive";
  'rotate'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'to'?: string;
  'values'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AnimateTransformAttributes = {
  'accumulate'?: "none" | "sum";
  'additive'?: "replace" | "sum";
  'attributeName'?: string;
  'autofocus'?: boolean;
  'begin'?: string;
  'by'?: string;
  'calcMode'?: "discrete" | "linear" | "paced" | "spline";
  'class'?: string;
  'dur'?: string;
  'end'?: string;
  'fill'?: "remove" | "freeze";
  'from'?: string;
  'href'?: string;
  'id'?: string;
  'keySplines'?: string;
  'keyTimes'?: string;
  'lang'?: string;
  'max'?: string;
  'min'?: string;
  'onbegin'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onend'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onrepeat'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'repeatCount'?: string;
  'repeatDur'?: string;
  'requiredExtensions'?: string;
  'restart'?: "always" | "never" | "whenNotActive";
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'to'?: string;
  'type'?: string;
  'values'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AreaAttributes = {
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

type ArticleAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AsideAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type AudioAttributes = {
  'autoplay'?: boolean;
  'controls'?: boolean;
  'crossorigin'?: "anonymous" | "use-credentials";
  'loop'?: boolean;
  'muted'?: boolean;
  'preload'?: "none" | "metadata" | "auto";
  'src'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BaseAttributes = {
  'href'?: string;
  'target'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BdiAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BdoAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BlockquoteAttributes = {
  'cite'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BodyAttributes = {
  'onafterprint'?: string;
  'onbeforeprint'?: string;
  'onbeforeunload'?: string;
  'onhashchange'?: string;
  'onlanguagechange'?: string;
  'onmessage'?: string;
  'onmessageerror'?: string;
  'onoffline'?: string;
  'ononline'?: string;
  'onpagehide'?: string;
  'onpagereveal'?: string;
  'onpageshow'?: string;
  'onpageswap'?: string;
  'onpopstate'?: string;
  'onrejectionhandled'?: string;
  'onstorage'?: string;
  'onunhandledrejection'?: string;
  'onunload'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type BrAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ButtonAttributes = {
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
  'height'?: string;
  'width'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type CaptionAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type CircleAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'cx'?: number | string;
  'cy'?: number | string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'pathLength'?: string;
  'r'?: number | string;
  'requiredExtensions'?: string;
  'role'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type CiteAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ClipPathAttributes = {
  'class'?: string;
  'externalResourcesRequired'?: string;
  'id'?: string;
  'requiredExtensions'?: string;
  'requiredFeatures'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'transform'?: string;
  'xml:base'?: string;
  'xml:lang'?: string;
  'xml:space'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type CodeAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ColAttributes = {
  'span'?: number;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ColgroupAttributes = {
  'span'?: number;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DataAttributes = {
  'value'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DatalistAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DdAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DefsAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'style'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DelAttributes = {
  'cite'?: string;
  'datetime'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DescAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'style'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DetailsAttributes = {
  'name'?: string;
  'open'?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DfnAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DialogAttributes = {
  'open'?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DiscardAttributes = {
  'autofocus'?: boolean;
  'begin'?: string;
  'class'?: string;
  'href'?: string;
  'id'?: string;
  'lang'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DivAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DlAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type DtAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type EllipseAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'cx'?: number | string;
  'cy'?: number | string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'pathLength'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'rx'?: number | string;
  'ry'?: number | string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type EmAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type EmbedAttributes = {
  'height'?: string;
  'src'?: string;
  'type'?: string;
  'width'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FieldsetAttributes = {
  'disabled'?: boolean;
  'form'?: string;
  'name'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FigcaptionAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FigureAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FooterAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ForeignObjectAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'height'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'width'?: string;
  'x'?: number | string;
  'xml:space'?: "default" | "preserve";
  'y'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type FormAttributes = {
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

type GAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H1Attributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H2Attributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H3Attributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H4Attributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H5Attributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type H6Attributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HeadAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HeaderAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HgroupAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HrAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type HtmlAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type IAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type IframeAttributes = {
  'allow'?: string;
  'allowfullscreen'?: boolean;
  'height'?: string;
  'loading'?: "lazy" | "eager";
  'name'?: string;
  'referrerpolicy'?: string;
  'sandbox'?: string;
  'src'?: string;
  'srcdoc'?: string;
  'width'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ImageAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'crossorigin'?: string;
  'height'?: string;
  'href'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'preserveAspectRatio'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'width'?: string;
  'x'?: number | string;
  'xlink:href'?: string;
  'xlink:title'?: string;
  'xml:space'?: "default" | "preserve";
  'y'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ImgAttributes = {
  'alt'?: string;
  'crossorigin'?: "anonymous" | "use-credentials";
  'decoding'?: "sync" | "async" | "auto";
  'fetchpriority'?: "auto" | "high" | "low";
  'height'?: string;
  'ismap'?: boolean;
  'loading'?: "lazy" | "eager";
  'referrerpolicy'?: string;
  'sizes'?: string;
  'src'?: string;
  'srcset'?: string;
  'usemap'?: string;
  'width'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type InputAttributes = {
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
  'height'?: string;
  'list'?: string;
  'max'?: string;
  'maxlength'?: string;
  'min'?: string;
  'minlength'?: string;
  'multiple'?: boolean;
  'name'?: string;
  'pattern'?: string;
  'placeholder'?: string;
  'popovertarget'?: string;
  'popovertargetaction'?: "toggle" | "show" | "hide";
  'readonly'?: boolean;
  'required'?: boolean;
  'size'?: number;
  'src'?: string;
  'step'?: string;
  'type'?: string;
  'value'?: number | string;
  'width'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type InsAttributes = {
  'cite'?: string;
  'datetime'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type KbdAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LabelAttributes = {
  'for'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LegendAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LiAttributes = {
  'value*'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LineAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'pathLength'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'x1'?: number | string;
  'x2'?: number | string;
  'xml:space'?: "default" | "preserve";
  'y1'?: number | string;
  'y2'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LinearGradientAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'gradientTransform'?: string;
  'gradientUnits'?: "userSpaceOnUse" | "objectBoundingBox";
  'href'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'spreadMethod'?: string;
  'style'?: string;
  'tabindex'?: string;
  'x1'?: number | string;
  'x2'?: number | string;
  'xlink:href'?: string;
  'xlink:title'?: string;
  'xml:space'?: "default" | "preserve";
  'y1'?: number | string;
  'y2'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type LinkAttributes = {
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

type MainAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MapAttributes = {
  'name'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MarkAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MarkerAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'id'?: string;
  'lang'?: string;
  'markerHeight'?: string;
  'markerUnits'?: string;
  'markerWidth'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'orient'?: string;
  'preserveAspectRatio'?: string;
  'refX'?: string;
  'refY'?: string;
  'style'?: string;
  'tabindex'?: string;
  'viewBox'?: string;
  'xml:space'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MaskAttributes = {
  'class'?: string;
  'id'?: string;
  'requiredExtensions'?: string;
  'requiredFeatures'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'xml:base'?: string;
  'xml:lang'?: string;
  'xml:space'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MenuAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MetaAttributes = {
  'charset'?: "utf-8" | "UTF-8";
  'content'?: string;
  'http-equiv'?: "content-type" | "CONTENT-TYPE" | "default-style" | "DEFAULT-STYLE" | "refresh" | "REFRESH" | "x-ua-compatible" | "X-UA-COMPATIBLE" | "content-security-policy" | "CONTENT-SECURITY-POLICY";
  'httpEquiv'?: "content-type" | "CONTENT-TYPE" | "default-style" | "DEFAULT-STYLE" | "refresh" | "REFRESH" | "x-ua-compatible" | "X-UA-COMPATIBLE" | "content-security-policy" | "CONTENT-SECURITY-POLICY";
  'media'?: string;
  'name'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MetadataAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'style'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MeterAttributes = {
  'high'?: string;
  'low'?: string;
  'max'?: string;
  'min'?: string;
  'optimum'?: string;
  'value'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type MpathAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'href'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'style'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type NavAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type NoscriptAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ObjectAttributes = {
  'data'?: string;
  'form'?: string;
  'height'?: string;
  'name'?: string;
  'type'?: string;
  'width'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type OlAttributes = {
  'reversed'?: boolean;
  'start'?: string;
  'type'?: "1" | "a" | "A" | "i" | "I";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type OptgroupAttributes = {
  'disabled'?: boolean;
  'label'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type OptionAttributes = {
  'disabled'?: boolean;
  'label'?: string;
  'selected'?: boolean;
  'value'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type OutputAttributes = {
  'for'?: string;
  'form'?: string;
  'name'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PathAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'd'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'pathLength'?: number;
  'requiredExtensions'?: string;
  'role'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PatternAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'height'?: string;
  'href'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncuechange'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'patternContentUnits'?: string;
  'patternTransform'?: string;
  'patternUnits'?: string;
  'preserveAspectRatio'?: string;
  'style'?: string;
  'tabindex'?: string;
  'viewBox'?: string;
  'width'?: string;
  'x'?: string;
  'xlink:href'?: string;
  'xlink:title'?: string;
  'xml:space'?: string;
  'y'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PictureAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PolygonAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'pathLength'?: string;
  'points'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PolylineAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'pathLength'?: string;
  'points'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type PreAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ProgressAttributes = {
  'max'?: string;
  'value'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type QAttributes = {
  'cite'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type RadialGradientAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'cx'?: number | string;
  'cy'?: number | string;
  'fr'?: string;
  'fx'?: string;
  'fy'?: string;
  'gradientTransform'?: string;
  'gradientUnits'?: "userSpaceOnUse" | "objectBoundingBox";
  'href'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'r'?: number | string;
  'spreadMethod'?: string;
  'style'?: string;
  'tabindex'?: string;
  'xlink:href'?: string;
  'xlink:title'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type RectAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'height'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'pathLength'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'rx'?: number | string;
  'ry'?: number | string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'width'?: string;
  'x'?: number | string;
  'xml:space'?: "default" | "preserve";
  'y'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type RpAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type RtAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type RubyAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SampAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ScriptAttributes = {
  'async'?: boolean;
  'blocking'?: string;
  'crossorigin'?: "anonymous" | "use-credentials";
  'defer'?: boolean;
  'fetchpriority'?: "auto" | "high" | "low";
  'integrity'?: string;
  'nomodule'?: boolean;
  'referrerpolicy'?: string;
  'src'?: string;
  'type'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SearchAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SectionAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SelectAttributes = {
  'autocomplete'?: string;
  'disabled'?: boolean;
  'form'?: string;
  'multiple'?: boolean;
  'name'?: string;
  'required'?: boolean;
  'size'?: number;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SelectedcontentAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SetAttributes = {
  'attributeName'?: string;
  'autofocus'?: boolean;
  'begin'?: string;
  'class'?: string;
  'dur'?: string;
  'end'?: string;
  'fill'?: "remove" | "freeze";
  'href'?: string;
  'id'?: string;
  'lang'?: string;
  'max'?: string;
  'min'?: string;
  'onbegin'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onend'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onrepeat'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'repeatCount'?: string;
  'repeatDur'?: string;
  'requiredExtensions'?: string;
  'restart'?: "always" | "never" | "whenNotActive";
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'to'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SlotAttributes = {
  'name'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SmallAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SourceAttributes = {
  'height'?: string;
  'media'?: string;
  'sizes'?: string;
  'src'?: string;
  'srcset'?: string;
  'type'?: string;
  'width'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SpanAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type StopAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'id'?: string;
  'lang'?: string;
  'offset'?: number;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'style'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type StrongAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type StyleAttributes = {
  'blocking'?: string;
  'media'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SubAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SummaryAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SupAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SvgAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'height'?: string;
  'id'?: string;
  'lang'?: string;
  'onabort'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onunload'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'preserveAspectRatio'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'transform'?: string;
  'viewBox'?: string;
  'width'?: string;
  'x'?: string;
  'xml:space'?: "default" | "preserve";
  'y'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SwitchAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'xml:space'?: "default" | "preserve";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type SymbolAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'height'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'preserveAspectRatio'?: string;
  'refX'?: string;
  'refY'?: string;
  'role'?: string;
  'style'?: string;
  'tabindex'?: string;
  'viewBox'?: string;
  'width'?: string;
  'x'?: string;
  'xml:space'?: string;
  'y'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TableAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TbodyAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TdAttributes = {
  'colspan'?: number;
  'headers'?: string;
  'rowspan'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TemplateAttributes = {
  'shadowrootclonable'?: boolean;
  'shadowrootcustomelementregistry'?: boolean;
  'shadowrootdelegatesfocus'?: boolean;
  'shadowrootmode'?: "open" | "closed";
  'shadowrootserializable'?: boolean;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TextAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'dx'?: string;
  'dy'?: string;
  'id'?: string;
  'lang'?: string;
  'lengthAdjust'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'rotate'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'textLength'?: string;
  'x'?: string;
  'xml:space'?: "default" | "preserve";
  'y'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TextareaAttributes = {
  'autocomplete'?: string;
  'cols'?: number;
  'dirname'?: string;
  'disabled'?: boolean;
  'form'?: string;
  'maxlength'?: string;
  'minlength'?: string;
  'name'?: string;
  'placeholder'?: string;
  'readonly'?: boolean;
  'required'?: boolean;
  'rows'?: number;
  'wrap'?: "soft" | "hard";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TextPathAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'href'?: string;
  'id'?: string;
  'lang'?: string;
  'lengthAdjust'?: string;
  'method'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'path'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'side'?: string;
  'spacing'?: string;
  'startOffset'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'textLength'?: string;
  'xlink:href'?: string;
  'xlink:title'?: string;
  'xml:space'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TfootAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ThAttributes = {
  'abbr'?: string;
  'colspan'?: number;
  'headers'?: string;
  'rowspan'?: string;
  'scope'?: "row" | "ROW" | "col" | "COL" | "rowgroup" | "ROWGROUP" | "colgroup" | "COLGROUP";
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TheadAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TimeAttributes = {
  'datetime'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TitleAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TrAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TrackAttributes = {
  'default'?: boolean;
  'kind'?: "subtitles" | "captions" | "descriptions" | "chapters" | "metadata";
  'label'?: string;
  'src'?: string;
  'srclang'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type TspanAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'dx'?: string;
  'dy'?: string;
  'id'?: string;
  'lang'?: string;
  'lengthAdjust'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'rotate'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'textLength'?: string;
  'x'?: string;
  'xml:space'?: "default" | "preserve";
  'y'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type UAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type UlAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type UseAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'height'?: string;
  'href'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'requiredExtensions'?: string;
  'role'?: string;
  'style'?: string;
  'systemLanguage'?: string;
  'tabindex'?: string;
  'width'?: string;
  'x'?: number | string;
  'xlink:href'?: string;
  'xlink:title'?: string;
  'xml:space'?: "default" | "preserve";
  'y'?: number | string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type VarAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type VideoAttributes = {
  'autoplay'?: boolean;
  'controls'?: boolean;
  'crossorigin'?: "anonymous" | "use-credentials";
  'height'?: string;
  'loop'?: boolean;
  'muted'?: boolean;
  'playsinline'?: boolean;
  'poster'?: string;
  'preload'?: "none" | "metadata" | "auto";
  'src'?: string;
  'width'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type ViewAttributes = {
  'autofocus'?: boolean;
  'class'?: string;
  'id'?: string;
  'lang'?: string;
  'oncancel'?: string;
  'oncanplay'?: string;
  'oncanplaythrough'?: string;
  'onchange'?: string;
  'onclick'?: string;
  'onclose'?: string;
  'oncopy'?: string;
  'oncuechange'?: string;
  'oncut'?: string;
  'ondblclick'?: string;
  'ondrag'?: string;
  'ondragend'?: string;
  'ondragenter'?: string;
  'ondragexit'?: string;
  'ondragleave'?: string;
  'ondragover'?: string;
  'ondragstart'?: string;
  'ondrop'?: string;
  'ondurationchange'?: string;
  'onemptied'?: string;
  'onended'?: string;
  'onerror'?: string;
  'onfocus'?: string;
  'oninput'?: string;
  'oninvalid'?: string;
  'onkeydown'?: string;
  'onkeypress'?: string;
  'onkeyup'?: string;
  'onload'?: string;
  'onloadeddata'?: string;
  'onloadedmetadata'?: string;
  'onloadstart'?: string;
  'onmousedown'?: string;
  'onmouseenter'?: string;
  'onmouseleave'?: string;
  'onmousemove'?: string;
  'onmouseout'?: string;
  'onmouseover'?: string;
  'onmouseup'?: string;
  'onpaste'?: string;
  'onpause'?: string;
  'onplay'?: string;
  'onplaying'?: string;
  'onprogress'?: string;
  'onratechange'?: string;
  'onreset'?: string;
  'onresize'?: string;
  'onscroll'?: string;
  'onseeked'?: string;
  'onseeking'?: string;
  'onselect'?: string;
  'onshow'?: string;
  'onstalled'?: string;
  'onsubmit'?: string;
  'onsuspend'?: string;
  'ontimeupdate'?: string;
  'ontoggle'?: string;
  'onvolumechange'?: string;
  'onwaiting'?: string;
  'onwheel'?: string;
  'preserveAspectRatio'?: string;
  'role'?: string;
  'style'?: string;
  'tabindex'?: string;
  'viewBox'?: string;
  'xml:space'?: string;
} & NameSpaceAttributes & GlobalAttributes & GlobalEvents;

type WbrAttributes = NameSpaceAttributes & GlobalAttributes & GlobalEvents;

export const globalAttributes: GlobalAttributes;
export const globalEvents: GlobalEvents;
export const aAttributes: AAttributes
export const abbrAttributes: AbbrAttributes
export const addressAttributes: AddressAttributes
export const animateAttributes: AnimateAttributes
export const animateMotionAttributes: AnimateMotionAttributes
export const animateTransformAttributes: AnimateTransformAttributes
export const areaAttributes: AreaAttributes
export const articleAttributes: ArticleAttributes
export const asideAttributes: AsideAttributes
export const audioAttributes: AudioAttributes
export const bAttributes: BAttributes
export const baseAttributes: BaseAttributes
export const bdiAttributes: BdiAttributes
export const bdoAttributes: BdoAttributes
export const blockquoteAttributes: BlockquoteAttributes
export const bodyAttributes: BodyAttributes
export const brAttributes: BrAttributes
export const buttonAttributes: ButtonAttributes
export const canvasAttributes: CanvasAttributes
export const captionAttributes: CaptionAttributes
export const circleAttributes: CircleAttributes
export const citeAttributes: CiteAttributes
export const clipPathAttributes: ClipPathAttributes
export const codeAttributes: CodeAttributes
export const colAttributes: ColAttributes
export const colgroupAttributes: ColgroupAttributes
export const dataAttributes: DataAttributes
export const datalistAttributes: DatalistAttributes
export const ddAttributes: DdAttributes
export const defsAttributes: DefsAttributes
export const delAttributes: DelAttributes
export const descAttributes: DescAttributes
export const detailsAttributes: DetailsAttributes
export const dfnAttributes: DfnAttributes
export const dialogAttributes: DialogAttributes
export const discardAttributes: DiscardAttributes
export const divAttributes: DivAttributes
export const dlAttributes: DlAttributes
export const dtAttributes: DtAttributes
export const ellipseAttributes: EllipseAttributes
export const emAttributes: EmAttributes
export const embedAttributes: EmbedAttributes
export const fieldsetAttributes: FieldsetAttributes
export const figcaptionAttributes: FigcaptionAttributes
export const figureAttributes: FigureAttributes
export const footerAttributes: FooterAttributes
export const foreignObjectAttributes: ForeignObjectAttributes
export const formAttributes: FormAttributes
export const gAttributes: GAttributes
export const h1Attributes: H1Attributes
export const h2Attributes: H2Attributes
export const h3Attributes: H3Attributes
export const h4Attributes: H4Attributes
export const h5Attributes: H5Attributes
export const h6Attributes: H6Attributes
export const headAttributes: HeadAttributes
export const headerAttributes: HeaderAttributes
export const hgroupAttributes: HgroupAttributes
export const hrAttributes: HrAttributes
export const htmlAttributes: HtmlAttributes
export const iAttributes: IAttributes
export const iframeAttributes: IframeAttributes
export const imageAttributes: ImageAttributes
export const imgAttributes: ImgAttributes
export const inputAttributes: InputAttributes
export const insAttributes: InsAttributes
export const kbdAttributes: KbdAttributes
export const labelAttributes: LabelAttributes
export const legendAttributes: LegendAttributes
export const liAttributes: LiAttributes
export const lineAttributes: LineAttributes
export const linearGradientAttributes: LinearGradientAttributes
export const linkAttributes: LinkAttributes
export const mainAttributes: MainAttributes
export const mapAttributes: MapAttributes
export const markAttributes: MarkAttributes
export const markerAttributes: MarkerAttributes
export const maskAttributes: MaskAttributes
export const menuAttributes: MenuAttributes
export const metaAttributes: MetaAttributes
export const metadataAttributes: MetadataAttributes
export const meterAttributes: MeterAttributes
export const mpathAttributes: MpathAttributes
export const navAttributes: NavAttributes
export const noscriptAttributes: NoscriptAttributes
export const objectAttributes: ObjectAttributes
export const olAttributes: OlAttributes
export const optgroupAttributes: OptgroupAttributes
export const optionAttributes: OptionAttributes
export const outputAttributes: OutputAttributes
export const pAttributes: PAttributes
export const pathAttributes: PathAttributes
export const patternAttributes: PatternAttributes
export const pictureAttributes: PictureAttributes
export const polygonAttributes: PolygonAttributes
export const polylineAttributes: PolylineAttributes
export const preAttributes: PreAttributes
export const progressAttributes: ProgressAttributes
export const qAttributes: QAttributes
export const radialGradientAttributes: RadialGradientAttributes
export const rectAttributes: RectAttributes
export const rpAttributes: RpAttributes
export const rtAttributes: RtAttributes
export const rubyAttributes: RubyAttributes
export const sAttributes: SAttributes
export const sampAttributes: SampAttributes
export const scriptAttributes: ScriptAttributes
export const searchAttributes: SearchAttributes
export const sectionAttributes: SectionAttributes
export const selectAttributes: SelectAttributes
export const selectedcontentAttributes: SelectedcontentAttributes
export const setAttributes: SetAttributes
export const slotAttributes: SlotAttributes
export const smallAttributes: SmallAttributes
export const sourceAttributes: SourceAttributes
export const spanAttributes: SpanAttributes
export const stopAttributes: StopAttributes
export const strongAttributes: StrongAttributes
export const styleAttributes: StyleAttributes
export const subAttributes: SubAttributes
export const summaryAttributes: SummaryAttributes
export const supAttributes: SupAttributes
export const svgAttributes: SvgAttributes
export const switchAttributes: SwitchAttributes
export const symbolAttributes: SymbolAttributes
export const tableAttributes: TableAttributes
export const tbodyAttributes: TbodyAttributes
export const tdAttributes: TdAttributes
export const templateAttributes: TemplateAttributes
export const textAttributes: TextAttributes
export const textareaAttributes: TextareaAttributes
export const textPathAttributes: TextPathAttributes
export const tfootAttributes: TfootAttributes
export const thAttributes: ThAttributes
export const theadAttributes: TheadAttributes
export const timeAttributes: TimeAttributes
export const titleAttributes: TitleAttributes
export const trAttributes: TrAttributes
export const trackAttributes: TrackAttributes
export const tspanAttributes: TspanAttributes
export const uAttributes: UAttributes
export const ulAttributes: UlAttributes
export const useAttributes: UseAttributes
export const varAttributes: VarAttributes
export const videoAttributes: VideoAttributes
export const viewAttributes: ViewAttributes
export const wbrAttributes: WbrAttributes

type ContentType = ContentTag | VoidTag | SvgVoidTag | LiteralTag | string;
export type Content = ContentType | ContentType[];
type UniversalAttributes = NameSpaceAttributes | GlobalAttributes | GlobalEvents;
type CustomTagArguments<T = null> = [attributes?: T | UniversalAttributes, content?: Content] | [content: Content];
export type ContentMethod<T = null> = (...args: CustomTagArguments<T>) => ContentTag;
type PrimitiveConstructor = StringConstructor | NumberConstructor | BooleanConstructor;
type Primitive = string | number | boolean;
type AttributeValue = PrimitiveConstructor | Primitive | (PrimitiveConstructor | Primitive)[];

export default class Kensington {
  constructor(options?: { additionalNamespaces?: string | string[], runValidation?: boolean });

  createCustomTag(
    tagName: string,
    allowedAttributes?: Record<string,  AttributeValue>
  ): (...args: CustomTagArguments) => ContentTag

  literal(str: string): LiteralTag

  unsafeLiteral(str: string): LiteralTag
  
  htmlWithDocType(attributes: HtmlAttributes, content?: Content): ContentTag;
  htmlWithDocType(content?: Content): ContentTag;

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
  body(attributes: BodyAttributes, content?: Content): ContentTag;
  body(content?: Content): ContentTag;
  br(attributes?: BrAttributes): VoidTag;
  button(attributes: ButtonAttributes, content?: Content): ContentTag;
  button(content?: Content): ContentTag;
  canvas(attributes: CanvasAttributes, content?: Content): ContentTag;
  canvas(content?: Content): ContentTag;
  caption(attributes: CaptionAttributes, content?: Content): ContentTag;
  caption(content?: Content): ContentTag;
  circle(attributes: CircleAttributes, content?: Content): ContentTag;
  circle(content?: Content): ContentTag;
  cite(attributes: CiteAttributes, content?: Content): ContentTag;
  cite(content?: Content): ContentTag;
  clipPath(attributes: ClipPathAttributes, content?: Content): ContentTag;
  clipPath(content?: Content): ContentTag;
  code(attributes: CodeAttributes, content?: Content): ContentTag;
  code(content?: Content): ContentTag;
  col(attributes?: ColAttributes): VoidTag;
  colgroup(attributes: ColgroupAttributes, content?: Content): ContentTag;
  colgroup(content?: Content): ContentTag;
  data(attributes: DataAttributes, content?: Content): ContentTag;
  data(content?: Content): ContentTag;
  datalist(attributes: DatalistAttributes, content?: Content): ContentTag;
  datalist(content?: Content): ContentTag;
  dd(attributes: DdAttributes, content?: Content): ContentTag;
  dd(content?: Content): ContentTag;
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
  discard(attributes: DiscardAttributes, content?: Content): ContentTag;
  discard(content?: Content): ContentTag;
  div(attributes: DivAttributes, content?: Content): ContentTag;
  div(content?: Content): ContentTag;
  dl(attributes: DlAttributes, content?: Content): ContentTag;
  dl(content?: Content): ContentTag;
  dt(attributes: DtAttributes, content?: Content): ContentTag;
  dt(content?: Content): ContentTag;
  ellipse(attributes: EllipseAttributes, content?: Content): ContentTag;
  ellipse(content?: Content): ContentTag;
  em(attributes: EmAttributes, content?: Content): ContentTag;
  em(content?: Content): ContentTag;
  embed(attributes?: EmbedAttributes): VoidTag;
  fieldset(attributes: FieldsetAttributes, content?: Content): ContentTag;
  fieldset(content?: Content): ContentTag;
  figcaption(attributes: FigcaptionAttributes, content?: Content): ContentTag;
  figcaption(content?: Content): ContentTag;
  figure(attributes: FigureAttributes, content?: Content): ContentTag;
  figure(content?: Content): ContentTag;
  footer(attributes: FooterAttributes, content?: Content): ContentTag;
  footer(content?: Content): ContentTag;
  foreignObject(attributes: ForeignObjectAttributes, content?: Content): ContentTag;
  foreignObject(content?: Content): ContentTag;
  form(attributes: FormAttributes, content?: Content): ContentTag;
  form(content?: Content): ContentTag;
  g(attributes: GAttributes, content?: Content): ContentTag;
  g(content?: Content): ContentTag;
  h1(attributes: H1Attributes, content?: Content): ContentTag;
  h1(content?: Content): ContentTag;
  h2(attributes: H2Attributes, content?: Content): ContentTag;
  h2(content?: Content): ContentTag;
  h3(attributes: H3Attributes, content?: Content): ContentTag;
  h3(content?: Content): ContentTag;
  h4(attributes: H4Attributes, content?: Content): ContentTag;
  h4(content?: Content): ContentTag;
  h5(attributes: H5Attributes, content?: Content): ContentTag;
  h5(content?: Content): ContentTag;
  h6(attributes: H6Attributes, content?: Content): ContentTag;
  h6(content?: Content): ContentTag;
  head(attributes: HeadAttributes, content?: Content): ContentTag;
  head(content?: Content): ContentTag;
  header(attributes: HeaderAttributes, content?: Content): ContentTag;
  header(content?: Content): ContentTag;
  hgroup(attributes: HgroupAttributes, content?: Content): ContentTag;
  hgroup(content?: Content): ContentTag;
  hr(attributes?: HrAttributes): VoidTag;
  html(attributes: HtmlAttributes, content?: Content): ContentTag;
  html(content?: Content): ContentTag;
  i(attributes: IAttributes, content?: Content): ContentTag;
  i(content?: Content): ContentTag;
  iframe(attributes: IframeAttributes, content?: Content): ContentTag;
  iframe(content?: Content): ContentTag;
  image(attributes: ImageAttributes, content?: Content): ContentTag;
  image(content?: Content): ContentTag;
  img(attributes?: ImgAttributes): VoidTag;
  input(attributes?: InputAttributes): VoidTag;
  ins(attributes: InsAttributes, content?: Content): ContentTag;
  ins(content?: Content): ContentTag;
  kbd(attributes: KbdAttributes, content?: Content): ContentTag;
  kbd(content?: Content): ContentTag;
  label(attributes: LabelAttributes, content?: Content): ContentTag;
  label(content?: Content): ContentTag;
  legend(attributes: LegendAttributes, content?: Content): ContentTag;
  legend(content?: Content): ContentTag;
  li(attributes: LiAttributes, content?: Content): ContentTag;
  li(content?: Content): ContentTag;
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
  menu(attributes: MenuAttributes, content?: Content): ContentTag;
  menu(content?: Content): ContentTag;
  meta(attributes?: MetaAttributes): VoidTag;
  metadata(attributes: MetadataAttributes, content?: Content): ContentTag;
  metadata(content?: Content): ContentTag;
  meter(attributes: MeterAttributes, content?: Content): ContentTag;
  meter(content?: Content): ContentTag;
  mpath(attributes: MpathAttributes, content?: Content): ContentTag;
  mpath(content?: Content): ContentTag;
  nav(attributes: NavAttributes, content?: Content): ContentTag;
  nav(content?: Content): ContentTag;
  noscript(attributes: NoscriptAttributes, content?: Content): ContentTag;
  noscript(content?: Content): ContentTag;
  object(attributes: ObjectAttributes, content?: Content): ContentTag;
  object(content?: Content): ContentTag;
  ol(attributes: OlAttributes, content?: Content): ContentTag;
  ol(content?: Content): ContentTag;
  optgroup(attributes: OptgroupAttributes, content?: Content): ContentTag;
  optgroup(content?: Content): ContentTag;
  option(attributes: OptionAttributes, content?: Content): ContentTag;
  option(content?: Content): ContentTag;
  output(attributes: OutputAttributes, content?: Content): ContentTag;
  output(content?: Content): ContentTag;
  p(attributes: PAttributes, content?: Content): ContentTag;
  p(content?: Content): ContentTag;
  path(attributes: PathAttributes, content?: Content): ContentTag;
  path(content?: Content): ContentTag;
  pattern(attributes: PatternAttributes, content?: Content): ContentTag;
  pattern(content?: Content): ContentTag;
  picture(attributes: PictureAttributes, content?: Content): ContentTag;
  picture(content?: Content): ContentTag;
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
  script(attributes: ScriptAttributes, content?: Content): ContentTag;
  script(content?: Content): ContentTag;
  search(attributes: SearchAttributes, content?: Content): ContentTag;
  search(content?: Content): ContentTag;
  section(attributes: SectionAttributes, content?: Content): ContentTag;
  section(content?: Content): ContentTag;
  select(attributes: SelectAttributes, content?: Content): ContentTag;
  select(content?: Content): ContentTag;
  selectedcontent(attributes?: SelectedcontentAttributes): VoidTag;
  set(attributes: SetAttributes, content?: Content): ContentTag;
  set(content?: Content): ContentTag;
  slot(attributes: SlotAttributes, content?: Content): ContentTag;
  slot(content?: Content): ContentTag;
  small(attributes: SmallAttributes, content?: Content): ContentTag;
  small(content?: Content): ContentTag;
  source(attributes?: SourceAttributes): VoidTag;
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
  table(attributes: TableAttributes, content?: Content): ContentTag;
  table(content?: Content): ContentTag;
  tbody(attributes: TbodyAttributes, content?: Content): ContentTag;
  tbody(content?: Content): ContentTag;
  td(attributes: TdAttributes, content?: Content): ContentTag;
  td(content?: Content): ContentTag;
  template(attributes: TemplateAttributes, content?: Content): ContentTag;
  template(content?: Content): ContentTag;
  text(attributes: TextAttributes, content?: Content): ContentTag;
  text(content?: Content): ContentTag;
  textarea(attributes: TextareaAttributes, content?: Content): ContentTag;
  textarea(content?: Content): ContentTag;
  textPath(attributes: TextPathAttributes, content?: Content): ContentTag;
  textPath(content?: Content): ContentTag;
  tfoot(attributes: TfootAttributes, content?: Content): ContentTag;
  tfoot(content?: Content): ContentTag;
  th(attributes: ThAttributes, content?: Content): ContentTag;
  th(content?: Content): ContentTag;
  thead(attributes: TheadAttributes, content?: Content): ContentTag;
  thead(content?: Content): ContentTag;
  time(attributes: TimeAttributes, content?: Content): ContentTag;
  time(content?: Content): ContentTag;
  title(attributes: TitleAttributes, content?: Content): ContentTag;
  title(content?: Content): ContentTag;
  tr(attributes: TrAttributes, content?: Content): ContentTag;
  tr(content?: Content): ContentTag;
  track(attributes?: TrackAttributes): VoidTag;
  tspan(attributes: TspanAttributes, content?: Content): ContentTag;
  tspan(content?: Content): ContentTag;
  u(attributes: UAttributes, content?: Content): ContentTag;
  u(content?: Content): ContentTag;
  ul(attributes: UlAttributes, content?: Content): ContentTag;
  ul(content?: Content): ContentTag;
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

export const t: InstanceType<typeof Kensington>;
