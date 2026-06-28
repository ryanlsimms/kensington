// Shared constants for kensington/live. Imported by both server.js and
// client.js to keep their defaults in lockstep.

// Default WebSocket path. Deliberately namespaced so it can't collide with
// user-defined routes (`/live`, `/ws`, etc are too easy to accidentally
// double-book). The server mounts here; the client connects here. Override
// on either side by passing `path` to `liveServer` or `url` to `connectLive`.
export const DEFAULT_LIVE_PATH = '/__kensington/live';
