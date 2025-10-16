import Kensington, { t } from 'kensington';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('other', () => {
  it('destructure tags', () => {
    const { div } = t;
    assert.strictEqual(div().toString(), '<div></div>');
  });
  it.todo('indentation level');
});

describe('content tag', () => {
  it.todo('generates tag', () => {
    assert.strictEqual(t.div().toString(), '<div></div>');
  });
  it('ignores empty content', () => {
    assert.strictEqual(t.div('').toString(), '<div></div>');
    assert.strictEqual(t.div(null).toString(), '<div></div>');
    assert.strictEqual(t.div([]).toString(), '<div></div>');
    assert.strictEqual(t.div('content\n\n').toString(), '<div>\n  content<br>\n</div>'); // todo remove empty last line
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
  it.todo('does not allow multiple attribute arguments');
  it.todo('does not allow multiple content arguments');
  it.todo('does not allow three arguments');
  it.todo('does not allow invalid content');
});

describe('attributes', () => {
  it.todo('converts camelCase');
  it.todo('converts nested');
  it.todo('converts numbers');
  it.todo('data and aria');
  it('throws with invalid attributes', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ badAttribute: 'value' }));
  });
  it.todo('throws with invalid attribute value');

  describe('validation', () => {
    it('by function', () => {
      class Custom extends Kensington {
        customElement = this.createCustomTag('custom-element', { 'custom-attr': val => (val > 5) })
      }
      const tt = new Custom({ validationLevel: 'error' });
      assert.throws(() => tt.customElement({ customAttr: 4 }));
      assert.doesNotThrow(() => tt.customElement({ customAttr: 6 }))
    });

    it.todo('id starts with number')
  })
});

describe('additional namespaces', () => {
  it.todo('allows extra namespaces')
});

describe('custom instance', () => {
  it.todo('validationLevel')
});

describe('custom tag', () => {
  it.todo('creates a custom tag');
  it.todo('validates primitive attributes');
  it.todo('validates array attributes');
});

//
// class MyMarkup extends Kensington {
//   someCustomElementA = this.createCustomTag('custom-element-a', { someCustomAttribute: [Boolean, 42] });
//   // someCustomElementB = this.createCustomTag('custom-element-b', { 'some-custom-attribute': String });
// }
//
// const t = new MyMarkup({ validationLevel: 'warn', additionalNamespaces: ['hx'] });
//
// try {
//   const textarea = t.textarea({}, '');
//   console.log(textarea.toString());
//   const div = t.div({}, '').toString();
//   const br = t.br();
//   // const html = t.div('content', 'too much').toString();
//   // const div = t.div(t.div(t.div(0))).toString();
//   const button = t.button({ hxPost: '/something' }, 'A Button');
//   const a = t.a({ ariaLabel: 'something' })
//   const option = t.option({ disabled: false, selected: false, value: '-- none --' }, '-- None --');
//   const html = t.someCustomElementA({ ariaLabel: 'good', someCustomAttribute: undefined })
//   const html2 = t.a({ id: 'something', data: { test: 'some-value' } }, 'a link');
//   const html4 = t.div(t.div(t.pre({}, JSON.stringify({ a: 'b', c: 'd' }, null, 2))));
//   const scriptTag1 = t.script({ async: true, src: 'https://sf-saas.cdn-apple.com/2.2.0/sf-symbol.js' });
//   const circleTag = t.circle({ requiredExtensions: 'something' });
//   const formTag1 = t.form({ acceptCharset: 'utf-8' });
//   const formTag2 = t.form({ 'accept-charset': 'ISO-8859-1' });
//   const scriptTag2 = t.script(`console.log("hello");`)
//   const preTag = t.pre(`TypeError: Cannot read properties of undefined (reading 'localDateTimeObj')
//     at formatActivityGroup (file:///Users/ryansimms/RubymineProjects/pulse-web/app/data-fetchers/utils/format-activity-group.js:11:59)
//     at file:///Users/ryansimms/RubymineProjects/pulse-web/app/routes/vpm-routes.js:50:56
//     at Array.map (<anonymous>)
//     at file:///Users/ryansimms/RubymineProjects/pulse-web/app/routes/vpm-routes.js:50:38
//     at Array.forEach (<anonymous>)
//     at file:///Users/ryansimms/RubymineProjects/pulse-web/app/routes/vpm-routes.js:47:28
//     at Array.forEach (<anonymous>)
//     at file:///Users/ryansimms/RubymineProjects/pulse-web/app/routes/vpm-routes.js:44:32`);
//   // console.log(preTag.toString());
// //   console.log(html.toString());
//   // console.log(circleTag.toString());
//   // console.log(formTag1.toString());
//   // console.log(formTag2.toString());
//   process.exit(0);
// } catch (err) {
//   console.error(err);
//   process.exit(1);
// }
