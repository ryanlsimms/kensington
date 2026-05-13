import Kensington, {
  type ContentMethod,
  type Content,
  type ContentTag,
  type VoidTag,
  type LiteralTag,
  type DivTag,
  type TdTag,
  type TrTag,
  type UlTag,
  type LiTag,
  type TableTag,
  type ImgTag,
} from 'kensington';
import type { globalAttributes, formAttributes } from 'kensington/attributes';

// ─── module augmentation ────────────────────────────────────────────────────

declare module 'kensington' {
  interface NameSpaceAttributes {
    [key: `hx${string}`]: string | object;
  }
}

// ─── custom element subclass ────────────────────────────────────────────────

class MyEngine extends Kensington {
  myCard: ContentMethod<{ 'card-type'?: 'primary' | 'secondary' }> =
    this.createCustomTag('my-card', { 'card-type': ['primary', 'secondary'] });

  simpleWidget: ContentMethod = this.createCustomTag('simple-widget');
}

const t = new MyEngine({ validationLevel: 'warn', additionalNamespaces: ['hx'] });

// ─── constructor options ─────────────────────────────────────────────────────

new Kensington();
new Kensington({ validationLevel: 'off' });
new Kensington({ validationLevel: 'warn' });
new Kensington({ validationLevel: 'error' });
new Kensington({ additionalNamespaces: 'hx' });
new Kensington({ additionalNamespaces: ['hx', 'foo'] });
new Kensington({ indentationLevel: 4 });
new Kensington({ logger: (msg) => console.log(msg) });
new Kensington({ logger: console.log });

// @ts-expect-error - 'invalid' is not a valid validationLevel
new Kensington({ validationLevel: 'invalid' });

// ─── return types ────────────────────────────────────────────────────────────

const _div: DivTag = t.div('content');
const _divAsContentTag: ContentTag = t.div('content'); // branded subtype is assignable to ContentTag
const _br: VoidTag = t.br();
const _lit: LiteralTag = t.literal('<p>raw</p>');

// ─── void element — no content argument ─────────────────────────────────────

t.br();
t.br({ class: 'foo' });
t.br({ id: 'x', style: 'display:none' });
t.div({ style: { backgroundColor: 'red', zIndex: 2, display: 'block', color: undefined } });

// @ts-expect-error - false is not a valid style value
t.div({ style: { display: false } });
// @ts-expect-error - null is not a valid style value
t.div({ style: { color: null } });
// @ts-expect-error - true is not a valid style value
t.div({ style: { color: true } });

// @ts-expect-error - br takes no content argument
t.br({ class: 'foo' }, 'some content');

t.input({ type: 'text' });
t.input({ type: 'text', required: true });
t.wbr();

// ─── attribute value types ───────────────────────────────────────────────────

t.input({ type: 'checkbox', checked: true });
t.input({ type: 'checkbox', checked: false });
t.input({ type: 'text', maxlength: 80 });

// @ts-expect-error - checked must be boolean, not string
t.input({ checked: 'maybe' });

t.form({ method: 'get' });
t.form({ method: 'GET' });
t.form({ method: 'post' });
t.form({ method: 'POST' });

// @ts-expect-error - 'delete' is not a valid form method
t.form({ method: 'delete' });

t.html({ lang: 'en' });
t.div({ dir: 'ltr' });
t.div({ hidden: 'hidden' });

// @ts-expect-error - dir only accepts specific string literals
t.div({ dir: 'sideways' });

// ─── class as string or array ────────────────────────────────────────────────

t.div({ class: 'foo' });
t.div({ class: ['foo', 'bar'] });

// ─── global attributes ───────────────────────────────────────────────────────

t.span({ id: 'my-id', title: 'tooltip', tabindex: 0 });
t.p({ contenteditable: 'true' });
t.p({ contenteditable: 'false' });

// @ts-expect-error - contenteditable doesn't accept arbitrary strings
t.p({ contenteditable: 'yes' });

// ─── event handlers accept string or function ────────────────────────────────

t.button({ type: 'button', onclick: 'doSomething()' });
t.button({ type: 'button', onclick: (event: Event) => { event.preventDefault(); } });
t.input({ type: 'text', oninput: (event: Event) => { console.log(event); } });
t.div({ onmouseover: 'highlight(this)' });
t.div({ onmouseover: () => {} });

// element-specific on* attributes (e.g. SVG animation events) accept string or function
t.animate({ onbegin: 'handleBegin()' });
t.animate({ onbegin: (event: Event) => { console.log(event); } });
t.animate({ onend: () => {} });

// @ts-expect-error - number is not a valid event handler type
t.div({ onclick: 42 });

// @ts-expect-error - number is not a valid event handler type for element-specific on* attributes
t.animate({ onbegin: 42 });

// ─── numeric attributes ──────────────────────────────────────────────────────

