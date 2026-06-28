import { t } from 'kensington';

import { apiTable } from '../../components/table.js';
import { code } from '../../components/ui.js';

export function apiExportsAndTypes() {
  return [
    t.section({ id: 'exports' }, [
      t.h2('Exports'),
      t.h3('kensington'),
      code('javascript', `import Kensington from 'kensington';                         // the class
import { t } from 'kensington';                              // shared default instance (new Kensington())
import { signal, computed, effect } from 'kensington';
import { renderForHydration, registerComponents } from 'kensington';
import { isBrowser } from 'kensington';                      // true when window is defined`),
      code('javascript', `// browser, via CDN
import { t } from 'https://cdn.jsdelivr.net/npm/kensington/dist/kensington.min.js';`),

      t.h3('kensington/attributes'),
      t.p([
        'Every element has a named export containing its allowed-attribute validator object. Useful for extending built-in elements via ',
        t.code('createCustomTag'),
        '.',
      ]),
      code('javascript', `import {
  divAttributes,
  inputAttributes,
  formAttributes,
  buttonAttributes,
  aAttributes,
  // ... one export per element
} from 'kensington/attributes';`),

      t.h3('kensington/live'),
      t.p([
        'Multi-client state shared across connected browsers. See the ',
        t.a({ href: '?page=api#api-live-signals' }, 'Live signals API'),
        ' and the ',
        t.a({ href: '?page=reactivity#live-signals' }, 'live signals guide'),
        '.',
      ]),
      code('javascript', `import { liveSignal, connectLive, liveServer } from 'kensington/live';`),
      t.p([
        'Two narrower subpaths exist for environment-bounded imports. ',
        t.code('kensington/live/client'),
        ' exports ',
        t.code('liveSignal'),
        ' and ',
        t.code('connectLive'),
        '. ',
        t.code('kensington/live/server'),
        ' exports ',
        t.code('liveServer'),
        '. The unified ',
        t.code('kensington/live'),
        ' path is the documented default.',
      ]),

      t.h3('kensington/devtools'),
      t.p([
        'Side-effect import that enables the in-page devtools panel for signal inspection. Drop into a dev-only entry point. The panel mounts itself on first import and listens to signal lifecycle events emitted by the reactive runtime.',
      ]),
      code('javascript', `// dev-only entry. Importing for side effects.
import 'kensington/devtools';`),

      t.h3('kensington/vite'),
      t.p([
        'Vite plugin that wires transparent HMR for component files. Accepts an ',
        t.code('include'),
        ' option (glob string, array of globs, or a callback returning either). On save, registered components hot-swap in place. Apply mode is ',
        t.code("'serve'"),
        ' only. Production builds ship the user\'s original source with no instrumentation. Requires ',
        t.code('acorn'),
        ' and ',
        t.code('magic-string'),
        ' as optional peer deps (lazy-loaded when the plugin runs).',
      ]),
      code('javascript', `// vite.config.js
import { defineConfig } from 'vite';
import { kensingtonHmr } from 'kensington/vite';

export default defineConfig({
  plugins: [kensingtonHmr({ include: 'src/components/**/*.js' })],
});`),

      t.h3('Slim build'),
      t.p([
        'Proxy-based class with no per-element attribute spec data. About 5× smaller minified (~148 KB to ~27 KB). For signal-only consumers tree-shaking drops the bundle to ~1.5 KB. Throws if ',
        t.code('validationLevel'),
        ' is anything other than ',
        t.code("'off'"),
        '. See ',
        t.a({ href: '?page=basics#dev-vs-prod' }, 'Dev vs production'),
        ' for the recommended workflow.',
      ]),
      code('javascript', `import Kensington from 'kensington/dist/slim';

const t = new Kensington();`),
    ]),

    t.section({ id: 'types' }, [
      t.h2('TypeScript types'),
      code('typescript', `import type {
  ContentTag, VoidTag, LiteralTag, CommentTag,
  Content, ContentMethod,
  Signal, ReadonlySignal, Reactive,
  GlobalAttributes, GlobalEvents, UniversalAttributes, NameSpaceAttributes,
  // branded element types:
  DivTag, TdTag, ThTag, TrTag, TheadTag, TbodyTag, TfootTag,
  TableTag, UlTag, OlTag, LiTag, DlTag, SelectTag, ImgTag,
  // ...
} from 'kensington';`),
      apiTable(['Type', 'Description'], [
        [
          t.code('ContentTag'),
          'Base type returned by all content element methods. All branded element types extend this.',
        ],
        [
          t.code('VoidTag'),
          [
            'Returned by void element methods (',
            t.code('br'),
            ', ',
            t.code('input'),
            ', …). Extends ',
            t.code('ContentTag'),
            '.',
          ],
        ],
        [t.code('LiteralTag'), ['Returned by ', t.code('.literal()'), ' and ', t.code('.unsafeLiteral()'), '.']],
        [t.code('CommentTag'), ['Returned by ', t.code('.inlineComment()'), '.']],
        [
          [t.code('DivTag'), ', ', t.code('TdTag'), ', ', t.code('LiTag'), ', …'],
          [
            'Branded return types for elements with content model constraints. Extend ',
            t.code('ContentTag'),
            '.',
          ],
        ],
        [
          t.code('Content'),
          [
            t.code(`string | number | boolean | null | undefined | ContentTag | VoidTag | LiteralTag | CommentTag | Content[]`),
            '. Falsy values are silently dropped.',
          ],
        ],
        [
          t.code('ContentMethod<T>'),
          [
            'Type of a custom element method created by ',
            t.code('createCustomTag'),
            '. ',
            t.code('T'),
            ' is the element-specific attribute shape.',
          ],
        ],
        [
          t.code('Signal<T>'),
          [
            'Writable signal returned by ',
            t.code('signal()'),
            '. Implements ',
            t.code('ReadonlySignal<T>'),
            '.',
          ],
        ],
        [
          t.code('ReadonlySignal<T>'),
          [
            'Read-only signal interface returned by ',
            t.code('computed()'),
            ' and ',
            t.code('.transform()'),
            '. Exposes ',
            t.code('.get()'),
            ', ',
            t.code('.value'),
            ', ',
            t.code('.stop()'),
            ', and ',
            t.code('.transform()'),
            '.',
          ],
        ],
        [
          t.code('Reactive<T>'),
          [
            t.code('T | ReadonlySignal<T>'),
            '. The type of every attribute value. Accepts a plain value or a signal that resolves to that value.',
          ],
        ],
        [
          t.code('GlobalAttributes'),
          [
            'Attributes shared by all HTML elements (',
            t.code('id'),
            ', ',
            t.code('class'),
            ', ',
            t.code('style'),
            ', …).',
          ],
        ],
        [
          t.code('GlobalEvents'),
          [
            'Event handler attributes (',
            t.code('onclick'),
            ', ',
            t.code('oninput'),
            ', …) shared by all elements.',
          ],
        ],
        [
          t.code('NameSpaceAttributes'),
          'Interface to extend via module augmentation to allow custom attribute namespaces.',
        ],
        [
          t.code('UniversalAttributes'),
          [
            'Intersection of ',
            t.code('GlobalAttributes'),
            ', ',
            t.code('GlobalEvents'),
            ', and ',
            t.code('NameSpaceAttributes'),
            '.',
          ],
        ],
      ]),

      t.h3('Module augmentation'),
      t.p([
        'Extend ',
        t.code('NameSpaceAttributes'),
        ' to allow custom attribute prefixes without a custom subclass:',
      ]),
      code('typescript', `declare module 'kensington' {
  interface NameSpaceAttributes {
    [key: \`hx\${string}\`]: string | object; // htmx hx-* attributes
  }
}`),
    ]),
  ];
}
