import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import * as esm from 'kensington';

const require = createRequire(import.meta.url);
const cjs = require('kensington');

function verifyRuntime(label, runtime) {
  assert.strictEqual(typeof runtime.batch, 'function', `${label} exports batch()`);
  assert.strictEqual(typeof runtime.signal, 'function', `${label} exports signal()`);
  assert.strictEqual(typeof runtime.effect, 'function', `${label} exports effect()`);

  const value = runtime.signal(0);
  const observed = [];
  const watcher = runtime.effect(() => { observed.push(value.get()); });
  try {
    const result = runtime.batch(() => {
      value.set(1);
      value.set(2);
      assert.deepStrictEqual(observed, [0], `${label} defers effects inside batch()`);
      return label;
    });

    assert.strictEqual(result, label, `${label} returns the batch callback value`);
    assert.deepStrictEqual(observed, [0, 2], `${label} commits one effect update`);
    let asyncCallbackRan = false;
    assert.throws(() => runtime.batch(async () => {
      asyncCallbackRan = true;
      await Promise.resolve();
    }), /batch\(\) requires a synchronous callback/, `${label} rejects async batch callbacks`);
    assert.strictEqual(asyncCallbackRan, false, `${label} rejects async callbacks before they run`);
    assert.strictEqual(runtime.t.div(label).toString(), `<div>${label}</div>`);
  } finally {
    watcher.stop();
    value.stop();
  }
}

verifyRuntime('ESM', esm);
verifyRuntime('CommonJS', cjs);

console.log(`Minimum Node runtime smoke passed on ${process.version}`);
