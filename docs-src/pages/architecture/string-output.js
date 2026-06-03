import { t } from 'kensington';

import { code } from '../../components/ui.js';
import { loc } from './helpers.js';

export function architectureStringOutput() {
  return t.section({ id: 'serialize', class: 'stage stage-2' }, [
    t.h2('Stage 2: String Output'),
    t.p([
      t.code('tag.toString()'),
      ' delegates to ',
      t.code('renderToString'),
      ' at ',
      loc('esm/lib/render/serialize.js'),
      ':',
    ]),
    t.ol({ class: 'numbered' }, [
      t.li([t.strong('Filter invalid content'), ' via ', t.code('validateContent()'), `. Items that aren't a string, finite number, tag instance, or Signal are dropped and reported via showInvalid.`]),
      t.li([
        t.strong('Open the tag.'),
        ' Concatenate ',
        t.code("'<'"),
        ', the tag name, the attribute string, and ',
        t.code("'>'"),
        '.',
      ]),
      t.li([t.strong('Render the content body'), ' via one of three paths (below).']),
      t.li([t.strong('Close the tag.'), ' Concatenate ', t.code("'</'"), ', the tag name, ', t.code("'>'"), '.']),
    ]),

    t.section({ id: 'serialize-paths' }, [
      t.h3('Three content paths'),
      t.p([
        t.code('renderToString'),
        ' picks a path based on tag type and content shape:',
      ]),
      t.div({ class: 'step-grid' }, [
        t.div({ class: 'step-card s2' }, [
          t.div({ class: 'step-num' }, 'Path A'),
          t.div({ class: 'step-title' }, 'Literal content'),
          t.div({ class: 'step-body' }, [
            'For ',
            t.code('<script>'),
            ' and ',
            t.code('<style>'),
            ' tags (',
            t.code('contentIsLiteral'),
            '). Content is joined by newlines without HTML encoding.',
          ]),
        ]),
        t.div({ class: 'step-card s2' }, [
          t.div({ class: 'step-num' }, 'Path B'),
          t.div({ class: 'step-title' }, 'Short single-line'),
          t.div({ class: 'step-body' }, [
            'Fast path when content is a single string or number under 100 characters with no line breaks. Concatenates directly without the stringifyContentArray and indent overhead.',
          ]),
        ]),
        t.div({ class: 'step-card s2' }, [
          t.div({ class: 'step-num' }, 'Path C'),
          t.div({ class: 'step-title' }, 'Multi-line indented'),
          t.div({ class: 'step-body' }, [
            'Everything else. Resolves Signals via ',
            t.code('.get()'),
            ', flattens, passes to stringifyContentArray, then applies indent at the tag\'s indentation level.',
          ]),
        ]),
      ]),
      t.p([
        'The selector is ',
        t.code('contentIsShort(tag)'),
        ' at ',
        loc('esm/lib/render/serialize.js'),
        ':',
      ]),
      code('javascript', `export function contentIsShort(tag) {
  if (!tag.content.length) { return true; }
  if (tag.content.length > 1) { return false; }
  let [content] = tag.content;
  if (content instanceof Signal) { content = content.get(); }
  if (!['string', 'number'].includes(typeof content)) { return false; }
  if (content.length > 100) { return false; }
  return !LINE_BREAK_TEST_REGEX.test(content);
}`),

      t.h4('Attribute serialization'),
      t.p([
        t.code('attributeString(tag)'),
        ' calls ',
        t.code('attributesStringFromObject'),
        ' at ',
        loc('esm/lib/render/attributes.js'),
        '. It iterates the attribute array and serializes each pair as ',
        t.code('name="value"'),
        ' with HTML encoding. Booleans render as the bare attribute name (',
        t.code('disabled'),
        ' not ',
        t.code('disabled="true"'),
        '). Function values cannot be serialized to strings and are silently omitted.',
      ]),
    ]),
  ]);
}
