// In-memory persistence adapter. Default for liveServer when no `persistence`
// option is passed or when `{ kind: 'memory' }` is explicitly chosen.
//
// Loses all state on process restart, which is the documented behavior for
// memory-mode. For durability across restarts, use `{ kind: 'sqlite', path }`.

export function createMemoryStore() {
  const map = new Map();
  return {
    get(name) { return map.get(name); },
    set(name, value) { map.set(name, value); },
    delete(name) { map.delete(name); },
    all() { return map.entries(); },
    list(prefix) {
      const out = [];
      for (const [name, value] of map.entries()) {
        if (name.startsWith(prefix)) { out.push([name, value]); }
      }
      return out;
    },
    close() { /* nothing to close */ },
  };
}
