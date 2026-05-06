function attributesObject(attributes) {
  return `{
  ${attributes.map(a => `'${a.name}': ${a.value},`).join('\n  ')}
}`;
}

export default function buildAttributes({ elements, globalAttributes, globalEvents }) {
  return `export const globalAttributes = {
  ${globalAttributes.map(a => `'${a.name}': ${a.value},`).join('\n  ')}
};
  
export const globalEvents = {
  ${globalEvents.map(a => `'${a}': [String, Function],`).join('\n  ')}
};

${elements.map(el =>
  `export const ${el.attributesName} = ${el.attributes.length ? attributesObject(el.attributes) : '{}'};`,
).join('\n')}
`;
}
