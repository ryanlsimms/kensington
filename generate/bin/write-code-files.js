import fs from 'node:fs';
import path from 'node:path';

import { listAll } from '@webref/css';
import { parseAll } from '@webref/idl';

import buildAttributes from '../build-attributes.js';
import buildAttributesDeclarations from '../build-attributes-declarations.js';
import buildDeclarations from '../build-declarations.js';
import buildKensington from '../build-kensington.js';
import buildSvgElementCase from '../build-svg-element-case.js';
import buildTagInfo from '../build-tag-info.js';
import parseCssPropertyTypes, { svgOnlySupplementNames } from '../parse-css-property-types.js';
import parseData from '../parse-data.js';
import parseIdlTypes from '../parse-idl-types.js';

const { default: htmlData } = await import('../fetched-data/html.json', { with: { type: 'json' } });
const { default: svgData } = await import('../fetched-data/svg.json', { with: { type: 'json' } });
const { default: mathData } = await import('../fetched-data/math.json', { with: { type: 'json' } });

const cssData = await listAll();
const cssPropertyTypes = parseCssPropertyTypes(cssData.properties, cssData.types);
const cssPropertyNames = new Set(
  cssData.properties
    .map(p => p.name)
    .filter(n => !n.startsWith('-') && !n.startsWith('--')),
);
svgOnlySupplementNames.forEach(name => cssPropertyNames.add(name));

const idlData = await parseAll();
const idlTypes = parseIdlTypes(idlData.html ?? []);

const {
  attributes,
  elements,
  globalAttributes,
  globalEvents,
  svgPresentationAttrTypes,
} = parseData(htmlData, svgData, mathData, { cssPropertyTypes, cssPropertyNames, idlTypes });

const declarationsContent = buildDeclarations({
  attributes,
  elements,
  globalAttributes,
  globalEvents,
  svgPresentationAttrTypes,
});

const attributesDeclarationsContent = buildAttributesDeclarations({ elements });

const kensingtonClassContent = buildKensington({ elements });

const attributesContent = buildAttributes({
  elements,
  globalAttributes,
  globalEvents,
  svgPresentationAttrTypes,
});

const svgElementCaseContent = buildSvgElementCase({ svgElements: svgData.svgElements });

const tagInfoContent = buildTagInfo({ elements });

fs.writeFileSync(path.resolve(import.meta.dirname, '../../types.d.ts'), declarationsContent, 'utf8');
fs.writeFileSync(path.resolve(import.meta.dirname, '../../attributes.d.ts'), attributesDeclarationsContent, 'utf8');
fs.writeFileSync(path.resolve(import.meta.dirname, '../../esm/kensington.js'), kensingtonClassContent, 'utf8');
fs.writeFileSync(path.resolve(import.meta.dirname, '../../esm/attributes.js'), attributesContent, 'utf8');
fs.writeFileSync(path.resolve(import.meta.dirname, '../../esm/tag-info.js'), tagInfoContent, 'utf8');
fs.writeFileSync(path.resolve(import.meta.dirname, '../../bin/lib/svg-element-case.js'), svgElementCaseContent, 'utf8');

await import('./build-cjs.js');
await import('./build-browser.js');

console.log('\n~~~~~ write finished ~~~~~\n');
