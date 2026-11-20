import fetchAsDom from '../utils/fetch-as-dom.js';

const WAI_ARIA_URL = 'https://www.w3.org/TR/2023/REC-wai-aria-1.2-20230606/';

export function parseAriaData(doc) {
  const definitions = doc.querySelectorAll('#state_prop_def > section[id^="aria-"]');
  if (!definitions.length) { throw new Error('WAI-ARIA attribute definitions were not found'); }

  return Array.from(definitions, definition => {
    const attribute = definition.id;
    const table = definition.querySelector('table.value-descriptions');
    const value = table
      ? Array.from(table.querySelectorAll('tbody tr > th:first-child'), cell =>
        cell.textContent.trim().replace(/\s*\(default\):?$/, ''))
      : [];
    if (table && !value.length) { throw new Error(`No values found for ${attribute}`); }
    return { attribute, value };
  });
}

export default async function fetchAriaData() {
  return parseAriaData(await fetchAsDom(WAI_ARIA_URL));
}
