import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../bin/html-to-kensington.js', import.meta.url));
const projectRoot = fileURLToPath(new URL('..', import.meta.url));

// Use an isolated temp dir so ESLint/Prettier are not found and output is unformatted.
const tmpDir = mkdtempSync(join(tmpdir(), 'kensington-cli-test-'));
after(() => rmSync(tmpDir, { recursive: true }));

function run(html, args = [], cwd = tmpDir) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    input: html,
    encoding: 'utf8',
    cwd,
  });
  if (result.error) {
    throw result.error;
  }
  return { out: result.stdout.trimEnd(), err: result.stderr, status: result.status };
}

describe('elements', () => {
  it('empty element', () => {
    assert.strictEqual(run('<div></div>').out, 't.div()');
  });

  it('void element', () => {
    assert.strictEqual(run('<br>').out, 't.br()');
  });

  it('text content', () => {
    assert.strictEqual(run('<p>hello</p>').out, 't.p("hello")');
  });

  it('string attribute', () => {
    assert.strictEqual(run('<div class="foo"></div>').out, 't.div({ class: "foo" })');
  });

  it('multiple attributes', () => {
    assert.strictEqual(
      run('<a href="/about" target="_blank"></a>').out,
      't.a({ href: "/about", target: "_blank" })',
    );
  });

  it('boolean attribute', () => {
    assert.strictEqual(run('<button disabled></button>').out, 't.button({ disabled: true })');
  });

  it('kebab-case attribute converted to camelCase', () => {
    assert.strictEqual(
      run('<div data-bs-toggle="collapse"></div>').out,
      't.div({ dataBsToggle: "collapse" })',
    );
  });

  it('aria attribute converted to camelCase', () => {
    assert.strictEqual(
      run('<button aria-expanded="true"></button>').out,
      't.button({ ariaExpanded: "true" })',
    );
  });

  it('non-identifier attribute name is quoted', () => {
    assert.strictEqual(
      run('<div xml:lang="en"></div>').out,
      't.div({ "xml:lang": "en" })',
    );
  });

  it('style attribute expanded to object', () => {
    assert.strictEqual(
      run('<div style="color: red; font-size: 14px"></div>').out,
      't.div({ style: { color: "red", fontSize: "14px" } })',
    );
  });

  it('element with attributes and content', () => {
    assert.strictEqual(
      run('<a href="/home">Home</a>').out,
      't.a({ href: "/home" }, "Home")',
    );
  });

  it('nested element', () => {
    assert.strictEqual(run('<div><p>hi</p></div>').out, 't.div(t.p("hi"))');
  });

  it('multiple children rendered as array', () => {
    assert.strictEqual(
      run('<ul><li>a</li><li>b</li></ul>').out,
      `t.ul(
  [
    t.li("a"),
    t.li("b"),
  ],
)`,
    );
  });
});

describe('comments', () => {
  it('inline comment', () => {
    assert.strictEqual(run('<!-- hello world -->').out, 't.inlineComment("hello world")');
  });
});

describe('preformatted content', () => {
  it('script tag with content', () => {
    assert.strictEqual(
      run('<script>const x = 1;</script>').out,
      't.script("const x = 1;")',
    );
  });

  it('style tag with content', () => {
    assert.strictEqual(
      run('<style>body { color: red; }</style>').out,
      't.style("body { color: red; }")',
    );
  });

  it('empty script tag', () => {
    assert.strictEqual(run('<script></script>').out, 't.script()');
  });
});

describe('document structure', () => {
  it('multiple root elements', () => {
    assert.strictEqual(
      run('<div></div><span></span>').out,
      `[
  t.div(),
  t.span(),
]`,
    );
  });

  it('full document with doctype', () => {
    assert.strictEqual(
      run('<!doctype html><html><head></head><body></body></html>').out,
      `t.htmlWithDocType(
  [
    t.head(),
    t.body(),
  ],
)`,
    );
  });
});

describe('nested attributes', () => {
  it('groups 2+ attrs sharing a prefix into a nested object', () => {
    assert.strictEqual(
      run('<div data-bs-toggle="collapse" data-bs-target="#panel"></div>').out,
      't.div({ data: { bsToggle: "collapse", bsTarget: "#panel" } })',
    );
  });

  it('groups aria attrs into a nested object', () => {
    assert.strictEqual(
      run('<button aria-expanded="true" aria-controls="panel1"></button>').out,
      't.button({ aria: { expanded: "true", controls: "panel1" } })',
    );
  });

  it('keeps a single prefix attr flat', () => {
    assert.strictEqual(
      run('<div data-bs-toggle="collapse"></div>').out,
      't.div({ dataBsToggle: "collapse" })',
    );
  });

  it('mixes standalone and grouped attrs', () => {
    assert.strictEqual(
      run('<button type="button" aria-expanded="true" aria-controls="panel1"></button>').out,
      't.button({ type: "button", aria: { expanded: "true", controls: "panel1" } })',
    );
  });

  it('uses separate nested objects for different prefixes', () => {
    const html = `<button data-bs-toggle="collapse" data-bs-target="#one" aria-expanded="true" aria-controls="one"></button>`;
    assert.strictEqual(
      run(html).out,
      `t.button(
  {
    data: { bsToggle: "collapse", bsTarget: "#one" },
    aria: { expanded: "true", controls: "one" },
  },
)`,
    );
  });
});

