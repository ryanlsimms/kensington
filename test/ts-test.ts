import Kensington from "../types";
import type { ContentMethod } from 'kensington';

class MyMarkup extends Kensington {
  someCustomElement: ContentMethod<{ someCustomAttribute?: string }> = this.createCustomTag('custom-element', { 'some-custom-attribute': String });
}

const t = new MyMarkup({ runValidation: false });

const html = t.someCustomElement({ someCustomAttribute: 'asdf' })
const html2 = t.a({ id: 'something' });
const html3 = t.div();
console.log(html.toString());

