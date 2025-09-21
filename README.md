This template engine is a way to create html via nested method calls.  Each tag is a method on a TemplateEngine instance which can receive an object literal of attributes and their values, and/or content.  The output is a nicely formatted html string.

* arguments can be an object of attributes, content (string, element, or array of either), or both
* nested attributes are converted to kebab-case `{ data: { bs: { toggle: 'collapse' } } }` becomes `data-bs-toggle="collapse"`
* camelCase attibute become kebabcase `{ dataBsToggle: 'collapse' }` becomes `data-bs-toggle="collapse"`
* attributes are validated against those found [here](https://html.spec.whatwg.org/multipage/indices.html#elements-3)
* attributes with a boolean value will either be included or not: `t.input({ type: 'checkbox', checked: true })` becomes `<input type="checkbox" checked>` or `<input type="checkbox" />` if `checked` is false
* [Global attributes](https://html.spec.whatwg.org/multipage/dom.html#global-attributes) are always allowed, along with `aria-*` and `data-*` attributes.
* Additional namespaces (like `hx` when using [htmx](https://htmx.org)) can be added by passing the `additionalNamespaces` property to the constructor
* `validationLevel` can be set to `off`, `warn`, or `error`.
* the `.literal` method allows you to pass in html as a string.
* `.htmlWithDocType` is the same as `.html`, but adds the `<!DOCTYPE html>` tag to the beginning of the string.
* call `.toString()` on the outermost method to expicitly convert to string.  This can often be omitted if the output is sent as a string.
* string interpolation automatically converts the tag to string ``` `${t.html(t.body('hello'))}` ```
* you can add your own custom elements:
    * extend the `Kensington` class with your own
    * set a property equal to `this.createCustomTag()` with the following arguments
        * `tagName` - the name that is used in the `<some-custom-element></some-custom-element>`
        * `allowedAttributes` - an optional array of allowed attributes.  Global and data/aria attributes are always allowed

### Example
```typescript
// TypeScript
import Kensington from 'kensington';
import type { ContentMethod } from 'kensington';

declare module 'kensington' {
  interface NameSpaceAttributes {
    [key: `hx${string}`]: string | object
  }
}

class MyTemplateEngine extends Kensington {
  someCustomElement: ContentMethod<{ someCustomAttribute?: boolean | 42 }> = this.createCustomTag('custom-element', { 'some-custom-attribute': [Boolean, 42] });
}
```
```javascript
// JavaScript
import Kensington from 'kensington.js';

class MyTemplateEngine extends Kensington {
  someCustomElement = this.createCustomTag('some-custom-element', { 'some-custom-attribute': [Boolean, 42] });
}
```
```javascript
const t = new MyTemplateEngine({ validationLevel: 'warn', additionalNamespaces: ['hx'] });

const html = t.htmlWithDoctype({ lang: 'en' }, [
  t.head(t.title('My Page Title')),
  t.body(
    t.main({ class: 'container' }, [
      t.h1('My Great Project'),
      t.h3({ class: 'small' }, 'a new way'),
      t.hr({ class: 'fancy-line' }),
      t.section([
        'To Do List',
        t.ul([
          t.li({
            data: {
              bs: {
                toggle: 'collapse',
                target: '#some-id',
              },
            },
            ariaExpanded: 'false',
          }, 'this'),
          t.li([
            t.input({ id: 'coolness', type: 'checkbox', checked: isCool }),
            t.label({ for: 'coolness'}, 'Cool?')
          ]),
          t.literal('<li>some regular html</li>'),
        ]),
      ]),
    ]),
  ),
]).toString();
```
```html
/* Generated html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>My Page Title</title>
  </head>
  <body>
    <main class="container">
      <h1>My Great Project</h1>
      <h3 class="small">a new way</h3>
      <hr class="fancy-line">
      <section>
        To Do List
        <ul>
          <li data-bs-toggle="collapse" data-bs-target="#some-id" aria-expanded="false">this</li>
          <li>
            <input id="coolness" type="checkbox">
            <label for="coolness">Cool?</label>
          </li>
          <li>some regular html</li>
        </ul>
      </section>
    </main>
  </body>
</html>
*/
```

```javascript
// import instance directly if you don't need customization
import { t } from 'kensington';
```


### TODO
* tests
* better typing of attributes
* function types
* type declaration file for custom instance
* validate/type data and aria attributes
* skip validation per tag (maybe a bad idea)
* readme demos express integration
* mention use of html-validate
* clean up error stack
* what version of node/js is necessary?
* comments
* better namespace non-tag methods to avoid potential future collisions
* better monkey patching
* html to kensington transpiler?
* conditionally allow attributes based on other attributes (multiple allowed only on inputs of type="file")
* build dist for browser
* make line break -> <br> optional
* pass logger to constructor instead of console.log
* better format css
* configurable indentation level
