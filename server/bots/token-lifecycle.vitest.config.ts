/** @fileoverview Изолированные проверки изменения авторизации токена без внешних сервисов. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  resolve: { alias: { '@shared': path.resolve('shared') } },
  test: { environment: 'node', include: ['server/bots/token-lifecycle.test.ts', 'server/bots/token-replacement.test.ts', 'server/bots/runtime-token-unauthorized.test.ts', 'server/bots/worker-exit-authorization.test.ts', 'server/bots/runtime-token-frozen.test.ts'] },
});
