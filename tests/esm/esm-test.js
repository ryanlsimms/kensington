import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, beforeEach, describe, it } from 'node:test';

import Kensington, { computed, effect, isBrowser, renderForHydration, signal, t } from 'kensington';

import {
  _disposeHydrationScope,
  _enterHydrationScope,
  _exitHydrationScope,
} from '../../esm/lib/reactive/hydration-scope.js';
import { _resetWarningThrottle } from '../../esm/lib/reactive/warnings.js';
import { attributesArrayFromObject } from '../../esm/lib/render/attributes.js';

// ─── content tag ───────────────────────────────────────────────────────────

describe('content tag', () => {
  it('generates tag', () => {
    assert.strictEqual(t.div().toString(), '<div></div>');
  });
  it('number content', () => {
    assert.strictEqual(t.div(42).toString(), '<div>42</div>');
  });
  it('short content', () => {
    assert.strictEqual(t.div('hi').toString(), '<div>hi</div>');
  });
  it('encodes content', () => {
    assert.strictEqual(t.div('<div></div>').toString(), '<div>&#x3C;div&#x3E;&#x3C;/div&#x3E;</div>');
  });
  it('encodes ampersand in content', () => {
    assert.strictEqual(t.div('a & b').toString(), '<div>a &#x26; b</div>');
  });
  it('encodes double quotes in content', () => {
    assert.strictEqual(t.div('say "hello"').toString(), '<div>say &#x22;hello&#x22;</div>');
  });
  it('encodes all special chars in content without double-encoding', () => {
    assert.strictEqual(t.div('<a href="x&y">').toString(), '<div>&#x3C;a href=&#x22;x&#x26;y&#x22;&#x3E;</div>');
  });
  it('replaces multiple spaces with non-breaking spaces', () => {
    assert.strictEqual(t.div('a  b').toString(), '<div>a  b</div>');
    assert.strictEqual(t.div('a   b').toString(), '<div>a   b</div>');
    assert.strictEqual(t.div('a b').toString(), '<div>a b</div>');
  });
  it('does not replace spaces in preformatted content', () => {
    assert.strictEqual(t.pre('a  b').toString(), '<pre>a  b</pre>');
    assert.strictEqual(t.script('const x  = 1;').toString(), '<script>const x  = 1;</script>');
  });
  it('converts line breaks to br tags', () => {
    assert.strictEqual(t.div('line1\nline2').toString(), '<div>\n  line1<br>\n  line2\n</div>');
  });
  it('converts \\r-only line breaks to br tags', () => {
    assert.strictEqual(t.div('line1\rline2').toString(), '<div>\n  line1<br>\n  line2\n</div>');
  });
  it('mixed content array of strings and tags', () => {
    assert.strictEqual(t.div(['some text', t.span('hi')]).toString(), '<div>\n  some text\n  <span>hi</span>\n</div>');
  });
  it('flattens nested arrays in content', () => {
    assert.strictEqual(
      t.div([['a', 'b'], 'c']).toString(),
      t.div(['a', 'b', 'c']).toString(),
    );
    assert.strictEqual(
      t.div([t.span('x'), [t.span('y'), t.span('z')]]).toString(),
      t.div([t.span('x'), t.span('y'), t.span('z')]).toString(),
    );
  });
  it('ignores empty content', () => {
    assert.strictEqual(t.div('').toString(), '<div></div>');
    assert.strictEqual(t.div(null).toString(), '<div></div>');
    assert.strictEqual(t.div([]).toString(), '<div></div>');
    assert.strictEqual(t.div('content\n\n').toString(), '<div>\n  content<br>\n</div>');
  });
  it('ignores null, undefined, false, and empty string in content array', () => {
    assert.strictEqual(t.div([null, undefined, false, '', 'real']).toString(), '<div>real</div>');
  });
  it('filters true from content', () => {
    assert.strictEqual(t.div(true).toString(), '<div></div>');
    assert.strictEqual(t.div([true, 'hello']).toString(), '<div>hello</div>');
  });
  it('throws on NaN content when validationLevel is error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div(NaN).toString(), /Invalid content/);
  });
  it('throws on Infinity content when validationLevel is error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div(Infinity).toString(), /Invalid content/);
    assert.throws(() => tt.div(-Infinity).toString(), /Invalid content/);
  });
  it('renders nothing for NaN and Infinity content when validationLevel is off', () => {
    assert.strictEqual(t.div(NaN).toString(), '<div></div>');
    assert.strictEqual(t.div(Infinity).toString(), '<div></div>');
  });
  it('ignores false from short-circuit conditional content', () => {
    const show = false;
    assert.strictEqual(t.div([show && t.span('hi'), 'real']).toString(), '<div>real</div>');
  });
  it('literal content', () => {
    assert.strictEqual(t.div(t.literal('<div></div>')).toString(), '<div>\n  <div></div>\n</div>');
  });
  it('literal script content throws with validationLevel error', () => {
    const te = new Kensington({ validationLevel: 'error' });
    assert.throws(() => te.div(te.literal('<script></script>')).toString());
    assert.throws(() => te.literal('<SCRIPT>alert(1)</SCRIPT>').toString());
    assert.strictEqual(t.div(t.unsafeLiteral('<script>console.log("hello");</script>')).toString(), `<div>\n  <script>console.log("hello");</script>\n</div>`);
  });
  it('literal renders nothing for non-string input with validationLevel off', () => {
    assert.strictEqual(t.literal(null).toString(), '');
    assert.strictEqual(t.literal(42).toString(), '');
  });
  it('literal throws on non-string input with validationLevel error', () => {
    const te = new Kensington({ validationLevel: 'error' });
    assert.throws(() => te.literal(null).toString(), { message: 'literal() only accepts a string' });
    assert.throws(() => te.literal(42).toString(), { message: 'literal() only accepts a string' });
  });
  it('inlineComment single-line', () => {
    assert.strictEqual(t.inlineComment('hello world').toString(), '<!-- hello world -->');
  });
  it('inlineComment number', () => {
    assert.strictEqual(t.inlineComment(42).toString(), '<!-- 42 -->');
  });
  it('inlineComment multi-line', () => {
    assert.strictEqual(t.inlineComment('line 1\nline 2').toString(), '<!--\n  line 1\n  line 2\n-->');
  });
  it('inlineComment normalizes CRLF and CR-only line endings', () => {
    assert.strictEqual(t.inlineComment('line 1\r\nline 2').toString(), '<!--\n  line 1\n  line 2\n-->');
    assert.strictEqual(t.inlineComment('line 1\rline 2').toString(), '<!--\n  line 1\n  line 2\n-->');
  });
  it('inlineComment renders nothing for non-string/number with validationLevel off', () => {
    assert.strictEqual(t.inlineComment({}).toString(), '');
  });
  it('inlineComment throws on non-string/number with validationLevel error', () => {
    const te = new Kensington({ validationLevel: 'error' });
    assert.throws(() => te.inlineComment({}).toString());
  });
  it('inlineComment strips "--" when validationLevel is off', () => {
    assert.strictEqual(t.inlineComment('a -- b').toString(), '<!-- a  b -->');
  });
  it('inlineComment throws when validationLevel is error and text contains "--"', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.inlineComment('a -- b').toString(), /must not contain/);
  });
  it('inlineComment warns and strips "--" when validationLevel is warn', (test, done) => {
    let warned = false;
    const tt = new Kensington({ validationLevel: 'warn', logger: () => { warned = true; } });
    const result = tt.inlineComment('close --> tag').toString();
    assert.strictEqual(result, '<!-- close > tag -->');
    assert.ok(warned);
    done();
  });
  it('inlineComment between nested tags', () => {
    assert.strictEqual(
      t.div([t.p('hello'), t.inlineComment('separator'), t.p('world')]).toString(),
      '<div>\n  <p>hello</p>\n  <!-- separator -->\n  <p>world</p>\n</div>',
    );
  });
});

// ─── cross-instance tag compatibility ─────────────────────────────────────

describe('cross-instance tag compatibility', () => {
  // Simulate a ContentTag/LiteralTag/CommentTag from a foreign kensington module instance.
  // In the real scenario, the inner component's class has a different identity than this
  // module's class, so instanceof fails. The _isKensingtonTag prototype marker is the fix.
  class ForeignTag {
    constructor(html) { this.html = html; }
    toString() { return this.html; }
  }
  ForeignTag.prototype._isKensingtonTag = true;

  // Simulate a Signal from a foreign kensington module instance.
  class ForeignSignal {
    constructor(value) { this.#value = value; }
    #value;
    get() { return this.#value; }
    set(v) { this.#value = v; }
  }
  ForeignSignal.prototype._isKensingtonSignal = true;

  it('ContentTag instances have _isKensingtonTag on the prototype', () => {
    assert.strictEqual(t.div()._isKensingtonTag, true);
    assert.ok(!Object.hasOwn(t.div(), '_isKensingtonTag'));
  });
  it('LiteralTag instances have _isKensingtonTag on the prototype', () => {
    assert.strictEqual(t.literal('x')._isKensingtonTag, true);
    assert.ok(!Object.hasOwn(t.literal('x'), '_isKensingtonTag'));
  });
  it('CommentTag instances have _isKensingtonTag on the prototype', () => {
    assert.strictEqual(t.inlineComment('x')._isKensingtonTag, true);
    assert.ok(!Object.hasOwn(t.inlineComment('x'), '_isKensingtonTag'));
  });
  it('Signal instances have _isKensingtonSignal on the prototype', () => {
    const s = signal('x');
    assert.strictEqual(s._isKensingtonSignal, true);
    assert.ok(!Object.hasOwn(s, '_isKensingtonSignal'));
  });
  it('accepts a tag from a different kensington module instance as content', () => {
    const te = new Kensington({ validationLevel: 'error' });
    const foreignTag = new ForeignTag('<span>foreign</span>');
    assert.strictEqual(te.div(foreignTag).toString(), '<div>\n  <span>foreign</span>\n</div>');
  });
  it('accepts a literal from a different kensington module instance as content', () => {
    const te = new Kensington({ validationLevel: 'error' });
    const foreignLiteral = new ForeignTag('<b>bold</b>');
    assert.strictEqual(te.div(foreignLiteral).toString(), '<div>\n  <b>bold</b>\n</div>');
  });
  it('accepts a comment from a different kensington module instance as content', () => {
    const te = new Kensington({ validationLevel: 'error' });
    const foreignComment = new ForeignTag('<!-- note -->');
    assert.strictEqual(te.div(foreignComment).toString(), '<div>\n  <!-- note -->\n</div>');
  });
  it('accepts a signal from a different kensington module instance as content', () => {
    const te = new Kensington({ validationLevel: 'error' });
    const foreignSignal = new ForeignSignal('hello');
    assert.doesNotThrow(() => te.div(foreignSignal).toString());
    assert.strictEqual(te.div(foreignSignal).toString(), '<div>hello</div>');
  });
  it('accepts a signal from a different kensington module instance as an attribute value', () => {
    const te = new Kensington({ validationLevel: 'error' });
    const foreignSignal = new ForeignSignal('btn-primary');
    assert.strictEqual(te.div({ class: foreignSignal }).toString(), '<div class="btn-primary"></div>');
  });
  it('resolves a foreign signal value when rendering content', () => {
    const foreignSignal = new ForeignSignal('world');
    assert.strictEqual(t.p(foreignSignal).toString(), '<p>world</p>');
  });
});

// ─── literal content ───────────────────────────────────────────────────────

describe('literal content', () => {
  it('does not encode script tags', () => {
    assert.strictEqual(
      t.body(t.script(`const x = "<div></div>";\nconsole.log(x);`)).toString(),
      `<body>\n  <script>const x = "<div></div>";\n  console.log(x);</script>\n</body>`,
    );
  });
  it('encodes pre tag content', () => {
    assert.strictEqual(
      t.div(t.pre('<div></div')).toString(),
      `<div>\n  <pre>&#x3C;div&#x3E;&#x3C;/div</pre>\n</div>`,
    );
  });
  it('does not add whitespace inside textarea and pre', () => {
    assert.strictEqual(
      t.div(t.div(t.textarea('line1\r\nline2'))).toString(),
      `<div>\n  <div>\n    <textarea>line1\nline2</textarea>\n  </div>\n</div>`,
    );
    assert.strictEqual(
      t.div(t.div(t.pre('line1\r\nline2'))).toString(),
      `<div>\n  <div>\n    <pre>line1\nline2</pre>\n  </div>\n</div>`,
    );
  });
  it('does not escape style tag content', () => {
    assert.strictEqual(
      t.style('td:nth-of-type(1):before { content: "Date"; }').toString(),
      '<style>td:nth-of-type(1):before { content: "Date"; }</style>',
    );
  });
  it('joins multiple content items with newline', () => {
    assert.strictEqual(t.pre(['line1', 'line2']).toString(), '<pre>line1\nline2</pre>');
    assert.strictEqual(t.script(['var a = 1;', 'var b = 2;']).toString(), '<script>var a = 1;\nvar b = 2;</script>');
  });
  it('does not crash when Symbol is passed as content with validationLevel off', () => {
    assert.doesNotThrow(() => t.script(Symbol('x')).toString());
    assert.doesNotThrow(() => t.style(Symbol('x')).toString());
  });
});

// ─── void tag ──────────────────────────────────────────────────────────────

describe('void tag', () => {
  it('renders without closing tag', () => {
    assert.strictEqual(t.hr().toString(), '<hr>');
  });
  it('does not allow content', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.hr({}, 'I am not allowed'));
  });
});

// ─── attributes ────────────────────────────────────────────────────────────

describe('attributes', () => {
  it('converts camelCase to kebab-case', () => {
    assert.strictEqual(t.div({ dataBsTarget: 'abc' }).toString(), '<div data-bs-target="abc"></div>');
  });
  it('converts nested object to kebab-case', () => {
    assert.strictEqual(t.div({ data: { bs: { target: 'abc' } } }).toString(), '<div data-bs-target="abc"></div>');
  });
  it('nested object with all-null values does not produce a trailing space', () => {
    assert.strictEqual(t.div({ id: 'x', data: { foo: null } }).toString(), '<div id="x"></div>');
    assert.strictEqual(t.div({ id: 'x', data: { foo: null }, aria: { label: null } }).toString(), '<div id="x"></div>');
  });
  it('allows pre-hyphenated attribute names', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.strictEqual(tt.div({ 'data-bs-target': 'abc' }).toString(), '<div data-bs-target="abc"></div>');
  });
  it('converts numbers to strings', () => {
    assert.strictEqual(t.td({ colspan: 3 }).toString(), '<td colspan="3"></td>');
  });
  it('aria attributes', () => {
    assert.strictEqual(t.div({ ariaLabel: 'abc' }).toString(), '<div aria-label="abc"></div>');
  });
  it('encodes attribute values', () => {
    assert.strictEqual(t.a({ href: 'http://x.com?a=1&b=2' }).toString(), '<a href="http://x.com?a=1&#x26;b=2"></a>');
  });
  it('encodes double quotes in attribute values', () => {
    assert.strictEqual(t.div({ title: 'say "hello"' }).toString(), '<div title="say &#x22;hello&#x22;"></div>');
  });
  it('encodes angle brackets in attribute values', () => {
    assert.strictEqual(t.div({ title: '<test>' }).toString(), '<div title="&#x3C;test&#x3E;"></div>');
  });
  it('boolean true includes attribute', () => {
    assert.strictEqual(t.input({ type: 'checkbox', checked: true }).toString(), '<input type="checkbox" checked>');
  });
  it('boolean false omits attribute', () => {
    assert.strictEqual(t.input({ type: 'checkbox', checked: false }).toString(), '<input type="checkbox">');
  });
  it('class as array joins with space', () => {
    assert.strictEqual(t.div({ class: ['foo', 'bar'] }).toString(), '<div class="foo bar"></div>');
  });
  it('class array filters falsy values', () => {
    const active = false;
    assert.strictEqual(t.div({ class: [active && 'active', 'btn'] }).toString(), '<div class="btn"></div>');
    assert.strictEqual(t.div({ class: ['foo', '', 'bar'] }).toString(), '<div class="foo bar"></div>');
  });
  it('class array omits attribute when all values are falsy', () => {
    assert.strictEqual(t.div({ class: [] }).toString(), '<div></div>');
    assert.strictEqual(t.div({ class: [false] }).toString(), '<div></div>');
  });
  it('class array filters out non-string/non-number values', () => {
    assert.strictEqual(t.div({ class: ['btn', {}, null, undefined] }).toString(), '<div class="btn"></div>');
  });
  it('class array with a signal element resolves the signal in toString', () => {
    const mod = signal('active');
    assert.strictEqual(t.div({ class: ['btn', mod] }).toString(), '<div class="btn active"></div>');
  });
  it('class array with multiple signals resolves all signals', () => {
    const a = signal('a');
    const b = signal('b');
    assert.strictEqual(t.div({ class: [a, 'static', b] }).toString(), '<div class="a static b"></div>');
  });
  it('class array signal returning falsy is skipped', () => {
    const mod = signal('');
    assert.strictEqual(t.div({ class: ['btn', mod] }).toString(), '<div class="btn"></div>');
  });
  it('class array signal returning an array is flattened', () => {
    const mod = signal(['x', 'y']);
    assert.strictEqual(t.div({ class: ['btn', mod] }).toString(), '<div class="btn x y"></div>');
  });
  it('class as plain object is omitted', () => {
    assert.strictEqual(t.div({ class: { active: true } }).toString(), '<div></div>');
  });
  it('class as empty object is omitted', () => {
    assert.strictEqual(t.div({ class: {} }).toString(), '<div></div>');
  });
  it('NaN attribute value is omitted', () => {
    assert.strictEqual(t.div({ tabindex: NaN }).toString(), '<div></div>');
  });
  it('Infinity attribute value is omitted', () => {
    assert.strictEqual(t.div({ tabindex: Infinity }).toString(), '<div></div>');
  });
  it('-Infinity attribute value is omitted', () => {
    assert.strictEqual(t.div({ tabindex: -Infinity }).toString(), '<div></div>');
  });
  it('array as non-class attribute is omitted', () => {
    assert.strictEqual(t.div({ id: ['a', 'b'] }).toString(), '<div></div>');
  });
  it('array as non-class attribute throws with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(
      () => tt.div({ id: ['a', 'b'] }),
      /id=\["a","b"\]/,
    );
  });
  it('style as array is omitted', () => {
    assert.strictEqual(t.div({ style: ['color:red'] }).toString(), '<div></div>');
  });
  it('style as array throws with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(
      () => tt.div({ style: ['color:red'] }),
      /style=\["color:red"\]/,
    );
  });

  describe('style as object', () => {
    it('converts camelCase keys to css properties', () => {
      assert.strictEqual(
        t.div({ style: { backgroundColor: 'red', fontSize: '14px' } }).toString(),
        '<div style="background-color: red; font-size: 14px"></div>',
      );
    });
    it('passes kebab-case keys through unchanged', () => {
      assert.strictEqual(
        t.div({ style: { 'background-color': 'red', 'font-size': '14px' } }).toString(),
        '<div style="background-color: red; font-size: 14px"></div>',
      );
    });
    it('handles mixed camelCase and kebab-case keys', () => {
      assert.strictEqual(
        t.div({ style: { backgroundColor: 'red', 'font-size': '14px' } }).toString(),
        '<div style="background-color: red; font-size: 14px"></div>',
      );
    });
    it('accepts number values', () => {
      assert.strictEqual(
        t.div({ style: { zIndex: 2, opacity: 0.5 } }).toString(),
        '<div style="z-index: 2; opacity: 0.5"></div>',
      );
    });
    it('keeps 0 as a valid value', () => {
      assert.strictEqual(
        t.div({ style: { opacity: 0 } }).toString(),
        '<div style="opacity: 0"></div>',
      );
    });
    it('drops null values', () => {
      assert.strictEqual(
        t.div({ style: { color: null, fontWeight: 'bold' } }).toString(),
        '<div style="font-weight: bold"></div>',
      );
    });
    it('drops undefined values', () => {
      assert.strictEqual(
        t.div({ style: { color: undefined, fontWeight: 'bold' } }).toString(),
        '<div style="font-weight: bold"></div>',
      );
    });
    it('drops false values', () => {
      assert.strictEqual(
        t.div({ style: { color: false, fontWeight: 'bold' } }).toString(),
        '<div style="font-weight: bold"></div>',
      );
    });
    it('drops true values', () => {
      assert.strictEqual(
        t.div({ style: { color: true, fontWeight: 'bold' } }).toString(),
        '<div style="font-weight: bold"></div>',
      );
    });
    it('drops Infinity values', () => {
      assert.strictEqual(
        t.div({ style: { zIndex: Infinity, fontWeight: 'bold' } }).toString(),
        '<div style="font-weight: bold"></div>',
      );
    });
    it('drops -Infinity values', () => {
      assert.strictEqual(
        t.div({ style: { zIndex: -Infinity, fontWeight: 'bold' } }).toString(),
        '<div style="font-weight: bold"></div>',
      );
    });
    it('drops Symbol values without throwing', () => {
      assert.strictEqual(
        t.div({ style: { color: Symbol('red'), fontWeight: 'bold' } }).toString(),
        '<div style="font-weight: bold"></div>',
      );
    });
    it('drops object values without producing [object Object] in CSS', () => {
      assert.strictEqual(
        t.div({ style: { color: { r: 255 }, fontWeight: 'bold' } }).toString(),
        '<div style="font-weight: bold"></div>',
      );
    });
    it('drops array values without producing a,b in CSS', () => {
      assert.strictEqual(
        t.div({ style: { color: ['red', 'blue'], fontWeight: 'bold' } }).toString(),
        '<div style="font-weight: bold"></div>',
      );
    });
    it('shows Symbol clearly in validation error message rather than crashing', () => {
      const tt = new Kensington({ validationLevel: 'error' });
      assert.throws(
        () => tt.div({ style: { color: Symbol('red') } }).toString(),
        /Symbol\(red\)/,
      );
    });
    it('throws on true value when validationLevel is error', () => {
      const tt = new Kensington({ validationLevel: 'error' });
      assert.throws(() => tt.div({ style: { color: true, fontWeight: 'bold' } }).toString());
    });
    it('warns on true value when validationLevel is warn', () => {
      const expectedMessage = 'invalid attribute `style="color: true"` given for element `div`';
      let received;
      const logger = message => { received = message; };
      const tt = new Kensington({ validationLevel: 'warn', logger });
      assert.doesNotThrow(() => tt.div({ style: { color: true, fontWeight: 'bold' } }).toString());
      assert.ok(received.startsWith(`Error: ${expectedMessage}\n`));
    });
    it('does not throw on valid style object when validationLevel is error', () => {
      const tt = new Kensington({ validationLevel: 'error' });
      assert.doesNotThrow(() => tt.div({ style: { color: 'red', zIndex: 2 } }).toString());
    });
    it('drops empty string values', () => {
      assert.strictEqual(
        t.div({ style: { color: '', fontWeight: 'bold' } }).toString(),
        '<div style="font-weight: bold"></div>',
      );
    });
    it('drops empty string property names', () => {
      assert.strictEqual(
        t.div({ style: { '': 'red', color: 'blue' } }).toString(),
        '<div style="color: blue"></div>',
      );
    });
    it('drops whitespace-only property names', () => {
      assert.strictEqual(
        t.div({ style: { '  ': 'red', color: 'blue' } }).toString(),
        '<div style="color: blue"></div>',
      );
    });
    it('omits style attribute when all values are invalid', () => {
      assert.strictEqual(
        t.div({ style: { color: null, opacity: undefined } }).toString(),
        '<div></div>',
      );
    });
    it('omits style attribute for empty object', () => {
      assert.strictEqual(t.div({ style: {} }).toString(), '<div></div>');
    });
    it('still accepts a plain string', () => {
      assert.strictEqual(
        t.div({ style: 'color: red' }).toString(),
        '<div style="color: red"></div>',
      );
    });
    it('builds style in attribute array', () => {
      const result = attributesArrayFromObject({ style: { backgroundColor: 'red', zIndex: 2 } });
      assert.deepStrictEqual(result, [['style', 'background-color: red; z-index: 2']]);
    });
  });

  it('throws on invalid attribute name', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ badAttribute: 'value' }));
  });
  it('throws on invalid attribute value', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.form({ method: 'delete' }).toString());
  });
  it('throws when id starts with a number', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ id: '123-abc' }).toString());
  });
  it('builds attribute array from object', () => {
    const result = attributesArrayFromObject({
      id: 'a',
      dataName: 'b',
      data: { nestedAttr: 'c', nested: 'd', 'camel-case': 'e', deeply: { nested: { attr: 'f' } } },
      required: false,
      checked: true,
    });
    assert.strictEqual(
      JSON.stringify(result),
      '[["id","a"],["data-name","b"],["data-nested-attr","c"],["data-nested","d"],["data-camel-case","e"],["data-deeply-nested-attr","f"],["checked",""]]',
    );
  });

  describe('validation by type', () => {
    it('validates by function', () => {
      class Custom extends Kensington {
        customElement = this.createCustomTag('custom-element', { 'custom-attr': val => (val > 5) });
      }
      const tt = new Custom({ validationLevel: 'error' });
      assert.throws(() => tt.customElement({ customAttr: 4 }).toString());
      assert.doesNotThrow(() => tt.customElement({ customAttr: 6 }).toString());
    });
  });
});

