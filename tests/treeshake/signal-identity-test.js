// Regression test for signal-module identity across the slim bundle and
// `kensington/live`. Reproduces the tool-web bug where an app aliases
// `kensington -> dist/slim/min` (to save ~30 KB in prod) while
// `kensington/live` still resolves to its source ESM. Two copies of the
// signal module were loading, each with its own subscriber registry, so
// an `effect()` from the slim bundle never re-ran when the live
// transport wrote to `transport.status` from the ESM copy.
//
// The fix is that both entry points share ONE reactive-core module at
// runtime. This test builds a synthetic consumer that mirrors the
// tool-web alias setup, executes it, and asserts that an `effect()`
// from the slim bundle observes a `.set()` on a signal returned by
// `liveSignal` (which is defined in the ESM live subpath).

import assert from 'node:assert/strict';
import { rmSync, writeFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { rollup } from 'rollup';

const distSlim = fileURLToPath(new URL('../../dist/kensington.slim.js', import.meta.url));
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

            // Effects flush on the microtask queue; wait for them.
            await Promise.resolve();
            await Promise.resolve();

            handle.stop();
            handle2.stop();
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

describe('signal-module identity across dist/slim and esm/live', () => {
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
    assert.strictEqual(mod.observedCount2, 2,
      `Sanity failed: signal+effect from the same module should count=2, got ${mod.observedCount2}`);
    assert.strictEqual(mod.brandedPlain, true,
      `Sanity failed: same-module signal should pass isKensingtonSignal, got ${mod.brandedPlain}`);
    assert.strictEqual(mod.brandedLive, true,
      'liveSignal placeholder should pass isKensingtonSignal from the slim bundle. '
        + 'Two module identities would return false.');
    // The actual regression assertion.
    assert.strictEqual(
      mod.observedCount,
      2,
      `Expected effect to re-run after set() on a liveSignal, got count=${mod.observedCount}. `
        + 'The slim bundle and esm/live/client.js each have their own copy of '
        + 'the reactive-core module. See tests/treeshake/signal-identity-test.js.',
    );
  });
});
