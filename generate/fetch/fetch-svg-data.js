import fetchAsDom from '../utils/fetch-as-dom.js';

async function getElements(url) {
  const dom = await fetchAsDom(url);

  const elementSummaries = dom.querySelectorAll('.element-summary');

  const elements = [];
  for (const summary of elementSummaries) {
    const tag = summary.querySelector('.element-name').textContent.replaceAll(/[\u2018\u2019]/g, '');
    const attributeSpans = summary.querySelectorAll('.attr-name, .property');
    const attributes = [...new Set([...attributeSpans]
      .map(span => span.textContent.replaceAll(/[\u2018\u2019]/g, ''))
      .filter(attr => !attr.startsWith('aria'))
      .sort())];
    elements.push({ tag, attributes, children: [] });
  }

  return elements;
}

async function getDraftElements(url) {
  const dom = await fetchAsDom(url);

  const elementTables = dom.querySelectorAll('.definition-table');

  const elements = [];
  for (const table of elementTables) {
    const tag = table.querySelector('dfn').textContent;
    const attributeSpans = table.querySelectorAll('.attr-name');
    const attributes = [...new Set([...attributeSpans]
      .map(span => span.textContent.replaceAll(/[\u2018\u2019]/g, ''))
      .filter(attr => !attr.startsWith('aria'))
      .sort())];
    elements.push({ tag, attributes, children: [] });
  }

  return elements;
}

async function getAttributes(url) {
  const dom = await fetchAsDom(url);

  const rows = dom.querySelectorAll('#attributes tbody tr');

  return [...rows].map(row => {
    return {
      attribute: row.querySelector('.attribute-name').textContent,
      value:  row.querySelector('.attribute-value').textContent.split("|").map(v => v.replaceAll(`'`, '"').trim()),
      elements:  row.querySelector('.attribute-parents').textContent.split(",").map(v => v.trim()),
      type: 'svg'
    }
  });
}

export default async function fetchSvgData() {
  const [
    animationElements,
    cssMasingElements,
    embededElements,
    filterElements,
    interactElements,
    linkingElements,
    paintServerElements,
    paintingElements,
    pathElements,
    shapeElements,
    structElements,
    stylingElements,
    textElements,
    svgAttributes,
  ] = await Promise.all([
    getElements('https://svgwg.org/specs/animations'),
    getDraftElements('https://drafts.fxtf.org/css-masking-1'),
    getElements('https://svgwg.org/svg2-draft/embedded.html'),
    getDraftElements('https://drafts.fxtf.org/filter-effects/'),
    getElements('https://svgwg.org/svg2-draft/interact.html'),
    getElements('https://svgwg.org/svg2-draft/linking.html'),
    getElements('https://svgwg.org/svg2-draft/pservers.html'),
    getElements('https://svgwg.org/svg2-draft/painting.html'),
    getElements('https://svgwg.org/svg2-draft/paths.html'),
    getElements('https://svgwg.org/svg2-draft/shapes.html'),
    getElements('https://svgwg.org/svg2-draft/struct.html'),
    getElements('https://svgwg.org/svg2-draft/styling.html'),
    getElements('https://svgwg.org/svg2-draft/text.html'),
    getAttributes('https://www.w3.org/TR/SVGTiny12/attributeTable.html'),
  ]);

  return {
    svgElements: [
      ...animationElements,
      ...cssMasingElements,
      ...embededElements,
      ...filterElements,
      ...interactElements,
      ...linkingElements,
      ...paintServerElements,
      ...paintingElements,
      ...pathElements,
      ...shapeElements,
      ...structElements,
      ...stylingElements,
      ...textElements,
    ],
    svgAttributes,
  }
}
