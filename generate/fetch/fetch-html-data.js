import parseTable from '../utils/parse-table.js';
import fetchAsDom from '../utils/fetch-as-dom.js';

export default async function fetchHtmlData() {
  const dom = await fetchAsDom('https://html.spec.whatwg.org/multipage/indices.html');
  const elements = parseTable(dom.querySelector('table:has(caption)'), 'tag', [['children', 5], ['attributes', 6]]);
  const attributes = parseTable(dom.querySelector('#attributes-1'), 'attribute', [['elements', 2], ['value', 4]]);
  const events = parseTable(dom.querySelector('#ix-event-handlers'), 'event', [['elements', 2]]);
  const globalEvents = events.filter(e => e.elements[0] === 'HTML elements').map(e => e.event);

  const attributeSemanticsPage = await fetchAsDom('https://html.spec.whatwg.org/multipage/semantics-other.html');
  const caseInsensitiveAttrElements = attributeSemanticsPage.querySelectorAll('ul.brief code');
  const caseInsensitiveAttrList = [...caseInsensitiveAttrElements].map(el => el.textContent).concat('formmethod');

  const inputPage = await fetchAsDom('https://html.spec.whatwg.org/multipage/input.html');
  const inputTypeKeywords = parseTable(inputPage.querySelector('#attr-input-type-keywords'), 'keyword', [])
    .map(d => `"${d.keyword}"`);

  attributes.forEach(attr => {
    if (caseInsensitiveAttrList.includes(attr.attribute)) {
      attr.value = [...new Set(attr.value.flatMap(v => [v.toLowerCase(), v.toUpperCase()]))];
    }
    if (attr.attribute === 'type' && attr.elements.includes('input')) {
      attr.value = inputTypeKeywords;
    }
  });

  return { htmlElements: elements, globalEvents, attributes };
}