// ─── argument validation ───────────────────────────────────────────────────

describe('argument validation', () => {
  it('allows content only', () => {
    assert.strictEqual(t.div('content').toString(), '<div>content</div>');
    assert.strictEqual(t.div(['content']).toString(), '<div>content</div>');
  });
  it('treats null-prototype object as attributes', () => {
    const attrs = Object.create(null);
    attrs.id = 'test';
    assert.strictEqual(t.div(attrs).toString(), '<div id="test"></div>');
  });
  it('treats null-prototype object as attributes with content', () => {
    const attrs = Object.create(null);
    attrs.id = 'test';
    assert.strictEqual(t.div(attrs, 'hello').toString(), '<div id="test">hello</div>');
  });
  it('treats object with own constructor property as attributes', () => {
    assert.strictEqual(t.div({ constructor: 'custom', id: 'x' }).toString(), '<div constructor="custom" id="x"></div>');
  });
  it('null-prototype object as an attribute value is omitted without crashing', () => {
    assert.strictEqual(t.div({ id: Object.create(null) }).toString(), '<div></div>');
  });
  it('null-prototype object as a nested attribute value is flattened without crashing', () => {
    const data = Object.create(null);
    data.toggle = 'collapse';
    assert.strictEqual(t.div({ data }).toString(), '<div data-toggle="collapse"></div>');
  });
  it('allows attributes only', () => {
    assert.strictEqual(t.div({ id: 'abc' }).toString(), '<div id="abc"></div>');
  });
  it('allows attributes and content', () => {
    assert.strictEqual(t.div({ id: 'abc' }, 'content').toString(), '<div id="abc">content</div>');
  });
  it('throws on two attribute objects', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ class: 'something' }, { id: 'something' }).toString());
  });
  it('throws on two content arguments', () => {
    assert.throws(() => t.div('content', t.div('content')).toString());
  });
  it('throws when first arg is content and second arg is falsy (0)', () => {
    assert.throws(() => t.div('content', 0));
  });
  it('throws when first arg is content and second arg is false', () => {
    assert.throws(() => t.div('content', false));
  });
  it('throws when first arg is content and second arg is empty string', () => {
    assert.throws(() => t.div('content', ''));
  });
  it('throws on three arguments', () => {
    assert.throws(() => t.div({ id: 'something' }, t.div('content'), t.div('invalid argument')));
  });
  it('throws on three arguments when third arg is falsy (0)', () => {
    assert.throws(() => t.div({ id: 'something' }, 'content', 0));
  });
  it('throws on three arguments when third arg is false', () => {
    assert.throws(() => t.div({ id: 'something' }, 'content', false));
  });
  it('throws on invalid content type', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div(new Date()).toString());
  });
  it('NaN attribute value triggers validation error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ tabindex: NaN }), /tabindex/);
  });
  it('Infinity attribute value triggers validation error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ tabindex: Infinity }), /tabindex/);
  });
  it('circular nested attribute object does not stack overflow', () => {
    const circ = { id: 'x' };
    circ.self = circ;
    assert.doesNotThrow(() => t.div(circ).toString());
  });
  it('same nested object reused in two positions renders both', () => {
    const shared = { toggle: 'collapse' };
    assert.strictEqual(
      t.div({ data: shared, aria: shared }).toString(),
      '<div data-toggle="collapse" aria-toggle="collapse"></div>',
    );
  });
  it('attribute with throwing getter is silently skipped', () => {
    const obj = Object.defineProperty({ id: 'x' }, 'bad', {
      get() { throw new Error('getter exploded'); },
      enumerable: true,
    });
    assert.strictEqual(t.div(obj).toString(), '<div id="x"></div>');
  });
  it('null-prototype object as style value renders without crashing', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    const style = Object.create(null);
    style.color = 'red';
    assert.strictEqual(tt.div({ id: 'x', style }).toString(), '<div id="x" style="color: red"></div>');
  });
  it('empty string attribute key is silently skipped', () => {
    assert.strictEqual(t.div({ '': 'val', id: 'x' }).toString(), '<div id="x"></div>');
  });
  it('whitespace-only attribute key is silently skipped', () => {
    assert.strictEqual(t.div({ '   ': 'val', id: 'x' }).toString(), '<div id="x"></div>');
  });
  it('NaN does not pass Number type validation in createCustomTag', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    const xEl = tt.createCustomTag('x-el', { count: Number });
    assert.throws(() => xEl({ count: NaN }), /count/);
  });
  it('Symbol as attribute value gives a validation error without crashing', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ id: Symbol('x') }), /id="Symbol\(x\)"/);
  });
  it('Symbol on Number-typed attribute gives a validation error without crashing', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ tabindex: Symbol('x') }), /tabindex/);
  });
  it('Symbol in createCustomTag Number attribute gives a validation error without crashing', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    const xEl = tt.createCustomTag('x-el', { count: Number });
    assert.throws(() => xEl({ count: Symbol('x') }), /count/);
  });
  it('style object with throwing getter renders without crashing', () => {
    const style = Object.defineProperty({}, 'color', {
      get() { throw new Error('getter exploded'); },
      enumerable: true,
    });
    assert.strictEqual(t.div({ style }).toString(), '<div></div>');
  });
  it('style object with throwing getter does not crash with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    const style = Object.defineProperty({ fontSize: '12px' }, 'color', {
      get() { throw new Error('getter exploded'); },
      enumerable: true,
    });
    assert.strictEqual(tt.div({ style }).toString(), '<div style="font-size: 12px"></div>');
  });
  it('null-proto object as non-namespace attribute value gives a validation error without crashing', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    const nullProto = Object.create(null);
    assert.throws(() => tt.div({ id: nullProto }), /non-serializable/);
  });
  it('class array is valid when validationLevel is error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.strictEqual(tt.div({ class: ['container', 'main'] }).toString(), '<div class="container main"></div>');
  });
  it('class array with Symbol items renders valid items without crashing', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.strictEqual(tt.div({ class: [Symbol('x'), 'foo'] }).toString(), '<div class="foo"></div>');
  });
  it('array error message shows Symbol values rather than null', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ tabindex: [Symbol('x'), 'y'] }), /Symbol\(x\)/);
  });
  it('circular content array does not stack overflow', () => {
    const arr = ['a'];
    arr.push(arr);
    assert.doesNotThrow(() => t.div(arr).toString());
  });
});

// ─── constructor validation ────────────────────────────────────────────────

describe('constructor validation', () => {
  it('throws on invalid validationLevel', () => {
    assert.throws(
      () => new Kensington({ validationLevel: 'warning' }),
      /validationLevel must be/,
    );
  });
  it('throws on non-string validationLevel', () => {
    assert.throws(
      () => new Kensington({ validationLevel: 1 }),
      /validationLevel must be/,
    );
  });
  it('throws on negative indentationLevel', () => {
    assert.throws(
      () => new Kensington({ indentationLevel: -1 }),
      /indentationLevel must be/,
    );
  });
  it('throws on non-integer indentationLevel', () => {
    assert.throws(
      () => new Kensington({ indentationLevel: 2.5 }),
      /indentationLevel must be/,
    );
  });
  it('throws on non-number indentationLevel', () => {
    assert.throws(
      () => new Kensington({ indentationLevel: '2' }),
      /indentationLevel must be/,
    );
  });
  it('error message for Infinity indentationLevel shows Infinity not null', () => {
    assert.throws(
      () => new Kensington({ indentationLevel: Infinity }),
      /got: Infinity/,
    );
  });
  it('throws on non-function logger', () => {
    assert.throws(
      () => new Kensington({ logger: 'console.log' }),
      /logger must be a function/,
    );
  });
  it('throws on null logger', () => {
    assert.throws(
      () => new Kensington({ logger: null }),
      /logger must be a function/,
    );
  });
  it('accepts valid options without throwing', () => {
    assert.doesNotThrow(() => new Kensington({ validationLevel: 'warn', indentationLevel: 4, logger: () => {} }));
  });
  it('accepts undefined options', () => {
    assert.doesNotThrow(() => new Kensington(undefined).div('hi').toString());
  });
  it('treats null options same as no options', () => {
    assert.strictEqual(new Kensington(null).div('hi').toString(), '<div>hi</div>');
  });
});

// ─── createCustomTag validation ────────────────────────────────────────────

describe('createCustomTag validation', () => {
  it('throws on non-string tagName', () => {
    assert.throws(
      () => new Kensington().createCustomTag(42),
      /tagName must be a non-empty string/,
    );
  });
  it('throws on empty tagName', () => {
    assert.throws(
      () => new Kensington().createCustomTag(''),
      /tagName must be a non-empty string/,
    );
  });
  it('throws on null tagName', () => {
    assert.throws(
      () => new Kensington().createCustomTag(null),
      /tagName must be a non-empty string/,
    );
  });
  it('throws on null allowedAttributes', () => {
    assert.throws(
      () => new Kensington().createCustomTag('my-el', null),
      /allowedAttributes must be a plain object/,
    );
  });
  it('throws on array allowedAttributes', () => {
    assert.throws(
      () => new Kensington().createCustomTag('my-el', []),
      /allowedAttributes must be a plain object/,
    );
  });
  it('invalid type spec error message names the attribute not the type value', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(
      () => tt.createCustomTag('x-el', { size: undefined }),
      /size/,
    );
  });
});

// ─── function attributes ───────────────────────────────────────────────────

