import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WARMUP = 3;
const ITERS = 10;

const SCENARIOS = ['encode-heavy', 'indent-heavy', 'attribute-heavy', 'validation-heavy'];

const scenario = process.argv[2];

if (scenario) {
  const { default: Kensington } = await import('./esm/kensington.js');

  const fns = {
    'attribute-heavy': () => {
      const k = new Kensington({ indentationLevel: 0, validationLevel: 'off' });
      k.div(
        Array.from({ length: 30_000 }, (_, i) =>
          k.div({
            id: `el-${i}`,
            ariaLabel: `item ${i}`,
            class: 'a b c',
            dataIndex: i,
            dataSrc: `https://example.com/${i}`,
            tabindex: i % 10,
          }, i),
        ),
      ).toString();
    },

    'encode-heavy': () => {
      const k = new Kensington({ indentationLevel: 0, validationLevel: 'off' });
      k.div(
        Array.from({ length: 50_000 }, (_, i) =>
          k.span({ title: `<item ${i} & "x">` }, `value < ${i} > 0`),
        ),
      ).toString();
    },

    'indent-heavy': () => {
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

    'validation-heavy': () => {
      const k = new Kensington({ indentationLevel: 0, validationLevel: 'error' });
      k.div(
        Array.from({ length: 30_000 }, (_, i) =>
          k.div({ id: `item-${i}`, class: 'item' },
            k.span(String(i)),
          ),
        ),
      ).toString();
    },
  };

  const fn = fns[scenario];
  if (!fn) {
    console.error(`Unknown scenario: ${scenario}`);
    process.exit(1);
  }

  for (let i = 0; i < WARMUP; i++) {
    fn();
  }

  const times = [];
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    fn();
    times.push(performance.now() - t);
  }

  times.sort((a, b) => a - b);
  const mean = times.reduce((a, b) => a + b) / times.length;
  const median = times[Math.floor(times.length / 2)];
  process.stdout.write(`${JSON.stringify({ max: times[times.length - 1], mean, median, min: times[0] })}\n`);
} else {
  const self = fileURLToPath(import.meta.url);

  const results = [];
  for (const name of SCENARIOS) {
    process.stdout.write(`  running ${name}...`);
    const { status, stderr, stdout } = spawnSync(process.execPath, [self, name], { encoding: 'utf8' });
    if (status !== 0) {
      process.stdout.write('\n');
      console.error(stderr);
      process.exit(1);
    }
    const data = JSON.parse(stdout.trim());
    results.push({ name, ...data });
    process.stdout.write(' done\n');
  }

  const fmt = n => `${n.toFixed(1)}ms`;
  const nameW = Math.max(...results.map(r => r.name.length), 'scenario'.length);
  const numW = 9;
  const pad = (s, w) => String(s).padStart(w);

  const header = `${'scenario'.padEnd(nameW)}  ${pad('mean', numW)}  ${pad('median', numW)}  ${pad('min', numW)}  ${pad('max', numW)}`;
  const rule = '─'.repeat(header.length);

  console.log(`\n${rule}`);
  console.log(header);
  console.log(rule);
  for (const r of results) {
    console.log(`${r.name.padEnd(nameW)}  ${pad(fmt(r.mean), numW)}  ${pad(fmt(r.median), numW)}  ${pad(fmt(r.min), numW)}  ${pad(fmt(r.max), numW)}`);
  }
  console.log(`${rule}\n`);
}
