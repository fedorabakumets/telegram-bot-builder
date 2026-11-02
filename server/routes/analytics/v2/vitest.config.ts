/** @fileoverview Изолированные Node-тесты новой аналитики без клиентского mock fetch. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  test: { environment: 'node', include: ['server/routes/analytics/v2/**/*.test.ts', 'server/database/analytics-v2/**/*.test.ts'], testTimeout: 20000, hookTimeout: 20000 },
  resolve: { alias: { '@shared': path.resolve(process.cwd(), 'shared') } },
});
