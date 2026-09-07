import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import he from '../esm/lib/util/he.js';

const WARMUP = 3;
const ITERS = 10;
const REACTIVE_WRITES = 20_000;

const scenario = process.argv[2];
const isBaseline = process.argv[3] === 'baseline';
const isDomScenario = scenario?.startsWith('reactiveDom') === true;

function fmt(n) {
  return `${n.toFixed(1)}ms`;
}

function pad(s, w) {
  return String(s).padStart(w);
}

if (isDomScenario) {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  globalThis.document = dom.window.document;
  globalThis.MutationObserver = dom.window.MutationObserver;
}

const { default: Kensington } = (scenario && !isBaseline) ? await import('../esm/kensington.js') : {};
const reactive = (scenario?.startsWith('reactive') && !isBaseline)
  ? await import('../esm/reactive.js')
  : {};

function assertBench(condition, message) {
  if (!condition) { throw new Error(`benchmark assertion failed: ${message}`); }
}

const fns = {
  encodeHeavy() {
    const k = new Kensington({ indentationLevel: 0, validationLevel: 'off' });
    k.div(
      Array.from({ length: 50_000 }, (_, i) =>
        k.span({ title: `<item ${i} & "x">` }, `value < ${i} > 0`),
      ),
    ).toString();
  },

  indentHeavy() {
    const k = new Kensington({ indentationLevel: 2, validationLevel: 'off' });
    k.div(
      Array.from({ length: 20_000 }, (_, i) =>
        k.div({ class: 'outer' },
          k.div({ class: 'middle' },
            k.span(String(i)),
          ),
        ),
      ),
    ).toString();
  },

  attributeHeavy() {
    const k = new Kensington({ indentationLevel: 0, validationLevel: 'off' });
    k.div(
      Array.from({ length: 30_000 }, (_, i) =>
        k.div({
          id: `el-${i}`,
          class: 'a b c',
          dataSrc: `https://example.com/${i}`,
          dataIndex: i,
          ariaLabel: `item ${i}`,
          tabindex: i % 10,
        }, i),
      ),
    ).toString();
  },

  validationHeavy() {
    const k = new Kensington({ indentationLevel: 0, validationLevel: 'error' });
    k.div(
      Array.from({ length: 30_000 }, (_, i) =>
        k.div({ class: 'item', id: `item-${i}` },
          k.span(String(i)),
        ),
      ),
    ).toString();
  },

  // Targets camelToKebab: validationLevel 'off' means allowedAttributes is empty,
  // so every attribute name goes through camelToKebab on every call. The same 4
  // camelCase names repeat across all 50k elements — a memoized version hits the
  // cache after the first element.
  camelToKebab() {
    const k = new Kensington({ indentationLevel: 0, validationLevel: 'off' });
    k.div(
      Array.from({ length: 50_000 }, () =>
        k.span({
          dataBsToggle: 'collapse',
          dataBsTarget: '#panel',
          ariaExpanded: 'false',
          ariaControls: 'panel',
        }),
      ),
    ).toString();
  },

  // Targets allowedAttributeMap construction per element. validationLevel 'error'
  // populates the map with global attrs. Using only standard lowercase attrs means
  // camelToKebab is never called, isolating the map lookup overhead.
  globalAttrs() {
    const k = new Kensington({ indentationLevel: 0, validationLevel: 'error' });
    k.div(
      Array.from({ length: 50_000 }, (_, i) =>
        k.span({ class: 'item', id: `item-${i}`, tabindex: i % 10, title: 'x' }),
      ),
    ).toString();
  },

  reactiveUnbatched() {
    const source = reactive.signal(0);
    let seen = -1;
    let effectRuns = 0;
    const fx = reactive.effect(() => {
      seen = source.get();
      effectRuns++;
    });
    for (let i = 1; i <= REACTIVE_WRITES; i++) { source.set(i); }
    assertBench(seen === REACTIVE_WRITES, 'unbatched effect must see the final value');
    assertBench(effectRuns === REACTIVE_WRITES + 1, 'unbatched effect must run for every write');
    fx.stop();
  },

  reactiveBatched() {
    const source = reactive.signal(0);
    let seen = -1;
    let effectRuns = 0;
    const fx = reactive.effect(() => {
      seen = source.get();
      effectRuns++;
    });
    reactive.batch(() => {
      for (let i = 1; i <= REACTIVE_WRITES; i++) { source.set(i); }
    });
    assertBench(seen === REACTIVE_WRITES, 'batched effect must see the final value');
    assertBench(effectRuns === 2, 'batched effect must run once at the boundary');
    fx.stop();
  },

  reactiveComputedBatch() {
    const a = reactive.signal(0);
    const b = reactive.signal(0);
    let computedRuns = 0;
    let effectRuns = 0;
    const total = reactive.computed(() => {
      computedRuns++;
      return a.get() + b.get();
    });
    const fx = reactive.effect(() => {
      total.get();
      effectRuns++;
    });
    reactive.batch(() => {
      for (let i = 1; i <= REACTIVE_WRITES / 2; i++) {
        a.set(i);
        b.set(i);
      }
    });
    assertBench(computedRuns === REACTIVE_WRITES + 1, 'computed must run after every source write');
    assertBench(effectRuns === 2, 'computed consumer must commit once at the batch boundary');
    fx.stop();
    total.stop();
  },

  reactiveDiamond() {
    const source = reactive.signal(0);
    const plusOne = reactive.computed(() => source.get() + 1);
    const timesTwo = reactive.computed(() => source.get() * 2);
    let seen = -1;
    let effectRuns = 0;
    const fx = reactive.effect(() => {
      seen = plusOne.get() + timesTwo.get();
      effectRuns++;
    });
    for (let i = 1; i <= REACTIVE_WRITES; i++) { source.set(i); }
    assertBench(seen === REACTIVE_WRITES * 3 + 1, 'diamond effect must see both final computed values');
    assertBench(effectRuns === REACTIVE_WRITES + 1, 'diamond effect must run once per source write');
    fx.stop();
    plusOne.stop();
    timesTwo.stop();
  },

  reactiveDomUnbatched() {
    document.body.textContent = '';
    const k = new Kensington({ validationLevel: 'off' });
    const value = reactive.signal(0);
    const el = k.div({ dataValue: value }).toElement();
    document.body.append(el);
    for (let i = 1; i <= REACTIVE_WRITES; i++) { value.set(i); }
    assertBench(el.dataset.value === String(REACTIVE_WRITES), 'unbatched DOM binding must stay current');
    value.stop();
    el.remove();
  },

  reactiveDomBatched() {
    document.body.textContent = '';
    const k = new Kensington({ validationLevel: 'off' });
    const value = reactive.signal(0);
    const el = k.div({ dataValue: value }).toElement();
    document.body.append(el);
    reactive.batch(() => {
      for (let i = 1; i <= REACTIVE_WRITES; i++) { value.set(i); }
    });
    assertBench(el.dataset.value === String(REACTIVE_WRITES), 'batched DOM binding must commit the final value');
    value.stop();
    el.remove();
  },

};

