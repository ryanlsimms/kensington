import fs from 'node:fs';
import path from 'node:path';
import { rollup } from 'rollup';
// import html5 from 'html-validate/dist/es/html5.js'
import buildDeclarations from './build-declarations.js';
import { buildAttributes, buildMain } from './build-javascript.js';
import fetchHtmlData from './fetch/fetch-html-data.js';
import fetchSvgData from './fetch/fetch-svg-data.js';
import fetchMathMlData from './fetch/fetch-math-ml-data.js';
import { kebabToPascal, kebabToCamel } from './utils/text-utils.js';


const tagsToSkip = [
  'autonomous custom elements',
  'h1, h2, h3, h4, h5, h6',
  'MathML math',
  'SVG svg'
];

const { svgElements, svgAttributes } = await fetchSvgData();
const { htmlElements, globalEvents, attributes } = await fetchHtmlData()
const mathElements = await fetchMathMlData();

const headingElement = htmlElements.find(e => e.tag === 'h1, h2, h3, h4, h5, h6');
['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => htmlElements.push({
  ...headingElement,
  tag,
}));

htmlElements.forEach(el => {
  el.tagType = el.children[0] === 'empty' ? 'Void' : 'Content';
  el.attributes.splice(el.attributes.indexOf('globals'), 1);
  if (['template', 'iframe'].includes(el.tag)) {
    el.tagType = 'Content';
  }
  if (el.tag === 'script') {
    el.tagType = 'LiteralContent';
  }
  if (['textarea', 'pre'].includes(el.tag)) {
    el.tagType = 'LiteralContent';
  }
});

svgElements.forEach(svgEl => {
  if (!htmlElements.find(el => el.tag === svgEl.tag)) {
    const tagType = svgEl.children.length ? 'SvgContent' : 'SvgVoid';
    htmlElements.push({ ...svgEl, tagType });
    svgEl.attributes.forEach(svgAttr => {
      if (!attributes.find(attr => attr.attribute === svgAttr) && !globalEvents.includes(svgAttr)) {
        const found = svgAttributes.find(a => a.attribute === svgAttr);
        if (found) {
          attributes.push(found)
        } else {
          attributes.push({
            attribute: svgAttr,
            elements: [],
            value: [],
          })
        }
      }
    })
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
        })
      }
    })
  }
});

const elements = htmlElements.filter(e => !tagsToSkip.includes(e.tag)).sort((a, b) => a.tag.localeCompare(b.tag));

function getAttributeType(attr) {
  const values = attr.value ?? [];
  if (attr.attribute === 'value') {
    return ['[Number,String]', 'number | string']
  }
  if (values[0]?.toLowerCase?.() === 'boolean attribute') {
    return ['Boolean', 'boolean'];
  }
  if (values[0] === 'Valid non-negative integer greater than zero') {
    return ['Number', 'number']
  }
  if (values[0] === '<boolean>') {
    return [
      `[true,false]`,
      '"true" | "false"',
    ]
  }
  if (values[0] === '<number>') {
    return ['Number', 'number']
  }
  if (['<length>', '<coordinate>', '<integer>', '<long>'].includes(values[0])) {
    return ['[Number,String]', 'number | string']
  }
  if (values.length && values.every(value => /^".*"$/.test(value))) {
    return [
      `[${values.join()}]`,
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
    .sort()
    .map(attr => {
      const match = attributes.find(a => a.attribute === attr &&  a.elements.includes(el.tag));
      const found = match ?? attributes.find(a => a.attribute === attr && a.elements.includes('HTML elements'));
      return found ? mapAttr(found) : { name: attr, type: 'string', value: 'String' };
    });
  el.methodName = kebabToCamel(el.tag);
  el.pascalTag = kebabToPascal(el.tag);
  el.attributesName = `${el.methodName}Attributes`
  el.attributesTypeName = `${el.pascalTag}Attributes`
  el.returnTagType = el.tagType === 'Void' ? el.tagType : 'Content'
  el.globalTypes = getGlobalsByTagType(el.tagType)
});


const declarationsContent = buildDeclarations({
  attributes,
  elements,
  globalAttributes,
  globalEvents,
});

const kensingtonClassContent = buildMain({ elements });

const attributesContent = buildAttributes({
  elements,
  globalAttributes,
  globalEvents,
});

fs.writeFileSync(path.resolve(import.meta.dirname, '../types.d.ts'), declarationsContent, 'utf8');
fs.writeFileSync(path.resolve(import.meta.dirname, '../esm/kensington.js'), kensingtonClassContent, 'utf8');
fs.writeFileSync(path.resolve(import.meta.dirname, '../esm/attributes.js'), attributesContent, 'utf8');

const result = await rollup({
  input: ['./esm/kensington.js'],
  external: ['he'],
});
await result.write({
  dir: './cjs',
  format: 'cjs',
  exports: 'named',
  preserveModules: true,
  generatedCode: {
    constBindings: true,
  },
});

fs.writeFileSync(path.resolve(import.meta.dirname, '../cjs/package.json'), '{\n  "type": "commonjs"\n}\n', 'utf8');

console.log('\n~~~~~ finished ~~~~~\n');
process.exit(0);
