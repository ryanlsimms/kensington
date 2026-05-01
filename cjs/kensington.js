'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const contentTag = require('./tag-classes/content-tag.js');
const htmlWithDoctypeTag = require('./tag-classes/html-with-doctype-tag.js');
const literalTag = require('./tag-classes/literal-tag.js');
const voidTag = require('./tag-classes/void-tag.js');
const getPrototypeMethods = require('./lib/get-prototype-methods.js');
const attributes = require('./attributes.js');
const textUtils = require('./lib/text-utils.js');
const showInvalid = require('./lib/show-invalid.js');

/**
 * HTML/SVG/MathML template engine. Every tag is a method that accepts optional attributes
 * and/or content, returning a tag object with `.toString()` (HTML string) and `.toElement()` (DOM node).
 *
 * Attribute rules: camelCase keys convert to kebab-case, nested objects flatten,
 * boolean attributes are included/omitted, class accepts a string or string array.
 *
 * @example
 * import { t } from 'kensington';
 * const html = t.div({ class: 'container' }, t.p('hello')).toString();
 */
class Kensington {
  /**
   * @param {object} [options]
   * @param {string | string[]} [options.additionalNamespaces] - Extra attribute namespaces, e.g. `'hx'` for htmx.
   * @param {'off' | 'warn' | 'error'} [options.validationLevel] - Attribute validation behavior.
   * @param {number} [options.indentationLevel] - Spaces per indent level. Default: 2.
   * @param {function} [options.logger] - Function called with warning messages when `validationLevel` is `'warn'`. Default: `console.log`.
   */
  constructor({ 
    additionalNamespaces = [], 
    validationLevel = 'off', 
    indentationLevel = 2, 
    logger = console.log,
  } = {}) {
    getPrototypeMethods.default(this).forEach(key => {
      this[key] = this[key].bind(this);
    });
    this.indentationLevel = indentationLevel;
    this.namespaces = ['data', 'aria'].concat(additionalNamespaces);
    this.validationLevel = validationLevel;
    this.logger = logger;
  }

