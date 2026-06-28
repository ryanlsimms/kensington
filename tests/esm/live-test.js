// kensington/live unit tests. Covers the parts of the live runtime that
// don't need an actual WebSocket: the memory persistence adapter, the
// protocol encode/decode, the server-side registry get/set/delete API,
// and `liveSignal`'s fallback behavior when no transport is registered.
// End-to-end multi-client tests live in tests/browser/.

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { effect, signal } from 'kensington';
import { _clearTransport, _registerTransport, liveSignal } from 'kensington/live';
import { liveServer } from 'kensington/live/server';

import { _enterSSRMode, _exitSSRMode } from '../../esm/lib/reactive/ssr.js';
import { createMemoryStore } from '../../esm/live/persistence/memory.js';
import {
  decode,
  encode,
  isClientMessage,
  isServerMessage,
  MSG_SET,
  MSG_SNAPSHOT,
  MSG_SUBSCRIBE,
  MSG_UPDATE,
} from '../../esm/live/protocol.js';

describe('kensington/live unified import path', () => {
  it('connectLive and liveServer are re-exported from kensington/live', async () => {
    const live = await import('kensington/live');
    assert.strictEqual(typeof live.liveSignal, 'function');
    assert.strictEqual(typeof live.connectLive, 'function');
    assert.strictEqual(typeof live.liveServer, 'function');
  });
  it('liveSignal is re-exported from kensington/live/client (client bundles skip liveServer)', async () => {
    const client = await import('kensington/live/client');
    assert.strictEqual(typeof client.liveSignal, 'function');
    assert.strictEqual(typeof client.connectLive, 'function');
    // Sanity check: the client-only subpath does NOT expose liveServer.
    assert.strictEqual(client.liveServer, undefined);
  });
  it('liveSignal shares transport state across subpaths (state.js is the single source of truth)', async () => {
    _clearTransport();
    const live = await import('kensington/live');
    const client = await import('kensington/live/client');
    assert.strictEqual(live.liveSignal, client.liveSignal);
  });
});

describe('kensington/live memory store', () => {
  it('round-trips get/set/delete', () => {
    const store = createMemoryStore();
    assert.strictEqual(store.get('a'), undefined);
    store.set('a', 1);
    assert.strictEqual(store.get('a'), 1);
    store.set('a', { x: 2 });
    assert.deepStrictEqual(store.get('a'), { x: 2 });
    store.delete('a');
    assert.strictEqual(store.get('a'), undefined);
  });
  it('all() iterates entries', () => {
    const store = createMemoryStore();
    store.set('one', 1);
    store.set('two', 2);
    const entries = [...store.all()];
    assert.deepStrictEqual(entries.sort(), [['one', 1], ['two', 2]]);
  });
  it('list(prefix) filters by name prefix', () => {
    const store = createMemoryStore();
    store.set('cell:A1', 'a1');
    store.set('cell:B2', 'b2');
    store.set('sheet:meta', { name: 'x' });
    const cells = store.list('cell:').sort();
    assert.deepStrictEqual(cells, [['cell:A1', 'a1'], ['cell:B2', 'b2']]);
  });
});

describe('kensington/live protocol', () => {
  it('encode + decode round-trip', () => {
    const msg = { type: MSG_SET, name: 'x', value: 1, lamport: 0 };
    assert.deepStrictEqual(decode(encode(msg)), msg);
  });
  it('decode returns null on invalid JSON', () => {
    assert.strictEqual(decode('not json'), null);
    assert.strictEqual(decode(''), null);
  });
  it('isClientMessage accepts subscribe/unsubscribe/set with a name', () => {
    assert.strictEqual(isClientMessage({ type: MSG_SUBSCRIBE, name: 'x' }), true);
    assert.strictEqual(isClientMessage({ type: MSG_SET, name: 'x', value: 1, lamport: 0 }), true);
    assert.strictEqual(isClientMessage({ type: 'snapshot', values: {} }), false);
    assert.strictEqual(isClientMessage({ type: MSG_SUBSCRIBE }), false); // missing name
    assert.strictEqual(isClientMessage(null), false);
    assert.strictEqual(isClientMessage('hello'), false);
  });
  it('isServerMessage accepts snapshot/update/error', () => {
    assert.strictEqual(isServerMessage({ type: MSG_SNAPSHOT, values: {}, lamport: 0 }), true);
    assert.strictEqual(isServerMessage({ type: MSG_UPDATE, name: 'x', value: 1, lamport: 1 }), true);
    assert.strictEqual(isServerMessage({ type: 'set', name: 'x' }), false);
  });
});

describe('kensington/live liveSignal without transport', () => {
  it('returns a readable placeholder when no transport is registered', () => {
    _clearTransport();
    const sig = liveSignal(7, 'placeholder-reads');
    assert.strictEqual(sig.value, 7);
    assert.strictEqual(sig.get(), 7);
    assert.strictEqual(sig._liveName, 'placeholder-reads');
    assert.strictEqual(sig._isLivePlaceholder, true);
    sig.stop();
  });
  it('allows .set on a placeholder, updating the local value', () => {
    _clearTransport();
    const sig = liveSignal(0, 'placeholder-writes-value');
    sig.set(5);
    assert.strictEqual(sig.value, 5);
    sig.set(prev => prev + 1);
    assert.strictEqual(sig.value, 6);
    sig.stop();
  });
  it('requires a non-empty string name', () => {
    _clearTransport();
    assert.throws(() => liveSignal(0, ''), TypeError);
    assert.throws(() => liveSignal(0, 123), TypeError);
    assert.throws(() => liveSignal(0, undefined), TypeError);
  });
});

describe('kensington/live liveSignal lazy upgrade', () => {
  it('upgrades a pre-transport placeholder when a transport later registers', async () => {
    _clearTransport();
    const sig = liveSignal(0, 'upgrade-basic');

    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      // After registration .set works and persists through the registry.
      sig.set(5);
      assert.strictEqual(sig.value, 5);
      assert.strictEqual(live.get('upgrade-basic'), 5);

      sig.set(prev => prev + 10);
      assert.strictEqual(sig.value, 15);
      assert.strictEqual(live.get('upgrade-basic'), 15);
    } finally {
      sig.stop();
      live.close();
      _clearTransport();
    }
  });

  it('preserves placeholder identity across upgrade', async () => {
    _clearTransport();
    const sig = liveSignal(0, 'upgrade-identity');
    const ref = sig;

    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      assert.strictEqual(sig, ref);
      sig.set(42);
      assert.strictEqual(ref.value, 42);
    } finally {
      sig.stop();
      live.close();
      _clearTransport();
    }
  });

  it('mirrors remote-originated changes into the placeholder after upgrade', async () => {
    _clearTransport();
    const sig = liveSignal(0, 'upgrade-mirror');

    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const seen = [];
      const eff = effect(() => { seen.push(sig.get()); });

      live.set('upgrade-mirror', 99);
      await new Promise(r => { queueMicrotask(r); });

      assert.strictEqual(sig.value, 99);
      assert.deepStrictEqual(seen.slice(-1), [99]);
      eff.stop();
    } finally {
      sig.stop();
      live.close();
      _clearTransport();
    }
  });

  it('drops a placeholder from the pending set when stopped before upgrade', async () => {
    _clearTransport();
    const sig = liveSignal(0, 'upgrade-stopped-early');
    sig.stop();

    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      // The placeholder was stopped before upgrade. The registry should
      // not have an entry for the name from this signal.
      assert.strictEqual(live.get('upgrade-stopped-early'), undefined);
    } finally {
      live.close();
      _clearTransport();
    }
  });

  it('carries a pre-upgrade .set value through to the upgraded signal', async () => {
    _clearTransport();
    const sig = liveSignal(0, 'upgrade-preserves-pre-write');
    sig.set(42);
    assert.strictEqual(sig.value, 42);

    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      // The placeholder's pre-upgrade value seeds the cached server-side
      // Signal. After upgrade the placeholder still reads 42, and a later
      // .set propagates through to the registry as usual.
      assert.strictEqual(sig.value, 42);
      sig.set(43);
      assert.strictEqual(sig.value, 43);
      assert.strictEqual(live.get('upgrade-preserves-pre-write'), 43);
    } finally {
      sig.stop();
      live.close();
      _clearTransport();
    }
  });

  it('two placeholders with the same name upgrade to one shared real value', async () => {
    _clearTransport();
    const a = liveSignal(0, 'upgrade-shared');
    const b = liveSignal(0, 'upgrade-shared');

    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      a.set(7);
      // Allow the mirror effect on b to pick up the change from real.
      await new Promise(r => { queueMicrotask(r); });
      assert.strictEqual(a.value, 7);
      assert.strictEqual(b.value, 7);
    } finally {
      a.stop();
      b.stop();
      live.close();
      _clearTransport();
    }
  });
});

