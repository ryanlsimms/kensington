'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const contentTag = require('./tag-classes/content-tag.js');
const htmlWithDoctypeTag = require('./tag-classes/html-with-doctype-tag.js');
const literalTag = require('./tag-classes/literal-tag.js');
const voidTag = require('./tag-classes/void-tag.js');
const getPrototypeMethods = require('./lib/get-prototype-methods.js');
const attributes = require('./attributes.js');

class JsMarkup {
  constructor({ runValidation = false } = {}) {
    getPrototypeMethods.default(this).forEach(key => {
      this[key] = this[key].bind(this);
    });
    this.runValidation = runValidation;
  }
  
  createCustomTag = this.createContentTag;

  createContentTag(tagName, allowedAttributes) {
    return this.createTag(tagName, allowedAttributes, contentTag.default, true, true);
  }
  
  createMathTag(tagName, allowedAttributes) {
    return this.createTag(tagName, allowedAttributes, contentTag.default, false, true);
  }
  
  createSvgTag(tagName, allowedAttributes) {
    return this.createTag(tagName, allowedAttributes, contentTag.default, false, false);
  }
  
  createVoidTag(tagName, allowedAttributes) {
    return this.createTag(tagName, allowedAttributes, voidTag.default, true, true);
  }
  
  createTag(tagName, allowedAttributes, Klass, includeGlobalAttributes, includeGlobalEvents) {
    const invalidTypes = Object.values(allowedAttributes).filter(type => {
      return ![String, Number, Boolean, Function].includes(type) && !Array.isArray(type)
    });
    if (invalidTypes.length) {
      throw new Error(`invalid types for attribute(s): ${invalidTypes.join(', ')} given for ${tagName}`);
    }
    
    return (attributesOrContent = null, content = '') => {
      let attributes$1 = attributesOrContent;

      if (attributesOrContent?.constructor !== Object) {
        attributes$1 = {};
        content = attributesOrContent;
      }
      const instance = new Klass({
        allowedAttributes: {
          ...(includeGlobalAttributes && { ...attributes.globalAttributes }),
          ...(includeGlobalEvents && { ...attributes.globalEvents }),
          ...allowedAttributes,
        },
        attributes: attributes$1,
        content,
        tagName,
      });
      
      if (this.runValidation) {
        instance.validate();
      }
      return instance;
    }
  }

  literal(str) {
    if (str.includes('<script')) {
      throw new Error('<script> tags are not allowed to be passed in literal html.  Use the .unsafeLiteral if you can vouch for the string')
    }
    return new literalTag.default(str);
  }

  unsafeLiteral(str) {
    return new literalTag.default(str);
  }
  
  htmlWithDocType = this.createTag('html', attributes.htmlAttributes, htmlWithDoctypeTag.default, true, true);

