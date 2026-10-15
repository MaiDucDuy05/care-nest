import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    '@nestjs/*',
    '@prisma/client',
    'passport',
    'passport-jwt',
    'reflect-metadata',
    'rxjs',
  ],
});