describe('long attributes', () => {
  it('attrs exceeding maxLen expand to multi-line', () => {
    const html = `<button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">Text</button>`;
    assert.strictEqual(
      run(html).out,
      `t.button(
  {
    class: "accordion-button",
    type: "button",
    data: { bsToggle: "collapse", bsTarget: "#collapseOne" },
  },
  "Text",
)`,
    );
  });
});

describe('SVG', () => {
  it('basic SVG with child element', () => {
    assert.strictEqual(
      run('<svg><circle cx="12" cy="12" r="10"></circle></svg>').out,
      't.svg(t.circle({ cx: "12", cy: "12", r: "10" }))',
    );
  });

  it('camelCase SVG element name is restored', () => {
    assert.strictEqual(
      run('<svg><linearGradient id="g"></linearGradient></svg>').out,
      't.svg(t.linearGradient({ id: "g" }))',
    );
  });
});

describe('error cases', () => {
  it('empty input exits with code 1', () => {
    const { status, err } = run('');
    assert.strictEqual(status, 1);
    assert.ok(err.includes('No HTML input provided'));
  });

  it('whitespace-only input exits with code 1', () => {
    assert.strictEqual(run('   ').status, 1);
  });

  it('missing file exits with code 1 and descriptive message', () => {
    const { status, err } = run('', [join(tmpDir, 'nonexistent.html')]);
    assert.strictEqual(status, 1);
    assert.ok(err.includes('Cannot read file'));
  });

  it('--help prints usage and exits 0', () => {
    const { status, out } = run('', ['--help']);
    assert.strictEqual(status, 0);
    assert.ok(out.includes('Usage:'));
    assert.ok(out.includes('--copy'));
  });

  it('-h is an alias for --help', () => {
    assert.strictEqual(run('', ['-h']).status, 0);
  });
});

describe('file input', () => {
  it('reads HTML from a file argument', () => {
    const file = join(tmpDir, 'input.html');
    writeFileSync(file, '<p>from file</p>');
    assert.strictEqual(run('', [file]).out, 't.p("from file")');
  });
});

describe('ESLint formatting', () => {
  let eslintDir;

  before(() => {
    eslintDir = mkdtempSync(join(projectRoot, '.tmp-eslint-'));
  });

  after(() => rmSync(eslintDir, { recursive: true }));

  it('reads max-len from ESLint config as maxLen', () => {
    // 't.a({ href: "/about", target: "_blank" })' = 42 chars — fits in 80 (default) but not 40
    writeFileSync(join(eslintDir, 'eslint.config.js'), `import stylistic from '@stylistic/eslint-plugin';
export default [{ plugins: { '@stylistic/js': stylistic }, rules: { '@stylistic/js/max-len': ['error', 40] } }];
`);
    assert.strictEqual(
      run('<a href="/about" target="_blank"></a>', [], eslintDir).out,
      `t.a(
  { href: "/about", target: "_blank" },
)`,
    );
  });

  it('applies ESLint auto-fix to output', () => {
    writeFileSync(join(eslintDir, 'eslint.config.js'), `import stylistic from '@stylistic/eslint-plugin';
export default [{ plugins: { '@stylistic/js': stylistic }, rules: { '@stylistic/js/quotes': ['error', 'single', { avoidEscape: true }] } }];
`);
    assert.strictEqual(run('<p>hello</p>', [], eslintDir).out, `t.p('hello')`);
  });
});

describe('Prettier formatting', () => {
  let prettierDir;

  before(() => {
    prettierDir = mkdtempSync(join(projectRoot, '.tmp-prettier-'));
    // Mock prettier module: passes code through, reports printWidth: 40
    mkdirSync(join(prettierDir, 'node_modules', 'prettier'), { recursive: true });
    writeFileSync(join(prettierDir, 'node_modules', 'prettier', 'package.json'), '{"main":"index.js"}');
    writeFileSync(join(prettierDir, 'node_modules', 'prettier', 'index.js'), `'use strict';
module.exports = {
  format: async code => code,
  resolveConfig: async () => ({ printWidth: 40 }),
};
`);
  });

  after(() => rmSync(prettierDir, { recursive: true }));

  it('reads printWidth from Prettier config as maxLen', () => {
    // 't.a({ href: "/about", target: "_blank" })' = 42 chars — fits in 80 (default) but not 40
    assert.strictEqual(
      run('<a href="/about" target="_blank"></a>', [], prettierDir).out,
      `t.a(
  { href: "/about", target: "_blank" },
)`,
    );
  });

  it('applies Prettier format to output', () => {
    // Mock prettier uppercases the code so we can verify format() was called
    writeFileSync(join(prettierDir, 'node_modules', 'prettier', 'index.js'), `'use strict';
module.exports = {
  format: async code => code.replace(/t\\./g, 'T.'),
  resolveConfig: async () => ({ printWidth: 80 }),
};
`);
    assert.strictEqual(run('<p>hello</p>', [], prettierDir).out, `T.p("hello")`);
  });
});
