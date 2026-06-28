# Recipes

Subdoc of the root `AGENTS.md`. Read this when looking for small, copy-pasteable helpers built on top of `signal` and `effect` (`styled`, `portal`, `createContext`, `useReducer`, `useLocalStorage`, `useDebounce`, `useFetch`, `useId`) or for the shared-layout and Tailwind patterns. Each is a few lines; copy into your project as needed.

## styled. CSS-in-JS components with pseudo-selectors, media queries, and composition

Kensington tags accept inline `style` objects. What inline styles cannot do is pseudo-selectors (`:hover`, `:focus-visible`), at-rules (`@media`), or reuse across components. `styled(tag, styles)` fills the gap. It takes a tag closure and a style object (camelCase keys plus nested keys for pseudo-selectors and at-rules), injects a class into a shared stylesheet, and returns a new tag closure.

```javascript
// styled.js
let _id = 0;
let _style;
const sheet = () => (_style ??= document.head.appendChild(document.createElement('style')));
const kebab = s => s.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);

function toCss(selector, styles) {
  const decls = [];
  let nested = '';
  for (const [k, v] of Object.entries(styles)) {
    if (v && typeof v === 'object') {
      nested += k.startsWith('@')
        ? `${k} { ${toCss(selector, v)} } `
        : `${toCss(selector + k, v)} `;
    } else if (v !== null && v !== undefined && v !== false) {
      decls.push(`${kebab(k)}:${v}`);
    }
  }
  return (decls.length ? `${selector} { ${decls.join(';')} } ` : '') + nested;
}

function isAttrs(x) {
  return x !== null
    && typeof x === 'object'
    && !Array.isArray(x)
    && !x._isKensingtonTag
    && !x._isKensingtonSignal;
}

export function styled(tag, styles) {
  const className = `k-${++_id}`;
  sheet().textContent += toCss(`.${className}`, styles);
  return (...args) => {
    const hasAttrs = args.length > 0 && isAttrs(args[0]);
    const attrs = hasAttrs ? args[0] : {};
    const rest = hasAttrs ? args.slice(1) : args;
    const merged = { ...attrs, class: [className, attrs.class].filter(Boolean) };
    return tag(merged, ...rest);
  };
}
```

Usage. The returned tag is a plain kensington tag closure. It takes the same arguments any tag does.

```javascript
import { signal, t } from 'kensington';
import { styled } from './styled.js';

const Card = styled(t.section, {
  background: 'white',
  borderRadius: '0.5rem',
  padding: '1rem',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
});

const Button = styled(t.button, {
  background: 'hsl(220 10% 90%)',
  color: 'hsl(220 10% 20%)',
  border: 0,
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  ':hover':         { background: 'hsl(220 10% 85%)' },
  ':focus-visible': { outline: '2px solid hsl(220 80% 70%)' },
});

const count = signal(0);
Button({ type: 'button', onclick: () => count.set(n => n + 1) }, [
  count.transform(n => `Clicked ${n} times`),
]);
```

Composition. Passing a styled tag as the first argument to `styled` layers both classes. The new tag carries the base's generated class AND its own, and later-defined styles win by source order. Compose to any depth.

```javascript
// Base. Common geometry, no opinion on color.
const Button = styled(t.button, {
  border: '1px solid transparent',
  borderRadius: '4px',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  cursor: 'pointer',
});

// One level. Tone variants extend the base.
const PrimaryButton = styled(Button, {
  background: 'hsl(220 80% 50%)',
  color: 'white',
  fontWeight: 600,
  border: 0,
  ':hover': { background: 'hsl(220 80% 40%)' },
});

const DangerButton = styled(Button, {
  background: 'transparent',
  border: '1px solid hsl(0 70% 50%)',
  color: 'hsl(0 70% 50%)',
  ':hover': { background: 'hsl(0 70% 95%)' },
});

// Two levels. CtaButton extends PrimaryButton with larger sizing.
const CtaButton = styled(PrimaryButton, {
  fontSize: '1rem',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  marginTop: '0.75rem',
});

Card([
  t.h2('Confirm'),
  CtaButton({ type: 'button' }, 'Save and continue'),
  DangerButton({ type: 'button' }, 'Delete'),
]);
```

Each composed tag carries every ancestor class. The CSS cascade resolves overrides by class-rule order in the stylesheet, which mirrors the order `styled(...)` calls run at module load. Define the base before the descendant.

