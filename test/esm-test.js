import Kensington from 'kensington';

class MyMarkup extends Kensington {
  someCustomElementA = this.createCustomTag('custom-element-a', { someCustomAttribute: String });
  someCustomElementB = this.createCustomTag('custom-element-b', { 'some-custom-attribute': String });
}

const t = new MyMarkup({ runValidation: true });

try {
  const html = t.someCustomElementA({ someCustomAttribute: 'asdf' })
  const html2 = t.someCustomElementB({ someCustomAttribute: 'asdf' })
  // const html2 = t.a({ id: 'something', data: { test: 'some-value' } }, 'a link');
  // const html3 = t.htmlWithDocType({ lang: 'en' }, t.body("hello world"));
  // const html4 = t.div(t.div(t.pre({}, JSON.stringify({ a: 'b', c: 'd' }, null, 2))));
  // const scriptTag = t.script({ async: true, src: 'https://sf-saas.cdn-apple.com/2.2.0/sf-symbol.js' });
  // const circleTag = t.circle({ requiredExtensions: 'something' });
  // const formTag1 = t.form({ acceptCharset: 'utf-8' });
  // const formTag2 = t.form({ 'accept-charset': 'ISO-8859-1' });
  // const scriptTag = t.script(`console.log("hello");`)
//   const preTag = t.pre((`TypeError: Cannot read properties of undefined (reading 'localDateTimeObj')
//     at formatActivityGroup (file:///Users/ryansimms/RubymineProjects/pulse-web/app/data-fetchers/utils/format-activity-group.js:11:59)
//     at file:///Users/ryansimms/RubymineProjects/pulse-web/app/routes/vpm-routes.js:50:56
//     at Array.map (<anonymous>)
//     at file:///Users/ryansimms/RubymineProjects/pulse-web/app/routes/vpm-routes.js:50:38
//     at Array.forEach (<anonymous>)
//     at file:///Users/ryansimms/RubymineProjects/pulse-web/app/routes/vpm-routes.js:47:28
//     at Array.forEach (<anonymous>)
//     at file:///Users/ryansimms/RubymineProjects/pulse-web/app/routes/vpm-routes.js:44:32
// `));
  console.log(html.toString());
  console.log(html2.toString());
  // console.log(circleTag.toString());
  // console.log(formTag1.toString());
  // console.log(formTag2.toString());
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
