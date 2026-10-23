import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', seed: 'src/seed.ts' },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: false,
  // Mark prisma client as external — it has its own runtime resolution
  external: ['@prisma/client', '.prisma/client'],
});
