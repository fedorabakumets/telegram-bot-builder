/** @fileoverview Адресная проверка пакетного перезапуска и его прогресса. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['server/bots/restart-all-*.test.ts'] },
});
