/** @fileoverview Изолированные проверки диагностики и восстановления после завершения общего обработчика. */
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  resolve: { alias: { '@shared': path.resolve('shared') } },
  test: { environment: 'node', include: ['server/bots/workerExitDiagnostic.test.ts',
    'server/bots/worker-exit-recovery.test.ts', 'server/bots/worker-exit-authorization.test.ts',
    'server/bots/worker-polling-failure.integration.test.ts'] },
});