Pattern. A shared primitives module. For any app with more than a handful of styled components, factor common surfaces, buttons, text, and inputs into one `ui.ts` file and extend from there. This is the kensington equivalent of a design system. The CSS deduplication is real (one declaration per base, zero per usage site), and source-level intent becomes scannable.

```javascript
// ui.js. The single source of styled primitives. Imported by every view and widget.
import { t } from 'kensington';
import { styled } from './styled.js';

// surfaces
export const surface = styled(t.div, {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
});
export const card = styled(surface, { padding: '0.75rem 1rem', marginBottom: '0.75rem' });
export const heroSurface = styled(t.section, {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '14px',
  padding: '1.5rem',
  marginBottom: '1rem',
});

// buttons
export const buttonBase = styled(t.button, {
  border: '1px solid transparent',
  borderRadius: '4px',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  cursor: 'pointer',
});
export const primaryBtn = styled(buttonBase, {
  background: 'var(--color-accent)',
  color: '#000',
  fontWeight: 600,
  border: 0,
});
export const ghostBtn = styled(buttonBase, {
  background: 'transparent',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  ':hover': { borderColor: 'var(--color-accent)' },
});
export const dangerBtn = styled(buttonBase, {
  background: 'transparent',
  border: '1px solid var(--color-danger)',
  color: 'var(--color-danger)',
});

// text
export const muted = styled(t.span, {
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
});

// inputs
export const formInput = styled(t.input, {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  padding: '0.5rem 0.75rem',
  color: 'var(--color-text)',
  ':focus': { outline: 'none', borderColor: 'var(--color-accent)' },
});
```

Then in views and widgets, extend the primitives with per-screen sizing or one-off tweaks. Avoid redeclaring the surface or button geometry.

```javascript
// settings-view.js
import { card, muted, primaryBtn, formInput } from './ui.js';
import { styled } from './styled.js';

// per-view extension: a wider input. Not a redeclaration of the base.
const fullWidthInput = styled(formInput, { width: '100%' });

const small = styled(muted, { fontSize: '0.75rem' });
```

Rules of thumb.

- A new color, padding, border, or radius that appears in more than one component is a primitive. Move it to `ui.js`.
- A per-component tweak (one-off size, one-off margin) extends a primitive at the call site. It does not redeclare the base.
- Compose by extension, not by spreading style objects. `styled(Base, overrides)` produces one CSS class per layer. Object spread (`styled(t.div, { ...baseStyles, ... })`) duplicates declarations in the stylesheet.
- Name primitives by *role* (surface, card, primaryBtn) not by *appearance* (whiteBox, bigBlueButton). Roles survive a redesign; appearance names rot.

Variant props. Declare modifier classes inside the styles object and let the caller pick one via `class`. Combine with a signal-valued `class` for reactive variants.

```javascript
const Alert = styled(t.div, {
  padding: '0.75rem 1rem',
  borderRadius: '4px',
  borderLeft: '4px solid',
  '.info':  { background: 'hsl(220 80% 95%)', borderLeftColor: 'hsl(220 80% 50%)' },
  '.warn':  { background: 'hsl(40 90% 95%)',  borderLeftColor: 'hsl(40 90% 50%)'  },
  '.error': { background: 'hsl(0 80% 95%)',   borderLeftColor: 'hsl(0 80% 50%)'   },
});

const level = signal('info');
Alert({ class: level }, level.transform(l => `Status: ${l}`));
```

Flipping `level.set('warn')` swaps the modifier class on the live element. The static base styles live in the generated class once.

## portal. Render a subtree into a DOM node outside the parent

Kensington has no portal API because `.toElement()` already returns a real DOM node. Append it wherever you want. Wrap the call in an `effect` to tie mount/unmount to a signal.

```javascript
// portal.js
export function portal(target, fn) {
  const node = fn().toElement();
  target.append(node);
  return () => node.remove();
}
```

```javascript
import { signal, effect, t } from 'kensington';
import { portal } from './portal.js';

const modalRoot = document.createElement('div');
document.body.append(modalRoot);

const isOpen = signal(false);

let remove = null;
effect(() => {
  if (isOpen.get()) {
    remove = portal(modalRoot, () =>
      t.div({ class: 'overlay' }, [
        t.div({ class: 'modal' }, [
          t.h2('Confirm'),
          t.button({ type: 'button', onclick: () => isOpen.set(false) }, 'Close'),
        ]),
      ]),
    );
  } else {
    remove?.();
    remove = null;
  }
});
```

## createContext. Provider/consumer pattern with a signal stack

