import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  // Mark prisma client as external — it has its own runtime resolution
  external: ['@prisma/client', '.prisma/client'],
});
