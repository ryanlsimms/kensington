// Wire protocol for kensington/live. JSON over WebSocket.
//
// Client → Server:
//   { type: 'subscribe',   name, persist? }
//   { type: 'unsubscribe', name }
//   { type: 'set',         name, value, ifLamport?, opId? }
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
// CAS (compare-and-swap) writes. When the client's `.set(fn)` form is used,
// the library sends MSG_SET with `ifLamport` set to the last lamport the
// client has seen for this name, plus an `opId` to correlate the response.
// The server applies the write only if its current lamport for the name
// matches `ifLamport`; otherwise it sends `set-fail` with reason `conflict`
// and the current authoritative value+lamport so the client can re-run fn
// and retry. The server replies with `set-ok` on success. `set-ok` and
// `set-fail` go ONLY to the originating socket; the regular `update`
// broadcast still goes to all other subscribers. Direct value writes
// (.set(value)) omit `ifLamport` and `opId`; the server applies
// unconditionally as before. canWrite rejections come back as `set-fail`
// with reason `forbidden`.

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
