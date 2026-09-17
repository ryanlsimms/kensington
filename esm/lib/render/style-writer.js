// Compare both the requested value and the browser's normalized inline style. This skips
// equivalent writes while still repairing styles changed by application code.
export function createStyleWriter() {
  const previous = new Map();
  return (element, property, value) => {
    const next = value === null || value === undefined || value === false ? '' : String(value);
    const current = element.style.getPropertyValue(property);
    const priority = element.style.getPropertyPriority(property);
    const last = previous.get(property);
    if (last?.value === next && last.actual === current && last.priority === priority) { return; }
    if (next === '') {
      if (current !== '' || priority !== '') { element.style.removeProperty(property); }
      previous.delete(property);
      return;
    }
    if (current !== next || priority !== '') {
      element.style.setProperty(property, next);
    }
    previous.set(property, {
      value: next,
      actual: element.style.getPropertyValue(property),
      priority: element.style.getPropertyPriority(property),
    });
  };
}
