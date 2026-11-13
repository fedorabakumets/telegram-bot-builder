/** @fileoverview Изолированная конфигурация проверок фактического состояния ботов. */
import { defineConfig } from 'vitest/config';

/** Проверяются статусы без подключения к инфраструктуре. */
export default defineConfig({
  test: { environment: 'node', include: [
    'server/routes/botManagement/resolve-actual-bot-status.test.ts',
    'server/routes/botManagement/handlers/botRestartHandler.test.ts',
    'server/routes/botManagement/handlers/botLaunchHistoryHandler.test.ts',
    'server/routes/botManagement/handlers/botStopHandler.test.ts',
  ] },
});
