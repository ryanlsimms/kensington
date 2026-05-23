import { createElement } from 'react';

// Maps Kensington's lowercase on* attributes to React's camelCase event props.
const EVENT_MAP = new Map([
  ['onclick', 'onClick'],
  ['ondblclick', 'onDoubleClick'],
  ['onchange', 'onChange'],
  ['oninput', 'onInput'],
  ['onsubmit', 'onSubmit'],
  ['onreset', 'onReset'],
  ['onkeydown', 'onKeyDown'],
  ['onkeyup', 'onKeyUp'],
  ['onkeypress', 'onKeyPress'],
  ['onfocus', 'onFocus'],
  ['onblur', 'onBlur'],
  ['onmousedown', 'onMouseDown'],
  ['onmouseup', 'onMouseUp'],
  ['onmousemove', 'onMouseMove'],
  ['onmouseenter', 'onMouseEnter'],
  ['onmouseleave', 'onMouseLeave'],
  ['onmouseover', 'onMouseOver'],
  ['onmouseout', 'onMouseOut'],
  ['onpointerdown', 'onPointerDown'],
  ['onpointerup', 'onPointerUp'],
  ['onpointermove', 'onPointerMove'],
  ['onpointerenter', 'onPointerEnter'],
  ['onpointerleave', 'onPointerLeave'],
  ['ontouchstart', 'onTouchStart'],
  ['ontouchend', 'onTouchEnd'],
  ['ontouchmove', 'onTouchMove'],
  ['onscroll', 'onScroll'],
  ['onwheel', 'onWheel'],
  ['ondragstart', 'onDragStart'],
  ['ondragend', 'onDragEnd'],
  ['ondragover', 'onDragOver'],
  ['ondragenter', 'onDragEnter'],
  ['ondragleave', 'onDragLeave'],
  ['ondrop', 'onDrop'],
]);

function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function flattenNested(prefix, val, out) {
  if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
    for (const [k, v] of Object.entries(val)) {
      flattenNested(`${prefix}-${k}`, v, out);
    }
  } else {
    out[prefix] = val;
  }
}

function translateAttrs(attrs) {
  const props = {};
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'class') {
      props.className = Array.isArray(val) ? val.filter(Boolean).join(' ') : val;
    } else if (key === 'for') {
      props.htmlFor = val;
    } else if (key === 'style' && val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const style = {};
      for (const [k, v] of Object.entries(val)) {
        style[kebabToCamel(k)] = v;
      }
      props.style = style;
    } else if (EVENT_MAP.has(key)) {
      props[EVENT_MAP.get(key)] = val;
    } else if (/^on/.test(key) && typeof val === 'function') {
      props[`on${ key[2].toUpperCase() }${key.slice(3)}`] = val;
    } else if (key === 'on' && val !== null && typeof val === 'object') {
      for (const [event, handler] of Object.entries(val)) {
        const attrName = `on${event}`;
        props[EVENT_MAP.get(attrName) ?? `on${event[0].toUpperCase()}${event.slice(1)}`] = handler;
      }
    } else if (key === 'prop' && val !== null && typeof val === 'object') {
      Object.assign(props, val);
    } else if (key === 'data' || key === 'aria') {
      flattenNested(key, val, props);
    } else {
      props[key] = val;
    }
  }
  return props;
}

function makeTag(tag) {
  return function tagBuilder(...args) {
    const firstIsAttrs = args.length > 0 &&
      args[0] !== null &&
      typeof args[0] === 'object' &&
      !Array.isArray(args[0]) &&
      !args[0].$$typeof; // React elements have $$typeof; attrs objects don't
    const attrs = firstIsAttrs ? args[0] : {};
    const children = (firstIsAttrs ? args.slice(1) : args).flat(Infinity);
    const props = translateAttrs(attrs);
    return createElement(tag, props, ...children);
  };
}

const tagCache = {};

export const t = new Proxy(tagCache, {
  get(target, tag) {
    if (typeof tag !== 'string') {return Reflect.get(target, tag);}
    if (!target[tag]) {target[tag] = makeTag(tag);}
    return target[tag];
  },
});

export function component(fn) {
  function wrapper(props) {
    return createElement(fn, props ?? {});
  }
  wrapper.displayName = fn.name;
  return wrapper;
}
