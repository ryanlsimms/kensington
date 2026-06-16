# vite-hmr

Minimal example of `kensington/vite`. Component HMR with no SSR, no extra packages.

```sh
npm install
npm run dev
```

Open the URL Vite prints. Try the steps in the comment at the top of `src/counter.js`:

1. Click the button a few times, then change the label string. The count stays. Keyed signal (`signal(start, 'n')`).
2. Type into the input, then change a sibling element or its `placeholder`. Your text, focus, and cursor position all survive. Native DOM state preservation (`preserve-state.js`).
3. Add a new element (e.g. `t.p('hello')`) into the array. It appears with no page reload.

## What's wired up

- `vite.config.js` adds `kensingtonHmr({ include: 'src/**/*.js' })`.
- `src/counter.js` exports a default function. The plugin wraps it through `__kInstrument` on dev-server load.
- `main.js` mounts the component the normal way (`counter().toElement()`). No HMR code in user-land.
- `acorn` and `magic-string` are dev dependencies. They are optional peers of `kensington` itself.

## What's NOT in this example

- No SSR. For server-rendered Kensington apps with view morph and CSS HMR on top, see [kensington-dev-server](https://github.com/ryanlsimms/kensington-dev-server).
- No state-preservation showcase beyond the keyed signal. Focus, scroll, and input values also survive but a counter button doesn't exercise them.
