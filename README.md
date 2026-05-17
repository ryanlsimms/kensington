# Kensington

[![npm](https://img.shields.io/npm/v/kensington)](https://www.npmjs.com/package/kensington)
[![CI](https://github.com/ryanlsimms/kensington/actions/workflows/ci.yml/badge.svg)](https://github.com/ryanlsimms/kensington/actions/workflows/ci.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

HTML/SVG/MathML template library for JavaScript and TypeScript. Output can be either an HTML string, or DOM elements if run in the browser.

Attributes and their values are comprehensively typed with the official [HTML](https://html.spec.whatwg.org), [SVG](https://svgwg.org), [MathML](https://developer.mozilla.org/en-US/docs/Web/MathML) specs and will be kept up to date as the spec changes. They can also be validated at runtime with a warning or error.

The goal is to be simple to learn and let developers code in pure JavaScript or TypeScript without compiling from another file format. Debugging becomes more straightforward and components are plain functions with no special syntax to learn and remember.

**[Full documentation →](https://ryanlsimms.github.io/kensington)**

## AI assistants

An `llms.txt` file is included in the package and published to npm. Point your AI assistant at it for accurate help with Kensington:

- **Claude Code / Cursor / Windsurf**: reference `node_modules/kensington/llms.txt` in your conversation or add it to your project's context file.
- **Any chat interface**: paste the contents directly into the conversation.

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

## TypeScript

Tags, attribute names/values, inline style property names, and some nested tags are comprehensively typed against the official HTML/SVG/MathML specs. Typos in attribute names and out-of-range values are caught at compile time. Most IDEs will display TypeScript errors/suggestions in JavaScript files as well.

```typescript
t.input({ typ: 'checkbox' });
// TypeScript: Property 'typ' does not exist on type 'InputAttributes'

t.input({ formenctype: 'text' });
// TypeScript: Type '"text"' is not assignable to type
// "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain"
```

## Example

```javascript
import { t } from 'kensington';

const users = [
  { name: 'Alice', role: 'Admin',  active: true },
  { name: 'Bob',   role: 'Editor', active: true },
  { name: 'Carol', role: 'Viewer', active: false },
];

function userRow({ name, role, active }) {
  return t.tr([
    t.td(name),
    t.td(role),
    t.td([
      t.input({ type: 'checkbox', checked: active, ariaLabel: `${name} is active` }),
      active && t.span({ class: 'label' }, 'Yes'),
    ]),
  ]);
}

const page = t.htmlWithDocType({ lang: 'en' }, [
  t.head([
    t.meta({ charset: 'utf-8' }),
    t.title('Users'),
    t.link({ rel: 'stylesheet', href: '/style.css' }),
  ]),
  t.body(
    t.main({ class: ['container', 'padded'] }, [
      t.h1({ style: { color: 'steelblue' } }, 'Users'),
      t.table([
        t.thead(t.tr(['Name', 'Role', 'Active'].map(h => t.th(h)))),
        t.tbody(users.map(userRow)),
      ]),
    ])
  ),
]).toString();
// or .toElement() in the browser to create a dom node
```

## Dev vs production

In development, set `validationLevel` to `'warn'` or `'error'` to catch invalid attributes at runtime. In production, import from `kensington/dist/slim` for a bundle about 9× smaller (~136 KB to ~15 KB minified). See [Dev vs production](https://ryanlsimms.github.io/kensington#dev-vs-prod) for the Vite, Rollup, esbuild, and Webpack setups that switch builds automatically.

**[Full documentation →](https://ryanlsimms.github.io/kensington)**
