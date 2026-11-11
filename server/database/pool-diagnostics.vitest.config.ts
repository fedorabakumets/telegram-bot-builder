/** @fileoverview Адресный запуск проверок диагностики выдачи и возврата клиентов PostgreSQL. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: [
  'server/database/pool-diagnostics.test.ts', 'server/database/pool-resilience.test.ts',
] } });