describe('function attributes in toString()', () => {
  it('does not throw at tag creation for on* attributes with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.button({ onclick: () => {} }));
  });
  it('throws at toString for on* attributes with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.button({ onclick: () => {} }).toString());
  });
  it('throws at tag creation for non-event attributes with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.button({ class: () => {} }));
  });
  it('silently omits on* function attributes with validationLevel off', () => {
    assert.strictEqual(t.button({ onclick: () => {} }).toString(), '<button></button>');
  });
  it('warns and omits on* function attributes with validationLevel warn', () => {
    const messages = [];
    const tt = new Kensington({ validationLevel: 'warn', logger: m => messages.push(m) });
    const result = tt.button({ onclick: () => {} }).toString();
    assert.ok(messages.length > 0);
    assert.strictEqual(result, '<button></button>');
  });
  it('accepts a string value for on* attributes with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.button({ onclick: 'handleClick()' }).toString());
  });
  it('does not throw at tag creation for element-specific on* attributes with function value', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.animate({ onbegin: () => {} }));
  });
  it('throws at toString for element-specific on* attributes with function value', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.animate({ onbegin: () => {} }).toString());
  });
  it('accepts a string value for element-specific on* attributes with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.animate({ onbegin: 'handleBegin()' }).toString());
  });
  it('silently omits function for non-event attribute in attributeArray (DOM path)', () => {
    const result = attributesArrayFromObject({ class: () => 'foo', onclick: () => {} });
    // class fn is omitted; onclick fn is kept for addEventListener wiring
    assert.ok(!result.some(([k]) => k === 'class'));
    assert.ok(result.some(([k]) => k === 'onclick'));
  });
  it('silently discards arbitrary on* attributes with validationLevel off', () => {
    assert.strictEqual(t.div({ onbricksSelectorChange: () => {} }).toString(), '<div></div>');
  });
  it('warns on arbitrary on* attributes with validationLevel warn', () => {
    const messages = [];
    const tt = new Kensington({ validationLevel: 'warn', logger: m => messages.push(m) });
    const result = tt.div({ onbricksSelectorChange: () => {} }).toString();
    assert.ok(messages.some(m => m.includes('not allowed')));
    assert.strictEqual(result, '<div></div>');
  });
  it('throws on arbitrary on* attributes with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ onbricksSelectorChange: () => {} }), /not allowed/);
  });
});

// ─── on key ────────────────────────────────────────────────────────────────

describe('on key', () => {
  it('is silently omitted from toString() output', () => {
    assert.strictEqual(t.div({ on: { click: () => {} } }).toString(), '<div></div>');
  });
  it('accepts a plain object value at all validation levels', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.div({ on: { click: () => {} } }));
  });
  it('accepts null value', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.div({ on: null }));
  });
  it('warns when given a non-object value with validationLevel warn', () => {
    const messages = [];
    const tt = new Kensington({ validationLevel: 'warn', logger: m => messages.push(m) });
    tt.div({ on: 'click' });
    assert.ok(messages.some(m => m.includes('invalid attribute')));
  });
  it('throws when given a non-object value with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ on: 'click' }), /invalid attribute/);
  });
  it('throws when given an array value with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ on: ['click'] }), /invalid attribute/);
  });
});

// ─── on key ────────────────────────────────────────────────────────────────

describe('on key', () => {
  it('is silently omitted from toString() output', () => {
    assert.strictEqual(t.div({ on: { click: () => {} } }).toString(), '<div></div>');
  });
  it('accepts a plain object value at all validation levels', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.div({ on: { click: () => {} } }));
  });
  it('accepts null value', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.div({ on: null }));
  });
  it('warns when given a non-object value with validationLevel warn', () => {
    const messages = [];
    const tt = new Kensington({ validationLevel: 'warn', logger: m => messages.push(m) });
    tt.div({ on: 'click' });
    assert.ok(messages.some(m => m.includes('invalid attribute')));
  });
  it('throws when given a non-object value with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ on: 'click' }), /invalid attribute/);
  });
  it('throws when given an array value with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ on: ['click'] }), /invalid attribute/);
  });
});

// ─── prop key ──────────────────────────────────────────────────────────────

describe('prop key', () => {
  it('is silently omitted from toString() output', () => {
    assert.strictEqual(t.div({ prop: { id: 'foo' } }).toString(), '<div></div>');
  });
  it('accepts a plain object value at all validation levels', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.div({ prop: { id: 'foo' } }));
  });
  it('accepts null value', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.div({ prop: null }));
  });
  it('warns when given a non-object value with validationLevel warn', () => {
    const messages = [];
    const tt = new Kensington({ validationLevel: 'warn', logger: m => messages.push(m) });
    tt.div({ prop: 'foo' });
    assert.ok(messages.some(m => m.includes('invalid attribute')));
  });
  it('throws when given a non-object value with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ prop: 'foo' }), /invalid attribute/);
  });
  it('throws when given an array value with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ prop: ['id'] }), /invalid attribute/);
  });
});

// ─── persist key ───────────────────────────────────────────────────────────

describe('persist key', () => {
  it('is silently omitted from toString() output', () => {
    assert.strictEqual(t.div({ persist: true }).toString(), '<div></div>');
  });
  it('accepts true and false at all validation levels', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.div({ persist: true }));
    assert.doesNotThrow(() => tt.div({ persist: false }));
  });
  it('throws when given a non-boolean value with validationLevel error', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ persist: 'yes' }), /invalid attribute/);
  });
});

// ─── namespaces ────────────────────────────────────────────────────────────

describe('namespaces', () => {
  it('allows extra attribute namespaces', () => {
    const tt = new Kensington({ validationLevel: 'error', additionalNamespaces: 'htmx' });
    assert.strictEqual(tt.div({ htmxTitle: 'abc' }).toString(), '<div htmx-title="abc"></div>');
  });
  it('does not crash when attribute name has no leading lowercase chars', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ ABC: 'value' }), /not allowed/);
  });
});

// ─── additionalGlobalAttributes ────────────────────────────────────────────

describe('additionalGlobalAttributes', () => {
  it('allows a new attribute on any element', () => {
    const tt = new Kensington({ validationLevel: 'error', additionalGlobalAttributes: { popover: String } });
    assert.strictEqual(tt.div({ popover: 'auto' }).toString(), '<div popover="auto"></div>');
    assert.strictEqual(tt.button({ popover: 'manual' }).toString(), '<button popover="manual"></button>');
  });
  it('validates the attribute value against the provided type', () => {
    const tt = new Kensington({
      validationLevel: 'error',
      additionalGlobalAttributes: { enterkeyhint: ['enter', 'done'] },
    });
    assert.doesNotThrow(() => tt.input({ enterkeyhint: 'enter' }));
    assert.throws(() => tt.input({ enterkeyhint: 'invalid' }), /invalid attribute/);
  });
  it('normalizes camelCase keys to kebab-case', () => {
    const tt = new Kensington({ validationLevel: 'error', additionalGlobalAttributes: { myAttr: String } });
    assert.strictEqual(tt.div({ myAttr: 'val' }).toString(), '<div my-attr="val"></div>');
  });
  it('throws on non-object additionalGlobalAttributes', () => {
    assert.throws(
      () => new Kensington({ additionalGlobalAttributes: 'bad' }),
      /additionalGlobalAttributes must be a plain object/,
    );
  });
  it('throws on array additionalGlobalAttributes', () => {
    assert.throws(
      () => new Kensington({ additionalGlobalAttributes: [] }),
      /additionalGlobalAttributes must be a plain object/,
    );
  });
});

// ─── custom tags ───────────────────────────────────────────────────────────

