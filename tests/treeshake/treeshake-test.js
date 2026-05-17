// Regression test for tree-shaking on the slim build. Builds a synthetic consumer that only
// imports `signal` and `effect` from the prebuilt slim bundle, then runs Rollup + terser to
// see what survives. Asserts the resulting bundle stays under a small budget, which catches
// any regression where the Kensington class (or its transitive imports) leak into a signal-
// only consumer through a missed @__PURE__ annotation, a stray side effect, or similar.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import terser from '@rollup/plugin-terser';
import { rollup } from 'rollup';

const distSlim = fileURLToPath(new URL('../../dist/kensington.slim.js', import.meta.url));
const VIRTUAL_ENTRY = '\0treeshake-virtual-entry';

async function bundleSignalOnly() {
  const bundle = await rollup({
    input: VIRTUAL_ENTRY,
    onwarn(warning, warn) {
      if (warning.code === 'MISSING_EXPORT') { return; }
      warn(warning);
    },
    plugins: [
      {
        name: 'virtual-entry',
        resolveId(id) {
          return id === VIRTUAL_ENTRY ? id : null;
        },
        load(id) {
          if (id !== VIRTUAL_ENTRY) { return null; }
          // The fixture uses every imported symbol so the bundler can't drop them. Anything
          // it drops is from the slim runtime, not from this user code.
          return `import { signal, effect, computed } from '${distSlim}';
export const s = signal(0);
export const doubled = computed(() => s.get() * 2);
export const stopFn = effect(() => { void doubled.get(); });`;
        },
      },
      terser(),
    ],
  });
  const { output } = await bundle.generate({ format: 'esm' });
  await bundle.close();
  return output[0].code;
}

describe('tree-shaking', () => {
  it('signal-only slim consumer drops the Kensington class and tag plumbing', async () => {
    const code = await bundleSignalOnly();
    const sizeKb = code.length / 1024;
    // Current measurement is ~1.5 KB. The 4 KB budget gives ~2.5x headroom for normal evolution
    // of the reactive core. A regression that pulls in the Kensington class would balloon this
    // to ~27 KB, well past the budget.
    assert.ok(
      sizeKb < 4,
      `signal-only slim bundle is ${sizeKb.toFixed(2)} KB, budget is 4 KB. Tree-shaking may have regressed.`,
    );
    // Sanity check. If the Kensington class survived, the bundle would contain references
    // to identifiers that only exist in the class path. These names are deliberately
    // distinctive so they won't false-positive on the reactive core.
    assert.ok(!code.includes('attributesArrayFromObject'),
      'Bundle still contains attributesArrayFromObject. Kensington class was not tree-shaken.');
    assert.ok(!code.includes('createCustomTag'),
      'Bundle still contains createCustomTag. Kensington class was not tree-shaken.');
  });
});
