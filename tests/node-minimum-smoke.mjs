import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import * as esm from 'kensington';

const require = createRequire(import.meta.url);
const cjs = require('kensington');

async function verifyRuntime(label, runtime) {
  assert.strictEqual(typeof runtime.applyPendingReactiveUpdates, 'function');
  assert.strictEqual('batch' in runtime, false);
  const value = runtime.signal(0);
  const observed = [];
  const watcher = runtime.effect(() => { observed.push(value.get()); });
  try {
    value.set(1);
    value.set(2);
    assert.deepStrictEqual(observed, [0]);
    assert.strictEqual(runtime.applyPendingReactiveUpdates(), undefined);
    assert.deepStrictEqual(observed, [0, 2]);
    value.set(3);
    value.set(4);
    assert.deepStrictEqual(observed, [0, 2]);
    // Verify automatic batching on the supported Node runtime without forcing an update.
    await Promise.resolve();
    assert.deepStrictEqual(observed, [0, 2, 4]);
    assert.strictEqual(runtime.t.div(label).toString(), `<div>${ label }</div>`);
  } finally {
    watcher.stop();
    value.stop();
  }
}

await verifyRuntime('ESM', esm);
await verifyRuntime('CommonJS', cjs);

console.log(`Minimum Node runtime smoke passed on ${process.version}`);
