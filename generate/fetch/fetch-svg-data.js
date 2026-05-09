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

  // bikeshed standard: <dfn data-dfn-type="property">property-name</dfn>
  for (const dfn of dom.querySelectorAll('dfn[data-dfn-type="property"]')) {
    const name = dfn.textContent.trim().toLowerCase();
    if (name && /^[a-z][a-z0-9-]*$/.test(name)) {
      names.add(name);
    }
  }

  // older bikeshed format: <table id="propdef-stroke-width">
  for (const table of dom.querySelectorAll('table[id^="propdef-"]')) {
    const name = table.id.slice('propdef-'.length);
    if (name && /^[a-z][a-z0-9-]*$/.test(name)) {
      names.add(name);
    }
  }

  return [...names];
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
    paintingAttributes,
    pserverAttributes,
    textAttributes,
    maskingAttributes,
    filterAttributes,
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
    getPresentationAttributes('https://svgwg.org/svg2-draft/painting.html'),
    getPresentationAttributes('https://svgwg.org/svg2-draft/pservers.html'),
    getPresentationAttributes('https://svgwg.org/svg2-draft/text.html'),
    getPresentationAttributes('https://drafts.csswg.org/css-masking-1/'),
    getPresentationAttributes('https://drafts.csswg.org/filter-effects/'),
  ]);

  const svgPresentationAttributes = [
    ...new Set([
      ...paintingAttributes,
      ...pserverAttributes,
      ...textAttributes,
      ...maskingAttributes,
      ...filterAttributes,
    ]),
  ].sort();

  return {
    svgAttributes,
    svgElements: [
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
    ],
    svgPresentationAttributes,
  };
}