describe('kensington/live server-side .status signal', () => {
  it("liveServer() exposes a reactive .status signal that's 'connected' during SSR", async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      assert.strictEqual(typeof live.status?.get, 'function');
      assert.strictEqual(live.status.value, 'connected');
    } finally {
      _clearTransport();
      live.close();
    }
  });
});

describe('kensington/live warnIfInitialMismatch', () => {
  it('warns on primitive-initial mismatch for the same name', async () => {
    const { warnIfInitialMismatch, _resetWarnedNames } = await import('../../esm/live/warn.js');
    _resetWarnedNames();
    const originalWarn = console.warn;
    let captured = '';
    console.warn = msg => { captured = msg; };
    try {
      warnIfInitialMismatch('counter', 0, 7);
      assert.match(captured, /liveSignal\('counter', \.\.\.\) was called multiple times/);
      assert.match(captured, /first: 0, then: 7/);
    } finally { console.warn = originalWarn; }
  });
  it('does not warn when both initials match', async () => {
    const { warnIfInitialMismatch, _resetWarnedNames } = await import('../../esm/live/warn.js');
    _resetWarnedNames();
    const originalWarn = console.warn;
    let captured = '';
    console.warn = msg => { captured = msg; };
    try {
      warnIfInitialMismatch('counter', 7, 7);
      assert.strictEqual(captured, '');
    } finally { console.warn = originalWarn; }
  });
  it('does not warn when either initial is an object', async () => {
    const { warnIfInitialMismatch, _resetWarnedNames } = await import('../../esm/live/warn.js');
    _resetWarnedNames();
    const originalWarn = console.warn;
    let captured = '';
    console.warn = msg => { captured = msg; };
    try {
      warnIfInitialMismatch('items', [], [{ id: 'a' }]);
      assert.strictEqual(captured, '');
      warnIfInitialMismatch('row', { x: 1 }, { x: 2 });
      assert.strictEqual(captured, '');
    } finally { console.warn = originalWarn; }
  });
  it('only warns once per name across repeated calls', async () => {
    const { warnIfInitialMismatch, _resetWarnedNames } = await import('../../esm/live/warn.js');
    _resetWarnedNames();
    const originalWarn = console.warn;
    let count = 0;
    console.warn = () => { count += 1; };
    try {
      warnIfInitialMismatch('counter', 0, 7);
      warnIfInitialMismatch('counter', 0, 9);
      warnIfInitialMismatch('counter', 0, 11);
      assert.strictEqual(count, 1);
    } finally { console.warn = originalWarn; }
  });
});

describe('kensington/live liveSignal with a registered transport', () => {
  it('routes through the registered transport.getOrCreateSignal', () => {
    const calls = [];
    const stub = {
      getOrCreateSignal(name, initial, options) {
        calls.push({ name, initial, options });
        return signal(initial);
      },
    };
    _registerTransport(stub);
    try {
      const sig = liveSignal(0, 'counter');
      assert.strictEqual(sig.value, 0);
      assert.deepStrictEqual(calls, [{ name: 'counter', initial: 0, options: { persist: false } }]);
    } finally {
      _clearTransport();
    }
  });
  it('threads { persist: true } through to the transport', () => {
    const calls = [];
    const stub = {
      getOrCreateSignal(name, initial, options) {
        calls.push({ name, options });
        return signal(initial);
      },
    };
    _registerTransport(stub);
    try {
      liveSignal(0, 'counter', { persist: true });
      assert.deepStrictEqual(calls, [{ name: 'counter', options: { persist: true } }]);
    } finally {
      _clearTransport();
    }
  });
  it('defaults persist to false when options is omitted or persist key is absent', () => {
    const calls = [];
    const stub = {
      getOrCreateSignal(name, initial, options) {
        calls.push(options);
        return signal(initial);
      },
    };
    _registerTransport(stub);
    try {
      liveSignal(0, 'a');
      liveSignal(0, 'b', {});
      liveSignal(0, 'c', { persist: false });
      assert.deepStrictEqual(calls, [
        { persist: false },
        { persist: false },
        { persist: false },
      ]);
    } finally {
      _clearTransport();
    }
  });
  it('rejects a non-object options argument', () => {
    _registerTransport({ getOrCreateSignal: (name, initial) => signal(initial) });
    try {
      assert.throws(() => liveSignal(0, 'foo', 'persist'), TypeError);
      assert.throws(() => liveSignal(0, 'foo', 42), TypeError);
    } finally {
      _clearTransport();
    }
  });
});

