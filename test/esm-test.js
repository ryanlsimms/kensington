import Kensington from 'kensington';

class MyMarkup extends Kensington {
  someCustomElement = this.createCustomTag('custom-element', { 'some-custom-attribute': String });
}

const t = new MyMarkup({ runValidation: true });

try {
  // const html = t.someCustomElement({ someCustomAttribute: 'asdf' })
  // const html2 = t.a({ id: 'something', data: { test: 'some-value' } }, 'a link');
  // const html3 = t.htmlWithDocType({ lang: 'en' }, t.body("hello world"));
  // const html4 = t.div(t.div(t.pre({}, JSON.stringify({ a: 'b', c: 'd' }, null, 2))));
  // const scriptTag = t.script({ asyc: true, src: 'https://sf-saas.cdn-apple.com/2.2.0/sf-symbol.js' });
  const circleTag = t.circle({ r: 30 });
  console.log(circleTag.toString());
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