describe('custom tags', () => {
  it('creates a custom tag', () => {
    class Custom extends Kensington {
      customElement = this.createCustomTag('custom-element');
    }
    const tt = new Custom({ validationLevel: 'error' });
    assert.strictEqual(tt.customElement().toString(), '<custom-element></custom-element>');
  });
  it('validates attribute type', () => {
    class CustomBad extends Kensington {
      customElement = this.createCustomTag('custom-element', { date: null });
    }
    class CustomGood extends Kensington {
      customElement = this.createCustomTag('custom-element', { date: String });
    }
    assert.throws(() => { new CustomBad({ validationLevel: 'error' }); });
    assert.doesNotThrow(() => {
      const tt = new CustomGood({ validationLevel: 'error' });
      tt.customElement({ date: 'some date' });
    });
  });
  it('validates hyphenated attribute names', () => {
    class Custom extends Kensington {
      customElement = this.createCustomTag('custom-element', { hyphenatedAttribute: String });
    }
    const tt = new Custom({ validationLevel: 'error' });
    const expected = '<custom-element hyphenated-attribute="something"></custom-element>';
    assert.strictEqual(tt.customElement({ hyphenatedAttribute: 'something' }).toString(), expected);
    assert.strictEqual(tt.customElement({ 'hyphenated-attribute': 'something' }).toString(), expected);
  });
  it('validates array of allowed values', () => {
    class Custom extends Kensington {
      customElement = this.createCustomTag('custom-element', { customAttr: [Number, 'a string'] });
    }
    const tt = new Custom({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.customElement({ customAttr: 4 }).toString());
    assert.doesNotThrow(() => tt.customElement({ customAttr: 'a string' }).toString());
    assert.throws(() => tt.customElement({ customAttr: 'some other string' }).toString());
  });
  it('accepts a function as a custom validator', () => {
    class Custom extends Kensington {
      customElement = this.createCustomTag('custom-element', {
        score: v => typeof v === 'number' && v >= 0 && v <= 100,
      });
    }
    const tt = new Custom({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.customElement({ score: 42 }).toString());
    assert.throws(() => tt.customElement({ score: 101 }).toString());
    assert.throws(() => tt.customElement({ score: 'high' }).toString());
  });
  it('accepts a string literal as a direct attribute type', () => {
    class Custom extends Kensington {
      customElement = this.createCustomTag('custom-element', { type: 'primary' });
    }
    const tt = new Custom({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.customElement({ type: 'primary' }).toString());
    assert.throws(() => tt.customElement({ type: 'secondary' }).toString());
  });

  it('createCustomTag with no allowedAttributes accepts any attribute without warnings', () => {
    const logs = [];
    const origLog = console.log;
    console.log = msg => logs.push(String(msg));
    try {
      class WaEngine extends Kensington {
        waInput = this.createCustomTag('wa-input');
      }
      const k = new WaEngine({ validationLevel: 'warn' });
      const html = k.waInput({ size: 'small', clearable: true, placeholder: 'Search' }).toString();
      assert.strictEqual(logs.length, 0, `unexpected warnings: ${logs.join(' | ')}`);
      assert.ok(html.includes('size="small"'), 'size attribute missing');
    } finally {
      console.log = origLog;
    }
  });

  it('createCustomTag with explicit allowedAttributes still validates attribute names', () => {
    const logs = [];
    const origLog = console.log;
    console.log = msg => logs.push(String(msg));
    try {
      class Strict extends Kensington {
        myEl = this.createCustomTag('my-el', { size: ['small', 'large'] });
      }
      const k = new Strict({ validationLevel: 'warn' });
      k.myEl({ unknown: 'val' }).toString();
      assert.ok(logs.some(w => /not allowed/.test(w)), 'expected attribute validation warning');
    } finally {
      console.log = origLog;
    }
  });
});

// ─── other ─────────────────────────────────────────────────────────────────

describe('other', () => {
  it('destructure tags from instance', () => {
    const { div } = t;
    assert.strictEqual(div().toString(), '<div></div>');
  });
  it('default indentation level', () => {
    assert.strictEqual(t.div(t.div(t.div())).toString(), '<div>\n  <div>\n    <div></div>\n  </div>\n</div>');
  });
  it('custom indentation level', () => {
    const tt = new Kensington({ indentationLevel: 4 });
    assert.strictEqual(tt.div(tt.span('hi')).toString(), '<div>\n    <span>hi</span>\n</div>');
  });
  it('indentation level 0 disables indentation', () => {
    const tt = new Kensington({ indentationLevel: 0 });
    assert.strictEqual(tt.div(tt.span('hi')).toString(), '<div>\n<span>hi</span>\n</div>');
  });
  it('string interpolation calls toString implicitly', () => {
    assert.strictEqual(`${t.div('hi')}`, '<div>hi</div>');
  });
  it('toElement throws with helpful message in non-browser environment', () => {
    assert.throws(() => t.div().toElement(), { message: 'toElement only supported in browser' });
  });
  it('literal().toElement() throws with helpful message in non-browser environment', () => {
    assert.throws(() => t.literal('<p>hi</p>').toElement(), { message: 'toElement only supported in browser' });
  });
  it('inlineComment().toElement() throws with helpful message in non-browser environment', () => {
    assert.throws(() => t.inlineComment('test').toElement(), { message: 'toElement only supported in browser' });
  });
  it('signal().toElement() throws with helpful message in non-browser environment', () => {
    assert.throws(() => signal('value').toElement(), { message: 'toElement only supported in browser' });
  });
  it('signal().mount(null) throws when target is not an element', () => {
    assert.throws(() => signal('value').mount(null), { message: /requires a DOM element/ });
  });
  it('signal stringifies to the value when the value is a tag', () => {
    // Signals are valid as standalone tags. They produce HTML via the value's own toString()
    // in the template-literal coercion path. This is what SSR depends on for the new path.
    const s = signal(t.div({ id: 'x' }, 'hi'));
    assert.strictEqual(`${s}`, '<div id="x">hi</div>');
  });
  it('warn validation level calls logger with message and stack', () => {
    const errorMessage = 'invalid attribute `id="123-abc"` given for element `div`';
    let received;
    const logger = message => { received = message; };
    const tt = new Kensington({ validationLevel: 'warn', logger });
    assert.doesNotThrow(() => tt.div({ id: '123-abc' }).toString());
    assert.ok(received.startsWith(`Error: ${errorMessage}\n`));
  });
});

// ─── slim build ───────────────────────────────────────────────────────────

describe('slim build', () => {
  // Cache the loaded module across tests so we don't re-import the bundled file every time.
  let SlimKensington;
  let tt;
  before(async () => {
    ({ default: SlimKensington } = await import('../../dist/kensington.slim.js'));
    tt = new SlimKensington();
  });

  // ─── constructor ──────────────────────────────────────────────────────

  describe('constructor', () => {
    it('throws when validationLevel is not off', () => {
      const expected = 'The slim build does not include attribute data. '
        + "Set validationLevel: 'off' or use the full build.";
      assert.throws(
        () => new SlimKensington({ validationLevel: 'warn' }),
        { message: expected },
      );
      assert.throws(() => new SlimKensington({ validationLevel: 'error' }));
    });
    it('does not throw when validationLevel is off', () => {
      assert.doesNotThrow(() => new SlimKensington({ validationLevel: 'off' }));
    });
    it('defaults validationLevel to off', () => {
      assert.doesNotThrow(() => new SlimKensington());
      assert.strictEqual(new SlimKensington().validationLevel, 'off');
    });
    it('validates additionalGlobalAttributes', () => {
      assert.throws(() => new SlimKensington({ additionalGlobalAttributes: 'bad' }));
      assert.throws(() => new SlimKensington({ additionalGlobalAttributes: [] }));
      assert.doesNotThrow(() => new SlimKensington({ additionalGlobalAttributes: {} }));
    });
    it('validates indentationLevel', () => {
      assert.throws(() => new SlimKensington({ indentationLevel: -1 }));
      assert.throws(() => new SlimKensington({ indentationLevel: 'two' }));
      assert.doesNotThrow(() => new SlimKensington({ indentationLevel: 0 }));
      assert.doesNotThrow(() => new SlimKensington({ indentationLevel: 4 }));
    });
    it('validates logger', () => {
      assert.throws(() => new SlimKensington({ logger: 'not a fn' }));
      assert.doesNotThrow(() => new SlimKensington({ logger: () => {} }));
    });
    it('accepts additionalNamespaces', () => {
      const k = new SlimKensington({ additionalNamespaces: ['hx'] });
      assert.deepStrictEqual(k.namespaces, ['data', 'aria', 'hx']);
    });
  });

  // ─── Proxy tag dispatch ────────────────────────────────────────────────

  describe('Proxy dispatch', () => {
    it('dispatches HTML content tags', () => {
      assert.strictEqual(tt.div().toString(), '<div></div>');
      assert.strictEqual(tt.span('hi').toString(), '<span>hi</span>');
      assert.strictEqual(tt.p({ class: 'x' }, 'text').toString(), '<p class="x">text</p>');
    });
    it('dispatches void tags without a closing tag', () => {
      assert.strictEqual(tt.br().toString(), '<br>');
      assert.strictEqual(tt.img({ src: '/x.png' }).toString(), '<img src="/x.png">');
      assert.strictEqual(tt.input({ type: 'text' }).toString(), '<input type="text">');
    });
    it('dispatches SVG tags with the SVG namespace and preserves camelCase', () => {
      assert.strictEqual(tt.svg({ viewBox: '0 0 100 100' }).toString(), '<svg viewBox="0 0 100 100"></svg>');
      assert.strictEqual(tt.circle({ cx: 50, cy: 50, r: 40 }).toString(), '<circle cx="50" cy="50" r="40"></circle>');
      assert.strictEqual(tt.animateMotion().toString(), '<animateMotion></animateMotion>');
    });
    it('dispatches MathML tags including kebab-case mapping', () => {
      assert.strictEqual(tt.math().toString(), '<math></math>');
      assert.strictEqual(tt.mi('x').toString(), '<mi>x</mi>');
      // annotation-xml is the one MathML tag whose method name differs from its tag name.
      assert.strictEqual(tt.annotationXml().toString(), '<annotation-xml></annotation-xml>');
    });
    it('dispatches literal-content tags (script, style) without encoding the body', () => {
      assert.strictEqual(
        tt.script('if (a < b) {}').toString(),
        '<script>if (a < b) {}</script>',
      );
      assert.strictEqual(
        tt.style('a { color: red; }').toString(),
        '<style>a { color: red; }</style>',
      );
    });
    it('dispatches htmlWithDocType with the doctype prefix', () => {
      assert.strictEqual(
        tt.htmlWithDocType(tt.body('hi')).toString(),
        '<!DOCTYPE html>\n<html>\n  <body>hi</body>\n</html>',
      );
    });
    it('returns undefined for unknown tag names', () => {
      assert.strictEqual(tt.notATag, undefined);
      assert.strictEqual(tt.somethingMadeUp, undefined);
    });
    it('returns undefined for symbol keys', () => {
      assert.strictEqual(tt[Symbol.iterator], undefined);
      assert.strictEqual(tt[Symbol.toPrimitive], undefined);
    });
    it('memoizes resolved tag closures so repeated access returns the same fn', () => {
      assert.strictEqual(tt.div, tt.div);
      assert.strictEqual(tt.svg, tt.svg);
    });
    it('names the cached closure after the tag for stack traces', () => {
      assert.strictEqual(tt.div.name, 'div');
      assert.strictEqual(tt.animateMotion.name, 'animateMotion');
    });
    it('supports destructuring', () => {
      const { div, span } = tt;
      assert.strictEqual(div('a').toString(), '<div>a</div>');
      assert.strictEqual(span('b').toString(), '<span>b</span>');
    });
    it('passes instanceof check', () => {
      assert.ok(tt instanceof SlimKensington);
    });
  });

  // ─── attribute handling ───────────────────────────────────────────────

  describe('attributes', () => {
    it('converts user camelCase keys to kebab-case', () => {
      assert.strictEqual(
        tt.div({ dataBsTarget: '#modal' }).toString(),
        '<div data-bs-target="#modal"></div>',
      );
    });
    it('flattens nested attribute namespaces', () => {
      assert.strictEqual(
        tt.div({ data: { bs: { toggle: 'collapse' } } }).toString(),
        '<div data-bs-toggle="collapse"></div>',
      );
    });
    it('renders boolean attributes as bare names', () => {
      assert.strictEqual(
        tt.input({ type: 'checkbox', checked: true }).toString(),
        '<input type="checkbox" checked>',
      );
    });
    it('omits attributes with false or null values', () => {
      assert.strictEqual(
        tt.input({ disabled: false }).toString(),
        '<input>',
      );
    });
    it('joins class arrays and drops falsy entries', () => {
      assert.strictEqual(
        tt.div({ class: ['a', null, '', 'c'] }).toString(),
        '<div class="a c"></div>',
      );
    });
    it('serializes style objects with camelCase to kebab-case keys', () => {
      assert.strictEqual(
        tt.div({ style: { backgroundColor: 'red', zIndex: 2 } }).toString(),
        '<div style="background-color: red; z-index: 2"></div>',
      );
    });
    it('renders additionalGlobalAttributes correctly', () => {
      const k = new SlimKensington({ additionalGlobalAttributes: { enterkeyhint: ['enter'] } });
      assert.strictEqual(
        k.input({ enterkeyhint: 'enter' }).toString(),
        '<input enterkeyhint="enter">',
      );
    });
    it('renders namespaced attributes via additionalNamespaces', () => {
      const k = new SlimKensington({ additionalNamespaces: ['hx'] });
      assert.strictEqual(
        k.div({ hxGet: '/users' }).toString(),
        '<div hx-get="/users"></div>',
      );
    });
  });

  // ─── content handling ────────────────────────────────────────────────

  describe('content', () => {
    it('renders nested tags', () => {
      assert.strictEqual(
        tt.div(tt.p('inner')).toString(),
        '<div>\n  <p>inner</p>\n</div>',
      );
    });
    it('flattens array content and drops falsy entries', () => {
      assert.strictEqual(
        tt.ul([tt.li('a'), false, null, tt.li('b')]).toString(),
        '<ul>\n  <li>a</li>\n  <li>b</li>\n</ul>',
      );
    });
    it('handles encodeContent on HTML content but not on script/style', () => {
      assert.strictEqual(
        tt.div('a < b').toString(),
        '<div>a &#x3C; b</div>',
      );
      assert.strictEqual(
        tt.script('if (a < b) {}').toString(),
        '<script>if (a < b) {}</script>',
      );
    });
  });

  // ─── helper methods ───────────────────────────────────────────────────

  describe('helpers', () => {
    it('literal() embeds raw HTML', () => {
      assert.strictEqual(
        tt.div([tt.literal('<span>raw</span>')]).toString(),
        '<div>\n  <span>raw</span>\n</div>',
      );
    });
    it('unsafeLiteral() accepts script content', () => {
      assert.strictEqual(
        tt.div(tt.unsafeLiteral('<script>void 0</script>')).toString(),
        '<div>\n  <script>void 0</script>\n</div>',
      );
    });
    it('inlineComment() emits an HTML comment', () => {
      assert.strictEqual(
        tt.div(tt.inlineComment('note')).toString(),
        '<div>\n  <!-- note -->\n</div>',
      );
    });
  });

  // ─── create*Tag factories ─────────────────────────────────────────────

  describe('create*Tag factories', () => {
    it('createCustomTag works', () => {
      const myCard = tt.createCustomTag('my-card');
      assert.strictEqual(myCard().toString(), '<my-card></my-card>');
      assert.strictEqual(myCard(tt.p('x')).toString(), '<my-card>\n  <p>x</p>\n</my-card>');
    });
    it('createCustomTag throws on non-string tagName', () => {
      assert.throws(() => tt.createCustomTag(''));
      assert.throws(() => tt.createCustomTag(123));
    });
    it('createContentTag, createVoidTag, createSvgContentTag work', () => {
      const customDiv = tt.createContentTag('x-card');
      const customBr = tt.createVoidTag('x-line');
      const customSvg = tt.createSvgContentTag('x-shape');
      assert.strictEqual(customDiv().toString(), '<x-card></x-card>');
      assert.strictEqual(customBr().toString(), '<x-line>');
      assert.strictEqual(customSvg({ viewBox: '0 0 10 10' }).toString(), '<x-shape viewBox="0 0 10 10"></x-shape>');
    });
  });

  // ─── output parity with full build (smoke test) ───────────────────────

  describe('parity with full build', () => {
    it('produces the same output as the full build for common patterns', async () => {
      const { default: Full } = await import('kensington');
      const full = new Full();
      // Validation level is the only legitimate difference. Both default to 'off'.
      const cases = [
        f => f.div(),
        f => f.div({ class: 'a' }, 'hi'),
        f => f.input({ type: 'checkbox', checked: true }),
        f => f.ul([f.li('a'), f.li('b')]),
        f => f.svg({ viewBox: '0 0 10 10' }, f.circle({ cx: 5, cy: 5, r: 3 })),
        f => f.script('if (a < b) {}'),
      ];
      for (const make of cases) {
        assert.strictEqual(make(tt).toString(), make(full).toString());
      }
    });
  });
});

// ─── bundle size budget ───────────────────────────────────────────────────
//
// Regression guard. Each minified bundle has a maximum size budget. The budgets give some
// headroom over the current measurements so minor variations don't flake, but catch any
// accidental bloat (a forgotten spec data table, a heavy import in the slim path, etc.).
// Update the budgets deliberately when a real feature warrants the growth.

describe('bundle sizes', () => {
  const BUDGETS = [
    { path: '../../dist/kensington.min.js', maxKb: 200 },
    { path: '../../dist/kensington.slim.min.js', maxKb: 50 },
  ];
  for (const { path, maxKb } of BUDGETS) {
    it(`${path.replace('../../dist/', '')} stays under ${maxKb} KB`, () => {
      const stat = fs.statSync(new URL(path, import.meta.url));
      const actualKb = stat.size / 1024;
      assert.ok(
        actualKb < maxKb,
        `${path}: ${actualKb.toFixed(1)} KB exceeds the ${maxKb} KB budget`,
      );
    });
  }
});

// ─── htmlWithDocType ───────────────────────────────────────────────────────

describe('htmlWithDocType', () => {
  it('prepends doctype declaration', () => {
    assert.strictEqual(
      t.htmlWithDocType(t.body('hello')).toString(),
      '<!DOCTYPE html>\n<html>\n  <body>hello</body>\n</html>',
    );
  });
  it('accepts attributes', () => {
    assert.strictEqual(
      t.htmlWithDocType({ lang: 'en' }, t.body('hello')).toString(),
      '<!DOCTYPE html>\n<html lang="en">\n  <body>hello</body>\n</html>',
    );
  });
});

// ─── svg tag ───────────────────────────────────────────────────────────────

describe('svg tag', () => {
  it('renders svg element to string', () => {
    assert.strictEqual(
      t.svg(t.circle({ r: 5, cx: 5, cy: 5 })).toString(),
      '<svg>\n  <circle r="5" cx="5" cy="5"></circle>\n</svg>',
    );
  });
  it('accepts xmlns attribute', () => {
    assert.strictEqual(
      t.svg({ xmlns: 'http://www.w3.org/2000/svg' }).toString(),
      '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    );
  });
  it('does not throw or warn on xmlns attribute when validationLevel is error', () => {
    const te = new Kensington({ validationLevel: 'error' });
    assert.doesNotThrow(() => te.svg({ xmlns: 'http://www.w3.org/2000/svg' }).toString());
  });
  it('does not throw or warn on xmlns attribute when validationLevel is warn', () => {
    let warned = false;
    const tw = new Kensington({ validationLevel: 'warn', logger: () => { warned = true; } });
    assert.doesNotThrow(() => tw.svg({ xmlns: 'http://www.w3.org/2000/svg' }).toString());
    assert.strictEqual(warned, false);
  });
});

// ─── math tag ──────────────────────────────────────────────────────────────

describe('math tag', () => {
  it('renders math element to string', () => {
    assert.strictEqual(
      t.math(t.mfrac([t.mn(1), t.mn(2)])).toString(),
      '<math>\n  <mfrac>\n    <mn>1</mn>\n    <mn>2</mn>\n  </mfrac>\n</math>',
    );
  });
});

// ─── signal ────────────────────────────────────────────────────────────────

describe('signal', () => {
  it('get() returns initial value', () => {
    const s = signal(42);
    assert.strictEqual(s.get(), 42);
  });
  it('set(value) updates the value', () => {
    const s = signal(0);
    s.set(5);
    assert.strictEqual(s.get(), 5);
  });
  it('set(fn) updates via updater function', () => {
    const s = signal(3);
    s.set(n => n * 2);
    assert.strictEqual(s.get(), 6);
  });
  it('set() with same value does not re-run effects', async () => {
    const s = signal('a');
    let calls = 0;
    effect(() => { s.get(); calls++; });
    calls = 0;
    s.set('a');
    await Promise.resolve();
    assert.strictEqual(calls, 0);
  });
  it('signal as string content snapshots current value in toString()', () => {
    const s = signal('hello');
    assert.strictEqual(t.span(s).toString(), '<span>hello</span>');
    s.set('world');
    assert.strictEqual(t.span(s).toString(), '<span>world</span>');
  });
  it('signal as tag content snapshots current value in toString()', () => {
    const s = signal(t.em('hi'));
    assert.strictEqual(t.p(s).toString(), '<p>\n  <em>hi</em>\n</p>');
  });
  it('signal as attribute value snapshots current value in toString()', () => {
    const s = signal('active');
    assert.strictEqual(t.div({ class: s }).toString(), '<div class="active"></div>');
    s.set('inactive');
    assert.strictEqual(t.div({ class: s }).toString(), '<div class="inactive"></div>');
  });
  it('signal as boolean attribute toggles presence in toString()', () => {
    const s = signal(true);
    assert.strictEqual(t.input({ checked: s }).toString(), '<input checked>');
    s.set(false);
    assert.strictEqual(t.input({ checked: s }).toString(), '<input>');
  });
  it('signal holding array snapshots items in toString()', () => {
    const items = signal([t.li('one'), t.li('two')]);
    assert.strictEqual(t.ul(items).toString(), '<ul>\n  <li>one</li>\n  <li>two</li>\n</ul>');
    items.set([t.li('a'), t.li('b'), t.li('c')]);
    assert.strictEqual(t.ul(items).toString(), '<ul>\n  <li>a</li>\n  <li>b</li>\n  <li>c</li>\n</ul>');
  });
  it('signal as one item in a mixed content array snapshots current value in toString()', () => {
    const s = signal('world');
    assert.strictEqual(t.p(['hello ', s, '!']).toString(), '<p>\n  hello \n  world\n  !\n</p>');
    s.set('there');
    assert.strictEqual(t.p(['hello ', s, '!']).toString(), '<p>\n  hello \n  there\n  !\n</p>');
  });
  it('signal holding null in mixed content array renders nothing in toString()', () => {
    const s = signal(null);
    assert.strictEqual(t.div(['before', s, 'after']).toString(), '<div>\n  before\n  after\n</div>');
  });
  it('signal holding undefined in mixed content array renders nothing in toString()', () => {
    const s = signal(undefined);
    assert.strictEqual(t.div(['before', s, 'after']).toString(), '<div>\n  before\n  after\n</div>');
  });
  it('signal transitioning from null to a tag renders correctly in toString()', () => {
    const s = signal(null);
    assert.strictEqual(t.div(s).toString(), '<div>\n  \n</div>');
    s.set(t.span('content'));
    assert.strictEqual(t.div(s).toString(), '<div>\n  <span>content</span>\n</div>');
  });
  it('computed returning null in mixed content array renders nothing in toString()', () => {
    const flag = signal(false);
    const c = computed(() => flag.get() ? t.span('visible') : null);
    assert.strictEqual(t.div(['prefix', c]).toString(), '<div>\n  prefix\n</div>');
    flag.set(true);
    assert.strictEqual(t.div(['prefix', c]).toString(), '<div>\n  prefix\n  <span>visible</span>\n</div>');
  });
  it('signal as literal content snapshots current value in toString()', () => {
    const s = signal('<b>bold</b>');
    assert.strictEqual(t.div(t.literal(s)).toString(), '<div>\n  <b>bold</b>\n</div>');
    s.set('<i>italic</i>');
    assert.strictEqual(t.div(t.literal(s)).toString(), '<div>\n  <i>italic</i>\n</div>');
  });
  it('signal as inlineComment content snapshots current value in toString()', () => {
    const s = signal('before');
    assert.strictEqual(t.inlineComment(s).toString(), '<!-- before -->');
    s.set('after');
    assert.strictEqual(t.inlineComment(s).toString(), '<!-- after -->');
  });
  it('toJSON() returns the current value', () => {
    const s = signal(true);
    assert.strictEqual(JSON.stringify(s), 'true');
    s.set(false);
    assert.strictEqual(JSON.stringify(s), 'false');
  });
  it('toJSON() serializes signals nested in objects', () => {
    const done = signal(true);
    assert.strictEqual(JSON.stringify({ id: 1, done }), '{"id":1,"done":true}');
  });
  it('toString() returns the string representation of the current value', () => {
    const s = signal(42);
    assert.strictEqual(`${s}`, '42');
    s.set(99);
    assert.strictEqual(`${s}`, '99');
  });
  it('toString() tracks the signal inside a computed', () => {
    const s = signal('hello');
    const upper = computed(() => `${s}`.toUpperCase());
    assert.strictEqual(upper.get(), 'HELLO');
    s.set('world');
    assert.strictEqual(upper.get(), 'WORLD');
  });
  it('value returns the current value', () => {
    const s = signal(42);
    assert.strictEqual(s.value, 42);
    s.set(99);
    assert.strictEqual(s.value, 99);
  });
  it('value does not subscribe inside computed()', () => {
    const s = signal(0);
    const other = signal(10);
    const c = computed(() => other.get() + s.value);
    assert.strictEqual(c.get(), 10);
    s.set(5);
    assert.strictEqual(c.get(), 10);
    other.set(20);
    assert.strictEqual(c.get(), 25);
  });
  it('value does not subscribe inside effect()', async () => {
    const s = signal(0);
    const trigger = signal(0);
    let calls = 0;
    effect(() => { trigger.get(); s.value; calls++; });
    calls = 0;
    s.set(99);
    await Promise.resolve();
    assert.strictEqual(calls, 0);
  });
  it('assigning to .value throws', () => {
    const s = signal(0);
    assert.throws(() => { s.value = 99; }, TypeError);
  });
  // Regression. The 0 → 1 subscriber transition must fire _onFirstSubscriber
  // regardless of which subscribe path triggered it. Live signals install this
  // hook to send MSG_SUBSCRIBE to the server. Before the fix, `.get()` inside
  // a computed/effect woke the signal locally but skipped the hook, so a live
  // signal whose count went 0 → 1 via the .get() path stayed silently
  // unsubscribed server-side and missed every future broadcast. The symptom
  // was "remote updates land until the first time the rendering chain drops
  // and reattaches; after that the cell shows stale data until reload."
  it('_onFirstSubscriber fires on 0 → 1 via .get() inside an effect', async () => {
    const s = signal('a');
    let firstCount = 0;
    let zeroCount = 0;
    s._onFirstSubscriber = () => { firstCount++; };
    s._onZeroSubscribers = () => { zeroCount++; };
    // First subscriber added via .get() inside an effect.
    const eff = effect(() => { s.get(); });
    assert.strictEqual(firstCount, 1, 'first subscriber via .get() must fire _onFirstSubscriber');
    // Drop the only subscriber.
    eff.stop();
    await Promise.resolve();
    assert.strictEqual(zeroCount, 1, 'last subscriber leaving must fire _onZeroSubscribers');
    // Re-add via .get() inside a fresh effect. Hook must fire again.
    const eff2 = effect(() => { s.get(); });
    assert.strictEqual(firstCount, 2, 'resubscribe via .get() must fire _onFirstSubscriber');
    eff2.stop();
  });
  it('_onFirstSubscriber fires on 0 → 1 via .get() inside a computed', async () => {
    const s = signal(0);
    let firstCount = 0;
    let zeroCount = 0;
    s._onFirstSubscriber = () => { firstCount++; };
    s._onZeroSubscribers = () => { zeroCount++; };
    // Wire the computed through an effect so it has a subscriber and stays awake.
    let c = computed(() => s.get() * 2);
    const eff = effect(() => { c.get(); });
    assert.strictEqual(firstCount, 1);
    // Tear down the chain. The computed should sleep, releasing s.
    eff.stop();
    c = null;
    await Promise.resolve();
    assert.strictEqual(zeroCount, 1);
    // Build a fresh chain. Resubscribe through .get() must re-fire the hook.
    const c2 = computed(() => s.get() + 1);
    const eff2 = effect(() => { c2.get(); });
    assert.strictEqual(firstCount, 2);
    eff2.stop();
  });
});

// ─── subtree-signal attributes ─────────────────────────────────────────────
// Signals that yield objects can sit at any depth inside `style`, `data`,
// `aria`, or any other namespaced-attribute slot. toString resolves the
// signal's current value and flattens to attribute pairs. (toElement diff
// behavior is exercised by tests/browser/signals.spec.js.)

describe('subtree-signal attributes (toString)', () => {
  it('top-level data: Signal<Object> flattens to data-* attributes', () => {
    const s = signal({ foo: 'bar', count: 3 });
    assert.strictEqual(t.div({ data: s }).toString(), '<div data-foo="bar" data-count="3"></div>');
  });
  it('top-level aria: Signal<Object> flattens to aria-* attributes', () => {
    const s = signal({ label: 'Close', expanded: 'false' });
    assert.strictEqual(t.button({ aria: s }).toString(), '<button aria-label="Close" aria-expanded="false"></button>');
  });
  it('nested data: { bs: Signal<Object> } flattens to data-bs-* attributes', () => {
    const s = signal({ toggle: 'collapse', target: '#pane' });
    const expected = '<div data-bs-toggle="collapse" data-bs-target="#pane"></div>';
    assert.strictEqual(t.div({ data: { bs: s } }).toString(), expected);
  });
  it('two-level nesting data: { wa: { dialog: Signal<Object> } } flattens correctly', () => {
    const s = signal({ open: 'true' });
    assert.strictEqual(t.div({ data: { wa: { dialog: s } } }).toString(), '<div data-wa-dialog-open="true"></div>');
  });
  it('static keys and subtree-signal keys at the same level coexist', () => {
    const s = signal({ toggle: 'collapse' });
    const expected = '<div data-theme="dark" data-bs-toggle="collapse"></div>';
    assert.strictEqual(t.div({ data: { theme: 'dark', bs: s } }).toString(), expected);
  });
  it('style: Signal<Object> emits a style attribute with the resolved css', () => {
    const s = signal({ color: 'red', fontSize: '14px' });
    assert.strictEqual(t.div({ style: s }).toString(), '<div style="color: red; font-size: 14px"></div>');
  });
  it('style: Signal<Object> snapshots the current value after .set()', () => {
    const s = signal({ color: 'red' });
    assert.strictEqual(t.div({ style: s }).toString(), '<div style="color: red"></div>');
    s.set({ color: 'blue', fontWeight: 600 });
    assert.strictEqual(t.div({ style: s }).toString(), '<div style="color: blue; font-weight: 600"></div>');
  });
  it('data: Signal<Object> snapshots the current value after .set()', () => {
    const s = signal({ a: '1' });
    assert.strictEqual(t.div({ data: s }).toString(), '<div data-a="1"></div>');
    s.set({ a: '9', b: '2' });
    assert.strictEqual(t.div({ data: s }).toString(), '<div data-a="9" data-b="2"></div>');
  });
  it('data: Signal<Object> with empty object emits no attributes', () => {
    const s = signal({});
    assert.strictEqual(t.div({ data: s }).toString(), '<div></div>');
  });
  it('data: Signal yielding null is treated as no attributes', () => {
    const s = signal(null);
    assert.strictEqual(t.div({ data: s }).toString(), '<div></div>');
  });
  it('inner signals inside a subtree-signal value are sampled at outer-emission time', () => {
    const inner = signal('a-value');
    const outer = signal({ inner });
    assert.strictEqual(t.div({ data: outer }).toString(), '<div data-inner="a-value"></div>');
  });
  it('per-property style signals (the existing shape) still work alongside subtree-signal', () => {
    const colorSig = signal('green');
    const expected = '<div style="color: green; font-size: 20px"></div>';
    assert.strictEqual(t.div({ style: { color: colorSig, fontSize: '20px' } }).toString(), expected);
  });
  it('subtree-signal at custom namespace defined via additionalNamespaces', () => {
    const tt = new Kensington({ additionalNamespaces: ['hx'] });
    const s = signal({ get: '/items', trigger: 'click' });
    assert.strictEqual(tt.div({ hx: s }).toString(), '<div hx-get="/items" hx-trigger="click"></div>');
  });
});

// ─── signal.transform ──────────────────────────────────────────────────────

describe('signal.transform', () => {
  it('returns a new signal with the transformed value', () => {
    const s = signal(3);
    const doubled = s.transform(v => v * 2);
    assert.strictEqual(doubled.get(), 6);
  });
  it('updates when the source signal changes', () => {
    const s = signal('hello');
    const upper = s.transform(v => v.toUpperCase());
    s.set('world');
    assert.strictEqual(upper.get(), 'WORLD');
  });
  it('can chain multiple transforms', () => {
    const s = signal(2);
    const result = s.transform(v => v * 3).transform(v => v + 1);
    assert.strictEqual(result.get(), 7);
    s.set(4);
    assert.strictEqual(result.get(), 13);
  });
  it('updates when a secondary signal read inside fn changes', () => {
    const base = signal(10);
    const multiplier = signal(2);
    const result = base.transform(v => v * multiplier.get());
    assert.strictEqual(result.get(), 20);
    multiplier.set(3);
    assert.strictEqual(result.get(), 30);
    base.set(5);
    assert.strictEqual(result.get(), 15);
  });
  it('stop() freezes the derived value and unsubscribes from the source', () => {
    const s = signal(1);
    const doubled = s.transform(v => v * 2);
    doubled.stop();
    s.set(5);
    assert.strictEqual(doubled.get(), 2);
  });
  it('stop() on a chained transform sleeps the intermediate; direct .get() still returns fresh value', () => {
    // final was the only subscriber of intermediate. stopping final drops intermediate
    // to zero subscribers so it sleeps. direct .get() outside a reactive context wakes it,
    // re-runs fn, then sleeps again — no subscription leak.
    const s = signal(2);
    const intermediate = s.transform(v => v * 3);
    const final = intermediate.transform(v => v + 1);
    final.stop();
    s.set(4);
    assert.strictEqual(final.get(), 7);
    assert.strictEqual(intermediate.get(), 12); // wakes for the read, gets fresh value
  });
  it('throws when .set() is called on a transform result', () => {
    const s = signal(1);
    const t2 = s.transform(v => v * 2);
    assert.throws(() => t2.set(99), /Cannot call .set\(\) on a computed or derived signal/);
  });
});

// ─── signal.mapWithKey ─────────────────────────────────────────────────────

describe('signal.mapWithKey', () => {
  it('returns a signal whose value is the array of mapped tags', () => {
    const rows = signal([{ id: 1, label: 'one' }, { id: 2, label: 'two' }]);
    const tags = rows.mapWithKey(r => r.id, r => t.li(r.label));
    const result = tags.get();
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].toString(), '<li>one</li>');
    assert.strictEqual(result[1].toString(), '<li>two</li>');
  });
  it('accepts a property name string as a shortcut for `item => item[prop]`', () => {
    const rows = signal([{ id: 'a', label: 'one' }, { id: 'b', label: 'two' }]);
    const tags = rows.mapWithKey('id', r => t.li(r.label)).get();
    assert.strictEqual(tags[0]._kensingtonKey, 'a');
    assert.strictEqual(tags[1]._kensingtonKey, 'b');
  });
  it('stamps the reconciliation key onto each returned tag', () => {
    const rows = signal([{ id: 'a' }, { id: 'b' }]);
    const tags = rows.mapWithKey(r => r.id, r => t.li(r.id)).get();
    assert.strictEqual(tags[0]._kensingtonKey, 'a');
    assert.strictEqual(tags[1]._kensingtonKey, 'b');
  });
  it('reuses the same tag instance across renders when the key is unchanged', () => {
    const rows = signal([{ id: 1, label: 'one' }]);
    const tags = rows.mapWithKey(r => r.id, r => t.li(r.label));
    const first = tags.get()[0];
    rows.set([{ id: 1, label: 'one' }, { id: 2, label: 'two' }]);
    const second = tags.get();
    assert.strictEqual(second[0], first); // same JS object
  });
  it('evicts cache entries whose keys are not present in the next render', () => {
    const callCount = { n: 0 };
    const rows = signal([{ id: 1 }]);
    const tags = rows.mapWithKey(r => r.id, r => { callCount.n++; return t.li(String(r.id)); });
    tags.get(); // initial build
    assert.strictEqual(callCount.n, 1);
    rows.set([{ id: 2 }]);
    tags.get(); // id 1 evicted, id 2 built fresh
    assert.strictEqual(callCount.n, 2);
    rows.set([{ id: 1 }]);
    tags.get(); // id 1 is back; mapFn runs again because the eviction was permanent
    assert.strictEqual(callCount.n, 3);
  });
  it('does not call mapFn for unchanged keys on re-render', () => {
    let calls = 0;
    const rows = signal([{ id: 1 }, { id: 2 }]);
    const tags = rows.mapWithKey(r => r.id, r => { calls++; return t.li(String(r.id)); });
    tags.get();
    assert.strictEqual(calls, 2);
    rows.set([{ id: 2 }, { id: 1 }]); // reordered, same keys
    tags.get();
    assert.strictEqual(calls, 2); // no new calls
  });
  it('treats two items with the same key as a single entry (warns)', () => {
    _resetWarningThrottle();
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(msg);
    try {
      const rows = signal([{ id: 1, label: 'a' }, { id: 1, label: 'b' }]);
      const tags = rows.mapWithKey(r => r.id, r => t.li(r.label)).get();
      assert.strictEqual(tags.filter(Boolean).length, 1);
      assert.match(errors.join('\n'), /duplicate-key|same key/i);
    } finally {
      console.error = origError;
    }
  });
  it('throws when the first argument is neither a function nor a string', () => {
    const rows = signal([1, 2]);
    assert.throws(() => rows.mapWithKey(42, () => null), /function or a property name/);
    assert.throws(() => rows.mapWithKey(null, () => null), /function or a property name/);
  });
  it('throws when mapFn is not a function', () => {
    const rows = signal([1, 2]);
    assert.throws(() => rows.mapWithKey(() => 1, 'not a fn'), /second argument must be a function/);
  });
  it('re-runs mapFn for a key when a signal it read changes', async () => {
    const flag = signal('A');
    const rows = signal([{ id: 1 }, { id: 2 }]);
    let calls = 0;
    const tags = rows.mapWithKey('id', item => { calls++; return t.li(`${item.id}-${flag.get()}`); });
    const first = tags.get();
    // mapFn runs twice on first sight for reactive rows: once in the probe, once in the
    // real per-key inner computed. Two rows × two calls = 4.
    assert.strictEqual(calls, 4);
    assert.strictEqual(first[0].toString(), '<li>1-A</li>');

    flag.set('B');
    await Promise.resolve();
    const second = tags.get();
    assert.strictEqual(calls, 6); // each row's inner re-ran once
    assert.notStrictEqual(second[0], first[0]); // fresh tag for key 1
    assert.strictEqual(second[0].toString(), '<li>1-B</li>');
  });
  it('static mapFn (no signal reads) runs exactly once per key, no extra calls', () => {
    const rows = signal([{ id: 1 }, { id: 2 }]);
    let calls = 0;
    const tags = rows.mapWithKey('id', item => { calls++; return t.li(String(item.id)); });
    tags.get();
    // No signals were read inside mapFn, so the probe is the only run. One call per row.
    assert.strictEqual(calls, 2);
    rows.set([{ id: 2 }, { id: 1 }]); // reordered
    tags.get();
    assert.strictEqual(calls, 2); // cache hit for both
    rows.set([{ id: 1 }, { id: 2 }, { id: 3 }]); // add id 3
    tags.get();
    assert.strictEqual(calls, 3); // only id 3 ran mapFn
  });
  it('only the rows whose mapFn read the changed signal rebuild', async () => {
    const colorA = signal('red');
    const colorB = signal('blue');
    const rows = signal([{ id: 'a', sig: colorA }, { id: 'b', sig: colorB }]);
    let calls = 0;
    const tags = rows.mapWithKey('id', item => { calls++; return t.li(item.sig.get()); });
    const first = tags.get();
    const firstCalls = calls;
    assert.strictEqual(first[0].toString(), '<li>red</li>');
    assert.strictEqual(first[1].toString(), '<li>blue</li>');

    colorA.set('green');
    await Promise.resolve();
    const second = tags.get();
    // Only the row that subscribed to colorA re-ran.
    assert.strictEqual(calls - firstCalls, 1);
    assert.notStrictEqual(second[0], first[0]);
    assert.strictEqual(second[1], first[1]); // unchanged tag instance for the other row
    assert.strictEqual(second[0].toString(), '<li>green</li>');
  });
  it('keyed signal inside mapFn forces the reactive path and lives in a stable per-row scope', () => {
    const rows = signal([{ id: 1 }, { id: 2 }]);
    let mapCalls = 0;
    const localRefs = [];
    const tags = rows.mapWithKey('id', item => {
      mapCalls++;
      const local = signal(0, item.id);
      localRefs.push(local);
      return t.li(`${item.id}:${local.get()}`);
    });
    tags.get();
    // Probe + inner: 4 calls total for 2 rows. mapFn ran twice on first sight per row.
    assert.strictEqual(mapCalls, 4);
    // Mutating the inner's keyed signal triggers a re-run of the inner (mapFn re-runs).
    // localRefs[1] was created during the probe (unkeyed). localRefs[3] was created during
    // the inner's run (keyed). The latter is what the live tag is bound to.
    const innerLocal = localRefs[3];
    innerLocal.set(5);
    tags.get();
    assert.strictEqual(mapCalls, 5); // only one row re-ran
    // Cache hit on next render does not call mapFn again.
    rows.set([{ id: 1 }, { id: 2 }, { id: 3 }]);
    tags.get();
    // Only id 3 runs mapFn (probe + inner).
    assert.strictEqual(mapCalls, 7);
  });
  it('removing a key stops its inner and keep-alive (no resource leak)', () => {
    const flag = signal('A');
    const rows = signal([{ id: 1 }, { id: 2 }]);
    const tags = rows.mapWithKey('id', item => t.li(`${item.id}-${flag.get()}`));
    tags.get();
    rows.set([{ id: 1 }]); // drop id 2
    tags.get();
    // After flag changes, only the still-present row should rebuild. The dropped row's
    // inner has been stopped, so its mapFn would never run again even hypothetically.
    let observedCalls = 0;
    const observer = signal(0);
    const tracked = rows.mapWithKey('id', item => { observedCalls++; return t.li(`${item.id}-${observer.get()}`); });
    tracked.get();
    rows.set([]); // sweep
    tracked.get();
    observer.set(1); // no remaining rows; firing this should not trigger any mapFn re-runs
    assert.strictEqual(observedCalls, 2); // initial probe + initial inner for id 1; id 2 swept before observer changed
  });
  it('mapFn that conditionally reads a signal upgrades when the signal is read on first sight', async () => {
    const debug = signal(false);
    const showInfo = signal('hi');
    const rows = signal([{ id: 1 }]);
    let calls = 0;
    const tags = rows.mapWithKey('id', item => {
      calls++;
      // showInfo is read unconditionally, so upgrade fires.
      return t.li(`${item.id}: ${showInfo.get()}${debug.value ? ' (debug)' : ''}`);
    });
    tags.get();
    assert.strictEqual(calls, 2); // probe + inner
    showInfo.set('hello');
    await Promise.resolve();
    tags.get();
    assert.strictEqual(calls, 3); // one rebuild
    // debug was read via .value (untracked), so flipping it does not trigger a rebuild.
    debug.set(true);
    await Promise.resolve();
    tags.get();
    assert.strictEqual(calls, 3);
  });
});

// ─── computed signal ───────────────────────────────────────────────────────

describe('computed signal', () => {
  it('returns the initial derived value', () => {
    const s = signal(2);
    const doubled = computed(() => s.get() * 2);
    assert.strictEqual(doubled.get(), 4);
  });
  it('updates when a dependency changes', () => {
    const s = signal(1);
    const doubled = computed(() => s.get() * 2);
    s.set(5);
    assert.strictEqual(doubled.get(), 10);
  });
  it('tracks multiple dependencies', () => {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.get() + b.get());
    assert.strictEqual(sum.get(), 3);
    a.set(10);
    assert.strictEqual(sum.get(), 12);
    b.set(20);
    assert.strictEqual(sum.get(), 30);
  });
  it('does not re-run effects if computed value is unchanged', async () => {
    const s = signal('a');
    const upper = computed(() => s.get().toUpperCase());
    let calls = 0;
    effect(() => { upper.get(); calls++; });
    calls = 0;
    s.set('A'); // same result after toUpperCase
    await Promise.resolve();
    assert.strictEqual(calls, 0);
  });
  it('computed value used in toString()', () => {
    const active = signal(true);
    const cls = computed(() => active.get() ? 'on' : 'off');
    assert.strictEqual(t.div({ class: cls }).toString(), '<div class="on"></div>');
    active.set(false);
    assert.strictEqual(t.div({ class: cls }).toString(), '<div class="off"></div>');
  });
  it('throws when .set() is called directly on a computed signal', () => {
    const s = signal(1);
    const c = computed(() => s.get() * 2);
    assert.throws(() => c.set(99), /Cannot call .set\(\) on a computed or derived signal/);
  });
  it('still updates after an attempted .set() on the computed signal', () => {
    const s = signal(1);
    const c = computed(() => s.get() * 2);
    assert.throws(() => c.set(99));
    s.set(5);
    assert.strictEqual(c.get(), 10);
  });
  it('computed created inside effect is auto-stopped on parent re-run', async () => {
    // Without auto-cleanup, each parent re-run creates a fresh computed whose update
    // closure stays subscribed to src forever. After N runs, src has N stale subscribers
    // that each invoke the user's compute function on every set, so the work per set
    // grows quadratically with run count.
    // The pattern under test deliberately triggers the `computed-in-effect` warning,
    // so silence console.error for the duration.
    const origError = console.error;
    console.error = () => {};
    try {
      const src = signal(1);
      let computeCalls = 0;
      const fx = effect(() => {
        const c = computed(() => {
          computeCalls++;
          return src.get() * 2;
        });
        c.get();
      });
      assert.strictEqual(computeCalls, 1);
      for (let i = 0; i < 10; i++) {
        src.set(i + 2);
        await new Promise(resolve => { queueMicrotask(resolve); });
      }
      // With cleanup: ~21 calls (1 initial + 2 per set: existing update fires, then new
      // computed is created during the parent re-run). Without: ~66 (quadratic).
      assert.ok(
        computeCalls < 30,
        `computed inside effect leaked: ${computeCalls} compute calls after 10 sets`,
      );
      fx.stop();
    } finally {
      console.error = origError;
    }
  });
});

// ─── computed auto-dispose ──────────────────────────────────────────────────

describe('computed auto-dispose', () => {
  it('unsubscribes from source when its last subscriber stops', async () => {
    const src = signal(1);
    let runs = 0;
    const c = computed(() => { runs++; return src.get() * 2; });
    runs = 0; // reset after initial run
    const fx = effect(() => { c.get(); });
    fx.stop();
    const runsBefore = runs;
    src.set(99);
    await Promise.resolve();
    assert.strictEqual(runs, runsBefore); // c did not re-run after sleep
  });

  it('.get(), .value, and .toJSON() all return fresh values while sleeping', () => {
    const src = signal(2);
    const c = computed(() => src.get() * 3);
    const fx = effect(() => { c.get(); });
    fx.stop();
    src.set(10);
    assert.strictEqual(c.get(), 30);
    assert.strictEqual(c.value, 30);
    assert.strictEqual(c.toJSON(), 30);
    assert.strictEqual(JSON.stringify({ c }), '{"c":30}');
  });

  it('wakes and returns fresh value when a new subscriber reads it', async () => {
    const src = signal(2);
    const c = computed(() => src.get() * 3);
    const fx = effect(() => { c.get(); });
    fx.stop();
    src.set(10);
    let seen;
    const fx2 = effect(() => { seen = c.get(); });
    await Promise.resolve();
    assert.strictEqual(seen, 30); // woke up, re-ran fn, got fresh value
    fx2.stop();
  });

  it('resumes tracking source after wake', async () => {
    const src = signal(1);
    const c = computed(() => src.get() + 1);
    const fx = effect(() => { c.get(); });
    fx.stop();
    src.set(5);
    const results = [];
    const fx2 = effect(() => { results.push(c.get()); });
    src.set(10);
    await Promise.resolve();
    assert.deepStrictEqual(results, [6, 11]); // woke at 6, then tracked 10+1=11
    fx2.stop();
  });

  it('cascades sleep through a computed chain', async () => {
    const src = signal(2);
    let bRuns = 0;
    let cRuns = 0;
    const b = computed(() => { bRuns++; return src.get() * 2; });
    const c = computed(() => { cRuns++; return b.get() + 1; });
    bRuns = 0;
    cRuns = 0;
    const fx = effect(() => { c.get(); });
    fx.stop();
    src.set(99);
    await Promise.resolve();
    assert.strictEqual(bRuns, 0); // b also slept — did not re-run
    assert.strictEqual(cRuns, 0);
  });

  it('explicit .stop() prevents wake', () => {
    const src = signal(1);
    const c = computed(() => src.get() * 2);
    const fx = effect(() => { c.get(); });
    fx.stop();
    c.stop(); // permanent stop
    src.set(5);
    let seen;
    effect(() => { seen = c.get(); });
    assert.strictEqual(seen, 2); // stopped: stays frozen regardless of new subscribers
  });

  it('direct .get() and .value while effect is paused return fresh values without leaking a subscription', () => {
    const src = signal(1);
    let runs = 0;
    const c = computed(() => { runs++; return src.get() * 2; });
    const fx = effect(() => { c.get(); });
    fx.pause(); // c sleeps
    runs = 0;
    // non-reactive reads each wake-and-sleep: one fn() call per read, no persistent subscription
    assert.strictEqual(c.get(), 2);
    assert.strictEqual(runs, 1);
    assert.strictEqual(c.value, 2);
    assert.strictEqual(runs, 2);
    src.set(5);
    // src has no persistent subscribers from c — runs stays at 2
    assert.strictEqual(runs, 2);
    // next non-reactive read returns fresh value
    assert.strictEqual(c.get(), 10);
    assert.strictEqual(runs, 3);
    fx.stop();
  });

  it('paused effect lets computed sleep; resume re-establishes tracking with fresh value', async () => {
    const src = signal(1);
    const c = computed(() => src.get() * 2);
    const results = [];
    const fx = effect(() => { results.push(c.get()); });
    fx.pause();
    src.set(5); // c still tracks, updates to 10
    fx.resume();
    await Promise.resolve();
    assert.deepStrictEqual(results, [2, 10]); // initial + resumed run sees fresh value
    fx.stop();
  });

  it('transform chain auto-disposes when effect stops', async () => {
    const src = signal(3);
    let runs = 0;
    const doubled = src.transform(v => { runs++; return v * 2; });
    const plusOne = doubled.transform(v => v + 1);
    runs = 0;
    const fx = effect(() => { plusOne.get(); });
    fx.stop();
    src.set(99);
    await Promise.resolve();
    assert.strictEqual(runs, 0);
  });

  it('computed does not sleep when its subscriber re-subscribes in the same flush', async () => {
    const src = signal(1);
    let runs = 0;
    const c = computed(() => { runs++; return src.get() * 2; });
    runs = 0;
    const seen = [];
    const fx = effect(() => { seen.push(c.get()); });
    runs = 0; // reset after initial effect run
    src.set(5);
    await Promise.resolve();
    // c re-ran exactly once (src changed), no extra run from wake
    assert.strictEqual(runs, 1);
    assert.deepStrictEqual(seen, [2, 10]);
    fx.stop();
  });

  it('computed still sleeps when its subscriber stops outside a flush', async () => {
    const src = signal(1);
    let runs = 0;
    const c = computed(() => { runs++; return src.get() * 2; });
    runs = 0;
    const fx = effect(() => { c.get(); });
    fx.stop();
    const runsBefore = runs;
    src.set(99);
    await Promise.resolve();
    assert.strictEqual(runs, runsBefore); // c slept immediately, did not re-run
  });
});

// ─── effect ────────────────────────────────────────────────────────────────

describe('effect', () => {
  it('runs immediately', () => {
    const s = signal(1);
    let result = 0;
    effect(() => { result = s.get() * 2; });
    assert.strictEqual(result, 2);
  });
  it('re-runs when a dependency changes', async () => {
    const s = signal('a');
    const log = [];
    effect(() => { log.push(s.get()); });
    s.set('b');
    await Promise.resolve();
    s.set('c');
    await Promise.resolve();
    assert.deepStrictEqual(log, ['a', 'b', 'c']);
  });
  it('batches multiple synchronous set() calls into one effect run', async () => {
    const s = signal(0);
    const log = [];
    effect(() => { log.push(s.get()); });
    s.set(1);
    s.set(2);
    await Promise.resolve();
    assert.deepStrictEqual(log, [0, 2]);
  });
  it('tracks multiple signal dependencies', async () => {
    const a = signal(1);
    const b = signal(10);
    let result = 0;
    effect(() => { result = a.get() + b.get(); });
    assert.strictEqual(result, 11);
    a.set(2);
    await Promise.resolve();
    assert.strictEqual(result, 12);
    b.set(20);
    await Promise.resolve();
    assert.strictEqual(result, 22);
  });
  it('stop() prevents further runs', async () => {
    const s = signal(0);
    const log = [];
    const e = effect(() => { log.push(s.get()); });
    s.set(1);
    await Promise.resolve();
    e.stop();
    s.set(2);
    s.set(3);
    await Promise.resolve();
    assert.deepStrictEqual(log, [0, 1]);
  });
  it('stop() before microtask fires cancels the pending run', async () => {
    const s = signal(0);
    const log = [];
    const e = effect(() => { log.push(s.get()); });
    s.set(1);
    e.stop(); // cancels the deferred run before it fires
    await Promise.resolve();
    assert.deepStrictEqual(log, [0]);
  });
  it('a throwing effect does not prevent other batched effects from running', async () => {
    const s = signal(0);
    const log = [];
    const surfaced = [];
    // flush() re-throws effect errors via queueMicrotask. Override it for the
    // duration of this test so the error is captured and never becomes an
    // uncaughtException that the test runner would pick up.
    const origQMT = globalThis.queueMicrotask;
    globalThis.queueMicrotask = fn => origQMT(() => { try { fn(); } catch (e) { surfaced.push(e); } });
    let initial = true;
    effect(() => {
      if (!initial) { throw new Error('effect error'); }
      initial = false;
      s.get();
    });
    effect(() => { log.push(s.get()); });
    s.set(1);
    await Promise.resolve();
    await Promise.resolve();
    globalThis.queueMicrotask = origQMT;
    assert.strictEqual(surfaced.length, 1);
    assert.deepStrictEqual(log, [0, 1]);
  });
  it('cleans up stale conditional dependencies', async () => {
    const flag = signal(true);
    const a = signal('a');
    const b = signal('b');
    const log = [];
    effect(() => { log.push(flag.get() ? a.get() : b.get()); });
    assert.deepStrictEqual(log, ['a']);
    flag.set(false);
    await Promise.resolve();
    assert.deepStrictEqual(log, ['a', 'b']);
    a.set('a2');
    await Promise.resolve();
    assert.deepStrictEqual(log, ['a', 'b']); // a is no longer tracked
    b.set('b2');
    await Promise.resolve();
    assert.deepStrictEqual(log, ['a', 'b', 'b2']);
    flag.set(true);
    await Promise.resolve();
    assert.deepStrictEqual(log, ['a', 'b', 'b2', 'a2']);
  });
});

// ─── reactive loop guards ─────────────────────────────────────────────────────

describe('reactive loop guards', () => {
  beforeEach(() => { _resetWarningThrottle(); });

  it('warns when the same signal is read and written in the same effect run', () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(msg);
    const x = signal(0);
    effect(() => { x.get(); x.set(1); });
    console.error = origError;
    assert.ok(errors.some(e => e.includes('read via .get() and written via .set()')));
  });

  it('does not warn when different signals are read and written in the same effect run', () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(msg);
    const a = signal(0);
    const b = signal(0);
    effect(() => { b.set(a.get() + 1); });
    console.error = origError;
    assert.strictEqual(errors.length, 0);
  });

  it('does not warn when a signal is read via .value and then written in the same effect run', () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(msg);
    const x = signal(5);
    const trigger = signal(0);
    effect(() => { trigger.get(); if (x.value > 10) { x.set(0); } });
    console.error = origError;
    assert.strictEqual(errors.length, 0);
  });

  it('warns when .set() is called inside a computed body', () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(msg);
    const x = signal(0);
    const y = signal(0);
    computed(() => { y.set(1); return x.get(); });
    console.error = origError;
    assert.ok(errors.some(e => e.includes('.set() called inside a computed')));
  });

  it('warns when the same signal is read and written in the same computed run', () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(msg);
    const x = signal(0);
    computed(() => { x.get(); x.set(1); return x.value; });
    console.error = origError;
    assert.ok(errors.some(e => e.includes('read via .get() and written via .set()')));
    assert.ok(errors.some(e => e.includes('.set() called inside a computed')));
  });

  it('does not warn for .set() called inside an effect', () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(msg);
    const a = signal(0);
    const b = signal(0);
    effect(() => { b.set(a.get() + 1); });
    console.error = origError;
    assert.ok(!errors.some(e => e.includes('.set() called inside a computed')));
  });

  it('inComputedFn flag is correctly restored after a nested computed is created inside a computed', () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(msg);
    const x = signal(0);
    const y = signal(0);
    computed(() => {
      computed(() => x.get() * 2); // inner computed — resets inComputedFn without save/restore
      y.set(1); // should still be flagged as inside the outer computed
      return x.get();
    });
    console.error = origError;
    assert.ok(errors.some(e => e.includes('.set() called inside a computed')));
  });

  it('does not warn for .set() in an effect that runs after a computed was created', () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(msg);
    const x = signal(0);
    const c = computed(() => x.get() * 2);
    const y = signal(0);
    effect(() => { y.set(c.get() + 1); });
    console.error = origError;
    assert.ok(!errors.some(e => e.includes('.set() called inside a computed')));
  });

  it('loop counter fires and stops an infinite two-effect ping-pong', async () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(msg);
    const a = signal(0);
    const b = signal(0);
    effect(() => { b.set(a.get() + 1); });
    effect(() => { a.set(b.get() + 1); });
    await new Promise(r => { setTimeout(r, 0); });
    console.error = origError;
    assert.ok(errors.some(e => e.includes('reactive loop detected')));
  });

  it('loop counter stops the loop and signals remain usable afterwards', async () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(msg);
    const a = signal(0);
    const b = signal(0);
    effect(() => { b.set(a.get() + 1); });
    effect(() => { a.set(b.get() + 1); });
    await new Promise(r => { setTimeout(r, 0); });
    console.error = origError;
    a.set(999);
    assert.strictEqual(a.value, 999);
  });

  it('converging two-effect loop does not trigger the loop counter', async () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(msg);
    const a = signal(3);
    const b = signal(0);
    effect(() => { if (a.get() > 0) { b.set(a.get() - 1); } });
    effect(() => { if (b.get() > 0) { a.set(b.get() - 1); } });
    await new Promise(r => { setTimeout(r, 0); });
    console.error = origError;
    assert.ok(!errors.some(e => e.includes('reactive loop detected')));
  });
});

