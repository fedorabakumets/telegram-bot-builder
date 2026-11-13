/** @fileoverview Адресная конфигурация проверки безопасного раскрытия секрета вебхука. */
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
export default defineConfig({
  resolve: { alias: { '@shared': resolve(process.cwd(), 'shared') } },
  test: { environment: 'node', include: ['server/routes/botTokens/reveal-webhook-secret.test.ts'] },
});
