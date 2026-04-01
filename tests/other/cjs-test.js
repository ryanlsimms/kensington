const { default: Kensington } = require('kensington');
const { trackAttributes } = require('kensington/attributes');

const t = new Kensington({ validationLevel: 'off' });

const html = t.a({ sd: 'something' });
const html2 = t.div({ id: 'something' });
const textarea = t.div(t.div(t.textarea('here is a comment.\r\nhere is another')));
console.log(textarea.toString());

