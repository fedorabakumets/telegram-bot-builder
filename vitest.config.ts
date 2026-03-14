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
    setupFiles: ['./client/components/editor/database/dialog/tests/setup-tests.ts'],
    include: ['client/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['client/components/editor/database/dialog/**'],
      exclude: ['client/components/editor/database/dialog/tests/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'client'),
      '@shared': path.resolve(process.cwd(), 'shared'),
      '@assets': path.resolve(process.cwd(), 'attached_assets'),
    },
  },
});
