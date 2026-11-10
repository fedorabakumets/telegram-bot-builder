/** @fileoverview Узкая конфигурация проверок списка истории без подключения к рабочей БД. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  root: __dirname,
  test: { environment: 'node', include: ['listProjectVersionsHandler.test.ts'] },
  resolve: { alias: { '@shared': path.resolve(__dirname, '../../../../shared') } },
});
