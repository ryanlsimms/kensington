# Kensington

[![npm](https://img.shields.io/npm/v/kensington)](https://www.npmjs.com/package/kensington)
[![CI](https://github.com/ryanlsimms/kensington/actions/workflows/ci.yml/badge.svg)](https://github.com/ryanlsimms/kensington/actions/workflows/ci.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

HTML/SVG/MathML library for JavaScript and TypeScript. Components are plain functions with no JSX, no magic attributes, and no build step. Call `.toString()` for an HTML string, `.toElement()` for a live DOM node in the browser. Comprehensive typing directly from the official specs.

**[Full documentation →](https://ryanlsimms.github.io/kensington)**

## Installation

```bash
npm install kensington
```

```javascript
import { t } from 'kensington';
```

Or via CDN without a build step:

```html
<script type="module">
  import { t } from 'https://cdn.jsdelivr.net/npm/kensington/dist/kensington.min.js';
</script>
```

## Example

Components are plain functions. Nest tags by passing them as content, then call `.toString()` to get an HTML string.

```javascript
import { t } from 'kensington';

function profileCard(name, title) {
  return t.article({ class: 'profile' },
    t.h2(name),
    t.p({ class: 'title' }, title),
    t.a({ href: `/users/${name.toLowerCase()}` }, 'View profile'),
  );
}

profileCard('Alice', 'Senior Engineer').toString();
// <article class="profile">
//   <h2>Alice</h2>
//   <p class="title">Senior Engineer</p>
//   <a href="/users/alice">View profile</a>
// </article>
```

## Reactive data

In the browser, import `signal`, `computed`, and `effect` to build reactive UIs. Pass a signal as content or an option value and the DOM updates in place.

```javascript
import { t, signal, computed, effect } from 'kensington';

const count = signal(0);
const doubled = count.transform(n => n * 2);
const label = computed(() => count.get() === 1 ? 'click' : 'clicks');

effect(() => {
  document.title = `${count.get()} ${label.get()}`;
});

const app = t.div([
  t.p([count, ' ', label, ', doubled: ', doubled]),
  t.button({ type: 'button', onclick: () => count.set(n => n + 1) }, 'Click'),
]);

document.body.append(app.toElement());
```

## Hydration

Render a component to a HTML string on the server with `renderForHydration`. When the component is registered in the browser with `registerComponents`, it will be replaced with a reactive version. The same component can work on both the server and the browser.

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

## TypeScript

Tags, attribute names/values, inline style property names, and some nested tags are comprehensively typed against the official HTML/SVG/MathML specs. Typos in attribute names and out-of-range values are caught at compile time. Most IDEs will display TypeScript errors/suggestions in JavaScript files as well.

```typescript
t.input({ typ: 'checkbox' });
// TypeScript: Property 'typ' does not exist on type 'InputAttributes'

t.input({ formenctype: 'text' });
// TypeScript: Type '"text"' is not assignable to type
// "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain"
```

## Dev vs production

In development, set `validationLevel` to `'warn'` or `'error'` to catch invalid attributes at runtime. In production, import from `kensington/dist/slim` for a bundle about 5× smaller (~148 KB to ~27 KB minified). See [Dev vs production](https://ryanlsimms.github.io/kensington#dev-vs-prod) for the Vite, Rollup, esbuild, and Webpack setups that switch builds automatically.

## AI assistants

An `AGENTS.md` file is included in the package and published to npm. Point your AI assistant at it for accurate help with Kensington:

- **Claude Code / Cursor / Windsurf**: reference `node_modules/kensington/AGENTS.md` in your conversation or add it to your project's context file.
- **Any chat interface**: paste the contents directly into the conversation.

**[Full documentation →](https://ryanlsimms.github.io/kensington)**
