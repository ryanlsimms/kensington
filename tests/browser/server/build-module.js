import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default async function buildModule(input) {
  const bundle = await rollup({
    input,
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ requireReturnsDefault: 'auto' }),
    ]
  });
  const { output } = await bundle.generate({ format: 'es' });

  let content = '';
  for (const chunkOrAsset of output) {
    content += chunkOrAsset.code;
  }
  await bundle.close();

  return content;
}