t.input({ size: 20 });
t.input({ maxlength: 100 });
t.td({ colspan: 3 });
t.td({ rowspan: 2 });

t.input({ size: '-1' }); // numeric string representation is valid
// @ts-expect-error - arbitrary string is not valid where number | `${number}` is expected
t.input({ size: 'big' });

// ─── module augmentation — hx namespace ─────────────────────────────────────

t.div({ hxBoost: 'true' });
t.div({ hxTarget: '#result', hxSwap: 'outerHTML' });
t.button({ type: 'button', hxPost: '/api/submit' });
t.div({ 'aria-label': 'close' });
t.div({ 'data-testid': 'header' });

// ─── content types ───────────────────────────────────────────────────────────

t.div('text content');
t.div(42);
t.div(t.span('nested'));
t.div([t.p('a'), t.p('b')]);
t.div([t.span('x'), 'mixed', 42]);
t.div(t.literal('<hr>'));

const content: Content = [t.p('a'), 'text', 42];
t.section(content);

// conditional content patterns — false/null/undefined are silently dropped at runtime
const show = true;
t.div(show && t.span('visible'));
t.div([show && t.span('a'), 'text']);
t.div(show ? t.span('yes') : null);
t.div([show ? t.p('yes') : null, 'fallback']);

// ─── method signatures ───────────────────────────────────────────────────────

t.a({ href: '/path' }, 'link text');
t.a({ href: '/path' });
t.a('link text');
t.a();

t.htmlWithDocType({ lang: 'en' }, t.body('hello'));
t.htmlWithDocType(t.body('hello'));
t.htmlWithDocType();

// @ts-expect-error - too many arguments when first arg is content
t.a('link text', 'extra arg');

// ─── custom element attributes ───────────────────────────────────────────────

t.myCard({ 'card-type': 'primary' }, 'content');
t.myCard({ 'card-type': 'secondary' });
t.myCard('just content');
t.myCard();

// @ts-expect-error - 'danger' is not a valid card-type
t.myCard({ 'card-type': 'danger' });

// camelCase keys also accept their kebab-case equivalent
class HyphenEngine extends Kensington {
  el = this.createCustomTag('x-el', { hyphenatedAttribute: String });
}
const ht = new HyphenEngine();
ht.el({ hyphenatedAttribute: 'a' });
ht.el({ 'hyphenated-attribute': 'a' });

t.simpleWidget();
t.simpleWidget('content');
t.simpleWidget({ class: 'foo' }, 'content');

// ─── literal and unsafeLiteral ───────────────────────────────────────────────

const _lit2: LiteralTag = t.unsafeLiteral('<script>alert(1)</script>');

// ─── SVG CSS presentation attributes ────────────────────────────────────────

t.circle({ fill: 'red', stroke: 'blue', opacity: '0.5' });
t.rect({ 'font-size': '14px', fontWeight: '700' });
t.path({ display: 'none', visibility: 'hidden' });
t.g({ transform: 'translate(10,20)' });

// ─── content model — strict containers ──────────────────────────────────────

// branded return types are subtypes of ContentTag
const _tr: ContentTag = t.tr(t.td('cell'));
const _trBranded: TrTag = t.tr(t.td('cell'));
const _ul: ContentTag = t.ul(t.li('item'));
const _ulBranded: UlTag = t.ul(t.li('item'));
const _table: TableTag = t.table(t.tbody(t.tr(t.td('cell'))));
const _tdBranded: TdTag = t.td('cell');
const _img: ImgTag = t.img({ src: 'photo.jpg', alt: '' });

// valid strict container usage
t.table([t.thead(t.tr(t.th('header'))), t.tbody(t.tr(t.td('cell')))]);
t.tr([t.td('cell'), t.th('header')]);
t.ul(t.li('item'));
t.ol([t.li('first'), t.li('second')]);
t.dl([t.dt('term'), t.dd('definition')]);
t.select(t.option('choice'));
t.optgroup({ label: 'group' }, [t.option('a'), t.option('b')]);
t.picture([t.source({ srcset: 'img.webp', type: 'image/webp' }), t.img({ src: 'img.jpg', alt: '' })]);
t.hgroup([t.h2('title'), t.p('subtitle')]);

// conditional patterns and escape hatches still work inside strict containers
t.tr(show && t.td('maybe'));
t.ul(show ? t.li('yes') : null);
t.tr(t.literal('<td>raw</td>'));
t.ul([t.inlineComment('list comment'), t.li('item')]);

// @ts-expect-error - div is not valid content for tr
t.tr(t.div('invalid'));

// @ts-expect-error - p is not valid content for ul
t.ul(t.p('invalid'));

// @ts-expect-error - span is not valid content for select
t.select(t.span('invalid'));

// @ts-expect-error - td is not valid content for table (must be wrapped in tr/tbody/etc.)
t.table(t.td('cell'));
