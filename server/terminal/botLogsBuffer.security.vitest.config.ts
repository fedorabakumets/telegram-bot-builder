/** @fileoverview Изолированная проверка безопасности форматирования логов без подключения БД. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['server/terminal/botLogsBuffer.security.test.ts'] },
});
