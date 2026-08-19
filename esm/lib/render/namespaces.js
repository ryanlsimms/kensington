export const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
export const MATH_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';

export function namespaceName(namespace) {
  if (namespace === HTML_NAMESPACE) { return 'HTML'; }
  if (namespace === SVG_NAMESPACE) { return 'SVG'; }
  if (namespace === MATH_NAMESPACE) { return 'MathML'; }
  return namespace;
}

function attributeNamespace(attrName) {
  if (attrName === 'xmlns' || attrName.startsWith('xmlns:')) { return XMLNS_NAMESPACE; }
  if (attrName.startsWith('xlink:')) { return XLINK_NAMESPACE; }
  if (attrName.startsWith('xml:')) { return XML_NAMESPACE; }
  return null;
}

export function setDomAttribute(element, attrName, value) {
  const namespace = attributeNamespace(attrName);
  if (namespace === null) {
    element.setAttribute(attrName, value);
  } else {
    element.setAttributeNS(namespace, attrName, value);
  }
}

export function removeDomAttribute(element, attrName) {
  const namespace = attributeNamespace(attrName);
  if (namespace === null) {
    element.removeAttribute(attrName);
  } else {
    const separator = attrName.indexOf(':');
    element.removeAttributeNS(namespace, separator === -1 ? attrName : attrName.slice(separator + 1));
  }
}
