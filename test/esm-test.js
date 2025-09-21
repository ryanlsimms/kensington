import Kensington, { t } from 'kensington';
import { describe, it } from 'node:test';
import assert from 'node:assert';


describe('other', () => {
  it.todo('destructure tags');
  it.todo('indentation level');
});

describe('content tag', () => {
  it.todo('generates tag', () => {
    console.log(t.svg(t.use({ href: '/images/calendar-icon.svg' })).toString())
    assert.strictEqual(t.div().toString(), '<div></div>');
  });
  it.todo('ignores empty content');
  it.todo('encodes content');
  it.todo('short content');
  it.todo('converts line breaks to br tags');
});

describe('literal tag', () => {
  it.todo('does not encode script tag');
  it.todo('encodes pre tag');
});


describe('void tag', () => {

});

describe('svg tag', () => {

});

describe('math tags', () => {

})

describe('validates arguments', () => {
  it.todo('allows only content');
  it.todo('allows only attributes');
  it.todo('allows both attributes and content');
  it.todo('does not allow multiple attribute arguments');
  it.todo('does not allow multiple content arguments');
  it.todo('does not allow three arguments');
  it.todo('does not allow invalid content');
});

describe('attributes', () => {
  it.todo('converts camelCase');
  it.todo('converts nested');
  it.todo('data and aria');
  it('throws with invalid attributes', () => {
    const tt = new Kensington({ validationLevel: 'error' });
    assert.throws(() => tt.div({ badAttribute: 'value' }));
  });
  it.todo('throws with invalid attribute value');
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
