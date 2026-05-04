import { kebabToCamel, kebabToPascal } from './utils/text-utils.js';

const tagsToSkip = [
  'autonomous custom elements',
  'h1, h2, h3, h4, h5, h6',
  'MathML math',
  'SVG svg',
];

export default function parseData(htmlData, svgData, mathElements) {
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
      htmlElements.push({ ...svgEl, tagType: 'SvgContent' });
    }
  });

  mathElements.forEach(mathEl => {
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

  function getAttributeType(attr) {
    const values = (attr.value ?? []).filter(value => value !== 'the empty string');
    if (attr.attribute === 'value') {
      return ['[Number,String]', 'number | string'];
    }
    if (values[0]?.toLowerCase?.() === 'boolean attribute') {
      return ['Boolean', 'boolean'];
    }
    if ([
      'Valid non-negative integer greater than zero',
      'Valid non-negative integer',
      'Valid integer',
    ].includes(values[0])) {
      return ['Number', 'number'];
    }
    if (values[0] === '<boolean>') {
      return [
        `[true,false]`,
        '"true" | "false"',
      ];
    }
    if (values[0] === '<number>') {
      return ['Number', 'number'];
    }
    if (['<length>', '<coordinate>', '<integer>', '<long>', '<length-percentage>'].includes(values[0])) {
      return ['[Number,String]', 'number | string'];
    }
    if (values.length && values.every(value => /^".*"$/.test(value))) {
      return [
        `['${values.map(v => v.slice(1, -1)).join("', '")}']`,
        values.join(' | '),
      ];
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
        const found = match ?? attributes.find(a => a.attribute === attr && a.elements.includes('HTML elements'));
        return found ? mapAttr(found) : { name: attr, type: 'string', value: 'String' };
      });
    el.methodName = kebabToCamel(el.tag);
    el.pascalTag = kebabToPascal(el.tag);
    el.attributesName = `${el.methodName}Attributes`;
    el.attributesTypeName = `${el.pascalTag}Attributes`;
    el.returnTagType = el.tagType === 'Void' ? el.tagType : 'Content';
    el.globalTypes = getGlobalsByTagType(el.tagType);
  });

  return {
    attributes,
    elements,
    globalAttributes,
    globalEvents,
  };
}
