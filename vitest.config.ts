import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // 使用不同環境：backend 用 node，frontend 用 jsdom
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: [
      '**/__tests__/**/*.test.{js,ts,tsx}',
      'components/__tests__/**/*.test.{tsx,ts}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.config.{js,ts}',
        '**/dist/**',
      ],
    },
    testTimeout: 10000,
    // 針對 backend tests 使用 node 環境
    environmentMatchGlobs: [
      ['backend/**/*.test.{js,ts}', 'node'],
    ],
  },
});
