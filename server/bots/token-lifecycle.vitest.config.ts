/** @fileoverview Изолированные проверки изменения авторизации токена без внешних сервисов. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  resolve: { alias: { '@shared': path.resolve('shared') } },
  test: { environment: 'node', include: ['server/bots/token-lifecycle.test.ts', 'server/bots/token-replacement.test.ts'] },
});
