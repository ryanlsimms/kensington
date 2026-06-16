// Vite plugin that wires up transparent HMR for Kensington components.
//
// For each matched file the plugin parses the source to an AST (acorn), finds top-level
// component exports, and rewrites each one to flow through __kInstrument(name, fn). The
// rewriting uses magic-string for surgical edits so source maps stay aligned with the
// original code. An import.meta.hot.accept block is appended at the bottom that calls
// hmrReplaceComponent with the underlying (unwrapped) function on every save.
//
// Goals
// -----
// 1. Production builds are untouched. The plugin sets apply: 'serve', so vite build skips
//    the transform entirely and ships the user's original source.
// 2. The acorn + magic-string dependencies are optional peer dependencies of kensington.
//    They live in the user's devDependencies, never in the prod bundle.
// 3. The user writes plain code:
//      import counter from './counter.js';
//      document.body.append(counter({ start: 0 }).toElement());
//    No mount(), no registerComponents, no renderForHydration. HMR is purely additive.
//
// Detected export forms
// ---------------------
//   - export function NAME(...) {}
//   - export const NAME = function|()=>
//   - export default function NAME(...) {}
//   - export default function(...) {}         (anonymous, name = file basename)
//   - export default () => ...                (name = file basename)
//   - export default NAME                     (re-export of named declaration)
//   - export { NAME, NAME2, ... }             (specifier list pointing to local decls)
//
// Unsupported shapes (file silently keeps no-HMR behaviour):
//   - export default <complex expression>     (e.g. conditional, call expression)
//   - export { NAME } from './other.js'       (re-export from another module)

let astModulesPromise = null;

function loadAstModules() {
  if (astModulesPromise === null) {
    astModulesPromise = Promise.all([
      import('acorn').catch(() => null),
      import('magic-string').catch(() => null),
    ]).then(([acorn, magicString]) => {
      if (acorn === null || magicString === null) {
        throw new Error(
          'kensingtonHmr requires acorn and magic-string. Install them as dev dependencies:\n'
          + '  npm install -D acorn magic-string',
        );
      }
      return { Parser: acorn.Parser, MagicString: magicString.default };
    });
  }
  return astModulesPromise;
}

function baseName(filePath) {
  const slash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  const file = slash >= 0 ? filePath.slice(slash + 1) : filePath;
  const dot = file.lastIndexOf('.');
  return dot > 0 ? file.slice(0, dot) : file;
}

// Expand a glob like `src/**/*.{js,ts}` into [`src/**/*.js`, `src/**/*.ts`]. Single pass,
// no nesting.
function expandBraces(pattern) {
  const out = [''];
  let i = 0;
  while (i < pattern.length) {
    if (pattern[i] === '{') {
      const close = pattern.indexOf('}', i);
      if (close === -1) {
        for (let k = 0; k < out.length; k++) {
          out[k] += pattern[i];
        }
        i++;
        continue;
      }
      const options = pattern.slice(i + 1, close).split(',');
      const next = [];
      for (const seg of out) {
        for (const opt of options) {
          next.push(seg + opt);
        }
      }
      out.length = 0;
      out.push(...next);
      i = close + 1;
    } else {
      for (let k = 0; k < out.length; k++) {
        out[k] += pattern[i];
      }
      i++;
    }
  }
  return out;
}

function micromatch(pattern) {
  let re = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*') {
      re += '.*';
      i++;
      if (pattern[i + 1] === '/') {
        i++;
      }
    } else if (c === '*') {
      re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else if ('.+^$()|[]\\'.includes(c)) {
      re += `\\${c}`;
    } else {
      re += c;
    }
  }
  return new RegExp(`^${re}$`);
}

function toMatcher(include) {
  const patterns = (Array.isArray(include) ? include : [include])
    .flatMap(expandBraces)
    .map(micromatch);
  return id => patterns.some(p => p.test(id));
}

