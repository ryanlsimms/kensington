import Kensington, { t } from 'kensington';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('other', () => {
  it('destructure tags', () => {
    const { div } = t;
    assert.strictEqual(div().toString(), '<div></div>');
  });
  it('indentation level', () => {
    assert.strictEqual(t.div(t.div(t.div())).toString(), '<div>\n  <div>\n    <div></div>\n  </div>\n</div>');
  });
});

describe('content tag', () => {
  it('generates tag', () => {
    assert.strictEqual(t.div().toString(), '<div></div>');
  });
  it('ignores empty content', () => {
    assert.strictEqual(t.div('').toString(), '<div></div>');
    assert.strictEqual(t.div(null).toString(), '<div></div>');
    assert.strictEqual(t.div([]).toString(), '<div></div>');
    assert.strictEqual(t.div('content\n\n').toString(), '<div>\n  content<br>\n</div>');
  });
  it('encodes content', () => {
    assert.strictEqual(t.div('<div></div>').toString(), '<div>&#x3C;div&#x3E;&#x3C;/div&#x3E;</div>');
  });
  it('short content', () => {
    assert.strictEqual(t.div('hi').toString(), '<div>hi</div>');
  });
  it('converts line breaks to br tags', () => {
    assert.strictEqual(t.div('line1\nline2').toString(), '<div>\n  line1<br>\n  line2\n</div>');
  });
  it('literal content', () => {
    assert.strictEqual(t.div(t.literal('<div></div>')).toString(), '<div>\n  <div></div>\n</div>');
  });
  it('literal script content', () => {
    assert.throws(() => t.div(t.literal('<script></script>')).toString());
    assert.strictEqual(t.div(t.unsafeLiteral('<script>console.log("hello");</script>')).toString(), '<div>\n  <script>console.log("hello");</script>\n</div>');
  });
});

describe('literal tag', () => {
  it('does not encode script tag', () => {
    assert.strictEqual(
      t.body(t.script(`const x = "<div></div>";\nconsole.log(x);`)).toString(),
      `<body>\n  <script>const x = "<div></div>";\n  console.log(x);</script>\n</body>`
    )
  });
  it('encodes pre tag', () => {
    assert.strictEqual(
      t.div(t.pre('<div></div')).toString(),
      `<div>\n  <pre>&#x3C;div&#x3E;&#x3C;/div</pre>\n</div>`,
    );
  });
  it('does not add whitespace', () => {
    assert.strictEqual(
      t.div(t.div(t.textarea('line1\r\nline2'))).toString(),
      `<div>\n  <div>\n    <textarea>line1\nline2</textarea>\n  </div>\n</div>`,
    );
    assert.strictEqual(
      t.div(t.div(t.pre('line1\r\nline2'))).toString(),
      `<div>\n  <div>\n    <pre>line1\nline2</pre>\n  </div>\n</div>`,
    );
  });
});


describe('void tag', () => {
  it('renders properly', () => {
    assert.strictEqual(t.hr().toString(), '<hr>');
  })
  it('does not allow content', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.hr({}, 'I am not allowed'));
  })
});

describe('validates arguments', () => {
  it('allows only content', () => {
    assert.strictEqual(t.div('content').toString(), '<div>content</div>');
    assert.strictEqual(t.div(['content']).toString(), '<div>content</div>');
  });
  it('allows only attributes', () => {
    assert.strictEqual(t.div({ id: 'abc' }).toString(), '<div id="abc"></div>');
  });
  it('allows both attributes and content', () => {
    assert.strictEqual(t.div({ id: 'abc' }, 'content').toString(), '<div id="abc">content</div>');
  });
  it('does not allow multiple attribute arguments', () => {
    assert.throws(() => t.div({ class: 'something' }, { id: 'something' }).toString());
  });
  it('does not allow multiple content arguments', () => {
    assert.throws(() => t.div('content', t.div('content')).toString());
  });
  it('does not allow three arguments', () => {
    assert.throws(() => t.div({ id: 'something' }, t.div('content'), t.div('invalid argument')).toString());
  });
  it('does not allow invalid content', () => {
    assert.throws(() => t.div(new Date()).toString());
  });
});

