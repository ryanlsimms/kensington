import Signal, { isSSRMode } from '../reactive/signal.js';
import he from '../util/he.js';
import indent from '../util/indent.js';
import showInvalid from '../util/show-invalid.js';
import { LINE_BREAK_TEST_REGEX, preserveSpaces } from '../util/text-utils.js';
import { attributesArrayFromObject, attributesStringFromObject } from './attributes.js';
import stringifyContentArray from './stringify-content-array.js';

export function contentIsShort(tag) { // fast path. Avoids the heavier stringifyContentArray+indent pipeline for simple single-string content
  if (!tag.content.length) {
    return true;
  }

  if (tag.content.length > 1) {
    return false;
  }

  let [content] = tag.content;
  if (content instanceof Signal) { content = content.get(); }

  if (!['string', 'number'].includes(typeof content)) {
    return false;
  }

  if (content.length > 100) { // numbers have no .length (undefined). undefined > 100 is false, so a single number always passes
    return false;
  }

  return !LINE_BREAK_TEST_REGEX.test(content);
}

export function attributeString(tag) {
  const onFunction = (tag.validationLevel === 'off' || isSSRMode())
    ? undefined
    : attrName => showInvalid(`function value for attribute \`${attrName}\` is not supported in toString()`, tag.validationLevel, tag.logger);
  const attrString = attributesStringFromObject(
    tag.attributes,
    { attrsSet: tag.allowedAttributeMap, encode: true, onFunction },
  );
  return attrString ? ` ${attrString}` : '';
}

export function attributeArray(tag) {
  return attributesArrayFromObject(tag.attributes, { attrsSet: tag.allowedAttributeMap, encode: false }); // encode: false. setAttribute handles its own encoding. encode: true is only needed for toString()
}

export function renderToString(tag) {
  tag.validateContent();

  let str = '<'; // chained += instead of a template literal. V8 rope optimization makes many short += faster than one large interpolation
  str += tag.tagName;
  str += attributeString(tag);
  str += '>';

  if (tag.contentIsLiteral) {
    let literalStr = '';
    for (const c of tag.content) {
      if (literalStr) { literalStr += '\n'; }
      literalStr += (typeof c === 'string' && tag.encodeContent) ? he.encode(c) : String(c); // String(). he.encode requires a string. Literal content can include numbers
    }
    str += literalStr;
  } else if (contentIsShort(tag)) {
    for (const c of tag.content) {
      const val = c instanceof Signal ? c.get() : c;
      if (typeof val === 'string' && tag.encodeContent) {
        str += he.encode(preserveSpaces(val));
      } else {
        str += val;
      }
    }
  } else {
    const resolved = tag.content.flatMap(c => {
      const val = c instanceof Signal ? c.get() : c;
      return Array.isArray(val) ? val : [val];
    });
    let content = stringifyContentArray(resolved);

    if (tag.indentationLevel) { // falsy (0) means no indentation. Skip the pass entirely rather than calling indent with level 0
      content = indent(content, tag.indentationLevel);
    }
    str += '\n';
    str += content;
    str += '\n';
  }

  str += '</';
  str += tag.tagName;
  str += '>';

  return str;
}
