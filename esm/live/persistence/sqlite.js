// Sqlite persistence adapter. Lazy-loads `better-sqlite3` only when invoked,
// so projects on `{ kind: 'memory' }` (or projects that don't use kensington/live
// at all) never need the native dep.
//
// Writes are debounced via setTimeout to coalesce bursts; reads go through the
// in-memory mirror that's loaded on startup from the database. Schema is a
// single table with name TEXT PRIMARY KEY and a JSON-serialized value column.

export async function createSqliteStore({ path, flushInterval = 250 } = {}) {
  if (!path) { throw new Error("kensington/live sqlite persistence requires { path: '...' }"); }

  // Resolve better-sqlite3 from the user's app, not from kensington's own
  // node_modules. When kensington is installed via `link:` or any symlink
  // path, the dynamic `import('better-sqlite3')` resolves relative to this
  // file's location (kensington's own node_modules), which won't have the
  // optional peer dep installed. Using createRequire anchored at the user's
  // cwd lets Node walk up from there to find the package wherever the user's
  // package manager actually put it.
  let Database;
  try {
    const { createRequire } = await import('node:module');
    const { join } = await import('node:path');
    const userRequire = createRequire(join(process.cwd(), 'package.json'));
    Database = userRequire('better-sqlite3');
  } catch (err) {
    // Fall back to the dynamic-import path (works when kensington is installed
    // normally and better-sqlite3 sits alongside it in the same node_modules).
    try {
      Database = (await import('better-sqlite3')).default;
    } catch {
      throw new Error(
        "kensington/live sqlite persistence requires the 'better-sqlite3' package. "
        + 'Install in your project with `npm install better-sqlite3` (or your package manager equivalent). '
        + `Resolution attempt failed: ${err?.message ?? err}`,
      );
    }
  }

  const { mkdirSync } = await import('node:fs');
  const { dirname } = await import('node:path');
  mkdirSync(dirname(path), { recursive: true });

  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS live_signals (
      name  TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  const mirror = new Map();
  for (const row of db.prepare('SELECT name, value FROM live_signals').iterate()) {
    try { mirror.set(row.name, JSON.parse(row.value)); }
    catch { /* corrupted row; skip */ }
  }

  const pendingWrites = new Map(); // name → value (or DELETE_MARKER)
  const DELETE_MARKER = Symbol('delete');
  let flushTimer = null;

  const writeOne = db.prepare(`INSERT INTO live_signals (name, value, updated_at) VALUES (?, ?, ?)
                               ON CONFLICT (name) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`);
  const deleteOne = db.prepare('DELETE FROM live_signals WHERE name = ?');
  const flushTxn = db.transaction(writes => {
    const now = Date.now();
    for (const [name, value] of writes) {
      if (value === DELETE_MARKER) { deleteOne.run(name); }
      else { writeOne.run(name, JSON.stringify(value), now); }
    }
  });

  function scheduleFlush() {
    if (flushTimer !== null) { return; }
    flushTimer = setTimeout(() => {
      flushTimer = null;
      if (pendingWrites.size === 0) { return; }
      const batch = [...pendingWrites.entries()];
      pendingWrites.clear();
      try { flushTxn(batch); }
      catch (err) { console.error('kensington/live sqlite flush failed:', err); }
    }, flushInterval);
  }

  return {
    get(name) { return mirror.get(name); },
    set(name, value) {
      mirror.set(name, value);
      pendingWrites.set(name, value);
      scheduleFlush();
    },
    delete(name) {
      mirror.delete(name);
      pendingWrites.set(name, DELETE_MARKER);
      scheduleFlush();
    },
    all() { return mirror.entries(); },
    list(prefix) {
      const out = [];
      for (const [name, value] of mirror.entries()) {
        if (name.startsWith(prefix)) { out.push([name, value]); }
      }
      return out;
    },
    close() {
      if (flushTimer !== null) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      if (pendingWrites.size > 0) {
        const batch = [...pendingWrites.entries()];
        pendingWrites.clear();
        try { flushTxn(batch); }
        catch (err) { console.error('kensington/live sqlite final flush failed:', err); }
      }
      db.close();
    },
  };
}
