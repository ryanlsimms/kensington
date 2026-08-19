function cloneAttributeValidators(...attributeMaps) {
  const cloned = {};
  for (const attributeMap of attributeMaps) {
    for (const [name, validator] of Object.entries(attributeMap)) {
      cloned[name] = Array.isArray(validator) ? [...validator] : validator;
    }
  }
  return cloned;
}

export const __slim__ = false;
export const camelCaseNames = [];

export const globalAttributes = {
  'accesskey': String,
  'autocapitalize': ['on', 'off', 'none', 'sentences', 'words', 'characters'],
  'autocorrect': ['on', 'off'],
  'autofocus': Boolean,
  'class': String,
  'contenteditable': ['true', 'false', 'plaintext-only'],
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'draggable': ['true', 'false'],
  'enterkeyhint': ['enter', 'done', 'go', 'next', 'previous', 'search', 'send'],
  'headingoffset': Number,
  'headingreset': Boolean,
  'hidden': ['until-found', 'hidden'],
  'id': String,
  'inert': Boolean,
  'inputmode': ['none', 'text', 'tel', 'email', 'url', 'numeric', 'decimal', 'search'],
  'is': String,
  'itemid': String,
  'itemprop': String,
  'itemref': String,
  'itemscope': Boolean,
  'itemtype': String,
  'lang': String,
  'nonce': String,
  'popover': ['auto', 'manual', 'hint'],
  'role': String,
  'slot': String,
  'spellcheck': ['true', 'false'],
  'style': String,
  'tabindex': Number,
  'title': String,
  'translate': ['yes', 'no'],
  'writingsuggestions': ['true', 'false'],
};

export const globalEvents = {
  'onauxclick': [String, Function],
  'onbeforeinput': [String, Function],
  'onbeforematch': [String, Function],
  'onbeforetoggle': [String, Function],
  'onblur': [String, Function],
  'oncancel': [String, Function],
  'oncanplay': [String, Function],
  'oncanplaythrough': [String, Function],
  'onchange': [String, Function],
  'onclick': [String, Function],
  'onclose': [String, Function],
  'oncommand': [String, Function],
  'oncontextlost': [String, Function],
  'oncontextmenu': [String, Function],
  'oncontextrestored': [String, Function],
  'oncopy': [String, Function],
  'oncuechange': [String, Function],
  'oncut': [String, Function],
  'ondblclick': [String, Function],
  'ondrag': [String, Function],
  'ondragend': [String, Function],
  'ondragenter': [String, Function],
  'ondragleave': [String, Function],
  'ondragover': [String, Function],
  'ondragstart': [String, Function],
  'ondrop': [String, Function],
  'ondurationchange': [String, Function],
  'onemptied': [String, Function],
  'onended': [String, Function],
  'onerror': [String, Function],
  'onfocus': [String, Function],
  'onformdata': [String, Function],
  'oninput': [String, Function],
  'oninvalid': [String, Function],
  'onkeydown': [String, Function],
  'onkeypress': [String, Function],
  'onkeyup': [String, Function],
  'onload': [String, Function],
  'onloadeddata': [String, Function],
  'onloadedmetadata': [String, Function],
  'onloadstart': [String, Function],
  'onmousedown': [String, Function],
  'onmouseenter': [String, Function],
  'onmouseleave': [String, Function],
  'onmousemove': [String, Function],
  'onmouseout': [String, Function],
  'onmouseover': [String, Function],
  'onmouseup': [String, Function],
  'onpaste': [String, Function],
  'onpause': [String, Function],
  'onplay': [String, Function],
  'onplaying': [String, Function],
  'onprogress': [String, Function],
  'onratechange': [String, Function],
  'onreset': [String, Function],
  'onresize': [String, Function],
  'onscroll': [String, Function],
  'onscrollend': [String, Function],
  'onsecuritypolicyviolation': [String, Function],
  'onseeked': [String, Function],
  'onseeking': [String, Function],
  'onselect': [String, Function],
  'onslotchange': [String, Function],
  'onstalled': [String, Function],
  'onsubmit': [String, Function],
  'onsuspend': [String, Function],
  'ontimeupdate': [String, Function],
  'ontoggle': [String, Function],
  'onvolumechange': [String, Function],
  'onwaiting': [String, Function],
  'onwheel': [String, Function],
};
export const svgGlobalAttributes = {
  'autofocus': Boolean,
  'class': String,
  'id': String,
  'lang': String,
  'role': String,
  'style': String,
  'tabindex': Number,
  'xml:base': String,
  'xml:lang': String,
  'xml:space': ['default', 'preserve'],
};
export const svgGlobalEvents = {
  'ondragexit': [String, Function],
  'onshow': [String, Function],
};
export const svgConditionalAttributes = {
  'requiredExtensions': String,
  'systemLanguage': String,
};
export const svgXLinkAttributes = {
  'xlink:href': String,
  'xlink:title': String,
};

