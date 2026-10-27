import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    // Tests never read .env — they get fixed, fake values here instead.
    env: {
      JWT_SECRET: 'test-secret',
      NODE_ENV: 'test',
    },
    // The first run downloads a MongoDB binary (~100 MB), which can be slow.
    hookTimeout: 120_000,
  },
});
