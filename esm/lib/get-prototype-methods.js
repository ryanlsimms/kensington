export default function getPrototypeMethods(instance) {
  const methods = Object.getOwnPropertyNames(instance)
    .filter(key => typeof instance[key] === 'function' && key !== 'constructor');

  if (instance.constructor === Object) { // stop before Object.prototype to avoid collecting toString, valueOf, etc.
    return methods;
  }
  return methods.concat(getPrototypeMethods(Object.getPrototypeOf(instance)));
}
