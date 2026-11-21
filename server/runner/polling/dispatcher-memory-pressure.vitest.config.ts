/** @fileoverview Адресная проверка завершения по памяти без запуска Python и БД. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node',
  include: ['server/runner/polling/dispatcher-memory-pressure.test.ts'] } });
