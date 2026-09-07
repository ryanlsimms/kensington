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

async function bundleConsumer(entry = distSlim, includeTags = false) {
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
          if (includeTags) {
            return `import { t, signal } from '${entry}';
export const tag = t.div(signal('value'));
export const render = () => tag.toElement();`;
          }
          return `import { signal, effect, computed } from '${entry}';
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
  return { code: output[0].code, moduleIds: Object.keys(output[0].modules) };
}

describe('tree-shaking', () => {
  it('signal-only slim consumer drops the Kensington class and tag plumbing', async () => {
    const { code } = await bundleConsumer();
    const sizeKb = code.length / 1024;
    // Current measurement is ~15.0 KB. The reactive core includes throttled development warnings
    // (loop detection, invalid usage) that cannot be tree-shaken because they involve
    // module-level Maps and console.error calls, the keyed signal/computed/transform
    // registries, mapWithKey's per-key itemSignal + inner + keepAwake plumbing plus its
    // shallow-content equality gate, and the keyed-computed external-subscriber warning
    // machinery, the passive validation context, plus Signal.prototype.toElement / .mount and its small dom-tracker
    // dependency. It also carries the `esm/reactive.js` re-export shim that lets the
    // slim bundle share signal identity with `kensington/live` (see signal-identity-test.js).
    // The 15.5 KB budget gives headroom for normal evolution. A regression that pulls in the
    // Kensington class would balloon this to roughly the full slim build size, well past
    // the budget.
    assert.ok(
      sizeKb < 15.5,
      `signal-only slim bundle is ${sizeKb.toFixed(2)} KB, budget is 15.5 KB. Tree-shaking may have regressed.`,
    );
    // Sanity check. If the Kensington class survived, the bundle would contain references
    // to identifiers that only exist in the class path. These names are deliberately
    // distinctive so they won't false-positive on the reactive core.
    assert.ok(!code.includes('attributesArrayFromObject'),
      'Bundle still contains attributesArrayFromObject. Kensington class was not tree-shaken.');
    assert.ok(!code.includes('createCustomTag'),
      'Bundle still contains createCustomTag. Kensington class was not tree-shaken.');
  });

  for (const name of ['kensington.slim.js', 'kensington.slim.min.js']) {
    it(`${name} does not load the Runtime Guard even when tag rendering is retained`, async () => {
      const entry = fileURLToPath(new URL(`../../dist/${name}`, import.meta.url));
      const { code, moduleIds } = await bundleConsumer(entry, true);
      assert.ok(!moduleIds.some(id => id.endsWith('/runtime-guard.js')));
      assert.ok(!code.includes('crossed reactive runtimes'));
      assert.ok(moduleIds.some(id => id.endsWith('/runtime-context.js')));
    });
  }
});