React's `createContext` / `useContext` translates to a signal stack. Consumers call `context.get()` during synchronous construction to capture the nearest provider's signal; the signal reference stays reactive after construction.

```javascript
// create-context.js
import { signal } from 'kensington';

export function createContext(defaultValue) {
  const _stack = [signal(defaultValue)];
  return {
    get() { return _stack.at(-1); },
    provide(value, fn) {
      const ctx = signal(value);
      _stack.push(ctx);
      try { return fn(ctx); } finally { _stack.pop(); }
    },
    set(val) { return this.get().set(val); },
  };
}
```

```javascript
const ThemeContext = createContext('light');

function themeCard(title) {
  const theme = ThemeContext.get();
  return t.div({ class: theme.transform(v => `card card--${v}`) }, [
    t.strong(title), t.small(['theme: ', theme]),
  ]);
}

const app = t.div([
  ThemeContext.provide('dark', () => t.section([themeCard('Always dark')])),
  themeCard('Default'),
]);
```

## useReducer. Action-dispatch wrapper around a signal

Wrap `signal.set` with a reducer to centralize state transitions. Call sites only send action objects.

```javascript
// use-reducer.js
import { signal } from 'kensington';

export function useReducer(reducer, initialState) {
  const state = signal(initialState);
  const dispatch = action => state.set(s => reducer(s, action));
  return { state, dispatch };
}
```

## useLocalStorage. A signal that mirrors a localStorage key

Reads the initial value from `localStorage`, writes back on every change. The `effect` does the sync. Guard the initial read with `isBrowser` so server-rendered components do not throw.

```javascript
// use-local-storage.js
import { signal, effect, isBrowser } from 'kensington';

export function useLocalStorage(key, defaultValue) {
  const stored = isBrowser ? localStorage.getItem(key) : null;
  const s = signal(stored !== null ? JSON.parse(stored) : defaultValue);
  effect(() => { localStorage.setItem(key, JSON.stringify(s.get())); });
  return s;
}
```

## useDebounce. A derived signal that updates only after the source settles

Each time the source changes, the pending timeout is cleared and restarted. The timeout id lives in the enclosing closure because `effect` does not support a cleanup return value.

```javascript
// use-debounce.js
import { signal, effect } from 'kensington';

export function useDebounce(source, delay) {
  const debounced = signal(source.get());
  let id;
  effect(() => {
    const value = source.get();
    clearTimeout(id);
    id = setTimeout(() => debounced.set(value), delay);
  });
  return debounced;
}
```

## useFetch. `{ data, loading, error }` signals for a URL signal

When the URL changes, the in-flight request is aborted via `AbortController` before the new one starts.

```javascript
// use-fetch.js
import { signal, effect } from 'kensington';

export function useFetch(urlSignal) {
  const data = signal(null);
  const loading = signal(true);
  const error = signal(null);
  let controller;

  effect(() => {
    if (controller) controller.abort();
    controller = new AbortController();
    loading.set(true);
    error.set(null);
    fetch(urlSignal.get(), { signal: controller.signal })
      .then(r => r.json())
      .then(json => { data.set(json); loading.set(false); })
      .catch(err => {
        if (err.name !== 'AbortError') { error.set(err.message); loading.set(false); }
      });
  });

  return { data, loading, error };
}
```

## useId. Stable unique IDs for pairing labels with inputs

A module-level counter increments once per call. On the server it produces the same sequence on every request, so SSR-output IDs and client-hydration IDs match as long as components are called in the same order.

```javascript
// use-id.js
let _id = 0;
export function useId(prefix = 'k') { return `${prefix}-${++_id}`; }
```

## Layout with shared header and footer

```javascript
// layout.js
import { t } from 'kensington';

export function layout(title, content) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.title(title),
      t.link({ rel: 'stylesheet', href: '/style.css' }),
    ]),
    t.body([
      t.header(
        t.nav({ class: 'nav' }, [
          t.a({ href: '/', class: 'nav-brand' }, 'My App'),
          t.ul({ class: 'nav-links' }, [
            t.li(t.a({ href: '/about' }, 'About')),
            t.li(t.a({ href: '/contact' }, 'Contact')),
          ]),
        ])
      ),
      t.main({ class: 'container' }, content),
      t.footer(t.p('© 2025 My App')),
    ]),
  ]).toString();
}
```

## Tailwind CSS

The class array makes long Tailwind class lists easier to read and conditionally modify:

