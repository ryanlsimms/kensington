import * as allAttributes from './attributes.js';
import getPrototypeMethods from './lib/get-prototype-methods.js';
import showInvalid from './lib/show-invalid.js';
import Signal, { computed, effect } from './lib/signal.js';
import { camelToKebab } from './lib/text-utils.js';
import CommentTag from './tag-classes/comment-tag.js';
import ContentTag from './tag-classes/content-tag.js';
import HtmlWithDoctypeTag from './tag-classes/html-with-doctype-tag.js';
import LiteralTag from './tag-classes/literal-tag.js';
import VoidTag from './tag-classes/void-tag.js';

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
export default class Kensington {
  /**
   * @param {object} [options]
   * @param {Record<string, *>} [options.additionalGlobalAttributes] - Extra attributes allowed on all elements, e.g. `{ enterkeyhint: ['enter', 'done', 'go', 'next', 'previous', 'search', 'send'] }`.
   * @param {string | string[]} [options.additionalNamespaces] - Extra attribute namespaces, e.g. `'hx'` for htmx.
   * @param {'off' | 'warn' | 'error'} [options.validationLevel] - Attribute validation behavior.
   * @param {number} [options.indentationLevel] - Spaces per indent level. Default: 2.
   * @param {function} [options.logger] - Function called with warning messages when `validationLevel` is `'warn'`. Default: `console.log`.
   */
  constructor(options) {
    const {
      additionalGlobalAttributes = {},
      additionalNamespaces = [],
      indentationLevel = 2,
      logger = console.log,
      validationLevel = 'off',
    } = options ?? {};
    if (
      additionalGlobalAttributes === null ||
      typeof additionalGlobalAttributes !== 'object' ||
      Array.isArray(additionalGlobalAttributes)
    ) {
      throw new Error(`additionalGlobalAttributes must be a plain object; got: ${typeof additionalGlobalAttributes}`);
    }
    if (!['off', 'warn', 'error'].includes(validationLevel)) {
      throw new Error(`validationLevel must be 'off', 'warn', or 'error'; got: ${JSON.stringify(validationLevel)}`);
    }
    if (typeof indentationLevel !== 'number' || !Number.isInteger(indentationLevel) || indentationLevel < 0) {
      throw new Error(`indentationLevel must be a non-negative integer; got: ${String(indentationLevel)}`);
    }
    if (typeof logger !== 'function') {
      throw new Error(`logger must be a function; got: ${typeof logger}`);
    }
    if (allAttributes.__slim__ && validationLevel !== 'off') {
      throw new Error(`The slim build does not include attribute data. Set validationLevel: 'off' or use the full build.`);
    }
    getPrototypeMethods(this).forEach(key => {
      this[key] = this[key].bind(this);
    });
    this.additionalGlobalAttributes = {};
    for (const [k, v] of Object.entries(additionalGlobalAttributes)) {
      this.additionalGlobalAttributes[camelToKebab(k)] = v;
    }
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
    if (typeof tagName !== 'string' || !tagName) {
      throw new Error(`createCustomTag: tagName must be a non-empty string; got: ${JSON.stringify(tagName)}`);
    }
    if (allowedAttributes === null || typeof allowedAttributes !== 'object' || Array.isArray(allowedAttributes)) {
      throw new Error(`createCustomTag: allowedAttributes must be a plain object; got: ${typeof allowedAttributes}`);
    }
    const kebabAttributes = Object.fromEntries(Object.entries(allowedAttributes).map(([k,v]) => [camelToKebab(k), v]));
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
      namespace: 'http://www.w3.org/1998/Math/MathML',
    });
  }

  createLiteralContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      contentIsLiteral: true,
      encodeContent: !['script', 'style'].includes(tagName),
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
    });
  }

  createSvgContentTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, ContentTag, {
      includeGlobalAttributes: false,
      includeGlobalEvents: true,
      namespace: 'http://www.w3.org/2000/svg',
    });
  }

  createVoidTag(tagName, allowedAttributes = {}) {
    return this.createTag(tagName, allowedAttributes, VoidTag, {
      includeGlobalAttributes: true,
      includeGlobalEvents: true,
    });
  }

  createTag(tagName, allowedAttributes = {}, Klass, options) {
    const {
      contentIsLiteral = false,
      encodeContent = true,
      includeGlobalAttributes,
      includeGlobalEvents,
      namespace,
    } = options;
    const allowedAttributeMap = new Map(Object.entries(allowedAttributes));
    const invalidTypes = [...allowedAttributeMap.entries()].filter(([, type]) => {
      if ([String, Number, Boolean].includes(type) || Array.isArray(type)) {
        return false;
      }
      return typeof type !== 'function' && typeof type !== 'string' && typeof type !== 'number';
    }).map(([attr]) => attr);
    if (invalidTypes.length) {
      showInvalid(`invalid types for attribute(s): ${invalidTypes.join(', ')} given for ${tagName}`, this.validationLevel, this.logger);
    }

    if (this.validationLevel !== 'off') {
      if (includeGlobalAttributes) {
        for (const [k, v] of Object.entries(allAttributes.globalAttributes ?? {})) {
          allowedAttributeMap.set(k, v);
        }
      }
      if (includeGlobalEvents) {
        for (const [k, v] of Object.entries(allAttributes.globalEvents ?? {})) {
          allowedAttributeMap.set(k, v);
        }
      }
    }

    return (attributesOrContent = null, content, thirdArg) => {
      let attributes = attributesOrContent;

      if (thirdArg !== undefined) {
        throw new Error(`Too many arguments given for ${tagName}`);
      }

      // Use getPrototypeOf so null-prototype objects and objects with an own
      // constructor property are still recognized as plain attribute objects.
      const _proto = attributesOrContent !== null && typeof attributesOrContent === 'object'
        ? Object.getPrototypeOf(attributesOrContent)
        : -1;
      if (_proto !== Object.prototype && _proto !== null) {
        if (content !== undefined) {
          throw new Error(`Invalid arguments given for ${tagName}`);
        }
        attributes = {};
        content = attributesOrContent;
      }
      if (typeof content === 'undefined') {
        content = '';
      }
      const instance = new Klass({
        additionalGlobalAttributes: this.additionalGlobalAttributes,
        allowedAttributeMap,
        attributes,
        content,
        contentIsLiteral,
        encodeContent,
        indentationLevel: this.indentationLevel,
        logger: this.logger,
        namespace,
        namespaces: this.namespaces,
        tagName,
        validationLevel: this.validationLevel,
      });

      if (this.validationLevel !== 'off') {
        instance.validate(this.validationLevel);
      }
      return instance;
    };
  }

  /**
   * Embeds a raw HTML string verbatim in the output. Use `.unsafeLiteral()` for HTML that includes script tags.
   * @param {string} str
   * @returns {LiteralTag}
   * @example
   * t.ul([t.li('typed'), t.literal('<li>raw html</li>')]);
   */
  literal(str) {
    return new LiteralTag(str, true, this.validationLevel, this.logger);
  }

  /**
   * Like `.literal()` but skips the script-tag check. Use only for trusted HTML.
   * @param {string} str
   * @returns {LiteralTag}
   */
  unsafeLiteral(str) {
    return new LiteralTag(str, false, this.validationLevel, this.logger);
  }

  /**
   * Creates an HTML comment. Multi-line strings are formatted across multiple lines.
   * @param {string | number} str
   * @returns {CommentTag}
   * @example
   * t.inlineComment('hello world')  // <!-- hello world -->
   * t.inlineComment('line 1\nline 2')
   * // <!--
   * //   line 1
   * //   line 2
   * // -->
   */
  inlineComment(str) {
    return new CommentTag(str, this.validationLevel, this.logger);
  }

  /** @returns {ContentTag} */
  htmlWithDocType = this.createTag(
    'html',
    allAttributes.htmlAttributes,
    HtmlWithDoctypeTag,
    { includeGlobalAttributes: true, includeGlobalEvents: true },
  );

  /** @returns {ContentTag} */
  a = this.createContentTag('a', allAttributes.aAttributes);
  /** @returns {ContentTag} */
  abbr = this.createContentTag('abbr', allAttributes.abbrAttributes);
  /** @returns {ContentTag} */
  address = this.createContentTag('address', allAttributes.addressAttributes);
  /** @returns {ContentTag} */
  animate = this.createSvgContentTag('animate', allAttributes.animateAttributes);
  /** @returns {ContentTag} */
  animateMotion = this.createSvgContentTag('animateMotion', allAttributes.animateMotionAttributes);
  /** @returns {ContentTag} */
  animateTransform = this.createSvgContentTag('animateTransform', allAttributes.animateTransformAttributes);
  /** @returns {ContentTag} */
  annotation = this.createMathTag('annotation', allAttributes.annotationAttributes);
  /** @returns {ContentTag} */
  annotationXml = this.createMathTag('annotation-xml', allAttributes.annotationXmlAttributes);
  /** @returns {VoidTag} */
  area = this.createVoidTag('area', allAttributes.areaAttributes);
  /** @returns {ContentTag} */
  article = this.createContentTag('article', allAttributes.articleAttributes);
  /** @returns {ContentTag} */
  aside = this.createContentTag('aside', allAttributes.asideAttributes);
  /** @returns {ContentTag} */
  audio = this.createContentTag('audio', allAttributes.audioAttributes);
  /** @returns {ContentTag} */
  b = this.createContentTag('b', allAttributes.bAttributes);
  /** @returns {VoidTag} */
  base = this.createVoidTag('base', allAttributes.baseAttributes);
  /** @returns {ContentTag} */
  bdi = this.createContentTag('bdi', allAttributes.bdiAttributes);
  /** @returns {ContentTag} */
  bdo = this.createContentTag('bdo', allAttributes.bdoAttributes);
  /** @returns {ContentTag} */
  blockquote = this.createContentTag('blockquote', allAttributes.blockquoteAttributes);
  /** @returns {ContentTag} */
  body = this.createContentTag('body', allAttributes.bodyAttributes);
  /** @returns {VoidTag} */
  br = this.createVoidTag('br', allAttributes.brAttributes);
  /** @returns {ContentTag} */
  button = this.createContentTag('button', allAttributes.buttonAttributes);
  /** @returns {ContentTag} */
  canvas = this.createContentTag('canvas', allAttributes.canvasAttributes);
  /** @returns {ContentTag} */
  caption = this.createContentTag('caption', allAttributes.captionAttributes);
  /** @returns {ContentTag} */
  circle = this.createSvgContentTag('circle', allAttributes.circleAttributes);
  /** @returns {ContentTag} */
  cite = this.createContentTag('cite', allAttributes.citeAttributes);
  /** @returns {ContentTag} */
  clipPath = this.createSvgContentTag('clipPath', allAttributes.clipPathAttributes);
  /** @returns {ContentTag} */
  code = this.createContentTag('code', allAttributes.codeAttributes);
  /** @returns {VoidTag} */
  col = this.createVoidTag('col', allAttributes.colAttributes);
  /** @returns {ContentTag} */
  colgroup = this.createContentTag('colgroup', allAttributes.colgroupAttributes);
  /** @returns {ContentTag} */
  data = this.createContentTag('data', allAttributes.dataAttributes);
  /** @returns {ContentTag} */
  datalist = this.createContentTag('datalist', allAttributes.datalistAttributes);
  /** @returns {ContentTag} */
  dd = this.createContentTag('dd', allAttributes.ddAttributes);
  /** @returns {ContentTag} */
  defs = this.createSvgContentTag('defs', allAttributes.defsAttributes);
  /** @returns {ContentTag} */
  del = this.createContentTag('del', allAttributes.delAttributes);
  /** @returns {ContentTag} */
  desc = this.createSvgContentTag('desc', allAttributes.descAttributes);
  /** @returns {ContentTag} */
  details = this.createContentTag('details', allAttributes.detailsAttributes);
  /** @returns {ContentTag} */
  dfn = this.createContentTag('dfn', allAttributes.dfnAttributes);
  /** @returns {ContentTag} */
  dialog = this.createContentTag('dialog', allAttributes.dialogAttributes);
  /** @returns {ContentTag} */
  div = this.createContentTag('div', allAttributes.divAttributes);
  /** @returns {ContentTag} */
  dl = this.createContentTag('dl', allAttributes.dlAttributes);
  /** @returns {ContentTag} */
  dt = this.createContentTag('dt', allAttributes.dtAttributes);
  /** @returns {ContentTag} */
  ellipse = this.createSvgContentTag('ellipse', allAttributes.ellipseAttributes);
  /** @returns {ContentTag} */
  em = this.createContentTag('em', allAttributes.emAttributes);
  /** @returns {VoidTag} */
  embed = this.createVoidTag('embed', allAttributes.embedAttributes);
  /** @returns {ContentTag} */
  feBlend = this.createSvgContentTag('feBlend', allAttributes.feBlendAttributes);
  /** @returns {ContentTag} */
  feColorMatrix = this.createSvgContentTag('feColorMatrix', allAttributes.feColorMatrixAttributes);
  /** @returns {ContentTag} */
  feComponentTransfer = this.createSvgContentTag('feComponentTransfer', allAttributes.feComponentTransferAttributes);
  /** @returns {ContentTag} */
  feComposite = this.createSvgContentTag('feComposite', allAttributes.feCompositeAttributes);
  /** @returns {ContentTag} */
  feConvolveMatrix = this.createSvgContentTag('feConvolveMatrix', allAttributes.feConvolveMatrixAttributes);
  /** @returns {ContentTag} */
  feDiffuseLighting = this.createSvgContentTag('feDiffuseLighting', allAttributes.feDiffuseLightingAttributes);
  /** @returns {ContentTag} */
  feDisplacementMap = this.createSvgContentTag('feDisplacementMap', allAttributes.feDisplacementMapAttributes);
  /** @returns {ContentTag} */
  feDistantLight = this.createSvgContentTag('feDistantLight', allAttributes.feDistantLightAttributes);
  /** @returns {ContentTag} */
  feDropShadow = this.createSvgContentTag('feDropShadow', allAttributes.feDropShadowAttributes);
  /** @returns {ContentTag} */
  feFlood = this.createSvgContentTag('feFlood', allAttributes.feFloodAttributes);
  /** @returns {ContentTag} */
  feFuncA = this.createSvgContentTag('feFuncA', allAttributes.feFuncAAttributes);
  /** @returns {ContentTag} */
  feFuncB = this.createSvgContentTag('feFuncB', allAttributes.feFuncBAttributes);
  /** @returns {ContentTag} */
  feFuncG = this.createSvgContentTag('feFuncG', allAttributes.feFuncGAttributes);
  /** @returns {ContentTag} */
  feFuncR = this.createSvgContentTag('feFuncR', allAttributes.feFuncRAttributes);
  /** @returns {ContentTag} */
  feGaussianBlur = this.createSvgContentTag('feGaussianBlur', allAttributes.feGaussianBlurAttributes);
  /** @returns {ContentTag} */
  feImage = this.createSvgContentTag('feImage', allAttributes.feImageAttributes);
  /** @returns {ContentTag} */
  feMerge = this.createSvgContentTag('feMerge', allAttributes.feMergeAttributes);
  /** @returns {ContentTag} */
  feMergeNode = this.createSvgContentTag('feMergeNode', allAttributes.feMergeNodeAttributes);
  /** @returns {ContentTag} */
  feMorphology = this.createSvgContentTag('feMorphology', allAttributes.feMorphologyAttributes);
  /** @returns {ContentTag} */
  feOffset = this.createSvgContentTag('feOffset', allAttributes.feOffsetAttributes);
  /** @returns {ContentTag} */
  fePointLight = this.createSvgContentTag('fePointLight', allAttributes.fePointLightAttributes);
  /** @returns {ContentTag} */
  feSpecularLighting = this.createSvgContentTag('feSpecularLighting', allAttributes.feSpecularLightingAttributes);
  /** @returns {ContentTag} */
  feSpotLight = this.createSvgContentTag('feSpotLight', allAttributes.feSpotLightAttributes);
  /** @returns {ContentTag} */
  feTile = this.createSvgContentTag('feTile', allAttributes.feTileAttributes);
  /** @returns {ContentTag} */
  feTurbulence = this.createSvgContentTag('feTurbulence', allAttributes.feTurbulenceAttributes);
  /** @returns {ContentTag} */
  fieldset = this.createContentTag('fieldset', allAttributes.fieldsetAttributes);
  /** @returns {ContentTag} */
  figcaption = this.createContentTag('figcaption', allAttributes.figcaptionAttributes);
  /** @returns {ContentTag} */
  figure = this.createContentTag('figure', allAttributes.figureAttributes);
  /** @returns {ContentTag} */
  filter = this.createSvgContentTag('filter', allAttributes.filterAttributes);
  /** @returns {ContentTag} */
  footer = this.createContentTag('footer', allAttributes.footerAttributes);
  /** @returns {ContentTag} */
  foreignObject = this.createSvgContentTag('foreignObject', allAttributes.foreignObjectAttributes);
  /** @returns {ContentTag} */
  form = this.createContentTag('form', allAttributes.formAttributes);
  /** @returns {ContentTag} */
  g = this.createSvgContentTag('g', allAttributes.gAttributes);
  /** @returns {ContentTag} */
  h1 = this.createContentTag('h1', allAttributes.h1Attributes);
  /** @returns {ContentTag} */
  h2 = this.createContentTag('h2', allAttributes.h2Attributes);
  /** @returns {ContentTag} */
  h3 = this.createContentTag('h3', allAttributes.h3Attributes);
  /** @returns {ContentTag} */
  h4 = this.createContentTag('h4', allAttributes.h4Attributes);
  /** @returns {ContentTag} */
  h5 = this.createContentTag('h5', allAttributes.h5Attributes);
  /** @returns {ContentTag} */
  h6 = this.createContentTag('h6', allAttributes.h6Attributes);
  /** @returns {ContentTag} */
  head = this.createContentTag('head', allAttributes.headAttributes);
  /** @returns {ContentTag} */
  header = this.createContentTag('header', allAttributes.headerAttributes);
  /** @returns {ContentTag} */
  hgroup = this.createContentTag('hgroup', allAttributes.hgroupAttributes);
  /** @returns {VoidTag} */
  hr = this.createVoidTag('hr', allAttributes.hrAttributes);
  /** @returns {ContentTag} */
  html = this.createContentTag('html', allAttributes.htmlAttributes);
  /** @returns {ContentTag} */
  i = this.createContentTag('i', allAttributes.iAttributes);
  /** @returns {ContentTag} */
  iframe = this.createContentTag('iframe', allAttributes.iframeAttributes);
  /** @returns {ContentTag} */
  image = this.createSvgContentTag('image', allAttributes.imageAttributes);
  /** @returns {VoidTag} */
  img = this.createVoidTag('img', allAttributes.imgAttributes);
  /** @returns {VoidTag} */
  input = this.createVoidTag('input', allAttributes.inputAttributes);
  /** @returns {ContentTag} */
  ins = this.createContentTag('ins', allAttributes.insAttributes);
  /** @returns {ContentTag} */
  kbd = this.createContentTag('kbd', allAttributes.kbdAttributes);
  /** @returns {ContentTag} */
  label = this.createContentTag('label', allAttributes.labelAttributes);
  /** @returns {ContentTag} */
  legend = this.createContentTag('legend', allAttributes.legendAttributes);
  /** @returns {ContentTag} */
  li = this.createContentTag('li', allAttributes.liAttributes);
  /** @returns {ContentTag} */
  line = this.createSvgContentTag('line', allAttributes.lineAttributes);
  /** @returns {ContentTag} */
  linearGradient = this.createSvgContentTag('linearGradient', allAttributes.linearGradientAttributes);
  /** @returns {VoidTag} */
  link = this.createVoidTag('link', allAttributes.linkAttributes);
  /** @returns {ContentTag} */
  main = this.createContentTag('main', allAttributes.mainAttributes);
  /** @returns {ContentTag} */
  map = this.createContentTag('map', allAttributes.mapAttributes);
  /** @returns {ContentTag} */
  mark = this.createContentTag('mark', allAttributes.markAttributes);
  /** @returns {ContentTag} */
  marker = this.createSvgContentTag('marker', allAttributes.markerAttributes);
  /** @returns {ContentTag} */
  mask = this.createSvgContentTag('mask', allAttributes.maskAttributes);
  /** @returns {ContentTag} */
  math = this.createMathTag('math', allAttributes.mathAttributes);
  /** @returns {ContentTag} */
  menclose = this.createMathTag('menclose', allAttributes.mencloseAttributes);
  /** @returns {ContentTag} */
  menu = this.createContentTag('menu', allAttributes.menuAttributes);
  /** @returns {ContentTag} */
  merror = this.createMathTag('merror', allAttributes.merrorAttributes);
  /** @returns {VoidTag} */
  meta = this.createVoidTag('meta', allAttributes.metaAttributes);
  /** @returns {ContentTag} */
  metadata = this.createSvgContentTag('metadata', allAttributes.metadataAttributes);
  /** @returns {ContentTag} */
  meter = this.createContentTag('meter', allAttributes.meterAttributes);
  /** @returns {ContentTag} */
  mfrac = this.createMathTag('mfrac', allAttributes.mfracAttributes);
  /** @returns {ContentTag} */
  mi = this.createMathTag('mi', allAttributes.miAttributes);
  /** @returns {ContentTag} */
  mmultiscripts = this.createMathTag('mmultiscripts', allAttributes.mmultiscriptsAttributes);
  /** @returns {ContentTag} */
  mn = this.createMathTag('mn', allAttributes.mnAttributes);
  /** @returns {ContentTag} */
  mo = this.createMathTag('mo', allAttributes.moAttributes);
  /** @returns {ContentTag} */
  mover = this.createMathTag('mover', allAttributes.moverAttributes);
  /** @returns {ContentTag} */
  mpadded = this.createMathTag('mpadded', allAttributes.mpaddedAttributes);
  /** @returns {ContentTag} */
  mpath = this.createSvgContentTag('mpath', allAttributes.mpathAttributes);
  /** @returns {ContentTag} */
  mphantom = this.createMathTag('mphantom', allAttributes.mphantomAttributes);
  /** @returns {ContentTag} */
  mprescripts = this.createMathTag('mprescripts', allAttributes.mprescriptsAttributes);
  /** @returns {ContentTag} */
  mroot = this.createMathTag('mroot', allAttributes.mrootAttributes);
  /** @returns {ContentTag} */
  mrow = this.createMathTag('mrow', allAttributes.mrowAttributes);
  /** @returns {ContentTag} */
  ms = this.createMathTag('ms', allAttributes.msAttributes);
  /** @returns {ContentTag} */
  mspace = this.createMathTag('mspace', allAttributes.mspaceAttributes);
  /** @returns {ContentTag} */
  msqrt = this.createMathTag('msqrt', allAttributes.msqrtAttributes);
  /** @returns {ContentTag} */
  mstyle = this.createMathTag('mstyle', allAttributes.mstyleAttributes);
  /** @returns {ContentTag} */
  msub = this.createMathTag('msub', allAttributes.msubAttributes);
  /** @returns {ContentTag} */
  msubsup = this.createMathTag('msubsup', allAttributes.msubsupAttributes);
  /** @returns {ContentTag} */
  msup = this.createMathTag('msup', allAttributes.msupAttributes);
  /** @returns {ContentTag} */
  mtable = this.createMathTag('mtable', allAttributes.mtableAttributes);
  /** @returns {ContentTag} */
  mtd = this.createMathTag('mtd', allAttributes.mtdAttributes);
  /** @returns {ContentTag} */
  mtext = this.createMathTag('mtext', allAttributes.mtextAttributes);
  /** @returns {ContentTag} */
  mtr = this.createMathTag('mtr', allAttributes.mtrAttributes);
  /** @returns {ContentTag} */
  munder = this.createMathTag('munder', allAttributes.munderAttributes);
  /** @returns {ContentTag} */
  munderover = this.createMathTag('munderover', allAttributes.munderoverAttributes);
  /** @returns {ContentTag} */
  nav = this.createContentTag('nav', allAttributes.navAttributes);
  /** @returns {ContentTag} */
  noscript = this.createContentTag('noscript', allAttributes.noscriptAttributes);
  /** @returns {ContentTag} */
  object = this.createContentTag('object', allAttributes.objectAttributes);
  /** @returns {ContentTag} */
  ol = this.createContentTag('ol', allAttributes.olAttributes);
  /** @returns {ContentTag} */
  optgroup = this.createContentTag('optgroup', allAttributes.optgroupAttributes);
  /** @returns {ContentTag} */
  option = this.createContentTag('option', allAttributes.optionAttributes);
  /** @returns {ContentTag} */
  output = this.createContentTag('output', allAttributes.outputAttributes);
  /** @returns {ContentTag} */
  p = this.createContentTag('p', allAttributes.pAttributes);
  /** @returns {ContentTag} */
  path = this.createSvgContentTag('path', allAttributes.pathAttributes);
  /** @returns {ContentTag} */
  pattern = this.createSvgContentTag('pattern', allAttributes.patternAttributes);
  /** @returns {ContentTag} */
  picture = this.createContentTag('picture', allAttributes.pictureAttributes);
  /** @returns {ContentTag} */
  polygon = this.createSvgContentTag('polygon', allAttributes.polygonAttributes);
  /** @returns {ContentTag} */
  polyline = this.createSvgContentTag('polyline', allAttributes.polylineAttributes);
  /** @returns {ContentTag} */
  pre = this.createLiteralContentTag('pre', allAttributes.preAttributes);
  /** @returns {ContentTag} */
  progress = this.createContentTag('progress', allAttributes.progressAttributes);
  /** @returns {ContentTag} */
  q = this.createContentTag('q', allAttributes.qAttributes);
  /** @returns {ContentTag} */
  radialGradient = this.createSvgContentTag('radialGradient', allAttributes.radialGradientAttributes);
  /** @returns {ContentTag} */
  rect = this.createSvgContentTag('rect', allAttributes.rectAttributes);
  /** @returns {ContentTag} */
  rp = this.createContentTag('rp', allAttributes.rpAttributes);
  /** @returns {ContentTag} */
  rt = this.createContentTag('rt', allAttributes.rtAttributes);
  /** @returns {ContentTag} */
  ruby = this.createContentTag('ruby', allAttributes.rubyAttributes);
  /** @returns {ContentTag} */
  s = this.createContentTag('s', allAttributes.sAttributes);
  /** @returns {ContentTag} */
  samp = this.createContentTag('samp', allAttributes.sampAttributes);
  /** @returns {ContentTag} */
  script = this.createLiteralContentTag('script', allAttributes.scriptAttributes);
  /** @returns {ContentTag} */
  search = this.createContentTag('search', allAttributes.searchAttributes);
  /** @returns {ContentTag} */
  section = this.createContentTag('section', allAttributes.sectionAttributes);
  /** @returns {ContentTag} */
  select = this.createContentTag('select', allAttributes.selectAttributes);
  /** @returns {VoidTag} */
  selectedcontent = this.createVoidTag('selectedcontent', allAttributes.selectedcontentAttributes);
  /** @returns {ContentTag} */
  semantics = this.createMathTag('semantics', allAttributes.semanticsAttributes);
  /** @returns {ContentTag} */
  set = this.createSvgContentTag('set', allAttributes.setAttributes);
  /** @returns {ContentTag} */
  slot = this.createContentTag('slot', allAttributes.slotAttributes);
  /** @returns {ContentTag} */
  small = this.createContentTag('small', allAttributes.smallAttributes);
  /** @returns {VoidTag} */
  source = this.createVoidTag('source', allAttributes.sourceAttributes);
  /** @returns {ContentTag} */
  span = this.createContentTag('span', allAttributes.spanAttributes);
  /** @returns {ContentTag} */
  stop = this.createSvgContentTag('stop', allAttributes.stopAttributes);
  /** @returns {ContentTag} */
  strong = this.createContentTag('strong', allAttributes.strongAttributes);
  /** @returns {ContentTag} */
  style = this.createLiteralContentTag('style', allAttributes.styleAttributes);
  /** @returns {ContentTag} */
  sub = this.createContentTag('sub', allAttributes.subAttributes);
  /** @returns {ContentTag} */
  summary = this.createContentTag('summary', allAttributes.summaryAttributes);
  /** @returns {ContentTag} */
  sup = this.createContentTag('sup', allAttributes.supAttributes);
  /** @returns {ContentTag} */
  svg = this.createSvgContentTag('svg', allAttributes.svgAttributes);
  /** @returns {ContentTag} */
  switch = this.createSvgContentTag('switch', allAttributes.switchAttributes);
  /** @returns {ContentTag} */
  symbol = this.createSvgContentTag('symbol', allAttributes.symbolAttributes);
  /** @returns {ContentTag} */
  table = this.createContentTag('table', allAttributes.tableAttributes);
  /** @returns {ContentTag} */
  tbody = this.createContentTag('tbody', allAttributes.tbodyAttributes);
  /** @returns {ContentTag} */
  td = this.createContentTag('td', allAttributes.tdAttributes);
  /** @returns {ContentTag} */
  template = this.createContentTag('template', allAttributes.templateAttributes);
  /** @returns {ContentTag} */
  text = this.createSvgContentTag('text', allAttributes.textAttributes);
  /** @returns {ContentTag} */
  textarea = this.createLiteralContentTag('textarea', allAttributes.textareaAttributes);
  /** @returns {ContentTag} */
  textPath = this.createSvgContentTag('textPath', allAttributes.textPathAttributes);
  /** @returns {ContentTag} */
  tfoot = this.createContentTag('tfoot', allAttributes.tfootAttributes);
  /** @returns {ContentTag} */
  th = this.createContentTag('th', allAttributes.thAttributes);
  /** @returns {ContentTag} */
  thead = this.createContentTag('thead', allAttributes.theadAttributes);
  /** @returns {ContentTag} */
  time = this.createContentTag('time', allAttributes.timeAttributes);
  /** @returns {ContentTag} */
  title = this.createContentTag('title', allAttributes.titleAttributes);
  /** @returns {ContentTag} */
  tr = this.createContentTag('tr', allAttributes.trAttributes);
  /** @returns {VoidTag} */
  track = this.createVoidTag('track', allAttributes.trackAttributes);
  /** @returns {ContentTag} */
  tspan = this.createSvgContentTag('tspan', allAttributes.tspanAttributes);
  /** @returns {ContentTag} */
  u = this.createContentTag('u', allAttributes.uAttributes);
  /** @returns {ContentTag} */
  ul = this.createContentTag('ul', allAttributes.ulAttributes);
  /** @returns {ContentTag} */
  use = this.createSvgContentTag('use', allAttributes.useAttributes);
  /** @returns {ContentTag} */
  var = this.createContentTag('var', allAttributes.varAttributes);
  /** @returns {ContentTag} */
  video = this.createContentTag('video', allAttributes.videoAttributes);
  /** @returns {ContentTag} */
  view = this.createSvgContentTag('view', allAttributes.viewAttributes);
  /** @returns {VoidTag} */
  wbr = this.createVoidTag('wbr', allAttributes.wbrAttributes);
}

/**
 * Creates a reactive signal. Pass as content or an attribute value — the DOM updates live.
 * @template T
 * @param {T} initial
 * @returns {Signal<T>}
 * @example
 * const count = signal(0);
 * document.body.append(t.div(count).toElement());
 * count.set(n => n + 1);
 */
export function signal(initial) {
  return new Signal(initial);
}

export { computed, effect };
