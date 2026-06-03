import { t } from 'kensington';

import { callout, code } from '../../components/ui.js';
import { loc } from './helpers.js';

export function architectureConstruction() {
  return t.section({ id: 'construction', class: 'stage stage-1' }, [
    t.h2('Stage 1: Tag Construction'),
    t.p('The closure returned by createTag accepts several call forms:'),
    code('javascript', `t.div();                              // no attributes, no content
t.div('hello');                        // content only
t.div({ class: 'a' });                 // attributes only
t.div({ class: 'a' }, 'hello');        // attributes + content
t.div({ class: 'a' }, [t.p(), t.p()]); // attributes + array content`),
    t.p([
      'The closure body disambiguates these forms by inspecting the first argument\'s prototype. A plain object (',
      t.code('Object.prototype'),
      ' or ',
      t.code('null'),
      ' prototype) is treated as attributes. Anything else, a tag instance, array, string, number, or Signal, is treated as content.',
    ]),

    t.section({ id: 'construction-createtag' }, [
      t.h3('The createTag closure'),
      t.p([
        'At ',
        loc('esm/kensington.js'),
        ', each closure instantiates the appropriate tag class with a consistent options object:',
      ]),
      code('javascript', `const instance = new Klass({
  additionalGlobalAttributes: this.additionalGlobalAttributes,
  allowedAttributeMap,    // built once when createTag was called
  attributes,
  content,
  contentIsLiteral,
  encodeContent,
  indentationLevel: this.indentationLevel,
  logger: this.logger,
  namespace,
  namespaces: this.namespaces,
  tagName,
  validationLevel: this.validationLevel,
});`),
      t.p([
        'The ',
        t.code('allowedAttributeMap'),
        ' is built once when ',
        t.code('createTag'),
        ' is first called and shared across every invocation of that closure. Validating ',
        t.code('t.div(...)'),
        ' a million times does not rebuild the spec map a million times.',
      ]),
    ]),

    t.section({ id: 'construction-contenttag' }, [
      t.h3('The ContentTag constructor'),
      t.p({ class: 'file-crumb' }, [
        'esm',
        t.span({ class: 'slash' }, '/'),
        'tag-classes',
        t.span({ class: 'slash' }, '/'),
        loc('esm/tag-classes/content-tag.js'),
      ]),
      t.p([
        'The constructor stores options on instance fields, flattens content via collectContent, ',
        'and initializes private callback arrays:',
      ]),
      code('javascript', `class ContentTag {
  #connectedCallbacks = [];
  #disconnectedCallbacks = [];
  #domElement = null;

  constructor(options) {
    this.tagName = options.tagName;
    this.attributes = options.attributes;
    this.prop = options.attributes?.prop ?? null;
    this.validationLevel = options.validationLevel;
    this.content = collectContent(options.content);
    // ... other fields
  }
}`),

      t.h4('collectContent'),
      t.p([
        'Defined at ',
        loc('esm/tag-classes/content-tag.js'),
        '. Recursively flattens nested arrays into a single linear list and drops items that should not render:',
      ]),
      code('javascript', `function collectContent(items, seen = new Set()) {
  const out = [];
  for (const c of [].concat(items)) {
    if ([undefined, null, '', false, true].includes(c)) {
      continue; // false/true arise from conditional patterns: condition && t.span(...)
    }
    if (Array.isArray(c)) {
      if (seen.has(c)) { continue; } // cycle detection
      seen.add(c);
      out.push(...collectContent(c, seen));
      continue;
    }
    out.push(c);
  }
  return out;
}`),
      callout('key', 'Key behaviors',
        t.ul([
          t.li([
            t.code('false'),
            ' and ',
            t.code('true'),
            ' are dropped. This is what makes ',
            t.code('condition && t.span(...)'),
            ' work.',
          ]),
          t.li([t.code('null'), ', ', t.code('undefined'), ', and empty string are dropped.']),
          t.li([
            'Arrays flatten recursively. ',
            'A cycle-detection Set prevents infinite recursion on accidentally circular content.',
          ]),
          t.li('Signals pass through unchanged and are resolved at render time.'),
        ]),
      ),
    ]),

    t.section({ id: 'construction-validation' }, [
      t.h3('Validation'),
      t.p([
        "If validationLevel is 'warn' or 'error', the tag runs ",
        t.code('validate()'),
        ' immediately after construction (see ',
        loc('esm/lib/render/validate.js'),
        '):',
      ]),
      t.ol({ class: 'numbered' }, [
        t.li([
          t.strong('Collect unallowed attributes.'),
          ' Filter keys through ',
          t.code('attributeIsValid'),
          '. Allowed if it\'s ',
          t.code('on'),
          ' or ',
          t.code('prop'),
          ', in ',
          t.code('allowedAttributeMap'),
          ', matches a namespace prefix (',
          t.code('data-'),
          ', ',
          t.code('aria-'),
          ', custom), or is in ',
          t.code('additionalGlobalAttributes'),
          '.',
        ]),
        t.li([
          t.strong('Report them via showInvalid.'),
          " At 'warn' this logs; at 'error' this throws.",
        ]),
        t.li([
          t.strong('Collect invalid attribute values.'),
          ' For each allowed attribute, run ',
          t.code('attributeValueIsValid'),
          ' against the type spec.',
        ]),
        t.li([
          t.strong('Report invalid values'),
          ' as a single combined message so the developer sees all problems at once.',
        ]),
      ]),
      callout('warn', "Never throws at 'off'",
        t.p([
          'All validation goes through ',
          loc('esm/lib/util/show-invalid.js'),
          ". At 'off' it's a no-op. Production deployments run with 'off' for performance. A malformed attribute in user data must not crash the page.",
        ]),
      ),
      t.p([
        'Signal instances are accepted unconditionally for any attribute type. The actual value is only inspected at render time. See ',
        loc('esm/lib/render/validate.js'),
        '.',
      ]),
    ]),
  ]);
}
