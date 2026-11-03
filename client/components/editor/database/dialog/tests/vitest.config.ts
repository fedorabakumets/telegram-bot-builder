/**
 * @fileoverview Локальная конфигурация Vitest для тестов dialog
 * @module tests/vitest.config
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, 'setup-tests.ts')],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../../../..'),
      '@lib': path.resolve(__dirname, '../../../../../../lib'),
      '@shared': path.resolve(__dirname, '../../../../../../shared'),
      '@assets': path.resolve(__dirname, '../../../../../../attached_assets'),
    },
  },
});