// Walk an AST module body and classify each top-level export. Returns an array of
// { name, kind, node, ...extras } objects. Each kind drives a different magic-string
// rewrite in applyRewrites.
function collectExports(ast, fileBasename) {
  const exports = [];
  for (const node of ast.body) {
    if (node.type === 'ExportDefaultDeclaration') {
      const decl = node.declaration;
      if (decl.type === 'FunctionDeclaration' && decl.id !== null) {
        exports.push({ kind: 'default-named-fn', name: decl.id.name, node, decl });
      } else if (decl.type === 'FunctionDeclaration') {
        exports.push({ kind: 'default-anon-fn', name: fileBasename, node, decl });
      } else if (decl.type === 'FunctionExpression') {
        const exprName = decl.id !== null && decl.id !== undefined ? decl.id.name : fileBasename;
        exports.push({ kind: 'default-fn-expr', name: exprName, node, decl });
      } else if (decl.type === 'ArrowFunctionExpression') {
        exports.push({ kind: 'default-arrow', name: fileBasename, node, decl });
      } else if (decl.type === 'Identifier') {
        exports.push({ kind: 'default-ident', name: decl.name, node, decl });
      }
      // Other expressions (CallExpression, ConditionalExpression, etc.) are skipped.
    } else if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration !== null && node.declaration !== undefined) {
        const decl = node.declaration;
        if (decl.type === 'FunctionDeclaration' && decl.id !== null) {
          exports.push({ kind: 'named-fn', name: decl.id.name, node, decl });
        } else if (decl.type === 'VariableDeclaration') {
          for (const varDecl of decl.declarations) {
            if (varDecl.id.type !== 'Identifier' || varDecl.init === null) {
              continue;
            }
            const initType = varDecl.init.type;
            if (initType === 'FunctionExpression' || initType === 'ArrowFunctionExpression') {
              exports.push({ kind: 'named-const-fn', name: varDecl.id.name, node, decl, varDecl });
            }
          }
        }
      } else if (node.source === null && node.specifiers.length > 0) {
        // export { foo, bar } — local re-exports of declarations. Re-exports from another
        // module (node.source !== null) aren't instrumented.
        for (const spec of node.specifiers) {
          if (spec.type !== 'ExportSpecifier'
            || spec.local.type !== 'Identifier'
            || spec.exported.type !== 'Identifier') {
            continue;
          }
          exports.push({
            kind: 'named-specifier',
            name: spec.exported.name,
            localName: spec.local.name,
            node,
            spec,
          });
        }
      }
    }
  }
  return exports;
}

function uniqueAnonLocal(name, seen) {
  let candidate = `__kAnon_${name}`;
  let i = 1;
  while (seen.has(candidate)) {
    candidate = `__kAnon_${name}_${i}`;
    i++;
  }
  seen.add(candidate);
  return candidate;
}

// Apply per-export rewrites. The strategy for every kind: strip the export so the original
// identifier becomes a local binding, then append a single new export at the end of the file
// that re-exports the value through __kI(name, local). The original function body, its
// position in the file, and any closures over module locals are preserved.
function applyRewrites(s, exports, instImport) {
  const tail = [];
  const seenAnonNames = new Set();

  for (const exp of exports) {
    if (exp.kind === 'default-named-fn') {
      const declStart = exp.decl.start;
      s.remove(exp.node.start, declStart);
      tail.push(`export default ${instImport}(${JSON.stringify(exp.name)}, ${exp.decl.id.name});`);
    } else if (exp.kind === 'default-anon-fn' || exp.kind === 'default-arrow' || exp.kind === 'default-fn-expr') {
      const local = uniqueAnonLocal(exp.name, seenAnonNames);
      s.overwrite(exp.node.start, exp.decl.start, `const ${local} = `);
      tail.push(`export default ${instImport}(${JSON.stringify(exp.name)}, ${local});`);
    } else if (exp.kind === 'default-ident') {
      s.overwrite(
        exp.node.start,
        exp.node.end,
        `export default ${instImport}(${JSON.stringify(exp.name)}, ${exp.decl.name});`,
      );
    } else if (exp.kind === 'named-fn') {
      const declStart = exp.decl.start;
      s.remove(exp.node.start, declStart);
      tail.push(
        `export { __kWrap_${exp.name} as ${exp.name} };`,
        `const __kWrap_${exp.name} = ${instImport}(${JSON.stringify(exp.name)}, ${exp.name});`,
      );
    } else if (exp.kind === 'named-const-fn') {
      const declStart = exp.decl.start;
      s.remove(exp.node.start, declStart);
      tail.push(
        `export { __kWrap_${exp.name} as ${exp.name} };`,
        `const __kWrap_${exp.name} = ${instImport}(${JSON.stringify(exp.name)}, ${exp.name});`,
      );
    } else if (exp.kind === 'named-specifier') {
      tail.push(
        `export { __kWrap_${exp.name} as ${exp.name} };`,
        `const __kWrap_${exp.name} = ${instImport}(${JSON.stringify(exp.name)}, ${exp.localName});`,
      );
    }
  }

  // Drop entire `export { a, b }` statements that we've subsumed. After per-specifier rewrites
  // above pushed replacements to the tail, the original specifier statement is dead weight.
  const specifierNodes = new Set();
  for (const exp of exports) {
    if (exp.kind === 'named-specifier') {
      specifierNodes.add(exp.node);
    }
  }
  for (const node of specifierNodes) {
    s.remove(node.start, node.end);
  }

  return tail;
}

