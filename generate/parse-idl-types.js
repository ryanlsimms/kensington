const IDL_BOOLEAN = 'boolean';
const IDL_INTEGER = new Set(['unsigned long', 'long', 'unsigned short', 'short']);
const IDL_FLOAT = new Set(['double', 'float', 'unrestricted double', 'unrestricted float']);

export default function parseIdlTypes(idlDefs) {
  const result = new Map();

  for (const def of idlDefs) {
    if (def.type !== 'interface' && def.type !== 'interface mixin') {
      continue;
    }
    if (!def.members) {
      continue;
    }
    for (const member of def.members) {
      if (member.type !== 'attribute') {
        continue;
      }
      const idlType = member.idlType?.idlType;
      const attrName = member.name.toLowerCase();
      if (result.has(attrName)) {
        continue;
      }
      if (idlType === IDL_BOOLEAN) {
        result.set(attrName, { value: 'Boolean', type: 'boolean' });
      } else if (IDL_INTEGER.has(idlType)) {
        // eslint-disable-next-line no-template-curly-in-string
        result.set(attrName, { value: 'Number', type: 'number | `${number}`' });
      } else if (IDL_FLOAT.has(idlType)) {
        result.set(attrName, { value: '[Number,String]', type: 'number | string' });
      }
    }
  }

  return result;
}
