import { createRequire } from 'node:module';
import { join } from 'node:path';

const LINT_FILE = join(process.cwd(), '_kensington.js');

async function loadPrettier() {
  try {
    const localRequire = createRequire(join(process.cwd(), 'package.json'));
    const prettierPath = localRequire.resolve('prettier');
    const mod = await import(prettierPath);
    const prettier = mod.default ?? mod;
    if (typeof prettier.format === 'function') {
      return prettier;
    }
  } catch {
    // not installed or not loadable
  }
  return null;
}

async function getPrettierPrintWidth(prettier) {
  try {
    const config = await prettier.resolveConfig(LINT_FILE);
    return config?.printWidth ?? 80;
  } catch {
    return 80;
  }
}

async function applyPrettier(prettier, code) {
  try {
    const config = await prettier.resolveConfig(LINT_FILE) ?? {};
    return await prettier.format(code, { ...config, parser: 'babel' });
  } catch {
    return null;
  }
}

function loadEslint() {
  try {
    const localRequire = createRequire(join(process.cwd(), 'package.json'));
    const { ESLint } = localRequire('eslint');
    return new ESLint({ fix: true });
  } catch {
    return null;
  }
}

async function getEslintMaxLen(eslint) {
  try {
    const config = await eslint.calculateConfigForFile(LINT_FILE);
    const rule = config.rules?.['@stylistic/js/max-len'];
    if (!Array.isArray(rule) || rule[0] === 'off' || rule[0] === 0) {
      return 80;
    }
    const opt = rule[1];
    if (typeof opt === 'number') {
      return opt;
    }
    if (opt && typeof opt === 'object' && typeof opt.code === 'number') {
      return opt.code;
    }
  } catch {
    // fall through
  }
  return 80;
}

async function applyEslint(eslint, code) {
  try {
    const [result] = await eslint.lintText(code, { filePath: LINT_FILE });
    return result.output ?? code;
  } catch {
    return code;
  }
}

// Returns { maxLen, apply } where apply(code) => Promise<string>.
// Tries prettier first, then eslint, then returns identity.
export async function loadFormatter() {
  const prettier = await loadPrettier();
  if (prettier) {
    const maxLen = await getPrettierPrintWidth(prettier);
    return { maxLen, apply: async code => (await applyPrettier(prettier, code)) ?? code };
  }
  const eslint = loadEslint();
  if (eslint) {
    const maxLen = await getEslintMaxLen(eslint);
    return { maxLen, apply: code => applyEslint(eslint, code) };
  }
  return { maxLen: 80, apply: code => code };
}
