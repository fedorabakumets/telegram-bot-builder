/** @fileoverview Изолированные серверные тесты аналитики без браузерной подмены fetch. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';
/** Конфигурация адресных проверок хранения и доставки аналитики. */
export default defineConfig({
  resolve: { alias: { '@shared': path.resolve('shared'), '@': path.resolve('client') } },
  test: { environment: 'node', setupFiles: [], include: ['server/analytics/**/*.test.ts', 'server/routes/analytics/acquisition/*.test.ts'], testTimeout: 30000 },
});