export const svgPresentationAttributes = {
  'alignment-baseline': ['baseline', 'text-bottom', 'alphabetic', 'ideographic', 'middle', 'central', 'mathematical', 'hanging', 'text-top'],
  'baseline-shift': [Number, String],
  'clip-path': String,
  'clip-rule': ['nonzero', 'evenodd'],
  'color': String,
  'color-interpolation': ['auto', 'sRGB', 'linearRGB'],
  'color-interpolation-filters': ['auto', 'sRGB', 'linearRGB'],
  'cursor': String,
  'direction': ['ltr', 'rtl'],
  'display': String,
  'dominant-baseline': ['auto', 'text-bottom', 'alphabetic', 'ideographic', 'middle', 'central', 'mathematical', 'hanging', 'text-top'],
  'fill': String,
  'fill-opacity': [Number, String],
  'fill-rule': ['nonzero', 'evenodd'],
  'filter': String,
  'flood-color': String,
  'flood-opacity': [Number, String],
  'font-family': String,
  'font-size': [Number, String],
  'font-size-adjust': [Number, String],
  'font-stretch': [Number, String],
  'font-style': String,
  'font-variant': String,
  'font-weight': [Number, String],
  'glyph-orientation-vertical': String,
  'image-rendering': ['auto', 'smooth', 'high-quality', 'pixelated', 'crisp-edges'],
  'letter-spacing': [Number, String],
  'lighting-color': String,
  'marker-end': String,
  'marker-mid': String,
  'marker-start': String,
  'mask': String,
  'mask-type': ['luminance', 'alpha'],
  'opacity': [Number, String],
  'overflow': ['visible', 'hidden', 'clip', 'scroll', 'auto'],
  'paint-order': ['normal', 'fill', 'stroke', 'markers'],
  'pointer-events': ['auto', 'bounding-box', 'visiblePainted', 'visibleFill', 'visibleStroke', 'visible', 'painted', 'fill', 'stroke', 'all', 'none'],
  'shape-rendering': ['auto', 'optimizeSpeed', 'crispEdges', 'geometricPrecision'],
  'stop-color': String,
  'stop-opacity': [Number, String],
  'stroke': String,
  'stroke-dasharray': [Number, String],
  'stroke-dashoffset': [Number, String],
  'stroke-linecap': ['butt', 'round', 'square'],
  'stroke-linejoin': ['crop', 'arcs', 'miter', 'bevel', 'round', 'fallback'],
  'stroke-miterlimit': [Number, String],
  'stroke-opacity': [Number, String],
  'stroke-width': [Number, String],
  'text-anchor': ['start', 'middle', 'end'],
  'text-decoration': String,
  'text-overflow': String,
  'text-rendering': ['auto', 'optimizeSpeed', 'optimizeLegibility', 'geometricPrecision'],
  'transform': String,
  'transform-origin': [Number, String],
  'unicode-bidi': ['normal', 'embed', 'isolate', 'bidi-override', 'isolate-override', 'plaintext'],
  'vector-effect': ['none', 'non-scaling-stroke', 'non-scaling-size', 'non-rotation', 'fixed-position'],
  'visibility': ['visible', 'hidden', 'force-hidden', 'collapse'],
  'white-space': ['normal', 'pre', 'pre-wrap', 'pre-line', 'collapse', 'discard', 'preserve', 'preserve-breaks', 'preserve-spaces', 'break-spaces', 'wrap', 'nowrap', 'none', 'discard-before', 'discard-after', 'discard-inner'],
  'word-spacing': [Number, String],
  'writing-mode': ['horizontal-tb', 'vertical-rl', 'vertical-lr', 'sideways-rl', 'sideways-lr'],
};

