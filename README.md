# Kensington

[![npm](https://img.shields.io/npm/v/kensington)](https://www.npmjs.com/package/kensington)
[![CI](https://github.com/ryanlsimms/kensington/actions/workflows/ci.yml/badge.svg)](https://github.com/ryanlsimms/kensington/actions/workflows/ci.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

HTML/SVG/MathML template engine for JavaScript and TypeScript. Every tag is a method on a `Kensington` instance that returns a tag object serialisable to a formatted HTML string via `.toString()` or a live DOM node via `.toElement()`.

## Installation

```bash
npm install kensington
```
```javascript
import Kensington, { t } from 'kensington';
```

Or in a browser without a build step, via CDN:

```html
<script type="module">
  import Kensington from 'https://cdn.jsdelivr.net/npm/kensington/dist/kensington.min.js';
</script>
```

**Slim build** - omits attribute validation data (~77% smaller minified). Useful for production deployment where validation should be turned off anyway:

```javascript
// bundler / node_modules
import Kensington from 'kensington/dist/slim';
```

```html
<!-- CDN -->
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
t.div({ id: 'app', class: 'container' }, 'text'); // attributes + content
t.div({ id: 'app' });                             // attributes only
t.div('text content');                            // content only
t.div([t.p('a'), t.p('b')]);                      // content array
t.div();                                          // empty
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

## Content rules

Valid content: strings, numbers, tag objects, or arrays of those. Falsy values (`null`, `undefined`, `false`, `''`) are silently ignored, making conditionals clean. Multiple consecutive spaces are replaced with non-breaking spaces so spacing is preserved in the browser — single spaces and preformatted elements (`pre`, `script`, `style`, `textarea`) are unaffected.

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

## HTML comments

```javascript
t.inlineComment('hello world');
// <!-- hello world -->

t.inlineComment('line 1\nline 2');
// <!--
//   line 1
//   line 2
// -->
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

## Validation

The `validationLevel` option controls how attribute problems are handled:

| Level | Behaviour |
|-------|-----------|
| `'off'` | No validation. Best for production. Required when using the slim build. |
| `'warn'` | Logs a message via `logger` (default `console.log`). Does not throw. **Default.** |
| `'error'` | Throws an `Error`. Useful for CI or strict development environments. |

What gets validated:

- **Attribute names** — checked against the HTML/SVG/MathML spec for the element. `data-*`, `aria-*`, and any `additionalNamespaces` are always allowed.
- **Attribute values** — checked against allowed types/literals for each attribute (e.g. `type` on `<input>` only accepts known values; `id` must not start with a digit).
- **Style object values** — non-string/number values (other than `null`, `undefined`, `false`) are flagged.
- **Function values in `toString()`** — event handler attributes (`onclick`, etc.) accept functions for use with `.toElement()`, but functions cannot be serialized to a string. Passing a function and calling `.toString()` logs a warning (`'warn'`) or throws (`'error'`); the attribute is omitted in either case.

```javascript
const t = new Kensington({ validationLevel: 'error' });

t.div({ class: 'ok' });                        // fine
t.div({ unknownAttr: 'x' });                   // throws — not a known attribute
t.input({ type: 'checkbox' });                 // fine
t.input({ type: 'notatype' });                 // throws — not an allowed value
t.button({ onclick: () => {} });               // fine at creation…
t.button({ onclick: () => {} }).toString();    // throws — function not serializable
t.button({ onclick: 'doThing()' }).toString(); // fine — string serializes normally
```

## Custom elements

```javascript
import Kensington from 'kensington';

class MyEngine extends Kensington {
  myCard = this.createCustomTag('my-card', {
    'card-type': ['primary', 'secondary'],           // allowed string literals
    'loading': Boolean,                              // boolean attribute
    'max-items': Number,                             // numeric attribute
    'score': v => typeof v === 'number' && v <= 100, // custom validator function
  });
}

const t = new MyEngine();
t.myCard({ 'card-type': 'primary' }, t.p('content')).toString();
// → <my-card card-type="primary">
//     <p>content</p>
//   </my-card>
```

## Browser — toElement()

`.toElement()` renders a tag tree to a live DOM node. SVG and MathML elements are created with the correct namespace via `createElementNS`.

Event handler attributes (`onclick`, `oninput`, etc.) accept a **function** or a **string**. Functions are wired via `addEventListener`; strings are set via `setAttribute` (inline handler). In `toString()`, function values cannot be serialized and are omitted — a warning is logged when `validationLevel` is `'warn'` or an error thrown when `'error'`.

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

## Imports

```javascript
import Kensington from 'kensington';                     // class — for subclassing or custom config
import { t } from 'kensington';                          // shared default instance
import { formAttributes } from 'kensington/attributes';  // per-element attribute data
```

```typescript
import type { ContentMethod, Content, ContentTag, VoidTag, LiteralTag, CommentTag } from 'kensington';
import type { NameSpaceAttributes } from 'kensington';  // for namespace augmentation
```

| Type | Description |
|------|-------------|
| `ContentTag` | Returned by content element methods (`div`, `p`, `span`, …) |
| `VoidTag` | Returned by void element methods (`br`, `input`, …) |
| `LiteralTag` | Returned by `.literal()` / `.unsafeLiteral()` |
| `CommentTag` | Returned by `.inlineComment()` |
| `Content` | `string \| number \| ContentTag \| VoidTag \| LiteralTag \| CommentTag \| Content[]` |
| `ContentMethod<T>` | Type of a custom element method; `T` is the element-specific attribute shape |
| `NameSpaceAttributes` | Interface to extend for custom attribute namespaces |

## HTML → Kensington

The `kensington` CLI converts HTML to Kensington code. Run it with `npx kensington` after installing the package.

**Input**

```html
<nav class="navbar" aria-label="main" aria-expanded="true">
  <a href="/" class="nav-link">Home</a>
  <a href="/about" class="nav-link">About</a>
</nav>
```

**Output**

```javascript
t.nav({ class: "navbar", aria: { label: "main", expanded: "true" } }, [
  t.a({ href: "/", class: "nav-link" }, "Home"),
  t.a({ href: "/about", class: "nav-link" }, "About"),
])
```

**Input modes**

| Mode | Command |
|------|---------|
| Interactive | `npx kensington` — paste in the terminal |
| File | `npx kensington index.html` |
| Pipe | `echo '<p>hello</p>' \| npx kensington` |
| Redirect | `npx kensington < page.html` |

**Options**

| Flag | Description |
|------|-------------|
| `--copy`, `-c` | Copy output to clipboard |
| `--help`, `-h` | Print usage |

**Auto-formatting**

If ESLint or Prettier is present in the working directory, the converter runs the formatter over the output.
