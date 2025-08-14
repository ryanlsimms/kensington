import parseTable from '../utils/parse-table.js';
import fetchAsDom from '../utils/fetch-as-dom.js';

export default async function fetchHtmlData() {
  const dom = await fetchAsDom('https://html.spec.whatwg.org/multipage/indices.html');
  const elements = parseTable(dom.querySelector('table:has(caption)'), 'tag', [['children', 5], ['attributes', 6]]);
  const attributes = parseTable(dom.querySelector('#attributes-1'), 'attribute', [['elements', 2], ['value', 4]]);
  const events = parseTable(dom.querySelector('#ix-event-handlers'), 'event', [['elements', 2]]);
  const globalEvents = events.filter(e => e.elements[0] === 'HTML elements').map(e => e.event);

  const methodAttrs = attributes.filter(a => ['formmethod', 'method'].includes(a.attribute));
  methodAttrs.forEach(attr => {
    attr.value = attr.value.map(v => v.toLowerCase());
  })

  return { htmlElements: elements, globalEvents, attributes };
}
