export default function buildAttributesDeclarations({ elements }) {
  return `type AttributeValidator =
  | StringConstructor | NumberConstructor | BooleanConstructor
  | string | number | boolean | Function
  | (StringConstructor | NumberConstructor | BooleanConstructor | string | number | boolean | Function)[];

export const globalAttributes: Record<string, AttributeValidator>;
export const globalEvents: Record<string, AttributeValidator>;
export const svgGlobalAttributes: Record<string, AttributeValidator>;
export const svgGlobalEvents: Record<string, AttributeValidator>;
export const svgConditionalAttributes: Record<string, AttributeValidator>;
export const svgPresentationAttributes: Record<string, AttributeValidator>;
export const svgXLinkAttributes: Record<string, AttributeValidator>;
${elements.map(e => `export const ${e.attributesName}: Record<string, AttributeValidator>;`).join('\n')}
`;
}
