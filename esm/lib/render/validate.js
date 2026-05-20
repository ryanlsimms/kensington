import Signal from '../reactive/signal.js';
import showInvalid from '../util/show-invalid.js';
import { styleObjectToCss } from '../util/style-utils.js';
import { camelToKebab } from '../util/text-utils.js';

export function isValidStyleValue(v) {
  return [null, undefined, false].includes(v) || ['string', 'number'].includes(typeof v); // null/undefined/false are valid. They're silently omitted at render time, not errors
}

export function isValidNamespaceAttribute(tag, attr) {
  const match = attr.match(/[^A-Z|-]+/u); // characters before first uppercase or hyphen
  return match !== null && tag.namespaces.includes(match[0]); // null when attr starts with a hyphen or is all-uppercase
}

export function attributeIsValid(tag, attr) {
  if (attr === 'on' || attr === 'prop' || attr === 'persist') { return true; }
  return tag.allowedAttributeMap.has(attr) ||
    tag.allowedAttributeMap.has(camelToKebab(attr)) ||
    isValidNamespaceAttribute(tag, attr) ||
    camelToKebab(attr) in tag.additionalGlobalAttributes;
}

export function validateAttributeByType(type, value) {
  if (['number', 'string'].includes(typeof type)) {
    return value === type; // literal enum spec: type 'submit', 'ltr', etc.
  }
  if (type === Function) {
    return typeof value === 'function';
  }
  if (type === Boolean) {
    return [true, false, undefined, null].includes(value);
  }
  if (type === String) {
    return ['number', 'string'].includes(typeof value);
  }
  if (type === Number) {
    if (typeof value === 'number') { return isFinite(value); }
    if (typeof value !== 'string') { return false; } // Number(Symbol) throws. Only attempt coercion on strings
    const n = Number(value);
    return isFinite(n) && n.toString() === value; // round-trip rejects non-canonical ('042', ' 1') and NaN/Infinity strings
  }
  if (typeof type === 'function') {
    return type(value); // custom validator. Type spec can be an arbitrary predicate function
  }
  if (Array.isArray(type)) {
    return type.some(typeItem => validateAttributeByType(typeItem, value));
  }
  return false; // type is undefined (attr not in the spec map). Treat as invalid
}

export function attributeValueIsValid(tag, attr, value) {
  if (attr === 'persist') {
    return value === true || value === false || value === undefined || value === null;
  }
  if (attr === 'on' || attr === 'prop') {
    if (value === null || value === undefined) { return true; }
    return typeof value === 'object' && !Array.isArray(value) && !(value instanceof Signal);
  }
  if (value instanceof Signal) { return true; }
  if ([undefined, null].includes(value)) {
    return true;
  }
  if (typeof value === 'symbol') {
    return false;
  }
  if (typeof value === 'number' && !isFinite(value)) { // NaN/Infinity are not valid attribute values
    return false;
  }
  if (isValidNamespaceAttribute(tag, attr)) {
    return true; // namespace attrs (data-*, aria-*) have no type spec in the map. Any value is accepted
  }
  if (attr === 'id' && typeof value === 'string' && /^\d/.test(value)) {
    return false;
  }
  if (attr === 'class' && Array.isArray(value)) {
    return true; // must return early. The type spec for class is String, so validateAttributeByType would reject arrays
  }
  if (attr === 'style' && value !== null && typeof value === 'object' && !Array.isArray(value)) { // !Array.isArray. typeof [] === 'object'
    for (const k of Object.keys(value)) {
      let v;
      try {
        v = value[k];
      } catch {
        continue;
      }
      if (!isValidStyleValue(v)) {
        return false;
      }
    }
    return true;
  }
  const kebab = camelToKebab(attr);
  const type = tag.allowedAttributeMap.get(attr)
    ?? tag.allowedAttributeMap.get(kebab)
    ?? tag.additionalGlobalAttributes[kebab];
  return validateAttributeByType(type, value);
}

export function validate(tag) {
  const unallowedAttributes = Object.keys(tag.attributes).filter(attr => !attributeIsValid(tag, attr));
  if (unallowedAttributes.length) {
    showInvalid(`attribute(s): ${unallowedAttributes.join(', ')} not allowed for ${tag.tagName}`, tag.validationLevel, tag.logger);
  }

  const invalidAttributeValues = Object.entries(tag.attributes).filter(([attr, value]) => {
    return !unallowedAttributes.includes(attr) && !attributeValueIsValid(tag, attr, value); // skip value check for already-flagged attrs to avoid double-reporting
  });
  if (invalidAttributeValues.length) {
    const attrString = invalidAttributeValues.map(([attr, value]) => {
      if (attr === 'style' && value !== null && typeof value === 'object' && !Array.isArray(value)) { // !Array.isArray. typeof [] === 'object'
        return `style="${styleObjectToCss(value, (_, v) => !isValidStyleValue(v))}"`;
      }
      if (Array.isArray(value)) {
        // JSON.stringify(Symbol) returns undefined, which JSON array serialization renders as null. String() gives 'Symbol(x)'
        const parts = value.map(v => (typeof v === 'symbol' ? String(v) : JSON.stringify(v)));
        return `${attr}=[${parts.join(',')}]`;
      }
      try {
        return `${attr}="${String(value)}"`;
      } catch {
        // null-proto objects and others with no toString throw when coerced to string
        return `${attr}=[non-serializable]`;
      }
    }).join(', ');
    const message = `invalid attribute \`${attrString}\` given for element \`${tag.tagName}\``;
    showInvalid(message, tag.validationLevel, tag.logger);
  }
}
