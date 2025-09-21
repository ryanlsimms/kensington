import { kebabToCamel } from './utils/text-utils.js';

function attributesType({ attributes = [], globalTypes }) {
  if (!attributes.length) {
    return globalTypes.join(' & ')
  }
  return [`{
  ${attributes.flatMap(a => {
    const lines = [`'${a.name}'?: ${a.type};`];
    const camelName = kebabToCamel(a.name);
    if (a.name !== camelName) {
      lines.push(`'${camelName}'?: ${a.type};`);
    }
    return lines;
  }).join('\n  ')}
}`, ...globalTypes].join(' & ');
}

export default function buildDeclarations({ elements, globalAttributes, globalEvents }) {
  return `import ContentTag from './esm/tag-classes/content-tag.js';
import LiteralTag from './esm/tag-classes/literal-tag.js';
import VoidTag from './esm/tag-classes/void-tag.js';

export interface NameSpaceAttributes {
  [key: \`\${"data" | "aria"}\${string}\`]: string | object
}

type GlobalAttributes = {
  ${globalAttributes.map(a => `${a.name}?: ${a.type};`).join('\n  ')}
}

type GlobalEvents = {
  ${globalEvents.map(e => `${e}?: string;`).join('\n  ')}
}

${elements.map(e => `type ${e.attributesTypeName} = ${attributesType(e)};`).join('\n\n')}

export const globalAttributes: GlobalAttributes;
export const globalEvents: GlobalEvents;
${elements.map(e => `export const ${e.attributesName}: ${e.attributesTypeName}`).join('\n')}

type ContentType = ContentTag | VoidTag | LiteralTag | string | number;
export type Content = ContentType | ContentType[];
type UniversalAttributes = NameSpaceAttributes | GlobalAttributes | GlobalEvents;
type CustomTagArguments<T = null> = [attributes?: T | UniversalAttributes, content?: Content] | [content: Content];
export type ContentMethod<T = null> = (...args: CustomTagArguments<T>) => ContentTag;
type PrimitiveConstructor = StringConstructor | NumberConstructor | BooleanConstructor;
type Primitive = string | number | boolean;
type AttributeValue = PrimitiveConstructor | Primitive | (PrimitiveConstructor | Primitive)[];

export default class Kensington {
  constructor(options?: { additionalNamespaces?: string | string[], validationLevel?: 'off' | 'warn' | 'error' });

  createCustomTag(
    tagName: string,
    allowedAttributes?: Record<string,  AttributeValue>
  ): (...args: CustomTagArguments) => ContentTag

  literal(str: string): LiteralTag

  unsafeLiteral(str: string): LiteralTag
  
  htmlWithDocType(attributes: HtmlAttributes, content?: Content): ContentTag;
  htmlWithDocType(content?: Content): ContentTag;

  ${elements.flatMap(el => {
    if (el.returnTagType === 'Void') {
      return [`${el.methodName}(attributes?: ${el.attributesTypeName}): VoidTag;`]
    }
    return [
      `${el.methodName}(attributes: ${el.attributesTypeName}, content?: Content): ${el.returnTagType}Tag;`,
      `${el.methodName}(content?: Content): ${el.returnTagType}Tag;`
    ]
  }).join('\n  ')}
}

export const t: InstanceType<typeof Kensington>;
`;
}