  /**
   * Creates a method for a custom HTML element. Assign to a class property for typed autocompletion.
   * @param {string} tagName - The HTML tag name, e.g. `'my-card'`.
   * @param {Record<string, *>} [allowedAttributes] - Map of attribute names to allowed value types/literals.
   * @returns {function(...*): ContentTag}
   * @example
   * class MyEngine extends Kensington {
   *   myCard = this.createCustomTag('my-card', { 'card-type': ['primary', 'secondary'] });
   * }
   */
  createCustomTag(tagName, allowedAttributes = {}) {
    const kebabAttributes = Object.fromEntries(Object.entries(allowedAttributes).map(([k,v]) => [textUtils.camelToKebab(k), v]));
    return this.createTag(tagName, kebabAttributes, contentTag.default, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
    });
  }

  createContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, contentTag.default, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
    });
  }

  createMathTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, contentTag.default, {
      includeGlobalAttributes: false,
      includeGlobalEvents: true,
      namespace: 'http://www.w3.org/1998/Math/MathML',
    });
  }

  createLiteralContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, contentTag.default, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
      contentIsLiteral: true,
      encodeContent: !['script', 'style'].includes(tagName),
    });
  }

  createSvgContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, contentTag.default, {
      includeGlobalAttributes: false,
      includeGlobalEvents: true,
      namespace: 'http://www.w3.org/2000/svg',
    });
  }

  createVoidTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, voidTag.default, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
    });
  }

  createTag(tagName, allowedAttributes, Klass, options) {
    const {
      includeGlobalAttributes,
      includeGlobalEvents,
      namespace,
      contentIsLiteral = false,
      encodeContent = true,
    } = options;
    const invalidTypes = Object.values(allowedAttributes).filter(type => {
      return ![String, Number, Boolean].includes(type) && !Array.isArray(type) && typeof type !== 'function';
    });
    if (invalidTypes.length) {
      showInvalid.default(`invalid types for attribute(s): ${invalidTypes.join(', ')} given for ${tagName}`, this.validationLevel, this.logger);
    }

    return (attributesOrContent = null, content, thirdArg) => {
      let attributes$1 = attributesOrContent;

      if (thirdArg) {
        throw new Error(`Too many arguments given for ${tagName}`);
      }

      if (attributesOrContent?.constructor !== Object) {
        if (content) {
          throw new Error(`Invalid arguments given for ${tagName}`);
        }
        attributes$1 = {};
        content = attributesOrContent;
      }
      if (typeof content === 'undefined') {
        content = '';
      }
      if (this.validationLevel !== 'off') {
        if (includeGlobalAttributes) {
          Object.assign(allowedAttributes, attributes.globalAttributes);
        }
        if (includeGlobalEvents) {
          Object.assign(allowedAttributes, attributes.globalEvents);
        }
      }
      const instance = new Klass({
        allowedAttributes,
        attributes: attributes$1,
        content,
        encodeContent,
        indentationLevel: this.indentationLevel,
        logger: this.logger,
        namespace,
        namespaces: this.namespaces,
        contentIsLiteral,
        tagName,
        validationLevel: this.validationLevel,
      });

      if (this.validationLevel !== 'off') {
        instance.validate(this.validationLevel);
      }
      return instance;
    }
  }

  /**
   * Embeds a raw HTML string verbatim in the output. Throws if the string contains a script tag.
   * @param {string} str
   * @returns {LiteralTag}
   * @example
   * t.ul([t.li('typed'), t.literal('<li>raw html</li>')]);
   */
  literal(str) {
    if (str.includes('<script')) {
      throw new Error('<script> tags are not allowed to be passed in literal html.  Use the .unsafeLiteral if you can vouch for the string')
    }
    return new literalTag.default(str);
  }

  /**
   * Like `.literal()` but skips the script-tag check. Use only for trusted HTML.
   * @param {string} str
   * @returns {LiteralTag}
   */
  unsafeLiteral(str) {
    return new literalTag.default(str);
  }

  /** @returns {ContentTag} */
  htmlWithDocType = this.createTag('html', attributes.htmlAttributes, htmlWithDoctypeTag.default, { includeGlobalAttributes: true, includeGlobalEvents: true });

  /** @returns {ContentTag} */
  a = this.createContentTag('a', attributes.aAttributes);
  /** @returns {ContentTag} */
  abbr = this.createContentTag('abbr', attributes.abbrAttributes);
  /** @returns {ContentTag} */
  address = this.createContentTag('address', attributes.addressAttributes);
  /** @returns {ContentTag} */
  animate = this.createSvgContentTag('animate', attributes.animateAttributes);
  /** @returns {ContentTag} */
  animateMotion = this.createSvgContentTag('animateMotion', attributes.animateMotionAttributes);
  /** @returns {ContentTag} */
  animateTransform = this.createSvgContentTag('animateTransform', attributes.animateTransformAttributes);
  /** @returns {ContentTag} */
  annotation = this.createMathTag('annotation', attributes.annotationAttributes);
  /** @returns {ContentTag} */
  annotationXml = this.createMathTag('annotation-xml', attributes.annotationXmlAttributes);
  /** @returns {VoidTag} */
  area = this.createVoidTag('area', attributes.areaAttributes);
  /** @returns {ContentTag} */
  article = this.createContentTag('article', attributes.articleAttributes);
  /** @returns {ContentTag} */
  aside = this.createContentTag('aside', attributes.asideAttributes);
  /** @returns {ContentTag} */
  audio = this.createContentTag('audio', attributes.audioAttributes);
  /** @returns {ContentTag} */
  b = this.createContentTag('b', attributes.bAttributes);
  /** @returns {VoidTag} */
  base = this.createVoidTag('base', attributes.baseAttributes);
  /** @returns {ContentTag} */
  bdi = this.createContentTag('bdi', attributes.bdiAttributes);
  /** @returns {ContentTag} */
  bdo = this.createContentTag('bdo', attributes.bdoAttributes);
  /** @returns {ContentTag} */
  blockquote = this.createContentTag('blockquote', attributes.blockquoteAttributes);
  /** @returns {ContentTag} */
  body = this.createContentTag('body', attributes.bodyAttributes);
  /** @returns {VoidTag} */
  br = this.createVoidTag('br', attributes.brAttributes);
  /** @returns {ContentTag} */
  button = this.createContentTag('button', attributes.buttonAttributes);
  /** @returns {ContentTag} */
  canvas = this.createContentTag('canvas', attributes.canvasAttributes);
  /** @returns {ContentTag} */
  caption = this.createContentTag('caption', attributes.captionAttributes);
  /** @returns {ContentTag} */
  circle = this.createSvgContentTag('circle', attributes.circleAttributes);
  /** @returns {ContentTag} */
  cite = this.createContentTag('cite', attributes.citeAttributes);
  /** @returns {ContentTag} */
  clipPath = this.createSvgContentTag('clipPath', attributes.clipPathAttributes);
  /** @returns {ContentTag} */
  code = this.createContentTag('code', attributes.codeAttributes);
  /** @returns {VoidTag} */
  col = this.createVoidTag('col', attributes.colAttributes);
  /** @returns {ContentTag} */
  colgroup = this.createContentTag('colgroup', attributes.colgroupAttributes);
  /** @returns {ContentTag} */
  data = this.createContentTag('data', attributes.dataAttributes);
  /** @returns {ContentTag} */
  datalist = this.createContentTag('datalist', attributes.datalistAttributes);
  /** @returns {ContentTag} */
  dd = this.createContentTag('dd', attributes.ddAttributes);
  /** @returns {ContentTag} */
  defs = this.createSvgContentTag('defs', attributes.defsAttributes);
  /** @returns {ContentTag} */
  del = this.createContentTag('del', attributes.delAttributes);
  /** @returns {ContentTag} */
  desc = this.createSvgContentTag('desc', attributes.descAttributes);
  /** @returns {ContentTag} */
  details = this.createContentTag('details', attributes.detailsAttributes);
  /** @returns {ContentTag} */
  dfn = this.createContentTag('dfn', attributes.dfnAttributes);
  /** @returns {ContentTag} */
  dialog = this.createContentTag('dialog', attributes.dialogAttributes);
  /** @returns {ContentTag} */
  div = this.createContentTag('div', attributes.divAttributes);
  /** @returns {ContentTag} */
  dl = this.createContentTag('dl', attributes.dlAttributes);
  /** @returns {ContentTag} */
  dt = this.createContentTag('dt', attributes.dtAttributes);
  /** @returns {ContentTag} */
  ellipse = this.createSvgContentTag('ellipse', attributes.ellipseAttributes);
  /** @returns {ContentTag} */
  em = this.createContentTag('em', attributes.emAttributes);
  /** @returns {VoidTag} */
  embed = this.createVoidTag('embed', attributes.embedAttributes);
  /** @returns {ContentTag} */
  feBlend = this.createSvgContentTag('feBlend', attributes.feBlendAttributes);
  /** @returns {ContentTag} */
  feColorMatrix = this.createSvgContentTag('feColorMatrix', attributes.feColorMatrixAttributes);
  /** @returns {ContentTag} */
  feComponentTransfer = this.createSvgContentTag('feComponentTransfer', attributes.feComponentTransferAttributes);
  /** @returns {ContentTag} */
  feComposite = this.createSvgContentTag('feComposite', attributes.feCompositeAttributes);
  /** @returns {ContentTag} */
  feConvolveMatrix = this.createSvgContentTag('feConvolveMatrix', attributes.feConvolveMatrixAttributes);
  /** @returns {ContentTag} */
  feDiffuseLighting = this.createSvgContentTag('feDiffuseLighting', attributes.feDiffuseLightingAttributes);
  /** @returns {ContentTag} */
  feDisplacementMap = this.createSvgContentTag('feDisplacementMap', attributes.feDisplacementMapAttributes);
  /** @returns {ContentTag} */
  feDistantLight = this.createSvgContentTag('feDistantLight', attributes.feDistantLightAttributes);
  /** @returns {ContentTag} */
  feDropShadow = this.createSvgContentTag('feDropShadow', attributes.feDropShadowAttributes);
  /** @returns {ContentTag} */
  feFlood = this.createSvgContentTag('feFlood', attributes.feFloodAttributes);
  /** @returns {ContentTag} */
  feFuncA = this.createSvgContentTag('feFuncA', attributes.feFuncAAttributes);
  /** @returns {ContentTag} */
  feFuncB = this.createSvgContentTag('feFuncB', attributes.feFuncBAttributes);
  /** @returns {ContentTag} */
  feFuncG = this.createSvgContentTag('feFuncG', attributes.feFuncGAttributes);
  /** @returns {ContentTag} */
  feFuncR = this.createSvgContentTag('feFuncR', attributes.feFuncRAttributes);
  /** @returns {ContentTag} */
  feGaussianBlur = this.createSvgContentTag('feGaussianBlur', attributes.feGaussianBlurAttributes);
  /** @returns {ContentTag} */
  feImage = this.createSvgContentTag('feImage', attributes.feImageAttributes);
  /** @returns {ContentTag} */
  feMerge = this.createSvgContentTag('feMerge', attributes.feMergeAttributes);
  /** @returns {ContentTag} */
  feMergeNode = this.createSvgContentTag('feMergeNode', attributes.feMergeNodeAttributes);
  /** @returns {ContentTag} */
  feMorphology = this.createSvgContentTag('feMorphology', attributes.feMorphologyAttributes);
  /** @returns {ContentTag} */
  feOffset = this.createSvgContentTag('feOffset', attributes.feOffsetAttributes);
  /** @returns {ContentTag} */
  fePointLight = this.createSvgContentTag('fePointLight', attributes.fePointLightAttributes);
  /** @returns {ContentTag} */
  feSpecularLighting = this.createSvgContentTag('feSpecularLighting', attributes.feSpecularLightingAttributes);
  /** @returns {ContentTag} */
  feSpotLight = this.createSvgContentTag('feSpotLight', attributes.feSpotLightAttributes);
  /** @returns {ContentTag} */
  feTile = this.createSvgContentTag('feTile', attributes.feTileAttributes);
  /** @returns {ContentTag} */
  feTurbulence = this.createSvgContentTag('feTurbulence', attributes.feTurbulenceAttributes);
  /** @returns {ContentTag} */
  fieldset = this.createContentTag('fieldset', attributes.fieldsetAttributes);
  /** @returns {ContentTag} */
  figcaption = this.createContentTag('figcaption', attributes.figcaptionAttributes);
  /** @returns {ContentTag} */
  figure = this.createContentTag('figure', attributes.figureAttributes);
  /** @returns {ContentTag} */
  filter = this.createSvgContentTag('filter', attributes.filterAttributes);
  /** @returns {ContentTag} */
  footer = this.createContentTag('footer', attributes.footerAttributes);
  /** @returns {ContentTag} */
  foreignObject = this.createSvgContentTag('foreignObject', attributes.foreignObjectAttributes);
  /** @returns {ContentTag} */
  form = this.createContentTag('form', attributes.formAttributes);
  /** @returns {ContentTag} */
  g = this.createSvgContentTag('g', attributes.gAttributes);
  /** @returns {ContentTag} */
  h1 = this.createContentTag('h1', attributes.h1Attributes);
  /** @returns {ContentTag} */
  h2 = this.createContentTag('h2', attributes.h2Attributes);
  /** @returns {ContentTag} */
  h3 = this.createContentTag('h3', attributes.h3Attributes);
  /** @returns {ContentTag} */
  h4 = this.createContentTag('h4', attributes.h4Attributes);
  /** @returns {ContentTag} */
  h5 = this.createContentTag('h5', attributes.h5Attributes);
  /** @returns {ContentTag} */
  h6 = this.createContentTag('h6', attributes.h6Attributes);
  /** @returns {ContentTag} */
  head = this.createContentTag('head', attributes.headAttributes);
  /** @returns {ContentTag} */
  header = this.createContentTag('header', attributes.headerAttributes);
  /** @returns {ContentTag} */
  hgroup = this.createContentTag('hgroup', attributes.hgroupAttributes);
  /** @returns {VoidTag} */
  hr = this.createVoidTag('hr', attributes.hrAttributes);
  /** @returns {ContentTag} */
  html = this.createContentTag('html', attributes.htmlAttributes);
  /** @returns {ContentTag} */
  i = this.createContentTag('i', attributes.iAttributes);
  /** @returns {ContentTag} */
  iframe = this.createContentTag('iframe', attributes.iframeAttributes);
  /** @returns {ContentTag} */
  image = this.createSvgContentTag('image', attributes.imageAttributes);
  /** @returns {VoidTag} */
  img = this.createVoidTag('img', attributes.imgAttributes);
  /** @returns {VoidTag} */
  input = this.createVoidTag('input', attributes.inputAttributes);
  /** @returns {ContentTag} */
  ins = this.createContentTag('ins', attributes.insAttributes);
  /** @returns {ContentTag} */
  kbd = this.createContentTag('kbd', attributes.kbdAttributes);
  /** @returns {ContentTag} */
  label = this.createContentTag('label', attributes.labelAttributes);
  /** @returns {ContentTag} */
  legend = this.createContentTag('legend', attributes.legendAttributes);
  /** @returns {ContentTag} */
  li = this.createContentTag('li', attributes.liAttributes);
  /** @returns {ContentTag} */
  line = this.createSvgContentTag('line', attributes.lineAttributes);
  /** @returns {ContentTag} */
  linearGradient = this.createSvgContentTag('linearGradient', attributes.linearGradientAttributes);
  /** @returns {VoidTag} */
  link = this.createVoidTag('link', attributes.linkAttributes);
  /** @returns {ContentTag} */
  main = this.createContentTag('main', attributes.mainAttributes);
  /** @returns {ContentTag} */
  map = this.createContentTag('map', attributes.mapAttributes);
  /** @returns {ContentTag} */
  mark = this.createContentTag('mark', attributes.markAttributes);
  /** @returns {ContentTag} */
  marker = this.createSvgContentTag('marker', attributes.markerAttributes);
  /** @returns {ContentTag} */
  mask = this.createSvgContentTag('mask', attributes.maskAttributes);
  /** @returns {ContentTag} */
  math = this.createMathTag('math', attributes.mathAttributes);
  /** @returns {ContentTag} */
  menclose = this.createMathTag('menclose', attributes.mencloseAttributes);
  /** @returns {ContentTag} */
  menu = this.createContentTag('menu', attributes.menuAttributes);
  /** @returns {ContentTag} */
  merror = this.createMathTag('merror', attributes.merrorAttributes);
  /** @returns {VoidTag} */
  meta = this.createVoidTag('meta', attributes.metaAttributes);
  /** @returns {ContentTag} */
  metadata = this.createSvgContentTag('metadata', attributes.metadataAttributes);
  /** @returns {ContentTag} */
  meter = this.createContentTag('meter', attributes.meterAttributes);
  /** @returns {ContentTag} */
  mfrac = this.createMathTag('mfrac', attributes.mfracAttributes);
  /** @returns {ContentTag} */
  mi = this.createMathTag('mi', attributes.miAttributes);
  /** @returns {ContentTag} */
  mmultiscripts = this.createMathTag('mmultiscripts', attributes.mmultiscriptsAttributes);
  /** @returns {ContentTag} */
  mn = this.createMathTag('mn', attributes.mnAttributes);
  /** @returns {ContentTag} */
  mo = this.createMathTag('mo', attributes.moAttributes);
  /** @returns {ContentTag} */
  mover = this.createMathTag('mover', attributes.moverAttributes);
  /** @returns {ContentTag} */
  mpadded = this.createMathTag('mpadded', attributes.mpaddedAttributes);
  /** @returns {ContentTag} */
  mpath = this.createSvgContentTag('mpath', attributes.mpathAttributes);
  /** @returns {ContentTag} */
  mphantom = this.createMathTag('mphantom', attributes.mphantomAttributes);
  /** @returns {ContentTag} */
  mprescripts = this.createMathTag('mprescripts', attributes.mprescriptsAttributes);
  /** @returns {ContentTag} */
  mroot = this.createMathTag('mroot', attributes.mrootAttributes);
  /** @returns {ContentTag} */
  mrow = this.createMathTag('mrow', attributes.mrowAttributes);
  /** @returns {ContentTag} */
  ms = this.createMathTag('ms', attributes.msAttributes);
  /** @returns {ContentTag} */
  mspace = this.createMathTag('mspace', attributes.mspaceAttributes);
  /** @returns {ContentTag} */
  msqrt = this.createMathTag('msqrt', attributes.msqrtAttributes);
  /** @returns {ContentTag} */
  mstyle = this.createMathTag('mstyle', attributes.mstyleAttributes);
  /** @returns {ContentTag} */
  msub = this.createMathTag('msub', attributes.msubAttributes);
  /** @returns {ContentTag} */
  msubsup = this.createMathTag('msubsup', attributes.msubsupAttributes);
  /** @returns {ContentTag} */
  msup = this.createMathTag('msup', attributes.msupAttributes);
  /** @returns {ContentTag} */
  mtable = this.createMathTag('mtable', attributes.mtableAttributes);
  /** @returns {ContentTag} */
  mtd = this.createMathTag('mtd', attributes.mtdAttributes);
  /** @returns {ContentTag} */
  mtext = this.createMathTag('mtext', attributes.mtextAttributes);
  /** @returns {ContentTag} */
  mtr = this.createMathTag('mtr', attributes.mtrAttributes);
  /** @returns {ContentTag} */
  munder = this.createMathTag('munder', attributes.munderAttributes);
  /** @returns {ContentTag} */
  munderover = this.createMathTag('munderover', attributes.munderoverAttributes);
  /** @returns {ContentTag} */
  nav = this.createContentTag('nav', attributes.navAttributes);
  /** @returns {ContentTag} */
  noscript = this.createContentTag('noscript', attributes.noscriptAttributes);
  /** @returns {ContentTag} */
  object = this.createContentTag('object', attributes.objectAttributes);
  /** @returns {ContentTag} */
  ol = this.createContentTag('ol', attributes.olAttributes);
  /** @returns {ContentTag} */
  optgroup = this.createContentTag('optgroup', attributes.optgroupAttributes);
  /** @returns {ContentTag} */
  option = this.createContentTag('option', attributes.optionAttributes);
  /** @returns {ContentTag} */
  output = this.createContentTag('output', attributes.outputAttributes);
  /** @returns {ContentTag} */
  p = this.createContentTag('p', attributes.pAttributes);
  /** @returns {ContentTag} */
  path = this.createSvgContentTag('path', attributes.pathAttributes);
  /** @returns {ContentTag} */
  pattern = this.createSvgContentTag('pattern', attributes.patternAttributes);
  /** @returns {ContentTag} */
  picture = this.createContentTag('picture', attributes.pictureAttributes);
  /** @returns {ContentTag} */
  polygon = this.createSvgContentTag('polygon', attributes.polygonAttributes);
  /** @returns {ContentTag} */
  polyline = this.createSvgContentTag('polyline', attributes.polylineAttributes);
  /** @returns {ContentTag} */
  pre = this.createLiteralContentTag('pre', attributes.preAttributes);
  /** @returns {ContentTag} */
  progress = this.createContentTag('progress', attributes.progressAttributes);
  /** @returns {ContentTag} */
  q = this.createContentTag('q', attributes.qAttributes);
  /** @returns {ContentTag} */
  radialGradient = this.createSvgContentTag('radialGradient', attributes.radialGradientAttributes);
  /** @returns {ContentTag} */
  rect = this.createSvgContentTag('rect', attributes.rectAttributes);
  /** @returns {ContentTag} */
  rp = this.createContentTag('rp', attributes.rpAttributes);
  /** @returns {ContentTag} */
  rt = this.createContentTag('rt', attributes.rtAttributes);
  /** @returns {ContentTag} */
  ruby = this.createContentTag('ruby', attributes.rubyAttributes);
  /** @returns {ContentTag} */
  s = this.createContentTag('s', attributes.sAttributes);
  /** @returns {ContentTag} */
  samp = this.createContentTag('samp', attributes.sampAttributes);
  /** @returns {ContentTag} */
  script = this.createLiteralContentTag('script', attributes.scriptAttributes);
  /** @returns {ContentTag} */
  search = this.createContentTag('search', attributes.searchAttributes);
  /** @returns {ContentTag} */
  section = this.createContentTag('section', attributes.sectionAttributes);
  /** @returns {ContentTag} */
  select = this.createContentTag('select', attributes.selectAttributes);
  /** @returns {VoidTag} */
  selectedcontent = this.createVoidTag('selectedcontent', attributes.selectedcontentAttributes);
  /** @returns {ContentTag} */
  semantics = this.createMathTag('semantics', attributes.semanticsAttributes);
  /** @returns {ContentTag} */
  set = this.createSvgContentTag('set', attributes.setAttributes);
  /** @returns {ContentTag} */
  slot = this.createContentTag('slot', attributes.slotAttributes);
  /** @returns {ContentTag} */
  small = this.createContentTag('small', attributes.smallAttributes);
  /** @returns {VoidTag} */
  source = this.createVoidTag('source', attributes.sourceAttributes);
  /** @returns {ContentTag} */
  span = this.createContentTag('span', attributes.spanAttributes);
  /** @returns {ContentTag} */
  stop = this.createSvgContentTag('stop', attributes.stopAttributes);
  /** @returns {ContentTag} */
  strong = this.createContentTag('strong', attributes.strongAttributes);
  /** @returns {ContentTag} */
  style = this.createLiteralContentTag('style', attributes.styleAttributes);
  /** @returns {ContentTag} */
  sub = this.createContentTag('sub', attributes.subAttributes);
  /** @returns {ContentTag} */
  summary = this.createContentTag('summary', attributes.summaryAttributes);
  /** @returns {ContentTag} */
  sup = this.createContentTag('sup', attributes.supAttributes);
  /** @returns {ContentTag} */
  svg = this.createSvgContentTag('svg', attributes.svgAttributes);
  /** @returns {ContentTag} */
  switch = this.createSvgContentTag('switch', attributes.switchAttributes);
  /** @returns {ContentTag} */
  symbol = this.createSvgContentTag('symbol', attributes.symbolAttributes);
  /** @returns {ContentTag} */
  table = this.createContentTag('table', attributes.tableAttributes);
  /** @returns {ContentTag} */
  tbody = this.createContentTag('tbody', attributes.tbodyAttributes);
  /** @returns {ContentTag} */
  td = this.createContentTag('td', attributes.tdAttributes);
  /** @returns {ContentTag} */
  template = this.createContentTag('template', attributes.templateAttributes);
  /** @returns {ContentTag} */
  text = this.createSvgContentTag('text', attributes.textAttributes);
  /** @returns {ContentTag} */
  textarea = this.createLiteralContentTag('textarea', attributes.textareaAttributes);
  /** @returns {ContentTag} */
  textPath = this.createSvgContentTag('textPath', attributes.textPathAttributes);
  /** @returns {ContentTag} */
  tfoot = this.createContentTag('tfoot', attributes.tfootAttributes);
  /** @returns {ContentTag} */
  th = this.createContentTag('th', attributes.thAttributes);
  /** @returns {ContentTag} */
  thead = this.createContentTag('thead', attributes.theadAttributes);
  /** @returns {ContentTag} */
  time = this.createContentTag('time', attributes.timeAttributes);
  /** @returns {ContentTag} */
  title = this.createContentTag('title', attributes.titleAttributes);
  /** @returns {ContentTag} */
  tr = this.createContentTag('tr', attributes.trAttributes);
  /** @returns {VoidTag} */
  track = this.createVoidTag('track', attributes.trackAttributes);
  /** @returns {ContentTag} */
  tspan = this.createSvgContentTag('tspan', attributes.tspanAttributes);
  /** @returns {ContentTag} */
  u = this.createContentTag('u', attributes.uAttributes);
  /** @returns {ContentTag} */
  ul = this.createContentTag('ul', attributes.ulAttributes);
  /** @returns {ContentTag} */
  use = this.createSvgContentTag('use', attributes.useAttributes);
  /** @returns {ContentTag} */
  var = this.createContentTag('var', attributes.varAttributes);
  /** @returns {ContentTag} */
  video = this.createContentTag('video', attributes.videoAttributes);
  /** @returns {ContentTag} */
  view = this.createSvgContentTag('view', attributes.viewAttributes);
  /** @returns {VoidTag} */
  wbr = this.createVoidTag('wbr', attributes.wbrAttributes);
}

const t = new Kensington();

exports.default = Kensington;
exports.t = t;