```javascript
import { t } from 'kensington';

// Conditional classes are natural with arrays. False/null entries are dropped
function button(label, { variant = 'primary', disabled = false } = {}) {
  return t.button({
    type: 'button',
    disabled,
    class: [
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
      variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      variant === 'secondary' && 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
      variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      disabled && 'opacity-50 cursor-not-allowed',
    ],
  }, label);
}

// Card component
function card(title, body) {
  return t.div({ class: 'rounded-lg border border-gray-200 bg-white shadow-sm p-6' }, [
    t.h3({ class: 'text-lg font-semibold text-gray-900 mb-2' }, title),
    t.div({ class: 'text-gray-600 text-sm' }, body),
  ]);
}

// Alert banner
function alert(message, type = 'info') {
  const styles = {
    info:    'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error:   'bg-red-50 text-red-800 border-red-200',
  };
  return t.div({ class: `rounded-md border px-4 py-3 text-sm ${styles[type]}` }, message);
}

// Page with a responsive grid
t.div({ class: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' }, [
  t.h1({ class: 'text-3xl font-bold text-gray-900 mb-6' }, 'Dashboard'),
  alert('Your trial expires in 3 days.', 'warning'),
  t.div({ class: 'mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' }, [
    card('Users', '1,284 total'),
    card('Revenue', '$24,500 this month'),
    card('Active sessions', '42 right now'),
  ]),
  t.div({ class: 'mt-8 flex gap-3' }, [
    button('Save changes'),
    button('Cancel', { variant: 'secondary' }),
    button('Delete account', { variant: 'danger' }),
  ]),
]);
```

## Presence with heartbeat. Multi-client list aggregation without races

Canonical pattern for any "list of users / items / facts contributed by many writers." Replaces the naive single-shared-list shape that has a fundamental read-modify-write race under concurrent writes (see `agent-docs/live-signals.md` → "Shared collections under concurrent writes").

The shape. Each client writes ONLY its own per-key slot. The server aggregates all slots into a shared, server-only-writable view. Clients READ the view, never write it. Heartbeats keep stale slots from accumulating; the server evicts slots whose `lastSeen` ages past a TTL.

Use this pattern for. Presence/viewers, online status, currently-typing indicators, vote tallies, multi-user reactions, cart contributors, shared whiteboard cursors, "who has read this thread" markers. Anything where the list members are independent and additive.

```js
// shared/names.js. Name builders. The same scoping convention on both sides.
export function presenceName(roomId, userId) { return `room:${roomId}:presence:user:${userId}`; }
export function presencePrefix(roomId)        { return `room:${roomId}:presence:user:`; }
export function viewersName(roomId)           { return `room:${roomId}:viewers`; }
```

```js
// shared/room.js. Component file. Imported by both server and client.
import { t, effect, isBrowser } from 'kensington';
import { liveSignal } from 'kensington/live';
import { presenceName, viewersName } from './names.js';

const HEARTBEAT_MS = 2000;

export function room(state, env) {
  const { roomId } = state;
  const { userId, userName } = env;

  // READ ONLY. Server aggregator writes; clients display.
  const viewers = liveSignal({ users: [] }, viewersName(roomId), { persist: true });

  // The per-user slot. Each tab writes ONLY its own slot. The server
  // discovers slots via `live.list(prefix)`, hence persist:true.
  const presence = liveSignal(null, presenceName(roomId, userId), { persist: true });

  const root = t.div({ class: 'room' }, [
    t.p(viewers.transform(v => `${v.users.length} watching`, 'viewer-count')),
    t.ul(viewers.transform(
      v => v.users.map(u => t.li({ 'data-uid': u.id }, u.name)),
      'viewer-list',
    )),
  ]);

  if (isBrowser) {
    let joinedAt = 0;
    let heartbeatHandle = null;
    let keepAlive = null;
    let nameEffect = null;

    root.addConnectedCallback(() => {
      // Keep-alive. See agent-docs/live-signals.md → "The auto-unsubscribe trap".
      keepAlive = effect(() => { viewers.get(); presence.get(); });

      // Write the slot on mount and whenever the display name changes.
      nameEffect = effect(() => {
        const name = userName.get();
        if (!name) { return; }
        if (joinedAt === 0) { joinedAt = Date.now(); }
        presence.set({ name, joinedAt, lastSeen: Date.now() });
      });

      // Heartbeat. Refresh `lastSeen` so the server keeps us listed.
      heartbeatHandle = setInterval(() => {
        const name = userName.value;
        if (!name) { return; }
        presence.set({ name, joinedAt: joinedAt || Date.now(), lastSeen: Date.now() });
      }, HEARTBEAT_MS);
    });

    root.addDisconnectedCallback(() => {
      if (keepAlive !== null) { keepAlive.stop(); keepAlive = null; }
      if (nameEffect !== null) { nameEffect.stop(); nameEffect = null; }
      if (heartbeatHandle !== null) { clearInterval(heartbeatHandle); heartbeatHandle = null; }
      // Best-effort. Mark slot as gone immediately. If the WS does not flush
      // before the tab dies, the server's TTL eviction handles cleanup.
      try { presence.set(null); } catch { /* socket already closed */ }
    });
  }

  return root;
}
```

