import fs from 'node:fs';
import path from 'node:path';

import fetchHtmlData from '../fetch/fetch-html-data.js';
import fetchMathMlData from '../fetch/fetch-math-ml-data.js';
import fetchSvgData from '../fetch/fetch-svg-data.js';

const htmlData = await fetchHtmlData();
const svgData = await fetchSvgData();
const mathData = await fetchMathMlData();

const dataDir = path.resolve(import.meta.dirname, '../fetched-data');
fs.writeFileSync(path.resolve(dataDir, './html.json'), JSON.stringify(htmlData, null, 2), 'utf8');
fs.writeFileSync(path.resolve(dataDir, './svg.json'), JSON.stringify(svgData, null, 2), 'utf8');
fs.writeFileSync(path.resolve(dataDir, './math.json'), JSON.stringify(mathData, null, 2), 'utf8');

console.log('\n~~~~~ fetch finished ~~~~~\n');
