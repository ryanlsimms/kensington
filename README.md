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

Tags, attribute names/values, inline style property names, and some nested tags are typed against the HTML/SVG/MathML spec. As far as I can tell, this is the most complete typing written for HTML/SVG/MathML. It's generated straight from the official spec (see [generator files](generate/fetch)) and keeping them up to date is as easy running the fetch script.

![Attribute validation error](docs/screenshot-ts-validation.png)

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
## Reactive Data

In the browser, import `signal`, `computed`, and `effect` to build reactive UIs. Pass a signal as content or an attribute value and the DOM updates live.  This is not intended to be a replacement for more fully-featured front-end-frameworks. It is intended to be simple to learn and work for most use-cases.

```javascript
import { t, signal, computed, effect } from 'kensington';

const count = signal(0);
const doubled = count.transform(n => n * 2);
const label = computed(() => count.get() === 1 ? 'click' : 'clicks');

effect(() => {
  document.title = `${count.get()} ${label.get()}`;
});

const app = t.div([
  t.p([count, ' ', label, ' — doubled: ', doubled]),
  t.button({ type: 'button', onclick: () => count.set(n => n + 1) }, 'Click'),
]);

document.body.append(app.toElement());
```

## Hydration

Render a component to HTML on the server with `renderForHydration`, then replace it with a live reactive DOM on the client with `registerComponents`. The same component function runs in both environments.

```javascript
// server
import { renderForHydration } from 'kensington';
import { counter } from './components/counter.js';

res.send(layout(renderForHydration(counter, { count: 0 })).toString());

// client
import { registerComponents } from 'kensington';
import { counter } from './components/counter.js';

registerComponents({ counter });
```

**[Full documentation →](https://ryanlsimms.github.io/kensington)**
