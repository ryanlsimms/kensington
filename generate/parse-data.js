import { kebabToCamel, kebabToPascal } from './utils/text-utils.js';

const tagsToSkip = [
  'autonomous custom elements',
  'h1, h2, h3, h4, h5, h6',
  'MathML math',
  'SVG svg',
];

// Named content group references in the HTML spec's children column, resolved to concrete tag names.
// script-supporting elements and the select/optgroup inner content lists are defined as footnotes
// in the spec table; these are the resolved memberships.
const CHILDREN_ALIASES = {
  'script-supporting elements': ['script', 'template'],
  'select element inner content elements': ['option', 'optgroup', 'hr', 'script', 'template', 'noscript', 'div'],
  'optgroup element inner content elements': ['option', 'script', 'template', 'noscript', 'div'],
};

// Category keywords that represent open content models — any element containing one of these
// cannot have its children narrowed to a finite TypeScript union.
const OPEN_CATEGORIES = new Set([
  'flow', 'phrasing', 'heading content', 'metadata content',
  'transparent', 'text', 'per [MATHML]', 'per [SVG]',
  'script, data, or script documentation', 'option element inner content elements',
  'varies', // noscript: content model is context-dependent
]);

// Returns the set of concrete tag names permitted as children, plus a flag indicating whether
// the content model is fully enumerable (no open categories). The * and "one " prefixes used
// in the spec data are stripped; empty/unknown entries are skipped.
function resolveChildren(children) {
  const resolved = [];
  let strict = true;
  for (const raw of children) {
    const norm = raw.replace(/\*$/, '').replace(/^one /, '').trim();
    if (norm === '' || norm === 'empty') { continue; }
    if (OPEN_CATEGORIES.has(norm)) {
      strict = false;
      continue;
    }
    const alias = CHILDREN_ALIASES[norm];
    if (alias) {
      for (const tag of alias) { resolved.push(tag); }
    } else {
      resolved.push(norm);
    }
  }
  return { strict, resolved: [...new Set(resolved)] };
}