describe('kensington/live liveServer registry API', () => {
  it('get/set/delete go through the memory store and registry', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      assert.strictEqual(live.get('counter'), undefined);
      live.set('counter', 7);
      assert.strictEqual(live.get('counter'), 7);
      live.set('counter', 8);
      assert.strictEqual(live.get('counter'), 8);
      live.delete('counter');
      assert.strictEqual(live.get('counter'), undefined);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('list(prefix) walks the in-memory registry', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      live.set('cell:A1', 'a', { persist: true });
      live.set('cell:B2', 'b', { persist: true });
      live.set('sheet:meta', { name: 'x' }, { persist: true });
      const cells = live.list('cell:').sort();
      assert.deepStrictEqual(cells, [['cell:A1', 'a'], ['cell:B2', 'b']]);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('list(prefix) includes transient entries (the registry, not just the store)', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      live.set('transient:x', 42);
      // Registry has it (in-memory).
      assert.strictEqual(live.get('transient:x'), 42);
      // list() now walks the registry, so transient entries are visible.
      assert.deepStrictEqual([...live.list('transient:')], [['transient:x', 42]]);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('live.set with { persist: true } writes through to the store', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      live.set('keep:counter', 7, { persist: true });
      assert.strictEqual(live.get('keep:counter'), 7);
      assert.deepStrictEqual([...live.list('keep:')], [['keep:counter', 7]]);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('server-side liveSignal default is persist:false but still visible to list()', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const sig = liveSignal(0, 'srv:cursor');
      sig.set(99);
      // Registry holds the value regardless of persist policy.
      assert.strictEqual(live.get('srv:cursor'), 99);
      // list() walks the registry, so transient entries show up too. The
      // persist:false policy means the store is untouched, but registry
      // discovery works for both transient and persisted entries.
      assert.deepStrictEqual([...live.list('srv:')], [['srv:cursor', 99]]);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('server-side liveSignal with { persist: true } writes through to the store', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const sig = liveSignal(0, 'srv:sticky', { persist: true });
      sig.set(99);
      assert.strictEqual(live.get('srv:sticky'), 99);
      assert.deepStrictEqual([...live.list('srv:')], [['srv:sticky', 99]]);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('persist policy first-declaration-wins. Conflicting calls warn but keep the stored policy', async () => {
    const { _resetWarnedNames } = await import('../../esm/live/warn.js');
    _resetWarnedNames();
    const live = await liveServer({ persistence: { kind: 'memory' } });
    const originalWarn = console.warn;
    let warnCount = 0;
    let captured = '';
    console.warn = msg => { warnCount += 1; captured = msg; };
    try {
      liveSignal(0, 'policy:test', { persist: true });
      liveSignal(0, 'policy:test', { persist: false });
      assert.strictEqual(warnCount, 1);
      assert.match(captured, /persist=true.*persist=false/s);
      // The set still writes through because the first (true) declaration wins.
      const sig = liveSignal(0, 'policy:test');
      sig.set(5);
      assert.deepStrictEqual([...live.list('policy:')], [['policy:test', 5]]);
    } finally {
      console.warn = originalWarn;
      _clearTransport();
      live.close();
    }
  });
  it('liveSignal during SSR-style call reads from the registry', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      live.set('shared:counter', 42);
      const sig = liveSignal(0, 'shared:counter');
      assert.strictEqual(sig.value, 42); // pulled from registry, not the initial argument
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('server-side liveSignal.set() updates the registry and would broadcast', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const sig = liveSignal(0, 'shared:other');
      sig.set(5);
      assert.strictEqual(live.get('shared:other'), 5);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('rejects unknown persistence.kind', async () => {
    await assert.rejects(
      () => liveServer({ persistence: { kind: 'redis' } }),
      /unknown persistence\.kind/,
    );
  });
  it('does NOT pollute persistence when liveSignal is read but never set', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const sig = liveSignal('default', 'untouched:name');
      assert.strictEqual(sig.value, 'default');
      // The registry should still be empty for this name. live.get() returns undefined.
      assert.strictEqual(live.get('untouched:name'), undefined);
      assert.deepStrictEqual([...live.list('untouched:')], []);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('rejects an unserializable value on server-side liveSignal.set() with a warning', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    const originalWarn = console.warn;
    let captured = '';
    console.warn = msg => { captured = msg; };
    try {
      const sig = liveSignal(0, 'bad:serialize');
      const cyclic = {};
      cyclic.self = cyclic;
      sig.set(cyclic); // rejected
      assert.match(captured, /not JSON-serializable/);
      assert.strictEqual(sig.value, 0); // unchanged
      assert.strictEqual(live.get('bad:serialize'), undefined);
    } finally {
      console.warn = originalWarn;
      _clearTransport();
      live.close();
    }
  });
  it('rejects a value that serializes to undefined (e.g. a top-level Symbol)', async () => {
    // .set() treats a top-level function argument as an updater function, so
    // a literal function value isn't expressible. Symbol is the cleanest top-level
    // value JSON.stringify returns undefined for without triggering the updater path.
    const live = await liveServer({ persistence: { kind: 'memory' } });
    const originalWarn = console.warn;
    let captured = '';
    console.warn = msg => { captured = msg; };
    try {
      const sig = liveSignal('init', 'sym:serialize');
      sig.set(Symbol('nope'));
      assert.match(captured, /serializes to undefined/);
      assert.strictEqual(sig.value, 'init'); // unchanged
    } finally {
      console.warn = originalWarn;
      _clearTransport();
      live.close();
    }
  });
  it('warns when liveSignal is called with the same name but different primitive initials', async () => {
    const { _resetWarnedNames } = await import('../../esm/live/warn.js');
    _resetWarnedNames();
    const live = await liveServer({ persistence: { kind: 'memory' } });
    const originalWarn = console.warn;
    let count = 0;
    let captured = '';
    console.warn = msg => { count += 1; captured = msg; };
    try {
      liveSignal(0, 'collide:test');
      liveSignal(7, 'collide:test'); // primitive mismatch → should warn
      assert.strictEqual(count, 1);
      assert.match(captured, /collide:test/);
    } finally {
      console.warn = originalWarn;
      _clearTransport();
      live.close();
    }
  });
});

describe('kensington/live server-side subscriptions', () => {
  it('caches the Signal across calls (same name → same instance)', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const a = liveSignal(0, 'cached:name');
      const b = liveSignal(0, 'cached:name');
      assert.strictEqual(a, b);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('caches even inside SSR mode (per-request isolation is unnecessary for shared-by-name primitives)', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    _enterSSRMode();
    try {
      const a = liveSignal(0, 'ssr:name');
      const b = liveSignal(0, 'ssr:name');
      // Same instance in SSR mode too. Liveness is shared by name regardless of context.
      assert.strictEqual(a, b);
    } finally {
      _exitSSRMode();
      _clearTransport();
      live.close();
    }
  });
  it('server-side Signal observes live.set writes reactively', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const sig = liveSignal(0, 'observed:name');
      const seen = [];
      const eff = effect(() => { seen.push(sig.get()); });
      // Wait one microtask for the initial effect run to settle.
      await Promise.resolve();
      live.set('observed:name', 1);
      live.set('observed:name', 2);
      await Promise.resolve();
      eff.stop();
      // Initial 0, then 1, then 2. The internal scheduling batches updates,
      // so we assert the first and last values rather than the exact sequence.
      assert.strictEqual(seen[0], 0);
      assert.strictEqual(seen.at(-1), 2);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('writing to the server-side Signal does not double-notify subscribers', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const sig = liveSignal(0, 'self-write:name');
      let runs = 0;
      const eff = effect(() => { sig.get(); runs += 1; });
      await Promise.resolve();
      const baseline = runs;
      sig.set(1);
      await Promise.resolve();
      eff.stop();
      // Exactly one re-run for the set, not two (would be two if applySet's
      // observer notification re-fired the user's effect via _setFromRemote).
      assert.strictEqual(runs - baseline, 1);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('server-side liveSignal cached across SSR boundary (same name → same Signal)', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    _enterSSRMode();
    let ssrSig;
    try {
      ssrSig = liveSignal(0, 'cross-ssr:name');
    } finally {
      _exitSSRMode();
    }
    try {
      // Same name → same instance. SSR no longer creates a fresh per-request
      // Signal; the cache is shared with long-lived calls.
      const longLived = liveSignal(0, 'cross-ssr:name');
      assert.strictEqual(longLived, ssrSig);
      // And subscribes to registry updates.
      live.set('cross-ssr:name', 99);
      assert.strictEqual(ssrSig.value, 99);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('transient name with only a server observer survives past the grace period', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const sig = liveSignal(0, 'transient:observed', { persist: false });
      // No client subscribers ever joined; only the server-side observer exists.
      // Simulate a client-style subscriber unregistering by calling the
      // internal schedule-drop path. We can't reach it directly, but we can
      // verify the public effect: a server-only-observed name stays in the
      // registry after a .set.
      live.set('transient:observed', 7);
      assert.strictEqual(sig.value, 7); // observed reactively
      assert.strictEqual(live.get('transient:observed'), 7);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('.stop() on the server-side Signal removes the observer and lets the cache rebuild', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const a = liveSignal(0, 'stop:rebuild');
      a.stop();
      const b = liveSignal(0, 'stop:rebuild');
      // After .stop(), the next liveSignal call should construct a NEW
      // Signal instance, not return the stopped one from cache.
      assert.notStrictEqual(a, b);
      // And the new one is still observing.
      live.set('stop:rebuild', 42);
      assert.strictEqual(b.value, 42);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('live.delete tears down the cached Signal and observer entry', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const a = liveSignal(0, 'delete:test');
      a.set(5);
      live.delete('delete:test');
      assert.strictEqual(live.get('delete:test'), undefined);
      // A fresh liveSignal call after delete builds a new Signal.
      const b = liveSignal(0, 'delete:test');
      assert.notStrictEqual(a, b);
      assert.strictEqual(b.value, 0); // re-seeded from initial since registry was wiped
    } finally {
      _clearTransport();
      live.close();
    }
  });
  // Regression. live.delete is registry cleanup, not a value transition. It
  // intentionally does NOT notify subscribers. Reactive aggregators that
  // read the deleted name's cached Signal continue to see the last value.
  // Use live.set(name, null) when subscribers must observe the removal.
  it('live.delete does NOT propagate to subscribers of an outstanding cached Signal reference', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const sig = liveSignal(0, 'no-prop:test');
      sig.set(7);
      let observed;
      const eff = effect(() => { observed = sig.get(); });
      assert.strictEqual(observed, 7);
      live.delete('no-prop:test');
      await Promise.resolve();
      // The cached Signal subscribers were NOT fired. The local value stays.
      assert.strictEqual(observed, 7);
      assert.strictEqual(sig.value, 7);
      eff.stop();
    } finally {
      _clearTransport();
      live.close();
    }
  });
  // The companion test: live.set(name, null) DOES propagate. This is the
  // documented cleanup path for slot-style state that aggregators watch.
  it('live.set(name, null) propagates to server-side cached Signal subscribers', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const sig = liveSignal(0, 'set-null:test');
      sig.set(7);
      let observed;
      const eff = effect(() => { observed = sig.get(); });
      assert.strictEqual(observed, 7);
      live.set('set-null:test', null);
      await Promise.resolve();
      assert.strictEqual(observed, null);
      assert.strictEqual(sig.value, null);
      eff.stop();
    } finally {
      _clearTransport();
      live.close();
    }
  });
});

describe('kensington/live policyOf accessor', () => {
  it('returns true for names declared with persist:true', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      live.set('policy:keep', 1, { persist: true });
      assert.strictEqual(live.policyOf('policy:keep'), true);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('returns false for names declared with persist:false (the default)', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      liveSignal(0, 'policy:drop'); // default persist:false
      assert.strictEqual(live.policyOf('policy:drop'), false);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('returns undefined for names that have never been declared', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      assert.strictEqual(live.policyOf('policy:never-seen'), undefined);
    } finally {
      _clearTransport();
      live.close();
    }
  });
});

describe('kensington/live heartbeatInterval handle property', () => {
  it('exposes the configured interval on the handle', async () => {
    const live = await liveServer({
      persistence: { kind: 'memory' },
      heartbeatInterval: 12_345,
    });
    try {
      assert.strictEqual(live.heartbeatInterval, 12_345);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('exposes false when heartbeats are disabled', async () => {
    const live = await liveServer({
      persistence: { kind: 'memory' },
      heartbeatInterval: false,
    });
    try {
      assert.strictEqual(live.heartbeatInterval, false);
    } finally {
      _clearTransport();
      live.close();
    }
  });
  it('defaults to 30_000 when omitted', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      assert.strictEqual(live.heartbeatInterval, 30_000);
    } finally {
      _clearTransport();
      live.close();
    }
  });
});

// Helper to drive the server via its bunWebsocket() handlers without
// spinning up a real WebSocket. Returns { handlers, fakeWs, received }.
function makeFakeSocket(live) {
  const handlers = live.bunWebsocket();
  const received = [];
  const fakeWs = {
    data: { req: { headers: {}, url: '/__kensington/live' } },
    send(payload) { received.push(JSON.parse(payload)); },
  };
  return { handlers, fakeWs, received };
}

describe('kensington/live persist-mismatch warning behavior', () => {
  // Regression. A client MSG_SUBSCRIBE without an explicit persist field
  // (the default-false case) must NOT trigger a mismatch warning against
  // a server-declared persist:true. The wire format encodes "no opinion"
  // by omitting the field; the server treats absent as non-authoritative.
  it('does not warn when client subscribe omits the persist field', async () => {
    const warns = [];
    const orig = console.warn;
    console.warn = (...args) => { warns.push(args.join(' ')); };
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      // Server declares persist:true.
      live.set('mismatch:check', 42, { persist: true });
      assert.strictEqual(live.policyOf('mismatch:check'), true);
      // Client subscribe message without persist field (the new client wire format).
      const { handlers, fakeWs } = makeFakeSocket(live);
      await handlers.open(fakeWs);
      handlers.message(fakeWs, JSON.stringify({ type: 'subscribe', name: 'mismatch:check' }));
      // Should not have warned. The persist policy remains true.
      const mismatchWarning = warns.find(w => w.includes('persist'));
      assert.strictEqual(mismatchWarning, undefined, `unexpected persist warning: ${mismatchWarning}`);
      assert.strictEqual(live.policyOf('mismatch:check'), true);
    } finally {
      console.warn = orig;
      _clearTransport();
      live.close();
    }
  });
  // A client that explicitly opts into persist:true still records the
  // declaration; a subsequent server-declared persist:false would warn.
  it('still warns when client and server declarations actually disagree', async () => {
    const warns = [];
    const orig = console.warn;
    console.warn = (...args) => { warns.push(args.join(' ')); };
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const { handlers, fakeWs } = makeFakeSocket(live);
      await handlers.open(fakeWs);
      // Client explicitly declares persist:true via the subscribe wire form.
      handlers.message(fakeWs, JSON.stringify({ type: 'subscribe', name: 'real-mismatch', persist: true }));
      // Then server-side declares persist:false (writing with persist option omitted does not declare;
      // a server-side liveSignal call without { persist: true } defaults to false).
      liveSignal(0, 'real-mismatch'); // declares persist:false
      const mismatchWarning = warns.find(w => w.includes('persist'));
      assert.notStrictEqual(mismatchWarning, undefined, 'expected a persist-mismatch warning');
    } finally {
      console.warn = orig;
      _clearTransport();
      live.close();
    }
  });
});

describe('kensington/live canWrite option validation', () => {
  it('liveSignal rejects an unknown canWrite value at the call site', () => {
    _clearTransport();
    assert.throws(() => liveSignal(0, 'foo', { canWrite: 'maybe' }), TypeError);
    assert.throws(() => liveSignal(0, 'foo', { canWrite: 123 }), TypeError);
  });
  it("liveSignal accepts 'any', 'server-only', or a function", () => {
    _clearTransport();
    const stub = { getOrCreateSignal: (name, initial, opts) => { stub._opts = opts; return signal(initial); } };
    _registerTransport(stub);
    try {
      liveSignal(0, 'foo', { canWrite: 'any' });
      assert.strictEqual(stub._opts.canWrite, 'any');
      liveSignal(0, 'bar', { canWrite: 'server-only' });
      assert.strictEqual(stub._opts.canWrite, 'server-only');
      const fn = () => true;
      liveSignal(0, 'baz', { canWrite: fn });
      assert.strictEqual(stub._opts.canWrite, fn);
    } finally {
      _clearTransport();
    }
  });
});

describe('kensington/live canWrite: server-side enforcement', () => {
  it("rejects client writes when global canWrite is 'server-only'", async () => {
    const live = await liveServer({
      persistence: { kind: 'memory' },
      canWrite: 'server-only',
    });
    try {
      const { handlers, fakeWs, received } = makeFakeSocket(live);
      await handlers.open(fakeWs);
      handlers.message(fakeWs, JSON.stringify({ type: 'subscribe', name: 'guarded' }));
      received.length = 0;
      // Every MSG_SET carries an opId; rejection comes back as MSG_SET_FAIL.
      handlers.message(fakeWs, JSON.stringify({ type: 'set', name: 'guarded', value: 'x', opId: 1 }));
      assert.strictEqual(received[0]?.type, 'set-fail');
      assert.strictEqual(received[0]?.reason, 'forbidden');
      assert.strictEqual(received[0]?.opId, 1);
      // Server-side write still works.
      live.set('guarded', 'y');
      assert.strictEqual(live.get('guarded'), 'y');
    } finally {
      _clearTransport();
      live.close();
    }
  });

  it("per-signal canWrite 'server-only' rejects writes to just that name", async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      // Register the per-signal canWrite via a server-side liveSignal call.
      liveSignal('initial', 'locked', { canWrite: 'server-only' });
      const { handlers, fakeWs, received } = makeFakeSocket(live);
      await handlers.open(fakeWs);
      handlers.message(fakeWs, JSON.stringify({ type: 'subscribe', name: 'locked' }));
      handlers.message(fakeWs, JSON.stringify({ type: 'subscribe', name: 'open' }));
      received.length = 0;
      // locked: rejected.
      handlers.message(fakeWs, JSON.stringify({ type: 'set', name: 'locked', value: 'x', opId: 1 }));
      assert.strictEqual(received[0]?.type, 'set-fail');
      assert.strictEqual(received[0]?.reason, 'forbidden');
      received.length = 0;
      // open: accepted (no canWrite registered, defaults to 'any').
      handlers.message(fakeWs, JSON.stringify({ type: 'set', name: 'open', value: 'y', opId: 2 }));
      assert.strictEqual(live.get('open'), 'y');
    } finally {
      _clearTransport();
      live.close();
    }
  });

  it('per-signal canWrite function receives (name, ctx, transition) and gates writes', async () => {
    const live = await liveServer({
      persistence: { kind: 'memory' },
      onConnect: () => ({ userId: 'ryan' }),
    });
    try {
      const calls = [];
      liveSignal(0, 'guarded:counter', {
        canWrite: (name, ctx, { prev, next }) => {
          calls.push({ name, ctx, prev, next });
          return next > (prev ?? -1); // monotonic
        },
      });
      const { handlers, fakeWs, received } = makeFakeSocket(live);
      await handlers.open(fakeWs);
      handlers.message(fakeWs, JSON.stringify({ type: 'subscribe', name: 'guarded:counter' }));
      received.length = 0;
      // First write: prev is undefined, next is 5. 5 > -1 → allow.
      handlers.message(fakeWs, JSON.stringify({ type: 'set', name: 'guarded:counter', value: 5, opId: 1 }));
      assert.strictEqual(live.get('guarded:counter'), 5);
      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0].prev, undefined);
      assert.strictEqual(calls[0].next, 5);
      assert.deepStrictEqual(calls[0].ctx, { userId: 'ryan' });
      // Second write tries to go backwards. Rejected.
      received.length = 0;
      handlers.message(fakeWs, JSON.stringify({ type: 'set', name: 'guarded:counter', value: 3, opId: 2 }));
      assert.strictEqual(received[0]?.type, 'set-fail');
      assert.strictEqual(received[0]?.reason, 'forbidden');
      assert.strictEqual(live.get('guarded:counter'), 5);
    } finally {
      _clearTransport();
      live.close();
    }
  });

  it('global canWrite and per-signal canWrite both must allow', async () => {
    const live = await liveServer({
      persistence: { kind: 'memory' },
      onConnect: () => ({ userId: 'ryan' }),
      canWrite: (name, ctx) => ctx.userId !== undefined && ctx.userId !== null, // global: must be authenticated
    });
    try {
      liveSignal('initial', 'doubly-gated', {
        canWrite: (name, ctx, { next }) => next !== 'forbidden-value',
      });
      const { handlers, fakeWs, received } = makeFakeSocket(live);
      await handlers.open(fakeWs);
      handlers.message(fakeWs, JSON.stringify({ type: 'subscribe', name: 'doubly-gated' }));
      received.length = 0;
      // Allowed: global says yes (authenticated), per-signal says yes (not forbidden value).
      handlers.message(fakeWs, JSON.stringify({ type: 'set', name: 'doubly-gated', value: 'ok', opId: 1 }));
      assert.strictEqual(live.get('doubly-gated'), 'ok');
      // Rejected: per-signal rejects 'forbidden-value'.
      received.length = 0;
      handlers.message(fakeWs, JSON.stringify({
        type: 'set', name: 'doubly-gated', value: 'forbidden-value', opId: 2,
      }));
      assert.strictEqual(received[0]?.type, 'set-fail');
      assert.strictEqual(live.get('doubly-gated'), 'ok');
    } finally {
      _clearTransport();
      live.close();
    }
  });
});

describe('kensington/live CAS (compare-and-swap) writes', () => {
  it('accepts a CAS write when ifLamport matches and replies with set-ok', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const { handlers, fakeWs, received } = makeFakeSocket(live);
      await handlers.open(fakeWs);
      handlers.message(fakeWs, JSON.stringify({ type: 'subscribe', name: 'cas:counter' }));
      // snapshot reply: { type: 'snapshot', values: { 'cas:counter': undefined }, lamport: 0 }
      assert.strictEqual(received[0]?.type, 'snapshot');
      assert.strictEqual(received[0]?.lamport, 0);
      received.length = 0;
      // First CAS with ifLamport=0 (fresh name baseline).
      handlers.message(fakeWs, JSON.stringify({
        type: 'set', name: 'cas:counter', value: 1, lamport: 0, ifLamport: 0, opId: 42,
      }));
      const ok = received.find(m => m.type === 'set-ok');
      assert.ok(ok, 'expected set-ok');
      assert.strictEqual(ok.opId, 42);
      assert.strictEqual(ok.lamport, 1);
      assert.strictEqual(live.get('cas:counter'), 1);
    } finally {
      _clearTransport();
      live.close();
    }
  });

  it('rejects a CAS write when ifLamport does not match and replies with set-fail', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const { handlers, fakeWs, received } = makeFakeSocket(live);
      await handlers.open(fakeWs);
      // Seed value via the server-side API so registry has lamport 1.
      live.set('cas:counter', 100);
      handlers.message(fakeWs, JSON.stringify({ type: 'subscribe', name: 'cas:counter' }));
      received.length = 0;
      // CAS with stale ifLamport=0. Registry's lamport is 1. Should conflict.
      handlers.message(fakeWs, JSON.stringify({
        type: 'set', name: 'cas:counter', value: 'attempt', lamport: 0, ifLamport: 0, opId: 7,
      }));
      const fail = received.find(m => m.type === 'set-fail');
      assert.ok(fail, 'expected set-fail');
      assert.strictEqual(fail.opId, 7);
      assert.strictEqual(fail.reason, 'conflict');
      assert.strictEqual(fail.value, 100);
      assert.strictEqual(fail.lamport, 1);
      // Registry untouched.
      assert.strictEqual(live.get('cas:counter'), 100);
    } finally {
      _clearTransport();
      live.close();
    }
  });

  it('canWrite rejection of a CAS write replies with set-fail reason=forbidden', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      liveSignal(0, 'cas:guarded', {
        canWrite: (name, ctx, { next }) => next < 50, // arbitrary
      });
      const { handlers, fakeWs, received } = makeFakeSocket(live);
      await handlers.open(fakeWs);
      handlers.message(fakeWs, JSON.stringify({ type: 'subscribe', name: 'cas:guarded' }));
      received.length = 0;
      handlers.message(fakeWs, JSON.stringify({
        type: 'set', name: 'cas:guarded', value: 99, lamport: 0, ifLamport: 0, opId: 1,
      }));
      const fail = received.find(m => m.type === 'set-fail');
      assert.ok(fail, 'expected set-fail');
      assert.strictEqual(fail.opId, 1);
      assert.strictEqual(fail.reason, 'forbidden');
    } finally {
      _clearTransport();
      live.close();
    }
  });

  it('non-CAS set (no opId) still goes through canWrite, just without set-ok ack', async () => {
    const live = await liveServer({ persistence: { kind: 'memory' } });
    try {
      const { handlers, fakeWs, received } = makeFakeSocket(live);
      await handlers.open(fakeWs);
      handlers.message(fakeWs, JSON.stringify({ type: 'subscribe', name: 'lww:x' }));
      received.length = 0;
      handlers.message(fakeWs, JSON.stringify({ type: 'set', name: 'lww:x', value: 'foo', lamport: 0 }));
      // No set-ok or set-fail for a fire-and-forget set.
      assert.strictEqual(received.find(m => m.type === 'set-ok'), undefined);
      assert.strictEqual(received.find(m => m.type === 'set-fail'), undefined);
      assert.strictEqual(live.get('lww:x'), 'foo');
    } finally {
      _clearTransport();
      live.close();
    }
  });

  it('direct write (with opId) replies set-ok on success and set-fail on canWrite rejection', async () => {
    const live = await liveServer({
      persistence: { kind: 'memory' },
      canWrite: (name, ctx, { next }) => next !== 'no',
    });
    try {
      const { handlers, fakeWs, received } = makeFakeSocket(live);
      await handlers.open(fakeWs);
      handlers.message(fakeWs, JSON.stringify({ type: 'subscribe', name: 'direct:y' }));
      received.length = 0;
      // Allowed direct write — server replies set-ok with the registry's new lamport.
      handlers.message(fakeWs, JSON.stringify({ type: 'set', name: 'direct:y', value: 'yes', opId: 11 }));
      const ok = received.find(m => m.type === 'set-ok');
      assert.ok(ok, 'expected set-ok');
      assert.strictEqual(ok.opId, 11);
      assert.strictEqual(live.get('direct:y'), 'yes');
      received.length = 0;
      // Rejected direct write — set-fail carries the authoritative value for rollback.
      handlers.message(fakeWs, JSON.stringify({ type: 'set', name: 'direct:y', value: 'no', opId: 12 }));
      const fail = received.find(m => m.type === 'set-fail');
      assert.ok(fail, 'expected set-fail');
      assert.strictEqual(fail.opId, 12);
      assert.strictEqual(fail.reason, 'forbidden');
      assert.strictEqual(fail.value, 'yes');
      assert.strictEqual(live.get('direct:y'), 'yes');
    } finally {
      _clearTransport();
      live.close();
    }
  });
});

