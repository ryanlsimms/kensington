import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import ts from 'typescript';

const DOM_STRINGS = new Set(['ByteString', 'DOMString', 'USVString']);
const IDL_NUMBERS = /^(?:unsigned )?(?:byte|octet|short|long|long long)$|^(?:unrestricted )?(?:float|double)$/;
const PRIMITIVES = new Set(['any', 'bigint', 'boolean', 'object', 'undefined']);
const GENERICS = new Map([
  ['sequence', 'Array'],
  ['FrozenArray', 'ReadonlyArray'],
  ['Promise', 'Promise'],
  ['record', 'Record'],
]);

function readDomDeclarations() {
  const file = join(dirname(ts.getDefaultLibFilePath({})), 'lib.dom.d.ts');
  return ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest).statements;
}

export default function buildHtmlElementFallbacks(elements, idl) {
  const declarations = readDomDeclarations();
  const domTypes = new Set(declarations.filter(node => ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node)).map(node => node.name.text));
  const tagNames = new Set(declarations.find(node =>
    ts.isInterfaceDeclaration(node) && node.name.text === 'HTMLElementTagNameMap',
  ).members.map(member => member.name.text));
  const idlTypes = new Map(idl.filter(definition => !definition.partial)
    .map(definition => [definition.name, definition]));

  function renderType({ idlType, nullable, union, generic }) {
    let type;
    if (Array.isArray(idlType)) {
      const types = idlType.map(renderType);
      if (types.some(member => member === undefined)) { return undefined; }
      if (union) {
        type = types.join(' | ');
      } else if (GENERICS.has(generic)) {
        type = `${GENERICS.get(generic)}<${types.join(', ')}>`;
      }
    } else if (DOM_STRINGS.has(idlType)) {
      type = 'string';
    } else if (IDL_NUMBERS.test(idlType)) {
      type = 'number';
    } else if (PRIMITIVES.has(idlType)) {
      type = idlType;
    } else {
      const definition = idlTypes.get(idlType);
      if (definition?.type === 'enum') {
        type = definition.values.map(({ value }) => JSON.stringify(value)).join(' | ');
      } else if (definition?.type === 'typedef') {
        type = renderType(definition.idlType);
      } else if (domTypes.has(idlType)) {
        type = `DomInstance<${JSON.stringify(idlType)}>`;
      }
    }
    return type && nullable ? `${type} | null` : type;
  }

  function renderMember(member) {
    if (!member.name || member.special || !['attribute', 'operation'].includes(member.type)) {
      return undefined;
    }
    const type = renderType(member.idlType);
    if (!type) { return undefined; }
    if (member.type === 'attribute') {
      return `${member.readonly ? 'readonly ' : ''}${member.name}: ${type};`;
    }
    const parameters = member.arguments.map((argument, index) => {
      const parameterType = renderType(argument.idlType);
      if (!parameterType) { return undefined; }
      const name = `arg${index}`;
      if (argument.variadic) { return `...${name}: Array<${parameterType}>`; }
      return `${name}${argument.optional ? '?' : ''}: ${parameterType}`;
    });
    if (parameters.some(parameter => parameter === undefined)) { return undefined; }
    return `${member.name}(${parameters.join(', ')}): ${type === 'undefined' ? 'void' : type};`;
  }

  const entries = [];
  for (const { tag, interfaces = [] } of elements) {
    if (tagNames.has(tag) || interfaces.length !== 1) { continue; }
    const [name] = interfaces;
    const definition = idlTypes.get(name);
    if (definition?.type !== 'interface' || !domTypes.has(definition.inheritance)) { continue; }
    const members = idl.filter(candidate => candidate.name === name && candidate.type === 'interface')
      .flatMap(candidate => candidate.members)
      .map(renderMember)
      .filter(Boolean);
    const base = definition.inheritance === 'HTMLElement'
      ? 'HTMLElement'
      : `DomInstance<${JSON.stringify(definition.inheritance)}, HTMLElement>`;
    const type = members.length ? `${base} & {\n    ${[...new Set(members)].join('\n    ')}\n  }` : base;
    if (type !== 'HTMLElement') { entries.push(`  '${tag}': ${type};`); }
  }
  if (!entries.length) { return 'type HtmlElementFallbacks = {};'; }
  return `type DomInstance<Name extends string, Fallback = unknown> =
  typeof globalThis extends Record<Name, { prototype: infer Instance }>
    ? Instance extends Fallback ? Instance : Fallback
    : Fallback;

interface HtmlElementFallbacks {
${entries.join('\n')}
}`;
}
