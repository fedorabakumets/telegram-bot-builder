/** @fileoverview Конфигурация узких тестов маршрутов проекта. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  root: __dirname,
  test: { environment: 'node', include: ['exportProjectArchive.test.ts', 'adminIdsHandler.test.ts'] },
  resolve: { alias: { '@shared': path.resolve(__dirname, '../../../../shared') } },
});