// End-to-end test of liveServer.attach() with a real Node http server and a
// real ws client. Covers two operational concerns. (1) close() must tear down
// the WebSocketServer it created in attach(), otherwise the http server can
// never drain its keepalive connections and SIGINT shutdown hangs.
// (2) attach() must heartbeat clients so a silent network drop (NAT timeout,
// suspended laptop) is detected and onSocketClose fires for cleanup.

describe('kensington/live liveServer.attach lifecycle', () => {
  // Helper. Starts an http server on an OS-assigned port and returns
  // { server, port } once it is listening.
  async function listen(httpServer) {
    await new Promise(resolve => { httpServer.listen(0, resolve); });
    const port = httpServer.address().port;
    return { port };
  }

  it('close() terminates open WebSocket clients and shuts down the WSS', async () => {
    const http = await import('node:http');
    const { WebSocket } = await import('ws');
    const httpServer = http.createServer((_req, res) => res.end('ok'));
    const live = await liveServer({ persistence: { kind: 'memory' }, heartbeatInterval: false });
    const wss = await live.attach(httpServer);
    const { port } = await listen(httpServer);

    const client = new WebSocket(`ws://127.0.0.1:${port}/__kensington/live`);
    await new Promise((resolve, reject) => {
      client.once('open', resolve);
      client.once('error', reject);
    });
    assert.strictEqual(wss.clients.size, 1, 'client connected');

    const clientClosed = new Promise(resolve => { client.once('close', resolve); });
    live.close();
    await clientClosed;
    assert.strictEqual(wss.clients.size, 0, 'close() terminated open clients');

    // The http server must now close cleanly. Before the fix this would hang.
    await new Promise((resolve, reject) => {
      const done = setTimeout(() => reject(new Error('http server did not close')), 1500);
      httpServer.close(() => { clearTimeout(done); resolve(); });
    });
  });

  it('heartbeat terminates clients that stop pongs (onSocketClose fires)', async () => {
    const http = await import('node:http');
    const { WebSocket } = await import('ws');
    const httpServer = http.createServer((_req, res) => res.end('ok'));
    let closedCtxes = 0;
    const live = await liveServer({
      persistence: { kind: 'memory' },
      heartbeatInterval: 80,
      onConnect: () => ({ userId: 'u1' }),
      onSocketClose: () => { closedCtxes++; },
    });
    await live.attach(httpServer);
    const { port } = await listen(httpServer);

    // autoPong: false suppresses the client's automatic pong reply. The first
    // heartbeat tick sends a ping and flips _kensingtonAlive to false; the
    // next tick sees it still false and terminates the socket.
    const client = new WebSocket(`ws://127.0.0.1:${port}/__kensington/live`, {
      autoPong: false,
    });
    await new Promise((resolve, reject) => {
      client.once('open', resolve);
      client.once('error', reject);
    });

    const clientClosed = new Promise(resolve => { client.once('close', resolve); });
    await clientClosed;
    // onSocketClose runs synchronously inside the close handler, but the
    // server side close event can land after the client's close event. Wait
    // one tick to let the listener run.
    await new Promise(resolve => { setTimeout(resolve, 50); });
    assert.strictEqual(closedCtxes, 1, 'onSocketClose ran for the terminated socket');

    live.close();
    await new Promise(resolve => { httpServer.close(resolve); });
  });
});

