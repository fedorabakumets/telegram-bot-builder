/**
 * @fileoverview Конфигурация Vitest для тестирования компонентов и шаблонов
 * @module vitest.config
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react() as any],
  test: {
    globals: true,
    projects: [
      { extends: true, test: { name: 'client', environment: 'jsdom', include: ['client/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'] } },
      { extends: true, test: { name: 'lib', environment: 'node', include: ['lib/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'] } },
    ],
    setupFiles: [
      './client/components/editor/database/dialog/tests/setup-tests.ts',
      './client/utils/tests/setup-tests.ts'
    ],
    exclude: ['node_modules/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['client/components/editor/**', 'lib/**'],
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
