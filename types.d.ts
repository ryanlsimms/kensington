import ContentTag from './esm/tag-classes/content-tag.js';
import LiteralTag from './esm/tag-classes/literal-tag.js';
import VoidTag from './esm/tag-classes/void-tag.js';
import SvgVoidTag from './esm/tag-classes/svg-void-tag.js';

type NameSpaceAttributes = Record<`${"data" | "aria"}${string}`, string | object>;

type GlobalAttributes = {
  accesskey?: string;
  autocapitalize?: "on" | "off" | "none" | "sentences" | "words" | "characters";
  autocorrect?: "on" | "off";
  autofocus?: boolean;
  class?: string;
  contenteditable?: "true" | "plaintext-only" | "false";
  dir?: "ltr" | "rtl" | "auto";
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
  'shape'?: "circle" | "default" | "poly" | "rect";
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
  'formmethod'?: "get" | "post" | "dialog";
  'formnovalidate'?: boolean;
  'formtarget'?: string;
  'name'?: string;
  'popovertarget'?: string;
  'popovertargetaction'?: "toggle" | "show" | "hide";
  'type'?: "submit" | "reset" | "button";
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
  'enctype'?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
  'method'?: "get" | "post" | "dialog";
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
  'formmethod'?: "get" | "post" | "dialog";
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
  'charset'?: "utf-8";
  'content'?: string;
  'http-equiv'?: "content-type" | "default-style" | "refresh" | "x-ua-compatible" | "content-security-policy";
  'httpEquiv'?: "content-type" | "default-style" | "refresh" | "x-ua-compatible" | "content-security-policy";
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
  'scope'?: "row" | "col" | "rowgroup" | "colgroup";
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

export type Content = ContentTag | VoidTag | SvgVoidTag | LiteralTag | string | (ContentTag | VoidTag | SvgVoidTag | LiteralTag | string)[];
export type AttributesOrContent = Record<string, string | number> | Content;
export type TagArguments<T> = [attributesOrContent?:T | Content, content?: Content];
export type ContentMethod<T> = (...args: TagArguments<T>) => ContentTag;

export default class Kensington {
  constructor(options?: { runValidation?: boolean });
  createCustomTag(
    tagName: string,
    allowedAttributes?: Record<string, StringConstructor | NumberConstructor | string[] | number[]>
  ): (attributesOrContent?: AttributesOrContent, content?: Content) => ContentTag | VoidTag | SvgVoidTag

  literal(str: string): LiteralTag

  unsafeLiteral(str: string): LiteralTag
  
  htmlWithDocType(attributesOrContent?: HtmlAttributes | Content, content?: Content): ContentTag;

  a(attributesOrContent?: AAttributes | Content, content?: Content): ContentTag;
  abbr(attributesOrContent?: AbbrAttributes | Content, content?: Content): ContentTag;
  address(attributesOrContent?: AddressAttributes | Content, content?: Content): ContentTag;
  animate(attributesOrContent?: AnimateAttributes | Content, content?: Content): ContentTag;
  animateMotion(attributesOrContent?: AnimateMotionAttributes | Content, content?: Content): ContentTag;
  animateTransform(attributesOrContent?: AnimateTransformAttributes | Content, content?: Content): ContentTag;
  area(attributesOrContent?: AreaAttributes | Content, content?: Content): VoidTag;
  article(attributesOrContent?: ArticleAttributes | Content, content?: Content): ContentTag;
  aside(attributesOrContent?: AsideAttributes | Content, content?: Content): ContentTag;
  audio(attributesOrContent?: AudioAttributes | Content, content?: Content): ContentTag;
  b(attributesOrContent?: BAttributes | Content, content?: Content): ContentTag;
  base(attributesOrContent?: BaseAttributes | Content, content?: Content): VoidTag;
  bdi(attributesOrContent?: BdiAttributes | Content, content?: Content): ContentTag;
  bdo(attributesOrContent?: BdoAttributes | Content, content?: Content): ContentTag;
  blockquote(attributesOrContent?: BlockquoteAttributes | Content, content?: Content): ContentTag;
  body(attributesOrContent?: BodyAttributes | Content, content?: Content): ContentTag;
  br(attributesOrContent?: BrAttributes | Content, content?: Content): VoidTag;
  button(attributesOrContent?: ButtonAttributes | Content, content?: Content): ContentTag;
  canvas(attributesOrContent?: CanvasAttributes | Content, content?: Content): ContentTag;
  caption(attributesOrContent?: CaptionAttributes | Content, content?: Content): ContentTag;
  circle(attributesOrContent?: CircleAttributes | Content, content?: Content): ContentTag;
  cite(attributesOrContent?: CiteAttributes | Content, content?: Content): ContentTag;
  clipPath(attributesOrContent?: ClipPathAttributes | Content, content?: Content): ContentTag;
  code(attributesOrContent?: CodeAttributes | Content, content?: Content): ContentTag;
  col(attributesOrContent?: ColAttributes | Content, content?: Content): VoidTag;
  colgroup(attributesOrContent?: ColgroupAttributes | Content, content?: Content): ContentTag;
  data(attributesOrContent?: DataAttributes | Content, content?: Content): ContentTag;
  datalist(attributesOrContent?: DatalistAttributes | Content, content?: Content): ContentTag;
  dd(attributesOrContent?: DdAttributes | Content, content?: Content): ContentTag;
  defs(attributesOrContent?: DefsAttributes | Content, content?: Content): ContentTag;
  del(attributesOrContent?: DelAttributes | Content, content?: Content): ContentTag;
  desc(attributesOrContent?: DescAttributes | Content, content?: Content): ContentTag;
  details(attributesOrContent?: DetailsAttributes | Content, content?: Content): ContentTag;
  dfn(attributesOrContent?: DfnAttributes | Content, content?: Content): ContentTag;
  dialog(attributesOrContent?: DialogAttributes | Content, content?: Content): ContentTag;
  discard(attributesOrContent?: DiscardAttributes | Content, content?: Content): ContentTag;
  div(attributesOrContent?: DivAttributes | Content, content?: Content): ContentTag;
  dl(attributesOrContent?: DlAttributes | Content, content?: Content): ContentTag;
  dt(attributesOrContent?: DtAttributes | Content, content?: Content): ContentTag;
  ellipse(attributesOrContent?: EllipseAttributes | Content, content?: Content): ContentTag;
  em(attributesOrContent?: EmAttributes | Content, content?: Content): ContentTag;
  embed(attributesOrContent?: EmbedAttributes | Content, content?: Content): VoidTag;
  fieldset(attributesOrContent?: FieldsetAttributes | Content, content?: Content): ContentTag;
  figcaption(attributesOrContent?: FigcaptionAttributes | Content, content?: Content): ContentTag;
  figure(attributesOrContent?: FigureAttributes | Content, content?: Content): ContentTag;
  footer(attributesOrContent?: FooterAttributes | Content, content?: Content): ContentTag;
  foreignObject(attributesOrContent?: ForeignObjectAttributes | Content, content?: Content): ContentTag;
  form(attributesOrContent?: FormAttributes | Content, content?: Content): ContentTag;
  g(attributesOrContent?: GAttributes | Content, content?: Content): ContentTag;
  h1(attributesOrContent?: H1Attributes | Content, content?: Content): ContentTag;
  h2(attributesOrContent?: H2Attributes | Content, content?: Content): ContentTag;
  h3(attributesOrContent?: H3Attributes | Content, content?: Content): ContentTag;
  h4(attributesOrContent?: H4Attributes | Content, content?: Content): ContentTag;
  h5(attributesOrContent?: H5Attributes | Content, content?: Content): ContentTag;
  h6(attributesOrContent?: H6Attributes | Content, content?: Content): ContentTag;
  head(attributesOrContent?: HeadAttributes | Content, content?: Content): ContentTag;
  header(attributesOrContent?: HeaderAttributes | Content, content?: Content): ContentTag;
  hgroup(attributesOrContent?: HgroupAttributes | Content, content?: Content): ContentTag;
  hr(attributesOrContent?: HrAttributes | Content, content?: Content): VoidTag;
  html(attributesOrContent?: HtmlAttributes | Content, content?: Content): ContentTag;
  i(attributesOrContent?: IAttributes | Content, content?: Content): ContentTag;
  iframe(attributesOrContent?: IframeAttributes | Content, content?: Content): ContentTag;
  image(attributesOrContent?: ImageAttributes | Content, content?: Content): ContentTag;
  img(attributesOrContent?: ImgAttributes | Content, content?: Content): VoidTag;
  input(attributesOrContent?: InputAttributes | Content, content?: Content): VoidTag;
  ins(attributesOrContent?: InsAttributes | Content, content?: Content): ContentTag;
  kbd(attributesOrContent?: KbdAttributes | Content, content?: Content): ContentTag;
  label(attributesOrContent?: LabelAttributes | Content, content?: Content): ContentTag;
  legend(attributesOrContent?: LegendAttributes | Content, content?: Content): ContentTag;
  li(attributesOrContent?: LiAttributes | Content, content?: Content): ContentTag;
  line(attributesOrContent?: LineAttributes | Content, content?: Content): ContentTag;
  linearGradient(attributesOrContent?: LinearGradientAttributes | Content, content?: Content): ContentTag;
  link(attributesOrContent?: LinkAttributes | Content, content?: Content): VoidTag;
  main(attributesOrContent?: MainAttributes | Content, content?: Content): ContentTag;
  map(attributesOrContent?: MapAttributes | Content, content?: Content): ContentTag;
  mark(attributesOrContent?: MarkAttributes | Content, content?: Content): ContentTag;
  marker(attributesOrContent?: MarkerAttributes | Content, content?: Content): ContentTag;
  mask(attributesOrContent?: MaskAttributes | Content, content?: Content): ContentTag;
  menu(attributesOrContent?: MenuAttributes | Content, content?: Content): ContentTag;
  meta(attributesOrContent?: MetaAttributes | Content, content?: Content): VoidTag;
  metadata(attributesOrContent?: MetadataAttributes | Content, content?: Content): ContentTag;
  meter(attributesOrContent?: MeterAttributes | Content, content?: Content): ContentTag;
  mpath(attributesOrContent?: MpathAttributes | Content, content?: Content): ContentTag;
  nav(attributesOrContent?: NavAttributes | Content, content?: Content): ContentTag;
  noscript(attributesOrContent?: NoscriptAttributes | Content, content?: Content): ContentTag;
  object(attributesOrContent?: ObjectAttributes | Content, content?: Content): ContentTag;
  ol(attributesOrContent?: OlAttributes | Content, content?: Content): ContentTag;
  optgroup(attributesOrContent?: OptgroupAttributes | Content, content?: Content): ContentTag;
  option(attributesOrContent?: OptionAttributes | Content, content?: Content): ContentTag;
  output(attributesOrContent?: OutputAttributes | Content, content?: Content): ContentTag;
  p(attributesOrContent?: PAttributes | Content, content?: Content): ContentTag;
  path(attributesOrContent?: PathAttributes | Content, content?: Content): ContentTag;
  pattern(attributesOrContent?: PatternAttributes | Content, content?: Content): ContentTag;
  picture(attributesOrContent?: PictureAttributes | Content, content?: Content): ContentTag;
  polygon(attributesOrContent?: PolygonAttributes | Content, content?: Content): ContentTag;
  polyline(attributesOrContent?: PolylineAttributes | Content, content?: Content): ContentTag;
  pre(attributesOrContent?: PreAttributes | Content, content?: Content): ContentTag;
  progress(attributesOrContent?: ProgressAttributes | Content, content?: Content): ContentTag;
  q(attributesOrContent?: QAttributes | Content, content?: Content): ContentTag;
  radialGradient(attributesOrContent?: RadialGradientAttributes | Content, content?: Content): ContentTag;
  rect(attributesOrContent?: RectAttributes | Content, content?: Content): ContentTag;
  rp(attributesOrContent?: RpAttributes | Content, content?: Content): ContentTag;
  rt(attributesOrContent?: RtAttributes | Content, content?: Content): ContentTag;
  ruby(attributesOrContent?: RubyAttributes | Content, content?: Content): ContentTag;
  s(attributesOrContent?: SAttributes | Content, content?: Content): ContentTag;
  samp(attributesOrContent?: SampAttributes | Content, content?: Content): ContentTag;
  script(attributesOrContent?: ScriptAttributes | Content, content?: Content): ContentTag;
  search(attributesOrContent?: SearchAttributes | Content, content?: Content): ContentTag;
  section(attributesOrContent?: SectionAttributes | Content, content?: Content): ContentTag;
  select(attributesOrContent?: SelectAttributes | Content, content?: Content): ContentTag;
  selectedcontent(attributesOrContent?: SelectedcontentAttributes | Content, content?: Content): VoidTag;
  set(attributesOrContent?: SetAttributes | Content, content?: Content): ContentTag;
  slot(attributesOrContent?: SlotAttributes | Content, content?: Content): ContentTag;
  small(attributesOrContent?: SmallAttributes | Content, content?: Content): ContentTag;
  source(attributesOrContent?: SourceAttributes | Content, content?: Content): VoidTag;
  span(attributesOrContent?: SpanAttributes | Content, content?: Content): ContentTag;
  stop(attributesOrContent?: StopAttributes | Content, content?: Content): ContentTag;
  strong(attributesOrContent?: StrongAttributes | Content, content?: Content): ContentTag;
  style(attributesOrContent?: StyleAttributes | Content, content?: Content): ContentTag;
  sub(attributesOrContent?: SubAttributes | Content, content?: Content): ContentTag;
  summary(attributesOrContent?: SummaryAttributes | Content, content?: Content): ContentTag;
  sup(attributesOrContent?: SupAttributes | Content, content?: Content): ContentTag;
  svg(attributesOrContent?: SvgAttributes | Content, content?: Content): ContentTag;
  switch(attributesOrContent?: SwitchAttributes | Content, content?: Content): ContentTag;
  symbol(attributesOrContent?: SymbolAttributes | Content, content?: Content): ContentTag;
  table(attributesOrContent?: TableAttributes | Content, content?: Content): ContentTag;
  tbody(attributesOrContent?: TbodyAttributes | Content, content?: Content): ContentTag;
  td(attributesOrContent?: TdAttributes | Content, content?: Content): ContentTag;
  template(attributesOrContent?: TemplateAttributes | Content, content?: Content): ContentTag;
  text(attributesOrContent?: TextAttributes | Content, content?: Content): ContentTag;
  textarea(attributesOrContent?: TextareaAttributes | Content, content?: Content): ContentTag;
  textPath(attributesOrContent?: TextPathAttributes | Content, content?: Content): ContentTag;
  tfoot(attributesOrContent?: TfootAttributes | Content, content?: Content): ContentTag;
  th(attributesOrContent?: ThAttributes | Content, content?: Content): ContentTag;
  thead(attributesOrContent?: TheadAttributes | Content, content?: Content): ContentTag;
  time(attributesOrContent?: TimeAttributes | Content, content?: Content): ContentTag;
  title(attributesOrContent?: TitleAttributes | Content, content?: Content): ContentTag;
  tr(attributesOrContent?: TrAttributes | Content, content?: Content): ContentTag;
  track(attributesOrContent?: TrackAttributes | Content, content?: Content): VoidTag;
  tspan(attributesOrContent?: TspanAttributes | Content, content?: Content): ContentTag;
  u(attributesOrContent?: UAttributes | Content, content?: Content): ContentTag;
  ul(attributesOrContent?: UlAttributes | Content, content?: Content): ContentTag;
  use(attributesOrContent?: UseAttributes | Content, content?: Content): ContentTag;
  var(attributesOrContent?: VarAttributes | Content, content?: Content): ContentTag;
  video(attributesOrContent?: VideoAttributes | Content, content?: Content): ContentTag;
  view(attributesOrContent?: ViewAttributes | Content, content?: Content): ContentTag;
  wbr(attributesOrContent?: WbrAttributes | Content, content?: Content): VoidTag;
}

export const t: InstanceType<typeof Kensington>;
