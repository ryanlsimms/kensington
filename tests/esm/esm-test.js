import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import Kensington, { t } from 'kensington';

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
  it('renders NaN and Infinity as strings when validationLevel is off', () => {
    assert.strictEqual(t.div(NaN).toString(), '<div>NaN</div>');
    assert.strictEqual(t.div(Infinity).toString(), '<div>Infinity</div>');
  });
  it('ignores false from short-circuit conditional content', () => {
    const show = false;
    assert.strictEqual(t.div([show && t.span('hi'), 'real']).toString(), '<div>real</div>');
  });
  it('literal content', () => {
    assert.strictEqual(t.div(t.literal('<div></div>')).toString(), '<div>\n  <div></div>\n</div>');
  });
  it('literal script content throws', () => {
    assert.throws(() => t.div(t.literal('<script></script>')).toString());
    assert.throws(() => t.literal('<SCRIPT>alert(1)</SCRIPT>'));
    assert.strictEqual(t.div(t.unsafeLiteral('<script>console.log("hello");</script>')).toString(), `<div>\n  <script>console.log("hello");</script>\n</div>`);
  });
  it('literal throws on non-string input with a clear message', () => {
    assert.throws(() => t.literal(null), { message: 'literal() only accepts a string' });
    assert.throws(() => t.literal(42), { message: 'literal() only accepts a string' });
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
  it('inlineComment throws on non-string/number', () => {
    assert.throws(() => t.inlineComment({}));
  });
  it('inlineComment strips "--" when validationLevel is off', () => {
    assert.strictEqual(t.inlineComment('a -- b').toString(), '<!-- a  b -->');
  });
  it('inlineComment throws when validationLevel is error and text contains "--"', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.inlineComment('a -- b'), /must not contain/);
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