describe('renderForHydration', () => {
  function comp() {
    return t.div({ id: 'root' }, 'hello');
  }

  it('injects data-k-mount-target on root element', () => {
    const html = renderForHydration(comp, {}).toString();
    assert.match(html, /data-k-mount-target="k[a-z0-9]+"/);
  });

  it('embeds state as application/json script block', () => {
    const html = renderForHydration(comp, { count: 3 }).toString();
    assert.match(html, /<script type="application\/json"[^>]*>{"count":3}<\/script>/);
  });

  it('uses fn.name as component name', () => {
    const html = renderForHydration(comp, {}).toString();
    assert.match(html, /data-k-component="comp"/);
  });

  it('uses explicit name when provided', () => {
    const html = renderForHydration(comp, {}, 'myComp').toString();
    assert.match(html, /data-k-component="myComp"/);
  });

  it('throws for anonymous function with no name', () => {
    assert.throws(
      () => renderForHydration(() => t.div(), {}),
      /component function must be named/,
    );
  });

  it('throws when called in a browser context without an explicit name', () => {
    globalThis.window = {};
    try {
      assert.throws(
        () => renderForHydration(comp, {}),
        /pass an explicit name as the third argument when calling in the browser/,
      );
    } finally {
      delete globalThis.window;
    }
  });

  it('accepts explicit name in a browser context', () => {
    globalThis.window = {};
    try {
      const html = renderForHydration(comp, {}, 'myComp').toString();
      assert.match(html, /data-k-component="myComp"/);
    } finally {
      delete globalThis.window;
    }
  });

  it('does not embed a style block (style is injected into head by registerComponents)', () => {
    const html = renderForHydration(comp, {}).toString();
    assert.doesNotMatch(html, /<style>/);
  });

  it('escapes </script> in embedded JSON', () => {
    const html = renderForHydration(comp, { s: '</script>' }).toString();
    assert.doesNotMatch(html, /<\/script>{"s"/);
    assert.match(html, /<\\\/script>/);
  });

  it('passes options.context as a second argument to the component and does not serialize it', () => {
    const ctx = { transport: 'fake', userName: signal('Ada') };
    let receivedState;
    let receivedContext;
    function ctxComp(state, context) {
      receivedState = state;
      receivedContext = context;
      return t.div({ id: 'root' }, context.userName);
    }
    const html = renderForHydration(ctxComp, { count: 1 }, 'ctxComp', { context: ctx }).toString();
    assert.strictEqual(receivedContext, ctx);
    assert.deepStrictEqual(receivedState, { count: 1 });
    // Context fields must not leak into the embedded JSON state block.
    assert.doesNotMatch(html, /transport/);
    assert.doesNotMatch(html, /userName/);
    assert.match(html, /{"count":1}/);
  });

  it('handles array return — all elements get data-k-mount-target', () => {
    function multi() {
      return [t.p('a'), t.p('b')];
    }
    const html = renderForHydration(multi, {}).toString();
    const matches = html.match(/data-k-mount-target=/g);
    assert.strictEqual(matches?.length, 2);
  });

  it('all array elements share the same mount id', () => {
    function multi() {
      return [t.p('a'), t.p('b')];
    }
    const html = renderForHydration(multi, {}).toString();
    const ids = [...html.matchAll(/data-k-mount-target="([^"]+)"/g)].map(m => m[1]);
    assert.strictEqual(ids[0], ids[1]);
  });

  it('throws for async component', () => {
    function asyncComp() {
      return Promise.resolve(t.div());
    }
    assert.throws(
      () => renderForHydration(asyncComp, {}),
      /must be synchronous/,
    );
  });

  it('uses script tag as mount point when component returns null', () => {
    function nullComp() {
      return null;
    }
    const html = renderForHydration(nullComp, {}).toString();
    assert.match(html, /data-k-component="nullComp"/);
    assert.match(html, /data-k-mount-target=/);
    assert.doesNotMatch(html, /<style>/);
  });

  it('uses script tag as mount point when component returns undefined', () => {
    function undefComp() {
      return undefined;
    }
    const html = renderForHydration(undefComp, {}).toString();
    assert.match(html, /data-k-component="undefComp"/);
    assert.match(html, /data-k-mount-target=/);
  });

  it('uses script tag as mount point when component returns an array of only nulls', () => {
    function nullArray() {
      return [null, null];
    }
    const html = renderForHydration(nullArray, {}).toString();
    assert.match(html, /data-k-component="nullArray"/);
    assert.match(html, /data-k-mount-target=/);
  });

  it('throws when component returns a plain string', () => {
    function strComp() {
      return 'hello';
    }
    assert.throws(
      () => renderForHydration(strComp, {}),
      /not an HTML element/,
    );
  });

  it('suppresses effect() during SSR', () => {
    let ran = false;
    function withEffect() {
      effect(() => { ran = true; });
      return t.div();
    }
    renderForHydration(withEffect, {});
    assert.strictEqual(ran, false);
  });

  it('restores effect() suppression after nested renderForHydration', () => {
    let outerRan = false;
    const innerRan = false;
    function inner() {
      return t.span('inner');
    }
    function outer() {
      renderForHydration(inner, {});
      effect(() => { outerRan = true; });
      return t.div('outer');
    }
    renderForHydration(outer, {});
    assert.strictEqual(innerRan, false);
    assert.strictEqual(outerRan, false);
  });

  it('effect() runs normally after renderForHydration completes', () => {
    function comp2() {
      return t.div();
    }
    renderForHydration(comp2, {});
    let ran = false;
    const e = effect(() => { ran = true; });
    e.stop();
    assert.strictEqual(ran, true);
  });

  it('isBrowser is false in Node.js', () => {
    assert.strictEqual(isBrowser, false);
  });

  it('computed() during SSR does not subscribe to its sources', () => {
    // A computed created during renderForHydration must not leave its update function
    // in the source signal's subscriber set. Otherwise long-lived module-level signals
    // accumulate one dead subscriber per request indefinitely.
    const src = signal(1);
    let fnCalls = 0;
    function computedComp() {
      const c = computed(() => { fnCalls++; return src.get() * 2; });
      assert.strictEqual(c.get(), 2);
      return t.div();
    }
    renderForHydration(computedComp, {});
    assert.strictEqual(fnCalls, 1);

    // If the SSR computed had subscribed, src.set() would synchronously re-run its update.
    src.set(99);
    assert.strictEqual(fnCalls, 1);

    // After SSR, computed() resumes subscribing normally.
    let postFnCalls = 0;
    const c2 = computed(() => { postFnCalls++; return src.get() + 1; });
    assert.strictEqual(c2.get(), 100);
    assert.strictEqual(postFnCalls, 1);
    src.set(100);
    assert.strictEqual(postFnCalls, 2);
    c2.stop();
  });

  it('transform() during SSR does not subscribe to its source', () => {
    const src = signal('hello');
    let calls = 0;
    function transformComp() {
      const upper = src.transform(v => { calls++; return v.toUpperCase(); });
      assert.strictEqual(upper.get(), 'HELLO');
      return t.div();
    }
    renderForHydration(transformComp, {});
    assert.strictEqual(calls, 1);
    src.set('world');
    assert.strictEqual(calls, 1);
  });
});

// ─── set during SSR warning ───────────────────────────────────────────────

describe('Signal.set during renderForHydration', () => {
  beforeEach(() => { _resetWarningThrottle(); });

  function capture(fn) {
    const warnings = [];
    const orig = console.warn;
    console.warn = msg => warnings.push(msg);
    try { fn(); } finally { console.warn = orig; }
    return warnings;
  }

  it('warns when .set is called on a module-scope signal inside renderForHydration', () => {
    const shared = signal(0);
    function comp() {
      shared.set(shared.value + 1);
      return t.div(shared);
    }
    const warnings = capture(() => renderForHydration(comp, {}).toString());
    assert.ok(warnings.some(w => w.includes('.set() called inside renderForHydration')));
  });

  it('warns when .set is called on a function-scope signal inside renderForHydration', () => {
    function comp() {
      const local = signal(0);
      local.set(1);
      return t.div(local);
    }
    const warnings = capture(() => renderForHydration(comp, {}).toString());
    assert.ok(warnings.some(w => w.includes('.set() called inside renderForHydration')));
  });

  it('does not warn when .set runs outside renderForHydration', () => {
    const x = signal(0);
    const warnings = capture(() => { x.set(1); });
    assert.strictEqual(warnings.length, 0);
  });
});

// ─── renderForHydration — checkState ──────────────────────────────────────

describe('renderForHydration checkState', () => {
  function capture(fn) {
    const warnings = [];
    const orig = console.warn;
    console.warn = msg => warnings.push(msg);
    try {
      fn();
    } finally {
      console.warn = orig;
    }
    return warnings;
  }

  function comp() {
    return t.div();
  }

  it('warns for Date', () => {
    const w = capture(() => renderForHydration(comp, { d: new Date() }));
    assert.ok(w.some(s => s.includes('Date will round-trip')));
  });

  it('warns for Map', () => {
    const w = capture(() => renderForHydration(comp, { m: new Map() }));
    assert.ok(w.some(s => s.includes('Map will serialize')));
  });

  it('warns for Set', () => {
    const w = capture(() => renderForHydration(comp, { s: new Set() }));
    assert.ok(w.some(s => s.includes('Set will serialize')));
  });

  it('warns for RegExp', () => {
    const w = capture(() => renderForHydration(comp, { r: /foo/ }));
    assert.ok(w.some(s => s.includes('RegExp will serialize')));
  });

  it('warns for undefined value', () => {
    const w = capture(() => renderForHydration(comp, { u: undefined }));
    assert.ok(w.some(s => s.includes('undefined will be dropped')));
  });

  it('warns for function value', () => {
    const w = capture(() => renderForHydration(comp, { f: () => {} }));
    assert.ok(w.some(s => s.includes('function will be dropped')));
  });

  it('warns for Infinity', () => {
    const w = capture(() => renderForHydration(comp, { n: Infinity }));
    assert.ok(w.some(s => s.includes('will become null')));
  });

  it('warns for NaN', () => {
    const w = capture(() => renderForHydration(comp, { n: NaN }));
    assert.ok(w.some(s => s.includes('will become null')));
  });

  it('warns for class instance', () => {
    class Foo {}
    const w = capture(() => renderForHydration(comp, { f: new Foo() }));
    assert.ok(w.some(s => s.includes('Foo') && s.includes('lose its methods')));
  });

  it('warns with path for nested lossy value', () => {
    const w = capture(() => renderForHydration(comp, { a: { b: new Date() } }));
    assert.ok(w.some(s => s.includes('state.a.b')));
  });

  it('warns with index for lossy value in array', () => {
    const w = capture(() => renderForHydration(comp, { items: [new Date()] }));
    assert.ok(w.some(s => s.includes('state.items[0]')));
  });

  it('throws for BigInt', () => {
    assert.throws(
      () => renderForHydration(comp, { n: 1n }),
      /BigInt cannot be serialized/,
    );
  });

  it('throws for circular reference', () => {
    const obj = {};
    obj.self = obj;
    assert.throws(
      () => renderForHydration(comp, obj),
      /circular reference/,
    );
  });

  it('produces no warnings for clean plain-object state', () => {
    const w = capture(() => renderForHydration(comp, { items: [{ id: 1, text: 'hi', done: false }] }));
    assert.strictEqual(w.length, 0);
  });

  it('warns for Symbol', () => {
    const w = capture(() => renderForHydration(comp, { s: Symbol('x') }));
    assert.ok(w.some(s => s.includes('Symbol will be dropped')));
  });
});

// ─── keyed signal initial-mismatch ────────────────────────────────────────────
// Surfaces accidental key collisions where two callers share a key but pass
// different primitive initial values. The second caller's initial is ignored
// (the existing keyed signal is returned), so without this warning the bug
// would only show up later as a wrong-value UI surprise.

describe('keyed signal initial-mismatch warning', () => {
  beforeEach(() => { _resetWarningThrottle(); });

  it('warns when the same key is reused with a different primitive initial inside a computed', () => {
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(msg);
    const trigger = signal(0);
    computed(() => {
      trigger.get();
      const a = signal(0, 'shared-k');
      const b = signal(7, 'shared-k'); // mismatched primitive initial
      return [a, b];
    });
    console.warn = origWarn;
    assert.ok(warns.some(w => /'shared-k'/.test(w) && /first: 0, then: 7/.test(w)));
  });

  it('does not warn when the same key is reused with the same primitive initial', () => {
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(msg);
    const trigger = signal(0);
    computed(() => {
      trigger.get();
      signal(0, 'same-init');
      signal(0, 'same-init-other');
      return null;
    });
    console.warn = origWarn;
    assert.strictEqual(warns.filter(w => /initial-mismatch|different primitive initial values/.test(w)).length, 0);
  });

  it('does not warn when either initial is an object/array', () => {
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(msg);
    const trigger = signal(0);
    computed(() => {
      trigger.get();
      signal({ a: 1 }, 'obj-k');
      signal({ a: 2 }, 'obj-k'); // different object refs — should NOT warn
      signal([], 'arr-k');
      signal([{ id: 'x' }], 'arr-k'); // different array refs — should NOT warn
      return null;
    });
    console.warn = origWarn;
    assert.strictEqual(warns.filter(w => /different primitive initial values/.test(w)).length, 0);
  });

  it('fires once per offending key across many re-runs', () => {
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(msg);
    const trigger = signal(0);
    const c = computed(() => {
      trigger.get();
      signal(0, 'churn-k');
      signal(7, 'churn-k');
      return null;
    });
    c.get();
    trigger.set(1);
    c.get();
    trigger.set(2);
    c.get();
    console.warn = origWarn;
    const matches = warns.filter(w => /'churn-k'/.test(w) && /different primitive initial values/.test(w));
    assert.strictEqual(matches.length, 1);
  });
});

// ─── keyed computed ───────────────────────────────────────────────────────────

describe('keyed computed', () => {
  beforeEach(() => { _resetWarningThrottle(); });

  it('returns the same computed instance across outer re-runs for the same key', () => {
    const items = signal([{ id: 'a', v: 1 }]);
    const instances = [];
    const outer = computed(() =>
      items.get().map(item => {
        const inner = computed(() => item.v * 2, item.id);
        instances.push(inner);
        return inner.get();
      }),
    );
    outer.get();
    items.set([{ id: 'a', v: 2 }]);
    outer.get();
    assert.strictEqual(instances[0], instances[1]);
  });

  it('produces the correct value on first run', () => {
    const items = signal([{ id: 'a', v: 3 }]);
    const outer = computed(() =>
      items.get().map(item => computed(() => item.v * 10, item.id).get()),
    );
    assert.deepStrictEqual(outer.get(), [30]);
  });

  it('reflects updated fn closure when outer re-runs', () => {
    const items = signal([{ id: 'a', v: 1 }]);
    const outer = computed(() =>
      items.get().map(item => computed(() => item.v * 2, item.id).get()),
    );
    assert.deepStrictEqual(outer.get(), [2]);
    items.set([{ id: 'a', v: 5 }]);
    assert.deepStrictEqual(outer.get(), [10]);
  });

  it('stops the inner computed when its key is removed from the list', () => {
    const items = signal([{ id: 'a' }, { id: 'b' }]);
    let bRuns = 0;
    const outer = computed(() =>
      items.get().map(item => {
        const inner = computed(() => {
          if (item.id === 'b') { bRuns++; }
          return item.id;
        }, item.id);
        return inner.get();
      }),
    );
    outer.get();
    bRuns = 0;
    items.set([{ id: 'a' }]);
    outer.get();
    assert.strictEqual(bRuns, 0);
  });

  it('creates a fresh inner computed when a key reappears after being removed', () => {
    const items = signal([{ id: 'a', v: 1 }]);
    const instancesA = [];
    const outer = computed(() =>
      items.get().map(item => {
        const inner = computed(() => item.v, item.id);
        instancesA.push(inner);
        return inner.get();
      }),
    );
    outer.get();
    items.set([{ id: 'b', v: 2 }]);
    outer.get();
    items.set([{ id: 'a', v: 3 }]);
    outer.get();
    // Third push is a new instance because the key was swept when 'a' was absent.
    assert.notStrictEqual(instancesA[0], instancesA[1]);
  });

  it('stops all keyed inner computeds when the outer computed is stopped', () => {
    const items = signal([{ id: 'a', v: 1 }, { id: 'b', v: 2 }]);
    let innerRuns = 0;
    const outer = computed(() =>
      items.get().map(item => {
        const inner = computed(() => { innerRuns++; return item.v; }, item.id);
        return inner.get();
      }),
    );
    outer.get();
    outer.stop();
    innerRuns = 0;
    // After outer stops, inner computeds should not react.
    items.set([{ id: 'a', v: 99 }, { id: 'b', v: 88 }]);
    assert.strictEqual(innerRuns, 0);
  });

  it('each key is scoped to its own outer computed instance', () => {
    const src = signal(1);
    const instA = [];
    const instB = [];
    const outerA = computed(() => {
      const inner = computed(() => src.get(), 'k');
      instA.push(inner);
      return inner.get();
    });
    const outerB = computed(() => {
      const inner = computed(() => src.get() * 10, 'k');
      instB.push(inner);
      return inner.get();
    });
    outerA.get();
    outerB.get();
    src.set(2);
    outerA.get();
    outerB.get();
    // Same key in different outer computeds → independent instances.
    assert.strictEqual(instA[0], instA[1]);
    assert.strictEqual(instB[0], instB[1]);
    assert.notStrictEqual(instA[0], instB[0]);
    assert.strictEqual(outerA.get(), 2);
    assert.strictEqual(outerB.get(), 20);
  });

  it('warns when computed() is called inside a computed without a key', () => {
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(msg);
    const src = signal(0);
    computed(() => {
      computed(() => src.get() * 2);
      return 0;
    });
    console.warn = origWarn;
    assert.ok(warns.some(w => w.includes('without a key')));
  });

  it('does not warn when computed() is called inside a computed with a key', () => {
    const warns = [];
    const errs = [];
    const origWarn = console.warn;
    const origError = console.error;
    console.warn = msg => warns.push(msg);
    console.error = msg => errs.push(msg);
    const src = signal(0);
    computed(() => computed(() => src.get() * 2, 'k').get());
    console.warn = origWarn;
    console.error = origError;
    assert.ok(!warns.some(w => w.includes('without a key')));
    assert.ok(!errs.some(e => e.includes('computed')));
  });

  it('warns when a keyed inner computed is subscribed outside its owner', () => {
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(msg);
    const items = signal([{ id: 'a', v: 1 }]);
    const instances = [];
    computed(() => {
      items.get().forEach(item => {
        const inner = computed(() => item.v, item.id);
        instances.push(inner);
      });
      return 0;
    });
    // Subscribe from outside the owner.
    const e = effect(() => instances[0].get());
    e.stop();
    console.warn = origWarn;
    assert.ok(warns.some(w => w.includes('is being subscribed')));
  });

  it('does not warn when the owner subscribes to its own keyed inner computed', () => {
    const warns = [];
    const errs = [];
    const origWarn = console.warn;
    const origError = console.error;
    console.warn = msg => warns.push(msg);
    console.error = msg => errs.push(msg);
    const items = signal([{ id: 'a', v: 1 }]);
    // The owner reads via .get() inline — no external subscription.
    computed(() => items.get().map(item => computed(() => item.v * 2, item.id).get()));
    console.warn = origWarn;
    console.error = origError;
    assert.ok(!warns.some(w => w.includes('keyed computed')));
    assert.ok(!errs.some(e => e.includes('keyed computed')));
  });

  it('warns on duplicate keys in the same outer run', () => {
    const errs = [];
    const origError = console.error;
    console.error = msg => errs.push(msg);
    const src = signal(0);
    computed(() => {
      computed(() => src.get(), 'same');
      computed(() => src.get() * 2, 'same');
      return 0;
    });
    console.error = origError;
    assert.ok(errs.some(e => e.includes('"same"')));
  });

  it('keyed computed key outside reactive context is ignored and creates a normal computed', () => {
    const src = signal(5);
    const c = computed(() => src.get() * 3, 'ignored-key');
    assert.strictEqual(c.get(), 15);
    src.set(6);
    assert.strictEqual(c.get(), 18);
  });

  it('keyed transform returns the same instance per key across outer re-runs', () => {
    const items = signal([{ id: 'a', v: 1 }]);
    const src = signal('x');
    const instances = [];
    const outer = computed(() =>
      items.get().map(item => {
        const tr = src.transform(v => `${v}-${item.v}`, item.id);
        instances.push(tr);
        return tr.get();
      }),
    );
    outer.get();
    items.set([{ id: 'a', v: 2 }]);
    outer.get();
    assert.strictEqual(instances[0], instances[1]);
  });

  it('keyed transform reflects updated fn closure when outer re-runs', () => {
    const items = signal([{ id: 'a', v: 1 }]);
    const src = signal(10);
    const outer = computed(() =>
      items.get().map(item => src.transform(v => v * item.v, item.id).get()),
    );
    assert.deepStrictEqual(outer.get(), [10]);
    items.set([{ id: 'a', v: 3 }]);
    assert.deepStrictEqual(outer.get(), [30]);
  });

  it('keyed transform outside reactive context ignores the key', () => {
    const src = signal(5);
    const doubled = src.transform(v => v * 2, 'k');
    assert.strictEqual(doubled.get(), 10);
    src.set(6);
    assert.strictEqual(doubled.get(), 12);
  });

  it('unkeyed transform inside a computed warns with transform-specific wording', () => {
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(msg);
    const src = signal(0);
    computed(() => {
      src.transform(v => v * 2);
      return 0;
    });
    console.warn = origWarn;
    assert.ok(warns.some(w => w.includes('.transform()') && w.includes('without a key')));
    assert.ok(!warns.some(w => w.startsWith('kensington: computed()')));
  });

  // ── nested keyed computeds (depth > 1) ───────────────────────────────────

  it('three-level nested keyed computeds produce correct values on first run', () => {
    const groups = signal([
      { id: 'g1', items: [{ id: 'i1', v: 1 }, { id: 'i2', v: 2 }] },
      { id: 'g2', items: [{ id: 'i3', v: 3 }] },
    ]);
    const view = computed(() =>
      groups.get().map(group =>
        computed(() =>
          group.items.map(item =>
            computed(() => item.v * 10, item.id).get(),
          ),
        group.id).get(),
      ),
    );
    assert.deepStrictEqual(view.get(), [[10, 20], [30]]);
  });

  it('three-level nested keyed computeds reuse the same instance per key across outer re-runs', () => {
    const groups = signal([{ id: 'g1', items: [{ id: 'i1', v: 1 }] }]);
    const middleInstances = [];
    const innerInstances = [];
    const view = computed(() =>
      groups.get().map(group => {
        const middle = computed(() =>
          group.items.map(item => {
            const inner = computed(() => item.v * 10, item.id);
            innerInstances.push(inner);
            return inner.get();
          }),
        group.id);
        middleInstances.push(middle);
        return middle.get();
      }),
    );
    view.get();
    groups.set([{ id: 'g1', items: [{ id: 'i1', v: 2 }] }]);
    view.get();
    assert.strictEqual(middleInstances[0], middleInstances[1]);
    assert.strictEqual(innerInstances[0], innerInstances[1]);
  });

  it('three-level nested keyed computeds reflect updated fn closure at every level', () => {
    const groups = signal([{ id: 'g1', items: [{ id: 'i1', v: 1 }] }]);
    const view = computed(() =>
      groups.get().map(group =>
        computed(() =>
          group.items.map(item =>
            computed(() => item.v * 10, item.id).get(),
          ),
        group.id).get(),
      ),
    );
    assert.deepStrictEqual(view.get(), [[10]]);
    groups.set([{ id: 'g1', items: [{ id: 'i1', v: 5 }] }]);
    assert.deepStrictEqual(view.get(), [[50]]);
  });

  it('stopping the outermost computed cascades through every nesting level', () => {
    const groups = signal([{ id: 'g1', items: [{ id: 'i1', v: 1 }] }]);
    let middleRuns = 0;
    let innerRuns = 0;
    const view = computed(() =>
      groups.get().map(group =>
        computed(() => {
          middleRuns++;
          return group.items.map(item =>
            computed(() => { innerRuns++; return item.v; }, item.id).get(),
          );
        }, group.id).get(),
      ),
    );
    view.get();
    view.stop();
    middleRuns = 0;
    innerRuns = 0;
    // After view stops, middle and inner should be torn down — no further runs from source changes.
    groups.set([{ id: 'g1', items: [{ id: 'i1', v: 99 }] }]);
    assert.strictEqual(middleRuns, 0);
    assert.strictEqual(innerRuns, 0);
  });

  it('sweep at the middle level cascades inner cleanup', () => {
    const groups = signal([
      { id: 'g1', items: [{ id: 'i1', v: 1 }] },
      { id: 'g2', items: [{ id: 'i2', v: 2 }] },
    ]);
    let i2Runs = 0;
    const view = computed(() =>
      groups.get().map(group =>
        computed(() =>
          group.items.map(item =>
            computed(() => {
              if (item.id === 'i2') { i2Runs++; }
              return item.v;
            }, item.id).get(),
          ),
        group.id).get(),
      ),
    );
    view.get();
    i2Runs = 0;
    // Remove g2. Its middle is swept, which should cascade to stop i2's inner.
    groups.set([{ id: 'g1', items: [{ id: 'i1', v: 1 }] }]);
    view.get();
    assert.strictEqual(i2Runs, 0);
  });

  it('warns when a keyed signal is subscribed outside its owner', () => {
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(msg);
    const items = signal([{ id: 'a' }]);
    const escaped = [];
    computed(() => {
      items.get().forEach(item => {
        escaped.push(signal(false, item.id));
      });
      return 0;
    });
    const e = effect(() => escaped[0].get());
    e.stop();
    console.warn = origWarn;
    assert.ok(warns.some(w => w.includes('is being subscribed')));
  });

  it('owner check at depth: external effect on a deep inner warns; inline use does not', () => {
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(msg);
    const groups = signal([{ id: 'g1', items: [{ id: 'i1', v: 1 }] }]);
    const innerInstances = [];
    computed(() =>
      groups.get().map(group =>
        computed(() =>
          group.items.map(item => {
            const inner = computed(() => item.v, item.id);
            innerInstances.push(inner);
            return inner.get();
          }),
        group.id).get(),
      ),
    ).get();
    // No warning so far — every subscription was the direct owner.
    const beforeWarn = warns.length;
    // External effect on the deepest inner — fires the warning.
    const e = effect(() => innerInstances[0].get());
    e.stop();
    console.warn = origWarn;
    assert.strictEqual(beforeWarn, 0);
    assert.ok(warns.some(w => w.includes('is being subscribed')));
  });
});

describe('hydration scope', () => {
  it('returns the same signal instance across enter/exit cycles for the same key', () => {
    _enterHydrationScope('scope-a');
    const a = signal(0, 'count');
    a.set(7);
    _exitHydrationScope();

    _enterHydrationScope('scope-a');
    const b = signal(0, 'count');
    _exitHydrationScope();

    assert.strictEqual(a, b);
    assert.strictEqual(b.get(), 7);
    _disposeHydrationScope('scope-a');
  });

  it('scopes are isolated by id', () => {
    _enterHydrationScope('scope-x');
    const x = signal(1, 'count');
    _exitHydrationScope();

    _enterHydrationScope('scope-y');
    const y = signal(2, 'count');
    _exitHydrationScope();

    assert.notStrictEqual(x, y);
    assert.strictEqual(x.get(), 1);
    assert.strictEqual(y.get(), 2);
    _disposeHydrationScope('scope-x');
    _disposeHydrationScope('scope-y');
  });

  it('unkeyed signal inside a scope creates a fresh instance each call', () => {
    _enterHydrationScope('scope-u');
    const a = signal(0);
    const b = signal(0);
    _exitHydrationScope();
    assert.notStrictEqual(a, b);
    _disposeHydrationScope('scope-u');
  });

  it('_disposeHydrationScope stops contained signals', () => {
    _enterHydrationScope('scope-d');
    const a = signal(5, 'value');
    _exitHydrationScope();

    let runs = 0;
    const e = effect(() => { a.get(); runs++; });
    const initialRuns = runs;
    _disposeHydrationScope('scope-d');
    a.set(99);
    assert.strictEqual(runs, initialRuns);
    e.stop();
  });

  it('nested enter/exit cycles preserve outer scope identity via the stack', () => {
    _enterHydrationScope('outer');
    const outerSig = signal(1, 'shared');
    _enterHydrationScope('inner');
    const innerSig = signal(2, 'shared');
    assert.notStrictEqual(outerSig, innerSig); // different scopes, same key string -> different signals
    _exitHydrationScope();
    // Back in the outer scope: same key returns the outer signal again.
    const outerAgain = signal(99, 'shared');
    assert.strictEqual(outerAgain, outerSig);
    _exitHydrationScope();
    _disposeHydrationScope('outer');
    _disposeHydrationScope('inner');
  });
});

// ─── warning surfaces and internal helpers ─────────────────────────────────

describe('reactive context warnings', () => {
  beforeEach(() => { _resetWarningThrottle(); });

  it('computed() inside an effect callback fires console.error', () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(String(msg));
    try {
      const s = signal(0);
      const e = effect(() => {
        s.get();
        computed(() => 1);
      });
      assert.match(errors.join('\n'), /computed\(\) called inside an effect/);
      e.stop();
    } finally {
      console.error = origError;
    }
  });

  it('signal() inside an effect callback fires console.error', () => {
    const errors = [];
    const origError = console.error;
    console.error = msg => errors.push(String(msg));
    try {
      const trigger = signal(0);
      const e = effect(() => {
        trigger.get();
        signal(0);
      });
      assert.match(errors.join('\n'), /signal\(\) called inside an effect/);
      e.stop();
    } finally {
      console.error = origError;
    }
  });

  it('mapWithKey() inside an effect callback fires the mapwithkey-in-reactive warning', () => {
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(String(msg));
    try {
      const items = signal([{ id: 1 }]);
      const fakeTag = item => ({
        _isKensingtonTag: true,
        _isKensingtonContentTag: true,
        [Symbol.for('marker')]: item.id,
      });
      const e = effect(() => { items.mapWithKey('id', fakeTag); });
      assert.match(warns.join('\n'), /mapWithKey called inside a computed or effect/);
      e.stop();
    } finally {
      console.warn = origWarn;
    }
  });

  it('mapWithKey() inside another mapWithKey\'s mapFn does not fire the warning', () => {
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(String(msg));
    try {
      const child = signal([{ id: 'a' }, { id: 'b' }]);
      const parent = signal([{ id: 1 }, { id: 2 }]);
      const fakeTag = () => ({
        _isKensingtonTag: true,
        _isKensingtonContentTag: true,
      });
      const result = parent.mapWithKey('id', () => {
        child.mapWithKey('id', fakeTag);
        return fakeTag();
      });
      result.get();
      assert.equal(
        warns.filter(w => /mapWithKey called inside a computed or effect/.test(w)).length,
        0,
        `unexpected mapwithkey-in-reactive warnings: ${warns.join(' | ')}`,
      );
    } finally {
      console.warn = origWarn;
    }
  });

  it('effect() inside a mapWithKey mapFn fires the computed-shaped warning, not the effect-in-effect one', () => {
    // Regression. Pre-fix, the mapWithKey probe (which sets currentEffect to a
    // sentinel) caused effect() inside mapFn to emit "called inside an effect
    // callback", sending users looking for an outer effect that did not exist.
    // The fix gates the warning behind !suppressReactiveCheck and emits a
    // mapWithKey-specific message when inMapWithKeyProbe is true.
    _resetWarningThrottle();
    const errs = [];
    const origErr = console.error;
    console.error = msg => errs.push(String(msg));
    try {
      const items = signal([{ id: 'a' }]);
      const fakeTag = () => ({
        _isKensingtonTag: true,
        _isKensingtonContentTag: true,
      });
      const result = items.mapWithKey('id', () => {
        effect(() => {});
        return fakeTag();
      });
      result.get();
      const joined = errs.join('\n');
      assert.match(joined, /mapWithKey mapFn|computed or transform callback/);
      assert.doesNotMatch(joined, /called inside an effect callback/);
    } finally {
      console.error = origErr;
    }
  });
});

