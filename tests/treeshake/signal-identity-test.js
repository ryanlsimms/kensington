// Regression tests for reactive-module identity across full/slim dist files,
// the package root, and `kensington/live`. The original case reproduced a tool-web bug where an app aliases
// `kensington -> dist/slim/min` (to save ~30 KB in prod) while
// `kensington/live` still resolves to its source ESM. Two copies of the
// signal module were loading, each with its own subscriber registry, so
// an `effect()` from the slim bundle never re-ran when the live
// transport wrote to `transport.status` from the ESM copy.
//
// `batch()` makes this invariant even more important: batchDepth and the
// pending queue are module-scoped, so a batch from one copy cannot defer a
// signal owned by another. Every ESM entry point must resolve the exact same
// source reactive modules, not merely expose objects with compatible brands.

import assert from 'node:assert/strict';
import { rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { rollup } from 'rollup';

const distSlim = fileURLToPath(new URL('../../dist/kensington.slim.js', import.meta.url));
const distFull = fileURLToPath(new URL('../../dist/kensington.js', import.meta.url));
const distFullMin = fileURLToPath(new URL('../../dist/kensington.min.js', import.meta.url));
const distSlimMin = fileURLToPath(new URL('../../dist/kensington.slim.min.js', import.meta.url));
const cjsRoot = fileURLToPath(new URL('../../cjs/index.js', import.meta.url));
const sourceRoot = fileURLToPath(new URL('../../esm/index.js', import.meta.url));
const liveClient = fileURLToPath(new URL('../../esm/live/client.js', import.meta.url));
const nodeResolveModule = new URL(
  '../../node_modules/@rollup/plugin-node-resolve/dist/es/index.js',
  import.meta.url,
);
const commonjsModule = new URL(
  '../../node_modules/@rollup/plugin-commonjs/dist/es/index.js',
  import.meta.url,
);

const nodeResolve = (await import(nodeResolveModule.href)).default;
const commonjs = (await import(commonjsModule.href)).default;
const require = createRequire(import.meta.url);

const VIRTUAL_ENTRY = '\0signal-identity-virtual-entry';

async function bundleMixedConsumer() {
  const bundle = await rollup({
    input: VIRTUAL_ENTRY,
    onwarn(warning, warn) {
      if (warning.code === 'MISSING_EXPORT') { return; }
      if (warning.code === 'CIRCULAR_DEPENDENCY') { return; }
      warn(warning);
    },
    plugins: [
      {
        name: 'virtual-entry',
        resolveId(id) {
          if (id === VIRTUAL_ENTRY) { return id; }
          return null;
        },
        load(id) {
          if (id !== VIRTUAL_ENTRY) { return null; }
          // `effect` from the slim bundle (the tool-web alias); `liveSignal`
          // from the source ESM live subpath (the untouched dependency
          // graph a bundler follows via package `exports`).
          return `
            import { effect, signal, isKensingtonSignal } from '${distSlim}';
            import { liveSignal } from '${liveClient}';

            const s = liveSignal(0, 'test-probe');
            const s2 = signal(0);

            let count = 0;
            const handle = effect(() => {
              s.get();
              count++;
            });

            let count2 = 0;
            const handle2 = effect(() => {
              s2.get();
              count2++;
            });

            s.set(1);
            s2.set(1);
            const immediateCount = count;
            const immediateCount2 = count2;

            // These waits are intentionally harmless with synchronous effects and also
            // verify compatibility with consumers written for the old scheduler.
            await Promise.resolve();
            await Promise.resolve();

            handle.stop();
            handle2.stop();
            export const observedImmediateCount = immediateCount;
            export const observedImmediateCount2 = immediateCount2;
            export const observedCount = count;
            export const observedCount2 = count2;
            export const brandedLive = isKensingtonSignal(s);
            export const brandedPlain = isKensingtonSignal(s2);
          `;
        },
      },
      nodeResolve(),
      commonjs(),
    ],
  });
  const { output } = await bundle.generate({ format: 'esm' });
  await bundle.close();
  return output[0].code;
}

describe('reactive-module identity across package entry points', () => {
  for (const [name, distEntry] of [
    ['full dist', distFull],
    ['minified full dist', distFullMin],
    ['slim dist', distSlim],
    ['minified slim dist', distSlimMin],
  ]) {
    it(`${name} shares signal tracking and batch state with the source package root`, async () => {
      const root = await import(pathToFileURL(sourceRoot).href);
      const built = await import(pathToFileURL(distEntry).href);

      assert.strictEqual(built.Signal, root.Signal, `${name} loaded a second Signal module`);
      assert.strictEqual(built.batch, root.batch, `${name} loaded a second batch scheduler`);

      const value = built.signal(0);
      const seen = [];
      const handle = root.effect(() => { seen.push(value.get()); });
      root.batch(() => {
        value.set(1);
        value.set(2);
        assert.deepStrictEqual(seen, [0], `${name} committed before the shared batch ended`);
      });
      assert.deepStrictEqual(seen, [0, 2]);
      handle.stop();
      value.stop();
    });
  }

  it('effect from slim bundle re-runs on set through liveSignal', async () => {
    const code = await bundleMixedConsumer();
    // Write the bundle to a fixture next to this test so the slim bundle's
    // `../esm/reactive.js` relative import resolves against the package
    // layout. A `data:` URL or an OS-temp path has no filesystem context.
    const fixturePath = fileURLToPath(
      new URL('./signal-identity-fixture.generated.mjs', import.meta.url),
    );
    writeFileSync(fixturePath, code);
    let mod;
    try {
      mod = await import(pathToFileURL(fixturePath).href);
    } finally {
      rmSync(fixturePath, { force: true });
    }

    // Sanity: same-module signal wakes its own effect.
    assert.strictEqual(mod.observedImmediateCount2, 2,
      `Sanity failed: same-module signal effect should run synchronously, got ${mod.observedImmediateCount2}`);
    assert.strictEqual(mod.observedCount2, 2,
      `Sanity failed: signal+effect from the same module should count=2, got ${mod.observedCount2}`);
    assert.strictEqual(mod.brandedPlain, true,
      `Sanity failed: same-module signal should pass isKensingtonSignal, got ${mod.brandedPlain}`);
    assert.strictEqual(mod.brandedLive, true,
      'liveSignal placeholder should pass isKensingtonSignal from the slim bundle. '
        + 'Two module identities would return false.');
    // The actual regression assertion.
    assert.strictEqual(
      mod.observedImmediateCount,
      2,
      `Expected the cross-entry effect to re-run synchronously, got count=${mod.observedImmediateCount}.`,
    );
    assert.strictEqual(
      mod.observedCount,
      2,
      `Expected effect to re-run after set() on a liveSignal, got count=${mod.observedCount}. `
        + 'The slim bundle and esm/live/client.js each have their own copy of '
        + 'the reactive-core module. See tests/treeshake/signal-identity-test.js.',
    );
  });

  it('keeps full and slim instance validation independent while sharing the scheduler', async () => {
    const esm = await import(pathToFileURL(sourceRoot).href);
    const strict = new esm.Kensington({ validationLevel: 'error' });
    const foreign = require(cjsRoot).signal('foreign');
    try {
      for (const path of [distSlim, distSlimMin]) {
        const slim = await import(pathToFileURL(path).href);
        assert.doesNotThrow(() => strict.div(slim.t.p(foreign)).toString());
        assert.throws(() => slim.t.div(strict.p(foreign)).toString(), /crossed reactive runtimes/);
      }
    } finally {
      foreign.stop();
    }
  });

  it('scopes diagnostics for mixed CommonJS and ESM runtimes to validated instances', async () => {
    const esm = await import(pathToFileURL(sourceRoot).href);
    const cjs = require(cjsRoot);
    const cjsSignal = cjs.signal(0);
    const esmSignal = esm.signal(0);
    const pattern = /crossed reactive runtimes/;
    const strictEsm = new esm.Kensington({ validationLevel: 'error' });
    const strictCjs = new cjs.Kensington({ validationLevel: 'error' });
    const handles = [];
    try {
      handles.push(esm.effect(() => cjsSignal.get()));
      handles.push(cjs.effect(() => esmSignal.get()));
      assert.doesNotThrow(() => esm.batch(() => cjsSignal.set(1)));
      assert.doesNotThrow(() => cjs.batch(() => esmSignal.set(1)));
      assert.doesNotThrow(() => esm.t.div(cjsSignal).toString());
      assert.doesNotThrow(() => cjs.t.div(esmSignal).toString());
      assert.throws(
        () => esm.renderForHydration(
          () => {
            return strictEsm.div(cjsSignal);
          },
          {},
          'mixed-runtime',
        ),
        pattern,
      );
      assert.throws(
        () => cjs.renderForHydration(
          () => {
            return strictCjs.div(esmSignal);
          },
          {},
          'mixed-runtime',
        ),
        pattern,
      );
    } finally {
      handles.forEach(handle => handle.stop());
      cjsSignal.stop();
      esmSignal.stop();
    }
  });
});
