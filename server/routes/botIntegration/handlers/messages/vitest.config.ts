/** @fileoverview Изолированная проверка редактирования сообщения без подключения внешних сервисов. */
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/routes/botIntegration/handlers/messages/edit-single-*.test.ts'],
  },
  resolve: { alias: { '@shared': resolve(process.cwd(), 'shared') } },
});
