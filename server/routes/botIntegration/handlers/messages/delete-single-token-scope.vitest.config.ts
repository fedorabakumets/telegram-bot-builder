/** @fileoverview Изолированная проверка удаления через бота исходного сообщения без внешней сети. */
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: { environment: 'node', include: ['server/routes/botIntegration/handlers/messages/delete-single-token-scope.test.ts'] },
  resolve: { alias: { '@shared': resolve(process.cwd(), 'shared') } },
});
