/** @fileoverview Изолированная проверка чтения общей истории без отправок и подключения базы. */
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
export default defineConfig({ resolve: { alias: { '@shared': resolve(process.cwd(), 'shared') } }, test: { environment: 'node', include: [
  'server/routes/dialogs/user-history-all-bots.test.ts',
  'server/routes/botIntegration/handlers/messages/get-messages-all-bots.test.ts',
  'server/routes/botIntegration/handlers/messages/get-message-context-all-bots.test.ts',
] } });
