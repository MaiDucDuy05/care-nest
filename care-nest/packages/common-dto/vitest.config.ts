import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['test/**/*.spec.ts'], passWithNoTests: true },
  resolve: {
    // Allow test files to import source via `.js` extension (matches the
    // build-time ESM convention used throughout the workspace).
    alias: [{ find: /^(\.{1,2}\/.+)\.js$/, replacement: '$1' }],
  },
});
