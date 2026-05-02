export default function buildAttributesDeclarations({ elements }) {
  return `type AttributeValidator =
  | StringConstructor | NumberConstructor | BooleanConstructor
  | string | number | boolean | Function
  | (StringConstructor | NumberConstructor | BooleanConstructor | string | number | boolean | Function)[];

export const globalAttributes: Record<string, AttributeValidator>;
export const globalEvents: Record<string, AttributeValidator>;
${elements.map(e => `export const ${e.attributesName}: Record<string, AttributeValidator>;`).join('\n')}
`;
}
