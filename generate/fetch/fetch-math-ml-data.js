import fetchAsDom from '../utils/fetch-as-dom.js';

export default async function fetchMathMlData() {
  const tagDom = await fetchAsDom('https://developer.mozilla.org/en-US/docs/Web/MathML/Element');
  const tagContainers = tagDom.querySelectorAll('article li:not(:has(.icon-deprecated))');
  const tags = [...new Set([...tagContainers].map(el => el.querySelector('code')?.textContent?.replaceAll(/[<>]/g, '')).filter(Boolean).sort())];
  const elementObj = Object.fromEntries(tags.map(tag => [tag, []]));

  const globalDom = await fetchAsDom('https://developer.mozilla.org/en-US/docs/Web/MathML/Global_attributes');
  const globalContainers = globalDom.querySelectorAll('dt > a > code');
  const globalAttributes = [...globalContainers].map(el => el.textContent).filter(tag => !tag.startsWith('data-'));

  const attrDom = await fetchAsDom('https://developer.mozilla.org/en-US/docs/Web/MathML/Attribute');
  const rows = attrDom.querySelectorAll('article tbody tr:not(:has(.icon-deprecated))');

  const attributes = [...rows].map(row => {
    const attribute = row.querySelector('td:nth-child(1) code').textContent;
    const elements = [...row.querySelectorAll('td:nth-child(2) code')].map(el => el.textContent.replaceAll(/[<>]/g, ''));
    return {
      attribute,
      elements,
      value: [],
    }
  });

  attributes.forEach(({ attribute, elements }) => {
    elements.forEach(element => {
      if (elementObj[element].indexOf(attribute) === -1) {
        elementObj[element].push(attribute);
      }
    });
  });


  const elements = Object.entries(elementObj).map(([tag, attributes]) => ({
    attributes: [...new Set([...attributes, ...globalAttributes, 'href'])].sort(),
    children: [],
    tag,
  }));

  return elements;
}