const baselines = {
  encodeHeavy() {
    const titlePrefix = '<item';
    const titleSuffix = '& "x">';
    const contentPrefix = 'value <';
    const contentSuffix = '> 0';
    const spans = Array.from({ length: 50_000 }, (_, i) =>
      `<span title="${he.encode(`${titlePrefix} ${i} ${titleSuffix}`)}">${he.encode(`${contentPrefix} ${i} ${contentSuffix}`)}</span>`,
    ).join('');
    `<div>${spans}</div>`;
  },

  indentHeavy() {
    const outerClass = 'outer';
    const middleClass = 'middle';
    const rows = Array.from({ length: 20_000 }, (_, i) =>
      `  <div class="${outerClass}">\n    <div class="${middleClass}">\n      <span>${i}</span>\n    </div>\n  </div>`,
    ).join('\n');
    `<div>\n${rows}\n</div>`;
  },

  attributeHeavy() {
    const cls = 'a b c';
    const baseUrl = 'https://example.com/';
    const divs = Array.from({ length: 30_000 }, (_, i) =>
      `<div id="el-${i}" class="${cls}" data-src="${baseUrl}${i}" data-index="${i}" aria-label="item ${i}" tabindex="${i % 10}">${i}</div>`,
    ).join('');
    `<div>${divs}</div>`;
  },

  validationHeavy() {
    const cls = 'item';
    const items = Array.from({ length: 30_000 }, (_, i) =>
      `<div class="${cls}" id="item-${i}"><span>${i}</span></div>`,
    ).join('');
    `<div>${items}</div>`;
  },

  camelToKebab() {
    const toggle = 'collapse';
    const target = '#panel';
    const expanded = 'false';
    const controls = 'panel';
    const spans = Array.from({ length: 50_000 }, () =>
      `<span data-bs-toggle="${toggle}" data-bs-target="${target}" aria-expanded="${expanded}" aria-controls="${controls}"></span>`,
    ).join('');
    `<div>${spans}</div>`;
  },

  globalAttrs() {
    const cls = 'item';
    const title = 'x';
    const spans = Array.from({ length: 50_000 }, (_, i) =>
      `<span class="${cls}" id="item-${i}" tabindex="${i % 10}" title="${title}"></span>`,
    ).join('');
    `<div>${spans}</div>`;
  },

  reactiveUnbatched() {
    let source = 0;
    let seen = -1;
    let effectRuns = 0;
    const effect = () => { seen = source; effectRuns++; };
    effect();
    for (let i = 1; i <= REACTIVE_WRITES; i++) {
      source = i;
      effect();
    }
    assertBench(seen === REACTIVE_WRITES, 'baseline unbatched effect must see the final value');
    assertBench(effectRuns === REACTIVE_WRITES + 1, 'baseline unbatched effect count');
  },

  reactiveBatched() {
    let source = 0;
    let seen = -1;
    let effectRuns = 0;
    const effect = () => { seen = source; effectRuns++; };
    effect();
    for (let i = 1; i <= REACTIVE_WRITES; i++) { source = i; }
    effect();
    assertBench(seen === REACTIVE_WRITES, 'baseline batched effect must see the final value');
    assertBench(effectRuns === 2, 'baseline batched effect count');
  },

  reactiveComputedBatch() {
    let a;
    let b = 0;
    let total = 0;
    let checksum = 0;
    let computedRuns = 1;
    let effectRuns = 1;
    for (let i = 1; i <= REACTIVE_WRITES / 2; i++) {
      a = i;
      total = a + b;
      checksum += total;
      computedRuns++;
      b = i;
      total = a + b;
      checksum += total;
      computedRuns++;
    }
    effectRuns++;
    assertBench(total === REACTIVE_WRITES, 'baseline computed must see the final value');
    assertBench(checksum > total, 'baseline computed must consume intermediate values');
    assertBench(computedRuns === REACTIVE_WRITES + 1, 'baseline computed count');
    assertBench(effectRuns === 2, 'baseline computed consumer count');
  },

  reactiveDiamond() {
    let seen = 1;
    let effectRuns = 1;
    for (let i = 1; i <= REACTIVE_WRITES; i++) {
      const plusOne = i + 1;
      const timesTwo = i * 2;
      seen = plusOne + timesTwo;
      effectRuns++;
    }
    assertBench(seen === REACTIVE_WRITES * 3 + 1, 'baseline diamond must see the final value');
    assertBench(effectRuns === REACTIVE_WRITES + 1, 'baseline diamond effect count');
  },

  reactiveDomUnbatched() {
    document.body.textContent = '';
    const el = document.createElement('div');
    document.body.append(el);
    for (let i = 1; i <= REACTIVE_WRITES; i++) { el.setAttribute('data-value', String(i)); }
    assertBench(el.dataset.value === String(REACTIVE_WRITES), 'baseline unbatched DOM value');
    el.remove();
  },

  reactiveDomBatched() {
    document.body.textContent = '';
    const el = document.createElement('div');
    document.body.append(el);
    let value = 0;
    for (let i = 1; i <= REACTIVE_WRITES; i++) { value = i; }
    el.setAttribute('data-value', String(value));
    assertBench(el.dataset.value === String(REACTIVE_WRITES), 'baseline batched DOM value');
    el.remove();
  },

};

