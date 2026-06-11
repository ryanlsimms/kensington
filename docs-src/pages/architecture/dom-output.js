import { t } from 'kensington';

import { callout, code } from '../../components/ui.js';
import { loc, mermaid } from './helpers.js';

export function architectureDomOutput() {
  return t.section({ id: 'render', class: 'stage stage-3' }, [
    t.h2('Stage 3: DOM Output'),
    t.p([
      t.code('tag.toElement(opts)'),
      ' is the heavy path. It builds a live DOM element, wires every signal-attribute, prop, and content into an effect, registers connect/disconnect callbacks with the DOM tracker, and returns the element ready to be inserted into the document.',
    ]),
    t.p([
      'The function lives at ',
      loc('esm/tag-classes/content-tag.js'),
      '.',
    ]),
    mermaid(`flowchart TD
  S(["toElement()"]) --> A{"domElement cached?"}
  A -- yes --> R1["return cached"]
  A -- no --> B["validateContent"]
  B --> C["createElement(NS)"]
  C --> D["createLifecycle(element, persist)"]
  D --> E["For each attribute"]
  E --> E1{"Value type?"}
  E1 -- "on*+function" --> E2["addEventListener"]
  E1 -- "Signal" --> E3["lifecycle.signalEffect"]
  E1 -- "plain" --> E4["setAttribute"]
  E2 & E3 & E4 --> F["For each 'on' event"]
  F --> F1["addEventListener"]
  F1 --> G{"Has props?"}
  G -- yes --> G1["For each prop: Signal? signalEffect : assign"]
  G -- no --> H["For each content item"]
  G1 --> H
  H --> H1{"Item type?"}
  H1 -- "ContentTag/Literal/Comment" --> H2["recurse toElement, append"]
  H1 -- "Signal" --> H3["anchors + signalEffect -> reconcile"]
  H1 -- "plain" --> H4["createTextNode"]
  H2 & H3 & H4 --> I["lifecycle.finalize"]
  I --> J{"hasSignalContent?"}
  J -- yes --> K["markContentTracked"]
  J -- no --> L["cache domElement"]
  K --> L
  L --> R2["return element"]`),

    t.section({ id: 'render-cache' }, [
      t.h3('Cache check'),
      t.p([
        'If ',
        t.code('#domElement'),
        ' is set, return it immediately. If the cached element is already in the DOM (',
        t.code('parentNode !== null'),
        '), this would silently move the node. ',
        t.code('showInvalid'),
        ' reports it.',
      ]),
      code('javascript', `if (this.#domElement) {
  if (this.#domElement.parentNode !== null) {
    showInvalid('toElement() called on a tag instance already in the DOM ...', ...);
  }
  return this.#domElement;
}`),
      callout('note', 'Why cache?',
        t.p([
          'So that ',
          t.code('getDomElement()'),
          ' returns a stable reference, and so that re-calling ',
          t.code('toElement()'),
          ' on the same instance does not produce two independent DOM nodes that fight over the same signals.',
        ]),
      ),
    ]),

    t.section({ id: 'render-element' }, [
      t.h3('Element creation'),
      code('javascript', `const element = this.namespace ? document.createElementNS(this.namespace, this.tagName) : document.createElement(this.tagName);

const lifecycle = createLifecycle({ element, persist });
let hasSignalContent = false;`),
      t.p([
        'SVG and MathML tags carry their namespace through the ',
        t.code('createSvgContentTag'),
        ' and ',
        t.code('createMathTag'),
        ' factories. For HTML tags, namespace is undefined and ',
        t.code('createElement'),
        ' is used.',
      ]),
    ]),

    t.section({ id: 'render-attributes' }, [
      t.h3('Attribute wiring'),
      t.p([
        'Iterates the result of ',
        t.code('attributeArray()'),
        ', a flat list of ',
        t.code('[name, value]'),
        ' pairs after camelCase-to-kebab conversion, nested-namespace expansion, style-object stringification, and class-array joining. For each pair:',
      ]),
      t.table([
        t.thead(t.tr([
          t.th('Match'),
          t.th('Action'),
        ])),
        t.tbody([
          t.tr([
            t.td([t.code('onclick'), ', ', t.code('oninput'), ', etc. with a function value']),
            t.td([t.code('element.addEventListener(name.slice(2), fn)')]),
          ]),
          t.tr([
            t.td('Signal value'),
            t.td([t.code('lifecycle.signalEffect(sig, apply, attrName)')]),
          ]),
          t.tr([
            t.td('Plain value'),
            t.td([t.code('element.setAttribute(name, value)')]),
          ]),
        ]),
      ]),
      t.p('The signal-attribute apply function:'),
      code('javascript', `lifecycle.signalEffect(attrValue, (el, val) => {
  if (val === false || val === null || val === undefined) {
    el.removeAttribute(attrName);
  } else if (val === true) {
    el.setAttribute(attrName, '');   // bare attribute (disabled, checked, etc.)
  } else {
    el.setAttribute(attrName, String(val));
  }
}, attrName);`),
      t.p([
        'The effect runs once immediately to set the initial value, then re-runs whenever the signal changes. Inside the effect, ',
        t.code('el'),
        ' is the result of ',
        t.code('elementRef.deref()'),
        ' inside the lifecycle module. If the element has been garbage-collected, the effect self-stops.',
      ]),
    ]),

    t.section({ id: 'render-events' }, [
      t.h3('Event handlers (the on object)'),
      t.p([
        'The ',
        t.code('on'),
        ' attribute attaches multiple event handlers via a single nested object:',
      ]),
      code('javascript', `t.button({ on: { click: handleClick, mouseenter: handleHover } }, 'Press me')`),
      t.p([
        'The loop calls ',
        t.code('element.addEventListener(eventName, handler)'),
        ' for each function value. No cleanup is needed. Event listeners are released when the element is garbage-collected.',
      ]),
    ]),

    t.section({ id: 'render-props' }, [
      t.h3('Prop wiring'),
      t.p([
        'The ',
        t.code('prop'),
        ' key sets DOM properties directly, not attributes. This matters for things like ',
        t.code('input.value'),
        ' (DOM property reflects current state) vs. ',
        t.code('input[value]'),
        ' (attribute reflects initial state only):',
      ]),
      code('javascript', `t.input({ prop: { value: count } })  // input.value updates as count changes
t.input({ value: count.get() })      // frozen attribute set at construction time`),
      t.p([
        t.code('isPropWritable'),
        ' validates each property against the live element before assignment. If the property exists on the prototype but is read-only, showInvalid reports it and the assignment is skipped. Otherwise:',
      ]),
      code('javascript', `if (isKensingtonSignal(propValue)) {
  lifecycle.signalEffect(propValue, (el, val) => { el[propName] = val; }, 'prop:' + propName);
} else {
  element[propName] = propValue;
}`),
    ]),

    t.section({ id: 'render-content' }, [
      t.h3('Content wiring'),
      t.p([
        'For each item in the flattened content array (see ',
        loc('esm/tag-classes/content-tag.js'),
        '):',
      ]),
      t.div({ class: 'step-grid' }, [
        t.div({ class: 'step-card s3' }, [
          t.div({ class: 'step-num' }, 'Case 1'),
          t.div({ class: 'step-title' }, 'Tag instance'),
          t.div({ class: 'step-body' }, [
            'Recurse into ',
            t.code('child.toElement()'),
            ' and append. The child has its own lifecycle. The parent does not own its cleanup.',
          ]),
        ]),
        t.div({ class: 'step-card s3' }, [
          t.div({ class: 'step-num' }, 'Case 2'),
          t.div({ class: 'step-title' }, 'Signal value'),
          t.div({ class: 'step-body' }, [
            'Insert two comment-node anchors. Wire a signal effect that calls reconcile on every change. Set hasSignalContent so markContentTracked runs after.',
          ]),
        ]),
        t.div({ class: 'step-card s3' }, [
          t.div({ class: 'step-num' }, 'Case 3'),
          t.div({ class: 'step-title' }, 'Plain value'),
          t.div({ class: 'step-body' }, [
            'Create a text node and append it.',
          ]),
        ]),
      ]),
      t.p('The signal-content wiring:'),
      code('javascript', `if (isKensingtonSignal(node)) {
  hasSignalContent = true;
  const startAnchor = document.createComment('');
  const endAnchor = document.createComment('');
  element.append(startAnchor, endAnchor);
  lifecycle.signalEffect(node, (el, val) => {
    reconcile(el, startAnchor, endAnchor, Array.isArray(val) ? val : [val]);
  }, '(content)');
  continue;
}`),
      callout('key', 'Anchors persist for the element\'s lifetime',
        t.p([
          'The two comment nodes are held only by the effect\'s closure. ',
          t.code('markContentTracked(element)'),
          ' tells the reconciler to never replace this element\'s children, even if a parent reconcile sees a fresh element with different children.',
        ]),
      ),
    ]),

    t.section({ id: 'render-finalize' }, [
      t.h3('Lifecycle finalize'),
      t.p('After all wiring, the lifecycle is finalized:'),
      code('javascript', `lifecycle.finalize({
  connectCallbacks: this.#connectedCallbacks,
  disconnectCallbacks: this.#disconnectedCallbacks,
  onCleared: () => { if (this.#domElement === element) { this.#domElement = null; } },
  onReconnect: () => { this.#domElement = element; },
});

if (hasSignalContent) {
  markContentTracked(element);
}

this.#domElement = element;
return element;`),
      t.ul([
        t.li([
          t.strong('connectCallbacks.'),
          ' User-registered via ',
          t.code('addConnectedCallback'),
          '. Fire on every insertion when persist is true. Once otherwise.',
        ]),
        t.li([
          t.strong('disconnectCallbacks.'),
          ' User-registered via ',
          t.code('addDisconnectedCallback'),
          '. Fire on every removal.',
        ]),
        t.li([
          t.strong('onCleared.'),
          ' Internal. Resets ',
          t.code('#domElement'),
          ' to null after removal so ',
          t.code('getDomElement()'),
          ' returns null.',
        ]),
        t.li([
          t.strong('onReconnect.'),
          ' Internal. Restores ',
          t.code('#domElement'),
          ' to the live element on re-insertion under persist mode.',
        ]),
      ]),
    ]),
  ]);
}
