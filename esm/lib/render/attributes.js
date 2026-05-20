import Signal from '../reactive/signal.js';
import he from '../util/he.js';
import { styleObjectToCss } from '../util/style-utils.js';
import { getAttrName } from '../util/text-utils.js';

export function attributesArrayFromObject(obj, options = {}) {
  const { attrsSet = new Map(), encode, prefix = '', seen = new WeakSet() } = options; // seen default is a fresh WeakSet per top-level call. Recursive calls pass the existing one to share cycle state
  const result = [];

  for (const attr of Object.keys(obj)) {
    if (!attr.trim()) {
      continue;
    }
    if (attr === 'on' || attr === 'prop' || attr === 'persist') {
      continue;
    }
    let val;
    try {
      val = obj[attr]; // property access can throw if the object has a getter that throws
    } catch {
      continue;
    }
    if ([false, null, undefined].includes(val) || (typeof val === 'number' && !isFinite(val))) { // NaN/Infinity treated as absent, same as false/null
      continue;
    }
    const attrName = getAttrName(attr, prefix, attrsSet);

    if (val === true) {
      result.push([attrName, '']); // empty string signals the string builder to emit a bare attribute name (e.g. disabled, checked)
      continue;
    }
    if (attr === 'style' && val !== null && typeof val === 'object' && !Array.isArray(val)) { // !Array.isArray: typeof [] === 'object'
      const css = styleObjectToCss(val);
      if (css) {
        result.push([attrName, css]);
      }
      continue;
    }
    if (val instanceof Signal) {
      result.push([attrName, val]);
      continue;
    }
    if (attr === 'class' && Array.isArray(val)) {
      const classes = val
        .filter(v => (typeof v === 'string' && v !== '') || (typeof v === 'number' && isFinite(v)))
        .join(' ');
      if (classes) {
        result.push([attrName, classes]);
      }
      continue;
    }
    if (Array.isArray(val)) {
      continue; // non-class arrays have no meaningful attribute serialization
    }
    if (attr === 'class' && val !== null && typeof val === 'object') {
      continue; // plain objects are not valid class values. No toString fallback
    }
    if (val !== null && typeof val === 'object') {
      if (seen.has(val)) {
        continue;
      }
      seen.add(val);
      result.push(...attributesArrayFromObject(val, { attrsSet, encode, prefix: attrName, seen }));
      seen.delete(val); // delete after recursing so the same object can appear under sibling keys
      continue;
    }
    if (typeof val === 'function') {
      if (/^on[a-z]/.test(attrName)) { // only standard lowercase event handlers. String serialization can't represent functions
        result.push([attrName, val]);
      }
      continue;
    }
    if (encode) {
      result.push([attrName, he.encode(val.toString())]); // val is a string/number primitive at this point. All other types handled above
    } else {
      result.push([attrName, val.toString()]);
    }
  }
  return result;
}

export function attributesStringFromObject(obj, options = {}) {
  const { onFunction, encode } = options;
  let result = '';
  for (const [name, rawVal] of attributesArrayFromObject(obj, options)) {
    let val = rawVal;
    if (val instanceof Signal) {
      val = val.get();
      if (val === false || val === null || val === undefined) {
        continue;
      }
      if (result) {
        result += ' ';
      }
      if (val === true) {
        result += name;
      } else {
        result += `${name}="${encode ? he.encode(String(val)) : String(val)}"`;
      }
      continue;
    }
    if (typeof val === 'function') {
      if (onFunction) {
        onFunction(name);
      }
      continue;
    }
    if (result) {
      result += ' ';
    }
    result += val === '' ? name : `${name}="${val}"`; // '' encodes a boolean attribute (true → '' in array builder)
  }
  return result;
}
