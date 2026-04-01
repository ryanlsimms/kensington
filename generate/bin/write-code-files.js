import fs from 'node:fs';
import path from 'node:path';
import { rollup } from 'rollup';
import buildDeclarations from '../build-declarations.js';
import { buildAttributes, buildMain } from '../build-javascript.js';
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

const kensingtonClassContent = buildMain({ elements });

const attributesContent = buildAttributes({
  elements,
  globalAttributes,
  globalEvents,
});

fs.writeFileSync(path.resolve(import.meta.dirname, '../../types.d.ts'), declarationsContent, 'utf8');
fs.writeFileSync(path.resolve(import.meta.dirname, '../../esm/kensington.js'), kensingtonClassContent, 'utf8');
fs.writeFileSync(path.resolve(import.meta.dirname, '../../esm/attributes.js'), attributesContent, 'utf8');

const result = await rollup({
  input: ['../../esm/kensington.js'],
  external: ['he'],
});
await result.write({
  dir: '../../cjs',
  format: 'cjs',
  exports: 'named',
  preserveModules: true,
  generatedCode: {
    constBindings: true,
  },
});

fs.writeFileSync(path.resolve(import.meta.dirname, '../../cjs/package.json'), '{\n  "type": "commonjs"\n}\n', 'utf8');

console.log('\n~~~~~ write finished ~~~~~\n');
