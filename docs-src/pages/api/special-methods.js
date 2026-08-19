import { t } from 'kensington';

import { apiTable } from '../../components/table.js';
import { code } from '../../components/ui.js';

export function apiSpecialMethods() {
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
    code('typescript', `t.htmlWithDocType(attributes: HtmlAttributes, content?: HtmlContent): ContentTag
t.htmlWithDocType(content?: HtmlContent): ContentTag`),

    t.h3({ id: 'literal' }, 'literal / unsafeLiteral'),
    code('typescript', `t.literal(str: string | ReadonlySignal<string>): LiteralTag
t.unsafeLiteral(str: string | ReadonlySignal<string>): LiteralTag`),
    t.p([
      t.code('literal'),
      ' embeds a raw markup string into the output. Live DOM fragments are parsed in their surrounding HTML, SVG, or MathML context, including after reactive updates. ',
      t.code('<script>'),
      ' tags trigger a validation warning or error. ',
      t.code('unsafeLiteral'),
      ' skips that check and should only be used for trusted markup. HTML-context scripts execute or load when inserted into a document; foreign-content scripts retain browser-defined behavior.',
    ]),
    t.p([
      t.strong('Cross-browser SVG/MathML warning: '),
      'do not rely on scripts inside foreign-content literals for portable execution. A Range-created inline SVG script currently executes in Firefox but remains inert in Chromium and WebKit. Put initialization in an HTML-context script or normal application JavaScript.',
    ]),
    t.p([
      t.code('literal'),
      ' is not a sanitizer. Its script check does not remove event handlers, dangerous URLs, or other active content, so both methods require trusted input.',
    ]),

    t.h3({ id: 'inline-comment' }, 'inlineComment'),
    code('typescript', `t.inlineComment(
  str: string | number | ReadonlySignal<string> | ReadonlySignal<number>
): CommentTag`),
    t.p([
      'Single-line strings produce ',
      t.code('<!-- text -->'),
      '. Multi-line strings are formatted across multiple lines.',
    ]),

    t.h3({ id: 'create-custom-tag' }, 'createCustomTag'),
    code('typescript', `t.createCustomTag(
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
    apiTable(['Validator', 'Accepts'], [
      [t.code('String'), 'Any string value'],
      [t.code('Number'), 'Any number value'],
      [t.code('Boolean'), [t.code('true'), ' or ', t.code('false')]],
      [t.code("['a', 'b', ...]"), 'One of the listed string literals'],
      [t.code('v => boolean'), 'Custom predicate function'],
    ]),
    code('javascript', `class MyEngine extends Kensington {
  myCard = this.createCustomTag('my-card', {
    cardType: ['primary', 'secondary'],
    loading: Boolean,
    maxItems: Number,
    score: v => typeof v === 'number' && v <= 100,
  });
}`),
    t.p([
      'To extend a built-in element, spread its attribute object from ',
      t.code('kensington/attributes'),
      ':',
    ]),
    code('javascript', `import { buttonAttributes } from 'kensington/attributes';

class MyEngine extends Kensington {
  button = this.createCustomTag('button', {
    ...buttonAttributes,
    popovertarget: String,
  });
}`),
  ]);
}
