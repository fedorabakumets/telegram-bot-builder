/**
 * @fileoverview Конфигурация Vitest для тестирования компонентов
 * @module vitest.config
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './client/components/editor/database/dialog/tests/setup-tests.ts',
      './client/utils/tests/setup-tests.ts'
    ],
    include: ['client/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['client/components/editor/**'],
      exclude: ['client/components/editor/**/tests/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'client'),
      '@lib': path.resolve(process.cwd(), 'lib'),
      '@shared': path.resolve(process.cwd(), 'shared'),
      '@assets': path.resolve(process.cwd(), 'attached_assets'),
    },
  },
});
