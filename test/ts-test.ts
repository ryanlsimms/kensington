import Kensington from "../types";
import type { ContentMethod } from 'kensington';

class MyMarkup extends Kensington {
  someCustomElement: ContentMethod<{ someCustomAttribute?: boolean | 42 }> = this.createCustomTag(
    'custom-element',
    { 'some-custom-attribute': [Boolean, 42] },
  );
  simpleElement: ContentMethod = this.createCustomTag('simple-element');
}

const t = new MyMarkup({ runValidation: false });
t.htmlWithDocType({ lang: 'en', noGood: 'I Should Fail' }, t.body("hello world"));
t.htmlWithDocType('content', 'too much')
t.simpleElement({}, 'some content');
t.someCustomElement({ ariaLabel: 'something', someCustomAttribute: 42, noGood: 'I Should Fail' }, 'content');
t.someCustomElement('some content', 'some more content'); // should be invalid
t.someCustomElement(t.div('some content')); // should be invalid
t.a({ ariaLabel: 'something', id: 'something', noGood: '' });
t.a('some content', 'some more content');
t.a('some content');
t.br({ style: 'display: none' }, 'some content')

