import fetchAsDom from '../utils/fetch-as-dom.js';

async function getElements(url) {
  const dom = await fetchAsDom(url);

  const elementSummaries = dom.querySelectorAll('.element-summary');

  const elements = [];
  for (const summary of elementSummaries) {
    const tag = summary.querySelector('.element-name').textContent.replaceAll(/[‘’]/g, '');
    const attributeSpans = summary.querySelectorAll('.attr-name, .property');
    const attributes = [...new Set([...attributeSpans]
      .map(span => span.textContent.replaceAll(/[‘’]/g, ''))
      .filter(attr => !attr.startsWith('aria'))
      .sort())];
    elements.push({ attributes, children: [], tag });
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
      .map(span => span.textContent.replaceAll(/[‘’]/g, ''))
      .filter(attr => !attr.startsWith('aria'))
      .sort())];
    elements.push({ attributes, children: [], tag });
  }

  return elements;
}

async function getAttributes(url) {
  const dom = await fetchAsDom(url);

  const rows = dom.querySelectorAll('#attributes tbody tr');

  return [...rows].map(row => {
    return {
      attribute: row.querySelector('.attribute-name').textContent,
      elements:  row.querySelector('.attribute-parents').textContent.split(',').map(v => v.trim()),
      type: 'svg',
      value:  row.querySelector('.attribute-value').textContent.split('|').map(v => v.replaceAll(`'`, '"').trim()),
    };
  });
}

async function getPresentationAttributes(url) {
  const dom = await fetchAsDom(url);
  const names = new Set();

  for (const a of dom.querySelectorAll('table.vert a.property')) {
    // Properties linking to geometry.html or paths.html only apply to designated
    // elements, not all SVG elements, so they are excluded.
    if (a.href.includes('geometry.html') || a.href.includes('paths.html')) { continue; }
    const name = a.textContent.trim().toLowerCase();
    if (name) { names.add(name); }
  }

  return [...names].sort();
}

export default async function fetchSvgData() {
  const [
    animationElements,
    cssMaskingElements,
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
    svgPresentationAttributes,
  ] = await Promise.all([
    getElements('https://svgwg.org/specs/animations'),
    getDraftElements('https://drafts.csswg.org/css-masking-1/'),
    getElements('https://svgwg.org/svg2-draft/embedded.html'),
    getDraftElements('https://drafts.csswg.org/filter-effects/'),
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
    getPresentationAttributes('https://svgwg.org/svg2-draft/styling.html'),
  ]);

  const svgElements = [
    ...animationElements,
    ...cssMaskingElements,
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
  ];

  // xmlns is an XML Namespaces declaration, not defined in the SVG spec, so it never
  // appears in the scraped data. Add it manually to the root svg element.
  const svgEl = svgElements.find(el => el.tag === 'svg');
  if (svgEl && !svgEl.attributes.includes('xmlns')) {
    svgEl.attributes = [...svgEl.attributes, 'xmlns'].sort();
  }

  return {
    svgAttributes,
    svgElements,
    svgPresentationAttributes,
  };
}
