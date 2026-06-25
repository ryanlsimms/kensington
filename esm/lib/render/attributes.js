import { _internalComputed, isKensingtonSignal } from '../reactive/signal.js';
import he from '../util/he.js';
import { styleObjectToCss } from '../util/style-utils.js';
import { getAttrName } from '../util/text-utils.js';

// Marker used as the first element of an attribute pair when the value is a
// signal yielding an object. The pair shape is
//   [SUBTREE_SIGNAL_KEY, { signal, prefix, attrsSet, encode, isStyle }]
// Consumed by attributesStringFromObject (toString) and the toElement attribute
// loop in content-tag.js. See "subtree-signal handling" notes below.
export const SUBTREE_SIGNAL_KEY = Symbol('kensington.subtree-signal');

function resolveStyleSignals(obj) {
  const resolved = {};
  for (const k of Object.keys(obj)) {
    let v;
    try { v = obj[k]; } catch { continue; }
    resolved[k] = isKensingtonSignal(v) ? v.get() : v;
  }
  return resolved;
}

// Builds a derived computed signal whose value is the joined class string at any moment.
// Each member of `parts` may be a static string, a number, or a Signal returning a string,
// string-array, or falsy. Empty / falsy entries are skipped. The returned signal feeds
// the normal signal-attribute pipeline, so toString reads it once and toElement subscribes
// to it like any other reactive class.
function deriveClassList(parts) {
  return _internalComputed(() => {
    const out = [];
    for (const p of parts) {
      const val = isKensingtonSignal(p) ? p.get() : p;
      if (val === null || val === undefined || val === false || val === '') {
        continue;
      }
      if (Array.isArray(val)) {
        for (const inner of val) {
          if (inner !== null && inner !== undefined && inner !== false && inner !== '') {
            out.push(String(inner));
          }
        }
      } else {
        out.push(String(val));
      }
    }
    return out.join(' ');
  });
}

export function attributesArrayFromObject(obj, options = {}) {
  const { encode, prefix = '' } = options;
  const attrsSet = options.attrsSet ?? new Map();
  // `seen` is only needed when an attribute value is a nested plain object (the data:/aria:
  // namespace expansion path). Most attributes are primitives or signals, so defer the
  // WeakSet allocation until we actually encounter a recursable value.
  let seen = options.seen;
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
    if (val === false || val === null || val === undefined
      || (typeof val === 'number' && !isFinite(val))) { // NaN/Infinity treated as absent, same as false/null
      continue;
    }
    const attrName = getAttrName(attr, prefix, attrsSet);

    if (val === true) {
      result.push([attrName, '']); // empty string signals the string builder to emit a bare attribute name (e.g. disabled, checked)
      continue;
    }
    // Subtree-signal detection. A signal whose current value is a plain object
    // (or any signal at the `style` slot) is treated as a "subtree-signal" that
    // expands at toString/toElement time into the attributes its current value
    // would have produced if it had been inlined here. Updates diff against the
    // previous emission's attribute set so missing keys remove their attributes.
    // Per-leaf signals (signal yielding a string/number/boolean) take the
    // existing leaf-attribute path below.
    if (isKensingtonSignal(val)) {
      let current;
      try { current = val.value; } catch { current = null; }
      const isObjectValued = current !== null && typeof current === 'object' && !Array.isArray(current);
      if (isObjectValued || attr === 'style') {
        const isStyle = attr === 'style';
        result.push([SUBTREE_SIGNAL_KEY, { signal: val, prefix: attrName, attrsSet, encode, isStyle }]);
        continue;
      }
    }
    if (attr === 'style' && val !== null && typeof val === 'object' && !Array.isArray(val)) { // !Array.isArray: typeof [] === 'object'
      let hasSignal = false;
      for (const k of Object.keys(val)) {
        let v;
        try { v = val[k]; } catch { continue; }
        if (isKensingtonSignal(v)) { hasSignal = true; break; }
      }
      if (hasSignal) {
        // Resolve signal values for the initial render / toString. Per-property
        // effects in toElement() handle subsequent updates.
        const css = styleObjectToCss(resolveStyleSignals(val));
        if (css) {
          result.push([attrName, css]);
        }
      } else {
        const css = styleObjectToCss(val);
        if (css) {
          result.push([attrName, css]);
        }
      }
      continue;
    }
    if (isKensingtonSignal(val)) {
      result.push([attrName, val]);
      continue;
    }
    if (attr === 'class' && Array.isArray(val)) {
      const hasSignal = val.some(v => isKensingtonSignal(v));
      if (hasSignal) {
        // Mixed-content class array: at least one element is a signal. Wrap into a single
        // derived computed that joins the current values on every read. Both the toString
        // path (attributesStringFromObject) and the toElement path (signalEffect in
        // content-tag) handle a signal value uniformly from here.
        result.push([attrName, deriveClassList(val)]);
      } else {
        const classes = val
          .filter(v => (typeof v === 'string' && v !== '') || (typeof v === 'number' && isFinite(v)))
          .join(' ');
        if (classes) {
          result.push([attrName, classes]);
        }
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
      if (seen === undefined) { seen = new WeakSet(); }
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
  const subtreeSignalToString = rawVal => {
    const { signal, prefix, attrsSet, isStyle } = rawVal;
    let snapshot;
    try { snapshot = signal.value; } catch { return ''; }
    if (snapshot === null || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return '';
    }
    if (isStyle) {
      const css = styleObjectToCss(resolveStyleSignals(snapshot));
      return css ? `${prefix}="${encode ? he.encode(css) : css}"` : '';
    }
    return attributesStringFromObject(snapshot, { onFunction, encode, attrsSet, prefix });
  };
  for (const [name, rawVal] of attributesArrayFromObject(obj, options)) {
    if (name === SUBTREE_SIGNAL_KEY) {
      const sub = subtreeSignalToString(rawVal);
      if (sub) {
        if (result) { result += ' '; }
        result += sub;
      }
      continue;
    }
    let val = rawVal;
    if (isKensingtonSignal(val)) {
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
