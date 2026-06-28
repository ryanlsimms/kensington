import { t } from 'kensington';

import { callout, code } from '../../components/ui.js';
import { loc, mermaid } from './helpers.js';

export function architectureTooling() {
  return [
    t.section({ id: 'tooling' }, [
      t.h2('Slim build via Proxy'),
      t.p([
        'The full bundle ships the generated ',
        t.code('Kensington'),
        ' class, which declares a method for every HTML, SVG, and MathML element along with that element\'s attribute spec data. The slim build replaces that generated class with a hand-written Proxy in ',
        loc('esm/kensington-slim.js'),
        '. It carries no per-element attribute spec data, so it is about 5x smaller minified (roughly 148 KB down to roughly 27 KB), and signal-only consumers tree-shake it down to about 1.5 KB.',
      ]),

      t.h3('Why a Proxy'),
      t.p([
        'On the full build every tag method is a generated class field. On the slim build the constructor returns ',
        t.code('new Proxy(this, ...)'),
        ' so that no tag methods exist up front. A property access like ',
        t.code('t.div'),
        ' is resolved dynamically by the Proxy\'s ',
        t.code('get'),
        ' trap. The trap checks real instance members first (via ',
        t.code('Reflect.has'),
        '), then looks the property up in a small ',
        loc('esm/tag-info.js'),
        ' table that maps a method name to a single-letter type code, then builds and caches a ',
        t.code('createTag'),
        ' closure for it. Because nothing is generated per element, the class body stays tiny.',
      ]),
      t.p([
        'Resolved closures are memoized in a ',
        t.code('tagCache'),
        ', so repeated access to the same tag is a plain map lookup after the first resolution. Real instance methods are bound in the constructor so destructuring such as ',
        t.code('const { div } = t'),
        ' works the same as on the full build.',
      ]),
      code('javascript', `// esm/kensington-slim.js (abridged)
return new Proxy(this, {
  get(target, prop, receiver) {
    if (Reflect.has(target, prop)) {
      return Reflect.get(target, prop, receiver);
    }
    if (typeof prop !== 'string') { return undefined; }
    const cached = tagCache[prop];
    if (cached !== undefined) { return cached; }
    const info = tagInfo[prop];
    if (info === undefined) { return undefined; }
    // entry is a bare type code, or [code, tagName] when they differ
    const [tagType, tagName] = Array.isArray(info) ? info : [info, prop];
    const fn = target.createTag(tagName, opts.Klass, { ... });
    tagCache[prop] = fn;
    return fn;
  },
});`),

      t.h3('Forced validationLevel: off'),
      t.p([
        'The slim build ships no attribute spec data, so runtime validation is impossible. The constructor throws if ',
        t.code('validationLevel'),
        ' is anything other than ',
        t.code("'off'"),
        '. The slim build does still ship the set of camelCase attribute names (',
        t.code('camelCaseNames'),
        ') so that ',
        t.code('getAttrName'),
        ' preserves case for SVG attributes such as ',
        t.code('viewBox'),
        ' rather than kebab-casing them.',
      ]),
      callout('warning', "Set validationLevel: 'off' or use the full build",
        t.p([
          'Passing any other validation level to the slim constructor throws immediately. The full build is the one that carries attribute data, so reach for it when you want validation during development.',
        ]),
      ),

      t.h3('How it is produced'),
      t.p([
        'The slim class itself is hand-written. The lookup table it reads is generated. ',
        loc('generate/build-tag-info.js'),
        ' emits ',
        loc('esm/tag-info.js'),
        ' as part of the normal generator run, mapping each method name to a type code (and, where the method name differs from the element name, to the element name too). The bundle swap happens in the rollup config at ',
        loc('generate/bin/build-browser.js'),
        '. A ',
        t.code('slimPlugin'),
        ' rewrites four source modules during the slim build. ',
        t.code('esm/kensington.js'),
        ' resolves to ',
        t.code('esm/kensington-slim.js'),
        ', ',
        t.code('esm/attributes.js'),
        ' becomes a stub that exports only ',
        t.code('__slim__'),
        ' and ',
        t.code('camelCaseNames'),
        ', and the devtools and stack-filter modules become no-op stubs. The entry point stays ',
        loc('esm/index.js'),
        ', so the swap is invisible to consumers.',
      ]),
      t.p([
        'The tree-shaking win comes from ',
        loc('esm/index.js'),
        ', where the shared instance is created with a ',
        t.code('/* @__PURE__ */'),
        ' annotation on ',
        t.code('new Kensington()'),
        '. Combined with the package\'s ',
        t.code('sideEffects'),
        ' marking, a bundler can drop the class entirely for a consumer that imports only the reactive primitives. The slim bundles are exposed through the ',
        t.code('./dist/slim'),
        ' and ',
        t.code('./dist/slim/min'),
        ' package exports.',
      ]),
    ]),

    t.section({ id: 'tooling-cli' }, [
      t.h2('CLI. html-to-kensington'),
      t.p([
        'The package ships a ',
        t.code('kensington'),
        ' binary, wired through the ',
        t.code('"bin"'),
        ' field of ',
        t.code('package.json'),
        ' to ',
        loc('bin/html-to-kensington.js'),
        '. It reads HTML and prints the equivalent Kensington method-call code. The entry point also handles ',
        t.code('--help'),
        ', argument validation, and the ',
        t.code('--copy'),
        ' (',
        t.code('-c'),
        ') flag.',
      ]),

      t.h3('Input sources'),
      t.p([
        'HTML can arrive three ways. A file path argument is read with ',
        t.code('readFileSync'),
        '. A pipe or redirect is read from stdin as a stream. An interactive terminal prompts for a paste and uses bracketed paste mode, where the terminal wraps the pasted text in ',
        t.code('ESC[200~'),
        ' and ',
        t.code('ESC[201~'),
        ' so the reader knows exactly when the paste ends without requiring Ctrl+D. All of this lives in ',
        loc('bin/lib/read-html.js'),
        '.',
      ]),

      t.h3('The conversion pipeline'),
      mermaid(`flowchart LR\n  A[HTML input] --> B[parse5]\n  B --> C[convert-html.js]\n  C --> D[node-to-code.js per node]\n  D --> E[attrs-to-code.js]\n  D --> F[formatter.js]\n  F --> G[stdout]\n  F --> H[clipboard.js --copy]`),
      t.p([
        loc('bin/lib/convert-html.js'),
        ' parses the input with parse5. A full document (one that starts with a doctype or an ',
        t.code('<html>'),
        ' tag) is parsed with ',
        t.code('parse'),
        ', and a fragment is parsed with ',
        t.code('parseFragment'),
        '. It then walks the root nodes and delegates each to ',
        loc('bin/lib/node-to-code.js'),
        '. A document with a doctype on its root ',
        t.code('<html>'),
        ' element converts to ',
        t.code('htmlWithDocType'),
        '.',
      ]),
      t.p([
        loc('bin/lib/node-to-code.js'),
        ' converts a single parse5 node into a Kensington method call string. Text nodes become JSON string literals (blank text is dropped), comment nodes become ',
        t.code('t.inlineComment(...)'),
        ', and element nodes become ',
        t.code('t.tagName(attrs, content)'),
        '. SVG element names are restored to their correct case via a lookup table. Children are converted recursively. The function decides between an inline single-line call and a multi-line array of children based on the formatter\'s line width.',
      ]),
      t.p([
        loc('bin/lib/attrs-to-code.js'),
        ' converts a parse5 attribute list into a JS object literal string. It groups attributes that share a first hyphen segment so that ',
        t.code('data-*'),
        ' and ',
        t.code('aria-*'),
        ' attributes can use the nested object notation, expands the ',
        t.code('style'),
        ' attribute into an object, and converts kebab-case names to camelCase. Boolean attributes with an empty value render as ',
        t.code('name: true'),
        '.',
      ]),

      t.h3('Formatting and output'),
      t.p([
        loc('bin/lib/formatter.js'),
        ' detects a formatter in the current working directory. It tries Prettier first, then ESLint, then falls back to an identity pass. The detected tool supplies a maximum line length (Prettier\'s ',
        t.code('printWidth'),
        ' or ESLint\'s ',
        t.code('@stylistic/js/max-len'),
        '), which the converter uses to decide where to break lines, and it formats the generated code before it is printed.',
      ]),
      t.p([
        'The formatted result is written to stdout. With ',
        t.code('--copy'),
        ' or ',
        t.code('-c'),
        ', it is also sent to the system clipboard by ',
        loc('bin/lib/clipboard.js'),
        ', which shells out to ',
        t.code('pbcopy'),
        ' on macOS, ',
        t.code('clip'),
        ' on Windows, and ',
        t.code('xclip'),
        ' on Linux. A failed clipboard copy is silently ignored so the printed output is never blocked.',
      ]),
      callout('tip', 'Quick conversion',
        t.p([
          'Paste any HTML snippet into the interactive prompt, or pipe a file through the binary, to get a Kensington tree you can drop straight into a component. The output is formatted to match your project\'s Prettier or ESLint config when one is present.',
        ]),
      ),
    ]),
  ];
}
