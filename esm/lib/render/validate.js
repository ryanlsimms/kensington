import { __slim__, isNameOnlyAttribute } from '../../attributes.js';
import { isKensingtonSignal } from '../reactive/signal.js';
import showInvalid from '../util/show-invalid.js';
import { styleObjectToCss } from '../util/style-utils.js';
import { camelToKebab, getAttrName } from '../util/text-utils.js';
import { normalizeBooleanAttribute } from './boolean-attributes.js';
import { propChangeEvent } from './prop-events.js';

export function isValidStyleValue(v) {
  return [null, undefined, false].includes(v) || ['string', 'number'].includes(typeof v); // null/undefined/false are valid. They're silently omitted at render time, not errors
}

export function isValidNamespaceAttribute(tag, attr) {
  const match = attr.match(/[^A-Z|-]+/u); // characters before first uppercase or hyphen
  return match !== null && tag.namespaces.includes(match[0]);
}

export function attributeIsValid(tag, attr) {
  if (tag.skipElementAttributeValidation ||
      attr === 'aria' || attr === 'on' || attr === 'prop' || attr === 'persist' || attr === 'dispatchOnPropChange') {
    return true;
  }
  const name = getAttrName(attr, '', tag.allowedAttributeMap);
  return tag.allowedAttributeMap.has(name) ||
    isNameOnlyAttribute(name) ||
    isValidNamespaceAttribute(tag, attr) ||
    Object.hasOwn(tag.additionalGlobalAttributes, name);
}

export function validateAttributeNames(tag, names) {
  const unallowedAttributes = names.filter(attr => !attributeIsValid(tag, attr));
  if (unallowedAttributes.length) {
    showInvalid(`attribute(s): ${unallowedAttributes.join(', ')} not allowed for ${tag.tagName}`, tag.validationLevel, tag.logger);
  }
  return unallowedAttributes;
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
  if (attr === 'persist' || attr === 'dispatchOnPropChange') {
    return value === true || value === false || value === undefined || value === null;
  }
  if (attr === 'on' || attr === 'prop') {
    if (value === null || value === undefined) { return true; }
    return typeof value === 'object' && !Array.isArray(value) && !isKensingtonSignal(value);
  }
  if (isKensingtonSignal(value)) { return true; }
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
    return true; // Open namespaces have no value validation.
  }
  if (tag.skipElementAttributeValidation) {
    return true; // no allow-list was passed to createCustomTag. Any attribute value is accepted
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
      if (!isKensingtonSignal(v) && !isValidStyleValue(v)) {
        return false;
      }
    }
    return true;
  }
  const kebab = camelToKebab(attr);
  if (!__slim__ && attr === 'aria') { return true; } // Object shorthand names are checked after expansion.
  const type = tag.allowedAttributeMap.get(attr)
    ?? tag.allowedAttributeMap.get(kebab)
    ?? tag.additionalGlobalAttributes[kebab];
  if (!__slim__ && type === undefined && isNameOnlyAttribute(kebab)) { return true; }
  const normalized = normalizeBooleanAttribute(kebab, value);
  return validateAttributeByType(type, value)
    || (normalized !== value && validateAttributeByType(type, normalized));
}

function reportInvalidAttributeValues(tag, invalidAttributeValues) {
  if (invalidAttributeValues.length) {
    const attrString = invalidAttributeValues.map(([attr, value]) => {
      if (attr === 'style' && value !== null && typeof value === 'object' && !Array.isArray(value)) { // !Array.isArray. typeof [] === 'object'
        return `style="${styleObjectToCss(value, (_, v) => !isKensingtonSignal(v) && !isValidStyleValue(v))}"`;
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

export function expandedAttributeValidator({
  additionalGlobalAttributes, allowedAttributeMap, logger, namespaces,
  skipElementAttributeValidation, tagName, validationLevel,
}) {
  if (__slim__ || validationLevel === 'off' || skipElementAttributeValidation) { return undefined; }
  // Keep the validation context without retaining the tag and its element.
  const context = {
    additionalGlobalAttributes,
    allowedAttributeMap,
    logger,
    namespaces,
    tagName,
    validationLevel,
  };
  const validatePairs = (pairs, rawAttributes) => {
    const names = [];
    for (const [key, value] of pairs) {
      if (typeof key === 'string') { names.push(key); }
      else if (value.isStyle) { names.push(value.prefix); }
    }
    const unallowed = validateAttributeNames(context, names);
    const invalid = rawAttributes.filter(([name, value]) => !unallowed.includes(name)
      && attributeIsValid(context, name) && !attributeValueIsValid(context, name, value));
    reportInvalidAttributeValues(context, invalid);
  };
  return prefix => (prefix === 'aria' || prefix.startsWith('aria-')) ? validatePairs : undefined;
}

export function validate(tag) {
  if (tag.attributes.dispatchOnPropChange === true) {
    const props = tag.prop;
    const rawType = props?.type ?? tag.attributes.type;
    const type = isKensingtonSignal(rawType) ? rawType.value : rawType;
    if (!props || !Object.keys(props).some(key => propChangeEvent(tag.tagName, type, key))) {
      showInvalid(`dispatchOnPropChange has no supported property bindings on <${tag.tagName}>. No events will be dispatched.`, tag.validationLevel, tag.logger);
    }
  }
  const unallowedAttributes = validateAttributeNames(tag, Object.keys(tag.attributes));

  const invalidAttributeValues = Object.entries(tag.attributes).filter(([attr, value]) => {
    return !unallowedAttributes.includes(attr) && !attributeValueIsValid(tag, attr, value);
  });
  reportInvalidAttributeValues(tag, invalidAttributeValues);
}
