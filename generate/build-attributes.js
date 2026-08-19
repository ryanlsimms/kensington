function attributesObject(attributes) {
  return `{
  ${attributes.map(a => `'${a.name}': ${a.value},`).join('\n  ')}
}`;
}

function svgElementObject(el, hasSvgPresentation) {
  const spreads = ['svgGlobalAttributes', 'globalEvents', 'svgGlobalEvents'];
  if (hasSvgPresentation) { spreads.push('svgPresentationAttributes'); }
  if (el.includeSvgConditionalAttributes) { spreads.push('svgConditionalAttributes'); }
  if (el.includeSvgXLinkAttributes) { spreads.push('svgXLinkAttributes'); }
  const clonedSpreads = `...cloneAttributeValidators(
    ${spreads.join(',\n    ')},
  ),`;
  return `{
  ${[clonedSpreads, ...el.attributes.map(a => `'${a.name}': ${a.value},`)].join('\n  ')}
}`;
}

export default function buildAttributes({
  elements,
  globalAttributes,
  globalEvents,
  svgConditionalAttributes,
  svgGlobalAttributes,
  svgGlobalEvents,
  svgPresentationAttrTypes,
  svgXLinkAttributes,
}) {
  const hasSvgPresentation = svgPresentationAttrTypes?.length > 0;

  return `function cloneAttributeValidators(...attributeMaps) {
  const cloned = {};
  for (const attributeMap of attributeMaps) {
    for (const [name, validator] of Object.entries(attributeMap)) {
      cloned[name] = Array.isArray(validator) ? [...validator] : validator;
    }
  }
  return cloned;
}

export const __slim__ = false;
export const camelCaseNames = [];

export const globalAttributes = {
  ${globalAttributes.map(a => `'${a.name}': ${a.value},`).join('\n  ')}
};

export const globalEvents = {
  ${globalEvents.map(a => `'${a}': [String, Function],`).join('\n  ')}
};
export const svgGlobalAttributes = ${attributesObject(svgGlobalAttributes)};
export const svgGlobalEvents = ${attributesObject(svgGlobalEvents)};
export const svgConditionalAttributes = ${attributesObject(svgConditionalAttributes)};
export const svgXLinkAttributes = ${attributesObject(svgXLinkAttributes)};
${hasSvgPresentation ? `
export const svgPresentationAttributes = ${attributesObject(svgPresentationAttrTypes)};
` : ''}
${elements.map(el => {
  if (el.tagType === 'SvgContent' || el.svgContextual) {
    return `export const ${el.attributesName} = ${svgElementObject(el, hasSvgPresentation)};`;
  }
  return `export const ${el.attributesName} = ${el.attributes.length ? attributesObject(el.attributes) : '{}'};`;
}).join('\n')}
`;
}
