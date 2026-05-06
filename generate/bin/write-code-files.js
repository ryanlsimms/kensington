import fs from 'node:fs';
import path from 'node:path';

import buildAttributes from '../build-attributes.js';
import buildAttributesDeclarations from '../build-attributes-declarations.js';
import buildDeclarations from '../build-declarations.js';
import buildKensington from '../build-kensington.js';
import parseData from '../parse-data.js';

const { default: htmlData } = await import('../fetched-data/html.json', { with: { type: 'json' } });
const { default: svgData } = await import('../fetched-data/svg.json', { with: { type: 'json' } });
const { default: mathData } = await import('../fetched-data/math.json', { with: { type: 'json' } });

const {
  attributes,
  elements,
  globalAttributes,
  globalEvents,
} = parseData(htmlData, svgData, mathData);

const declarationsContent = buildDeclarations({
  attributes,
  elements,
  globalAttributes,
  globalEvents,
});

const attributesDeclarationsContent = buildAttributesDeclarations({ elements });

const kensingtonClassContent = buildKensington({ elements });

const attributesContent = buildAttributes({
  elements,
  globalAttributes,
  globalEvents,
});

fs.writeFileSync(path.resolve(import.meta.dirname, '../../types.d.ts'), declarationsContent, 'utf8');
fs.writeFileSync(path.resolve(import.meta.dirname, '../../attributes.d.ts'), attributesDeclarationsContent, 'utf8');
fs.writeFileSync(path.resolve(import.meta.dirname, '../../esm/kensington.js'), kensingtonClassContent, 'utf8');
fs.writeFileSync(path.resolve(import.meta.dirname, '../../esm/attributes.js'), attributesContent, 'utf8');

await import('./build-cjs.js');
await import('./build-browser.js');

console.log('\n~~~~~ write finished ~~~~~\n');
