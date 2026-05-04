# Kensington

[![npm](https://img.shields.io/npm/v/kensington)](https://www.npmjs.com/package/kensington)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

HTML/SVG/MathML template engine for JavaScript and TypeScript. Every tag is a method on a `Kensington` instance that returns a tag object serialisable to a formatted HTML string via `.toString()` or a live DOM node via `.toElement()`.

## Installation

```bash
npm install kensington
```

Or in a browser without a build step, via CDN:

```html
<script type="module">
  import Kensington from 'https://cdn.jsdelivr.net/npm/kensington/dist/kensington.min.js';
</script>
```

**Slim build** — omits attribute validation data (~77% smaller minified); use when `validationLevel` is `'off'`:

```html
<script type="module">
  import Kensington from 'https://cdn.jsdelivr.net/npm/kensington/dist/kensington.slim.min.js';
</script>
```

## Example

```javascript
import { t } from 'kensington'; // shared default instance

const isCool = true;

const page = t.htmlWithDocType({ lang: 'en' }, [
  t.head([
    t.meta({ charset: 'utf-8' }),
    t.title('My Page'),
    t.link({ rel: 'stylesheet', href: '/style.css' }),
  ]),
  t.body(
    t.main({ class: ['container', 'main'] }, [
      t.h1({ style: { color: 'steelblue', marginBottom: '0' } }, 'My Project'),
      t.p('Build HTML with JavaScript.'),
      t.section([
        t.ul([
          // nested data-* attributes
          t.li({ data: { bs: { toggle: 'collapse', target: '#details' } } }, 'Toggle'),
          // boolean attribute: checked when true, omitted when false
          t.li([
            t.input({ id: 'cool', type: 'checkbox', checked: isCool }),
            t.label({ for: 'cool' }, 'Is it cool?'),
          ]),
          // false is silently ignored — no conditional wrapper needed
          isCool && t.li('yes, it is cool'),
          // raw HTML passthrough
          t.literal('<li>some legacy html</li>'),
        ]),
      ]),
    ])
  ),
]).toString();
```

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>My Page</title>
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>
    <main class="container main">
      <h1 style="color: steelblue; margin-bottom: 0">My Project</h1>
      <p>Build HTML with JavaScript.</p>
      <section>
        <ul>
          <li data-bs-toggle="collapse" data-bs-target="#details">Toggle</li>
          <li>
            <input id="cool" type="checkbox" checked>
            <label for="cool">Is it cool?</label>
          </li>
          <li>yes, it is cool</li>
          <li>some legacy html</li>
        </ul>
      </section>
    </main>
  </body>
</html>
```

## Method signatures

Content elements accept optional attributes and/or content:

```javascript
t.div({ id: 'app', class: 'container' }, 'text');  // attributes + content
t.div({ id: 'app' });                               // attributes only
t.div('text content');                              // content only
t.div([t.p('a'), t.p('b')]);                       // content array
t.div();                                            // empty
```

Void elements (`br`, `hr`, `input`, `img`, `link`, `meta`, etc.) take only attributes:

```javascript
t.input({ type: 'checkbox', checked: true });
t.meta({ charset: 'utf-8' });
```

## Attribute rules

- **camelCase → kebab-case**: `{ dataBsToggle: 'collapse' }` → `data-bs-toggle="collapse"`
- **Nested objects flatten**: `{ data: { bs: { toggle: 'collapse' } } }` → `data-bs-toggle="collapse"`
- **Boolean attributes**: `{ checked: true }` → `checked`; `{ checked: false }` → attribute omitted
- **class as array**: `{ class: ['foo', 'bar'] }` → `class="foo bar"`
- **style as object**: `{ style: { backgroundColor: 'red', zIndex: 2 } }` → `style="background-color: red; z-index: 2"`. camelCase keys convert to kebab-case; `null`/`undefined`/`false`/empty-string values are silently omitted.
- **Always allowed**: `data-*`, `aria-*`, and all [global HTML attributes](https://html.spec.whatwg.org/multipage/dom.html#global-attributes)
- **Validation** is checked against the HTML/SVG/MathML spec at `'warn'` or `'error'` level (default `'warn'`)

## Content rules

Valid content: strings, numbers, tag objects, or arrays of those. Falsy values (`null`, `undefined`, `false`, `''`) are silently ignored, making conditionals clean:

```javascript
t.ul([
  t.li('text'),
  t.li(42),
  t.li(t.span('nested')),
  isLoggedIn && t.li(t.a({ href: '/logout' }, 'Log out')),
]);
```

## Raw HTML

```javascript
t.literal('<li>verbatim, HTML-encoded</li>'); // doesn't allow <script> tags
t.unsafeLiteral('<li>trusted HTML, no encoding</li>');
```

## Constructor options

```javascript
import Kensington from 'kensington';

const t = new Kensington({
  validationLevel: 'warn',       // 'off' | 'warn' | 'error' — default 'warn'
  additionalNamespaces: ['hx'],  // allow hx-* (htmx), x-* (alpine), etc.
  indentationLevel: 2,           // spaces per indent — default 2, 0 to disable
  logger: msg => myLogger(msg),  // receives validation warnings — default console.log
});
```

## Custom elements

```javascript
import Kensington from 'kensington';

class MyEngine extends Kensington {
  myCard = this.createCustomTag('my-card', {
    'card-type': ['primary', 'secondary'],  // allowed string literals
    'loading': Boolean,                     // boolean attribute
    'max-items': Number,                    // numeric attribute
  });
}

const t = new MyEngine();
t.myCard({ 'card-type': 'primary' }, t.p('content')).toString();
// → <my-card card-type="primary">
//     <p>content</p>
//   </my-card>
```

## TypeScript

Annotate custom elements with `ContentMethod<T>` for full attribute type-checking:

```typescript
import Kensington, { type ContentMethod } from 'kensington';

class MyEngine extends Kensington {
  myCard: ContentMethod<{ 'card-type'?: 'primary' | 'secondary'; loading?: boolean }> =
    this.createCustomTag('my-card', { 'card-type': ['primary', 'secondary'], loading: Boolean });
}
```

Add attribute namespaces globally via module augmentation:

```typescript
declare module 'kensington' {
  interface NameSpaceAttributes {
    [key: `hx${string}`]: string | object;
  }
}

// Now valid anywhere in your project:
t.div({ hxBoost: 'true', hxTarget: '#result' });
t.form({ hxPost: '/api/submit', hxSwap: 'outerHTML' });
```

## Browser — toElement()

`.toElement()` renders a tag tree to a live DOM node. Function-valued event attributes are wired via `addEventListener`. SVG and MathML elements are created with the correct namespace via `createElementNS`.

```javascript
import { t } from 'kensington';

const button = t.button({
  type: 'button',
  onclick: e => console.log('clicked', e),
}, 'Click Me').toElement();

document.body.append(button);

const svg = t.svg({ viewBox: '0 0 100 100' }, [
  t.circle({ cx: 50, cy: 50, r: 40, fill: 'steelblue' }),
]).toElement();
```

## Imports

```javascript
import Kensington from 'kensington';          // class — for subclassing or custom config
import { t } from 'kensington';              // shared default instance
import { formAttributes } from 'kensington/attributes';  // per-element attribute data
```

```typescript
import type { ContentMethod, Content, ContentTag, VoidTag, LiteralTag } from 'kensington';
import type { NameSpaceAttributes } from 'kensington';  // for namespace augmentation
```

| Type | Description |
|------|-------------|
| `ContentTag` | Returned by content element methods (`div`, `p`, `span`, …) |
| `VoidTag` | Returned by void element methods (`br`, `input`, …) |
| `LiteralTag` | Returned by `.literal()` / `.unsafeLiteral()` |
| `Content` | `string \| number \| ContentTag \| VoidTag \| LiteralTag \| Content[]` |
| `ContentMethod<T>` | Type of a custom element method; `T` is the element-specific attribute shape |
| `NameSpaceAttributes` | Interface to extend for custom attribute namespaces |
