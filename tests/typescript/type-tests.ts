import Kensington, {
  type ContentMethod,
  type Content,
  type ContentTag,
  type CommentTag,
  type VoidTag,
  type LiteralTag,
  type Reactive,
  type ReadonlySignal,
  computed,
  effect,
  isBrowser,
  renderForHydration,
  registerComponents,
  signal,
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

const _div: ContentTag = t.div('content');
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

// @ts-expect-error - unknown attributes are rejected
t.p({ fakeAttribute: 'something' });

// @ts-expect-error - unknown event handlers are rejected
t.p({ onfakeevent: (e: Event) => console.log(e) });

// ─── event handlers accept string or function ────────────────────────────────

t.button({ type: 'button', onclick: 'doSomething()' });
t.button({ type: 'button', onclick: (event: Event) => { event.preventDefault(); } });
t.input({ type: 'text', oninput: (event: Event) => { console.log(event); } });
t.div({ onmouseover: 'highlight(this)' });
t.div({ onmouseover: () => {} });

// specific event types — no cast needed
t.button({ onclick: (e: MouseEvent) => { console.log(e.clientX); } });
t.input({ oninput: (e: InputEvent) => { console.log(e.data); } });
t.div({ onkeydown: (e: KeyboardEvent) => { console.log(e.key); } });
t.div({ onblur: (e: FocusEvent) => { console.log(e.relatedTarget); } });
t.div({ ondragstart: (e: DragEvent) => { console.log(e.dataTransfer); } });
t.form({ onsubmit: (e: SubmitEvent) => { e.preventDefault(); } });
t.div({ onwheel: (e: WheelEvent) => { console.log(e.deltaY); } });

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

// @ts-expect-error - unknown attributes are rejected on untyped custom elements
t.simpleWidget({ unknownAttr: 'x' });

// @ts-expect-error - unknown event handlers are rejected on untyped custom elements
t.simpleWidget({ oncustomevent: () => {} });

// ─── literal and unsafeLiteral ───────────────────────────────────────────────

const _lit2: LiteralTag = t.unsafeLiteral('<script>alert(1)</script>');
const _litSig: LiteralTag = t.literal(signal('<p>reactive</p>'));
const _unsafeSig: LiteralTag = t.unsafeLiteral(signal('<b>raw</b>'));

// ─── inlineComment ───────────────────────────────────────────────────────────

const _commentStr: CommentTag = t.inlineComment('note');
const _commentNum: CommentTag = t.inlineComment(42);
const _commentSig: CommentTag = t.inlineComment(signal('dynamic'));

// ─── SVG CSS presentation attributes ────────────────────────────────────────

t.circle({ fill: 'red', stroke: 'blue', opacity: '0.5' });
t.rect({ 'font-size': '14px', fontWeight: '700' });
t.path({ display: 'none', visibility: 'hidden' });
t.g({ transform: 'translate(10,20)' });

// ─── hydration ───────────────────────────────────────────────────────────────

const _isBrowser: boolean = isBrowser;

// renderForHydration infers state type from component function — no cast needed
function counter({ count }: { count: number }) { return t.div(String(count)); }
const _rfh: LiteralTag = renderForHydration(counter, { count: 0 });

// component returning null is valid (client-only pattern)
function clientOnly(): null { return null; }
renderForHydration(clientOnly, {});

// component returning an array is valid
function pair(): ContentTag[] { return [t.p('a'), t.p('b')]; }
renderForHydration(pair, {});

// third argument overrides the name
renderForHydration(clientOnly, {}, 'myComp');

// registerComponents accepts a map of name -> component function
registerComponents({ counter: s => t.div(String(s['count'])) });
registerComponents({ clientOnly: () => null });
registerComponents({ pair: () => [t.p('a'), t.p('b')] });

// effect returns a stop handle
const _e = effect(() => {});
_e.stop();

// signal and computed have stop()
const _s = signal(0);
_s.stop();
const _c: ReadonlySignal<number> = computed(() => _s.get() * 2);
_c.stop();

// Reactive<T> accepts a static value, a mutable signal, or a readonly signal
const _r1: Reactive<string> = 'hello';
const _r2: Reactive<string> = signal('world');
const _r3: Reactive<string> = computed(() => 'derived');

// computed and transform results are read-only — .set() is not allowed
// @ts-expect-error — computed result is read-only
_c.set(5);
const _t = _s.transform(n => n + 1);
// @ts-expect-error — transform result is read-only
_t.set(5);

// ReadonlySignal works as content and as an attribute value
const _divWithComputed: ContentTag = t.div(_c);
const _divWithTransform: ContentTag = t.div(_t);

// Signal constructor is private — use signal() or computed() instead
// @ts-expect-error - cannot construct Signal directly
new Signal(5);