if (scenario) {
  const fn = isBaseline ? baselines[scenario] : fns[scenario];
  if (!fn) {
    console.error(`Unknown scenario: ${scenario}`);
    process.exit(1);
  }

  for (let i = 0; i < WARMUP; i++) {
    await fn();
  }

  const times = [];
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    await fn();
    times.push(performance.now() - t);
  }

  times.sort((a, b) => a - b);
  const mean = times.reduce((a, b) => a + b) / times.length;
  const median = times[Math.floor(times.length / 2)];
  process.stdout.write(`${JSON.stringify({ mean, median, min: times[0], max: times[times.length - 1] }) }\n`);
} else {
  const self = fileURLToPath(import.meta.url);

  const results = [];
  for (const name of Object.keys(fns)) {
    process.stdout.write(`  running ${name}...`);

    const {
      stdout: kOut,
      stderr: kErr,
      status: kStatus,
    } = spawnSync(process.execPath, [self, name], { encoding: 'utf8' });
    if (kStatus !== 0) {
      process.stdout.write('\n');
      console.error(kErr);
      process.exit(1);
    }

    const {
      stdout: siOut,
      stderr: siErr,
      status: siStatus,
    } = spawnSync(process.execPath, [self, name, 'baseline'], { encoding: 'utf8' });
    if (siStatus !== 0) {
      process.stdout.write('\n');
      console.error(siErr);
      process.exit(1);
    }

    const k = JSON.parse(kOut.trim());
    const si = JSON.parse(siOut.trim());
    results.push({ name, ...k, siMedian: si.median });
    process.stdout.write(' done\n');
  }

  const nameW = Math.max(...results.map(r => r.name.length), 'scenario'.length);
  const numW = 9;
  const ratioW = 7;

  const header = `${'scenario'.padEnd(nameW)}  ${pad('mean', numW)}  ${pad('median', numW)}  ${pad('min', numW)}  ${pad('max', numW)}  ${pad('baseline', numW)}  ${pad('ratio', ratioW)}`;
  const rule = '─'.repeat(header.length);

  console.log(`\n${ rule}`);
  console.log(header);
  console.log(rule);
  for (const r of results) {
    const ratio = `${(r.median / r.siMedian).toFixed(1)}x`;
    console.log(`${r.name.padEnd(nameW)}  ${pad(fmt(r.mean), numW)}  ${pad(fmt(r.median), numW)}  ${pad(fmt(r.min), numW)}  ${pad(fmt(r.max), numW)}  ${pad(fmt(r.siMedian), numW)}  ${pad(ratio, ratioW)}`);
  }
  console.log(`${rule }\n`);
}
