/**
 * @fileoverview Конфигурация Vitest для тестов sidebar
 * @module sidebar/tests/vitest.config
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./setup-tests.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['../../**'],
      exclude: ['tests/**', 'node_modules/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../../../..'),
      '@shared': path.resolve(__dirname, '../../../../../../../shared'),
      '@lib': path.resolve(__dirname, '../../../../../../../lib'),
      '@assets': path.resolve(__dirname, '../../../../../../../attached_assets'),
    },
  },
});