```js
// server-effects/presence-aggregator.js. The server-side piece.
import { liveSignal } from 'kensington/live';
import { presencePrefix, viewersName } from '../shared/names.js';

// Heartbeat policy. Clients refresh every HEARTBEAT_MS. The server considers
// a slot live if its lastSeen is within TTL_MS of now. Set TTL above twice
// the heartbeat interval to tolerate one missed beat.
const POLL_MS = 500;
const TTL_MS = 5_000;

export function startPresenceAggregator(live, roomId) {
  const viewers = liveSignal({ users: [] }, viewersName(roomId), { persist: true });
  const prefix = presencePrefix(roomId);

  function tick() {
    const now = Date.now();
    const users = [];
    for (const [name, value] of live.list(prefix)) {
      if (value === null || typeof value !== 'object') { continue; }
      const lastSeen = Number(value.lastSeen ?? 0);
      if (now - lastSeen > TTL_MS) { continue; }
      users.push({
        id: name.slice(prefix.length),
        name: String(value.name ?? ''),
        joinedAt: Number(value.joinedAt ?? lastSeen),
      });
    }
    users.sort((a, b) => a.joinedAt - b.joinedAt);
    viewers.set({ users });
  }

  tick();
  const handle = setInterval(tick, POLL_MS);
  if (typeof handle.unref === 'function') { handle.unref(); }

  return { stop: () => clearInterval(handle) };
}
```

```js
// server.js wiring.
import { liveServer } from 'kensington/live';
import { startPresenceAggregator } from './server-effects/presence-aggregator.js';

const live = await liveServer({
  persistence: { kind: 'sqlite', path: './data/live.db' },
  canWrite: name => !name.endsWith(':viewers'),         // clients cannot write the aggregated view
});

for (const roomId of rooms) {
  startPresenceAggregator(live, roomId);
}
```

### Why this shape

- **No race.** Each client writes a different name. No tab can clobber another out of the view.
- **The server is the single writer to the aggregate.** Server-only-writable enforced by `canWrite`. The runtime guarantees one authoritative source for the displayed list.
- **Crashed tabs self-heal.** A tab that closes without flushing its null-write disappears after TTL_MS. No zombie entries linger forever.
- **Discovery happens via `live.list(prefix)`.** Server learns about new slots passively. No subscription contract needed for the aggregator to find new users.

### Tuning

- `POLL_MS` controls latency of departure-by-TTL and arrival-of-first-tab. 500ms feels live. Below 250ms is wasteful on a typical machine.
- `TTL_MS` controls how long a crashed/closed tab lingers. Set above `2 * HEARTBEAT_MS` to tolerate one missed beat. Below that risks evicting a healthy slow tab.
- `HEARTBEAT_MS` controls heartbeat write frequency. Smaller is faster departure detection but more writes. 2s is a sane default. 5s is the upper bound that still feels live.

### What this is not

