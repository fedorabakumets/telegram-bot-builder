/**
 * @fileoverview Конфигурация Vitest для тестирования lib/templates (Node.js окружение)
 * @module vitest.lib.config
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['lib/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules/**'],
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
