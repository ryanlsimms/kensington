import attributesArrayFromObject from './attributes-array-from-object.js';

export default function attributesStringFromObject(obj, options = {}) {
  const { onFunction } = options;
  let result = '';
  for (const [name, val] of attributesArrayFromObject(obj, options)) {
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