- **Not for high-frequency per-user state** like cursor positions. Use transient signals (persist:false, see `cursor:user:*` in the live-cursors app) where the per-user signal itself is the broadcast channel, no aggregation needed.
- **Not for ordered append-only logs.** Chat messages, audit trails, etc. need a server-authoritative writer for the shared list. Use a server-side effect that watches per-user "outbox" slots and appends to a server-only-writable log.
- **Not a substitute for a real CRDT.** Two writes to the same per-user slot still race against each other in the last-write-wins sense, but since each user has their own slot, the race is intra-user and almost always harmless (the latest write expresses the user's current state).

### Variant. Reactive aggregator (sub-second updates, transient slots)

The polled-aggregator shape above re-derives the view on every `POLL_MS` tick. Fine for presence (latency on the order of seconds is acceptable). Not fine for vote tallies or any aggregation where each individual write should produce a near-immediate update across all readers. The reactive variant uses an `effect()` instead of a `setInterval`.

Three structural changes from the polled shape:

1. **Per-user slots are transient (`persist: false`)** so they evaporate naturally on tab close (the 30s transient grace period handles the WS-drop case; explicit `onSocketClose` cleanup handles the prompt case).
2. **A `slots` Map holds one cached server-side `Signal` per discovered user.** The effect reads every entry on each run; new entries (new voters) are added by a periodic seed that scans `live.list(prefix)`.
3. **A `slotsVersion` counter forces the effect to re-run when a new slot is added.** Without it, the effect only re-runs on changes to slots it already reads; a brand-new voter's first vote arrives at a name that the effect has never subscribed to, so the aggregate undercounts for one tick.

```js
// server-effects/poll-aggregator.js
import { effect, signal } from 'kensington';
import { liveSignal } from 'kensington/live';

export function startPollAggregator(live, pollId) {
  const meta = liveSignal(null, `poll:${pollId}:meta`);
  const slots = new Map(); // userId → Signal<string | null>
  // Bumped by the seed step whenever a new slot is added. The tally effect
  // reads this signal to subscribe to "the set of known slots." Without it
  // a new voter's first vote isn't visible until the next reseed AND a
  // separate change to an already-tracked slot.
  const slotsVersion = signal(0);

  function ensureSlot(userId) {
    let s = slots.get(userId);
    if (s !== undefined) { return s; }
    // kensington-check-reactive-ignore. Seeded outside the tally effect's
    // reactive scope by the scheduleReseed body below.
    s = liveSignal(null, `vote:poll:${pollId}:user:${userId}`, {
      persist: false,
      canWrite: voteCanWrite(pollId, userId, live),
    });
    slots.set(userId, s);
    return s;
  }

  function scheduleReseed() {
    let added = 0;
    for (const [name] of live.list(`vote:poll:${pollId}:user:`)) {
      const userId = name.slice(`vote:poll:${pollId}:user:`.length);
      if (userId !== '' && !slots.has(userId)) {
        ensureSlot(userId);
        added += 1;
      }
    }
    if (added > 0) {
      slotsVersion.set(v => v + 1);
    }
  }

  scheduleReseed();
  const reseedTimer = setInterval(scheduleReseed, 500);
  if (typeof reseedTimer.unref === 'function') { reseedTimer.unref(); }

  const tallyEffect = effect(() => {
    slotsVersion.get();                              // re-run when new slots are added
    const m = meta.value;                            // .value: meta changes don't drive the tally
    if (m === null) { return; }
    const counts = Object.fromEntries(m.options.map(o => [o, 0]));
    let voters = 0;
    for (const s of slots.values()) {
      const v = s.get();                             // subscribes the effect to each slot
      if (v !== null && v in counts) {
        counts[v] += 1;
        voters += 1;
      }
    }
    live.set(`tally:poll:${pollId}`, { counts, voters, lamport: Date.now() }, { persist: true });
  });

  return {
    stop() {
      clearInterval(reseedTimer);
      tallyEffect.stop();
      for (const s of slots.values()) { s.stop(); }
    },
  };
}
```

The `voteCanWrite` predicate reads `live.get('poll:${pollId}:meta').state` inside its body. That's the documented "canWrite reads other live state" pattern (see `agent-docs/live-signals.md` → "canRead / canWrite"). Synchronous, no cycle, no warning.

**On disconnect, use `live.set(slot, null)` not `live.delete(slot)`.** The tally effect's cached `Signal` would otherwise keep the slot's last value and undercount the drop. `live.delete` is registry cleanup, not a value transition; reactive aggregators need the `set(null)` for the change to flow through.

```js
// onSocketClose body. Clear every slot owned by the departing user.
onSocketClose: ctx => {
  if (ctx === null || ctx.userId === '') { return; }
  for (const [name] of live.list('vote:poll:')) {
    if (name.endsWith(`:user:${ctx.userId}`)) {
      live.set(name, null);                          // not delete: subscribers need the transition
    }
  }
},
```

The `slots` Map holds a Signal for every discovered user across the process lifetime. On long-running servers with high turnover, the Map grows. For most apps the leak is negligible; if it matters, drop the Signal from the Map when its value goes null AND no new vote arrives within a grace period (a separate timer per slot, fired from the tally effect's null-branch).

**When to pick reactive vs polled.** Reactive when individual writes must produce near-immediate downstream updates (vote tallies, score boards, in-play game state). Polled when batched eventual consistency is fine (presence rosters, "currently typing" indicators, online counts). The polled shape is simpler and harder to get wrong. Pick reactive only if the latency budget demands it.
