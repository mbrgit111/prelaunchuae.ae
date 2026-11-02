import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      '@/': `${path.resolve(__dirname, 'src')}/`,
      '@sites/': `${path.resolve(__dirname, 'sites')}/`,
      // "server-only" throws outside the Next.js server on purpose; tests are server code.
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
  // The project list comes from the saved files in data/, never from the live API (the site reads the API while running).
  test: { include: ['tests/**/*.test.{ts,tsx}'], environment: 'node', env: { CATALOGUE_SOURCE: 'files' } },
});
