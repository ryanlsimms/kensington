# Custom elements

Subdoc of the root `AGENTS.md`. Read this when integrating a web-component library (Web Awesome, Shoelace, Lit-based design systems, Material Web, FAST, Spectrum, etc.) or any vanilla custom element. The root file does not cover this material.

## Custom elements

Custom-element libraries (Web Awesome, Shoelace, Lit-based design systems, vanilla web components) integrate by subclassing `Kensington` and declaring a method per element via `createCustomTag`. The same method gives you a typed call site and a stable serializer.

The minimal pattern.

```typescript
import Kensington, { type ContentMethod } from 'kensington';

class MyEngine extends Kensington {
  myCard: ContentMethod<{ 'card-type'?: 'primary' | 'secondary' }> =
    this.createCustomTag('my-card', { 'card-type': ['primary', 'secondary'] });
}
```

The realistic pattern for a third-party library. Define a singleton engine, export it as the project's `k` instance, and use it everywhere instead of the default `t`.

The example below uses a fictional `<my-input>` / `<my-button>` library so the shape is unambiguous. **The attribute names, event names, enum values, and CSS variables shown here are illustrative.** They are not lifted from any real library and should not be copied verbatim into a real project. For real libraries, see [Generating tag methods from a custom-elements manifest](#generating-tag-methods-from-a-custom-elements-manifest). The manifest is the source of truth for attribute names, types, slot names, and CSS parts. The library's own documentation is the source of truth for event names and enum values.

```typescript
// src/k.ts. The project's single Kensington instance.
import Kensington, { type ContentMethod, type Reactive } from 'kensington';

class EngineForMyLib extends Kensington {
  myInput: ContentMethod<{
    label?: Reactive<string>;
    placeholder?: Reactive<string>;
    size?: Reactive<'s' | 'm' | 'l'>;       // illustrative enum, consult the real library
  }> = this.createCustomTag('my-input');

  myButton: ContentMethod<{
    variant?: Reactive<string>;             // type as string when the union is unknown or changes
    disabled?: Reactive<boolean>;
  }> = this.createCustomTag('my-button');

  myIcon: ContentMethod<{
    name: Reactive<string>;
  }> = this.createCustomTag('my-icon');

  myDialog: ContentMethod<{
    open?: Reactive<boolean>;
    label?: Reactive<string>;
  }> = this.createCustomTag('my-dialog');
}

export const k = new EngineForMyLib();
```

Usage. Three things flow together. HTML attributes go in the first argument (typed). DOM properties go in `prop`. Events go in `on`. Light-DOM children go in the second argument.

```typescript
import { k } from './k';
import { signal } from 'kensington';

const name = signal('');
const isReadOnly = signal(false);

const input = k.myInput({
  label: 'Node name',
  size: 's',
  prop: { value: name, disabled: isReadOnly },         // live DOM property binding
  on: { input: e => name.set(e.target.value) },        // standard DOM event
});

const button = k.myButton({ variant: 'primary' }, [    // slot content as second argument
  k.myIcon({ name: 'check', slot: 'prefix' }),         // slot="prefix" routes into the named slot
  'Save',
]);
```

How the pieces map to the DOM.

- **Typed attributes (`label`, `size`, `variant`).** Render as HTML attributes via `setAttribute`. The custom element observes them and updates internally. Use this for static values and string-valued bindings.
- **`prop`.** Assigns directly to the element's reactive property (`el.value = signalValue`). Required for non-string values (booleans, numbers, objects, signals carrying complex types), and the only way to write to properties that have no HTML-attribute equivalent. See **DOM properties with `prop`** in the root AGENTS.md.
- **`on`.** Accepts any event name. Form components nearly always dispatch the standard DOM events (`input`, `change`, `focus`, `blur`) just like native form controls; bind those with `on: { input: handler }` and `on: { change: handler }`. Library-specific lifecycle events (component open/close hooks, validation hooks, etc.) are usually published under a library prefix. Look them up in the library's docs. Do not guess from the tag name. The handler receives the native event in both cases.
- **Slot content.** Children pass through unchanged. Use the `slot="..."` attribute on a child to route it into a named slot.

Custom-element libraries that ship as bundled UMD/ESM (with their dependencies pre-resolved) can be loaded from a CDN via a `<script type="module">` in the SSR head. Libraries published from npm with unresolved bare specifiers (Web Awesome 3.x is one example. its `dist/` contains `import "@shoelace-style/animations"` strings the browser cannot resolve) must be bundled into the client bundle alongside the app code so the bundler resolves the transitive deps. Side-effect imports in `client.ts` are enough.

```typescript
// src/client.ts. Bundled-library path.
import '<my-library>/dist/loader.js';                  // resolves and inlines all sub-imports

// Or, for libraries that lazy-load each component at runtime, import the
// specific component modules to register them eagerly and bypass the lazy fetch:
import '<my-library>/dist/components/input/input.js';
import '<my-library>/dist/components/button/button.js';
```

SSR plus `prop`. The SSR HTML contains no `prop` values (only the regular attributes). On the client, `registerComponents` re-runs the component, `.toElement()` rebuilds the subtree, and the `prop` assignments land on the live, upgraded custom element. See **SSR plus hydration plus custom elements** under DOM properties with `prop` in the root AGENTS.md.

A larger example combining custom elements with `htmx` attribute namespaces and module augmentation lives in `agent-docs/examples.md` under **TypeScript. Design system with custom elements, htmx, and module augmentation**.

## Generating tag methods from a custom-elements manifest

Libraries with many components (Web Awesome, Shoelace, Material Web, FAST, Spectrum Web Components, and most Lit-based design systems) publish a `custom-elements.json` manifest in their npm package, conforming to the W3C Web Components Community Group's [Custom Elements Manifest schema](https://github.com/webcomponents/custom-elements-manifest). Walk the manifest at module load time and assign one `createCustomTag` call per element. Zero per-element boilerplate, no codegen step, library-agnostic.

```typescript
import Kensington, { type ContentMethod } from 'kensington';
import manifest from '@awesome.me/webawesome/custom-elements.json';

function camelCase(s: string) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

class K extends Kensington {
  constructor() {
    super();
    for (const mod of manifest.modules ?? []) {
      for (const decl of mod.declarations ?? []) {
        if (decl.kind === 'class' && (decl as { tagName?: string }).tagName) {
          const tag = (decl as { tagName: string }).tagName;
          (this as Record<string, unknown>)[camelCase(tag)] = this.createCustomTag(tag);
        }
      }
    }
  }
}

export const k = new K();
```

`k.waInput(...)`, `k.waButton(...)`, `k.waIcon(...)`, and every other component in the manifest are all callable. Standard tag methods (`k.div`, `k.span`, etc.) come from the `Kensington` base class.

Substituting libraries is one line. `import manifest from '@shoelace-style/shoelace/custom-elements.json';` for Shoelace. `import manifest from '@material/web/custom-elements.json';` for Material Web. The same `modules[].declarations[]` walk works for any conforming manifest.

The exact path of `custom-elements.json` inside the package depends on the library. Many ship it at the package root, some under `dist/`. Web Awesome 3.x publishes it at `@awesome.me/webawesome/dist/custom-elements.json`. Check the library's `package.json` `exports` map or its filesystem layout if the root-level import fails to resolve.

### Adding types

The dynamic assignment loses TypeScript visibility into the generated methods. Recover it by declaring the methods on the subclass itself with `declare` fields. The fields emit no runtime code; the manifest walker still populates them. Type only the components you actually call; the rest stay callable at runtime even without a declaration (use a permissive cast at the call site if needed).

```typescript
import Kensington, { type ContentMethod, type Reactive } from 'kensington';

class K extends Kensington {
  declare waInput:  ContentMethod<{
    label?:       Reactive<string>;
    placeholder?: Reactive<string>;
    size?:        Reactive<'small' | 'medium' | 'large'>;
  }>;
  declare waButton: ContentMethod<{
    variant?:  Reactive<'neutral' | 'brand' | 'success' | 'warning' | 'danger'>;
    disabled?: Reactive<boolean>;
  }>;
  declare waIcon:   ContentMethod<{ name: Reactive<string>; library?: Reactive<string> }>;

  constructor() {
    super();
    for (const mod of manifest.modules ?? []) {
      for (const decl of mod.declarations ?? []) {
        if (decl.kind === 'class' && (decl as { tagName?: string }).tagName) {
          const tag = (decl as { tagName: string }).tagName;
          (this as Record<string, unknown>)[camelCase(tag)] = this.createCustomTag(tag);
        }
      }
    }
  }
}
```

The attribute literal types (`'small' | 'medium' | 'large'`, the variant union) come from the library's own documentation or its manifest's `attributes[].type.text`. The values in this snippet are illustrative; consult the library's docs or manifest for the actual unions. The Web Awesome `<wa-button>` variants, for example, are `'neutral' | 'brand' | 'success' | 'warning' | 'danger'`, not the generic `'default' | 'primary' | ...` that appears in many doc examples.

Declaring on the subclass is preferred over module augmentation (`declare module 'kensington' { interface Kensington { ... } }`) because it scopes the methods to your engine class instead of widening every `Kensington` instance in the project. The shared default `t` instance, for example, does not get these methods, so its types stay accurate to its real surface. Both forms compile (the `Kensington` class is exported as both the default and a named export); choose subclass declaration unless you have a specific reason to widen the base class.

### When this pattern does not apply

Older custom-element libraries that do not publish a manifest still work with the per-method `createCustomTag` pattern shown earlier in this section. The manifest is the leverage point; without it, list the tag names explicitly and loop over the same shape.

```typescript
const TAGS = ['my-input', 'my-button', 'my-icon'] as const;

class K extends Kensington {
  constructor() {
    super();
    for (const tag of TAGS) {
      (this as Record<string, unknown>)[camelCase(tag)] = this.createCustomTag(tag);
    }
  }
}
```

This recipe replaces the per-method boilerplate uniformly across libraries. The runtime assignment is a few lines; the type declarations are written once per project for the components actually used.

## TypeScript. Namespace augmentation

Add attribute namespaces globally via module augmentation so custom attributes are valid everywhere in your project:

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