describe('attributes', () => {
  it('converts camelCase', () => {
    assert.strictEqual(t.div({ dataBsTarget: 'abc' }).toString(), '<div data-bs-target="abc"></div>');
  });
  it('converts nested', () => {
    assert.strictEqual(t.div({ data: { bs: { target: 'abc' } } }).toString(), '<div data-bs-target="abc"></div>');
  });
  it('converts numbers', () => {
    assert.strictEqual(t.td({ colspan: 3 }).toString(), '<td colspan="3"></td>');
  });
  it('aria', () => {
    assert.strictEqual(t.div({ ariaLabel: 'abc' }).toString(), '<div aria-label="abc"></div>');
  });
  it('throws with invalid attributes', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ badAttribute: 'value' }));
  });
  it('throws with invalid attribute value', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.form({ method: 'delete' }).toString());
  });

  describe('validation', () => {
    it('by function', () => {
      class Custom extends Kensington {
        customElement = this.createCustomTag('custom-element', { 'custom-attr': val => (val > 5) })
      }
      const tt = new Custom({ validationLevel: 'error' });
      assert.throws(() => tt.customElement({ customAttr: 4 }).toString());
      assert.doesNotThrow(() => tt.customElement({ customAttr: 6 }).toString())
    });

    it('id starts with number', () => {
      const tt = new Kensington({ validationLevel: 'error' });
      assert.throws(() => tt.div({ id: '123-abc' }).toString());
    });
  })
});

describe('additional namespaces', () => {
  it('allows extra namespaces', () => {
    const tt = new Kensington({ validationLevel: 'error', additionalNamespaces: 'htmx' });
    assert.strictEqual(tt.div({ htmxTitle: 'abc' }).toString(), '<div htmx-title="abc"></div>');
  })
});

describe('custom instance', () => {
  it('validationLevel', (test, done) => {
    let callCount = 0;
    const errorMessage = 'invalid attribute `id="123-abc"` given for element `div`';
    console.error = function(message) {
      if (++callCount === 2) {
        assert.ok(message.startsWith(`Error: ${errorMessage}\n`));
        done();
      } else {
        assert.strictEqual(message, errorMessage);
      }
    };
    let tt = new Kensington({ validationLevel: 'warn' });
    assert.doesNotThrow(() => tt.div({ id: '123-abc' }).toString());
  })
});

describe('custom tag', () => {
  it('creates a custom tag', () => {
    class Custom extends Kensington {
      customElement = this.createCustomTag('custom-element')
    }
    const tt = new Custom({ validationLevel: 'error' });
    assert.strictEqual(tt.customElement().toString(), '<custom-element></custom-element>');
  });
  it('validates attribute type', () => {
    class CustomBad extends Kensington {
      customElement = this.createCustomTag('custom-element', { date: null })
    }
    class CustomGood extends Kensington {
      customElement = this.createCustomTag('custom-element', { date: String })
    }
    assert.throws(() => { new CustomBad({ validationLevel: 'error' }); });
    assert.doesNotThrow(() => {
      const tt = new CustomGood({ validationLevel: 'error' });
      tt.customElement({ date: 'some date' });
    });
  });
  it('validates array attributes', () => {
    class Custom extends Kensington {
      customElement = this.createCustomTag('custom-element', { customAttr: [Number, 'a string'] })
    }
    const tt = new Custom({ validationLevel: 'error' });
    assert.doesNotThrow(() => tt.customElement({ customAttr: 4 }).toString())
    assert.doesNotThrow(() => tt.customElement({ customAttr: 'a string' }).toString())
    assert.throws(() => tt.customElement({ customAttr: 'some other string' }).toString())
  });
});
