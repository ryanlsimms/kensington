export default function getPrototypeMethods(instance) {
  const methods = Object.getOwnPropertyNames(instance)
    .filter(key => (instance[key] instanceof Function && key !== 'constructor'));

  if (instance?.constructor === Object) {
    return methods;
  }
  return methods.concat(getPrototypeMethods(Object.getPrototypeOf(instance)));

}