  a = this.createContentTag('a', attributes.aAttributes);
  abbr = this.createContentTag('abbr', attributes.abbrAttributes);
  address = this.createContentTag('address', attributes.addressAttributes);
  animate = this.createSvgTag('animate', attributes.animateAttributes);
  animateMotion = this.createSvgTag('animateMotion', attributes.animateMotionAttributes);
  animateTransform = this.createSvgTag('animateTransform', attributes.animateTransformAttributes);
  annotation = this.createMathTag('annotation', attributes.annotationAttributes);
  annotationXml = this.createMathTag('annotation-xml', attributes.annotationXmlAttributes);
  area = this.createVoidTag('area', attributes.areaAttributes);
  article = this.createContentTag('article', attributes.articleAttributes);
  aside = this.createContentTag('aside', attributes.asideAttributes);
  audio = this.createContentTag('audio', attributes.audioAttributes);
  b = this.createContentTag('b', attributes.bAttributes);
  base = this.createVoidTag('base', attributes.baseAttributes);
  bdi = this.createContentTag('bdi', attributes.bdiAttributes);
  bdo = this.createContentTag('bdo', attributes.bdoAttributes);
  blockquote = this.createContentTag('blockquote', attributes.blockquoteAttributes);
  body = this.createContentTag('body', attributes.bodyAttributes);
  br = this.createVoidTag('br', attributes.brAttributes);
  button = this.createContentTag('button', attributes.buttonAttributes);
  canvas = this.createContentTag('canvas', attributes.canvasAttributes);
  caption = this.createContentTag('caption', attributes.captionAttributes);
  circle = this.createSvgTag('circle', attributes.circleAttributes);
  cite = this.createContentTag('cite', attributes.citeAttributes);
  code = this.createContentTag('code', attributes.codeAttributes);
  col = this.createVoidTag('col', attributes.colAttributes);
  colgroup = this.createContentTag('colgroup', attributes.colgroupAttributes);
  data = this.createContentTag('data', attributes.dataAttributes);
  datalist = this.createContentTag('datalist', attributes.datalistAttributes);
  dd = this.createContentTag('dd', attributes.ddAttributes);
  defs = this.createSvgTag('defs', attributes.defsAttributes);
  del = this.createContentTag('del', attributes.delAttributes);
  desc = this.createSvgTag('desc', attributes.descAttributes);
  details = this.createContentTag('details', attributes.detailsAttributes);
  dfn = this.createContentTag('dfn', attributes.dfnAttributes);
  dialog = this.createContentTag('dialog', attributes.dialogAttributes);
  discard = this.createSvgTag('discard', attributes.discardAttributes);
  div = this.createContentTag('div', attributes.divAttributes);
  dl = this.createContentTag('dl', attributes.dlAttributes);
  dt = this.createContentTag('dt', attributes.dtAttributes);
  ellipse = this.createSvgTag('ellipse', attributes.ellipseAttributes);
  em = this.createContentTag('em', attributes.emAttributes);
  embed = this.createVoidTag('embed', attributes.embedAttributes);
  fieldset = this.createContentTag('fieldset', attributes.fieldsetAttributes);
  figcaption = this.createContentTag('figcaption', attributes.figcaptionAttributes);
  figure = this.createContentTag('figure', attributes.figureAttributes);
  footer = this.createContentTag('footer', attributes.footerAttributes);
  foreignObject = this.createSvgTag('foreignObject', attributes.foreignObjectAttributes);
  form = this.createContentTag('form', attributes.formAttributes);
  g = this.createSvgTag('g', attributes.gAttributes);
  h1 = this.createContentTag('h1', attributes.h1Attributes);
  h2 = this.createContentTag('h2', attributes.h2Attributes);
  h3 = this.createContentTag('h3', attributes.h3Attributes);
  h4 = this.createContentTag('h4', attributes.h4Attributes);
  h5 = this.createContentTag('h5', attributes.h5Attributes);
  h6 = this.createContentTag('h6', attributes.h6Attributes);
  head = this.createContentTag('head', attributes.headAttributes);
  header = this.createContentTag('header', attributes.headerAttributes);
  hgroup = this.createContentTag('hgroup', attributes.hgroupAttributes);
  hr = this.createVoidTag('hr', attributes.hrAttributes);
  html = this.createContentTag('html', attributes.htmlAttributes);
  i = this.createContentTag('i', attributes.iAttributes);
  iframe = this.createContentTag('iframe', attributes.iframeAttributes);
  image = this.createSvgTag('image', attributes.imageAttributes);
  img = this.createVoidTag('img', attributes.imgAttributes);
  input = this.createVoidTag('input', attributes.inputAttributes);
  ins = this.createContentTag('ins', attributes.insAttributes);
  kbd = this.createContentTag('kbd', attributes.kbdAttributes);
  label = this.createContentTag('label', attributes.labelAttributes);
  legend = this.createContentTag('legend', attributes.legendAttributes);
  li = this.createContentTag('li', attributes.liAttributes);
  line = this.createSvgTag('line', attributes.lineAttributes);
  linearGradient = this.createSvgTag('linearGradient', attributes.linearGradientAttributes);
  link = this.createVoidTag('link', attributes.linkAttributes);
  main = this.createContentTag('main', attributes.mainAttributes);
  map = this.createContentTag('map', attributes.mapAttributes);
  mark = this.createContentTag('mark', attributes.markAttributes);
  marker = this.createSvgTag('marker', attributes.markerAttributes);
  math = this.createMathTag('math', attributes.mathAttributes);
  menclose = this.createMathTag('menclose', attributes.mencloseAttributes);
  menu = this.createContentTag('menu', attributes.menuAttributes);
  merror = this.createMathTag('merror', attributes.merrorAttributes);
  meta = this.createVoidTag('meta', attributes.metaAttributes);
  metadata = this.createSvgTag('metadata', attributes.metadataAttributes);
  meter = this.createContentTag('meter', attributes.meterAttributes);
  mfrac = this.createMathTag('mfrac', attributes.mfracAttributes);
  mi = this.createMathTag('mi', attributes.miAttributes);
  mmultiscripts = this.createMathTag('mmultiscripts', attributes.mmultiscriptsAttributes);
  mn = this.createMathTag('mn', attributes.mnAttributes);
  mo = this.createMathTag('mo', attributes.moAttributes);
  mover = this.createMathTag('mover', attributes.moverAttributes);
  mpadded = this.createMathTag('mpadded', attributes.mpaddedAttributes);
  mpath = this.createSvgTag('mpath', attributes.mpathAttributes);
  mphantom = this.createMathTag('mphantom', attributes.mphantomAttributes);
  mprescripts = this.createMathTag('mprescripts', attributes.mprescriptsAttributes);
  mroot = this.createMathTag('mroot', attributes.mrootAttributes);
  mrow = this.createMathTag('mrow', attributes.mrowAttributes);
  ms = this.createMathTag('ms', attributes.msAttributes);
  mspace = this.createMathTag('mspace', attributes.mspaceAttributes);
  msqrt = this.createMathTag('msqrt', attributes.msqrtAttributes);
  mstyle = this.createMathTag('mstyle', attributes.mstyleAttributes);
  msub = this.createMathTag('msub', attributes.msubAttributes);
  msubsup = this.createMathTag('msubsup', attributes.msubsupAttributes);
  msup = this.createMathTag('msup', attributes.msupAttributes);
  mtable = this.createMathTag('mtable', attributes.mtableAttributes);
  mtd = this.createMathTag('mtd', attributes.mtdAttributes);
  mtext = this.createMathTag('mtext', attributes.mtextAttributes);
  mtr = this.createMathTag('mtr', attributes.mtrAttributes);
  munder = this.createMathTag('munder', attributes.munderAttributes);
  munderover = this.createMathTag('munderover', attributes.munderoverAttributes);
  nav = this.createContentTag('nav', attributes.navAttributes);
  noscript = this.createContentTag('noscript', attributes.noscriptAttributes);
  object = this.createContentTag('object', attributes.objectAttributes);
  ol = this.createContentTag('ol', attributes.olAttributes);
  optgroup = this.createContentTag('optgroup', attributes.optgroupAttributes);
  option = this.createContentTag('option', attributes.optionAttributes);
  output = this.createContentTag('output', attributes.outputAttributes);
  p = this.createContentTag('p', attributes.pAttributes);
  path = this.createSvgTag('path', attributes.pathAttributes);
  pattern = this.createSvgTag('pattern', attributes.patternAttributes);
  picture = this.createContentTag('picture', attributes.pictureAttributes);
  polygon = this.createSvgTag('polygon', attributes.polygonAttributes);
  polyline = this.createSvgTag('polyline', attributes.polylineAttributes);
  pre = this.createContentTag('pre', attributes.preAttributes);
  progress = this.createContentTag('progress', attributes.progressAttributes);
  q = this.createContentTag('q', attributes.qAttributes);
  radialGradient = this.createSvgTag('radialGradient', attributes.radialGradientAttributes);
  rect = this.createSvgTag('rect', attributes.rectAttributes);
  rp = this.createContentTag('rp', attributes.rpAttributes);
  rt = this.createContentTag('rt', attributes.rtAttributes);
  ruby = this.createContentTag('ruby', attributes.rubyAttributes);
  s = this.createContentTag('s', attributes.sAttributes);
  samp = this.createContentTag('samp', attributes.sampAttributes);
  script = this.createContentTag('script', attributes.scriptAttributes);
  search = this.createContentTag('search', attributes.searchAttributes);
  section = this.createContentTag('section', attributes.sectionAttributes);
  select = this.createContentTag('select', attributes.selectAttributes);
  semantics = this.createMathTag('semantics', attributes.semanticsAttributes);
  set = this.createSvgTag('set', attributes.setAttributes);
  slot = this.createContentTag('slot', attributes.slotAttributes);
  small = this.createContentTag('small', attributes.smallAttributes);
  source = this.createVoidTag('source', attributes.sourceAttributes);
  span = this.createContentTag('span', attributes.spanAttributes);
  stop = this.createSvgTag('stop', attributes.stopAttributes);
  strong = this.createContentTag('strong', attributes.strongAttributes);
  style = this.createContentTag('style', attributes.styleAttributes);
  sub = this.createContentTag('sub', attributes.subAttributes);
  summary = this.createContentTag('summary', attributes.summaryAttributes);
  sup = this.createContentTag('sup', attributes.supAttributes);
  svg = this.createSvgTag('svg', attributes.svgAttributes);
  switch = this.createSvgTag('switch', attributes.switchAttributes);
  symbol = this.createSvgTag('symbol', attributes.symbolAttributes);
  table = this.createContentTag('table', attributes.tableAttributes);
  tbody = this.createContentTag('tbody', attributes.tbodyAttributes);
  td = this.createContentTag('td', attributes.tdAttributes);
  template = this.createContentTag('template', attributes.templateAttributes);
  text = this.createSvgTag('text', attributes.textAttributes);
  textarea = this.createContentTag('textarea', attributes.textareaAttributes);
  textPath = this.createSvgTag('textPath', attributes.textPathAttributes);
  tfoot = this.createContentTag('tfoot', attributes.tfootAttributes);
  th = this.createContentTag('th', attributes.thAttributes);
  thead = this.createContentTag('thead', attributes.theadAttributes);
  time = this.createContentTag('time', attributes.timeAttributes);
  title = this.createContentTag('title', attributes.titleAttributes);
  tr = this.createContentTag('tr', attributes.trAttributes);
  track = this.createVoidTag('track', attributes.trackAttributes);
  tspan = this.createSvgTag('tspan', attributes.tspanAttributes);
  u = this.createContentTag('u', attributes.uAttributes);
  ul = this.createContentTag('ul', attributes.ulAttributes);
  use = this.createSvgTag('use', attributes.useAttributes);
  var = this.createContentTag('var', attributes.varAttributes);
  video = this.createContentTag('video', attributes.videoAttributes);
  view = this.createSvgTag('view', attributes.viewAttributes);
  wbr = this.createVoidTag('wbr', attributes.wbrAttributes);
}

exports.default = JsMarkup;
