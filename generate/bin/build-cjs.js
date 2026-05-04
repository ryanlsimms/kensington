import fs from 'node:fs';
import path from 'node:path';

import { rollup } from 'rollup';

const root = path.resolve(import.meta.dirname, '../..');

const result = await rollup({
  input: [path.resolve(root, 'esm/kensington.js')],
  onwarn(warning, warn) {
    if (warning.code === 'MISSING_EXPORT') {return;}
    warn(warning);
  },
});
await result.write({
  dir: path.resolve(root, 'cjs'),
  exports: 'named',
  format: 'cjs',
  generatedCode: {
    constBindings: true,
  },
  preserveModules: true,
});

fs.writeFileSync(path.resolve(root, 'cjs/package.json'), '{\n  "type": "commonjs"\n}\n', 'utf8');

console.log('cjs module written');