export const aAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
    svgXLinkAttributes,
  ),
  'download': String,
  'href': String,
  'hreflang': String,
  'ping': String,
  'referrerpolicy': String,
  'rel': String,
  'target': String,
  'type': String,
};
export const abbrAttributes = {};
export const addressAttributes = {};
export const animateAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'accumulate': ['none', 'sum'],
  'additive': ['replace', 'sum'],
  'attributeName': String,
  'begin': String,
  'by': String,
  'calcMode': ['discrete', 'linear', 'paced', 'spline'],
  'dur': String,
  'end': String,
  'fill': ['remove', 'freeze'],
  'from': String,
  'href': String,
  'keySplines': String,
  'keyTimes': String,
  'max': String,
  'min': String,
  'onbegin': [String, Function],
  'onend': [String, Function],
  'onrepeat': [String, Function],
  'repeatCount': String,
  'repeatDur': String,
  'restart': ['always', 'never', 'whenNotActive'],
  'to': String,
  'values': String,
};
export const animateMotionAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'accumulate': ['none', 'sum'],
  'additive': ['replace', 'sum'],
  'begin': String,
  'by': String,
  'calcMode': ['discrete', 'linear', 'paced', 'spline'],
  'dur': String,
  'end': String,
  'fill': ['remove', 'freeze'],
  'from': String,
  'href': String,
  'keyPoints': String,
  'keySplines': String,
  'keyTimes': String,
  'max': String,
  'min': String,
  'onbegin': [String, Function],
  'onend': [String, Function],
  'onrepeat': [String, Function],
  'origin': String,
  'path': String,
  'repeatCount': String,
  'repeatDur': String,
  'restart': ['always', 'never', 'whenNotActive'],
  'rotate': String,
  'to': String,
  'values': String,
};
export const animateTransformAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'accumulate': ['none', 'sum'],
  'additive': ['replace', 'sum'],
  'attributeName': String,
  'begin': String,
  'by': String,
  'calcMode': ['discrete', 'linear', 'paced', 'spline'],
  'dur': String,
  'end': String,
  'fill': ['remove', 'freeze'],
  'from': String,
  'href': String,
  'keySplines': String,
  'keyTimes': String,
  'max': String,
  'min': String,
  'onbegin': [String, Function],
  'onend': [String, Function],
  'onrepeat': [String, Function],
  'repeatCount': String,
  'repeatDur': String,
  'restart': ['always', 'never', 'whenNotActive'],
  'to': String,
  'type': ['translate', 'scale', 'rotate', 'skewX', 'skewY'],
  'values': String,
};
export const annotationAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const annotationXmlAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'encoding': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const areaAttributes = {
  'alt': String,
  'coords': String,
  'download': String,
  'href': String,
  'ping': String,
  'referrerpolicy': String,
  'rel': String,
  'shape': ['circle', 'CIRCLE', 'default', 'DEFAULT', 'poly', 'POLY', 'rect', 'RECT'],
  'target': String,
};
export const articleAttributes = {};
export const asideAttributes = {};
export const audioAttributes = {
  'autoplay': Boolean,
  'controls': Boolean,
  'crossorigin': ['anonymous', 'use-credentials'],
  'loading': ['lazy', 'eager'],
  'loop': Boolean,
  'muted': Boolean,
  'preload': ['none', 'metadata', 'auto'],
  'src': String,
};
export const bAttributes = {};
export const baseAttributes = {
  'href': String,
  'target': String,
};
export const bdiAttributes = {};
export const bdoAttributes = {};
export const blockquoteAttributes = {
  'cite': String,
};
export const bodyAttributes = {
  'onafterprint': [String, Function],
  'onbeforeprint': [String, Function],
  'onbeforeunload': [String, Function],
  'onhashchange': [String, Function],
  'onlanguagechange': [String, Function],
  'onmessage': [String, Function],
  'onmessageerror': [String, Function],
  'onoffline': [String, Function],
  'ononline': [String, Function],
  'onpagehide': [String, Function],
  'onpagereveal': [String, Function],
  'onpageshow': [String, Function],
  'onpageswap': [String, Function],
  'onpopstate': [String, Function],
  'onrejectionhandled': [String, Function],
  'onstorage': [String, Function],
  'onunhandledrejection': [String, Function],
  'onunload': [String, Function],
};
export const brAttributes = {};
export const buttonAttributes = {
  'command': String,
  'commandfor': String,
  'disabled': Boolean,
  'form': String,
  'formaction': String,
  'formenctype': ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'],
  'formmethod': ['get', 'GET', 'post', 'POST', 'dialog', 'DIALOG'],
  'formnovalidate': Boolean,
  'formtarget': String,
  'name': String,
  'popovertarget': String,
  'popovertargetaction': ['toggle', 'show', 'hide'],
  'type': ['submit', 'SUBMIT', 'reset', 'RESET', 'button', 'BUTTON'],
  'value': [Number, String],
};
export const canvasAttributes = {
  'height': Number,
  'width': Number,
};
export const captionAttributes = {};
export const circleAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'cx': [Number, String],
  'cy': [Number, String],
  'pathLength': Number,
  'r': [Number, String],
};
export const citeAttributes = {};
export const clipPathAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'externalResourcesRequired': [true, false],
  'requiredFeatures': String,
};
export const codeAttributes = {};
export const colAttributes = {
  'span': Number,
};
export const colgroupAttributes = {
  'span': Number,
};
export const dataAttributes = {
  'value': [Number, String],
};
export const datalistAttributes = {};
export const ddAttributes = {};
export const defsAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const delAttributes = {
  'cite': String,
  'datetime': String,
};
export const descAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const detailsAttributes = {
  'name': String,
  'open': Boolean,
};
export const dfnAttributes = {};
export const dialogAttributes = {
  'open': Boolean,
};
export const divAttributes = {};
export const dlAttributes = {};
export const dtAttributes = {};
export const ellipseAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'cx': [Number, String],
  'cy': [Number, String],
  'pathLength': Number,
  'rx': [Number, String],
  'ry': [Number, String],
};
export const emAttributes = {};
export const embedAttributes = {
  'height': Number,
  'src': String,
  'type': String,
  'width': Number,
};
export const feBlendAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feColorMatrixAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feComponentTransferAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feCompositeAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feConvolveMatrixAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feDiffuseLightingAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feDisplacementMapAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feDistantLightAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feDropShadowAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feFloodAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feFuncAAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feFuncBAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feFuncGAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feFuncRAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feGaussianBlurAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feImageAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
  'externalResourcesRequired': [true, false],
};
export const feMergeAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feMergeNodeAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feMorphologyAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feOffsetAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const fePointLightAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feSpecularLightingAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feSpotLightAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feTileAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const feTurbulenceAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const fieldsetAttributes = {
  'disabled': Boolean,
  'form': String,
  'name': String,
};
export const figcaptionAttributes = {};
export const figureAttributes = {};
export const filterAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
  'externalResourcesRequired': [true, false],
};
export const footerAttributes = {};
export const foreignObjectAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'height': [Number, String],
  'width': [Number, String],
  'x': [Number, String],
  'y': [Number, String],
};
export const formAttributes = {
  'accept-charset': String,
  'action': String,
  'autocomplete': ['on', 'off'],
  'enctype': ['application/x-www-form-urlencoded', 'APPLICATION/X-WWW-FORM-URLENCODED', 'multipart/form-data', 'MULTIPART/FORM-DATA', 'text/plain', 'TEXT/PLAIN'],
  'method': ['get', 'GET', 'post', 'POST', 'dialog', 'DIALOG'],
  'name': String,
  'novalidate': Boolean,
  'rel': String,
  'target': String,
};
export const gAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
};
export const h1Attributes = {};
export const h2Attributes = {};
export const h3Attributes = {};
export const h4Attributes = {};
export const h5Attributes = {};
export const h6Attributes = {};
export const headAttributes = {};
export const headerAttributes = {};
export const hgroupAttributes = {};
export const hrAttributes = {};
export const htmlAttributes = {};
export const iAttributes = {};
export const iframeAttributes = {
  'allow': String,
  'allowfullscreen': Boolean,
  'height': Number,
  'loading': ['lazy', 'eager'],
  'name': String,
  'referrerpolicy': String,
  'sandbox': String,
  'src': String,
  'srcdoc': String,
  'width': Number,
};
export const imageAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
    svgXLinkAttributes,
  ),
  'crossorigin': ['anonymous', 'use-credentials'],
  'height': [Number, String],
  'href': String,
  'preserveAspectRatio': String,
  'width': [Number, String],
  'x': [Number, String],
  'y': [Number, String],
};
export const imgAttributes = {
  'alt': String,
  'controls': Boolean,
  'crossorigin': ['anonymous', 'use-credentials'],
  'decoding': ['sync', 'async', 'auto'],
  'fetchpriority': ['auto', 'high', 'low'],
  'height': Number,
  'ismap': Boolean,
  'loading': ['lazy', 'eager'],
  'referrerpolicy': String,
  'sizes': String,
  'src': String,
  'srcset': String,
  'usemap': String,
  'width': Number,
};
export const inputAttributes = {
  'accept': String,
  'alpha': Boolean,
  'alt': String,
  'autocomplete': String,
  'checked': Boolean,
  'colorspace': ['limited-srgb', 'display-p3'],
  'dirname': String,
  'disabled': Boolean,
  'form': String,
  'formaction': String,
  'formenctype': ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'],
  'formmethod': ['get', 'GET', 'post', 'POST', 'dialog', 'DIALOG'],
  'formnovalidate': Boolean,
  'formtarget': String,
  'height': Number,
  'list': String,
  'max': String,
  'maxlength': Number,
  'min': String,
  'minlength': Number,
  'multiple': Boolean,
  'name': String,
  'pattern': String,
  'placeholder': String,
  'popovertarget': String,
  'popovertargetaction': ['toggle', 'show', 'hide'],
  'readonly': Boolean,
  'required': Boolean,
  'size': Number,
  'src': String,
  'step': [Number, String],
  'type': ['hidden', 'text', 'search', 'tel', 'url', 'email', 'password', 'date', 'month', 'week', 'time', 'datetime-local', 'number', 'range', 'color', 'checkbox', 'radio', 'file', 'submit', 'image', 'reset', 'button'],
  'value': [Number, String],
  'width': Number,
};
export const insAttributes = {
  'cite': String,
  'datetime': String,
};
export const kbdAttributes = {};
export const labelAttributes = {
  'for': String,
};
export const legendAttributes = {};
export const liAttributes = {
  'value': [Number, String],
};
export const lineAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'pathLength': Number,
  'x1': [Number, String],
  'x2': [Number, String],
  'y1': [Number, String],
  'y2': [Number, String],
};
export const linearGradientAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgXLinkAttributes,
  ),
  'gradientTransform': String,
  'gradientUnits': ['userSpaceOnUse', 'objectBoundingBox'],
  'href': String,
  'spreadMethod': String,
  'x1': [Number, String],
  'x2': [Number, String],
  'y1': [Number, String],
  'y2': [Number, String],
};
export const linkAttributes = {
  'as': String,
  'blocking': String,
  'color': String,
  'crossorigin': ['anonymous', 'use-credentials'],
  'disabled': Boolean,
  'fetchpriority': ['auto', 'high', 'low'],
  'href': String,
  'hreflang': String,
  'imagesizes': String,
  'imagesrcset': String,
  'integrity': String,
  'media': String,
  'referrerpolicy': String,
  'rel': String,
  'sizes': String,
  'type': String,
};
export const mainAttributes = {};
export const mapAttributes = {
  'name': String,
};
export const markAttributes = {};
export const markerAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
  'markerHeight': String,
  'markerUnits': String,
  'markerWidth': String,
  'orient': String,
  'preserveAspectRatio': String,
  'refX': String,
  'refY': String,
  'viewBox': String,
};
export const maskAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'requiredFeatures': String,
};
export const mathAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'display': String,
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
  'xmlns': String,
};
export const mencloseAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'notation': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const menuAttributes = {};
export const merrorAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const metaAttributes = {
  'charset': ['utf-8', 'UTF-8'],
  'content': String,
  'http-equiv': ['content-type', 'CONTENT-TYPE', 'default-style', 'DEFAULT-STYLE', 'refresh', 'REFRESH', 'x-ua-compatible', 'X-UA-COMPATIBLE', 'content-security-policy', 'CONTENT-SECURITY-POLICY'],
  'media': String,
  'name': String,
};
export const metadataAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const meterAttributes = {
  'high': [Number, String],
  'low': [Number, String],
  'max': [Number, String],
  'min': [Number, String],
  'optimum': [Number, String],
  'value': [Number, String],
};
export const mfracAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'linethickness': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const miAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const mmultiscriptsAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const mnAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const moAttributes = {
  'accent': String,
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'fence': String,
  'href': String,
  'id': String,
  'lspace': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'maxsize': String,
  'minsize': String,
  'movablelimits': String,
  'nonce': String,
  'rspace': String,
  'scriptlevel': String,
  'separator': String,
  'stretchy': String,
  'style': String,
  'symmetric': String,
  'tabindex': Number,
};
export const moverAttributes = {
  'accent': String,
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const mpaddedAttributes = {
  'autofocus': Boolean,
  'class': String,
  'depth': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'height': [Number, String],
  'href': String,
  'id': String,
  'lspace': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
  'voffset': String,
  'width': [Number, String],
};
export const mpathAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
  'href': String,
};
export const mphantomAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const mprescriptsAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const mrootAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const mrowAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const msAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const mspaceAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'height': [Number, String],
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
  'width': [Number, String],
};
export const msqrtAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const mstyleAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const msubAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const msubsupAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const msupAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const mtableAttributes = {
  'align': String,
  'autofocus': Boolean,
  'class': String,
  'columnalign': String,
  'columnlines': String,
  'columnspacing': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'frame': String,
  'framespacing': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'rowalign': String,
  'rowlines': String,
  'rowspacing': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
  'width': [Number, String],
};
export const mtdAttributes = {
  'autofocus': Boolean,
  'class': String,
  'columnalign': String,
  'columnspan': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'rowalign': String,
  'rowspan': Number,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const mtextAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const mtrAttributes = {
  'autofocus': Boolean,
  'class': String,
  'columnalign': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'rowalign': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const munderAttributes = {
  'accentunder': String,
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const munderoverAttributes = {
  'accent': String,
  'accentunder': String,
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const navAttributes = {};
export const noscriptAttributes = {};
export const objectAttributes = {
  'data': String,
  'form': String,
  'height': Number,
  'name': String,
  'type': String,
  'width': Number,
};
export const olAttributes = {
  'reversed': Boolean,
  'start': Number,
  'type': ['1', 'a', 'A', 'i', 'I'],
};
export const optgroupAttributes = {
  'disabled': Boolean,
  'label': String,
};
export const optionAttributes = {
  'disabled': Boolean,
  'label': String,
  'selected': Boolean,
  'value': [Number, String],
};
export const outputAttributes = {
  'for': String,
  'form': String,
  'name': String,
};
export const pAttributes = {};
export const pathAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'd': String,
  'pathLength': Number,
};
export const patternAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgXLinkAttributes,
  ),
  'height': [Number, String],
  'href': String,
  'patternContentUnits': String,
  'patternTransform': String,
  'patternUnits': String,
  'preserveAspectRatio': String,
  'viewBox': String,
  'width': [Number, String],
  'x': [Number, String],
  'y': [Number, String],
};
export const pictureAttributes = {};
export const polygonAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'pathLength': Number,
  'points': String,
};
export const polylineAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'pathLength': Number,
  'points': String,
};
export const preAttributes = {};
export const progressAttributes = {
  'max': [Number, String],
  'value': [Number, String],
};
export const qAttributes = {
  'cite': String,
};
export const radialGradientAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgXLinkAttributes,
  ),
  'cx': [Number, String],
  'cy': [Number, String],
  'fr': String,
  'fx': String,
  'fy': String,
  'gradientTransform': String,
  'gradientUnits': ['userSpaceOnUse', 'objectBoundingBox'],
  'href': String,
  'r': [Number, String],
  'spreadMethod': String,
};
export const rectAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'height': [Number, String],
  'pathLength': Number,
  'rx': [Number, String],
  'ry': [Number, String],
  'width': [Number, String],
  'x': [Number, String],
  'y': [Number, String],
};
export const rpAttributes = {};
export const rtAttributes = {};
export const rubyAttributes = {};
export const sAttributes = {};
export const sampAttributes = {};
export const scriptAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgXLinkAttributes,
  ),
  'async': Boolean,
  'blocking': String,
  'crossorigin': ['anonymous', 'use-credentials'],
  'defer': Boolean,
  'fetchpriority': ['auto', 'high', 'low'],
  'href': String,
  'integrity': String,
  'nomodule': Boolean,
  'referrerpolicy': String,
  'src': String,
  'type': String,
  'xml:space': ['preserve'],
};
export const searchAttributes = {};
export const sectionAttributes = {};
export const selectAttributes = {
  'autocomplete': String,
  'disabled': Boolean,
  'form': String,
  'multiple': Boolean,
  'name': String,
  'required': Boolean,
  'size': Number,
};
export const selectedcontentAttributes = {};
export const semanticsAttributes = {
  'autofocus': Boolean,
  'class': String,
  'dir': ['ltr', 'LTR', 'rtl', 'RTL', 'auto', 'AUTO'],
  'displaystyle': String,
  'href': String,
  'id': String,
  'mathbackground': String,
  'mathcolor': String,
  'mathsize': String,
  'nonce': String,
  'scriptlevel': String,
  'style': String,
  'tabindex': Number,
};
export const setAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'attributeName': String,
  'begin': String,
  'dur': String,
  'end': String,
  'fill': ['remove', 'freeze'],
  'href': String,
  'max': String,
  'min': String,
  'onbegin': [String, Function],
  'onend': [String, Function],
  'onrepeat': [String, Function],
  'repeatCount': String,
  'repeatDur': String,
  'restart': ['always', 'never', 'whenNotActive'],
  'to': String,
};
export const slotAttributes = {
  'name': String,
};
export const smallAttributes = {};
export const sourceAttributes = {
  'height': Number,
  'media': String,
  'sizes': String,
  'src': String,
  'srcset': String,
  'type': String,
  'width': Number,
};
export const spanAttributes = {};
export const stopAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
  'offset': Number,
};
export const strongAttributes = {};
export const styleAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
  'blocking': String,
  'media': String,
  'type': String,
};
export const subAttributes = {};
export const summaryAttributes = {};
export const supAttributes = {};
export const svgAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'height': [Number, String],
  'onabort': [String, Function],
  'onunload': [String, Function],
  'preserveAspectRatio': String,
  'viewBox': String,
  'width': [Number, String],
  'x': [Number, String],
  'xmlns': String,
  'y': [Number, String],
};
export const switchAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
};
export const symbolAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
  'height': [Number, String],
  'preserveAspectRatio': String,
  'refX': String,
  'refY': String,
  'viewBox': String,
  'width': [Number, String],
  'x': [Number, String],
  'y': [Number, String],
};
export const tableAttributes = {};
export const tbodyAttributes = {};
export const tdAttributes = {
  'colspan': Number,
  'headers': String,
  'rowspan': Number,
};
export const templateAttributes = {
  'shadowrootclonable': Boolean,
  'shadowrootcustomelementregistry': Boolean,
  'shadowrootdelegatesfocus': Boolean,
  'shadowrootmode': ['open', 'closed'],
  'shadowrootserializable': Boolean,
  'shadowrootslotassignment': ['named', 'manual'],
};
export const textAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'dx': String,
  'dy': String,
  'lengthAdjust': String,
  'rotate': [Number, String],
  'textLength': String,
  'x': [Number, String],
  'y': [Number, String],
};
export const textareaAttributes = {
  'autocomplete': String,
  'cols': Number,
  'dirname': String,
  'disabled': Boolean,
  'form': String,
  'maxlength': Number,
  'minlength': Number,
  'name': String,
  'placeholder': String,
  'readonly': Boolean,
  'required': Boolean,
  'rows': Number,
  'wrap': ['soft', 'hard'],
};
export const textPathAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
    svgXLinkAttributes,
  ),
  'href': String,
  'lengthAdjust': String,
  'method': ['get', 'GET', 'post', 'POST', 'dialog', 'DIALOG'],
  'path': String,
  'side': String,
  'spacing': String,
  'startOffset': String,
  'textLength': String,
};
export const tfootAttributes = {};
export const thAttributes = {
  'abbr': String,
  'colspan': Number,
  'headers': String,
  'rowspan': Number,
  'scope': ['row', 'ROW', 'col', 'COL', 'rowgroup', 'ROWGROUP', 'colgroup', 'COLGROUP'],
};
export const theadAttributes = {};
export const timeAttributes = {
  'datetime': String,
};
export const titleAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
};
export const trAttributes = {};
export const trackAttributes = {
  'default': Boolean,
  'kind': ['subtitles', 'captions', 'descriptions', 'chapters', 'metadata'],
  'label': String,
  'src': String,
  'srclang': String,
};
export const tspanAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
  ),
  'dx': String,
  'dy': String,
  'lengthAdjust': String,
  'rotate': [Number, String],
  'textLength': String,
  'x': [Number, String],
  'y': [Number, String],
};
export const uAttributes = {};
export const ulAttributes = {};
export const useAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
    svgConditionalAttributes,
    svgXLinkAttributes,
  ),
  'height': [Number, String],
  'href': String,
  'width': [Number, String],
  'x': [Number, String],
  'y': [Number, String],
};
export const varAttributes = {};
export const videoAttributes = {
  'autoplay': Boolean,
  'controls': Boolean,
  'crossorigin': ['anonymous', 'use-credentials'],
  'height': Number,
  'loading': ['lazy', 'eager'],
  'loop': Boolean,
  'muted': Boolean,
  'playsinline': Boolean,
  'poster': String,
  'preload': ['none', 'metadata', 'auto'],
  'src': String,
  'width': Number,
};
export const viewAttributes = {
  ...cloneAttributeValidators(
    svgGlobalAttributes,
    globalEvents,
    svgGlobalEvents,
    svgPresentationAttributes,
  ),
  'preserveAspectRatio': String,
  'viewBox': String,
};
export const wbrAttributes = {};
