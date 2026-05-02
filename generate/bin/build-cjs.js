import fs from 'node:fs';
import path from 'node:path';
import { rollup } from 'rollup';

const root = path.resolve(import.meta.dirname, '../..');

const result = await rollup({
  input: [path.resolve(root, 'esm/kensington.js')],
});
await result.write({
  dir: path.resolve(root, 'cjs'),
  format: 'cjs',
  exports: 'named',
  preserveModules: true,
  generatedCode: {
    constBindings: true,
  },
});

fs.writeFileSync(path.resolve(root, 'cjs/package.json'), '{\n  "type": "commonjs"\n}\n', 'utf8');
