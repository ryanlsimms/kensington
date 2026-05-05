import attributesArrayFromObject from './attributes-array-from-object.js';
import he from './he.js';
import Signal from './signal.js';

export default function attributesStringFromObject(obj, options = {}) {
  const { onFunction, encode } = options;
  let result = '';
  for (let [name, val] of attributesArrayFromObject(obj, options)) {
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
