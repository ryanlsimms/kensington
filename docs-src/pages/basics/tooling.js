import { apiTable } from '../../components/table.js';
import { code, ideMock, panels } from '../../components/ui.js';

export function basicsTooling(t) {
  return t.section({ id: 'tooling' }, [
    t.h2('Tooling'),

    t.h3({ id: 'cli' }, 'HTML → Kensington'),
    t.p([
      'The ',
      t.code('kensington'),
      ' CLI converts existing HTML to Kensington code. Paste it in the terminal, pipe a file, or pass a filename.',
    ]),
    panels(t, [
      {
        label: 'HTML input',
        content: code(t, 'html', `<nav class="navbar" aria-label="main" aria-expanded="true">
  <a href="/" class="nav-link">Home</a>
  <a href="/about" class="nav-link">About</a>
</nav>`),
      },
      {
        label: 'Kensington output',
        content: code(t, 'javascript', `t.nav({ class: "navbar", aria: { label: "main", expanded: "true" } }, [
  t.a({ href: "/", class: "nav-link" }, "Home"),
  t.a({ href: "/about", class: "nav-link" }, "About"),
])`),
      },
    ]),
    apiTable(t, ['Mode', 'Command'], [
      ['Interactive', [t.code('npx kensington'), ' (paste in the terminal)']],
      ['File', t.code('npx kensington index.html')],
      ['Pipe', t.code("echo '<p>hello</p>' | npx kensington")],
      ['Redirect', t.code('npx kensington < page.html')],
    ]),
    apiTable(t, ['Flag', 'Description'], [
      [[t.code('--copy'), ', ', t.code('-c')], 'Copy output to clipboard'],
      [[t.code('--help'), ', ', t.code('-h')], 'Print usage'],
    ]),
    t.p('If ESLint or Prettier is present in the working directory, the converter runs the formatter over the output.'),

    t.h3({ id: 'ide-plugins' }, 'IDE plugins'),
    t.p([
      'CSS class completions and diagnostics inside Kensington ',
      t.code('class'),
      ' strings. Both plugins read your local stylesheets and any CDN stylesheets linked via ',
      t.code('t.link'),
      ' in your project.',
    ]),
    panels(t, [
      {
        label: 'Completions',
        content: ideMock(t, {
          filename: 'index.js',
          lines: [
            `<span>t</span><span>.</span><span class="ide-t-fn">main</span><span>({</span> <span class="ide-t-prop">class</span><span>:</span> <span class="ide-t-str">'mob<span class="ide-cursor"></span>'</span> <span>})</span>`,
          ],
          completion: [
            { name: 'mobile-container', source: 'containers.css' },
            { name: 'modal-body', source: 'CDN' },
            { name: 'modal-backdrop', source: 'CDN' },
          ],
        }),
      },
      {
        label: 'Diagnostics',
        content: ideMock(t, {
          filename: 'index.js',
          lines: [
            `<span>t</span><span>.</span><span class="ide-t-fn">main</span><span>({</span> <span class="ide-t-prop">class</span><span>:</span> <span class="ide-squiggly-warn"><span class="ide-t-str">'contaner<span class="ide-cursor"></span>'</span></span> <span>})</span>`,
          ],
          popup: {
            type: 'warn',
            code: '',
            message: `Unknown CSS class <span class="ide-t-str">'contaner'</span>`,
            typeContent: '',
          },
        }),
      },
    ]),
    t.p([
      'Available for ',
      t.a({ href: 'https://marketplace.visualstudio.com/items?itemName=ryan-lee-simms.kensington', target: '_blank', rel: 'noopener' }, 'VS Code'),
      ' and ',
      t.a({ href: 'https://plugins.jetbrains.com/plugin/31827-kensington', target: '_blank', rel: 'noopener' }, 'JetBrains'),
      ' IDEs. Both plugins also wire up Go to Definition and Find Usages between CSS selectors and Kensington templates.',
    ]),

    t.h3({ id: 'eslint-plugin' }, 'ESLint plugin'),
    t.p([
      t.a({ href: 'https://www.npmjs.com/package/kensington-eslint-plugin', target: '_blank', rel: 'noopener' }, 'kensington-eslint-plugin'),
      ' catches common signal mistakes at lint time: writes inside computed derivations, orphaned effects, async pitfalls, and more. Requires ESLint 9+ and Node 18+.',
    ]),
    code(t, 'sh', 'npm install --save-dev kensington-eslint-plugin'),
    t.p([
      'Add the recommended config to your ',
      t.code('eslint.config.js'),
      ':',
    ]),
    code(t, 'javascript', `import kensington from 'kensington-eslint-plugin';

export default [
  kensington.configs.recommended,
  // ...your other configs
];`),
    panels(t, [
      {
        label: 'Error',
        content: ideMock(t, {
          filename: 'counter.js',
          lines: [
            `<span>const total = </span><span class="ide-t-fn">computed</span><span>(() => {</span>`,
            `<span>  </span><span class="ide-squiggly"><span>count.</span><span class="ide-t-fn">set</span><span>(count.</span><span class="ide-t-fn">get</span><span>() + 1)</span></span>`,
            `<span>})</span>`,
          ],
          popup: {
            type: 'error',
            code: 'no-set-in-computed',
            message: `.set() inside <span class="ide-t-fn">computed()</span>. Computed values cannot have side effects.`,
            typeContent: '',
          },
        }),
      },
      {
        label: 'Warning',
        content: ideMock(t, {
          filename: 'setup.js',
          lines: [
            `<span>function </span><span class="ide-t-fn">setup</span><span>() {</span>`,
            `<span>  </span><span class="ide-squiggly-warn"><span class="ide-t-fn">effect</span><span>(() => render(count.</span><span class="ide-t-fn">get</span><span>()))</span></span>`,
            `<span>}</span>`,
          ],
          popup: {
            type: 'warn',
            code: 'no-ignored-effect-return',
            message: `Return value of <span class="ide-t-fn">effect()</span> not captured. stop() will be unreachable.`,
            typeContent: '',
          },
        }),
      },
    ]),

    t.h3({ id: 'server-packages' }, 'Server packages'),
    t.p([
      'Drop-in view rendering for Express and Fastify. Each package attaches a ',
      t.code('renderView()'),
      ' method to the response that applies a layout, merges locals, and sends the HTML string. See the ',
      t.a({ href: '?page=examples#kensington-express' }, 'kensington-express'),
      ' and ',
      t.a({ href: '?page=examples#kensington-fastify' }, 'kensington-fastify'),
      ' examples for full usage.',
    ]),
    apiTable(t, ['Package', 'Description'], [
      [
        t.a({ href: 'https://www.npmjs.com/package/kensington-express', target: '_blank', rel: 'noopener' }, 'kensington-express'),
        ['Express middleware adding ', t.code('res.renderView(pageRenderer, options?)')],
      ],
      [
        t.a({ href: 'https://www.npmjs.com/package/kensington-fastify', target: '_blank', rel: 'noopener' }, 'kensington-fastify'),
        ['Fastify plugin adding ', t.code('reply.renderView(pageRenderer, options?)')],
      ],
    ]),

    t.h3({ id: 'ai-assistants' }, 'AI assistants'),
    t.p([
      'Kensington ships an ',
      t.code('AGENTS.md'),
      ' file at the package root. It is a compact, single-file reference of the full API: method signatures, attribute rules, constructor options, TypeScript types, the CLI, and working examples. AI coding assistants can read it to answer questions and generate accurate Kensington code.',
    ]),
    t.h4('Using it'),
    t.p(['Most AI editors and assistants let you add files as context. Point yours at ', t.code('AGENTS.md'), ' and it will have everything it needs to work with Kensington correctly:']),
    t.ul([
      t.li([t.strong('Claude Code'), ': reference ', t.code('node_modules/kensington/AGENTS.md'), ' in your conversation, or add it to your project\'s ', t.code('CLAUDE.md'), '.']),
      t.li([t.strong('Cursor / Windsurf'), ': add the file to your ', t.code('.cursorrules'), ' context or drag it into the chat.']),
      t.li([t.strong('Any chat interface'), ': paste the contents directly into the conversation before asking questions about Kensington.']),
    ]),
  ]);
}
