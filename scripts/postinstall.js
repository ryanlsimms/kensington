import { existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

// only run inside the repo, not when installed as a dependency
if (!existsSync(join(root, '.git'))) {
  process.exit(0);
}

const links = [
  { dir: 'tests/esm/node_modules', target: '../../..' },
  { dir: 'tests/cjs/node_modules', target: '../../..' },
  { dir: 'tests/typescript/node_modules', target: '../../..' },
  { dir: 'examples/kitchen-sink/node_modules', target: '../../..' },
];

for (const { dir, target } of links) {
  const linkPath = join(root, dir, 'kensington');
  if (!existsSync(linkPath)) {
    mkdirSync(join(root, dir), { recursive: true });
    symlinkSync(target, linkPath);
    console.log(`created symlink: ${dir}/kensington`);
  }
}
