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
import SvgVoidTag from './esm/tag-classes/svg-void-tag.js';

type NameSpaceAttributes = Record<\`\${"data" | "aria"}\${string}\`, string | object>;

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

export type Content = ContentTag | VoidTag | SvgVoidTag | LiteralTag | string | (ContentTag | VoidTag | SvgVoidTag | LiteralTag | string)[];
export type AttributesOrContent = Record<string, string | number> | Content;
export type TagArguments<T> = [attributesOrContent?:T | Content, content?: Content];
export type ContentMethod<T> = (...args: TagArguments<T>) => ContentTag;

export default class Kensington {
  constructor(options?: { runValidation?: boolean });
  createCustomTag(
    tagName: string,
    allowedAttributes?: Record<string, StringConstructor | NumberConstructor | string[] | number[]>
  ): (attributesOrContent?: AttributesOrContent, content?: Content) => ContentTag | VoidTag | SvgVoidTag

  literal(str: string): LiteralTag

  unsafeLiteral(str: string): LiteralTag
  
  htmlWithDocType(attributesOrContent?: HtmlAttributes | Content, content?: Content): ContentTag;

  ${elements.map(el =>
    `${el.methodName}(attributesOrContent?: ${el.attributesTypeName} | Content, content?: Content): ${el.returnTagType}Tag;`
  ).join('\n  ')}
}

export const t: InstanceType<typeof Kensington>;
`;
}
