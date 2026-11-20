/** @fileoverview Изолированные проверки наследования способа запуска. */

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@shared': fileURLToPath(new URL('../../../shared', import.meta.url)) } },
  test: {
    environment: 'node',
    include: [
      'server/bots/runtimeModeInheritance.test.ts',
      'server/bots/adoptProjectLaunchMode.test.ts',
      'server/database/cleanupOldMessages.test.ts',
      'server/routes/botManagement/handlers/botLaunchInheritanceHandler.test.ts',
      'server/routes/botManagement/handlers/projectLaunchDefaultHandler.test.ts',
      'server/routes/botManagement/handlers/projectRuntimeDefaultsHandler.test.ts',
      'server/routes/botManagement/handlers/projectBotSettingDefaultsHandler.test.ts',
      'shared/bot-launch-mode.test.ts',
      'shared/bot-execution-settings.test.ts',
      'shared/bot-inherited-settings.test.ts',
    ],
  },
});
