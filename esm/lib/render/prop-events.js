import { _afterReactiveUpdates } from '../reactive/signal.js';
import { HTML_NAMESPACE } from './namespaces.js';

const NON_VALUE_INPUTS = new Set(['hidden', 'file', 'button', 'submit', 'reset', 'image', 'checkbox', 'radio']);

// Unknown input types fall back to text in the DOM.
export function propChangeEvent(tag, type, property) {
  if (tag === 'input') {
    type = String(type ?? 'text').toLowerCase();
    if (property === 'checked' && (type === 'checkbox' || type === 'radio')) { return 'change'; }
    if (property === 'value' && !NON_VALUE_INPUTS.has(type)) { return 'input'; }
  }
  if (property === 'value') {
    if (tag === 'textarea') { return 'input'; }
    if (tag === 'select') { return 'change'; }
  }
  return null;
}

function eventTypeForElement(element, property) {
  const inputType = element.localName === 'input' ? element.type : undefined;
  return propChangeEvent(element.localName, inputType, property);
}

function isEquivalentValue(element, property, currentValue, nextValue) {
  if (property === 'checked') {
    return currentValue === Boolean(nextValue);
  }
  if (typeof nextValue !== 'string' && typeof nextValue !== 'number') {
    return false; // Let the native setter handle coercion for other types.
  }
  if (currentValue === String(nextValue)) {
    return true;
  }
  // Preserve equivalent numeric spellings such as "1.0" while editing.
  if (element.type === 'number' && typeof nextValue === 'number' && currentValue !== '') {
    return Number(currentValue) === nextValue;
  }
  return false;
}

function readSelectedOptions(element) {
  return Array.from(element.selectedOptions, option => ({ index: option.index, value: option.value }));
}

function sameSelection(previous, current) {
  return previous.length === current.length && previous.every((option, index) => (
    option.index === current[index].index && option.value === current[index].value
  ));
}

export function createPropWriter({ localName, namespaceURI }, property, dispatchEvents) {
  // Classify the element/property once. Input type remains dynamic throughout the batch.
  const isFormProperty = namespaceURI === HTML_NAMESPACE && (
    localName === 'input' && (property === 'value' || property === 'checked')
    || (localName === 'textarea' || localName === 'select') && property === 'value'
  );
  if (!isFormProperty) {
    return (element, value, preserve = false) => {
      if (!preserve) { element[property] = value; }
    };
  }

  const isSelect = localName === 'select';
  const readState = isSelect ? readSelectedOptions : element => element[property];
  const statesEqual = isSelect ? sameSelection : Object.is;
  let initialized = false;
  let pendingChange = null;
  const notify = () => {
    const change = pendingChange;
    pendingChange = null;
    const element = change?.ref.deref();
    if (!element?.isConnected || statesEqual(readState(element), change.before)) { return; }
    const eventType = eventTypeForElement(element, property);
    if (eventType) {
      const Event = element.ownerDocument.defaultView.Event;
      element.dispatchEvent(new Event(eventType, { bubbles: true, composed: true }));
    }
  };

  return (element, value, preserve = false) => {
    if (preserve) {
      initialized = true;
      return;
    }
    const shouldNotify = dispatchEvents && initialized;
    const before = shouldNotify ? readState(element) : null;
    const eventType = eventTypeForElement(element, property);
    // The first assignment establishes native dirty-value/dirty-checked state,
    // even when equal. Later attribute writes must not overwrite the live binding.
    // Select setters also reconcile option selection, even when their scalar value matches.
    if (isSelect || !initialized || !eventType || !isEquivalentValue(element, property, element[property], value)) {
      element[property] = value;
    }
    // Capture candidate changes now; notify chooses the event from the final input type.
    if (shouldNotify && !statesEqual(before, readState(element))) {
      pendingChange ??= { ref: new WeakRef(element), before };
      _afterReactiveUpdates(notify);
    }
    initialized = true;
  };
}
