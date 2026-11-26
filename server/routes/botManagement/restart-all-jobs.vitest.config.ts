/** @fileoverview Изолированный запуск регрессий фонового перезапуска без БД и Telegram. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node',
  include: ['server/routes/botManagement/restart-all-jobs.test.ts'] } });
