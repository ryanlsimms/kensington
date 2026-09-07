// Passive validation context shared by reactive runtimes in accessible windows.
// The core carries a callback only. Diagnostic policy lives in runtime-guard.js,
// which slim builds do not load. Each signal.js evaluation creates its own token.
const CONTEXT_KEY = Symbol.for('kensington.reactive.validation.v1');
export const RUNTIME_OWNER = Symbol.for('kensington.reactive.owner.v1');
let context = {};

function findContextHost() {
  let current = globalThis;
  const seen = new Set([current]);
  for (let depth = 0; depth < 32; depth++) {
    let next;
    try {
      const parent = current.parent;
      next = parent && parent !== current ? parent : current.opener;
      if (!next || seen.has(next)) { break; }
      Reflect.get(next, CONTEXT_KEY);
    } catch {
      break;
    }
    seen.add(next);
    current = next;
  }
  return current;
}

try {
  const host = findContextHost();
  host[CONTEXT_KEY] ||= context;
  context = host[CONTEXT_KEY];
} catch {
  // Non-extensible globals retain a local context.
}

export function createRuntimeContext() {
  const token = {};
  return {
    token,
    check(operation, owner = token) { context.check?.(owner, operation); },
    capture() { return context.check; },
    run(check, fn) {
      if (context.check === check) { return fn(); }
      const previous = context.check;
      context.check = check;
      try {
        return fn();
      } finally {
        context.check = previous;
      }
    },
  };
}
