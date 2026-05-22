import { apiTable } from '../../components/table.js';
import { code } from '../../components/ui.js';

export function apiSpecialMethods(t) {
  return t.section({ id: 'special-methods' }, [
    t.h2('Special methods'),

    t.h3({ id: 'htmlwithdoctype' }, 'htmlWithDocType'),
    t.p([
      'Identical to ',
      t.code('t.html()'),
      ' but prepends ',
      t.code('<!DOCTYPE html>'),
      ' to the output.',
    ]),
    code(t, 'typescript', `t.htmlWithDocType(attributes: HtmlAttributes, content?: HtmlContent): ContentTag
t.htmlWithDocType(content?: HtmlContent): ContentTag`),

    t.h3({ id: 'literal' }, 'literal / unsafeLiteral'),
    code(t, 'typescript', `t.literal(str: string): LiteralTag
t.unsafeLiteral(str: string): LiteralTag`),
    t.p([
      t.code('literal'),
      ' embeds a raw HTML string into the output. ',
      t.code('<script>'),
      ' tags trigger a validation warning or error. ',
      t.code('unsafeLiteral'),
      ' skips that check and should only be used for trusted HTML.',
    ]),

    t.h3({ id: 'inline-comment' }, 'inlineComment'),
    code(t, 'typescript', `t.inlineComment(str: string | number): CommentTag`),
    t.p([
      'Single-line strings produce ',
      t.code('<!-- text -->'),
      '. Multi-line strings are formatted across multiple lines.',
    ]),

    t.h3({ id: 'create-custom-tag' }, 'createCustomTag'),
    code(t, 'typescript', `t.createCustomTag(
  tagName: string,
  allowedAttributes?: Record<string, AttributeValidator>
): ContentMethod<T>`),
    t.p([
      'Returns a method for a custom element. Assign to a class property and annotate with ',
      t.code('ContentMethod<T>'),
      ' for typed attributes.',
    ]),
    t.p([
      'Each value in ',
      t.code('allowedAttributes'),
      ' is a validator:',
    ]),
    apiTable(t, ['Validator', 'Accepts'], [
      [t.code('String'), 'Any string value'],
      [t.code('Number'), 'Any number value'],
      [t.code('Boolean'), [t.code('true'), ' or ', t.code('false')]],
      [t.code("['a', 'b', ...]"), 'One of the listed string literals'],
      [t.code('v => boolean'), 'Custom predicate function'],
    ]),
    code(t, 'javascript', `class MyEngine extends Kensington {
  myCard = this.createCustomTag('my-card', {
    'card-type': ['primary', 'secondary'],
    'loading': Boolean,
    'max-items': Number,
    'score': v => typeof v === 'number' && v <= 100,
  });
}`),
    t.p([
      'To extend a built-in element, spread its attribute object from ',
      t.code('kensington/attributes'),
      ':',
    ]),
    code(t, 'javascript', `import { buttonAttributes } from 'kensington/attributes';

class MyEngine extends Kensington {
  button = this.createCustomTag('button', {
    ...buttonAttributes,
    popovertarget: String,
  });
}`),
  ]);
}
