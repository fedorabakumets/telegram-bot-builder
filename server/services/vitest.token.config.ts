/** @fileoverview Изолированная конфигурация проверки API недействительных токенов. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  test: { environment: 'node', include: ['server/services/bot-token-fetch.test.ts', 'server/routes/auth/telegram-bot-username.test.ts'] },
  resolve: { alias: { '@shared': path.resolve(process.cwd(), 'shared') } },
});
