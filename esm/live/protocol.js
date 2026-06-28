// Wire protocol for kensington/live. JSON over WebSocket.
//
// Client → Server:
//   { type: 'subscribe',   name, persist? }
//   { type: 'unsubscribe', name }
//   { type: 'set',         name, value, opId, ifLamport? }
//
// Server → Client:
//   { type: 'snapshot',   values: { [name]: value }, lamport }
//   { type: 'update',     name, value, lamport }
//   { type: 'batch-update', updates: Array<{ name, value, lamport }> }
//   { type: 'set-ok',     name, lamport, opId }
//   { type: 'set-fail',   name, opId, reason, value, lamport }
//   { type: 'error',      name, reason }
//
// Lamport is a monotonically-increasing integer assigned by the server.
// It appears on every server-to-client frame so the client can drop stale
// broadcasts. On client-to-server `set` frames it appears only as `ifLamport`
// inside the CAS form; direct (non-CAS) writes carry no lamport.
//
// The optional `persist` boolean on SUBSCRIBE declares the per-name
// persistence policy. Default false. The first declaration the server sees
// wins; subsequent declarations with a different value warn but keep the
// stored policy. See `agent-docs/live-signals.md` for the user-facing
// description.
//
// Writes. Every client-side `.set` (both `.set(value)` and `.set(fn)`)
// carries an `opId` so the server can route its verdict back to the
// originating call site. Direct writes (`.set(value)`) omit `ifLamport`;
// the server applies them unconditionally subject to `canWrite`. CAS writes
// (`.set(fn)`) include `ifLamport` set to the client's last-seen lamport
// for the name; the server applies only if its current lamport matches,
// otherwise it sends `set-fail` with reason `conflict` and the
// authoritative value so the client can re-run fn and retry. `set-fail`
// always includes the server's authoritative `value` + `lamport` so the
// client can roll back the optimistic local apply via `_setFromRemote`
// before rejecting the per-call Promise. Rejection reasons: `'forbidden'`
// (canWrite), `'conflict'` (CAS lamport mismatch), `'unserializable'`.
// `set-ok` and `set-fail` go ONLY to the originating socket; the regular
// `update` broadcast still goes to all other subscribers.
//
// `error` is reserved for non-write protocol failures (currently only
// canRead rejection on `subscribe`). Write rejections always come back as
// `set-fail`, never `error`.

export const MSG_SUBSCRIBE = 'subscribe';
export const MSG_UNSUBSCRIBE = 'unsubscribe';
export const MSG_SET = 'set';
export const MSG_SNAPSHOT = 'snapshot';
export const MSG_UPDATE = 'update';
export const MSG_BATCH_UPDATE = 'batch-update';
export const MSG_SET_OK = 'set-ok';
export const MSG_SET_FAIL = 'set-fail';
export const MSG_ERROR = 'error';

export function encode(msg) {
  return JSON.stringify(msg);
}

export function decode(raw) {
  try { return JSON.parse(raw); }
  catch { return null; }
}

export function isClientMessage(msg) {
  if (msg === null || typeof msg !== 'object') { return false; }
  if (typeof msg.type !== 'string' || typeof msg.name !== 'string') { return false; }
  return msg.type === MSG_SUBSCRIBE || msg.type === MSG_UNSUBSCRIBE || msg.type === MSG_SET;
}

export function isServerMessage(msg) {
  if (msg === null || typeof msg !== 'object') { return false; }
  if (typeof msg.type !== 'string') { return false; }
  return msg.type === MSG_SNAPSHOT
    || msg.type === MSG_UPDATE
    || msg.type === MSG_BATCH_UPDATE
    || msg.type === MSG_SET_OK
    || msg.type === MSG_SET_FAIL
    || msg.type === MSG_ERROR;
}
