function attributesObject(attributes) {
  return `{
  ${attributes.map(a => `'${a.name}': ${a.value},`).join('\n  ')}
}`;
}

function svgElementObject(ownAttributes) {
  if (!ownAttributes.length) {
    return '{ ...svgPresentationAttributes }';
  }
  return `{
  ...svgPresentationAttributes,
  ${ownAttributes.map(a => `'${a.name}': ${a.value},`).join('\n  ')}
}`;
}

export default function buildAttributes({ elements, globalAttributes, globalEvents, svgPresentationAttrTypes }) {
  const hasSvgPresentation = svgPresentationAttrTypes?.length > 0;

  return `export const globalAttributes = {
  ${globalAttributes.map(a => `'${a.name}': ${a.value},`).join('\n  ')}
};

export const globalEvents = {
  ${globalEvents.map(a => `'${a}': [String, Function],`).join('\n  ')}
};
${hasSvgPresentation ? `
export const svgPresentationAttributes = ${attributesObject(svgPresentationAttrTypes)};
` : ''}
${elements.map(el => {
  if (hasSvgPresentation && el.tagType === 'SvgContent') {
    return `export const ${el.attributesName} = ${svgElementObject(el.attributes)};`;
  }
  return `export const ${el.attributesName} = ${el.attributes.length ? attributesObject(el.attributes) : '{}'};`;
}).join('\n')}
`;
}
