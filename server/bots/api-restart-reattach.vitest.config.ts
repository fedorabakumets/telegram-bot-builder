/**
 * @fileoverview Узкая конфигурация проверки переподключения API.
 * @module server/bots/api-restart-reattach.vitest.config
 */
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: { alias: { '@shared': resolve(process.cwd(), 'shared'), '@lib': resolve(process.cwd(), 'lib') } },
  test: { environment: 'node', include: ['server/bots/api-restart-reattach.test.ts'] },
});