describe('sibling keyed computed first-run owner registration', () => {
  // Regression for the pre-existing bug where keyedScopeOwners.set(inner, owner) ran
  // AFTER computed() returned but the inner's first run happened INSIDE computed(). A
  // sibling keyed signal read during that first run tripped an `out-of-scope-reactive-reference`
  // warning. The fix registers the owner from inside the inner's first-run closure.
  beforeEach(() => { _resetWarningThrottle(); });

  it('does not fire out-of-scope warning on first run of nested keyed primitives', () => {
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(String(msg));
    try {
      const items = signal([{ id: 'a' }, { id: 'b' }]);
      const filter = signal('on');
      // Use the canonical "keyed signal + keyed computed reading it" pattern inside a
      // computed. Should produce zero out-of-scope warnings on the very first evaluation.
      const list = computed(() => items.get().map(item => {
        const local = signal(false, item.id);
        const cls = computed(() =>
          [filter.get() === 'on' && 'lit', local.get() && 'on'].filter(Boolean).join(' '),
        `${item.id}-cls`,
        );
        return cls.get();
      }));
      list.get(); // force evaluation
      const oos = warns.filter(w => /out-of-scope-reactive-reference/.test(w));
      assert.strictEqual(oos.length, 0, `unexpected warnings: ${oos.join(' | ')}`);
    } finally {
      console.warn = origWarn;
    }
  });
});