export default function parseData(htmlData, svgData, mathData, { cssPropertyTypes, cssPropertyNames, idlTypes } = {}) {
  const { svgAttributes, svgElements } = svgData;
  const { attributes, globalEvents, htmlElements } = htmlData;

  const headingElement = htmlElements.find(e => e.tag === 'h1, h2, h3, h4, h5, h6');
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => htmlElements.push({
    ...headingElement,
    tag,
  }));

  attributes.push(...svgAttributes);

  htmlElements.forEach(el => {
    el.tagType = el.children[0] === 'empty' ? 'Void' : 'Content';
    el.attributes.splice(el.attributes.indexOf('globals'), 1);
    if (['template', 'iframe'].includes(el.tag)) {
      el.tagType = 'Content';
    }
    if (['script', 'style', 'textarea', 'pre'].includes(el.tag)) {
      el.tagType = 'LiteralContent';
    }
  });

  svgElements.forEach(svgEl => {
    if (!htmlElements.find(el => el.tag === svgEl.tag)) {
      if (cssPropertyNames) {
        htmlElements.push({ ...svgEl, tagType: 'SvgContent' });
      } else {
        const presentationAttrNames = new Set(svgData.svgPresentationAttributes ?? []);
        const elAttrSet = new Set(svgEl.attributes);
        const filteredPresentation = [...presentationAttrNames].filter(n => {
          return !elAttrSet.has(n) && !elAttrSet.has(kebabToCamel(n));
        });
        const merged = [...new Set([...svgEl.attributes, ...filteredPresentation])];
        htmlElements.push({ ...svgEl, attributes: merged, tagType: 'SvgContent' });
      }
    }
  });

  const svgPresentationAttrTypes = cssPropertyNames
    ? [...cssPropertyNames].sort().map(name => {
      const cssType = cssPropertyTypes?.get(name);
      return cssType ? { name, ...cssType } : { name, type: 'string', value: 'String' };
    })
    : null;

  mathData.forEach(mathEl => {
    if (!htmlElements.find(el => el.tag === mathEl.tag)) {
      htmlElements.push({ ...mathEl, tagType: 'Math' });
      mathEl.attributes.forEach(mathAttr => {
        if (!attributes.find(attr => attr.attribute === mathAttr)) {
          attributes.push({
            attribute: mathAttr,
            elements: [],
            value: [],
          });
        }
      });
    }
  });

  const elements = htmlElements.filter(e => !tagsToSkip.includes(e.tag)).sort((a, b) => a.tag.localeCompare(b.tag));

  // eslint-disable-next-line no-template-curly-in-string
  const numberTsType = 'number | `${number}`';

  function getAttributeType(attr) {
    const values = (attr.value ?? []).filter(value => value !== 'the empty string' && value !== '');
    if (attr.attribute === 'value') {
      return ['[Number,String]', 'number | string'];
    }
    if (values[0]?.toLowerCase?.() === 'boolean attribute') {
      return ['Boolean', 'boolean'];
    }
    if ([
      'Valid non-negative integer greater than zero',
      'Valid non-negative integer',
      'Valid non-negative integer between 0 and 8',
      'Valid integer',
    ].includes(values[0])) {
      return ['Number', numberTsType];
    }
    if (values[0] === '<boolean>') {
      return [
        `[true,false]`,
        '"true" | "false"',
      ];
    }
    if (values[0] === '<number>') {
      return ['Number', numberTsType];
    }
    if (['<length>', '<coordinate>', '<integer>', '<long>', '<length-percentage>'].includes(values[0])) {
      return ['[Number,String]', 'number | string'];
    }
    if (
      values[0] === 'Valid floating-point number' ||
      values[0] === 'Valid floating-point number*' ||
      values[0] === 'Valid floating-point number greater than zero, or "any"'
    ) {
      return ['[Number,String]', 'number | string'];
    }
    if (values.length && values.every(value => /^".*"$/.test(value))) {
      return [
        `['${values.map(v => v.slice(1, -1)).join("', '")}']`,
        values.join(' | '),
      ];
    }
    if (attr.attribute.startsWith('on')) {
      return ['[String, Function]', 'string | ((event: Event) => void)'];
    }
    return ['String', 'string'];
  }

  function mapAttr(attr) {
    const [value, type] = getAttributeType(attr);
    return {
      name: attr.attribute,
      type,
      value,
    };
  }

  function attrFallback(name) {
    const idlResult = idlTypes?.get(name);
    if (idlResult) {
      return { name, ...idlResult };
    }
    if (name.startsWith('on')) {
      return { name, type: 'string | ((event: Event) => void)', value: '[String, Function]' };
    }
    return { name, type: 'string', value: 'String' };
  }

  const globalAttributes = attributes
    .filter(a => a.elements.includes('HTML elements'))
    .concat({ attribute: 'role' })
    .sort((a, b) => a.attribute.localeCompare(b.attribute))
    .map(mapAttr);

  function getGlobalsByTagType(tagType) {
    switch (tagType) {
      case 'Svg':
        return ['NameSpaceAttributes'];
      case 'Math':
        return ['NameSpaceAttributes', 'GlobalEvents'];
      default:
        return ['NameSpaceAttributes', 'GlobalAttributes', 'GlobalEvents'];
    }
  }

  elements.forEach(el => {
    el.attributes = el.attributes
      .filter(a => !['any*'].includes(a))
      .map(attr => attr.replace(/\*/g, ''))
      .sort()
      .map(attr => {
        const match = attributes.find(a => {
          return a.attribute === attr && a.elements.some(e => e.trim().split(/\s+/).includes(el.tag));
        });
        if (match) {
          return mapAttr(match);
        }
        const globalMatch = attributes.find(a => a.attribute === attr && a.elements.includes('HTML elements'));
        if (globalMatch) {
          return mapAttr(globalMatch);
        }
        const cssType = cssPropertyTypes?.get(attr);
        if (cssType) {
          return { name: attr, ...cssType };
        }
        const anyMatch = attributes.find(a => a.attribute === attr);
        if (anyMatch) {
          return mapAttr(anyMatch);
        }
        return attrFallback(attr);
      });
    el.methodName = kebabToCamel(el.tag);
    el.pascalTag = kebabToPascal(el.tag);
    el.attributesName = `${el.methodName}Attributes`;
    el.attributesTypeName = `${el.pascalTag}Attributes`;
    el.returnTagType = el.tagType === 'Void' ? el.tagType : 'Content';
    el.globalTypes = getGlobalsByTagType(el.tagType);
    if (el.children && el.tagType !== 'Void') {
      const { strict, resolved } = resolveChildren(el.children);
      if (strict && resolved.length > 0) {
        el.strictChildren = resolved;
      }
    }
  });

  // Mark elements that need a branded TypeScript return type: either they are a strict container
  // (their own children are narrowed) or they appear as a named child in one.
  const brandedTags = new Set(elements.flatMap(el => el.strictChildren ?? []));
  elements.forEach(el => {
    el.branded = brandedTags.has(el.tag) || el.strictChildren !== undefined;
  });

  return {
    attributes,
    elements,
    globalAttributes,
    globalEvents,
    svgPresentationAttrTypes,
  };
}
