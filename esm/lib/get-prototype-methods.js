export default function getPrototypeMethods(instance) {
  const methods = Object.getOwnPropertyNames(instance)
    .filter(key => typeof instance[key] === 'function' && key !== 'constructor');

  if (instance.constructor === Object) {
    return methods;
  }
  return methods.concat(getPrototypeMethods(Object.getPrototypeOf(instance)));
}