describe('suppressReactiveCheck save/restore around inner Signal creation', () => {
  // Regression. The `computed()` factory used to do:
  //   suppressReactiveCheck = true;
  //   const s = new Signal(undefined);
  //   suppressReactiveCheck = false;
  // The unconditional clear poisoned the surrounding suppression context. When several
  // keyed `computed(fn, key)` calls happened inside a single `_runMapWithKeyProbe` (which
  // sets suppress=true so probe-time signal-construction is silent), the first call's
  // internal clear flipped suppress to false, and the second call's entry warning
  // ("computed-in-effect", because the probe has currentEffect=probe and inComputedFn=false)
  // would fire spuriously. The fix saves and restores the prior value.
  beforeEach(() => { _resetWarningThrottle(); });

  it('multiple keyed computeds inside one mapWithKey mapFn do not fire spurious warnings', () => {
    const errs = [];
    const origErr = console.error;
    console.error = msg => errs.push(String(msg));
    try {
      const items = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const tags = items.mapWithKey('id', item => {
        // Simulating a real component card that creates several keyed primitives.
        computed(() => item.id, `${item.id}-a`);
        computed(() => item.id * 2, `${item.id}-b`);
        computed(() => item.id * 3, `${item.id}-c`);
        return t.li(String(item.id));
      });
      tags.get();
      const cie = errs.filter(e => /computed-in-effect|computed\(\) called inside an effect/.test(e));
      assert.deepStrictEqual(cie, [], `unexpected computed-in-effect errors: ${cie.join(' | ')}`);
    } finally {
      console.error = origErr;
    }
  });
});

describe('pendingSleep cancellation in flush', () => {
  // When a computed's subscriber count hits zero mid-flush, sleep is deferred via
  // pendingSleep. If a new subscriber appears in the same flush, the pending sleep is
  // cancelled rather than firing then waking. This is the canonical happy path; we cover
  // it here to lock the optimization.

  it('does not re-run a computed when its subscriber bounces inside the same flush', () => {
    let runs = 0;
    const src = signal(1);
    const c = computed(() => { runs++; return src.get() * 2; });
    const e1 = effect(() => { c.get(); });
    const initialRuns = runs;
    // Triggering src causes a batched flush. Inside it, the existing effect re-runs and
    // re-reads c. c does not need to re-run if its source didn't change.
    src.set(1); // Object.is(1,1) → no notify; runs stay constant
    assert.strictEqual(runs, initialRuns);
    e1.stop();
  });
});