function buildAcceptBlock(exports) {
  const calls = [];
  const seen = new Set();
  for (const exp of exports) {
    if (seen.has(exp.name)) {
      continue;
    }
    seen.add(exp.name);
    const access = exp.kind.startsWith('default') ? 'default' : exp.name;
    calls.push(`    __kHmr(${JSON.stringify(exp.name)}, mod.${access}?.__kFn ?? mod.${access});`);
  }
  return [
    '',
    "import { hmrReplaceComponent as __kHmr } from 'kensington';",
    'if (import.meta.hot) {',
    '  import.meta.hot.accept(mod => {',
    '    if (!mod) { return; }',
    ...calls,
    '  });',
    '}',
    '',
  ].join('\n');
}

/**
 * Auto-instruments Kensington components for HMR.
 *
 * Accepts both JavaScript and TypeScript source files. By the time this plugin's transform
 * hook runs, Vite's built-in esbuild step has stripped TS type annotations, so acorn sees
 * plain JS regardless of the source extension.
 *
 * @param {object} options
 * @param {string | string[] | ((server: any) => string | string[] | null | undefined)} options.include
 *   Glob(s) of files to transform, or a callback returning them. Paths are matched
 *   against the project-relative file path; brace alternation (`{js,ts}`) is supported.
 *   The callback form receives the Vite dev server (captured via the plugin's
 *   `configureServer` hook) so it can source the glob from runtime state that isn't
 *   known at config time. Returning `null` / `undefined` from a callback makes the
 *   transform a no-op for that call.
 * @returns Vite plugin object.
 */
export function kensingtonHmr(options = {}) {
  const { include } = options;
  if (typeof include !== 'function' && typeof include !== 'string' && !Array.isArray(include)) {
    throw new TypeError(
      'kensingtonHmr: `include` must be a glob string, an array of globs, or a function returning either.',
    );
  }
  const getInclude = typeof include === 'function' ? include : () => include;
  let rootDir = process.cwd();
  let astModules = null;
  let viteServer = null;
  let lastInclude;
  let cachedMatcher = null;

  function getMatcher() {
    const current = getInclude(viteServer);
    if (current === undefined || current === null) {
      return null;
    }
    if (current !== lastInclude) {
      lastInclude = current;
      cachedMatcher = toMatcher(current);
    }
    return cachedMatcher;
  }

  return {
    name: 'kensington-hmr',
    apply: 'serve',
    configResolved(config) {
      rootDir = config.root ?? rootDir;
    },
    configureServer(server) {
      viteServer = server;
    },
    async buildStart() {
      if (astModules === null) {
        astModules = await loadAstModules();
      }
    },
    transform(code, id) {
      const matches = getMatcher();
      if (matches === null) {
        return null;
      }
      const cleanId = id.split('?')[0];
      if (!/\.(?:js|mjs|cjs|ts|mts|cts)$/.test(cleanId)) {
        return null;
      }
      const rel = cleanId.startsWith(rootDir) ? cleanId.slice(rootDir.length + 1) : cleanId;
      if (!matches(rel)) {
        return null;
      }
      if (code.includes('import.meta.hot')) {
        // File already opts into its own HMR. Don't double-wire.
        return null;
      }
      if (astModules === null) {
        return null;
      }
      const { Parser, MagicString } = astModules;

      let ast;
      try {
        ast = Parser.parse(code, {
          ecmaVersion: 'latest',
          sourceType: 'module',
          allowHashBang: true,
        });
      } catch {
        // Unparseable file (likely a syntax Vite handles via another transform). Skip.
        return null;
      }

      const exports = collectExports(ast, baseName(cleanId));
      if (exports.length === 0) {
        return null;
      }

      const s = new MagicString(code);
      const instImport = '__kI';
      s.prepend(`import { __kInstrument as ${instImport} } from 'kensington';\n`);
      const tail = applyRewrites(s, exports, instImport);
      s.append(`\n${tail.join('\n')}\n`);
      s.append(buildAcceptBlock(exports));

      return { code: s.toString(), map: s.generateMap({ hires: true }) };
    },
  };
}

// Capability marker for downstream packages that need to know which API contract this
// build of kensington implements. Bump this number when the kensingtonHmr signature
// changes in a way callers must adapt to. Currently:
//   1 — original release: `include` only accepted a string or string[]
//   2 — added function `include`, captured viteServer via configureServer
kensingtonHmr.__kHmrApi = 2;

export default kensingtonHmr;
