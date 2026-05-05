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
  it('ignores null, undefined, and empty string in content array', () => {
    assert.strictEqual(t.div([null, undefined, '', 'real']).toString(), '<div>real</div>');
  });
  it('literal content', () => {
    assert.strictEqual(t.div(t.literal('<div></div>')).toString(), '<div>\n  <div></div>\n</div>');
  });
  it('literal script content throws', () => {
    assert.throws(() => t.div(t.literal('<script></script>')).toString());
    assert.strictEqual(t.div(t.unsafeLiteral('<script>console.log("hello");</script>')).toString(), '<div>\n  <script>console.log("hello");</script>\n</div>');
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
  it('inlineComment throws on non-string/number', () => {
    assert.throws(() => t.inlineComment({}));
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
  it('throws on three arguments', () => {
    assert.throws(() => t.div({ id: 'something' }, t.div('content'), t.div('invalid argument')).toString());
  });
  it('throws on invalid content type', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div(new Date()).toString());
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
});

// ─── namespaces ────────────────────────────────────────────────────────────

describe('namespaces', () => {
  it('allows extra attribute namespaces', () => {
    const tt = new Kensington({ validationLevel: 'error', additionalNamespaces: 'htmx' });
    assert.strictEqual(tt.div({ htmxTitle: 'abc' }).toString(), '<div htmx-title="abc"></div>');
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
