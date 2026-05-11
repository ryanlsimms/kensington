import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import Kensington, { computed, effect, isBrowser, renderForHydration, signal, t } from 'kensington';

import attributesArrayFromObject from '../../esm/lib/attributes-array-from-object.js';

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
    it('warns on true value when validationLevel is warn', (test, done) => {
      const expectedMessage = 'invalid attribute `style="color: true"` given for element `div`';
      let callCount = 0;
      const logger = message => {
        if (++callCount === 2) {
          assert.ok(message.startsWith(`Error: ${expectedMessage}\n`));
          done();
        } else {
          assert.strictEqual(message, expectedMessage);
        }
      };
      const tt = new Kensington({ validationLevel: 'warn', logger });
      assert.doesNotThrow(() => tt.div({ style: { color: true, fontWeight: 'bold' } }).toString());
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
  it('warn validation level calls logger with message and stack', (test, done) => {
    let callCount = 0;
    const errorMessage = 'invalid attribute `id="123-abc"` given for element `div`';
    const logger = message => {
      if (++callCount === 2) {
        assert.ok(message.startsWith(`Error: ${errorMessage}\n`));
        done();
      } else {
        assert.strictEqual(message, errorMessage);
      }
    };
    const tt = new Kensington({ validationLevel: 'warn', logger });
    assert.doesNotThrow(() => tt.div({ id: '123-abc' }).toString());
  });
});

// ─── slim build ───────────────────────────────────────────────────────────

describe('slim build', () => {
  it('throws when validationLevel is not off', async () => {
    const { default: SlimKensington } = await import('../../dist/kensington.slim.js');
    assert.throws(
      () => new SlimKensington({ validationLevel: 'warn' }),
      { message: "The slim build does not include attribute data. Set validationLevel: 'off' or use the full build." },
    );
  });
  it('does not throw when validationLevel is off', async () => {
    const { default: SlimKensington } = await import('../../dist/kensington.slim.js');
    assert.doesNotThrow(() => new SlimKensington({ validationLevel: 'off' }));
  });
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
  it('stop() on a chained transform unsubscribes from the intermediate but leaves it live', () => {
    const s = signal(2);
    const intermediate = s.transform(v => v * 3);
    const final = intermediate.transform(v => v + 1);
    final.stop();
    s.set(4);
    assert.strictEqual(final.get(), 7);
    assert.strictEqual(intermediate.get(), 12);
  });
  it('throws when .set() is called on a transform result', () => {
    const s = signal(1);
    const t2 = s.transform(v => v * 2);
    assert.throws(() => t2.set(99), /Cannot call .set\(\) on a computed or derived signal/);
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

// ─── renderForHydration ────────────────────────────────────────────────────

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

  it('does not embed a style block (style is injected into head by registerComponents)', () => {
    const html = renderForHydration(comp, {}).toString();
    assert.doesNotMatch(html, /<style>/);
  });

  it('escapes </script> in embedded JSON', () => {
    const html = renderForHydration(comp, { s: '</script>' }).toString();
    assert.doesNotMatch(html, /<\/script>{"s"/);
    assert.match(html, /<\\\/script>/);
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
