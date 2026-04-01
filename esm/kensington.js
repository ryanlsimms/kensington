import ContentTag from './tag-classes/content-tag.js';
import HtmlWithDoctypeTag from './tag-classes/html-with-doctype-tag.js';
import LiteralTag from './tag-classes/literal-tag.js';
import VoidTag from './tag-classes/void-tag.js';
import getPrototypeMethods from './lib/get-prototype-methods.js';
import * as allAttributes from './attributes.js';
import { camelToKebab } from './lib/text-utils.js';
import showInvalid from './lib/show-invalid.js';

export default class Kensington {
  constructor({ additionalNamespaces = [], validationLevel = 'off', indentationLevel = 2 } = {}) {
    getPrototypeMethods(this).forEach(key => {
      this[key] = this[key].bind(this);
    });
    this.indentationLevel = indentationLevel;
    this.namespaces = ['data', 'aria'].concat(additionalNamespaces);
    this.validationLevel = validationLevel;
  }

  createCustomTag(tagName, allowedAttributes = {}) {
    const kebabAttributes = Object.fromEntries(Object.entries(allowedAttributes).map(([k,v]) => [camelToKebab(k), v]))
    return this.createTag(tagName, kebabAttributes, ContentTag, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
    });
  }

  createContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
    });
  }

  createMathTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      includeGlobalAttributes: false,
      includeGlobalEvents: true,
    });
  }

  createLiteralContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
      contentIsLiteral: true,
    });
  }

  createSvgContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      includeGlobalAttributes: false,
      includeGlobalEvents: true,
    });
  }

  createVoidTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, VoidTag, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
    });
  }

  createTag(tagName, allowedAttributes, Klass, options) {
    const { includeGlobalAttributes, includeGlobalEvents, contentIsLiteral = false } = options;
    const invalidTypes = Object.values(allowedAttributes).filter(type => {
      return ![String, Number, Boolean].includes(type) && !Array.isArray(type) && typeof type !== 'function';
    });
    if (invalidTypes.length) {
      showInvalid(`invalid types for attribute(s): ${invalidTypes.join(', ')} given for ${tagName}`, this.validationLevel);
    }

    return (attributesOrContent = null, content, thirdArg) => {
      let attributes = attributesOrContent;

      if (thirdArg) {
        throw new Error(`Too many arguments given for ${tagName}`);
      }

      if (attributesOrContent?.constructor !== Object) {
        if (content) {
          throw new Error(`Invalid arguments given for ${tagName}`);
        }
        attributes = {};
        content = attributesOrContent;
      }
      if (typeof content === 'undefined') {
        content = '';
      }
      if (this.validationLevel !== 'off') {
        if (includeGlobalAttributes) {
          Object.assign(allowedAttributes, allAttributes.globalAttributes);
        }
        if (includeGlobalEvents) {
          Object.assign(allowedAttributes, allAttributes.globalEvents)
        }
      }
      const instance = new Klass({
        allowedAttributes,
        attributes,
        content,
        indentationLevel: this.indentationLevel,
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

  literal(str) {
    if (str.includes('<script')) {
      throw new Error('<script> tags are not allowed to be passed in literal html.  Use the .unsafeLiteral if you can vouch for the string')
    }
    return new LiteralTag(str);
  }

  unsafeLiteral(str) {
    return new LiteralTag(str);
  }

  htmlWithDocType = this.createTag('html', allAttributes.htmlAttributes, HtmlWithDoctypeTag, { includeGlobalAttributes: true, includeGlobalEvents: true });

  a = this.createContentTag('a', allAttributes.aAttributes);
  abbr = this.createContentTag('abbr', allAttributes.abbrAttributes);
  address = this.createContentTag('address', allAttributes.addressAttributes);
  animate = this.createSvgContentTag('animate', allAttributes.animateAttributes);
  animateMotion = this.createSvgContentTag('animateMotion', allAttributes.animateMotionAttributes);
  animateTransform = this.createSvgContentTag('animateTransform', allAttributes.animateTransformAttributes);
  annotation = this.createMathTag('annotation', allAttributes.annotationAttributes);
  annotationXml = this.createMathTag('annotation-xml', allAttributes.annotationXmlAttributes);
  area = this.createVoidTag('area', allAttributes.areaAttributes);
  article = this.createContentTag('article', allAttributes.articleAttributes);
  aside = this.createContentTag('aside', allAttributes.asideAttributes);
  audio = this.createContentTag('audio', allAttributes.audioAttributes);
  b = this.createContentTag('b', allAttributes.bAttributes);
  base = this.createVoidTag('base', allAttributes.baseAttributes);
  bdi = this.createContentTag('bdi', allAttributes.bdiAttributes);
  bdo = this.createContentTag('bdo', allAttributes.bdoAttributes);
  blockquote = this.createContentTag('blockquote', allAttributes.blockquoteAttributes);
  body = this.createContentTag('body', allAttributes.bodyAttributes);
  br = this.createVoidTag('br', allAttributes.brAttributes);
  button = this.createContentTag('button', allAttributes.buttonAttributes);
  canvas = this.createContentTag('canvas', allAttributes.canvasAttributes);
  caption = this.createContentTag('caption', allAttributes.captionAttributes);
  circle = this.createSvgContentTag('circle', allAttributes.circleAttributes);
  cite = this.createContentTag('cite', allAttributes.citeAttributes);
  clipPath = this.createSvgContentTag('clipPath', allAttributes.clipPathAttributes);
  code = this.createContentTag('code', allAttributes.codeAttributes);
  col = this.createVoidTag('col', allAttributes.colAttributes);
  colgroup = this.createContentTag('colgroup', allAttributes.colgroupAttributes);
  data = this.createContentTag('data', allAttributes.dataAttributes);
  datalist = this.createContentTag('datalist', allAttributes.datalistAttributes);
  dd = this.createContentTag('dd', allAttributes.ddAttributes);
  defs = this.createSvgContentTag('defs', allAttributes.defsAttributes);
  del = this.createContentTag('del', allAttributes.delAttributes);
  desc = this.createSvgContentTag('desc', allAttributes.descAttributes);
  details = this.createContentTag('details', allAttributes.detailsAttributes);
  dfn = this.createContentTag('dfn', allAttributes.dfnAttributes);
  dialog = this.createContentTag('dialog', allAttributes.dialogAttributes);
  div = this.createContentTag('div', allAttributes.divAttributes);
  dl = this.createContentTag('dl', allAttributes.dlAttributes);
  dt = this.createContentTag('dt', allAttributes.dtAttributes);
  ellipse = this.createSvgContentTag('ellipse', allAttributes.ellipseAttributes);
  em = this.createContentTag('em', allAttributes.emAttributes);
  embed = this.createVoidTag('embed', allAttributes.embedAttributes);
  feBlend = this.createSvgContentTag('feBlend', allAttributes.feBlendAttributes);
  feColorMatrix = this.createSvgContentTag('feColorMatrix', allAttributes.feColorMatrixAttributes);
  feComponentTransfer = this.createSvgContentTag('feComponentTransfer', allAttributes.feComponentTransferAttributes);
  feComposite = this.createSvgContentTag('feComposite', allAttributes.feCompositeAttributes);
  feConvolveMatrix = this.createSvgContentTag('feConvolveMatrix', allAttributes.feConvolveMatrixAttributes);
  feDiffuseLighting = this.createSvgContentTag('feDiffuseLighting', allAttributes.feDiffuseLightingAttributes);
  feDisplacementMap = this.createSvgContentTag('feDisplacementMap', allAttributes.feDisplacementMapAttributes);
  feDistantLight = this.createSvgContentTag('feDistantLight', allAttributes.feDistantLightAttributes);
  feDropShadow = this.createSvgContentTag('feDropShadow', allAttributes.feDropShadowAttributes);
  feFlood = this.createSvgContentTag('feFlood', allAttributes.feFloodAttributes);
  feFuncA = this.createSvgContentTag('feFuncA', allAttributes.feFuncAAttributes);
  feFuncB = this.createSvgContentTag('feFuncB', allAttributes.feFuncBAttributes);
  feFuncG = this.createSvgContentTag('feFuncG', allAttributes.feFuncGAttributes);
  feFuncR = this.createSvgContentTag('feFuncR', allAttributes.feFuncRAttributes);
  feGaussianBlur = this.createSvgContentTag('feGaussianBlur', allAttributes.feGaussianBlurAttributes);
  feImage = this.createSvgContentTag('feImage', allAttributes.feImageAttributes);
  feMerge = this.createSvgContentTag('feMerge', allAttributes.feMergeAttributes);
  feMergeNode = this.createSvgContentTag('feMergeNode', allAttributes.feMergeNodeAttributes);
  feMorphology = this.createSvgContentTag('feMorphology', allAttributes.feMorphologyAttributes);
  feOffset = this.createSvgContentTag('feOffset', allAttributes.feOffsetAttributes);
  fePointLight = this.createSvgContentTag('fePointLight', allAttributes.fePointLightAttributes);
  feSpecularLighting = this.createSvgContentTag('feSpecularLighting', allAttributes.feSpecularLightingAttributes);
  feSpotLight = this.createSvgContentTag('feSpotLight', allAttributes.feSpotLightAttributes);
  feTile = this.createSvgContentTag('feTile', allAttributes.feTileAttributes);
  feTurbulence = this.createSvgContentTag('feTurbulence', allAttributes.feTurbulenceAttributes);
  fieldset = this.createContentTag('fieldset', allAttributes.fieldsetAttributes);
  figcaption = this.createContentTag('figcaption', allAttributes.figcaptionAttributes);
  figure = this.createContentTag('figure', allAttributes.figureAttributes);
  filter = this.createSvgContentTag('filter', allAttributes.filterAttributes);
  footer = this.createContentTag('footer', allAttributes.footerAttributes);
  foreignObject = this.createSvgContentTag('foreignObject', allAttributes.foreignObjectAttributes);
  form = this.createContentTag('form', allAttributes.formAttributes);
  g = this.createSvgContentTag('g', allAttributes.gAttributes);
  h1 = this.createContentTag('h1', allAttributes.h1Attributes);
  h2 = this.createContentTag('h2', allAttributes.h2Attributes);
  h3 = this.createContentTag('h3', allAttributes.h3Attributes);
  h4 = this.createContentTag('h4', allAttributes.h4Attributes);
  h5 = this.createContentTag('h5', allAttributes.h5Attributes);
  h6 = this.createContentTag('h6', allAttributes.h6Attributes);
  head = this.createContentTag('head', allAttributes.headAttributes);
  header = this.createContentTag('header', allAttributes.headerAttributes);
  hgroup = this.createContentTag('hgroup', allAttributes.hgroupAttributes);
  hr = this.createVoidTag('hr', allAttributes.hrAttributes);
  html = this.createContentTag('html', allAttributes.htmlAttributes);
  i = this.createContentTag('i', allAttributes.iAttributes);
  iframe = this.createContentTag('iframe', allAttributes.iframeAttributes);
  image = this.createSvgContentTag('image', allAttributes.imageAttributes);
  img = this.createVoidTag('img', allAttributes.imgAttributes);
  input = this.createVoidTag('input', allAttributes.inputAttributes);
  ins = this.createContentTag('ins', allAttributes.insAttributes);
  kbd = this.createContentTag('kbd', allAttributes.kbdAttributes);
  label = this.createContentTag('label', allAttributes.labelAttributes);
  legend = this.createContentTag('legend', allAttributes.legendAttributes);
  li = this.createContentTag('li', allAttributes.liAttributes);
  line = this.createSvgContentTag('line', allAttributes.lineAttributes);
  linearGradient = this.createSvgContentTag('linearGradient', allAttributes.linearGradientAttributes);
  link = this.createVoidTag('link', allAttributes.linkAttributes);
  main = this.createContentTag('main', allAttributes.mainAttributes);
  map = this.createContentTag('map', allAttributes.mapAttributes);
  mark = this.createContentTag('mark', allAttributes.markAttributes);
  marker = this.createSvgContentTag('marker', allAttributes.markerAttributes);
  mask = this.createSvgContentTag('mask', allAttributes.maskAttributes);
  math = this.createMathTag('math', allAttributes.mathAttributes);
  menclose = this.createMathTag('menclose', allAttributes.mencloseAttributes);
  menu = this.createContentTag('menu', allAttributes.menuAttributes);
  merror = this.createMathTag('merror', allAttributes.merrorAttributes);
  meta = this.createVoidTag('meta', allAttributes.metaAttributes);
  metadata = this.createSvgContentTag('metadata', allAttributes.metadataAttributes);
  meter = this.createContentTag('meter', allAttributes.meterAttributes);
  mfrac = this.createMathTag('mfrac', allAttributes.mfracAttributes);
  mi = this.createMathTag('mi', allAttributes.miAttributes);
  mmultiscripts = this.createMathTag('mmultiscripts', allAttributes.mmultiscriptsAttributes);
  mn = this.createMathTag('mn', allAttributes.mnAttributes);
  mo = this.createMathTag('mo', allAttributes.moAttributes);
  mover = this.createMathTag('mover', allAttributes.moverAttributes);
  mpadded = this.createMathTag('mpadded', allAttributes.mpaddedAttributes);
  mpath = this.createSvgContentTag('mpath', allAttributes.mpathAttributes);
  mphantom = this.createMathTag('mphantom', allAttributes.mphantomAttributes);
  mprescripts = this.createMathTag('mprescripts', allAttributes.mprescriptsAttributes);
  mroot = this.createMathTag('mroot', allAttributes.mrootAttributes);
  mrow = this.createMathTag('mrow', allAttributes.mrowAttributes);
  ms = this.createMathTag('ms', allAttributes.msAttributes);
  mspace = this.createMathTag('mspace', allAttributes.mspaceAttributes);
  msqrt = this.createMathTag('msqrt', allAttributes.msqrtAttributes);
  mstyle = this.createMathTag('mstyle', allAttributes.mstyleAttributes);
  msub = this.createMathTag('msub', allAttributes.msubAttributes);
  msubsup = this.createMathTag('msubsup', allAttributes.msubsupAttributes);
  msup = this.createMathTag('msup', allAttributes.msupAttributes);
  mtable = this.createMathTag('mtable', allAttributes.mtableAttributes);
  mtd = this.createMathTag('mtd', allAttributes.mtdAttributes);
  mtext = this.createMathTag('mtext', allAttributes.mtextAttributes);
  mtr = this.createMathTag('mtr', allAttributes.mtrAttributes);
  munder = this.createMathTag('munder', allAttributes.munderAttributes);
  munderover = this.createMathTag('munderover', allAttributes.munderoverAttributes);
  nav = this.createContentTag('nav', allAttributes.navAttributes);
  noscript = this.createContentTag('noscript', allAttributes.noscriptAttributes);
  object = this.createContentTag('object', allAttributes.objectAttributes);
  ol = this.createContentTag('ol', allAttributes.olAttributes);
  optgroup = this.createContentTag('optgroup', allAttributes.optgroupAttributes);
  option = this.createContentTag('option', allAttributes.optionAttributes);
  output = this.createContentTag('output', allAttributes.outputAttributes);
  p = this.createContentTag('p', allAttributes.pAttributes);
  path = this.createSvgContentTag('path', allAttributes.pathAttributes);
  pattern = this.createSvgContentTag('pattern', allAttributes.patternAttributes);
  picture = this.createContentTag('picture', allAttributes.pictureAttributes);
  polygon = this.createSvgContentTag('polygon', allAttributes.polygonAttributes);
  polyline = this.createSvgContentTag('polyline', allAttributes.polylineAttributes);
  pre = this.createLiteralContentTag('pre', allAttributes.preAttributes);
  progress = this.createContentTag('progress', allAttributes.progressAttributes);
  q = this.createContentTag('q', allAttributes.qAttributes);
  radialGradient = this.createSvgContentTag('radialGradient', allAttributes.radialGradientAttributes);
  rect = this.createSvgContentTag('rect', allAttributes.rectAttributes);
  rp = this.createContentTag('rp', allAttributes.rpAttributes);
  rt = this.createContentTag('rt', allAttributes.rtAttributes);
  ruby = this.createContentTag('ruby', allAttributes.rubyAttributes);
  s = this.createContentTag('s', allAttributes.sAttributes);
  samp = this.createContentTag('samp', allAttributes.sampAttributes);
  script = this.createLiteralContentTag('script', allAttributes.scriptAttributes);
  search = this.createContentTag('search', allAttributes.searchAttributes);
  section = this.createContentTag('section', allAttributes.sectionAttributes);
  select = this.createContentTag('select', allAttributes.selectAttributes);
  selectedcontent = this.createVoidTag('selectedcontent', allAttributes.selectedcontentAttributes);
  semantics = this.createMathTag('semantics', allAttributes.semanticsAttributes);
  set = this.createSvgContentTag('set', allAttributes.setAttributes);
  slot = this.createContentTag('slot', allAttributes.slotAttributes);
  small = this.createContentTag('small', allAttributes.smallAttributes);
  source = this.createVoidTag('source', allAttributes.sourceAttributes);
  span = this.createContentTag('span', allAttributes.spanAttributes);
  stop = this.createSvgContentTag('stop', allAttributes.stopAttributes);
  strong = this.createContentTag('strong', allAttributes.strongAttributes);
  style = this.createContentTag('style', allAttributes.styleAttributes);
  sub = this.createContentTag('sub', allAttributes.subAttributes);
  summary = this.createContentTag('summary', allAttributes.summaryAttributes);
  sup = this.createContentTag('sup', allAttributes.supAttributes);
  svg = this.createSvgContentTag('svg', allAttributes.svgAttributes);
  switch = this.createSvgContentTag('switch', allAttributes.switchAttributes);
  symbol = this.createSvgContentTag('symbol', allAttributes.symbolAttributes);
  table = this.createContentTag('table', allAttributes.tableAttributes);
  tbody = this.createContentTag('tbody', allAttributes.tbodyAttributes);
  td = this.createContentTag('td', allAttributes.tdAttributes);
  template = this.createContentTag('template', allAttributes.templateAttributes);
  text = this.createSvgContentTag('text', allAttributes.textAttributes);
  textarea = this.createLiteralContentTag('textarea', allAttributes.textareaAttributes);
  textPath = this.createSvgContentTag('textPath', allAttributes.textPathAttributes);
  tfoot = this.createContentTag('tfoot', allAttributes.tfootAttributes);
  th = this.createContentTag('th', allAttributes.thAttributes);
  thead = this.createContentTag('thead', allAttributes.theadAttributes);
  time = this.createContentTag('time', allAttributes.timeAttributes);
  title = this.createContentTag('title', allAttributes.titleAttributes);
  tr = this.createContentTag('tr', allAttributes.trAttributes);
  track = this.createVoidTag('track', allAttributes.trackAttributes);
  tspan = this.createSvgContentTag('tspan', allAttributes.tspanAttributes);
  u = this.createContentTag('u', allAttributes.uAttributes);
  ul = this.createContentTag('ul', allAttributes.ulAttributes);
  use = this.createSvgContentTag('use', allAttributes.useAttributes);
  var = this.createContentTag('var', allAttributes.varAttributes);
  video = this.createContentTag('video', allAttributes.videoAttributes);
  view = this.createSvgContentTag('view', allAttributes.viewAttributes);
  wbr = this.createVoidTag('wbr', allAttributes.wbrAttributes);
}

export const t = new Kensington();