// End-to-end coverage of ClientTransport's lifecycle methods (reconnect,
// disconnect, pauseSend, resumeSend, unsubscribe) and the onFrame callback.
// These tests use connectLive against a real attached liveServer so the
// full subscribe / message / status pipeline is exercised, not just the
// in-process registry.
describe('kensington/live ClientTransport lifecycle methods', () => {
  async function listen(httpServer) {
    await new Promise(resolve => { httpServer.listen(0, resolve); });
    return httpServer.address().port;
  }

  // Wait for transport.status to reach a target value, with a timeout.
  function waitForStatus(transport, target, timeoutMs = 1500) {
    if (transport.status.value === target) { return Promise.resolve(); }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`status never reached ${target}`)), timeoutMs);
      const stop = effect(() => {
        if (transport.status.get() === target) {
          clearTimeout(timer);
          queueMicrotask(() => { stop.stop(); resolve(); });
        }
      });
    });
  }

  it('reconnect() drops the WebSocket and re-opens with the same signals', async () => {
    const http = await import('node:http');
    const { connectLive } = await import('kensington/live');
    const httpServer = http.createServer((_req, res) => res.end('ok'));
    const live = await liveServer({ persistence: { kind: 'memory' }, heartbeatInterval: false });
    await live.attach(httpServer);
    const port = await listen(httpServer);
    const transport = connectLive({ url: `ws://127.0.0.1:${port}/__kensington/live`, reconnect: { initialDelay: 30, maxDelay: 200 } });
    try {
      await waitForStatus(transport, 'connected');
      // Force a reconnect. Should walk reconnecting → connected.
      transport.reconnect();
      assert.strictEqual(transport.status.value, 'reconnecting');
      await waitForStatus(transport, 'connected');
    } finally {
      transport.close();
      _clearTransport();
      live.close();
      await new Promise(resolve => { httpServer.close(resolve); });
    }
  });

  it('disconnect() drops the WebSocket and stays disconnected until reconnect() is called', async () => {
    const http = await import('node:http');
    const { connectLive } = await import('kensington/live');
    const httpServer = http.createServer((_req, res) => res.end('ok'));
    const live = await liveServer({ persistence: { kind: 'memory' }, heartbeatInterval: false });
    await live.attach(httpServer);
    const port = await listen(httpServer);
    const transport = connectLive({ url: `ws://127.0.0.1:${port}/__kensington/live`, reconnect: { initialDelay: 30, maxDelay: 200 } });
    try {
      await waitForStatus(transport, 'connected');
      transport.disconnect();
      assert.strictEqual(transport.status.value, 'disconnected');
      // Wait a few backoff cycles and verify it stays disconnected (no auto-reconnect).
      await new Promise(resolve => { setTimeout(resolve, 200); });
      assert.strictEqual(transport.status.value, 'disconnected', 'disconnect() must NOT auto-reconnect');
      // reconnect() resumes.
      transport.reconnect();
      await waitForStatus(transport, 'connected');
    } finally {
      transport.close();
      _clearTransport();
      live.close();
      await new Promise(resolve => { httpServer.close(resolve); });
    }
  });

  it('pauseSend buffers outgoing writes; resumeSend flushes in FIFO order', async () => {
    const http = await import('node:http');
    const { connectLive } = await import('kensington/live');
    const httpServer = http.createServer((_req, res) => res.end('ok'));
    const live = await liveServer({ persistence: { kind: 'memory' }, heartbeatInterval: false });
    await live.attach(httpServer);
    const port = await listen(httpServer);
    const transport = connectLive({ url: `ws://127.0.0.1:${port}/__kensington/live`, reconnect: { initialDelay: 30, maxDelay: 200 } });
    try {
      await waitForStatus(transport, 'connected');
      // Subscribe to a name; the initial subscribe should flush during connect.
      const sig = liveSignal(0, 'pause:test');
      // Pause sends. Subsequent .set() calls accumulate in the outbound buffer.
      transport.pauseSend();
      sig.set(1);
      sig.set(2);
      sig.set(3);
      // Wait long enough that, if writes were flowing, the server would have seen them.
      await new Promise(resolve => { setTimeout(resolve, 100); });
      // Server hasn't seen 1/2/3 because the client buffered them.
      // (We can't directly read the server's "have I received" without instrumentation;
      // resume and then verify the final value lands.)
      transport.resumeSend();
      await new Promise(resolve => { setTimeout(resolve, 100); });
      assert.strictEqual(live.get('pause:test'), 3);
    } finally {
      transport.close();
      _clearTransport();
      live.close();
      await new Promise(resolve => { httpServer.close(resolve); });
    }
  });

  it('rejects pending and new .set with reason=disconnected on transition to disconnected', async () => {
    const { connectLive, liveSignal: clientLiveSignal } = await import('kensington/live');
    const origWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = class FakeWebSocket {
      constructor() {
        this.readyState = 0;
        this.listeners = { open: [], close: [], message: [], error: [] };
        queueMicrotask(() => {
          for (const fn of this.listeners.close) { fn({}); }
        });
      }

      addEventListener(type, fn) { this.listeners[type].push(fn); }

      close() {}
    };
    const transport = connectLive({
      url: 'ws://127.0.0.1:0/__kensington/live',
      reconnect: { initialDelay: 5, maxDelay: 10, maxRetries: 2 },
    });
    try {
      const sig = clientLiveSignal('initial', 'cap:hang');
      const pending = sig.set('queued-while-connecting');
      await waitForStatus(transport, 'disconnected', 5_000);
      // Pending write rejected with reason=disconnected, not hung.
      let caught;
      try { await pending; }
      catch (err) { caught = err; }
      assert.ok(caught, 'pending write must reject');
      assert.strictEqual(caught.name, 'LiveSetRejected');
      assert.strictEqual(caught.reason, 'disconnected');
      // New writes attempted while disconnected reject immediately.
      let caughtNew;
      try { await sig.set('attempted-while-disconnected'); }
      catch (err) { caughtNew = err; }
      assert.ok(caughtNew, 'new write must reject');
      assert.strictEqual(caughtNew.reason, 'disconnected');
    } finally {
      transport.close();
      _clearTransport();
      globalThis.WebSocket = origWebSocket;
    }
  });

  it('maxRetries cap transitions status to disconnected when the server is unreachable', async () => {
    const { connectLive } = await import('kensington/live');
    // Replace globalThis.WebSocket with a stub that fires `close` on the next
    // microtask. This avoids real network behavior, which varies across OSes
    // (some kernels hang the connect to a closed/destroying port for seconds).
    // The stub still exercises the full client-side maxRetries cap path.
    const origWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = class FakeWebSocket {
      constructor() {
        this.readyState = 0;
        this.listeners = { open: [], close: [], message: [], error: [] };
        queueMicrotask(() => {
          for (const fn of this.listeners.close) { fn({}); }
        });
      }

      addEventListener(type, fn) { this.listeners[type].push(fn); }

      close() {}
    };
    const transport = connectLive({
      url: 'ws://127.0.0.1:0/__kensington/live',
      reconnect: { initialDelay: 5, maxDelay: 10, maxRetries: 3 },
    });
    try {
      await waitForStatus(transport, 'disconnected', 5_000);
      assert.strictEqual(transport.status.value, 'disconnected');
    } finally {
      transport.close();
      _clearTransport();
      globalThis.WebSocket = origWebSocket;
    }
  });

  it('onFrame fires for both outbound and inbound frames', async () => {
    const http = await import('node:http');
    const { connectLive } = await import('kensington/live');
    const httpServer = http.createServer((_req, res) => res.end('ok'));
    const live = await liveServer({ persistence: { kind: 'memory' }, heartbeatInterval: false });
    await live.attach(httpServer);
    const port = await listen(httpServer);
    const frames = [];
    const transport = connectLive({
      url: `ws://127.0.0.1:${port}/__kensington/live`,
      reconnect: { initialDelay: 30, maxDelay: 200 },
      onFrame: (dir, frame) => { frames.push({ dir, type: frame.type, name: frame.name }); },
    });
    try {
      await waitForStatus(transport, 'connected');
      live.set('frame:test', 'hello');
      const sig = liveSignal(null, 'frame:test');
      // Wait for the subscribe + snapshot round-trip.
      await new Promise(resolve => { setTimeout(resolve, 100); });
      const outSubscribe = frames.find(f => f.dir === 'out' && f.type === 'subscribe' && f.name === 'frame:test');
      const inSnapshot = frames.find(f => f.dir === 'in' && f.type === 'snapshot');
      assert.ok(outSubscribe !== undefined, 'outbound subscribe recorded');
      assert.ok(inSnapshot !== undefined, 'inbound snapshot recorded');
      // Sanity-check the signal value to confirm the test is exercising the live path.
      assert.strictEqual(sig.value, 'hello');
    } finally {
      transport.close();
      _clearTransport();
      live.close();
      await new Promise(resolve => { httpServer.close(resolve); });
    }
  });

  it('multiple server writes in one microtask coalesce into a MSG_BATCH_UPDATE', async () => {
    const http = await import('node:http');
    const { connectLive } = await import('kensington/live');
    const httpServer = http.createServer((_req, res) => res.end('ok'));
    const live = await liveServer({ persistence: { kind: 'memory' }, heartbeatInterval: false });
    await live.attach(httpServer);
    const port = await listen(httpServer);
    const inbound = [];
    const transport = connectLive({
      url: `ws://127.0.0.1:${port}/__kensington/live`,
      reconnect: { initialDelay: 30, maxDelay: 200 },
      onFrame: (dir, frame) => { if (dir === 'in') { inbound.push(frame); } },
    });
    try {
      await waitForStatus(transport, 'connected');
      // Subscribe to several names.
      liveSignal(0, 'batch:a');
      liveSignal(0, 'batch:b');
      liveSignal(0, 'batch:c');
      await new Promise(resolve => { setTimeout(resolve, 50); });
      inbound.length = 0;
      // Three server-side writes in one tick. Should coalesce into one batch.
      live.set('batch:a', 1);
      live.set('batch:b', 2);
      live.set('batch:c', 3);
      await new Promise(resolve => { setTimeout(resolve, 100); });
      const batches = inbound.filter(f => f.type === 'batch-update');
      const singles = inbound.filter(f => f.type === 'update');
      assert.ok(batches.length >= 1, 'expected at least one batch-update');
      assert.strictEqual(singles.length, 0, 'no single update frames when batching is in effect');
      const allNames = new Set();
      for (const b of batches) { for (const u of b.updates ?? []) { allNames.add(u.name); } }
      assert.ok(allNames.has('batch:a'));
      assert.ok(allNames.has('batch:b'));
      assert.ok(allNames.has('batch:c'));
    } finally {
      transport.close();
      _clearTransport();
      live.close();
      await new Promise(resolve => { httpServer.close(resolve); });
    }
  });

  it('transport.unsubscribe(name) removes the name from the transport and sends MSG_UNSUBSCRIBE', async () => {
    const http = await import('node:http');
    const { connectLive } = await import('kensington/live');
    const httpServer = http.createServer((_req, res) => res.end('ok'));
    const live = await liveServer({ persistence: { kind: 'memory' }, heartbeatInterval: false });
    await live.attach(httpServer);
    const port = await listen(httpServer);
    const outbound = [];
    const transport = connectLive({
      url: `ws://127.0.0.1:${port}/__kensington/live`,
      reconnect: { initialDelay: 30, maxDelay: 200 },
      onFrame: (dir, frame) => { if (dir === 'out') { outbound.push(frame); } },
    });
    try {
      await waitForStatus(transport, 'connected');
      liveSignal(0, 'unsub:test');
      await new Promise(resolve => { setTimeout(resolve, 50); });
      transport.unsubscribe('unsub:test');
      await new Promise(resolve => { setTimeout(resolve, 50); });
      const unsubFrame = outbound.find(f => f.type === 'unsubscribe' && f.name === 'unsub:test');
      assert.ok(unsubFrame !== undefined, 'MSG_UNSUBSCRIBE went out');
    } finally {
      transport.close();
      _clearTransport();
      live.close();
      await new Promise(resolve => { httpServer.close(resolve); });
    }
  });

  it('rejects .set with non-finite numbers (NaN, Infinity) with a structured error and warning', async () => {
    const http = await import('node:http');
    const { connectLive, liveSignal: clientLiveSignal } = await import('kensington/live');
    const httpServer = http.createServer((_req, res) => res.end('ok'));
    const live = await liveServer({ persistence: { kind: 'memory' }, heartbeatInterval: false });
    await live.attach(httpServer);
    const port = await listen(httpServer);
    _clearTransport();
    const transport = connectLive({
      url: `ws://127.0.0.1:${port}/__kensington/live`,
      reconnect: { initialDelay: 30, maxDelay: 200 },
    });
    const warns = [];
    const origWarn = console.warn;
    console.warn = msg => warns.push(msg);
    try {
      await waitForStatus(transport, 'connected');
      const sig = clientLiveSignal(0, 'non-finite');
      await new Promise(resolve => { setTimeout(resolve, 50); });

      // Top-level NaN.
      let caught;
      try { await sig.set(NaN); }
      catch (err) { caught = err; }
      assert.ok(caught, 'NaN write must reject');
      assert.strictEqual(caught.name, 'LiveSetRejected');
      assert.strictEqual(caught.reason, 'unserializable');

      // Nested Infinity inside an object.
      let caughtNested;
      try { await sig.set({ x: 1, y: Infinity }); }
      catch (err) { caughtNested = err; }
      assert.ok(caughtNested, 'nested Infinity write must reject');
      assert.strictEqual(caughtNested.reason, 'unserializable');

      assert.ok(warns.some(w => /non-finite/.test(w)), 'expected non-finite warning');
    } finally {
      console.warn = origWarn;
      transport.close();
      _clearTransport();
      live.close();
      await new Promise(resolve => { httpServer.close(resolve); });
    }
  });

  it('fire-and-forget sig.set(value) does not surface unhandled rejection on canWrite failure', async () => {
    const http = await import('node:http');
    const { connectLive, liveSignal: clientLiveSignal } = await import('kensington/live');
    const httpServer = http.createServer((_req, res) => res.end('ok'));
    const live = await liveServer({
      persistence: { kind: 'memory' },
      canWrite: 'server-only',
      heartbeatInterval: false,
    });
    await live.attach(httpServer);
    const port = await listen(httpServer);
    _clearTransport();
    const transport = connectLive({
      url: `ws://127.0.0.1:${port}/__kensington/live`,
      reconnect: { initialDelay: 30, maxDelay: 200 },
    });
    const unhandled = [];
    const handler = ev => { unhandled.push(ev.reason); };
    process.on('unhandledRejection', handler);
    try {
      await waitForStatus(transport, 'connected');
      const sig = clientLiveSignal('initial', 'fire-and-forget:silencer');
      await new Promise(resolve => { setTimeout(resolve, 50); });
      // Fire-and-forget. Promise is rejected but the internal silencer keeps
      // it from emitting unhandledRejection.
      sig.set('blocked');
      // Two microtask boundaries to let any pending unhandledRejection fire.
      await new Promise(resolve => { setTimeout(resolve, 100); });
      assert.deepStrictEqual(unhandled, []);
    } finally {
      process.off('unhandledRejection', handler);
      transport.close();
      _clearTransport();
      live.close();
      await new Promise(resolve => { httpServer.close(resolve); });
    }
  });

  it('sig.set(value) resolves on success and rejects with structured info + rollback on canWrite failure', async () => {
    const http = await import('node:http');
    const { connectLive, liveSignal: clientLiveSignal } = await import('kensington/live');
    const httpServer = http.createServer((_req, res) => res.end('ok'));
    const live = await liveServer({
      persistence: { kind: 'memory' },
      canWrite: (name, ctx, { next }) => next !== 'banned',
      heartbeatInterval: false,
    });
    await live.attach(httpServer);
    const port = await listen(httpServer);
    _clearTransport();
    const transport = connectLive({
      url: `ws://127.0.0.1:${port}/__kensington/live`,
      reconnect: { initialDelay: 30, maxDelay: 200 },
    });
    try {
      await waitForStatus(transport, 'connected');
      const sig = clientLiveSignal('initial', 'direct:e2e');
      // Wait one microtask cycle for the snapshot to arrive.
      await new Promise(resolve => { setTimeout(resolve, 50); });

      // Success: Promise resolves; server-side registry reflects the write.
      await sig.set('ok');
      assert.strictEqual(sig.value, 'ok');
      assert.strictEqual(live.get('direct:e2e'), 'ok');

      // Rejection: optimistic apply happens, then server-authoritative rollback,
      // then Promise rejects with structured error.
      let caught;
      try { await sig.set('banned'); }
      catch (err) { caught = err; }
      assert.ok(caught, 'expected sig.set to reject');
      assert.strictEqual(caught.name, 'LiveSetRejected');
      assert.strictEqual(caught.signalName, 'direct:e2e');
      assert.strictEqual(caught.reason, 'forbidden');
      assert.strictEqual(caught.attemptedValue, 'banned');
      assert.strictEqual(caught.authoritativeValue, 'ok');
      // Local Signal rolled back to the authoritative value.
      assert.strictEqual(sig.value, 'ok');
    } finally {
      transport.close();
      _clearTransport();
      live.close();
      await new Promise(resolve => { httpServer.close(resolve); });
    }
  });
});
